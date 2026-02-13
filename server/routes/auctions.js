import express from 'express';
import { 
  createHistoryEntry,
  getAuctionsBySport,
  createAuction,
  updateAuction,
  deleteAuction,
  getAuctionById,
  getUsersByRoleAndSport
} from '../dataStore.js';

const router = express.Router();

// Helper function to log history
const logHistoryAction = async (action, details) => {
  try {
    const historyEntry = {
      action,
      ...details
    };
    
    await createHistoryEntry(historyEntry);
    console.log('✅ History action logged:', action);
  } catch (err) {
    console.error('❌ Error logging history action:', err);
  }
};

// GET all auctions across all sports (for admin dashboard) - MUST BE BEFORE /:sport
router.get('/all/sports', async (req, res) => {
  try {
    const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    let allAuctions = [];
    
    for (const sport of sports) {
      try {
        const auctions = await getAuctionsBySport(sport);
        allAuctions = [...allAuctions, ...auctions];
      } catch (err) {
        // Skip if no auctions for this sport
      }
    }
    
    // Sort by createdAt (newest first)
    allAuctions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      auctions: allAuctions
    });
  } catch (err) {
    console.error('Get all auctions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all auctioneers for admin (to assign to auctions) - MUST BE BEFORE /:sport
// NOTE: Auctioneers are NEUTRAL - they don't own or represent any team/franchise  
router.get('/auctioneers/all/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;
    
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can view auctioneers list' });
    }
    
    // Get auctioneers (neutral people who conduct auctions)
    const auctioneers = await getUsersByRoleAndSport('auctioneer', sport);
    
    // Return auctioneers - they are neutral, no franchise association
    const auctioneersList = auctioneers.map(auctioneer => ({
      id: auctioneer.id,
      username: auctioneer.username,
      name: auctioneer.name || auctioneer.username,
      sport: sport,
      // Auctioneers are neutral - they don't have franchises
      role: 'neutral_auctioneer'
    }));
    
    res.json({
      success: true,
      auctioneers: auctioneersList
    });
  } catch (err) {
    console.error('Get auctioneers error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET auctions assigned to auctioneer (Auctioneer only) - MUST BE BEFORE /:sport
router.get('/assigned/:auctioneerId', async (req, res) => {
  try {
    const { auctioneerId } = req.params;
    const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    let assignedAuctions = [];
    
    for (const sport of sports) {
      try {
        const auctions = await getAuctionsBySport(sport);
        for (const auction of auctions) {
          // Check direct assignment
          if (auction.assignedAuctioneer?.id === auctioneerId) {
            assignedAuctions.push({
              ...auction,
              assignmentType: 'DIRECT'
            });
          }
        }
      } catch (err) {
        // Skip if no auctions for this sport
      }
    }
    
    // Sort: READY first (can start), then CREATED, then others
    const statusOrder = { 'READY': 0, 'CREATED': 1, 'LIVE': 2, 'PAUSED': 3, 'COMPLETED': 4 };
    assignedAuctions.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    
    res.json({
      success: true,
      auctions: assignedAuctions
    });
  } catch (err) {
    console.error('Get assigned auctions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all auctions for a sport (anyone can view) - Generic route LAST
router.get('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    
    const auctions = await getAuctionsBySport(sport);
    
    res.json({
      success: true,
      auctions
    });
  } catch (err) {
    console.error('Get auctions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single auction
router.get('/:sport/:auctionId', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    
    const auction = await getAuctionById(auctionId);
    
    if (!auction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    res.json({
      success: true,
      auction
    });
  } catch (err) {
    console.error('Get auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE auction (admin only) - Full configuration including auctioneer assignment
router.post('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { 
      name, 
      description,
      logoUrl,
      startDate, 
      endDate, 
      settings, 
      userRole, 
      userId,
      // New fields for full auction configuration
      assignedAuctioneerId,
      assignedAuctioneerName,
      teamIds,
      playerPool,
      bidSlabs,
      timerDuration
    } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can create auctions' });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, error: 'Auction name is required' });
    }
    
    // Default bid slabs if not provided
    const defaultBidSlabs = [
      { maxPrice: 10.0, increment: 0.25 },
      { maxPrice: 20.0, increment: 0.50 },
      { maxPrice: Infinity, increment: 1.0 }
    ];
    
    const newAuction = {
      name: name || 'Untitled Auction',
      sport: sport || 'football',
      description: description || '',
      logoUrl: logoUrl || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      // New status model: CREATED -> READY (when fully configured) -> LIVE -> COMPLETED
      status: 'CREATED',
      createdBy: userId || 'system',
      
      // Legacy fields for invitations (backward compatibility)
      invitedAuctioneers: [],
      acceptedAuctioneers: [],
      registeredPlayers: [],
      
      // NEW: Direct auctioneer assignment (Admin assigns ONE auctioneer)
      assignedAuctioneer: assignedAuctioneerId ? {
        id: assignedAuctioneerId,
        name: assignedAuctioneerName || 'Unknown',
        assignedAt: new Date().toISOString(),
        assignedBy: userId || 'system'
      } : null,
      
      // NEW: Participating teams (replaces teamIds for better structure)
      participatingTeams: req.body.participatingTeams || [],
      
      // NEW: Full auction configuration by admin
      teamIds: (req.body.participatingTeams || []).map(team => team.id),
      playerPool: playerPool || [],
      completedPlayerIds: [],
      bidSlabs: bidSlabs || defaultBidSlabs,
      timerDuration: timerDuration || 20,
      
      settings: settings || {
        minBidIncrement: 100000,
        maxPlayersPerTeam: 15,
        bidTimeLimit: 30
      }
    };
    
    // If fully configured (has auctioneer, teams, players), mark as READY
    if (newAuction.assignedAuctioneer && 
        newAuction.teamIds.length > 0 && 
        newAuction.playerPool.length > 0) {
      newAuction.status = 'READY';
    }
    
    const createdAuction = await createAuction(newAuction);
    
    // Log history
    await logHistoryAction('AUCTION_CREATED', {
      sport,
      auctionId: createdAuction.id,
      auctionName: createdAuction.name,
      createdBy: userId,
      status: createdAuction.status,
      assignedAuctioneerId: createdAuction.assignedAuctioneer?.id
    });
    
    res.json({
      success: true,
      message: 'Auction created successfully',
      auction: createdAuction
    });
  } catch (err) {
    console.error('Create auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE team purses during live auction (Auctioneer)
router.put('/:sport/:auctionId/teams', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { participatingTeams, userRole, userId } = req.body;
    
    // Auctioneer or admin only
    if (userRole !== 'auctioneer' && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only auctioneer can update team purses during live auction' });
    }
    
    // Update participating teams (purse changes)
    const updates = {};
    if (participatingTeams) {
      updates.participatingTeams = participatingTeams;
    }
    
    const updatedAuction = await updateAuction(auctionId, updates);
    
    res.json({
      success: true,
      message: 'Team purses updated',
      auction: updatedAuction
    });
  } catch (err) {
    console.error('Update team purses error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE auction (admin only)
router.put('/:sport/:auctionId', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { name, description, startDate, endDate, status, settings, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can update auctions' });
    }
    
    // Build updates object
    const updates = { updatedBy: userId };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (startDate) updates.startDate = startDate;
    if (endDate) updates.endDate = endDate;
    if (status) updates.status = status;
    if (settings) {
      // Need to get existing auction first to merge settings
      const existingAuction = await getAuctionById(auctionId);
      updates.settings = { ...existingAuction?.settings, ...settings };
    }
    
    const updatedAuction = await updateAuction(auctionId, updates);
    
    // Log history
    await logHistoryAction('AUCTION_UPDATED', {
      sport,
      auctionId,
      auctionName: updatedAuction.name,
      updatedBy: userId,
      changes: { name, description, startDate, endDate, status }
    });
    
    res.json({
      success: true,
      message: 'Auction updated successfully',
      auction: updatedAuction
    });
  } catch (err) {
    console.error('Update auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE auction (admin only)
router.delete('/:sport/:auctionId', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { userRole, userId } = req.query;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can delete auctions' });
    }
    
    const auctionToDelete = await deleteAuction(auctionId);
    
    // Log history
    await logHistoryAction('AUCTION_DELETED', {
      sport,
      auctionId,
      auctionName: auctionToDelete.name,
      deletedBy: userId
    });
    
    res.json({
      success: true,
      message: 'Auction deleted successfully'
    });
  } catch (err) {
    console.error('Delete auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// NEW ENDPOINTS: Admin assigns auctioneer, configures auction
// ============================================

// ASSIGN auctioneer to auction (Admin only) - Direct assignment, no invitation flow
router.post('/:sport/:auctionId/assign-auctioneer', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { auctioneerId, auctioneerName, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can assign auctioneers' });
    }
    
    if (!auctioneerId || !auctioneerName) {
      return res.status(400).json({ success: false, error: 'Auctioneer ID and name are required' });
    }
    
    // Get existing auction first
    const existingAuction = await getAuctionById(auctionId);
    if (!existingAuction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Cannot reassign if auction is already LIVE or COMPLETED
    if (['LIVE', 'COMPLETED'].includes(existingAuction.status)) {
      return res.status(400).json({ success: false, error: 'Cannot reassign auctioneer for live or completed auction' });
    }
    
    // Build updates
    const updates = {
      assignedAuctioneer: {
        id: auctioneerId,
        name: auctioneerName,
        assignedAt: new Date().toISOString(),
        assignedBy: userId
      }
    };
    
    // Check if auction is now fully configured (has teams and players too)
    if (existingAuction.teamIds?.length > 0 && existingAuction.playerPool?.length > 0) {
      updates.status = 'READY';
    }
    
    const updatedAuction = await updateAuction(auctionId, updates);
    
    // Log history
    await logHistoryAction('AUCTIONEER_ASSIGNED', {
      sport,
      auctionId,
      auctionName: updatedAuction.name,
      auctioneerId,
      auctioneerName,
      assignedBy: userId
    });
    
    res.json({
      success: true,
      message: `${auctioneerName} assigned to auction successfully`,
      auction: updatedAuction
    });
  } catch (err) {
    console.error('Assign auctioneer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// CONFIGURE auction (Admin only) - Set teams, players, bid slabs, timer
router.post('/:sport/:auctionId/configure', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { teamIds, playerPool, bidSlabs, timerDuration, userRole, userId } = req.body;
    
    // Admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can configure auctions' });
    }
    
    // Get existing auction first
    const existingAuction = await getAuctionById(auctionId);
    if (!existingAuction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Cannot configure if auction is already LIVE or COMPLETED
    if (['LIVE', 'COMPLETED'].includes(existingAuction.status)) {
      return res.status(400).json({ success: false, error: 'Cannot configure live or completed auction' });
    }
    
    // Build updates
    const updates = {};
    if (teamIds) updates.teamIds = teamIds;
    if (playerPool) updates.playerPool = playerPool;
    if (bidSlabs) updates.bidSlabs = bidSlabs;
    if (timerDuration !== undefined) updates.timerDuration = timerDuration;
    
    // Check if auction is now fully configured
    const mergedAuction = { ...existingAuction, ...updates };
    if (mergedAuction.assignedAuctioneer && 
        mergedAuction.teamIds?.length > 0 && 
        mergedAuction.playerPool?.length > 0) {
      updates.status = 'READY';
    }
    
    const updatedAuction = await updateAuction(auctionId, updates);
    
    // Log history
    await logHistoryAction('AUCTION_CONFIGURED', {
      sport,
      auctionId,
      auctionName: updatedAuction.name,
      configuredBy: userId,
      teamCount: updatedAuction.teamIds?.length,
      playerCount: updatedAuction.playerPool?.length
    });
    
    res.json({
      success: true,
      message: 'Auction configured successfully',
      auction: updatedAuction
    });
  } catch (err) {
    console.error('Configure auction error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REGISTER player for auction
router.post('/:sport/:auctionId/register-player', async (req, res) => {
  try {
    const { sport, auctionId } = req.params;
    const { userId, userName, userRole } = req.body;
    
    if (userRole !== 'player') {
      return res.status(403).json({ success: false, error: 'Only players can register for auctions' });
    }
    
    // Get existing auction first
    const existingAuction = await getAuctionById(auctionId);
    if (!existingAuction) {
      return res.status(404).json({ success: false, error: 'Auction not found' });
    }
    
    // Check if already registered
    const registeredPlayers = existingAuction.registeredPlayers || [];
    if (registeredPlayers.some(p => p.id === userId)) {
      return res.status(400).json({ success: false, error: 'Already registered for this auction' });
    }
    
    // Add player
    const newRegisteredPlayer = {
      id: userId,
      name: userName,
      registeredAt: new Date().toISOString()
    };
    
    const updatedRegisteredPlayers = [...registeredPlayers, newRegisteredPlayer];
    
    await updateAuction(auctionId, { 
      registeredPlayers: updatedRegisteredPlayers 
    });
    
    res.json({
      success: true,
      message: 'Registered for auction successfully'
    });
  } catch (err) {
    console.error('Register player error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;