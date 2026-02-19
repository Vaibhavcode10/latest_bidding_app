/**
 * Season Controller
 * Handles season creation, retrieval, and management
 */

import { db } from '../firebase.js';
import { getSeasonUniqueKey, createSeasonDocument } from '../models/Season.js';

/**
 * Create a new season
 * Enforces uniqueness constraint: (sport, year)
 * Only one season can exist per sport per year
 */
export const createSeason = async (req, res) => {
  try {
    const { sport, name, year, status, startDate, endDate } = req.body;

    // ✅ Validate required fields
    if (!sport || !name || year === undefined || year === null) {
      return res.status(400).json({
        success: false,
        error: 'sport, name, and year are required'
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

    // ✅ Validate year (should be reasonable)
    if (typeof year !== 'number' || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Year must be a number between 2000 and 2100'
      });
    }

    // ✅ Validate status if provided
    if (status && !['upcoming', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be: upcoming, active, or completed'
      });
    }

    // 🔒 CHECK UNIQUENESS CONSTRAINT: (sport, year)
    const uniqueKey = getSeasonUniqueKey(sport, year);
    const existingSeasonQuery = await db
      .collection('seasons')
      .where('uniqueKey', '==', uniqueKey)
      .limit(1)
      .get();

    if (!existingSeasonQuery.empty) {
      return res.status(409).json({
        success: false,
        error: `Season already exists for ${sport} in year ${year}`,
        existingSeasonId: existingSeasonQuery.docs[0].id,
        existingSeason: existingSeasonQuery.docs[0].data()
      });
    }

    // 📝 Create new season document
    const seasonData = createSeasonDocument({
      sport,
      name,
      year,
      status: status || 'upcoming',
      startDate,
      endDate
    });

    // 💾 Save to Firestore
    const seasonRef = await db.collection('seasons').add(seasonData);

    const createdSeason = {
      id: seasonRef.id,
      ...seasonData
    };

    console.log('✅ [SEASON_CREATED]', {
      seasonId: seasonRef.id,
      sport,
      name,
      year,
      status: seasonData.status
    });

    res.status(201).json({
      success: true,
      message: 'Season created successfully',
      season: createdSeason
    });

  } catch (error) {
    console.error('❌ Error creating season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get season by ID
 */
export const getSeasonById = async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId is required'
      });
    }

    const seasonDoc = await db.collection('seasons').doc(seasonId).get();

    if (!seasonDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    res.json({
      success: true,
      season: {
        id: seasonDoc.id,
        ...seasonDoc.data()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all seasons for a sport
 */
export const getSeasonsBySport = async (req, res) => {
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
      .collection('seasons')
      .where('sport', '==', sport)
      .orderBy('year', 'desc')
      .get();

    const seasons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      count: seasons.length,
      seasons
    });

  } catch (error) {
    console.error('❌ Error fetching seasons:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get active seasons
 */
export const getActiveSeasons = async (req, res) => {
  try {
    const snapshot = await db
      .collection('seasons')
      .where('status', '==', 'active')
      .orderBy('year', 'desc')
      .get();

    const seasons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      count: seasons.length,
      seasons
    });

  } catch (error) {
    console.error('❌ Error fetching active seasons:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update season status
 */
export const updateSeasonStatus = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { status } = req.body;

    if (!seasonId || !status) {
      return res.status(400).json({
        success: false,
        error: 'seasonId and status are required'
      });
    }

    if (!['upcoming', 'active', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be: upcoming, active, or completed'
      });
    }

    const seasonRef = db.collection('seasons').doc(seasonId);
    const seasonDoc = await seasonRef.get();

    if (!seasonDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    await seasonRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    const updatedSeason = {
      id: seasonDoc.id,
      ...seasonDoc.data(),
      status,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: `Season status updated to ${status}`,
      season: updatedSeason
    });

  } catch (error) {
    console.error('❌ Error updating season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
