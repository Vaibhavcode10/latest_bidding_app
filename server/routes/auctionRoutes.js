/**
 * Auction Routes
 * Endpoints for managing auctions (season-specific)
 */

import express from 'express';
import {
  createAuction,
  getAuctionById,
  getAuctionBySeasonId,
  getAuctionsBySport,
  getLiveAuctions,
  updateAuctionStatus,
  updateAuctionTeamsAndPlayers,
  updateAuctionSettings
} from './auctionController.js';

const router = express.Router();

/**
 * POST /auctions
 * Create a new auction for a season
 * Body: { seasonId, sport, name, status?, participatingTeams?, playerPool?, settings?, scheduledStartTime?, scheduledEndTime?, assignedAuctioneerId?, assignedAuctioneerName? }
 * Note: Enforces one-auction-per-season constraint
 */
router.post('/', createAuction);

/**
 * GET /auctions/live
 * Get all live auctions (must be before /:auctionId route)
 */
router.get('/live', getLiveAuctions);

/**
 * GET /auctions/sport/:sport
 * Get all auctions for a specific sport
 */
router.get('/sport/:sport', getAuctionsBySport);

/**
 * GET /auctions/season/:seasonId
 * Get auction for a specific season
 */
router.get('/season/:seasonId', getAuctionBySeasonId);

/**
 * GET /auctions/:auctionId
 * Get a specific auction by ID
 */
router.get('/:auctionId', getAuctionById);

/**
 * PATCH /auctions/:auctionId/status
 * Update auction status
 * Body: { status }
 */
router.patch('/:auctionId/status', updateAuctionStatus);

/**
 * PATCH /auctions/:auctionId/teams-players
 * Update participating teams and player pool
 * Body: { participatingTeams?, playerPool? }
 */
router.patch('/:auctionId/teams-players', updateAuctionTeamsAndPlayers);

/**
 * PATCH /auctions/:auctionId/settings
 * Update auction settings
 * Body: { settings }
 */
router.patch('/:auctionId/settings', updateAuctionSettings);

export default router;
