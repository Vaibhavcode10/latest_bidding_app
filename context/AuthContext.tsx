import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiBase } from '../config/index.js';

export type UserRole = 'admin' | 'player' | 'auctioneer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  sport?: string;
  email?: string;
  name?: string;
  phone?: string;
  franchiseId?: string;
  // Player specific fields
  playerRole?: string;
  jersey?: number | null;
  height?: string;
  weight?: string;
  age?: number | null;
  basePrice?: number;
  bio?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface Franchise {
  id: string;
  name: string;
  auctioneerId: string;
  sport: string;
  city: string;
  stadium: string;
  totalPurse: number;
  purseRemaining: number;
  playerCount: number;
  wins: number;
  losses: number;
}

interface AuthContextType {
  user: User | null;
  franchise: Franchise | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, role: UserRole, sport?: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: UserRole, sport: string, name?: string, basePrice?: number) => Promise<void>;
  logout: () => void;
  setSport: (sport: string) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_KEY = 'bidding_app_user';
const FRANCHISE_KEY = 'bidding_app_franchise';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedFranchise = localStorage.getItem(FRANCHISE_KEY);
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem(USER_KEY);
      }
    }
    
    if (savedFranchise) {
      try {
        setFranchise(JSON.parse(savedFranchise));
      } catch (e) {
        localStorage.removeItem(FRANCHISE_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (franchise) {
      localStorage.setItem(FRANCHISE_KEY, JSON.stringify(franchise));
    } else {
      localStorage.removeItem(FRANCHISE_KEY);
    }
  }, [franchise]);

  const login = async (username: string, password: string, role: UserRole, sport?: string) => {
    const apiBase = getApiBase();
    
    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role,
          sport,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Map the response to User interface
      const loggedInUser: User = {
        id: data.user.id,
        username: data.user.username,
        role: role,
        sport: data.user.sport || sport,
        email: data.user.email,
        name: data.user.name,
        phone: data.user.phone,
        jersey: data.user.jersey,
        height: data.user.height,
        weight: data.user.weight,
        age: data.user.age,
        basePrice: data.user.basePrice,
        bio: data.user.bio,
        imageUrl: data.user.imageUrl,
        createdAt: data.user.createdAt,
      };

      // For players, the 'role' field in data is their playing position
      if (role === 'player') {
        loggedInUser.playerRole = data.user.role;
      }

      setUser(loggedInUser);

      if (data.franchise) {
        setFranchise(data.franchise);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const register = async (username: string, email: string, password: string, role: UserRole, sport: string, name?: string, basePrice?: number) => {
    const apiBase = getApiBase();
    
    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
          sport,
          name,
          ...(basePrice !== undefined && { basePrice }),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto-login after registration
      const registeredUser: User = {
        id: data.user.id,
        username: data.user.username,
        role: role,
        sport: data.user.sport || sport,
        email: data.user.email,
        name: data.user.name,
        phone: data.user.phone,
        playerRole: role === 'player' ? data.user.role : undefined,
        jersey: data.user.jersey,
        height: data.user.height,
        weight: data.user.weight,
        age: data.user.age,
        basePrice: data.user.basePrice,
        bio: data.user.bio,
        imageUrl: data.user.imageUrl,
        createdAt: data.user.createdAt,
      };

      setUser(registeredUser);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setFranchise(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(FRANCHISE_KEY);
  };

  const setSport = (sport: string) => {
    if (user) {
      setUser({ ...user, sport });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user || !user.sport) {
      throw new Error('User not logged in or sport not set');
    }

    const apiBase = getApiBase();
    
    try {
      const response = await fetch(`${apiBase}/auth/profile/${user.role}/${user.sport}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update local user state
      const updatedUser: User = {
        ...user,
        ...result.user,
        role: user.role,
        playerRole: user.role === 'player' ? result.user.role : user.playerRole,
      };

      setUser(updatedUser);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const refreshProfile = async () => {
    if (!user || !user.sport) {
      return;
    }

    const apiBase = getApiBase();
    
    try {
      const response = await fetch(`${apiBase}/auth/profile/${user.role}/${user.sport}/${user.id}`);
      const result = await response.json();

      if (response.ok && result.success) {
        const refreshedUser: User = {
          ...user,
          ...result.user,
          role: user.role,
          playerRole: user.role === 'player' ? result.user.role : user.playerRole,
        };
        setUser(refreshedUser);

        if (result.franchise) {
          setFranchise(result.franchise);
        }
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      franchise, 
      isAuthenticated: !!user,
      isLoading,
      login, 
      register,
      logout, 
      setSport,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
