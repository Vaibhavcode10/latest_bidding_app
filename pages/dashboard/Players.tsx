
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Player {
  id: string;
  name: string;
  sport: string;
  role: string;
  basePrice: number;
  currentBid: number;
  status: string;
  careerRecords: any;
  auctionPrice: number | null;
  soldTo: string | null;
}

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sport, setSport] = useState<string>('football');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    basePrice: 0,
  });

  const sports = ['football', 'cricket', 'volleyball', 'baseball', 'basketball'];

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 3000);
    return () => clearInterval(interval);
  }, [sport]);

  const fetchPlayers = async () => {
    const data = await api.get<Player>('players', sport);
    setPlayers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.update('players', editingId, formData, sport);
    } else {
      await api.create('players', formData, sport);
    }
    setFormData({ name: '', role: '', basePrice: 0 });
    setEditingId(null);
    setShowForm(false);
    fetchPlayers();
  };

  const handleEdit = (player: Player) => {
    setFormData({ name: player.name, role: player.role, basePrice: player.basePrice });
    setEditingId(player.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this player?')) {
      await api.delete('players', id, sport);
      fetchPlayers();
    }
  };

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
            Player Auction
          </h2>
          <p className="text-slate-400 text-sm">Manage and bid on professional athletes</p>
        </div>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className={`px-6 py-3 bg-gradient-to-r ${getSportColor(sport)} text-white rounded-xl text-sm font-bold transition-all transform hover:scale-105 shadow-lg`}
        >
          {sports.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Add Player Button */}
      <div className="flex justify-between items-center">
        <p className="text-slate-400 font-semibold">{players.length} Athletes Available</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
            showForm
              ? 'bg-slate-700 text-slate-300'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/50'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Add Player'}
        </button>
      </div>

      {/* Add Player Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-2xl p-8 animate-in fade-in slide-in-from-top">
          <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {editingId ? '✏️ Edit Player' : '⭐ Add New Player'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Player Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="text"
                placeholder="Role (e.g., Forward)"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="number"
                placeholder="Base Price"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
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
              className="group bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-slate-800 hover:to-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Player Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all mb-1">
                    {player.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs font-semibold">
                      {player.role}
                    </span>
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getSportColor(sport)} flex items-center justify-center text-xl font-bold transform group-hover:scale-110 transition-transform`}>
                  #{players.indexOf(player) + 1}
                </div>
              </div>

              {/* Price Info */}
              <div className="space-y-2 mb-4 pb-4 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Base Price</span>
                  <span className="text-2xl font-black text-emerald-400">${(player.basePrice / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Current Bid</span>
                  <span className="text-lg font-bold text-amber-400">${(player.currentBid / 1000000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  player.status === 'AVAILABLE'
                    ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/50 animate-pulse'
                    : 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-300 border border-red-500/50'
                }`}>
                  {player.status === 'AVAILABLE' ? '🟢 AVAILABLE FOR AUCTION' : '🔴 SOLD'}
                </span>
              </div>

              {/* Actions */}
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
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700 rounded-2xl">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-slate-400 text-lg font-semibold">No players found</p>
          <p className="text-slate-500 text-sm mt-2">Add players to start the auction for {sport}</p>
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
