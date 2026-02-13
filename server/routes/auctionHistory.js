/**
 * Auction History & Ledger API Routes
 * 
 * Provides endpoints to view completed auction histories and live auction ledgers.
 * Access control: Admin and assigned Auctioneer only
 */

import express from 'express';
import { 
  getHistory, 
  getHistoryBySport,
  getHistoryByAuctioneer,
  getAuctionsBySport, 
  getBidsByAuction,
  createHistoryEntry,
  getActiveLiveSessions,
  getActiveLiveSessionsByAuctioneer,
  getLiveSessionById
} from '../dataStore.js';

const router = express.Router();

// ============================================
// MIDDLEWARE: Authorization check
// ============================================

const requireAdminOrAuctioneer = (req, res, next) => {
  const { userRole, userId } = req.query;
  
  if (userRole !== 'admin' && userRole !== 'auctioneer') {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Only admins and auctioneers can view auction history.' 
    });
  }
  
  req.userRole = userRole;
  req.userId = userId;
  next();
};

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/auction-history
 * Get all completed auction histories
 */
router.get('/', requireAdminOrAuctioneer, async (req, res) => {
  try {
    const { sport, auctioneerId } = req.query;
    
    let history = [];
    console.log(`📚 [FIRESTORE] Getting auction history - sport: ${sport}, auctioneer: ${auctioneerId || req.userId}`);

    // Determine which query strategy to use
    if (req.userRole === 'auctioneer' || auctioneerId) {
      // Get history for specific auctioneer
      const filterAuctioneerId = auctioneerId || req.userId;
      history = await getHistoryByAuctioneer(filterAuctioneerId);
      
      // Further filter by sport if specified
      if (sport) {
        history = history.filter(h => h.sport === sport);
      }
    } else if (sport) {
      // Get history for specific sport
      history = await getHistoryBySport(sport);
    } else {
      // Get all history (admin only)
      history = await getHistory();
    }

    console.log(`✅ [FIRESTORE] Retrieved ${history.length} auction history records`);

    res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (err) {
    console.error('Get auction history error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auction-history/:auctionId
 * Get detailed history for specific auction
 */
router.get('/:auctionId', requireAdminOrAuctioneer, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    console.log(`🔍 [FIRESTORE] Searching for auction history: ${auctionId}`);
    
    // Get all history and find the specific auction
    // Note: In future, could add getHistoryByAuctionId for better performance
    const history = await getHistory(1000); // Get more records to search
    const auctionHistory = history.find(h => h.auctionId === auctionId);
    
    if (!auctionHistory) {
      console.log(`❌ [FIRESTORE] Auction history not found for: ${auctionId}`);
      return res.status(404).json({ success: false, error: 'Auction not found in history' });
    }

    console.log(`✅ [FIRESTORE] Found auction history: ${auctionHistory.auctionName || auctionId}`);

    // Access control: auctioneer can only view their own auctions
    if (req.userRole === 'auctioneer' && auctionHistory.auctioneerId !== req.userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own auction history' });
    }

    res.json({
      success: true,
      auction: auctionHistory
    });
  } catch (err) {
    console.error('Get auction detail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auction-history/ledgers/active
 * Get all active (in-progress) auction ledgers
 */
router.get('/ledgers/active', requireAdminOrAuctioneer, async (req, res) => {
  try {
    console.log(`📊 [FIRESTORE] Getting active auction ledgers/sessions`);
    
    let activeLedgers = [];

    // Get active live sessions based on user role
    if (req.userRole === 'auctioneer') {
      activeLedgers = await getActiveLiveSessionsByAuctioneer(req.userId);
    } else {
      // Admin can see all active sessions
      activeLedgers = await getActiveLiveSessions();
    }

    console.log(`✅ [FIRESTORE] Retrieved ${activeLedgers.length} active ledgers/sessions`);

    res.json({
      success: true,
      ledgers: activeLedgers,
      total: activeLedgers.length
    });
  } catch (err) {
    console.error('Get active ledgers error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auction-history/ledgers/:auctionId
 * Get live ledger for specific auction
 */
router.get('/ledgers/:auctionId', requireAdminOrAuctioneer, async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    console.log(`🔍 [FIRESTORE] Getting live session/ledger for auction: ${auctionId}`);
    
    const ledger = await getLiveSessionById(auctionId);
    
    if (!ledger) {
      console.log(`❌ [FIRESTORE] Live session/ledger not found for: ${auctionId}`);
      return res.status(404).json({ success: false, error: 'Auction ledger not found' });
    }

    console.log(`✅ [FIRESTORE] Found ledger for auction: ${auctionId}, status: ${ledger.status}`);

    // Access control: auctioneer can only view their own ledgers
    if (req.userRole === 'auctioneer' && ledger.auctioneerId !== req.userId) {
      return res.status(403).json({ success: false, error: 'You can only view your own auction ledgers' });
    }

    res.json({
      success: true,
      ledger
    });
  } catch (err) {
    console.error('Get auction ledger error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auction-history/stats
 * Get auction statistics summary
 */
router.get('/stats', requireAdminOrAuctioneer, async (req, res) => {
  try {
    const { sport, auctioneerId } = req.query;
    
    console.log(`📈 [FIRESTORE] Getting auction statistics - sport: ${sport}, auctioneer: ${auctioneerId || req.userId}`);
    
    let history = [];

    // Get history based on filters - same logic as main history endpoint
    if (req.userRole === 'auctioneer' || auctioneerId) {
      const filterAuctioneerId = auctioneerId || req.userId;
      history = await getHistoryByAuctioneer(filterAuctioneerId);
      
      if (sport) {
        history = history.filter(h => h.sport === sport);
      }
    } else if (sport) {
      history = await getHistoryBySport(sport);
    } else {
      history = await getHistory();
    }

    console.log(`✅ [FIRESTORE] Calculating stats from ${history.length} history records`);

    // Calculate stats
    const stats = {
      totalAuctions: history.length,
      totalPlayersAuctioned: 0,
      totalPlayersSold: 0,
      totalPlayersUnsold: 0,
      totalAmountSpent: 0,
      averageAuctionDuration: 0,
      topSales: [],
      sportBreakdown: {},
      monthlyBreakdown: {}
    };

    history.forEach(auction => {
      stats.totalPlayersAuctioned += auction.currentStats.playersAuctioned;
      stats.totalAmountSpent += auction.currentStats.totalSpent;

      // Sport breakdown
      if (!stats.sportBreakdown[auction.sport]) {
        stats.sportBreakdown[auction.sport] = { auctions: 0, spent: 0, players: 0 };
      }
      stats.sportBreakdown[auction.sport].auctions++;
      stats.sportBreakdown[auction.sport].spent += auction.currentStats.totalSpent;
      stats.sportBreakdown[auction.sport].players += auction.currentStats.playersAuctioned;

      // Monthly breakdown
      const month = new Date(auction.completedAt).toISOString().slice(0, 7); // YYYY-MM
      if (!stats.monthlyBreakdown[month]) {
        stats.monthlyBreakdown[month] = { auctions: 0, spent: 0 };
      }
      stats.monthlyBreakdown[month].auctions++;
      stats.monthlyBreakdown[month].spent += auction.currentStats.totalSpent;

      // Count sold/unsold players
      auction.playerResults.forEach(result => {
        if (result.status === 'SOLD') {
          stats.totalPlayersSold++;
          // Track top sales
          stats.topSales.push({
            playerName: result.playerName,
            sport: auction.sport,
            price: result.finalPrice,
            auctionName: auction.auctionName,
            date: auction.completedAt
          });
        } else {
          stats.totalPlayersUnsold++;
        }
      });
    });

    // Calculate averages
    if (history.length > 0) {
      const totalDuration = history.reduce((sum, auction) => sum + (auction.totalDuration || 0), 0);
      stats.averageAuctionDuration = Math.round(totalDuration / history.length);
    }

    // Sort top sales
    stats.topSales.sort((a, b) => b.price - a.price);
    stats.topSales = stats.topSales.slice(0, 10); // Top 10

    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Get auction stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;