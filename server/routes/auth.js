import express from 'express';
import { 
  getUserByUsername, 
  getUserByEmail, 
  getUserById,
  createUser, 
  updateUser, 
  getAllUsersByRole,
  getUsersByRoleAndSport,
  getFranchisesBySport 
} from '../dataStore.js';

const router = express.Router();

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

    // Find user by username or email
    let user = await getUserByUsername(username);
    if (!user) {
      user = await getUserByEmail(username); // username field might contain email
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password and role
    if (user.password !== password || user.role !== role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Handle admin login
    if (role === 'admin') {
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: 'admin',
          sport: sport || 'football' // Set default sport for admin
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

      // Verify user is for the correct sport
      if (user.sport !== sport) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials for this sport'
        });
      }

      // Return player data without password
      const { password: _, ...playerData } = user;
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

      // Verify user is for the correct sport
      if (user.sport !== sport) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials for this sport'
        });
      }

      // Get franchise data for auctioneer
      let franchise = null;
      try {
        const franchises = await getFranchisesBySport(sport);
        franchise = franchises.find(f => f.auctioneerId === user.id);
      } catch (e) {
        console.log('No franchise found for auctioneer');
      }

      const { password: _, ...auctioneerData } = user;
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
    const { username, email, password, role, sport, name, basePrice } = req.body;

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

    // Check if user already exists
    const existingByUsername = await getUserByUsername(username);
    const existingByEmail = email ? await getUserByEmail(email) : null;
    
    if (existingByUsername || existingByEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    if (role === 'player') {
      // Validate basePrice if provided
      let basePriceValue = 0;
      if (basePrice !== undefined && basePrice !== null) {
        const basePriceNum = Number(basePrice);
        if (isNaN(basePriceNum) || basePriceNum <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Base price must be a positive number'
          });
        }
        basePriceValue = basePriceNum;
      }

      // Create new player
      const sportPrefix = sport.substring(0, 2).toLowerCase();
      const newPlayer = {
        username,
        email: email || `${username}@${sport}.com`,
        password,
        name: name || 'Unavailable',
        sport,
        role: 'player',
        playerRole: 'Unavailable', // Keep separate from auth role
        jersey: null,
        height: 'Unavailable',
        weight: 'Unavailable',
        age: null,
        basePrice: basePriceValue,
        bio: 'Unavailable',
        imageUrl: '',
        verified: true,
        createdAt: new Date().toISOString().split('T')[0],
        currentBid: 0,
        status: 'AVAILABLE',
        auctionPrice: null,
        soldTo: null
      };

      const createdPlayer = await createUser(newPlayer);

      const { password: _, ...playerData } = createdPlayer;
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
      // Check auctioneer limit for sport
      const sportAuctioneers = await getUsersByRoleAndSport('auctioneer', sport);
      
      const MAX_AUCTIONEERS_PER_SPORT = 4;
      if (sportAuctioneers.length >= MAX_AUCTIONEERS_PER_SPORT) {
        return res.status(403).json({
          success: false,
          message: `Maximum ${MAX_AUCTIONEERS_PER_SPORT} auctioneers allowed per sport. Registration closed for ${sport}.`
        });
      }

      // Create new auctioneer
      const sportPrefix = sport.substring(0, 2).toLowerCase();
      const newAuctioneer = {
        username,
        email: email || `${username}@${sport}.com`,
        password,
        name: name || 'Unavailable',
        phone: 'Unavailable',
        sport,
        role: 'auctioneer',
        profilePicture: '',
        createdAt: new Date().toISOString().split('T')[0],
        active: true
      };

      const createdAuctioneer = await createUser(newAuctioneer);

      const { password: _, ...auctioneerData } = createdAuctioneer;
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

    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify role and sport match
    if (user.role !== role || (user.sport && user.sport !== sport)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role or sport for this user'
      });
    }

    const { password: _, ...userData } = user;

    if (role === 'auctioneer') {
      // Get franchise data
      let franchise = null;
      try {
        const franchises = await getFranchisesBySport(sport);
        franchise = franchises.find(f => f.auctioneerId === user.id);
      } catch (e) {
        console.log('No franchise found');
      }

      return res.json({
        success: true,
        user: userData,
        franchise
      });
    }

    return res.json({
      success: true,
      user: userData
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

    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify role and sport match
    if (user.role !== role || (user.sport && user.sport !== sport)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role or sport for this user'
      });
    }

    // Don't allow changing id, username, password, role, sport through this endpoint
    const { id, username, password, role: newRole, sport: newSport, ...allowedUpdates } = updateData;
    
    const updatedUser = await updateUser(userId, allowedUpdates);

    const { password: _, ...safeUpdatedUser } = updatedUser;
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUpdatedUser
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get auctioneer availability for a sport (for registration check)
router.get('/auctioneer-availability/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    
    const MAX_AUCTIONEERS_PER_SPORT = 4;
    const sportAuctioneers = await getUsersByRoleAndSport('auctioneer', sport);
    const currentCount = sportAuctioneers.length;
    const availableSlots = Math.max(0, MAX_AUCTIONEERS_PER_SPORT - currentCount);
    
    return res.json({
      success: true,
      sport,
      maxAllowed: MAX_AUCTIONEERS_PER_SPORT,
      currentCount,
      availableSlots,
      isFull: availableSlots === 0
    });
  } catch (err) {
    console.error('Auctioneer availability check error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all auctioneers for a sport (for admin to assign)
router.get('/auctioneers/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    
    const sportAuctioneers = await getUsersByRoleAndSport('auctioneer', sport);
    const safeAuctioneers = sportAuctioneers.map(a => {
      const { password, ...safeAuctioneer } = a;
      return safeAuctioneer;
    });
    
    return res.json({
      success: true,
      sport,
      auctioneers: safeAuctioneers,
      maxAllowed: 4
    });
  } catch (err) {
    console.error('Get auctioneers error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
