/**
 * Live Auction API Routes
 * 
 * AUTHORIZATION:
 * - Mutation endpoints (POST): Auctioneer only
 * - Read endpoints (GET): All users (Admin, Player, Public)
 */

import express from 'express';
import { liveAuctionEngine, LiveAuctionState } from '../liveAuctionEngine.js';
import { 
  getLiveSessionsBySport, 
  createLiveSession, 
  updateLiveSession,
  getFranchisesBySport,
  getPlayersBySport,
  getPlayerById,
  getAuctionById,
  updateAuction
} from '../dataStore.js';

const router = express.Router();

// ============================================
// MIDDLEWARE: Authorization check for mutations
// ============================================

const requireAuctioneer = (req, res, next) => {
  const { userRole, auctioneerId, userId } = req.body;
  
  if (userRole !== 'auctioneer') {
    return res.status(403).json({ 
      success: false, 
      error: 'Only auctioneers can perform this action.' 
    });
  }
  
  // Use auctioneerId or userId as the identifier
  req.auctioneerId = auctioneerId || userId;
  
  if (!req.auctioneerId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Auctioneer ID is required.' 
    });
  }
  
  next();
};

// ============================================
// READ ENDPOINTS (All users)
// ============================================

/**
 * GET /api/live-auction/state
 * Get current live auction state
 */
