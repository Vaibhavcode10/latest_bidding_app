import { db } from './firebase.js';
import admin from 'firebase-admin';

// Collection names following the new naming convention
export const COLLECTIONS = {
  USERS: 'sportbid_users',
  PLAYERS: 'sportbid_players',
  FRANCHISES: 'sportbid_franchises',
  AUCTIONS: 'sportbid_auctions',
  LIVE_SESSIONS: 'sportbid_live_sessions',
  BIDS: 'sportbid_bids',
  HISTORY: 'sportbid_history'
};

// Export db for transaction usage
export { db };

// Firestore transaction helper for atomic operations
export const runTransaction = async (operation) => {
  return await db.runTransaction(operation);
};

// Atomic bid validation and creation (prevents race conditions)
export const createBidAtomic = async (sessionId, bidData, validationRules) => {
  return await db.runTransaction(async (transaction) => {
    console.log(`⚡ [FIRESTORE TRANSACTION] Atomic bid creation for session: ${sessionId}`);
    
    // Read current session state
    const sessionRef = db.collection(COLLECTIONS.LIVE_SESSIONS).doc(sessionId);
    const sessionDoc = await transaction.get(sessionRef);
    
    if (!sessionDoc.exists) {
      throw new Error('Session not found');
    }
    
    const currentSession = sessionDoc.data();
    
    // Validate bid rules within transaction
    if (validationRules) {
      const isValid = await validationRules(currentSession, bidData);
      if (!isValid) {
        throw new Error('Bid validation failed');
      }
    }
    
    // Create bid document
    const bidRef = db.collection(COLLECTIONS.BIDS).doc();
    transaction.set(bidRef, {
      ...bidData,
      timestamp: new Date().toISOString()
    });
    
    // Update session with new bid
    transaction.update(sessionRef, {
      currentBid: bidData.bidAmount,
      highestBidder: { teamId: bidData.teamId, teamName: bidData.teamName },
      lastBidTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ [FIRESTORE TRANSACTION] Atomic bid creation completed`);
    return { id: bidRef.id, ...bidData };
  });
};

// Helper function to convert Firestore document to plain object
const docToObject = (doc) => {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// Helper function to convert Firestore query snapshot to array of objects
const snapshotToArray = (snapshot) => {
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Player operations
export const getPlayersBySport = async (sport) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.PLAYERS)
      .where('sport', '==', sport)
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting players by sport:', error);
    throw error;
  }
};

export const createPlayer = async (player) => {
  try {
    console.log('📝 [FIRESTORE] Creating player with data:', {
      name: player.name,
      sport: player.sport,
      basePrice: player.basePrice,
      basePriceType: typeof player.basePrice,
      fullObject: player
    });
    
    // Ensure all fields including basePrice are explicitly included
    const playerData = {
      name: player.name || '',
      sport: player.sport || '',
      role: player.role || 'all-rounder',
      basePrice: Number(player.basePrice) || 30000000,  // Default to 30M raw = 3 CR (auction format)
      currentBid: Number(player.currentBid) || 0,
      status: player.status || 'AVAILABLE',
      auctionPrice: player.auctionPrice || null,
      soldTo: player.soldTo || null,
      imageUrl: player.imageUrl || null,
      userId: player.userId || null,
      verified: player.verified || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📤 [FIRESTORE] Clean player data to send:', playerData);
    
    const docRef = await db.collection(COLLECTIONS.PLAYERS).add(playerData);
    
    const result = { id: docRef.id, ...playerData };
    console.log('✅ [FIRESTORE] Player created successfully with ID:', docRef.id, 'basePrice:', result.basePrice);
    
    // Verify data was stored
    const storedDoc = await db.collection(COLLECTIONS.PLAYERS).doc(docRef.id).get();
    console.log('🔍 [FIRESTORE] Verification - Stored data:', storedDoc.data());
    
    return result;
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
};

export const updatePlayer = async (id, updates) => {
  try {
    console.log(`🔄 [FIRESTORE] Updating player ${id} with:`, updates);
    await db.collection(COLLECTIONS.PLAYERS).doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    const updatedDoc = await db.collection(COLLECTIONS.PLAYERS).doc(id).get();
    const result = docToObject(updatedDoc);
    console.log(`✅ [FIRESTORE] Player ${id} updated successfully. New status: ${result.status}, soldPrice: ${result.soldPrice}`);
    return result;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const getPlayerById = async (id) => {
  try {
    const doc = await db.collection(COLLECTIONS.PLAYERS).doc(id).get();
    return docToObject(doc);
  } catch (error) {
    console.error('Error getting player by ID:', error);
    throw error;
  }
};

export const deletePlayer = async (id) => {
  try {
    await db.collection(COLLECTIONS.PLAYERS).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await db.collection(COLLECTIONS.USERS).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Franchise operations
export const getFranchisesBySport = async (sport) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.FRANCHISES)
      .where('sport', '==', sport)
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting franchises by sport:', error);
    throw error;
  }
};

export const createFranchise = async (franchise) => {
  try {
    const docRef = await db.collection(COLLECTIONS.FRANCHISES).add({
      ...franchise,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...franchise };
  } catch (error) {
    console.error('Error creating franchise:', error);
    throw error;
  }
};

export const updateFranchise = async (id, updates) => {
  try {
    console.log(`💰 [FIRESTORE] Updating franchise ${id} with:`, updates);
    await db.collection(COLLECTIONS.FRANCHISES).doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    const updatedDoc = await db.collection(COLLECTIONS.FRANCHISES).doc(id).get();
    const result = docToObject(updatedDoc);
    console.log(`✅ [FIRESTORE] Franchise ${id} updated. Budget remaining: ${result.purseRemaining}, Player count: ${result.playerCount}`);
    return result;
  } catch (error) {
    console.error('Error updating franchise:', error);
    throw error;
  }
};

export const getFranchiseById = async (id) => {
  try {
    const doc = await db.collection(COLLECTIONS.FRANCHISES).doc(id).get();
    return docToObject(doc);
  } catch (error) {
    console.error('Error getting franchise by ID:', error);
    throw error;
  }
};

export const deleteFranchise = async (id) => {
  try {
    await db.collection(COLLECTIONS.FRANCHISES).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting franchise:', error);
    throw error;
  }
};

// User operations
export const getUserByUsername = async (username) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return docToObject(snapshot.docs[0]);
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    return docToObject(doc);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const createUser = async (user) => {
  try {
    const docRef = await db.collection(COLLECTIONS.USERS).add({
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...user };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    await db.collection(COLLECTIONS.USERS).doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    const updatedDoc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    return docToObject(updatedDoc);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const getAllUsersByRole = async (role) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', role)
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

export const getUsersByRoleAndSport = async (role, sport) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', role)
      .where('sport', '==', sport)
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting users by role and sport:', error);
    throw error;
  }
};

// History operations
export const createHistoryEntry = async (historyEntry) => {
  try {
    console.log(`📜 [FIRESTORE] Creating history record:`, {
      action: historyEntry.action,
      sport: historyEntry.sport,
      auctioneerId: historyEntry.auctioneerId
    });
    const docRef = await db.collection(COLLECTIONS.HISTORY).add({
      ...historyEntry,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ [FIRESTORE] History record created with ID: ${docRef.id}`);
    console.log(`📑 [FIRESTORE] History record is separate document in sportbid_history collection`);
    return { id: docRef.id, ...historyEntry };
  } catch (error) {
    console.error('Error creating history entry:', error);
    throw error;
  }
};

export const getHistory = async (limit = 100) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.HISTORY)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
  }
};

