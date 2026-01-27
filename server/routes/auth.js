import express from 'express';
import { fileStore } from '../fileStore.js';

const router = express.Router();
const USERS_FILE = 'server/data/users.json';

// Login route - handles all user types
router.post('/login', async (req, res) => {
  try {
    const { username, password, role, sport } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    const users = await fileStore.readJSON(USERS_FILE);

    // Handle admin login
    if (role === 'admin') {
      const admin = users.admins.find(
        a => (a.username === username || a.email === username) && a.password === password
      );
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          name: admin.name,
          role: 'admin'
        }
      });
    }

    // Handle player login
    if (role === 'player') {
      if (!sport) {
        return res.status(400).json({
          success: false,
          message: 'Sport is required for player login'
        });
      }

      const sportPlayers = users.players[sport] || [];
      const player = sportPlayers.find(
        p => (p.username === username || p.email === username) && p.password === password
      );

      if (!player) {
        return res.status(401).json({
          success: false,
          message: 'Invalid player credentials'
        });
      }

      // Return player data without password
      const { password: _, ...playerData } = player;
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          ...playerData,
          role: 'player'
        }
      });
    }

    // Handle auctioneer login
    if (role === 'auctioneer') {
      if (!sport) {
        return res.status(400).json({
          success: false,
          message: 'Sport is required for auctioneer login'
        });
      }

      const sportAuctioneers = users.auctioneers[sport] || [];
      const auctioneer = sportAuctioneers.find(
        a => (a.username === username || a.email === username) && a.password === password
      );

      if (!auctioneer) {
        return res.status(401).json({
          success: false,
          message: 'Invalid auctioneer credentials'
        });
      }

      // Get franchise data for auctioneer
      let franchise = null;
      try {
        const franchises = await fileStore.readJSON(`data/${sport}/franchises.json`);
        franchise = franchises.find(f => f.auctioneerId === auctioneer.id);
      } catch (e) {
        console.log('No franchise found for auctioneer');
      }

      const { password: _, ...auctioneerData } = auctioneer;
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          ...auctioneerData,
          role: 'auctioneer'
        },
        franchise
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid role specified'
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Register route - for new players and auctioneers
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, sport, name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    if ((role === 'player' || role === 'auctioneer') && !sport) {
      return res.status(400).json({
        success: false,
        message: 'Sport is required for player/auctioneer registration'
      });
    }

    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin registration is not allowed'
      });
    }

    const users = await fileStore.readJSON(USERS_FILE);

    // Check if user already exists
    if (role === 'player') {
      const sportPlayers = users.players[sport] || [];
      const existingPlayer = sportPlayers.find(
        p => p.username === username || p.email === email
      );
      if (existingPlayer) {
        return res.status(409).json({
          success: false,
          message: 'Player with this username or email already exists'
        });
      }

      // Create new player
      const sportPrefix = sport.substring(0, 2).toLowerCase();
      const newPlayer = {
        id: `${sportPrefix}_p${Date.now()}`,
        username,
        email: email || `${username}@${sport}.com`,
        password,
        name: name || 'Unavailable',
        sport,
        role: 'Unavailable',
        jersey: null,
        height: 'Unavailable',
        weight: 'Unavailable',
        age: null,
        basePrice: 0,
        bio: 'Unavailable',
        imageUrl: '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      if (!users.players[sport]) {
        users.players[sport] = [];
      }
      users.players[sport].push(newPlayer);
      await fileStore.writeJSON(USERS_FILE, users);

      const { password: _, ...playerData } = newPlayer;
      return res.status(201).json({
        success: true,
        message: 'Player registered successfully',
        user: {
          ...playerData,
          role: 'player'
        }
      });
    }

    if (role === 'auctioneer') {
      const sportAuctioneers = users.auctioneers[sport] || [];
      const existingAuctioneer = sportAuctioneers.find(
        a => a.username === username || a.email === email
      );
      if (existingAuctioneer) {
        return res.status(409).json({
          success: false,
          message: 'Auctioneer with this username or email already exists'
        });
      }

      // Create new auctioneer
      const sportPrefix = sport.substring(0, 2).toLowerCase();
      const newAuctioneer = {
        id: `${sportPrefix}_a${Date.now()}`,
        username,
        email: email || `${username}@${sport}.com`,
        password,
        name: name || 'Unavailable',
        phone: 'Unavailable',
        sport,
        profilePicture: '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      if (!users.auctioneers[sport]) {
        users.auctioneers[sport] = [];
      }
      users.auctioneers[sport].push(newAuctioneer);
      await fileStore.writeJSON(USERS_FILE, users);

      const { password: _, ...auctioneerData } = newAuctioneer;
      return res.status(201).json({
        success: true,
        message: 'Auctioneer registered successfully',
        user: {
          ...auctioneerData,
          role: 'auctioneer'
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid role specified'
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Get user profile
router.get('/profile/:role/:sport/:userId', async (req, res) => {
  try {
    const { role, sport, userId } = req.params;
    const users = await fileStore.readJSON(USERS_FILE);

    if (role === 'player') {
      const sportPlayers = users.players[sport] || [];
      const player = sportPlayers.find(p => p.id === userId);
      
      if (!player) {
        return res.status(404).json({
          success: false,
          message: 'Player not found'
        });
      }

      const { password: _, ...playerData } = player;
      return res.json({
        success: true,
        user: playerData
      });
    }

    if (role === 'auctioneer') {
      const sportAuctioneers = users.auctioneers[sport] || [];
      const auctioneer = sportAuctioneers.find(a => a.id === userId);
      
      if (!auctioneer) {
        return res.status(404).json({
          success: false,
          message: 'Auctioneer not found'
        });
      }

      const { password: _, ...auctioneerData } = auctioneer;
      
      // Get franchise data
      let franchise = null;
      try {
        const franchises = await fileStore.readJSON(`data/${sport}/franchises.json`);
        franchise = franchises.find(f => f.auctioneerId === auctioneer.id);
      } catch (e) {
        console.log('No franchise found');
      }

      return res.json({
        success: true,
        user: auctioneerData,
        franchise
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid role'
    });

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/profile/:role/:sport/:userId', async (req, res) => {
  try {
    const { role, sport, userId } = req.params;
    const updateData = req.body;
    const users = await fileStore.readJSON(USERS_FILE);

    if (role === 'player') {
      const sportPlayers = users.players[sport] || [];
      const playerIndex = sportPlayers.findIndex(p => p.id === userId);
      
      if (playerIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Player not found'
        });
      }

      // Update player data (don't allow changing id, username, password through this endpoint)
      const { id, username, password, ...allowedUpdates } = updateData;
      users.players[sport][playerIndex] = {
        ...users.players[sport][playerIndex],
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };

      await fileStore.writeJSON(USERS_FILE, users);

      const { password: _, ...updatedPlayer } = users.players[sport][playerIndex];
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedPlayer
      });
    }

    if (role === 'auctioneer') {
      const sportAuctioneers = users.auctioneers[sport] || [];
      const auctioneerIndex = sportAuctioneers.findIndex(a => a.id === userId);
      
      if (auctioneerIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Auctioneer not found'
        });
      }

      const { id, username, password, ...allowedUpdates } = updateData;
      users.auctioneers[sport][auctioneerIndex] = {
        ...users.auctioneers[sport][auctioneerIndex],
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };

      await fileStore.writeJSON(USERS_FILE, users);

      const { password: _, ...updatedAuctioneer } = users.auctioneers[sport][auctioneerIndex];
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedAuctioneer
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid role'
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
