/**
 * Season Routes
 * Endpoints for managing sports seasons
 */

import express from 'express';
import {
  createSeason,
  getSeasonById,
  getSeasonsBySport,
  getActiveSeasons,
  updateSeasonStatus
} from './seasonController.js';

const router = express.Router();

/**
 * POST /seasons
 * Create a new season
 * Body: { sport, name, year, status?, startDate?, endDate? }
 */
router.post('/', createSeason);

/**
 * GET /seasons/active
 * Get all active seasons (must be before /:seasonId route)
 */
router.get('/active', getActiveSeasons);

/**
 * GET /seasons/sport/:sport
 * Get all seasons for a specific sport
 */
router.get('/sport/:sport', getSeasonsBySport);

/**
 * GET /seasons/:seasonId
 * Get a specific season by ID
 */
router.get('/:seasonId', getSeasonById);

/**
 * PATCH /seasons/:seasonId/status
 * Update season status
 * Body: { status }
 */
router.patch('/:seasonId/status', updateSeasonStatus);

export default router;