router.get('/state', async (req, res) => {
  try {
    const state = await liveAuctionEngine.getState();
    
    // If there's an active session, fetch additional data
    let teams = [];
    let currentPlayer = null;
    
    if (state.session) {
      // Fetch teams
      try {
        console.log(`📊 [FIRESTORE] Loading franchises for sport: ${state.session.sport}`);
        const allTeams = await getFranchisesBySport(state.session.sport);
        teams = allTeams.filter(t => state.session.teamIds.includes(t.id));
        console.log(`✅ [FIRESTORE] Loaded ${teams.length} franchises for session`);
      } catch (err) {
        teams = [];
      }
      
      // Fetch current player if ledger exists
      if (state.ledger) {
        try {
          console.log(`🎯 [FIRESTORE] Loading current player: ${state.ledger.playerId}`);
          currentPlayer = await getPlayerById(state.ledger.playerId);
          console.log(`✅ [FIRESTORE] Current player loaded: ${currentPlayer?.name || 'Not found'}`);
        } catch (err) {
          currentPlayer = null;
        }
      }
    }
    
    res.json({
      success: true,
      session: state.session,
      ledger: state.ledger,
      teams,
      currentPlayer,
      hasActiveAuction: state.hasActiveAuction
    });
  } catch (err) {
    console.error('Get auction state error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/live-auction/history/:playerId
 * Get bid history for a specific player
 */
router.get('/history/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const result = await liveAuctionEngine.getPlayerBidHistory(playerId);
    res.json(result);
  } catch (err) {
    console.error('Get player history error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/live-auction/bid-info
 * Get next valid bid information
 */
router.get('/bid-info', async (req, res) => {
  try {
    const info = liveAuctionEngine.getNextBidInfo();
    
    if (!info) {
      return res.json({ 
        success: true, 
        hasActiveBidding: false,
        info: null 
      });
    }
    
    res.json({ 
      success: true, 
      hasActiveBidding: true,
      info 
    });
  } catch (err) {
    console.error('Get bid info error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// MUTATION ENDPOINTS (Auctioneer only)
// ============================================

/**
 * POST /api/live-auction/start
 * Start a live auction session from a pre-created auction
 * 
 * NEW FLOW (Recommended):
 * - Provide auctionId - loads pre-created auction from auctions.json
 * - Validates auctioneer is assigned
 * - Updates auction status to LIVE
 * 
 * LEGACY FLOW (Backward compatible):
 * - Provide all config directly (sport, name, teamIds, playerPool, etc.)
 */
router.post('/start', requireAuctioneer, async (req, res) => {
  try {
    const { 
      auctionId, 
      sport, 
      name, 
      auctioneerName,
      teamIds, 
      playerPool, 
      bidSlabs,
      timerDuration 
    } = req.body;
    
    let auctionData = null;
    
    // NEW FLOW: Load pre-created auction by ID
    if (auctionId && sport) {
      try {
        console.log(`🎪 [FIRESTORE] Loading auction by ID: ${auctionId}`);
        auctionData = await getAuctionById(auctionId);
        
        if (!auctionData) {
          return res.status(404).json({ 
            success: false, 
            error: 'Auction not found. Make sure the auction was created by admin.' 
          });
        }
        console.log(`✅ [FIRESTORE] Auction loaded: ${auctionData.name}, status: ${auctionData.status}`);
      } catch (err) {
        return res.status(404).json({ 
          success: false, 
          error: 'Could not load auction data.' 
        });
      }
    }
    
    // Start session (engine validates assignment and status)
    const result = await liveAuctionEngine.startSession({
      auctionId,
      sport,
      name,
      auctioneerId: req.auctioneerId,
      auctioneerName,
      teamIds,
      playerPool,
      bidSlabs,
      timerDuration
    }, auctionData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // If using pre-created auction, update its status to LIVE
    if (auctionData) {
      try {
        console.log(`🔴 [FIRESTORE] Updating auction ${auctionId} status to LIVE`);
        await updateAuction(auctionId, {
          status: 'LIVE',
          liveSessionStartedAt: new Date().toISOString(),
          liveSessionStartedBy: req.auctioneerId
        });
        console.log(`✅ [FIRESTORE] Auction ${auctionId} marked as LIVE`);
      } catch (err) {
        console.error('Failed to update auction status to LIVE:', err);
      }
    }
    
    res.json(result);
  } catch (err) {
    console.error('Start auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/select-player
 * Select a player to auction
 */
router.post('/select-player', requireAuctioneer, async (req, res) => {
  try {
    const { playerId, playerName, basePrice } = req.body;
    
    const result = await liveAuctionEngine.selectPlayer(
      req.auctioneerId,
      playerId,
      playerName,
      basePrice
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Select player error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/start-bidding
 * Start bidding for selected player
 */
router.post('/start-bidding', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.startBidding(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Start bidding error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/bid
 * Confirm a team's bid (system calculates price)
 */
router.post('/bid', requireAuctioneer, async (req, res) => {
  try {
    const { teamId, teamName } = req.body;
    
    if (!teamId || !teamName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team ID and name are required.' 
      });
    }
    
    const result = await liveAuctionEngine.confirmBid(
      req.auctioneerId,
      teamId,
      teamName
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/jump-bid
 * Submit a jump bid (auctioneer enters custom amount)
 */
router.post('/jump-bid', requireAuctioneer, async (req, res) => {
  try {
    const { teamId, teamName, jumpAmount } = req.body;
    
    if (!teamId || !teamName || jumpAmount === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team ID, name, and jump amount are required.' 
      });
    }
    
    const result = await liveAuctionEngine.submitJumpBid(
      req.auctioneerId,
      teamId,
      teamName,
      parseFloat(jumpAmount)
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Jump bid error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/undo-bid
 * Undo the last bid (strict conditions)
 */
router.post('/undo-bid', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.undoLastBid(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Undo bid error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/pause
 * Pause bidding
 */
router.post('/pause', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.pauseBidding(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Pause error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/resume
 * Resume bidding
 */
router.post('/resume', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.resumeBidding(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Resume error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/sold
 * Mark current player as SOLD
 */
router.post('/sold', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.markSold(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Mark sold error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/unsold
 * Mark current player as UNSOLD
 */
router.post('/unsold', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.markUnsold(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('Mark unsold error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/live-auction/end
 * End the entire auction session
 */
router.post('/end', requireAuctioneer, async (req, res) => {
  try {
    const result = await liveAuctionEngine.endSession(req.auctioneerId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (err) {
    console.error('End session error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
