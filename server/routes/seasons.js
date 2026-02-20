/**
 * Season Routes
 * Endpoints for managing seasons and their associated actions/auctions
 */

import express from 'express';
import {
  createSeason,
  getSeasonById,
  getSeasonsBySport,
  getAllSeasons,
  updateSeason,
  deleteSeason,
  addActionToSeason,
  removeActionFromSeason
} from '../dataStore.js';

const router = express.Router();

/**
 * POST /seasons
 * Create a new season
 * Body: { 
 *   sport, 
 *   name, 
 *   year, 
 *   startDate, 
 *   endDate, 
 *   description?, 
 *   details?,
 *   createdBy,
 *   userRole (must be 'admin')
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { sport, name, year, startDate, endDate, description, details, createdBy, userRole } = req.body;

    // Verify admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can create seasons' });
    }

    // Validate required fields
    if (!sport || !name || !year || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'sport, name, year, startDate, and endDate are required' 
      });
    }

    // Validate sport enum
    const validSports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport. Must be one of: ${validSports.join(', ')}`
      });
    }

    // Validate year is a number
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year. Must be between 1900 and 2100'
      });
    }

    const seasonData = {
      sport,
      name,
      year: yearNum,
      startDate,
      endDate,
      description: description || '',
      details: details || {},
      actionIds: [], // Initially empty array of action/auction IDs
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdSeason = await createSeason(seasonData);

    console.log('✅ [SEASON_CREATED]', {
      seasonId: createdSeason.id,
      sport,
      name,
      year: yearNum
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
});

/**
 * GET /seasons/sport/:sport
 * Get all seasons for a specific sport
 * NOTE: This must come BEFORE /:seasonId to avoid route matching conflict
 */
router.get('/sport/:sport', async (req, res) => {
  try {
    const { sport } = req.params;

    const validSports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport. Must be one of: ${validSports.join(', ')}`
      });
    }

    const seasons = await getSeasonsBySport(sport);

    res.json({
      success: true,
      count: seasons.length,
      seasons
    });
  } catch (error) {
    console.error('❌ Error fetching seasons by sport:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /seasons
 * Get all seasons across all sports
 */
router.get('/', async (req, res) => {
  try {
    const seasons = await getAllSeasons();

    res.json({
      success: true,
      count: seasons.length,
      seasons
    });
  } catch (error) {
    console.error('❌ Error fetching all seasons:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /seasons/:seasonId
 * Get a specific season by ID
 * NOTE: This must come AFTER /sport/:sport and / routes
 */
router.get('/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId is required'
      });
    }

    const season = await getSeasonById(seasonId);

    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    res.json({
      success: true,
      season
    });
  } catch (error) {
    console.error('❌ Error fetching season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /seasons/:seasonId
 * Update a season
 * Body: { name?, year?, startDate?, endDate?, description?, details?, userRole (must be 'admin') }
 */
router.put('/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { name, year, startDate, endDate, description, details, userRole } = req.body;

    // Verify admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can update seasons' });
    }

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId is required'
      });
    }

    const season = await getSeasonById(seasonId);
    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    // Build updates object
    const updates = {};
    if (name) updates.name = name;
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        return res.status(400).json({ success: false, error: 'Invalid year format' });
      }
      updates.year = yearNum;
    }
    if (startDate) updates.startDate = startDate;
    if (endDate) updates.endDate = endDate;
    if (description !== undefined) updates.description = description;
    if (details) updates.details = { ...season.details, ...details };

    updates.updatedAt = new Date().toISOString();

    const updatedSeason = await updateSeason(seasonId, updates);

    console.log('✅ [SEASON_UPDATED]', {
      seasonId,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Season updated successfully',
      season: updatedSeason
    });
  } catch (error) {
    console.error('❌ Error updating season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /seasons/:seasonId
 * Delete a season (also should remove from all associated auctions)
 */
router.delete('/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { userRole } = req.query;

    // Verify admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can delete seasons' });
    }

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId is required'
      });
    }

    const season = await getSeasonById(seasonId);
    if (!season) {
      return res.status(404).json({
        success: false,
        error: 'Season not found'
      });
    }

    const deletedSeason = await deleteSeason(seasonId);

    console.log('✅ [SEASON_DELETED]', {
      seasonId,
      seasonName: season.name,
      actionsCount: season.actionIds?.length || 0
    });

    res.json({
      success: true,
      message: 'Season deleted successfully',
      season: deletedSeason
    });
  } catch (error) {
    console.error('❌ Error deleting season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /seasons/:seasonId/actions/:actionId
 * Add an action/auction to a season
 */
router.post('/:seasonId/actions/:actionId', async (req, res) => {
  try {
    const { seasonId, actionId } = req.params;
    const { userRole } = req.body;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can add actions to seasons' });
    }

    if (!seasonId || !actionId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId and actionId are required'
      });
    }

    const season = await addActionToSeason(seasonId, actionId);

    console.log('✅ [ACTION_ADDED_TO_SEASON]', {
      seasonId,
      actionId,
      totalActions: season.actionIds?.length || 0
    });

    res.json({
      success: true,
      message: 'Action added to season successfully',
      season
    });
  } catch (error) {
    console.error('❌ Error adding action to season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /seasons/:seasonId/actions/:actionId
 * Remove an action/auction from a season
 */
router.delete('/:seasonId/actions/:actionId', async (req, res) => {
  try {
    const { seasonId, actionId } = req.params;
    const { userRole } = req.query;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can remove actions from seasons' });
    }

    if (!seasonId || !actionId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId and actionId are required'
      });
    }

    const season = await removeActionFromSeason(seasonId, actionId);

    console.log('✅ [ACTION_REMOVED_FROM_SEASON]', {
      seasonId,
      actionId,
      remainingActions: season.actionIds?.length || 0
    });

    res.json({
      success: true,
      message: 'Action removed from season successfully',
      season
    });
  } catch (error) {
    console.error('❌ Error removing action from season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
