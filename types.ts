export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  UP_NEXT = 'UP_NEXT'
}

// Legacy auction status (for backward compatibility)
export enum AuctionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED'
}

// New live auction states for player bidding
export enum LiveAuctionState {
  IDLE = 'IDLE',           // No player being auctioned
  READY = 'READY',         // Player selected, waiting to start
  LIVE = 'LIVE',           // Bidding in progress
  PAUSED = 'PAUSED',       // Bidding temporarily paused
  SOLD = 'SOLD',           // Player sold, finalizing
  COMPLETED = 'COMPLETED'  // Auction session completed
}

// Bid slab configuration for price increments
export interface BidSlab {
  maxPrice: number;        // Upper bound (in crores) - use Infinity for last slab
  increment: number;       // Increment amount (in crores)
}

// Default slab configuration
export const DEFAULT_BID_SLABS: BidSlab[] = [
  { maxPrice: 10.0, increment: 0.25 },
  { maxPrice: 20.0, increment: 0.50 },
  { maxPrice: Infinity, increment: 1.0 }
];

// Individual bid entry in the ledger
export interface BidEntry {
  id: string;
  teamId: string;
  teamName: string;
  bidAmount: number;
  timestamp: string;
  isJumpBid: boolean;
}

// Temp auction ledger - single source of truth during live auction
export interface TempAuctionLedger {
  auctionId: string;
  sport: string;
  playerId: string;
  playerName: string;
  basePrice: number;
  currentBid: number;
  highestBidder: {
    teamId: string;
    teamName: string;
  } | null;
  bidHistory: BidEntry[];
  lastBidTimestamp: string | null;
  consecutiveBidCount: Record<string, number>;  // teamId -> consecutive count
  state: LiveAuctionState;
  timerStartedAt: string | null;
  timerDuration: number;  // in seconds (default 20)
  bidSlabs: BidSlab[];
  createdAt: string;
  updatedAt: string;
}

// Live auction session configuration
export interface LiveAuctionSession {
  id: string;
  sport: string;
  name: string;
  auctioneerId: string;
  auctioneerName: string;
  teamIds: string[];
  playerPool: string[];           // Player IDs available for auction
  completedPlayerIds: string[];   // Already auctioned
  currentLedger: TempAuctionLedger | null;
  bidSlabs: BidSlab[];
  timerDuration: number;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

// Auctioneer - neutral controller (NOT tied to team)
export interface Auctioneer {
  id: string;
  username: string;
  email: string;
  password?: string;  // Only for auth, not returned in responses
  name: string;
  phone?: string;
  sport: string;
  profilePicture?: string;
  createdAt: string;
  active: boolean;
  // NOTE: No teamIds or franchiseId - auctioneer is neutral
}

// User interface for authentication
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  password?: string;  // Optional in responses for security
  role: 'admin' | 'player' | 'auctioneer';
  sport?: string;  // Required for players and auctioneers
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  userId?: string;  // Links to user record for authentication
  name: string;
  sport: string;
  role: string;
  basePrice?: number;  // Made optional, can be set later by player
  currentBid: number;
  soldPrice?: number;
  status: PlayerStatus;
  teamId?: string;
  imageUrl?: string;
  verified?: boolean;
  verificationRequestedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  logoUrl?: string;
}

export interface AuctionSession {
  id: string;
  sport: string;
  name: string;
  date: string;
  status: AuctionStatus;
  activePlayerId?: string;
  bidIncrement: number;
  teamIds: string[];
}

export type EntityType = 'players' | 'teams' | 'auction';

export enum BiddingRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ADDED_TO_AUCTION = 'ADDED_TO_AUCTION'
}

export interface BiddingRequest {
  id: string;
  playerId: string;
  playerName: string;
  sport: string;
  role: string;
  basePrice?: number;  // Made optional
  status: BiddingRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  auctionId?: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  name: string;
  sport: string;
  role: string;
  jersey?: number;
  height?: string;
  weight?: string;
  age?: number;
  basePrice?: number;  // Made optional, can be set by player
  bio?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  biddingRequestStatus?: BiddingRequestStatus;
}

export interface BidEvent {
  id: string;
  sport: string;
  name: string;
  date: string;
  status: AuctionStatus;
  teams: Team[];
  currentPlayer?: Player;
  bidIncrement: number;
}

// Result of a completed player auction
export interface PlayerAuctionResult {
  playerId: string;
  playerName: string;
  sport: string;
  auctionId: string;
  basePrice: number;
  finalPrice: number | null;
  winningTeam: {
    teamId: string;
    teamName: string;
  } | null;
  status: 'SOLD' | 'UNSOLD';
  bidHistory: BidEntry[];
  totalBids: number;
  auctionedAt: string;
  auctionedBy: string;  // Auctioneer ID
}

// API response types for live auction
export interface LiveAuctionStateResponse {
  success: boolean;
  session: LiveAuctionSession | null;
  ledger: TempAuctionLedger | null;
  teams: Team[];
  currentPlayer: Player | null;
  error?: string;
}

export interface BidResponse {
  success: boolean;
  ledger?: TempAuctionLedger;
  error?: string;
  nextValidBid?: number;
}