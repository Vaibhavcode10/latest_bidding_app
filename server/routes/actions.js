/**
 * Action Routes (Auctions)
 * Endpoints for managing actions/auctions and their association with seasons
 */

import express from 'express';
import {
  createAction,
  getActionById,
  getActionsBySeasonId,
  getActionsBySport,
  updateAction,
  deleteAction,
  getPlayersBySport,
  getTeamsBySport,
  getAuctioneersBySport
} from '../dataStore.js';

const router = express.Router();

/**
 * POST /actions
 * Create a new action/auction for a season
 * Body: {
 *   seasonId,
 *   sport,
 *   name,
 *   description?,
 *   participatingTeams,      // Array of { id, name, logoUrl, purseRemaining, totalPurse }
 *   playerPool,               // Array of player IDs
 *   assignedAuctioneerId,
 *   assignedAuctioneerName,
 *   settings?,
 *   createdBy,
 *   userRole (must be 'admin')
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      seasonId,
      sport,
      name,
      description,
      participatingTeams,
      playerPool,
      assignedAuctioneerId,
      assignedAuctioneerName,
      settings,
      createdBy,
      userRole
    } = req.body;

    // Verify admin only
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can create actions' });
    }

    // Validate required fields
    if (!seasonId || !sport || !name) {
      return res.status(400).json({
        success: false,
        error: 'seasonId, sport, and name are required'
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

    // Validate participating teams and player pool
    if (!Array.isArray(participatingTeams) || participatingTeams.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one team must be selected'
      });
    }

    if (!Array.isArray(playerPool) || playerPool.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one player must be added to the player pool'
      });
    }

    if (!assignedAuctioneerId) {
      return res.status(400).json({
        success: false,
        error: 'An auctioneer must be assigned'
      });
    }

    const actionData = {
      seasonId,
      sport,
      name,
      description: description || '',
      participatingTeams,
      playerPool,
      completedPlayerIds: [],
      assignedAuctioneer: {
        id: assignedAuctioneerId,
        name: assignedAuctioneerName || 'Unknown Auctioneer'
      },
      status: 'CREATED',  // CREATED -> READY -> LIVE -> COMPLETED
      settings: settings || {
        minBidIncrement: 100000,
        maxPlayersPerTeam: 15,
        bidTimeLimit: 30
      },
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create the action
    const createdAction = await createAction(actionData);

    console.log('✅ [ACTION_CREATED]', {
      actionId: createdAction.id,
      seasonId,
      sport,
      name,
      teamsCount: participatingTeams.length,
      playersCount: playerPool.length
    });

    res.status(201).json({
      success: true,
      message: 'Action created successfully',
      action: createdAction
    });
  } catch (error) {
    console.error('❌ Error creating action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /actions/:actionId
 * Get a specific action by ID
 */
router.get('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;

    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: 'actionId is required'
      });
    }

    const action = await getActionById(actionId);

    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    res.json({
      success: true,
      action
    });
  } catch (error) {
    console.error('❌ Error fetching action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /actions/season/:seasonId
 * Get all actions for a specific season
 */
router.get('/season/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        error: 'seasonId is required'
      });
    }

    const actions = await getActionsBySeasonId(seasonId);

    res.json({
      success: true,
      count: actions.length,
      actions
    });
  } catch (error) {
    console.error('❌ Error fetching actions by season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /actions/sport/:sport
 * Get all actions for a specific sport
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

    const actions = await getActionsBySport(sport);

    res.json({
      success: true,
      count: actions.length,
      actions
    });
  } catch (error) {
    console.error('❌ Error fetching actions by sport:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /actions/:actionId
 * Update an action
 */
router.put('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const { name, description, status, settings, userRole } = req.body;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can update actions' });
    }

    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: 'actionId is required'
      });
    }

    const action = await getActionById(actionId);
    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;
    if (settings) updates.settings = { ...action.settings, ...settings };

    updates.updatedAt = new Date().toISOString();

    const updatedAction = await updateAction(actionId, updates);

    console.log('✅ [ACTION_UPDATED]', { actionId, updates: Object.keys(updates) });

    res.json({
      success: true,
      message: 'Action updated successfully',
      action: updatedAction
    });
  } catch (error) {
    console.error('❌ Error updating action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /actions/:actionId
 * Delete an action
 */
router.delete('/:actionId', async (req, res) => {
  try {
    const { actionId } = req.params;
    const { userRole } = req.query;

    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can delete actions' });
    }

    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: 'actionId is required'
      });
    }

    const action = await getActionById(actionId);
    if (!action) {
      return res.status(404).json({
        success: false,
        error: 'Action not found'
      });
    }

    const deletedAction = await deleteAction(actionId);

    console.log('✅ [ACTION_DELETED]', {
      actionId,
      name: action.name,
      seasonId: action.seasonId
    });

    res.json({
      success: true,
      message: 'Action deleted successfully',
      action: deletedAction
    });
  } catch (error) {
    console.error('❌ Error deleting action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /actions/sport/:sport/data
 * Get all required data for creating an action in a sport
 * Returns: teams, players, auctioneers
 */
router.get('/:sport/data', async (req, res) => {
  try {
    const { sport } = req.params;

    const validSports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];
    if (!validSports.includes(sport)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sport. Must be one of: ${validSports.join(', ')}`
      });
    }

    // Fetch all required data in parallel
    const [teams, players, auctioneers] = await Promise.all([
      getTeamsBySport(sport),
      getPlayersBySport(sport),
      getAuctioneersBySport(sport)
    ]);

    res.json({
      success: true,
      data: {
        teams,
        players: players.filter(p => p.status === 'AVAILABLE' || !p.status),  // Only available players
        auctioneers
      }
    });
  } catch (error) {
    console.error('❌ Error fetching action data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
