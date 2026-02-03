/**
 * Live Auction Engine
 * 
 * Core bidding engine that manages live auction state, bid validation,
 * and maintains the temp auction ledger as the single source of truth.
 * 
 * RULES ENFORCED:
 * - Slab-based bid increments
 * - No team can bid 3 times consecutively
 * - Jump bids must align with slab increments
 * - Only auctioneer can mutate state
 */

import { fileStore } from './fileStore.js';

// Default bid slabs (prices in crores)
const DEFAULT_BID_SLABS = [
  { maxPrice: 10.0, increment: 0.25 },
  { maxPrice: 20.0, increment: 0.50 },
  { maxPrice: Infinity, increment: 1.0 }
];

// Valid auction states
const LiveAuctionState = {
  IDLE: 'IDLE',
  READY: 'READY',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  SOLD: 'SOLD',
  COMPLETED: 'COMPLETED'
};

// In-memory state (single source of truth during auction)
let currentSession = null;
let currentLedger = null;

// File paths for persistence
const LIVE_SESSION_FILE = 'data/live-auction-session.json';
const AUCTION_HISTORY_FILE = 'data/auction-history.json';
const AUCTION_LEDGERS_FILE = 'data/auction-ledgers.json';

// Undo configuration
const UNDO_TIME_WINDOW = 15000; // 15 seconds to undo

// Auction ledger tracking
let currentAuctionLedger = null;

/**
 * Get increment for a given price based on slab configuration
 */
function getIncrementForPrice(price, slabs = DEFAULT_BID_SLABS) {
  for (const slab of slabs) {
    if (price <= slab.maxPrice) {
      return slab.increment;
    }
  }
  // Fallback to last slab
  return slabs[slabs.length - 1].increment;
}

/**
 * Validate if a bid amount is valid according to slab rules
 */
function isValidBidAmount(amount, slabs = DEFAULT_BID_SLABS) {
  // Find the appropriate slab
  let increment = getIncrementForPrice(amount, slabs);
  
  // Check if amount is cleanly divisible by increment
  // Using epsilon for floating point comparison
  const remainder = amount % increment;
  return remainder < 0.0001 || Math.abs(remainder - increment) < 0.0001;
}

/**
 * Calculate next valid bid amount
 */
function calculateNextBid(currentBid, slabs = DEFAULT_BID_SLABS) {
  const increment = getIncrementForPrice(currentBid, slabs);
  return parseFloat((currentBid + increment).toFixed(2));
}

/**
 * Check if a team can bid (consecutive bid rule: prevents 3 consecutive bids)
 */
function canTeamBid(teamId, ledger) {
  if (!ledger || !ledger.consecutiveBidCount) {
    return true;
  }
  
  const consecutiveCount = ledger.consecutiveBidCount[teamId] || 0;
  return consecutiveCount < 2; // Allows up to 2 consecutive, blocks 3rd
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'bid') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save current session to file (crash recovery)
 */
