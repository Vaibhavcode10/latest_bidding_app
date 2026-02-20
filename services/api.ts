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
      
      console.log('📤 [API GET]', { url });
      
      const res = await fetch(url);
      
      console.log('📥 [API RESPONSE]', { url, status: res.status, contentType: res.headers.get('content-type') });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ [API ERROR] Non-JSON response:', { url, status: res.status, text: text.substring(0, 200) });
        return { 
          data: { success: false, error: `Server error: ${res.status}` } as T, 
          status: res.status 
        };
      }
      
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Get Error (${path}):`, err);
      return { data: { success: false, error: 'Failed to connect to server' } as T, status: 500 };
    }
  },

  post: async <T = any>(path: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const baseUrl = getApiBase();
      const url = `${baseUrl}${path}`;
      console.log('📤 [API POST]', { url, body });
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      console.log('📥 [API RESPONSE]', { url, status: res.status, contentType: res.headers.get('content-type') });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ [API ERROR] Non-JSON response:', { url, status: res.status, text: text.substring(0, 200) });
        return { 
          data: { success: false, error: `Server error: ${res.status}` } as T, 
          status: res.status 
        };
      }
      
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Post Error (${path}):`, err);
      return { data: { success: false, error: 'Failed to connect to server' } as T, status: 500 };
    }
  },

  put: async <T = any>(path: string, body?: any): Promise<ApiResponse<T>> => {
    try {
      const baseUrl = getApiBase();
      const url = `${baseUrl}${path}`;
      console.log('📤 [API PUT]', { url, body });
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      console.log('📥 [API RESPONSE]', { url, status: res.status, contentType: res.headers.get('content-type') });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ [API ERROR] Non-JSON response:', { url, status: res.status, text: text.substring(0, 200) });
        return { 
          data: { success: false, error: `Server error: ${res.status}` } as T, 
          status: res.status 
        };
      }
      
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Put Error (${path}):`, err);
      return { data: { success: false, error: 'Failed to connect to server' } as T, status: 500 };
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
      
      console.log('📤 [API DELETE]', { url });
      
      const res = await fetch(url, { method: 'DELETE' });
      
      console.log('📥 [API RESPONSE]', { url, status: res.status, contentType: res.headers.get('content-type') });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ [API ERROR] Non-JSON response:', { url, status: res.status, text: text.substring(0, 200) });
        return { 
          data: { success: false, error: `Server error: ${res.status}` } as T, 
          status: res.status 
        };
      }
      
      const data = await res.json();
      return { data, status: res.status };
    } catch (err) {
      console.error(`API Delete Error (${path}):`, err);
      return { data: { success: false, error: 'Failed to connect to server' } as T, status: 500 };
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

  // ===== SEASON API =====

  // Create a new season
  createSeason: async (seasonData: {
    sport: string;
    name: string;
    year: number;
    startDate: string;
    endDate: string;
    description?: string;
    details?: Record<string, any>;
    userRole: string;
    userId: string;
  }) => {
    try {
      const response = await api.post('/seasons', {
        ...seasonData,
        createdBy: seasonData.userId
      });
      return response;
    } catch (err) {
      console.error('Create season error:', err);
      return { data: { success: false, error: 'Failed to create season' }, status: 500 };
    }
  },

  // Get all seasons
  getAllSeasons: async () => {
    try {
      const response = await api.get('/seasons');
      return response;
    } catch (err) {
      console.error('Get all seasons error:', err);
      return { data: { success: false, seasons: [], count: 0 }, status: 500 };
    }
  },

  // Get seasons by sport
  getSeasonsBySport: async (sport: string) => {
    try {
      const response = await api.get(`/seasons/sport/${sport}`);
      return response;
    } catch (err) {
      console.error(`Get seasons for ${sport} error:`, err);
      return { data: { success: false, seasons: [], count: 0 }, status: 500 };
    }
  },

  // Get specific season
  getSeasonById: async (seasonId: string) => {
    try {
      const response = await api.get(`/seasons/${seasonId}`);
      return response;
    } catch (err) {
      console.error('Get season error:', err);
      return { data: { success: false, season: null }, status: 500 };
    }
  },

  // Update season
  updateSeason: async (seasonId: string, updates: {
    name?: string;
    year?: number;
    startDate?: string;
    endDate?: string;
    description?: string;
    details?: Record<string, any>;
    userRole: string;
  }) => {
    try {
      const response = await api.put(`/seasons/${seasonId}`, updates);
      return response;
    } catch (err) {
      console.error('Update season error:', err);
      return { data: { success: false, error: 'Failed to update season' }, status: 500 };
    }
  },

  // Delete season
  deleteSeason: async (seasonId: string, userRole: string, userId: string) => {
    try {
      const response = await api.delete(`/seasons/${seasonId}`, {
        params: { userRole, userId }
      });
      return response;
    } catch (err) {
      console.error('Delete season error:', err);
      return { data: { success: false, error: 'Failed to delete season' }, status: 500 };
    }
  },

  // Add action/auction to season
  addActionToSeason: async (seasonId: string, actionId: string, userRole: string) => {
    try {
      const response = await api.post(`/seasons/${seasonId}/actions/${actionId}`, {
        userRole
      });
      return response;
    } catch (err) {
      console.error('Add action to season error:', err);
      return { data: { success: false, error: 'Failed to add action to season' }, status: 500 };
    }
  },

  // Remove action/auction from season
  removeActionFromSeason: async (seasonId: string, actionId: string, userRole: string, userId: string) => {
    try {
      const response = await api.delete(`/seasons/${seasonId}/actions/${actionId}`, {
        params: { userRole, userId }
      });
      return response;
    } catch (err) {
      console.error('Remove action from season error:', err);
      return { data: { success: false, error: 'Failed to remove action from season' }, status: 500 };
    }
  },

  // ===== ACTION/AUCTION API =====

  // Create a new action
  createAction: async (actionData: {
    seasonId: string;
    sport: string;
    name: string;
    description?: string;
    participatingTeams: Array<any>;
    playerPool: string[];
    assignedAuctioneerId: string;
    assignedAuctioneerName: string;
    settings?: Record<string, any>;
    userRole: string;
    userId: string;
  }) => {
    try {
      const response = await api.post('/actions', {
        ...actionData,
        createdBy: actionData.userId
      });
      return response;
    } catch (err) {
      console.error('Create action error:', err);
      return { data: { success: false, error: 'Failed to create action' }, status: 500 };
    }
  },

  // Get action by ID
  getActionById: async (actionId: string) => {
    try {
      const response = await api.get(`/actions/${actionId}`);
      return response;
    } catch (err) {
      console.error('Get action error:', err);
      return { data: { success: false, action: null }, status: 500 };
    }
  },

  // Get actions by season
  getActionsBySeasonId: async (seasonId: string) => {
    try {
      const response = await api.get(`/actions/season/${seasonId}`);
      return response;
    } catch (err) {
      console.error('Get actions by season error:', err);
      return { data: { success: false, actions: [], count: 0 }, status: 500 };
    }
  },

  // Get actions by sport
  getActionsBySport: async (sport: string) => {
    try {
      const response = await api.get(`/actions/sport/${sport}`);
      return response;
    } catch (err) {
      console.error('Get actions by sport error:', err);
      return { data: { success: false, actions: [], count: 0 }, status: 500 };
    }
  },

  // Get all data needed to create an action (teams, players, auctioneers)
  getActionCreationData: async (sport: string) => {
    try {
      const response = await api.get(`/actions/${sport}/data`);
      return response;
    } catch (err) {
      console.error('Get action creation data error:', err);
      return { 
        data: { 
          success: false, 
          data: { teams: [], players: [], auctioneers: [] } 
        }, 
        status: 500 
      };
    }
  },

  // Update action
  updateAction: async (actionId: string, updates: {
    name?: string;
    description?: string;
    status?: string;
    settings?: Record<string, any>;
    userRole: string;
  }) => {
    try {
      const response = await api.put(`/actions/${actionId}`, updates);
      return response;
    } catch (err) {
      console.error('Update action error:', err);
      return { data: { success: false, error: 'Failed to update action' }, status: 500 };
    }
  },

  // Delete action
  deleteAction: async (actionId: string, userRole: string, userId: string) => {
    try {
      const response = await api.delete(`/actions/${actionId}`, {
        params: { userRole, userId }
      });
      return response;
    } catch (err) {
      console.error('Delete action error:', err);
      return { data: { success: false, error: 'Failed to delete action' }, status: 500 };
    }
  }

};