export const getHistoryBySport = async (sport, limit = 100) => {
  try {
    console.log(`📜 [FIRESTORE] Getting auction history for sport: ${sport}`);
    const snapshot = await db.collection(COLLECTIONS.HISTORY)
      .where('sport', '==', sport)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    const result = snapshotToArray(snapshot);
    console.log(`✅ [FIRESTORE] Found ${result.length} history records for ${sport}`);
    return result;
  } catch (error) {
    console.error('Error getting history by sport:', error);
    throw error;
  }
};

export const getHistoryByAuctioneer = async (auctioneerId, limit = 100) => {
  try {
    console.log(`📜 [FIRESTORE] Getting auction history for auctioneer: ${auctioneerId}`);
    const snapshot = await db.collection(COLLECTIONS.HISTORY)
      .where('auctioneerId', '==', auctioneerId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    const result = snapshotToArray(snapshot);
    console.log(`✅ [FIRESTORE] Found ${result.length} history records for auctioneer ${auctioneerId}`);
    return result;
  } catch (error) {
    console.error('Error getting history by auctioneer:', error);
    throw error;
  }
};

// Auction operations
export const createAuction = async (auction) => {
  try {
    const docRef = await db.collection(COLLECTIONS.AUCTIONS).add({
      ...auction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...auction };
  } catch (error) {
    console.error('Error creating auction:', error);
    throw error;
  }
};

export const getAuctionsBySport = async (sport) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.AUCTIONS)
      .where('sport', '==', sport)
      .get();
    
    // Sort in memory instead of using Firestore orderBy to avoid index requirement
    const auctions = snapshotToArray(snapshot);
    auctions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return auctions;
  } catch (error) {
    console.error('Error getting auctions by sport:', error);
    throw error;
  }
};

