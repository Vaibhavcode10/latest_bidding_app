import { getApiUrl, getApiBase } from '../config/index.js';

export const api = {
  get: async <T>(entity: 'players' | 'teams', sport?: string): Promise<T[]> => {
    try {
      const url = getApiUrl(entity, sport);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      return res.json();
    } catch (err) {
      console.error(`API Get Error (${entity}):`, err);
      return [];
    }
  },

  create: async <T>(entity: 'players' | 'teams', data: Partial<T>, sport?: string): Promise<T | null> => {
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

  update: async <T>(entity: 'players' | 'teams', id: string, data: Partial<T>, sport?: string): Promise<boolean> => {
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

  delete: async (entity: 'players' | 'teams', id: string, sport?: string): Promise<boolean> => {
    try {
      const baseUrl = getApiBase();
      const entityPath = entity === 'teams' ? 'teams' : entity;
      const url = sport ? `${baseUrl}/${entityPath}/${sport}/${id}` : `${baseUrl}/${entityPath}/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error(`API Delete Error (${entity}):`, err);
      return false;
    }
  }
};