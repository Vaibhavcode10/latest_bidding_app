import { 
  getUsersByRoleAndSport,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getFranchisesBySport,
  createFranchise as createFranchiseDoc,
  updateFranchise as updateFranchiseDoc,
  getFranchiseById
} from '../dataStore.js';

// Helper function to load auctioneer data for a specific sport
const loadAuctioneers = async (sport) => {
  try {
    console.log(`📊 [FIRESTORE] Loading auctioneers for sport: ${sport}`);
    const auctioneers = await getUsersByRoleAndSport('auctioneer', sport);
    console.log(`✅ [FIRESTORE] Loaded ${auctioneers.length} auctioneers for ${sport}`);
    return auctioneers;
  } catch (error) {
    console.error(`Error loading auctioneers for ${sport}:`, error);
    return [];
  }
};

// Helper function to load franchise data for a specific sport
const loadFranchises = async (sport) => {
  try {
    console.log(`🏢 [FIRESTORE] Loading franchises for sport: ${sport}`);
    const franchises = await getFranchisesBySport(sport);
    console.log(`✅ [FIRESTORE] Loaded ${franchises.length} franchises for ${sport}`);
    return franchises;
  } catch (error) {
    console.error(`Error loading franchises for ${sport}:`, error);
    return [];
  }
};

// Login route for auctioneers
const login = async (req, res) => {
  const { username, email, password, sport } = req.body;

  // Validation
  if (!sport) {
    return res.status(400).json({
      success: false,
      message: 'Sport is required',
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
    });
  }

  if (!username && !email) {
    return res.status(400).json({
      success: false,
      message: 'Username or email is required',
    });
  }

  try {
    console.log(`🔐 [FIRESTORE] Auctioneer login attempt for sport: ${sport}`);
    
    // Find auctioneer by username or email
    let auctioneer = null;
    if (username) {
      auctioneer = await getUserByUsername(username);
    } else if (email) {
      auctioneer = await getUserByEmail(email);
    }

    // Check if auctioneer exists, has correct role, sport, and password matches
    if (!auctioneer || 
        auctioneer.role !== 'auctioneer' || 
        auctioneer.sport !== sport || 
        auctioneer.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email, password, or not authorized for this sport',
      });
    }

    console.log(`✅ [FIRESTORE] Auctioneer login successful: ${auctioneer.username}`);

    // Load franchises to find auctioneer's franchise
    const franchises = await loadFranchises(sport);
    const franchise = franchises.find((f) => f.auctioneerId === auctioneer.id);

    // Return auctioneer and franchise data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      auctioneer: {
        id: auctioneer.id,
        username: auctioneer.username,
        email: auctioneer.email,
        name: auctioneer.name,
        phone: auctioneer.phone,
        sport: auctioneer.sport,
        franchiseId: auctioneer.franchiseId,
        profilePicture: auctioneer.profilePicture,
      },
      franchise: franchise || null,
    });
  } catch (error) {
    console.error('Auctioneer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error.message
    });
  }
};

// Get auctioneer details
const getAuctioneerDetails = async (req, res) => {
  const { auctioneerId, sport } = req.query;

  if (!auctioneerId || !sport) {
    return res.status(400).json({
      success: false,
      message: 'Auctioneer ID and sport are required',
    });
  }

  try {
    console.log(`👤 [FIRESTORE] Getting auctioneer details: ${auctioneerId}`);
    
    const auctioneer = await getUserById(auctioneerId);

    if (!auctioneer || auctioneer.role !== 'auctioneer' || auctioneer.sport !== sport) {
      return res.status(404).json({
        success: false,
        message: 'Auctioneer not found or not authorized for this sport',
      });
    }

    // Load franchises to find auctioneer's franchise
    const franchises = await loadFranchises(sport);
    const franchise = franchises.find((f) => f.auctioneerId === auctioneerId);

    console.log(`✅ [FIRESTORE] Auctioneer details retrieved: ${auctioneer.username}`);

    res.status(200).json({
      success: true,
      auctioneer,
      franchise: franchise || null,
    });
  } catch (error) {
    console.error('Get auctioneer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving auctioneer details',
      error: error.message
    });
  }
};

// Create franchise
const createFranchise = async (req, res) => {
  const { auctioneerId, sport, name, city, stadium, capacity, description } = req.body;

  if (!auctioneerId || !sport || !name) {
    return res.status(400).json({
      success: false,
      message: 'Auctioneer ID, sport, and franchise name are required',
    });
  }

  try {
    console.log(`🏢 [FIRESTORE] Creating franchise for auctioneer: ${auctioneerId}`);
    
    const franchises = await loadFranchises(sport);

    // Check if auctioneer already has a franchise
    const existingFranchise = franchises.find((f) => f.auctioneerId === auctioneerId);
    if (existingFranchise) {
      return res.status(400).json({
        success: false,
        message: 'Auctioneer already has a franchise',
      });
    }

    // Create new franchise with sport-specific default purse
    const getDefaultPurse = (sport) => {
      const sportPurses = {
        'cricket': 1000000000,    // 100 CR (25 players max)
        'football': 1000000000,   // 100 CR (25 players max) 
        'baseball': 1000000000,   // 100 CR (26 players max)
        'basketball': 600000000,  // 60 CR (15 players max)
        'volleyball': 600000000   // 60 CR (14 players max)
      };
      return sportPurses[sport] || 500000000; // Default 50 CR
    };

    const defaultPurse = getDefaultPurse(sport);
    
    const newFranchise = {
      name,
      auctioneerId,
      auctioneerName: req.body.auctioneerName || 'Unknown',
      sport,
      city: city || '',
      stadium: stadium || '',
      capacity: capacity || 0,
      founded: new Date().getFullYear().toString(),
      totalPurse: defaultPurse,
      purseRemaining: defaultPurse,
      playerIds: [],
      playerCount: 0,
      wins: 0,
      losses: 0,
      description: description || '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const createdFranchise = await createFranchiseDoc(newFranchise);
    console.log(`✅ [FIRESTORE] Franchise created with ID: ${createdFranchise.id}`);

    res.status(201).json({
      success: true,
      message: 'Franchise created successfully',
      franchise: createdFranchise,
    });
  } catch (error) {
    console.error('Create franchise error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating franchise',
      error: error.message,
    });
  }
};

// Update franchise
const updateFranchise = async (req, res) => {
  const { franchiseId, sport } = req.query;
  const updateData = req.body;

  if (!franchiseId || !sport) {
    return res.status(400).json({
      success: false,
      message: 'Franchise ID and sport are required',
    });
  }

  try {
    console.log(`🔄 [FIRESTORE] Updating franchise: ${franchiseId}`);
    
    // Get the existing franchise to verify it exists and belongs to the sport
    const existingFranchise = await getFranchiseById(franchiseId);
    if (!existingFranchise || existingFranchise.sport !== sport) {
      return res.status(404).json({
        success: false,
        message: 'Franchise not found or invalid sport',
      });
    }

    // Update franchise
    const updatedFranchise = await updateFranchiseDoc(franchiseId, updateData);
    console.log(`✅ [FIRESTORE] Franchise updated: ${franchiseId}`);

    res.status(200).json({
      success: true,
      message: 'Franchise updated successfully',
      franchise: updatedFranchise,
    });
  } catch (error) {
    console.error('Update franchise error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating franchise',
      error: error.message,
    });
  }
};

export {
  login,
  getAuctioneerDetails,
  createFranchise,
  updateFranchise,
};
