export enum PlayerStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  UP_NEXT = 'UP_NEXT'
}

export enum AuctionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED'
}

export interface Player {
  id: string;
  name: string;
  sport: string;
  role: string;
  basePrice: number;
  currentBid: number;
  soldPrice?: number;
  status: PlayerStatus;
  teamId?: string;
  imageUrl?: string;
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