export const getAuctionById = async (id) => {
  try {
    const doc = await db.collection(COLLECTIONS.AUCTIONS).doc(id).get();
    return docToObject(doc);
  } catch (error) {
    console.error('Error getting auction by ID:', error);
    throw error;
  }
};

export const updateAuction = async (id, updates) => {
  try {
    await db.collection(COLLECTIONS.AUCTIONS).doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    const updatedDoc = await db.collection(COLLECTIONS.AUCTIONS).doc(id).get();
    return docToObject(updatedDoc);
  } catch (error) {
    console.error('Error updating auction:', error);
    throw error;
  }
};

export const deleteAuction = async (id) => {
  try {
    const doc = await db.collection(COLLECTIONS.AUCTIONS).doc(id).get();
    const auction = docToObject(doc);
    
    if (!auction) {
      throw new Error('Auction not found');
    }
    
    await db.collection(COLLECTIONS.AUCTIONS).doc(id).delete();
    return auction;
  } catch (error) {
    console.error('Error deleting auction:', error);
    throw error;
  }
};

// Live session operations
export const createLiveSession = async (session) => {
  try {
    const docRef = await db.collection(COLLECTIONS.LIVE_SESSIONS).add({
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...session };
  } catch (error) {
    console.error('Error creating live session:', error);
    throw error;
  }
};

export const getLiveSessionsBySport = async (sport) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.LIVE_SESSIONS)
      .where('sport', '==', sport)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting live sessions by sport:', error);
    throw error;
  }
};

export const getActiveLiveSessions = async () => {
  try {
    console.log(`🎪 [FIRESTORE] Getting active live sessions`);
    const snapshot = await db.collection(COLLECTIONS.LIVE_SESSIONS)
      .where('status', 'in', ['LIVE', 'PAUSED', 'IN_PROGRESS'])
      .orderBy('createdAt', 'desc')
      .get();
    const result = snapshotToArray(snapshot);
    console.log(`✅ [FIRESTORE] Found ${result.length} active live sessions`);
    return result;
  } catch (error) {
    console.error('Error getting active live sessions:', error);
    throw error;
  }
};

