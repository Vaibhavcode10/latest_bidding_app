import express from 'express';
import { 
  getPlayersBySport, 
  createPlayer, 
  updatePlayer,
  getPlayerById,
  deletePlayer,
  deleteUser,
  createHistoryEntry,
  getFranchisesBySport,
  updateFranchise,
  createUser,
  getUserByUsername,
  getUserByEmail
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

// Get all players for a sport or current player only
router.get('/:sport', async (req, res) => {
  try {
    const players = await getPlayersBySport(req.params.sport);
    
    // Check if this is a player-only request (via query parameter or authorization)
    const { userId, userRole } = req.query;
    
    if (userRole === 'player' && userId) {
      // Return only the logged-in player's data
      const playerData = players.find(p => p.id === userId);
      if (playerData) {
        res.json([playerData]);
      } else {
        res.json([]);
      }
    } else {
      // Return all players (for admin/auctioneer view)
      res.json(players);
    }
  } catch (err) {
    console.error('Error getting players:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new player to a sport
router.post('/:sport', async (req, res) => {
  try {
    const { name, username, email, password, basePrice } = req.body;
    const sport = req.params.sport;
    
    // Validate required fields for login
    if (!name || !username || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, username, email, and password are required for player creation' 
      });
    }

    // Validate basePrice
    if (basePrice === undefined || basePrice === null) {
      return res.status(400).json({ 
        error: 'Base price is required for player creation' 
      });
    }

    const basePriceNum = Number(basePrice);
    if (isNaN(basePriceNum) || basePriceNum <= 0) {
      return res.status(400).json({ 
        error: 'Base price must be a positive number' 
      });
    }
    
    // Check if username or email already exists
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Create user record for authentication
    const userData = {
      username,
      email,
      name,
      password,
      role: 'player',
      sport
    };
    
    const createdUser = await createUser(userData);
    
    // Create player record with default values - EXPLICIT FIELD MAPPING
    const newPlayer = {
      name: name,
      sport: sport,
      role: 'all-rounder',
      basePrice: basePriceNum,
      currentBid: 0,
      status: 'AVAILABLE',
      auctionPrice: null,
      soldTo: null,
      imageUrl: null,
      userId: createdUser.id
    };
    
    console.log('🏏 [PLAYER_CREATION] Creating player:', {
      name: newPlayer.name,
      basePrice: newPlayer.basePrice,
      basePriceIsNumber: typeof newPlayer.basePrice === 'number',
      allFields: Object.keys(newPlayer)
    });
    
    const createdPlayer = await createPlayer(newPlayer);
    
    console.log('✅ [PLAYER_CREATED] Response will include:', {
      playerId: createdPlayer.id,
      name: createdPlayer.name,
      basePrice: createdPlayer.basePrice,
      hasBasePrice: 'basePrice' in createdPlayer
    });
    
    // Return both user and player data (but no password)
    const { password: _, ...safeUserData } = createdUser;
    
    res.status(201).json({
      success: true,
      message: 'Player created successfully and can now log in',
      user: safeUserData,
      player: createdPlayer
    });
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update player
router.put('/:sport/:id', async (req, res) => {
  try {
    const updatedPlayer = await updatePlayer(req.params.id, req.body);
    
    if (!updatedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ success: true, player: updatedPlayer });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete player
router.delete('/:sport/:id', async (req, res) => {
  try {
    const { sport, id } = req.params;
    const { userId, userRole } = req.query;

    console.log(`🗑️ Delete request: sport=${sport}, playerId=${id}, userId=${userId}, userRole=${userRole}`);

    // Validate required parameters
    if (!userId || !userRole) {
      console.log('❌ Missing authentication parameters');
      return res.status(400).json({ 
        success: false, 
        error: 'User authentication required' 
      });
    }

    // Find the player to be deleted
    const playerToDelete = await getPlayerById(id);
    if (!playerToDelete) {
      console.log(`❌ Player not found: ${id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      });
    }

    console.log(`🔍 Found player to delete:`, playerToDelete.name);

    // Verify sport matches
    if (playerToDelete.sport !== sport) {
      console.log(`❌ Sport mismatch: player sport=${playerToDelete.sport}, requested sport=${sport}`);
      return res.status(400).json({
        success: false,
        error: 'Player sport mismatch'
      });
    }

    let franchises = await getFranchisesBySport(sport);

    // If auctioneer, verify ownership
    if (userRole === 'auctioneer') {
      // Find auctioneer's franchise
      const auctioneerFranchise = franchises.find(f => f.auctioneerId === userId);
      if (!auctioneerFranchise) {
        console.log(`❌ No franchise found for auctioneer: ${userId}`);
        return res.status(403).json({ 
          success: false, 
          error: 'No franchise found for auctioneer' 
        });
      }

      // Check if player belongs to auctioneer's team
      if (!auctioneerFranchise.playerIds.includes(id)) {
        console.log(`❌ Player not in auctioneer's team`);
        return res.status(403).json({ 
          success: false, 
          error: 'You can only delete players from your own team' 
        });
      }

      // Remove player from franchise
      const updatedPlayerIds = auctioneerFranchise.playerIds.filter(playerId => playerId !== id);
      const updatedPlayerCount = Math.max(0, (auctioneerFranchise.playerCount || 0) - 1);
      let updatedPurse = auctioneerFranchise.purseRemaining ?? 0;
      
      // If player was sold, add their price back to purse
      if (playerToDelete.soldPrice && playerToDelete.soldTo === auctioneerFranchise.id) {
        updatedPurse += playerToDelete.soldPrice;
      }

      await updateFranchise(auctioneerFranchise.id, {
        playerIds: updatedPlayerIds,
        playerCount: updatedPlayerCount,
        purseRemaining: updatedPurse
      });
      console.log(`✅ Updated franchise for auctioneer`);
    }
    // Admin can delete any player
    else if (userRole === 'admin') {
      console.log(`🔑 Admin delete - removing player from all franchises`);
      // Remove player from all franchises that might own them
      for (const franchise of franchises) {
        if (franchise.playerIds && franchise.playerIds.includes(id)) {
          const updatedPlayerIds = franchise.playerIds.filter(playerId => playerId !== id);
          const updatedPlayerCount = Math.max(0, (franchise.playerCount || 0) - 1);
          let updatedPurse = franchise.purseRemaining ?? 0;
          
          // If player was sold, add their price back to purse
          if (playerToDelete.soldPrice && playerToDelete.soldTo === franchise.id) {
            updatedPurse += playerToDelete.soldPrice;
          }

          await updateFranchise(franchise.id, {
            playerIds: updatedPlayerIds,
            playerCount: updatedPlayerCount,
            purseRemaining: updatedPurse
          });
          console.log(`✅ Updated franchise: ${franchise.name}`);
        }
      }
    }
    // Other roles cannot delete players
    else {
      console.log(`❌ Insufficient permissions for role: ${userRole}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions to delete players' 
      });
    }

    // Log history action
    await logHistoryAction('PLAYER_DELETION', {
      sport,
      playerId: id,
      playerName: playerToDelete.name,
      deletedBy: userId,
      deletedByRole: userRole,
      role: playerToDelete.playerRole || playerToDelete.role,
      basePrice: playerToDelete.basePrice,
      soldPrice: playerToDelete.soldPrice || null,
      soldTo: playerToDelete.soldTo || null,
      verified: playerToDelete.verified || false
    });
    console.log(`📝 Logged deletion history`);

    // Delete the player record
    await deletePlayer(id);
    console.log(`🗑️ Deleted player record`);
    
    // If player has a linked user ID, delete the user record too
    if (playerToDelete.userId) {
      try {
        await deleteUser(playerToDelete.userId);
        console.log(`🗑️ Deleted linked user record: ${playerToDelete.userId}`);
      } catch (userDeleteError) {
        console.log(`⚠️ Warning: Could not delete user record ${playerToDelete.userId}:`, userDeleteError.message);
        // Don't fail the whole operation if user deletion fails
      }
    }

    console.log(`✅ Player deletion completed: ${playerToDelete.name}`);
    res.json({ 
      success: true, 
      message: 'Player deleted successfully',
      deletedPlayer: playerToDelete.name 
    });
  } catch (err) {
    console.error('❌ Delete player error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

export default router;