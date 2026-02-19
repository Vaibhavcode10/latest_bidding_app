/**
 * Auction Controller
 * Handles auction creation, management, and retrievals
 */

import { db } from '../firebase.js';
import { createAuctionDocument } from '../models/Auction.js';

/**
 * Create a new auction for a season
 * Enforces constraint: Only ONE auction per season
 */
export const createAuction = async (req, res) => {
  try {
    const { 
      seasonId, 
      sport, 
      name, 
      status, 
      participatingTeams, 
      playerPool,
      settings,
      scheduledStartTime,
      scheduledEndTime,
      assignedAuctioneerId,
      assignedAuctioneerName
    } = req.body;

    // ✅ Validate required fields
    if (!seasonId || !sport || !name) {
      return res.status(400).json({
        success: false,
        error: 'seasonId, sport, and name are required'
      });
    }

    // ✅ Validate sport enum
    const validSports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport. Must be one of: ${validSports.join(', ')}`
      });
    }

    // ✅ Validate status if provided
    if (status && !['upcoming', 'live', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be: upcoming, live, or completed'
      });
    }

    // 🔍 Verify season exists
    const seasonDoc = await db.collection('seasons').doc(seasonId).get();
    if (!seasonDoc.exists) {
      return res.status(404).json({
        success: false,
        error: `Season with ID ${seasonId} not found`
      });
    }

    const seasonData = seasonDoc.data();
    
    // ✅ Verify season sport matches
    if (seasonData.sport !== sport) {
      return res.status(400).json({
        success: false,
        error: `Sport mismatch. Season sport is ${seasonData.sport}, but ${sport} provided`
      });
    }

    // 🔒 CHECK UNIQUENESS CONSTRAINT: Only one auction per season
    const existingAuctionQuery = await db
      .collection('auctions')
      .where('seasonId', '==', seasonId)
      .limit(1)
      .get();

    if (!existingAuctionQuery.empty) {
      return res.status(409).json({
        success: false,
        error: `An auction already exists for this season. Only one auction per season is allowed.`,
        existingAuctionId: existingAuctionQuery.docs[0].id,
        existingAuction: existingAuctionQuery.docs[0].data()
      });
    }

    // 📝 Create new auction document
    const auctionData = createAuctionDocument({
      seasonId,
      sport,
      name,
      status: status || 'upcoming',
      participatingTeams: Array.isArray(participatingTeams) ? participatingTeams : [],
      playerPool: Array.isArray(playerPool) ? playerPool : [],
      settings: settings || {},
      scheduledStartTime,
      scheduledEndTime,
      assignedAuctioneerId,
      assignedAuctioneerName
    });

    // 💾 Save to Firestore
    const auctionRef = await db.collection('auctions').add(auctionData);

    const createdAuction = {
      id: auctionRef.id,
      ...auctionData
    };

    console.log('✅ [AUCTION_CREATED]', {
      auctionId: auctionRef.id,
      seasonId,
      sport,
      name,
      status: auctionData.status
    });

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      auction: createdAuction
    });

  } catch (error) {
    console.error('❌ Error creating auction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get auction by ID
 */
export const getAuctionById = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        error: 'auctionId is required'
      });
    }

    const auctionDoc = await db.collection('auctions').doc(auctionId).get();

    if (!auctionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    res.json({
      success: true,
      auction: {
        id: auctionDoc.id,
        ...auctionDoc.data()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching auction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get auction for a specific season
 */
export const getAuctionBySeasonId = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId is required'
      });
    }

    const snapshot = await db
      .collection('auctions')
      .where('seasonId', '==', seasonId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: `No auction found for season ${seasonId}`
      });
    }

    const auctionDoc = snapshot.docs[0];

    res.json({
      success: true,
      auction: {
        id: auctionDoc.id,
        ...auctionDoc.data()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching auction by season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all auctions for a sport
 */
export const getAuctionsBySport = async (req, res) => {
  try {
    const { sport } = req.params;

    const validSports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport. Must be one of: ${validSports.join(', ')}`
      });
    }

    const snapshot = await db
      .collection('auctions')
      .where('sport', '==', sport)
      .orderBy('createdAt', 'desc')
      .get();

    const auctions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      count: auctions.length,
      auctions
    });

  } catch (error) {
    console.error('❌ Error fetching auctions by sport:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get live auctions
 */
export const getLiveAuctions = async (req, res) => {
  try {
    const snapshot = await db
      .collection('auctions')
      .where('status', '==', 'live')
      .get();

    const auctions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      count: auctions.length,
      auctions
    });

  } catch (error) {
    console.error('❌ Error fetching live auctions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update auction status
 */
export const updateAuctionStatus = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { status } = req.body;

    if (!auctionId || !status) {
      return res.status(400).json({
        success: false,
        error: 'auctionId and status are required'
      });
    }

    if (!['upcoming', 'live', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be: upcoming, live, or completed'
      });
    }

    const auctionRef = db.collection('auctions').doc(auctionId);
    const auctionDoc = await auctionRef.get();

    if (!auctionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    await auctionRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    const updatedAuction = {
      id: auctionDoc.id,
      ...auctionDoc.data(),
      status,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ [AUCTION_STATUS_UPDATED]', {
      auctionId,
      newStatus: status
    });

    res.json({
      success: true,
      message: `Auction status updated to ${status}`,
      auction: updatedAuction
    });

  } catch (error) {
    console.error('❌ Error updating auction status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update auction teams and players
 */
export const updateAuctionTeamsAndPlayers = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { participatingTeams, playerPool } = req.body;

    if (!auctionId) {
      return res.status(400).json({
        success: false,
        error: 'auctionId is required'
      });
    }

    const auctionRef = db.collection('auctions').doc(auctionId);
    const auctionDoc = await auctionRef.get();

    if (!auctionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (Array.isArray(participatingTeams)) {
      updateData.participatingTeams = participatingTeams;
    }

    if (Array.isArray(playerPool)) {
      updateData.playerPool = playerPool;
    }

    await auctionRef.update(updateData);

    const updatedAuction = {
      id: auctionDoc.id,
      ...auctionDoc.data(),
      ...updateData
    };

    res.json({
      success: true,
      message: 'Auction teams and players updated',
      auction: updatedAuction
    });

  } catch (error) {
    console.error('❌ Error updating auction teams and players:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update auction settings
 */
export const updateAuctionSettings = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { settings } = req.body;

    if (!auctionId || !settings) {
      return res.status(400).json({
        success: false,
        error: 'auctionId and settings are required'
      });
    }

    const auctionRef = db.collection('auctions').doc(auctionId);
    const auctionDoc = await auctionRef.get();

    if (!auctionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    await auctionRef.update({
      settings: {
        ...auctionDoc.data().settings,
        ...settings
      },
      updatedAt: new Date().toISOString()
    });

    const updatedAuction = {
      id: auctionDoc.id,
      ...auctionDoc.data(),
      settings: {
        ...auctionDoc.data().settings,
        ...settings
      },
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Auction settings updated',
      auction: updatedAuction
    });

  } catch (error) {
    console.error('❌ Error updating auction settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