async function persistSession() {
  try {
    await fileStore.writeJSON(LIVE_SESSION_FILE, {
      session: currentSession,
      ledger: currentLedger,
      savedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to persist session:', err);
  }
}

/**
 * Load session from file (crash recovery)
 */
async function loadPersistedSession() {
  try {
    const data = await fileStore.readJSON(LIVE_SESSION_FILE);
    if (data && data.session) {
      currentSession = data.session;
      currentLedger = data.ledger;
      console.log('✅ Restored live auction session from file');
      return true;
    }
  } catch (err) {
    // No persisted session
  }
  return false;
}

/**
 * Clear persisted session file
 */
async function clearPersistedSession() {
  try {
    await fileStore.writeJSON(LIVE_SESSION_FILE, null);
  } catch (err) {
    console.error('Failed to clear persisted session:', err);
  }
}

// ============================================
// AUCTION LEDGER MANAGEMENT
// ============================================

/**
 * Initialize auction ledger when session starts
 */
async function initializeAuctionLedger(auctionId, sport, auctionName, auctioneerId, auctioneerName) {
  currentAuctionLedger = {
    auctionId,
    sport,
    auctionName,
    auctioneerId,
    auctioneerName,
    status: 'IN_PROGRESS',
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalDuration: null,
    playerResults: [],
    currentStats: {
      playersAuctioned: 0,
      totalPlayers: 0,
      totalSpent: 0,
      averagePrice: 0,
      highestSale: 0,
      teamSpending: {}
    }
  };
  
  await saveAuctionLedger();
}

/**
 * Add player result to ledger
 */
async function addPlayerResult(playerId, playerName, status, basePrice, finalPrice = null, winningTeam = null, bidHistory = [], auctionDuration = null) {
  if (!currentAuctionLedger) return;

  const result = {
    playerId,
    playerName,
    auctionOrder: currentAuctionLedger.playerResults.length + 1,
    status, // 'SOLD' or 'UNSOLD'
    basePrice,
    finalPrice,
    winningTeam,
    bidHistory,
    totalBids: bidHistory.length,
    auctionDuration
  };

  currentAuctionLedger.playerResults.push(result);

  // Update stats
  currentAuctionLedger.currentStats.playersAuctioned++;
  if (status === 'SOLD' && finalPrice) {
    currentAuctionLedger.currentStats.totalSpent += finalPrice;
    currentAuctionLedger.currentStats.averagePrice = currentAuctionLedger.currentStats.totalSpent / currentAuctionLedger.currentStats.playersAuctioned;
    
    if (finalPrice > currentAuctionLedger.currentStats.highestSale) {
      currentAuctionLedger.currentStats.highestSale = finalPrice;
    }

    // Update team spending
    if (winningTeam?.teamId) {
      currentAuctionLedger.currentStats.teamSpending[winningTeam.teamId] = 
        (currentAuctionLedger.currentStats.teamSpending[winningTeam.teamId] || 0) + finalPrice;
    }
  }

  await saveAuctionLedger();
}

/**
 * Complete auction ledger and save to history
 */
async function completeAuctionLedger() {
  if (!currentAuctionLedger) return;

  currentAuctionLedger.status = 'COMPLETED';
  currentAuctionLedger.completedAt = new Date().toISOString();
  
  const startTime = new Date(currentAuctionLedger.startedAt);
  const endTime = new Date(currentAuctionLedger.completedAt);
  currentAuctionLedger.totalDuration = Math.round((endTime - startTime) / 1000); // seconds

  await saveAuctionLedger();
  
  // Archive to history
  await archiveCompletedLedger();
}

/**
 * Save current ledger to file
 */
async function saveAuctionLedger() {
  try {
    let ledgers = [];
    try {
      ledgers = await fileStore.readJSON(AUCTION_LEDGERS_FILE);
    } catch (err) {
      // File doesn't exist yet
    }

    // Update or add current ledger
    const existingIndex = ledgers.findIndex(l => l.auctionId === currentAuctionLedger.auctionId);
    if (existingIndex >= 0) {
      ledgers[existingIndex] = currentAuctionLedger;
    } else {
      ledgers.push(currentAuctionLedger);
    }

    await fileStore.writeJSON(AUCTION_LEDGERS_FILE, ledgers);
  } catch (err) {
    console.error('Failed to save auction ledger:', err);
  }
}

/**
 * Archive completed ledger and clean up
 */
async function archiveCompletedLedger() {
  try {
    let history = [];
    try {
      history = await fileStore.readJSON(AUCTION_HISTORY_FILE);
    } catch (err) {
      // File doesn't exist yet
    }

    history.push({ ...currentAuctionLedger });
    await fileStore.writeJSON(AUCTION_HISTORY_FILE, history);
    
    // Clear current ledger
    currentAuctionLedger = null;
  } catch (err) {
    console.error('Failed to archive auction ledger:', err);
  }
}

// ============================================
// PUBLIC API
// ============================================

const liveAuctionEngine = {
  /**
   * Initialize engine (call on server start)
   */
  async initialize() {
    await loadPersistedSession();
    console.log('🎯 Live Auction Engine initialized');
  },

  /**
   * Undo the last bid (strict conditions)
   */
  async undoLastBid(auctioneerId) {
    // Must have active session and bidding in progress
    if (!currentSession || !currentLedger) {
      return { success: false, error: 'No active auction session.' };
    }
    
    // Only auctioneer can undo
    if (currentSession.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Only the auctioneer can undo bids.' };
    }
    
    // Must be in LIVE or PAUSED state
    if (![LiveAuctionState.LIVE, LiveAuctionState.PAUSED].includes(currentLedger.state)) {
      return { success: false, error: 'Can only undo during active bidding.' };
    }
    
    // Must have an undoable bid
    if (!currentLedger.lastBidUndoable) {
      return { success: false, error: 'No bid available to undo.' };
    }
    
    // Check time window (15 seconds)
    const timeSinceLastBid = Date.now() - currentLedger.lastBidUndoable.timestamp;
    if (timeSinceLastBid > UNDO_TIME_WINDOW) {
      // Clear expired undo
      currentLedger.lastBidUndoable = null;
      return { success: false, error: 'Undo time window expired.' };
    }
    
    // Must have at least one bid to undo
    if (currentLedger.bidHistory.length === 0) {
      return { success: false, error: 'No bids to undo.' };
    }
    
    // Get the last bid
    const lastBid = currentLedger.bidHistory[currentLedger.bidHistory.length - 1];
    
    // Must be the exact bid we're tracking
    if (lastBid.id !== currentLedger.lastBidUndoable.bidId) {
      return { success: false, error: 'Bid mismatch - cannot undo.' };
    }
    
    // Perform the undo
    try {
      // Remove the last bid from history
      currentLedger.bidHistory.pop();
      
      // Restore previous state
      currentLedger.currentBid = currentLedger.lastBidUndoable.originalBid;
      currentLedger.highestBidder = currentLedger.lastBidUndoable.previousHighestBidder;
      
      // Update consecutive bid count (decrease for undone team)
      if (currentLedger.consecutiveBidCount[lastBid.teamId] > 0) {
        currentLedger.consecutiveBidCount[lastBid.teamId]--;
      }
      
      // Update timestamp
      currentLedger.lastBidTimestamp = currentLedger.bidHistory.length > 0 
        ? currentLedger.bidHistory[currentLedger.bidHistory.length - 1].timestamp 
        : null;
      
      // Clear undo tracking (no chains allowed)
      currentLedger.lastBidUndoable = null;
      
      currentLedger.updatedAt = new Date().toISOString();
      currentSession.updatedAt = new Date().toISOString();
      
      // Save state
      await persistSession();
      
      return {
        success: true,
        message: `Undid bid from ${lastBid.teamName}`,
        newCurrentBid: currentLedger.currentBid,
        newHighestBidder: currentLedger.highestBidder,
        undoneAmount: lastBid.bidAmount
      };
      
    } catch (err) {
      console.error('Undo bid error:', err);
      return { success: false, error: 'Failed to undo bid.' };
    }
  },

  /**
   * Check if undo is available
   */
  canUndoLastBid() {
    if (!currentLedger?.lastBidUndoable) {
      return { canUndo: false, reason: 'No undoable bid' };
    }
    
    // Check if another team has bid since the undoable bid
    if (currentLedger.highestBidder?.teamId !== currentLedger.lastBidUndoable.teamId) {
      // Clear the expired undo
      currentLedger.lastBidUndoable = null;
      return { canUndo: false, reason: 'Another team has bid over' };
    }
    
    const timeSinceLastBid = Date.now() - currentLedger.lastBidUndoable.timestamp;
    if (timeSinceLastBid > UNDO_TIME_WINDOW) {
      // Clear expired undo
      currentLedger.lastBidUndoable = null;
      return { canUndo: false, reason: 'Time expired' };
    }
    
    if (![LiveAuctionState.LIVE, LiveAuctionState.PAUSED].includes(currentLedger.state)) {
      return { canUndo: false, reason: 'Wrong state' };
    }
    
    const remainingTime = Math.max(0, UNDO_TIME_WINDOW - timeSinceLastBid);
    return { 
      canUndo: true, 
      remainingTime,
      lastBidTeam: currentLedger.bidHistory.length > 0 
        ? currentLedger.bidHistory[currentLedger.bidHistory.length - 1].teamName 
        : null
    };
  },

  /**
   * Get current auction state (read-only, for all users)
   */
  getState() {
    return {
      session: currentSession,
      ledger: currentLedger,
      hasActiveAuction: currentSession !== null && currentLedger !== null
    };
  },

  /**
   * Check if there's an active live auction
   */
  hasActiveLiveAuction() {
    return currentSession !== null && 
           currentLedger !== null && 
           [LiveAuctionState.LIVE, LiveAuctionState.PAUSED, LiveAuctionState.READY].includes(currentLedger.state);
  },

  /**
   * Start a live auction session from a pre-created auction (Auctioneer only)
   * Admin creates and configures the auction, auctioneer can only START it
   * 
   * @param {Object} config - Contains auctionId and auctioneerId
   * @param {Object} auctionData - Pre-created auction data from auctions.json (validated by route)
   */
  async startSession(config, auctionData = null) {
    const { 
      auctionId, 
      auctioneerId,
      // Legacy support: if auctionData is not provided, use config directly
      sport, 
      name, 
      auctioneerName,
      teamIds, 
      playerPool, 
      bidSlabs = DEFAULT_BID_SLABS,
      timerDuration = 20 
    } = config;

    // Check for existing active session
    if (this.hasActiveLiveAuction()) {
      return { 
        success: false, 
        error: 'Another live auction is already in progress. Only one auction can be live at a time.' 
      };
    }

    // If auctionData is provided, use it (new flow: starting from pre-created auction)
    if (auctionData) {
      // Validate that this auctioneer is the assigned one
      if (!auctionData.assignedAuctioneer || auctionData.assignedAuctioneer.id !== auctioneerId) {
        return {
          success: false,
          error: 'You are not assigned to this auction. Only the assigned auctioneer can start it.'
        };
      }

      // Validate auction is in READY status
      if (auctionData.status !== 'READY') {
        // Check if auction is already completed
        if (auctionData.status === 'COMPLETED' || auctionData.status === 'TERMINATED') {
          return {
            success: false,
            error: `This auction has already been completed and is now view-only. Status: ${auctionData.status}. Completed auctions cannot be restarted.`
          };
        }
        
        return {
          success: false,
          error: `Auction is not ready to start. Current status: ${auctionData.status}. Admin must configure teams and players first.`
        };
      }

      // Create session from pre-configured auction
      currentSession = {
        id: auctionData.id,
        sport: auctionData.sport,
        name: auctionData.name,
        auctioneerId,
        auctioneerName: auctionData.assignedAuctioneer.name,
        teamIds: auctionData.teamIds || [],
        playerPool: [...(auctionData.playerPool || [])],
        completedPlayerIds: auctionData.completedPlayerIds || [],
        currentLedger: null,
        bidSlabs: auctionData.bidSlabs || DEFAULT_BID_SLABS,
        timerDuration: auctionData.timerDuration || 20,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Track that this is from a pre-created auction
        sourceAuctionId: auctionData.id,
        createdByAdmin: auctionData.createdBy
      };
    } else {
      // Legacy flow: direct session creation (kept for backward compatibility)
      currentSession = {
        id: auctionId,
        sport,
        name,
        auctioneerId,
        auctioneerName,
        teamIds,
        playerPool: [...playerPool],
        completedPlayerIds: [],
        currentLedger: null,
        bidSlabs,
        timerDuration,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    currentLedger = null;
    
    // Initialize auction ledger for tracking
    const finalAuctioneerName = auctionData?.assignedAuctioneer?.name || config.auctioneerName || 'Unknown';
    await initializeAuctionLedger(
      currentSession.id,
      currentSession.sport,
      currentSession.name,
      currentSession.auctioneerId,
      finalAuctioneerName
    );

    // Set total players count
    if (currentAuctionLedger) {
      currentAuctionLedger.currentStats.totalPlayers = currentSession.playerPool.length;
      await saveAuctionLedger();
    }

    await persistSession();

    return { 
      success: true, 
      session: currentSession 
    };
  },

  /**
   * Select player for auction (Auctioneer only)
   * Moves to READY state
   */
  async selectPlayer(auctioneerId, playerId, playerName, basePrice) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { 
        success: false, 
        error: 'Not authorized. Only the assigned auctioneer can control this auction.' 
      };
    }

    // Check if player is in pool
    if (!currentSession.playerPool.includes(playerId)) {
      return { 
        success: false, 
        error: 'Player is not in the auction pool.' 
      };
    }

    // Check if player already auctioned
    if (currentSession.completedPlayerIds.includes(playerId)) {
      return { 
        success: false, 
        error: 'Player has already been auctioned.' 
      };
    }

    // Check current state
    if (currentLedger && [LiveAuctionState.LIVE, LiveAuctionState.PAUSED].includes(currentLedger.state)) {
      return { 
        success: false, 
        error: 'Cannot select new player while bidding is in progress.' 
      };
    }

    // Create new ledger for this player
    currentLedger = {
      auctionId: currentSession.id,
      sport: currentSession.sport,
      playerId,
      playerName,
      basePrice,
      currentBid: basePrice,
      highestBidder: null,
      bidHistory: [],
      lastBidTimestamp: null,
      consecutiveBidCount: {},
      state: LiveAuctionState.READY,
      // Undo tracking - only last bid can be undone
      lastBidUndoable: null, // { bidId, teamId, timestamp, originalBid }
      timerStartedAt: null,
      timerDuration: currentSession.timerDuration,
      bidSlabs: currentSession.bidSlabs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentSession.currentLedger = currentLedger;
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { 
      success: true, 
      ledger: currentLedger 
    };
  },

  /**
   * Start bidding (Auctioneer only)
   * Moves from READY to LIVE
   */
  async startBidding(auctioneerId) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { 
        success: false, 
        error: 'Not authorized.' 
      };
    }

    // Check state
    if (!currentLedger || currentLedger.state !== LiveAuctionState.READY) {
      return { 
        success: false, 
        error: 'No player selected or bidding already started.' 
      };
    }

    // Move to LIVE
    currentLedger.state = LiveAuctionState.LIVE;
    currentLedger.timerStartedAt = new Date().toISOString();
    currentLedger.updatedAt = new Date().toISOString();
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { 
      success: true, 
      ledger: currentLedger 
    };
  },

  /**
   * Confirm a team's bid (Auctioneer only)
   * System calculates the next valid bid amount
   */
  async confirmBid(auctioneerId, teamId, teamName) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { 
        success: false, 
        error: 'Not authorized.' 
      };
    }

    // Check state
    if (!currentLedger || currentLedger.state !== LiveAuctionState.LIVE) {
      return { 
        success: false, 
        error: 'Auction is not live.' 
      };
    }

    // Check team is participating
    if (!currentSession.teamIds.includes(teamId)) {
      return { 
        success: false, 
        error: 'Team is not participating in this auction.' 
      };
    }

    // Check consecutive bid rule
    if (!canTeamBid(teamId, currentLedger)) {
      return { 
        success: false, 
        error: 'Team cannot bid 3 times consecutively. Let other teams bid first.' 
      };
    }

    // Calculate new bid amount
    const newBidAmount = calculateNextBid(currentLedger.currentBid, currentLedger.bidSlabs);

    // Create bid entry
    const bidEntry = {
      id: generateId('bid'),
      teamId,
      teamName,
      bidAmount: newBidAmount,
      timestamp: new Date().toISOString(),
      isJumpBid: false
    };

    // Update ledger
    currentLedger.bidHistory.push(bidEntry);
    currentLedger.currentBid = newBidAmount;
    currentLedger.highestBidder = { teamId, teamName };
    currentLedger.lastBidTimestamp = bidEntry.timestamp;
    currentLedger.timerStartedAt = bidEntry.timestamp; // Reset timer
    
    // Track as undoable (only the latest bid)
    currentLedger.lastBidUndoable = {
      bidId: bidEntry.id,
      teamId: teamId,
      timestamp: Date.now(),
      originalBid: currentLedger.bidHistory.length > 1 
        ? currentLedger.bidHistory[currentLedger.bidHistory.length - 2].bidAmount 
        : currentLedger.basePrice,
      previousHighestBidder: currentLedger.bidHistory.length > 1 
        ? {
            teamId: currentLedger.bidHistory[currentLedger.bidHistory.length - 2].teamId,
            teamName: currentLedger.bidHistory[currentLedger.bidHistory.length - 2].teamName
          }
        : null
    };

    // Update consecutive bid counts
    // Reset all to 0, then set this team's count
    const lastBidderId = currentLedger.bidHistory.length > 1 
      ? currentLedger.bidHistory[currentLedger.bidHistory.length - 2].teamId 
      : null;
    
    if (lastBidderId === teamId) {
      currentLedger.consecutiveBidCount[teamId] = (currentLedger.consecutiveBidCount[teamId] || 0) + 1;
    } else {
      // Reset all other teams, set this team to 1
      Object.keys(currentLedger.consecutiveBidCount).forEach(id => {
        currentLedger.consecutiveBidCount[id] = 0;
      });
      currentLedger.consecutiveBidCount[teamId] = 1;
    }

    currentLedger.updatedAt = new Date().toISOString();
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { 
      success: true, 
      ledger: currentLedger,
      bidEntry,
      nextValidBid: calculateNextBid(newBidAmount, currentLedger.bidSlabs)
    };
  },

  /**
   * Submit jump bid (Auctioneer only)
   * Jump bid must align with slab increments
   */
  async submitJumpBid(auctioneerId, teamId, teamName, jumpAmount) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { 
        success: false, 
        error: 'Not authorized.' 
      };
    }

    // Check state
    if (!currentLedger || currentLedger.state !== LiveAuctionState.LIVE) {
      return { 
        success: false, 
        error: 'Auction is not live.' 
      };
    }

    // Check team is participating
    if (!currentSession.teamIds.includes(teamId)) {
      return { 
        success: false, 
        error: 'Team is not participating in this auction.' 
      };
    }

    // Check consecutive bid rule
    if (!canTeamBid(teamId, currentLedger)) {
      return { 
        success: false, 
        error: 'Team cannot bid 3 times consecutively. Let other teams bid first.' 
      };
    }

    // Validate jump amount >= current bid
    if (jumpAmount <= currentLedger.currentBid) {
      return { 
        success: false, 
        error: `Jump bid must be greater than current bid (${currentLedger.currentBid} Cr).` 
      };
    }

    // Validate jump amount aligns with slab
    if (!isValidBidAmount(jumpAmount, currentLedger.bidSlabs)) {
      const increment = getIncrementForPrice(jumpAmount, currentLedger.bidSlabs);
      return { 
        success: false, 
        error: `Jump bid amount must align with slab increment of ${increment} Cr at this price level.` 
      };
    }

    // Create bid entry
    const bidEntry = {
      id: generateId('jump'),
      teamId,
      teamName,
      bidAmount: jumpAmount,
      timestamp: new Date().toISOString(),
      isJumpBid: true
    };

    // Update ledger
    currentLedger.bidHistory.push(bidEntry);
    currentLedger.currentBid = jumpAmount;
    currentLedger.highestBidder = { teamId, teamName };
    currentLedger.lastBidTimestamp = bidEntry.timestamp;
    currentLedger.timerStartedAt = bidEntry.timestamp; // Reset timer
    
    // Track as undoable (only the latest bid)
    // But first, clear any existing undo if this is a different team
    if (currentLedger.lastBidUndoable && currentLedger.lastBidUndoable.teamId !== teamId) {
      currentLedger.lastBidUndoable = null;
    }
    
    currentLedger.lastBidUndoable = {
      bidId: bidEntry.id,
      teamId: teamId,
      timestamp: Date.now(),
      originalBid: currentLedger.bidHistory.length > 1 
        ? currentLedger.bidHistory[currentLedger.bidHistory.length - 2].bidAmount 
        : currentLedger.basePrice,
      previousHighestBidder: currentLedger.bidHistory.length > 1 
        ? {
            teamId: currentLedger.bidHistory[currentLedger.bidHistory.length - 2].teamId,
            teamName: currentLedger.bidHistory[currentLedger.bidHistory.length - 2].teamName
          }
        : null
    };

    // Update consecutive bid counts
    const lastBidderId = currentLedger.bidHistory.length > 1 
      ? currentLedger.bidHistory[currentLedger.bidHistory.length - 2].teamId 
      : null;
    
    if (lastBidderId === teamId) {
      currentLedger.consecutiveBidCount[teamId] = (currentLedger.consecutiveBidCount[teamId] || 0) + 1;
    } else {
      Object.keys(currentLedger.consecutiveBidCount).forEach(id => {
        currentLedger.consecutiveBidCount[id] = 0;
      });
      currentLedger.consecutiveBidCount[teamId] = 1;
    }

    currentLedger.updatedAt = new Date().toISOString();
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { 
      success: true, 
      ledger: currentLedger,
      bidEntry,
      nextValidBid: calculateNextBid(jumpAmount, currentLedger.bidSlabs)
    };
  },

  /**
   * Pause bidding (Auctioneer only)
   */
  async pauseBidding(auctioneerId) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Check state
    if (!currentLedger || currentLedger.state !== LiveAuctionState.LIVE) {
      return { success: false, error: 'Auction is not live.' };
    }

    currentLedger.state = LiveAuctionState.PAUSED;
    currentLedger.updatedAt = new Date().toISOString();
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { success: true, ledger: currentLedger };
  },

  /**
   * Resume bidding (Auctioneer only)
   */
  async resumeBidding(auctioneerId) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Check state
    if (!currentLedger || currentLedger.state !== LiveAuctionState.PAUSED) {
      return { success: false, error: 'Auction is not paused.' };
    }

    currentLedger.state = LiveAuctionState.LIVE;
    currentLedger.timerStartedAt = new Date().toISOString(); // Reset timer
    currentLedger.updatedAt = new Date().toISOString();
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { success: true, ledger: currentLedger };
  },

  /**
   * Mark player as SOLD (Auctioneer only)
   * This finalizes the auction and persists to history
   */
  async markSold(auctioneerId) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Check state
    if (!currentLedger || ![LiveAuctionState.LIVE, LiveAuctionState.PAUSED].includes(currentLedger.state)) {
      return { success: false, error: 'No active bidding to finalize.' };
    }

    // Must have at least one bid
    if (!currentLedger.highestBidder) {
      return { success: false, error: 'No bids received. Use Mark Unsold instead.' };
    }

    // Create result
    const result = {
      playerId: currentLedger.playerId,
      playerName: currentLedger.playerName,
      sport: currentLedger.sport,
      auctionId: currentLedger.auctionId,
      basePrice: currentLedger.basePrice,
      finalPrice: currentLedger.currentBid,
      winningTeam: currentLedger.highestBidder,
      status: 'SOLD',
      bidHistory: [...currentLedger.bidHistory],
      totalBids: currentLedger.bidHistory.length,
      auctionedAt: new Date().toISOString(),
      auctionedBy: auctioneerId
    };

    // Persist to history
    await this._saveAuctionResult(result);

    // Add to auction ledger
    await addPlayerResult(
      currentLedger.playerId,
      currentLedger.playerName,
      'SOLD',
      currentLedger.basePrice,
      currentLedger.currentBid,
      currentLedger.highestBidder,
      currentLedger.bidHistory,
      null // TODO: calculate actual auction duration
    );
    
    // Clear undo (player resolved)
    currentLedger.lastBidUndoable = null;

    // Update player status in players.json
    await this._updatePlayerStatus(
      currentLedger.playerId, 
      currentLedger.sport, 
      'SOLD', 
      currentLedger.currentBid,
      currentLedger.highestBidder.teamId
    );

    // Update team - add player and deduct purse
    await this._updateTeamAfterPurchase(
      currentLedger.highestBidder.teamId,
      currentLedger.sport,
      currentLedger.playerId,
      currentLedger.currentBid
    );

    // Move player to completed
    currentSession.completedPlayerIds.push(currentLedger.playerId);
    currentSession.playerPool = currentSession.playerPool.filter(id => id !== currentLedger.playerId);

    // Clear undo (player resolved)
    currentLedger.lastBidUndoable = null;

    // Clear ledger, keep session
    const finalLedger = { ...currentLedger, state: LiveAuctionState.SOLD };
    currentLedger = null;
    currentSession.currentLedger = null;
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { 
      success: true, 
      result,
      finalLedger
    };
  },

  /**
   * Mark player as UNSOLD (Auctioneer only)
   * When no bids received or timer expires
   */
  async markUnsold(auctioneerId) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Check state
    if (!currentLedger || ![LiveAuctionState.LIVE, LiveAuctionState.PAUSED, LiveAuctionState.READY].includes(currentLedger.state)) {
      return { success: false, error: 'No active auction to mark unsold.' };
    }

    // Create result
    const result = {
      playerId: currentLedger.playerId,
      playerName: currentLedger.playerName,
      sport: currentLedger.sport,
      auctionId: currentLedger.auctionId,
      basePrice: currentLedger.basePrice,
      finalPrice: null,
      winningTeam: null,
      status: 'UNSOLD',
      bidHistory: [...currentLedger.bidHistory],
      totalBids: currentLedger.bidHistory.length,
      auctionedAt: new Date().toISOString(),
      auctionedBy: auctioneerId
    };

    // Persist to history
    await this._saveAuctionResult(result);

    // Add to auction ledger
    await addPlayerResult(
      currentLedger.playerId,
      currentLedger.playerName,
      'UNSOLD',
      currentLedger.basePrice,
      null,
      null,
      currentLedger.bidHistory,
      null // TODO: calculate actual auction duration
    );
    
    // Clear undo (player resolved)
    currentLedger.lastBidUndoable = null;

    // Update player status
    await this._updatePlayerStatus(
      currentLedger.playerId, 
      currentLedger.sport, 
      'UNSOLD', 
      null,
      null
    );

    // Move player to completed
    currentSession.completedPlayerIds.push(currentLedger.playerId);
    currentSession.playerPool = currentSession.playerPool.filter(id => id !== currentLedger.playerId);

    // Clear ledger, keep session
    const finalLedger = { ...currentLedger, state: LiveAuctionState.SOLD };
    currentLedger = null;
    currentSession.currentLedger = null;
    currentSession.updatedAt = new Date().toISOString();
    await persistSession();

    return { 
      success: true, 
      result,
      finalLedger
    };
  },

  /**
   * End entire auction session (Auctioneer only)
   */
  async endSession(auctioneerId) {
    // Validate auctioneer
    if (!currentSession || currentSession.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Can't end if player bidding is in progress
    if (currentLedger && [LiveAuctionState.LIVE, LiveAuctionState.PAUSED].includes(currentLedger.state)) {
      return { success: false, error: 'Cannot end session while bidding is in progress. Mark current player as SOLD or UNSOLD first.' };
    }

    const finalSession = { ...currentSession, status: 'COMPLETED' };
    
    // Complete the auction ledger (saves to history)
    await completeAuctionLedger();
    
    // Mark original auction as COMPLETED and view-only
    try {
      const auctionsFile = `data/${currentSession.sport}/auctions.json`;
      let auctions = await fileStore.readJSON(auctionsFile);
      
      const auctionIndex = auctions.findIndex(a => a.id === currentSession.id);
      if (auctionIndex !== -1) {
        auctions[auctionIndex].status = 'COMPLETED';
        auctions[auctionIndex].completedAt = new Date().toISOString();
        auctions[auctionIndex].auctioneerId = currentSession.auctioneerId;
        auctions[auctionIndex].auctioneerName = currentSession.auctioneerName;
        auctions[auctionIndex].isViewOnly = true;
        await fileStore.writeJSON(auctionsFile, auctions);
        console.log(`✅ Marked auction ${currentSession.id} as COMPLETED and view-only`);
      }
    } catch (err) {
      console.error('Failed to mark auction as completed:', err);
    }
    
    // Clear state
    currentSession = null;
    currentLedger = null;
    await clearPersistedSession();

    return { 
      success: true, 
      finalSession
    };
  },

  /**
   * Get bid history for a player
   */
  async getPlayerBidHistory(playerId) {
    try {
      const history = await fileStore.readJSON(AUCTION_HISTORY_FILE);
      const playerHistory = history.filter(h => h.playerId === playerId);
      return { success: true, history: playerHistory };
    } catch (err) {
      return { success: true, history: [] };
    }
  },

  // ============================================
  // INTERNAL HELPERS
  // ============================================

  async _saveAuctionResult(result) {
    try {
      let history = [];
      try {
        history = await fileStore.readJSON(AUCTION_HISTORY_FILE);
      } catch (err) {
        history = [];
      }
      history.unshift(result);
      await fileStore.writeJSON(AUCTION_HISTORY_FILE, history);
    } catch (err) {
      console.error('Failed to save auction result:', err);
    }
  },

  async _updatePlayerStatus(playerId, sport, status, soldPrice, teamId) {
    try {
      const playersFile = `data/${sport}/players.json`;
      let players = await fileStore.readJSON(playersFile);
      
      const playerIndex = players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        players[playerIndex].status = status;
        if (soldPrice !== null) {
          players[playerIndex].soldPrice = soldPrice;
          players[playerIndex].currentBid = soldPrice;
        }
        if (teamId) {
          players[playerIndex].teamId = teamId;
        }
        await fileStore.writeJSON(playersFile, players);
      }
    } catch (err) {
      console.error('Failed to update player status:', err);
    }
  },

  async _updateTeamAfterPurchase(teamId, sport, playerId, purchasePrice) {
    try {
      const teamsFile = `data/${sport}/franchises.json`;
      let teams = await fileStore.readJSON(teamsFile);
      
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex !== -1) {
        teams[teamIndex].playerIds = teams[teamIndex].playerIds || [];
        teams[teamIndex].playerIds.push(playerId);
        teams[teamIndex].playerCount = (teams[teamIndex].playerCount || 0) + 1;
        teams[teamIndex].purseRemaining = (teams[teamIndex].purseRemaining || teams[teamIndex].totalPurse) - purchasePrice;
        await fileStore.writeJSON(teamsFile, teams);
      }
    } catch (err) {
      console.error('Failed to update team after purchase:', err);
    }
  },

  /**
   * Utility: Get next valid bid info
   */
  getNextBidInfo() {
    if (!currentLedger) {
      return null;
    }
    return {
      currentBid: currentLedger.currentBid,
      nextBid: calculateNextBid(currentLedger.currentBid, currentLedger.bidSlabs),
      increment: getIncrementForPrice(currentLedger.currentBid, currentLedger.bidSlabs)
    };
  }
};

export { liveAuctionEngine, LiveAuctionState, DEFAULT_BID_SLABS };