export const getActiveLiveSessionsByAuctioneer = async (auctioneerId) => {
  try {
    console.log(`🎪 [FIRESTORE] Getting active live sessions for auctioneer: ${auctioneerId}`);
    const snapshot = await db.collection(COLLECTIONS.LIVE_SESSIONS)
      .where('auctioneerId', '==', auctioneerId)
      .where('status', 'in', ['LIVE', 'PAUSED', 'IN_PROGRESS'])
      .orderBy('createdAt', 'desc')
      .get();
    const result = snapshotToArray(snapshot);
    console.log(`✅ [FIRESTORE] Found ${result.length} active sessions for auctioneer`);
    return result;
  } catch (error) {
    console.error('Error getting active live sessions by auctioneer:', error);
    throw error;
  }
};

export const getLiveSessionById = async (id) => {
  try {
    const doc = await db.collection(COLLECTIONS.LIVE_SESSIONS).doc(id).get();
    return docToObject(doc);
  } catch (error) {
    console.error('Error getting live session by ID:', error);
    throw error;
  }
};

export const updateLiveSession = async (id, updates) => {
  try {
    console.log(`🔴 [FIRESTORE] Updating live session ${id} with:`, {
      currentPlayerId: updates.currentPlayerId,
      currentBid: updates.currentBid,
      status: updates.status,
      hasMoreUpdates: Object.keys(updates).length > 3
    });
    await db.collection(COLLECTIONS.LIVE_SESSIONS).doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    const updatedDoc = await db.collection(COLLECTIONS.LIVE_SESSIONS).doc(id).get();
    const result = docToObject(updatedDoc);
    console.log(`✅ [FIRESTORE] Live session updated. Current player: ${result.currentPlayerId}, bid: ${result.currentBid}`);
    console.log(`📑 [FIRESTORE] Session data persisted in sportbid_live_sessions collection`);
    return result;
  } catch (error) {
    console.error('Error updating live session:', error);
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    console.log(`📊 [FIRESTORE] Getting current active live session`);
    const snapshot = await db.collection(COLLECTIONS.LIVE_SESSIONS)
      .where('status', '==', 'LIVE')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`📊 [FIRESTORE] No active live session found`);
      return null;
    }
    
    const result = docToObject(snapshot.docs[0]);
    console.log(`✅ [FIRESTORE] Current session: ${result.id}, sport: ${result.sport}`);
    return result;
  } catch (error) {
    console.error('Error getting current session:', error);
    throw error;
  }
};

// Bid operations
export const createBid = async (bid) => {
  try {
    console.log(`🏷️ [FIRESTORE] Creating bid document:`, { 
      playerId: bid.playerId, 
      franchiseId: bid.franchiseId, 
      amount: bid.amount, 
      type: bid.type 
    });
    const docRef = await db.collection(COLLECTIONS.BIDS).add({
      ...bid,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ [FIRESTORE] Bid document created with ID: ${docRef.id}`);
    console.log(`📑 [FIRESTORE] Each bid is now a separate document in sportbid_bids collection`);
    return { id: docRef.id, ...bid };
  } catch (error) {
    console.error('Error creating bid:', error);
    throw error;
  }
};

export const getBidsByAuction = async (auctionId) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.BIDS)
      .where('auctionId', '==', auctionId)
      .orderBy('timestamp', 'desc')
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting bids by auction:', error);
    throw error;
  }
};

export const getBidsByPlayer = async (playerId) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.BIDS)
      .where('playerId', '==', playerId)
      .orderBy('timestamp', 'desc')
      .get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error getting bids by player:', error);
    throw error;
  }
};

// Generic collection operations for migration compatibility
export const writeCollection = async (collectionName, data) => {
  try {
    const batch = db.batch();
    
    // Clear existing data
    const existingDocs = await db.collection(collectionName).get();
    existingDocs.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new data
    data.forEach(item => {
      const docRef = db.collection(collectionName).doc();
      batch.set(docRef, {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error writing collection:', error);
    throw error;
  }
};

export const readCollection = async (collectionName) => {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshotToArray(snapshot);
  } catch (error) {
    console.error('Error reading collection:', error);
    throw error;
  }
};