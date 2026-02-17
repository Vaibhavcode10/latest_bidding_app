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

import { 
  getPlayerById,
  updatePlayer,
  getFranchiseById,
  updateFranchise,
  createBid,
  createLiveSession,
  updateLiveSession,
  getCurrentSession,
  getLiveSessionById,
  getBidsByPlayer,
  createHistoryEntry,
  updateAuction,
  db,
  COLLECTIONS
} from './dataStore.js';
import "./firebase.js";


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

// Current session tracking (in memory for performance)
let currentSessionId = null;

// Undo configuration
const UNDO_TIME_WINDOW = 15000; // 15 seconds to undo

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
 * Calculate next bid capped by maximum available purse
 * Prevents suggesting a bid that exceeds a team's remaining budget
 */
function calculateCappedNextBid(currentBid, maxBid, slabs = DEFAULT_BID_SLABS) {
  const nextBid = calculateNextBid(currentBid, slabs);
  // Cap to maxBid if nextBid exceeds it
  return Math.min(nextBid, maxBid);
}

/**
 * Check if a team can bid (consecutive bid rule: prevents 3 consecutive bids)
 */
async function canTeamBid(teamId, sessionId) {
  try {
    // Get recent bids for this session to check consecutive count
    const bids = await getBidsByAuction(sessionId);
    
    // Check last 2 bids to see if they're from same team
    let consecutiveCount = 0;
    for (let i = bids.length - 1; i >= 0 && consecutiveCount < 2; i--) {
      if (bids[i].teamId === teamId) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    return consecutiveCount < 2; // Allows up to 2 consecutive, blocks 3rd
  } catch (error) {
    console.error('Error checking consecutive bids:', error);
    return true; // Allow on error
  }
}

/**
 * Get current live session using local session ID
 */
async function getLocalCurrentSession() {
  if (!currentSessionId) return null;
  
  try {
    return await getLiveSessionById(currentSessionId);
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Update current live session
 */
async function updateCurrentSession(updates) {
  if (!currentSessionId) return null;
  
  try {
    return await updateLiveSession(currentSessionId, updates);
  } catch (error) {
    console.error('Error updating current session:', error);
    return null;
  }
}

// ============================================
// AUCTION LEDGER MANAGEMENT
// ============================================

/**
 * Initialize auction session
 */
async function initializeAuctionSession(sport, auctionName, auctioneerId, auctioneerName, teamIds, playerPool) {
  const session = {
    sport,
    name: auctionName,
    auctioneerId,
    auctioneerName,
    teamIds,
    playerPool,
    completedPlayerIds: [],
    currentPlayerId: null,
    currentBid: 0,
    basePrice: 0,
    highestBidder: null,
    bidSlabs: DEFAULT_BID_SLABS,
    timerDuration: 20,
    status: 'ACTIVE',
    state: LiveAuctionState.IDLE
  };
  
  const createdSession = await createLiveSession(session);
  currentSessionId = createdSession.id;
  return createdSession;
}

/**
 * Add player result to auction history 
 */
async function addPlayerResult(playerId, playerName, status, basePrice, finalPrice = null, winningTeam = null, auctionDuration = null) {
  if (!currentSessionId) return;

  try {
    // Store in auction history
    await createHistoryEntry({
      sessionId: currentSessionId,
      action: 'PLAYER_AUCTION_RESULT',
      playerId,
      playerName,
      status, // 'SOLD' or 'UNSOLD'
      basePrice,
      finalPrice,
      winningTeam,
      auctionDuration,
      auctionedAt: new Date().toISOString()
    });

    // Update session with completed player
    const session = await getLocalCurrentSession();
    if (session) {
      const updatedCompletedPlayerIds = [...(session.completedPlayerIds || []), playerId];
      await updateCurrentSession({
        completedPlayerIds: updatedCompletedPlayerIds
      });
    }
  } catch (error) {
    console.error('Failed to save player auction result:', error);
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
    console.log('🎯 Live Auction Engine initialized with Firestore');
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
  async getState() {
    try {
      const session = await getLocalCurrentSession();
      return {
        session: session,
        hasActiveAuction: session !== null && currentSessionId !== null
      };
    } catch (error) {
      console.error('Error getting auction state:', error);
      return {
        session: null,
        hasActiveAuction: false
      };
    }
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
    const session = await getLocalCurrentSession();
    
    // Validate auctioneer
    if (!session || session.auctioneerId !== auctioneerId) {
      return { 
        success: false, 
        error: 'Not authorized.' 
      };
    }

    // Check state
    if (session.state !== LiveAuctionState.LIVE) {
      return { 
        success: false, 
        error: 'Auction is not live.' 
      };
    }

    // Check team is participating
    if (!session.teamIds.includes(teamId)) {
      return { 
        success: false, 
        error: 'Team is not participating in this auction.' 
      };
    }

    // Check consecutive bid rule
    const canBid = await canTeamBid(teamId, currentSessionId);
    if (!canBid) {
      return { 
        success: false, 
        error: 'Team cannot bid 3 times consecutively. Let other teams bid first.' 
      };
    }

    // Calculate new bid amount
    const newBidAmount = calculateNextBid(session.currentBid || session.basePrice, session.bidSlabs || DEFAULT_BID_SLABS);

    // Create bid entry in database
    const bidEntry = {
      auctionId: currentSessionId,
      playerId: session.currentPlayerId,
      teamId,
      teamName,
      bidAmount: newBidAmount,
      isJumpBid: false
    };

    const createdBid = await createBid(bidEntry);

    // Update session state
    await updateCurrentSession({
      currentBid: newBidAmount,
      highestBidder: { teamId, teamName },
      lastBidTimestamp: createdBid.timestamp,
      timerStartedAt: createdBid.timestamp,
      updatedAt: new Date().toISOString()
    });

    // Get bidding team's purse to cap next valid bid
    let nextValidBid = calculateNextBid(newBidAmount, session.bidSlabs || DEFAULT_BID_SLABS);
    try {
      const biddingTeamFranchise = await getFranchiseById(teamId);
      if (biddingTeamFranchise) {
        const teamPurse = biddingTeamFranchise.purseRemaining ?? biddingTeamFranchise.totalPurse ?? 0;
        nextValidBid = calculateCappedNextBid(newBidAmount, teamPurse, session.bidSlabs || DEFAULT_BID_SLABS);
        console.log(`💰 Next bid capped to team's purse: ${nextValidBid} CR (Purse: ${teamPurse} CR)`);
      }
    } catch (err) {
      console.warn('Could not fetch team purse for next bid cap:', err.message);
    }

    return { 
      success: true, 
      session: await getLocalCurrentSession(),
      bidEntry: createdBid,
      nextValidBid
    };
  },

  /**
   * Submit jump bid (Auctioneer only)
   * Jump bid must align with slab increments
   */
  async submitJumpBid(auctioneerId, teamId, teamName, jumpAmount) {
    const session = await getLocalCurrentSession();
    
    // Validate auctioneer
    if (!session || session.auctioneerId !== auctioneerId) {
      return { 
        success: false, 
        error: 'Not authorized.' 
      };
    }

    // Check state
    if (session.state !== LiveAuctionState.LIVE) {
      return { 
        success: false, 
        error: 'Auction is not live.' 
      };
    }

    // Check team is participating
    if (!session.teamIds.includes(teamId)) {
      return { 
        success: false, 
        error: 'Team is not participating in this auction.' 
      };
    }

    // Check consecutive bid rule
    const canBid = await canTeamBid(teamId, currentSessionId);
    if (!canBid) {
      return { 
        success: false, 
        error: 'Team cannot bid 3 times consecutively. Let other teams bid first.' 
      };
    }

    const currentBid = session.currentBid || session.basePrice;
    
    // Validate jump amount >= current bid
    if (jumpAmount <= currentBid) {
      return { 
        success: false, 
        error: `Jump bid must be greater than current bid (${currentBid} Cr).` 
      };
    }

    const bidSlabs = session.bidSlabs || DEFAULT_BID_SLABS;
    
    // Validate jump amount aligns with slab
    if (!isValidBidAmount(jumpAmount, bidSlabs)) {
      const increment = getIncrementForPrice(jumpAmount, bidSlabs);
      return { 
        success: false, 
        error: `Jump bid amount must align with slab increment of ${increment} Cr at this price level.` 
      };
    }

    // Create bid entry in database
    const bidEntry = {
      auctionId: currentSessionId,
      playerId: session.currentPlayerId,
      teamId,
      teamName,
      bidAmount: jumpAmount,
      isJumpBid: true
    };

    const createdBid = await createBid(bidEntry);

    // Update session state
    await updateCurrentSession({
      currentBid: jumpAmount,
      highestBidder: { teamId, teamName },
      lastBidTimestamp: createdBid.timestamp,
      timerStartedAt: createdBid.timestamp,
      updatedAt: new Date().toISOString()
    });

    // Get bidding team's purse to cap next valid bid
    let nextValidBid = calculateNextBid(jumpAmount, bidSlabs);
    try {
      const biddingTeamFranchise = await getFranchiseById(teamId);
      if (biddingTeamFranchise) {
        const teamPurse = biddingTeamFranchise.purseRemaining ?? biddingTeamFranchise.totalPurse ?? 0;
        nextValidBid = calculateCappedNextBid(jumpAmount, teamPurse, bidSlabs);
        console.log(`💰 Next jump bid capped to team's purse: ${nextValidBid} CR (Purse: ${teamPurse} CR)`);
      }
    } catch (err) {
      console.warn('Could not fetch team purse for next bid cap:', err.message);
    }

    return { 
      success: true, 
      session: await getLocalCurrentSession(),
      bidEntry: createdBid,
      nextValidBid
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
    const session = await getLocalCurrentSession();
    
    // Validate auctioneer
    if (!session || session.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Check state
    if (![LiveAuctionState.LIVE, LiveAuctionState.PAUSED].includes(session.state)) {
      return { success: false, error: 'No active bidding to finalize.' };
    }

    // Must have at least one bid
    if (!session.highestBidder) {
      return { success: false, error: 'No bids received. Use Mark Unsold instead.' };
    }

    const playerId = session.currentPlayerId;
    const finalPrice = session.currentBid;
    const winningTeam = session.highestBidder;

    try {
      // ATOMIC TRANSACTION: Update franchise purse and player status atomically
      await db.runTransaction(async (transaction) => {
        console.log(`⚡ [FIRESTORE TRANSACTION] Marking player ${playerId} as SOLD for ${finalPrice} CR`);
        
        // Read franchise document within transaction
        const franchiseRef = db.collection(COLLECTIONS.FRANCHISES).doc(winningTeam.teamId);
        const franchiseDoc = await transaction.get(franchiseRef);
        
        if (!franchiseDoc.exists) {
          throw new Error(`Franchise ${winningTeam.teamId} not found`);
        }
        
        const franchise = franchiseDoc.data();
        const currentPurse = franchise.purseRemaining ?? franchise.totalPurse ?? 0;
        
        // Verify purseRemaining >= finalPrice WITHIN TRANSACTION
        if (finalPrice > currentPurse) {
          throw new Error(`Insufficient purse at finalization. Final price: ${finalPrice} CR, Available purse: ${currentPurse} CR`);
        }
        
        // Calculate new purse and player list
        const newPurseRemaining = currentPurse - finalPrice;
        const newPlayerIds = [...(franchise.playerIds || []), playerId];
        const newPlayerCount = (franchise.playerCount || 0) + 1;
        
        // Update franchise document - deduct purse and add player
        transaction.update(franchiseRef, {
          playerIds: newPlayerIds,
          playerCount: newPlayerCount,
          purseRemaining: newPurseRemaining,
          updatedAt: new Date().toISOString()
        });
        
        // Update player document as SOLD
        const playerRef = db.collection(COLLECTIONS.PLAYERS).doc(playerId);
        transaction.update(playerRef, {
          status: 'SOLD',
          soldPrice: finalPrice,
          soldTo: winningTeam.teamId,
          auctionPrice: finalPrice,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`✅ [TRANSACTION COMMITTED] Player ${playerId} SOLD for ${finalPrice} CR. Franchise purse: ${currentPurse} → ${newPurseRemaining} CR`);
      });

      // Add to auction result history (outside transaction for resilience)
      await addPlayerResult(
        playerId,
        session.currentPlayerName || 'Unknown',
        'SOLD',
        session.basePrice,
        finalPrice,
        winningTeam,
        null // auction duration
      );

      // Update session - move player to completed and clear current player
      const updatedCompletedPlayerIds = [...(session.completedPlayerIds || []), playerId];
      const updatedPlayerPool = session.playerPool.filter(id => id !== playerId);

      await updateCurrentSession({
        completedPlayerIds: updatedCompletedPlayerIds,
        playerPool: updatedPlayerPool,
        currentPlayerId: null,
        currentPlayerName: null,
        currentBid: 0,
        basePrice: 0,
        highestBidder: null,
        state: LiveAuctionState.IDLE,
        updatedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        result: {
          playerId,
          finalPrice,
          winningTeam,
          status: 'SOLD'
        }
      };
    } catch (error) {
      console.error('Error marking player as sold:', error);
      return { success: false, error: error.message || 'Failed to mark player as sold' };
    }
  },

  /**
   * Mark player as UNSOLD (Auctioneer only)
   * When no bids received or timer expires
   */
  async markUnsold(auctioneerId) {
    const session = await getLocalCurrentSession();
    
    // Validate auctioneer
    if (!session || session.auctioneerId !== auctioneerId) {
      return { success: false, error: 'Not authorized.' };
    }

    // Check state
    if (![LiveAuctionState.LIVE, LiveAuctionState.PAUSED, LiveAuctionState.READY].includes(session.state)) {
      return { success: false, error: 'No active auction to mark unsold.' };
    }

    const playerId = session.currentPlayerId;

    try {
      // Update player status
      await updatePlayer(playerId, {
        status: 'UNSOLD',
        soldPrice: null,
        soldTo: null,
        auctionPrice: null
      });

      // Add to auction result history
      await addPlayerResult(
        playerId,
        session.currentPlayerName || 'Unknown',
        'UNSOLD',
        session.basePrice,
        null,
        null,
        null // auction duration
      );

      // Update session - move player to completed and clear current player
      const updatedCompletedPlayerIds = [...(session.completedPlayerIds || []), playerId];
      const updatedPlayerPool = session.playerPool.filter(id => id !== playerId);

      await updateCurrentSession({
        completedPlayerIds: updatedCompletedPlayerIds,
        playerPool: updatedPlayerPool,
        currentPlayerId: null,
        currentPlayerName: null,
        currentBid: 0,
        basePrice: 0,
        highestBidder: null,
        state: LiveAuctionState.IDLE,
        updatedAt: new Date().toISOString()
      });

      return { 
        success: true, 
        result: {
          playerId,
          status: 'UNSOLD'
        }
      };
    } catch (error) {
      console.error('Error marking player as unsold:', error);
      return { success: false, error: 'Failed to mark player as unsold' };
    }
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
      await updateAuction(currentSession.id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        auctioneerId: currentSession.auctioneerId,
        auctioneerName: currentSession.auctioneerName,
        isViewOnly: true
      });
      console.log(`✅ Marked auction ${currentSession.id} as COMPLETED and view-only`);
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
  /**
   * Get player bid history
   */
  async getPlayerBidHistory(playerId) {
    try {
      return await getBidsByPlayer(playerId);
    } catch (error) {
      console.error('Error getting player bid history:', error);
      return { success: true, history: [] };
    }
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Utility: Get next valid bid info
   */
  async getNextBidInfo() {
    const session = await getLocalCurrentSession();
    if (!session || !session.currentPlayerId) {
      return null;
    }
    
    const currentBid = session.currentBid || session.basePrice;
    const bidSlabs = session.bidSlabs || DEFAULT_BID_SLABS;
    let nextBid = calculateNextBid(currentBid, bidSlabs);
    
    // Cap next bid to highest bidder's purse
    if (session.highestBidder) {
      try {
        const highestBidderFranchise = await getFranchiseById(session.highestBidder.teamId);
        if (highestBidderFranchise) {
          const teamPurse = highestBidderFranchise.purseRemaining ?? highestBidderFranchise.totalPurse ?? 0;
          nextBid = calculateCappedNextBid(currentBid, teamPurse, bidSlabs);
        }
      } catch (err) {
        console.warn('Could not fetch highest bidder purse for next bid cap:', err.message);
      }
    }
    
    return {
      currentBid,
      nextBid,
      increment: getIncrementForPrice(currentBid, bidSlabs)
    };
  }
};

export { liveAuctionEngine, LiveAuctionState, DEFAULT_BID_SLABS };
