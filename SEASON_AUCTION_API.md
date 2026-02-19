# Season & Auction API Documentation

## Overview
The season-specific auction system allows auctioneers to create and manage auctions within specific seasons.

**Key Constraint:** One auction per season (enforced at database level)

---

## Season Endpoints

### Create Season
```
POST /api/seasons
```

**Request Body:**
```json
{
  "sport": "cricket",
  "name": "IPL 2024",
  "year": 2024,
  "status": "upcoming",
  "startDate": "2024-03-23",
  "endDate": "2024-05-26"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Season created successfully",
  "season": {
    "id": "season_abc123",
    "sport": "cricket",
    "name": "IPL 2024",
    "year": 2024,
    "status": "upcoming",
    "uniqueKey": "cricket_2024",
    "startDate": "2024-03-23",
    "endDate": "2024-05-26",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Error (409 - Conflict):**
```json
{
  "success": false,
  "error": "Season with sport 'cricket' and year 2024 already exists"
}
```

---

### Get All Seasons for a Sport
```
GET /api/seasons/sport/:sport
```

**Example:** `GET /api/seasons/sport/cricket`

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "seasons": [
    {
      "id": "season_abc123",
      "sport": "cricket",
      "name": "IPL 2024",
      "year": 2024,
      "status": "active",
      "uniqueKey": "cricket_2024",
      ...
    }
  ]
}
```

---

### Get Active Seasons
```
GET /api/seasons/active
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "seasons": [
    {
      "id": "season_xyz789",
      "sport": "football",
      "name": "Premier League 2024",
      "year": 2024,
      "status": "active",
      ...
    }
  ]
}
```

---

### Get Season by ID
```
GET /api/seasons/:seasonId
```

**Example:** `GET /api/seasons/season_abc123`

**Response (200):**
```json
{
  "success": true,
  "auction": {
    "id": "season_abc123",
    "sport": "cricket",
    "name": "IPL 2024",
    ...
  }
}
```

---

### Update Season Status
```
PATCH /api/seasons/:seasonId/status
```

**Request Body:**
```json
{
  "status": "active"
}
```

**Valid Status Values:** `upcoming`, `active`, `completed`

**Response (200):**
```json
{
  "success": true,
  "message": "Season status updated to active",
  "season": {
    "id": "season_abc123",
    "status": "active",
    "updatedAt": "2024-01-02T10:00:00Z",
    ...
  }
}
```

---

## Auction Endpoints

### Create Auction (Season-Specific)
```
POST /api/auction-seasons
```

**Request Body:**
```json
{
  "seasonId": "season_abc123",
  "sport": "cricket",
  "name": "IPL 2024 Auction",
  "status": "upcoming",
  "participatingTeams": [
    "CSK",
    "DC",
    "KKR",
    "MI",
    "RCB",
    "RR",
    "SRH",
    "GT",
    "LSG",
    "PBKS"
  ],
  "playerPool": [],
  "settings": {
    "minBidIncrement": 100000,
    "maxPlayersPerTeam": 25,
    "bidTimeLimit": 60
  },
  "scheduledStartTime": "2024-03-23T18:00:00Z",
  "scheduledEndTime": "2024-03-24T02:00:00Z",
  "assignedAuctioneerId": "auctioneer_123",
  "assignedAuctioneerName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Auction created successfully",
  "auction": {
    "id": "auction_def456",
    "seasonId": "season_abc123",
    "sport": "cricket",
    "name": "IPL 2024 Auction",
    "status": "upcoming",
    "participatingTeams": [...],
    "playerPool": [],
    "settings": {...},
    "stats": {
      "playersAuctioned": 0,
      "playersSold": 0,
      "playersUnsold": 0,
      "totalSpent": 0
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

**Error (409 - One Auction Per Season):**
```json
{
  "success": false,
  "error": "An auction already exists for this season. Only one auction per season is allowed.",
  "existingAuctionId": "auction_existing_id",
  "existingAuction": {...}
}
```

---

### Get Auction by ID
```
GET /api/auction-seasons/:auctionId
```

**Example:** `GET /api/auction-seasons/auction_def456`

**Response (200):**
```json
{
  "success": true,
  "auction": {
    "id": "auction_def456",
    ...
  }
}
```

---

### Get Auction for a Season
```
GET /api/auction-seasons/season/:seasonId
```

**Example:** `GET /api/auction-seasons/season/season_abc123`

**Response (200):**
```json
{
  "success": true,
  "auction": {
    "id": "auction_def456",
    "seasonId": "season_abc123",
    ...
  }
}
```

**Error (404 - No Auction for Season):**
```json
{
  "success": false,
  "error": "No auction found for season season_abc123"
}
```

---

### Get All Auctions for a Sport
```
GET /api/auction-seasons/sport/:sport
```

**Example:** `GET /api/auction-seasons/sport/cricket`

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "auctions": [
    {
      "id": "auction_def456",
      "sport": "cricket",
      ...
    }
  ]
}
```

