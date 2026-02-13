import { getApiUrl, getApiBase } from '../config/index.js';

interface UserContext {
  userId?: string;
  userRole?: string;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
}

export const api = {
  // Generic HTTP methods for flexible API calls
  get: async <T = any>(path: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> => {
    try {
      const baseUrl = getApiBase();
      let url = `${baseUrl}${path}`;
      
      // Add query parameters if provided
      if (options?.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const paramString = searchParams.toString();
        if (paramString) {
          url += `?${paramString}`;
        }
      }
      
      const res = await fetch(url);
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Get Error (${path}):`, err);
      return { data: {} as T, status: 500 };
    }
  },

  post: async <T = any>(path: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const baseUrl = getApiBase();
      const url = `${baseUrl}${path}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Post Error (${path}):`, err);
      return { data: {} as T, status: 500 };
    }
  },

  put: async <T = any>(path: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const baseUrl = getApiBase();
      const url = `${baseUrl}${path}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Put Error (${path}):`, err);
      return { data: {} as T, status: 500 };
    }
  },

  delete: async <T = any>(path: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> => {
    try {
      const baseUrl = getApiBase();
      let url = `${baseUrl}${path}`;
      
      // Add query parameters if provided
      if (options?.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const paramString = searchParams.toString();
        if (paramString) {
          url += `?${paramString}`;
        }
      }
      
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Delete Error (${path}):`, err);
      return { data: {} as T, status: 500 };
    }
  },

  // Legacy typed methods for backward compatibility
  getEntity: async <T>(entity: 'players' | 'teams', sport?: string, userContext?: UserContext): Promise<T[]> => {
    try {
      let url = getApiUrl(entity, sport);
      
      if (userContext?.userId && userContext?.userRole) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}userId=${encodeURIComponent(userContext.userId)}&userRole=${encodeURIComponent(userContext.userRole)}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      return res.json();
    } catch (err) {
      console.error(`API Get Error (${entity}):`, err);
      return [];
    }
  },

  createEntity: async <T>(entity: 'players' | 'teams', data: Partial<T>, sport?: string): Promise<T | null> => {
    try {
      const url = getApiUrl(entity, sport);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Create failed');
      return res.json();
    } catch (err) {
      console.error(`API Post Error (${entity}):`, err);
      return null;
    }
  },

  updateEntity: async <T>(entity: 'players' | 'teams', id: string, data: Partial<T>, sport?: string): Promise<boolean> => {
    try {
      const baseUrl = getApiBase();
      const entityPath = entity === 'teams' ? 'teams' : entity;
      const url = sport ? `${baseUrl}/${entityPath}/${sport}/${id}` : `${baseUrl}/${entityPath}/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.error(`API Put Error (${entity}):`, err);
      return false;
    }
  },

  deleteEntity: async (entity: 'players' | 'teams', id: string, sport?: string, userContext?: UserContext): Promise<boolean> => {
    try {
      const baseUrl = getApiBase();
      const entityPath = entity === 'teams' ? 'teams' : entity;
      let url = sport ? `${baseUrl}/${entityPath}/${sport}/${id}` : `${baseUrl}/${entityPath}/${id}`;
      
      if (userContext?.userId && userContext?.userRole) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}userId=${encodeURIComponent(userContext.userId)}&userRole=${encodeURIComponent(userContext.userRole)}`;
      }
      
      console.log(`🗑️ DELETE request to: ${url}`);
      
      const res = await fetch(url, { method: 'DELETE' });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ Delete failed (${res.status}):`, errorData);
        throw new Error(errorData.error || `Delete failed with status ${res.status}`);
      }
      
      const responseData = await res.json().catch(() => ({ success: true }));
      console.log('✅ Delete response:', responseData);
      
      return res.ok && (responseData.success !== false);
    } catch (err) {
      console.error(`❌ API Delete Error (${entity}):`, err);
      throw err;
    }
  },

  // ===== AUCTION HISTORY API =====
  
  // Get all auction history (admin/auctioneer only)
  getAuctionHistory: async (userRole: string, userId: string, sport?: string, auctioneerId?: string) => {
    try {
      const params = new URLSearchParams({
        userRole,
        userId
      });
      
      if (sport) params.append('sport', sport);
      if (auctioneerId) params.append('auctioneerId', auctioneerId);
      
      const response = await api.get(`/auction-history?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Get auction history error:', err);
      return { data: { success: false, history: [], total: 0 }, status: 500 };
    }
  },

  // Get specific auction history details
  getAuctionDetails: async (auctionId: string, userRole: string, userId: string) => {
    try {
      const params = new URLSearchParams({
        userRole,
        userId
      });
      
      const response = await api.get(`/auction-history/${auctionId}?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Get auction details error:', err);
      return { data: { success: false, auction: null }, status: 500 };
    }
  },

  // Get all active auction ledgers
  getActiveLedgers: async (userRole: string, userId: string) => {
    try {
      const params = new URLSearchParams({
        userRole,
        userId
      });
      
      const response = await api.get(`/auction-history/ledgers/active?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Get active ledgers error:', err);
      return { data: { success: false, ledgers: [], total: 0 }, status: 500 };
    }
  },

  // Get specific auction ledger
  getAuctionLedger: async (auctionId: string, userRole: string, userId: string) => {
    try {
      const params = new URLSearchParams({
        userRole,
        userId
      });
      
      const response = await api.get(`/auction-history/ledgers/${auctionId}?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Get auction ledger error:', err);
      return { data: { success: false, ledger: null }, status: 500 };
    }
  },

  // Get auction statistics
  getAuctionStats: async (userRole: string, userId: string, sport?: string, auctioneerId?: string) => {
    try {
      const params = new URLSearchParams({
        userRole,
        userId
      });
      
      if (sport) params.append('sport', sport);
      if (auctioneerId) params.append('auctioneerId', auctioneerId);
      
      const response = await api.get(`/auction-history/stats?${params.toString()}`);
      return response;
    } catch (err) {
      console.error('Get auction stats error:', err);
      return { data: { success: false, stats: null }, status: 500 };
    }
  },

  // ===== LIVE AUCTION API =====
  
  // Undo last bid
  undoLastBid: async (userRole: string, userId: string) => {
    try {
      const response = await api.post('/live-auction/undo-bid', {
        userRole,
        userId
      });
      return response;
    } catch (err) {
      console.error('Undo bid error:', err);
      return { data: { success: false, error: 'Failed to undo bid' }, status: 500 };
    }
  }
};