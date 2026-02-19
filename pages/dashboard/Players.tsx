
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

interface Player {
  id: string;
  name: string;
  sport: string;
  role: string;
  basePrice?: number;  // Made optional
  currentBid: number;
  status: string;
  careerRecords: any;
  auctionPrice: number | null;
  soldTo: string | null;
  username?: string;
  email?: string;
  imageUrl?: string;
  verified?: boolean;
  verificationRequestedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

const Players: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    basePrice: '',
  });

  // Use the user's selected sport instead of local state
  const sport = user?.sport || 'football';

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 3000);
    return () => clearInterval(interval);
  }, [user?.sport, user]);

  const fetchPlayers = async () => {
    const userContext = user?.role === 'player' ? {
      userId: user.id,
      userRole: user.role
    } : undefined;
    
    const data = await api.getEntity<Player>('players', sport, userContext);
    setPlayers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // For editing, only update player-specific fields
      const updateData = {
        name: formData.name,
      };
      await api.updateEntity('players', editingId, updateData, sport);
    } else {
      // For creating new player, send all required auth fields
      await api.createEntity('players', formData, sport);
    }
    setFormData({ name: '', username: '', email: '', password: '', basePrice: '' });
    setEditingId(null);
    setShowForm(false);
    fetchPlayers();
  };

  const handleEdit = (player: Player) => {
    setFormData({ 
      name: player.name, 
      username: '',  // Don't show existing auth data
      email: '',
      password: '',
      basePrice: ''
    });
    setEditingId(player.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const playerName = players.find(p => p.id === id)?.name || 'player';
    if (confirm(`Are you sure you want to delete ${playerName}? This will permanently remove both the player and their login account.`)) {
      const userContext = user ? {
        userId: user.id,
        userRole: user.role
      } : undefined;
      
      console.log('🗑️ Attempting to delete player:', { id, playerName, userContext });
      
      try {
        const success = await api.deleteEntity('players', id, sport, userContext);
        if (success) {
          console.log('✅ Player deleted successfully');
          fetchPlayers();
          alert(`${playerName} has been deleted successfully.`);
        } else {
          console.log('❌ Delete failed - API returned false');
          alert(`Failed to delete ${playerName}. You may not have permission or there was a server error.`);
        }
      } catch (error) {
        console.error('❌ Delete error:', error);
        alert(`Failed to delete ${playerName}. Server error: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const isPlayer = user?.role === 'player';
  const canManagePlayers = user?.role === 'admin' || user?.role === 'auctioneer';

  const getSportColor = (s: string) => {
    const colors: { [key: string]: string } = {
      football: 'from-blue-500 to-cyan-500',
      cricket: 'from-orange-500 to-red-500',
      volleyball: 'from-yellow-500 to-amber-500',
      baseball: 'from-red-500 to-pink-500',
      basketball: 'from-purple-500 to-indigo-500',
    };
    return colors[s] || 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            {isPlayer ? 'My Profile' : `${sport.charAt(0).toUpperCase() + sport.slice(1)} Players`}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-sm">
            {isPlayer ? 'Your player profile and details' : 'Manage and bid on professional athletes'}
          </p>
        </div>
      </div>

      {/* Player count and Add button (only for admins/auctioneers) */}
      {canManagePlayers && (
        <div className="flex justify-between items-center">
          <p className="text-gray-600 dark:text-slate-400 font-semibold">{players.length} Athletes Available</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
              showForm
                ? 'bg-gray-500 dark:bg-slate-700 text-white dark:text-slate-300'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/50'
            }`}
          >
            {showForm ? '✕ Cancel' : '+ Add Player'}
          </button>
        </div>
      )}

      {/* Add Player Form (only for admins/auctioneers) */}
      {canManagePlayers && showForm && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-900/50 border border-gray-200 dark:border-slate-700/50 backdrop-blur-xl rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-top">
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {editingId ? '✏️ Edit Player' : '⭐ Add New Player'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  🔐 Create Player Account
                </h4>
              </>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Player Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              />
              {!editingId && (
                <>
                  <input
                    type="text"
                    placeholder="Username *"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password *"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    required
                    minLength={6}
                  />
                  <input
                    type="number"
                    placeholder="Base Price *"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    required
                    step="1"
                    min="0"
                  />
                </>
              )}
            </div>
            {!editingId && (
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                  <strong>📌 Note:</strong> The player will be able to log in with these credentials and can update their profile details after logging in.
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                  <strong>💰 Base Price:</strong> Enter the starting bid amount as a number (e.g., 2000000, 20000, etc). No units like CR or Lakh needed.
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              ✓ {editingId ? 'Update' : 'Create'} Player
            </button>
          </form>
        </div>
      )}

      {/* Players Grid */}
      {players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, idx) => (
            <div
              key={player.id}
              className="group bg-white dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/60 hover:bg-gray-50 dark:hover:from-slate-800 dark:hover:to-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-6 transition-all transform hover:scale-105 hover:shadow-xl dark:hover:shadow-2xl hover:shadow-blue-200 dark:hover:shadow-blue-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom shadow-sm"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Player Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-500 dark:group-hover:from-blue-400 group-hover:to-purple-500 dark:group-hover:to-purple-400 group-hover:bg-clip-text transition-all mb-1">
                    {player.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {player.role}
                    </span>
                  </p>
                  {user?.role === 'admin' && player.username && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 dark:text-slate-500">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Username:</span> {player.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Player ID:</span> {player.id}
                      </p>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getSportColor(sport)} flex items-center justify-center text-xl font-bold transform group-hover:scale-110 transition-transform`}>
                  #{players.indexOf(player) + 1}
                </div>
              </div>

              {/* Price Info */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Base Price</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{player.basePrice ? formatPrice(player.basePrice) : formatPrice(30000000)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Current Bid</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">${(player.currentBid / 1000000).toFixed(1)}M</span>
                </div>
                {user?.role === 'admin' && player.auctionPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Final Auction Price</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">${(player.auctionPrice / 1000000).toFixed(1)}M</span>
                  </div>
                )}
                {user?.role === 'admin' && player.soldTo && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Sold To</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-300">{player.soldTo}</span>
                  </div>
                )}
              </div>

              {/* Career Records (Admin Only) */}
              {user?.role === 'admin' && player.careerRecords && (
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">📊 Career Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(player.careerRecords).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Badges */}
              <div className="mb-4 space-y-2">
                {/* Auction Status Badge */}
                <div>
                  <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    player.status === 'AVAILABLE'
                      ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-300 border border-red-500/50'
                  }`}>
                    {player.status === 'AVAILABLE' ? '🟢 AVAILABLE FOR AUCTION' : '🔴 SOLD'}
                  </span>
                </div>
              </div>

              {/* Actions (only for admins/auctioneers) */}
              {canManagePlayers && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(player)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg text-xs font-bold transition-all transform hover:scale-105"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg text-xs font-bold transition-all transform hover:scale-105"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gradient-to-br dark:from-slate-800/30 dark:to-slate-900/30 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-600 dark:text-slate-400 text-lg font-semibold">No players found</p>
          <p className="text-gray-500 dark:text-slate-500 text-sm mt-2">Add players to start the auction for {sport}</p>
        </div>
      )}

      <style>{`
        @keyframes in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Players;
