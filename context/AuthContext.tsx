import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'admin' | 'player' | 'auctioneer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  sport?: string;
  email?: string;
  phone?: string;
  franchiseId?: string;
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
  login: (username: string, password: string, role: UserRole, sport?: string) => Promise<void>;
  logout: () => void;
  setSport: (sport: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [franchise, setFranchise] = useState<Franchise | null>(null);

  const login = async (username: string, password: string, role: UserRole, sport?: string) => {
    if (role === 'auctioneer' && sport) {
      // Auctioneer login via API
      try {
        const response = await fetch('http://localhost:4000/api/auctioneers/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
            sport,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setUser({
            id: data.auctioneer.id,
            username: data.auctioneer.username,
            role: 'auctioneer',
            sport: data.auctioneer.sport,
            email: data.auctioneer.email,
            phone: data.auctioneer.phone,
            franchiseId: data.auctioneer.franchiseId,
          });

          if (data.franchise) {
            setFranchise(data.franchise);
          }
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }
    } else {
      // Simple local authentication for admin and player
      const newUser: User = {
        id: Math.random().toString(),
        username,
        role,
        sport,
      };
      setUser(newUser);
    }
  };

  const logout = () => {
    setUser(null);
    setFranchise(null);
  };

  const setSport = (sport: string) => {
    if (user) {
      setUser({ ...user, sport });
    }
  };

  return (
    <AuthContext.Provider value={{ user, franchise, login, logout, setSport }}>
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
