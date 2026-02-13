import express from 'express';
import { 
  getPlayersBySport, 
  updatePlayer, 
  getPlayerById,
  createHistoryEntry,
  getHistory 
} from '../dataStore.js';

const router = express.Router();

// History logging helper function
const logHistoryAction = async (action, details) => {
  try {
    const historyEntry = {
      action,
      ...details
    };
    
    await createHistoryEntry(historyEntry);
    console.log('✅ History action logged:', action, details);
  } catch (err) {
    console.error('❌ Error logging history action:', err);
  }
};

// Get all verification requests for admin
router.get('/verification-requests/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;

    // Only admin can view verification requests
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin can view verification requests' 
      });
    }

    const players = await getPlayersBySport(sport);
    
    // Return unverified players as verification requests
    const unverifiedPlayers = players.filter(player => !player.verified);
    
    res.json({
      success: true,
      requests: unverifiedPlayers
    });
  } catch (err) {
    console.error('Get verification requests error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Submit verification request (for players to request verification)
router.post('/verification-request/:sport/:playerId', async (req, res) => {
  try {
    const { sport, playerId } = req.params;
    const { userId, userRole } = req.body;

    // Only players can request verification for themselves or admin can request for any player
    if (userRole === 'player' && userId !== playerId) {
      return res.status(403).json({ 
        success: false, 
        error: 'You can only request verification for yourself' 
      });
    }

    const player = await getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      });
    }

    // Verify sport matches
    if (player.sport !== sport) {
      return res.status(400).json({
        success: false,
        error: 'Player sport mismatch'
      });
    }

    // Update player with verification request timestamp
    await updatePlayer(playerId, {
      verificationRequestedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Verification request submitted successfully'
    });
  } catch (err) {
    console.error('Submit verification request error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Approve/Verify a player (admin only)
router.post('/verify-player/:sport/:playerId', async (req, res) => {
  try {
    const { sport, playerId } = req.params;
    const { userId, userRole } = req.body;

    // Only admin can verify players
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin can verify players' 
      });
    }

    const player = await getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      });
    }

    // Verify sport matches
    if (player.sport !== sport) {
      return res.status(400).json({
        success: false,
        error: 'Player sport mismatch'
      });
    }

    const previousStatus = player.verified;
    
    // Update player verification status
    const updatedPlayer = await updatePlayer(playerId, {
      verified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: userId
    });
    
    // Log history action
    await logHistoryAction('PLAYER_VERIFICATION', {
      sport,
      playerId,
      playerName: player.name,
      adminUserId: userId,
      previousStatus: previousStatus ? 'VERIFIED' : 'UNVERIFIED',
      newStatus: 'VERIFIED',
      role: player.playerRole || player.role,
      basePrice: player.basePrice
    });
    
    res.json({
      success: true,
      message: `Player ${updatedPlayer.name} verified successfully`,
      player: updatedPlayer
    });
  } catch (err) {
    console.error('Verify player error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Get eligible (verified) players for auction
router.get('/eligible-players/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { userRole } = req.query;

    // Only admin and auctioneer can view eligible players
    if (userRole !== 'admin' && userRole !== 'auctioneer') {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions to view eligible players' 
      });
    }

    const players = await getPlayersBySport(sport);
    
    // Return only verified players
    const eligiblePlayers = players.filter(player => player.verified === true);
    
    res.json({
      success: true,
      players: eligiblePlayers
    });
  } catch (err) {
    console.error('Get eligible players error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Get history (admin only)
router.get('/history', async (req, res) => {
  try {
    const { userRole } = req.query;

    // Only admin can view history
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin can view history' 
      });
    }

    const history = await getHistory();
    
    console.log('📚 History request - found', history.length, 'entries');
    
    res.json({
      success: true,
      history
    });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Test endpoint to manually add history (for debugging)
router.post('/test-history', async (req, res) => {
  try {
    await logHistoryAction('TEST_ACTION', {
      testData: 'This is a test history entry',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Test history entry added'
    });
  } catch (err) {
    console.error('Test history error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;