const fs = require('fs');
const path = require('path');

// Helper function to load auctioneer data for a specific sport
const loadAuctioneers = (sport) => {
  try {
    const filePath = path.join(__dirname, `../data/${sport}/auctioneers.json`);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading auctioneers for ${sport}:`, error);
    return [];
  }
};

// Helper function to load franchise data for a specific sport
const loadFranchises = (sport) => {
  try {
    const filePath = path.join(__dirname, `../data/${sport}/franchises.json`);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading franchises for ${sport}:`, error);
    return [];
  }
};

// Login route for auctioneers
const login = (req, res) => {
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

  // Load auctioneers for the specified sport
  const auctioneers = loadAuctioneers(sport);
  const franchises = loadFranchises(sport);

  // Find auctioneer by username or email
  const auctioneer = auctioneers.find(
    (a) =>
      (username && a.username === username) ||
      (email && a.email === email)
  );

  // Check if auctioneer exists and password matches
  if (!auctioneer || auctioneer.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username/email or password',
    });
  }

  // Find franchise for this auctioneer
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
};

// Get auctioneer details
const getAuctioneerDetails = (req, res) => {
  const { auctioneerId, sport } = req.query;

  if (!auctioneerId || !sport) {
    return res.status(400).json({
      success: false,
      message: 'Auctioneer ID and sport are required',
    });
  }

  const auctioneers = loadAuctioneers(sport);
  const franchises = loadFranchises(sport);

  const auctioneer = auctioneers.find((a) => a.id === auctioneerId);

  if (!auctioneer) {
    return res.status(404).json({
      success: false,
      message: 'Auctioneer not found',
    });
  }

  const franchise = franchises.find((f) => f.auctioneerId === auctioneerId);

  res.status(200).json({
    success: true,
    auctioneer,
    franchise: franchise || null,
  });
};

// Create franchise
const createFranchise = (req, res) => {
  const { auctioneerId, sport, name, city, stadium, capacity, description } = req.body;

  if (!auctioneerId || !sport || !name) {
    return res.status(400).json({
      success: false,
      message: 'Auctioneer ID, sport, and franchise name are required',
    });
  }

  const franchises = loadFranchises(sport);

  // Check if auctioneer already has a franchise
  const existingFranchise = franchises.find((f) => f.auctioneerId === auctioneerId);
  if (existingFranchise) {
    return res.status(400).json({
      success: false,
      message: 'Auctioneer already has a franchise',
    });
  }

  // Create new franchise
  const newFranchise = {
    id: `${sport.substring(0, 2)}_f_${Date.now()}`,
    name,
    auctioneerId,
    auctioneerName: req.body.auctioneerName || 'Unknown',
    sport,
    city: city || '',
    stadium: stadium || '',
    capacity: capacity || 0,
    founded: new Date().getFullYear().toString(),
    totalPurse: 50000000,
    purseRemaining: 50000000,
    playerIds: [],
    playerCount: 0,
    wins: 0,
    losses: 0,
    description: description || '',
    createdAt: new Date().toISOString().split('T')[0],
  };

  franchises.push(newFranchise);

  // Write back to file
  try {
    const filePath = path.join(__dirname, `../data/${sport}/franchises.json`);
    fs.writeFileSync(filePath, JSON.stringify(franchises, null, 2));

    res.status(201).json({
      success: true,
      message: 'Franchise created successfully',
      franchise: newFranchise,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating franchise',
      error: error.message,
    });
  }
};

// Update franchise
const updateFranchise = (req, res) => {
  const { franchiseId, sport } = req.query;
  const updateData = req.body;

  if (!franchiseId || !sport) {
    return res.status(400).json({
      success: false,
      message: 'Franchise ID and sport are required',
    });
  }

  const franchises = loadFranchises(sport);
  const franchiseIndex = franchises.findIndex((f) => f.id === franchiseId);

  if (franchiseIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Franchise not found',
    });
  }

  // Update franchise
  franchises[franchiseIndex] = {
    ...franchises[franchiseIndex],
    ...updateData,
  };

  // Write back to file
  try {
    const filePath = path.join(__dirname, `../data/${sport}/franchises.json`);
    fs.writeFileSync(filePath, JSON.stringify(franchises, null, 2));

    res.status(200).json({
      success: true,
      message: 'Franchise updated successfully',
      franchise: franchises[franchiseIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating franchise',
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getAuctioneerDetails,
  createFranchise,
  updateFranchise,
};
