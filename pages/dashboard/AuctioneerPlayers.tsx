import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiBase } from '../../config/index.js';

interface AuctioneerPlayer {
  id: string;
  name: string;
  role: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD' | 'UNSOLD';
  soldTo?: string;
  soldPrice?: number;
}

const AuctioneerPlayers: React.FC = () => {
  const { user, franchise } = useAuth();
  const [players, setPlayers] = useState<AuctioneerPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch players owned by this franchise
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!user?.sport || !franchise?.id) {
        setLoading(false);
        return;
      }

      try {
        const apiBase = getApiBase();
        const response = await fetch(`${apiBase}/players/${user.sport}`);
        const data = await response.json();
        
        if (data.success && data.players) {
          // Filter players that belong to this franchise/team
          const franchisePlayers = data.players
            .filter((p: any) => p.teamId === franchise.id)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              role: p.role,
              price: p.basePrice,
              status: p.status,
              soldTo: franchise.name,
              soldPrice: p.soldPrice || p.currentBid || p.basePrice,
            }));
          setPlayers(franchisePlayers);
        }
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [user?.sport, franchise?.id]);

  const soldPlayers = players.filter((p) => p.status === 'SOLD').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
        <div className="text-6xl mb-4">🏢</div>
        <p className="text-slate-400 text-lg font-semibold">No Franchise Found</p>
        <p className="text-slate-500 text-sm mt-2">Please create a franchise first from the Overview page</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">My Team Players</h1>
            <p className="text-slate-400">Players acquired by {franchise.name}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-blue-300 text-sm font-semibold mb-2">Total Players</p>
          <p className="text-4xl font-black text-blue-400">{players.length}</p>
          <p className="text-slate-400 text-xs mt-2">Players in your squad</p>
        </div>
        <div className="bg-green-600/20 border border-green-600/30 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-green-300 text-sm font-semibold mb-2">Sold</p>
          <p className="text-4xl font-black text-green-400">{soldPlayers}</p>
          <p className="text-slate-400 text-xs mt-2">Players you acquired</p>
        </div>
        <div className="bg-purple-600/20 border border-purple-600/30 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-purple-300 text-sm font-semibold mb-2">Budget Remaining</p>
          <p className="text-4xl font-black text-purple-400">₹{(franchise.purseRemaining || 0).toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-2">Available for bidding</p>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-4">
        {players.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-slate-400 text-lg">No players in your squad yet</p>
            <p className="text-slate-500 text-sm mt-2">Acquire players through auctions to build your team</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 hover:border-blue-600/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{player.name}</h3>
                  <p className="text-slate-400 mb-4">{player.role}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Base Price</p>
                      <p className="text-white font-bold">₹{player.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Status</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold inline-block ${
                        player.status === 'AVAILABLE'
                          ? 'bg-blue-600/30 text-blue-300'
                          : player.status === 'SOLD'
                          ? 'bg-green-600/30 text-green-300'
                          : 'bg-orange-600/30 text-orange-300'
                      }`}>
                        {player.status}
                      </span>
                    </div>
                    {player.soldTo && (
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Team</p>
                        <p className="text-white font-bold">{player.soldTo}</p>
                      </div>
                    )}
                    {player.soldPrice && (
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Acquired For</p>
                        <p className="text-green-400 font-bold">₹{player.soldPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuctioneerPlayers;