---

### Get Live Auctions
```
GET /api/auction-seasons/live
```

**Response (200):**
```json
{
  "success": true,
  "count": 1,
  "auctions": [
    {
      "id": "auction_def456",
      "status": "live",
      ...
    }
  ]
}
```

---

### Update Auction Status
```
PATCH /api/auction-seasons/:auctionId/status
```

**Request Body:**
```json
{
  "status": "live"
}
```

**Valid Status Values:** `upcoming`, `live`, `completed`

**Response (200):**
```json
{
  "success": true,
  "message": "Auction status updated to live",
  "auction": {
    "id": "auction_def456",
    "status": "live",
    "updatedAt": "2024-01-02T10:00:00Z",
    ...
  }
}
```

---

### Update Auction Teams & Players
```
PATCH /api/auction-seasons/:auctionId/teams-players
```

**Request Body:**
```json
{
  "participatingTeams": ["CSK", "DC", "KKR"],
  "playerPool": [
    {
      "id": "player_1",
      "name": "Virat Kohli",
      "basePrice": 20000000
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Auction teams and players updated",
  "auction": {
    "id": "auction_def456",
    "participatingTeams": ["CSK", "DC", "KKR"],
    "playerPool": [...],
    "updatedAt": "2024-01-02T10:00:00Z",
    ...
  }
}
```

---

### Update Auction Settings
```
PATCH /api/auction-seasons/:auctionId/settings
```

**Request Body:**
```json
{
  "settings": {
    "minBidIncrement": 200000,
    "maxPlayersPerTeam": 25,
    "bidTimeLimit": 90
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Auction settings updated",
  "auction": {
    "id": "auction_def456",
    "settings": {
      "minBidIncrement": 200000,
      "maxPlayersPerTeam": 25,
      "bidTimeLimit": 90
    },
    "updatedAt": "2024-01-02T10:00:00Z",
    ...
  }
}
```

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created successfully |
| 200 | Success |
| 400 | Bad request (validation error) |
| 404 | Not found |
| 409 | Conflict (uniqueness constraint violation) |
| 500 | Server error |

---

## Usage Flow

### Step 1: Create a Season
```bash
POST /api/seasons
{
  "sport": "cricket",
  "name": "IPL 2024",
  "year": 2024,
  "status": "upcoming"
}
```

### Step 2: Create an Auction for that Season
```bash
POST /api/auction-seasons
{
  "seasonId": "season_abc123",
  "sport": "cricket",
  "name": "IPL 2024 Auction",
  "status": "upcoming"
}
```
⚠️ **Note:** An error (409) will be returned if you try to create a second auction for the same season.

### Step 3: Update Season Status (When Ready to Start)
```bash
PATCH /api/seasons/season_abc123/status
{
  "status": "active"
}
```

### Step 4: Update Auction Status (When Starting the Auction)
```bash
PATCH /api/auction-seasons/auction_def456/status
{
  "status": "live"
}
```

### Step 5: Update Auction Teams & Players
```bash
PATCH /api/auction-seasons/auction_def456/teams-players
{
  "participatingTeams": ["CSK", "DC"],
  "playerPool": [...]
}
```

---

## Frontend Integration (React)

### Create Season
```typescript
const createSeason = async (sportData: {sport: string, name: string, year: number}) => {
  const response = await fetch('/api/seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sportData)
  });
  return response.json();
};
```

### Create Auction
```typescript
const createAuction = async (auctionData: {seasonId: string, sport: string, name: string}) => {
  const response = await fetch('/api/auction-seasons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auctionData)
  });
  return response.json();
};
```

### Get Seasons by Sport
```typescript
const getSeasonsBySport = async (sport: string) => {
  const response = await fetch(`/api/seasons/sport/${sport}`);
  return response.json();
};
```

### Get Auction for Season
```typescript
const getAuctionBySeasonId = async (seasonId: string) => {
  const response = await fetch(`/api/auction-seasons/season/${seasonId}`);
  return response.json();
};
```
