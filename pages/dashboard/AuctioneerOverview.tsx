import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiBase } from '../../config/index.js';

const AuctioneerOverview: React.FC = () => {
  const { user, franchise } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(franchise || {
    id: '',
    name: '',
    auctioneerId: '',
    sport: '',
    city: '',
    stadium: '',
    totalPurse: 0,
    purseRemaining: 0,
    playerCount: 0,
    wins: 0,
    losses: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['totalPurse', 'purseRemaining', 'wins', 'losses', 'playerCount'].includes(name) 
        ? parseInt(value) 
        : value,
    });
  };

  const handleSave = async () => {
    if (!franchise || !user) return;
    
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/auctioneers/franchise/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          franchiseId: franchise.id,
          auctioneerId: user.id,
          sport: user.sport,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving franchise:', error);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    city: '',
    stadium: '',
    totalPurse: 50000000,
  });

  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: name === 'totalPurse' ? parseInt(value) : value,
    });
  };

  const handleCreateFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/auctioneers/franchise/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auctioneerId: user.id,
          sport: user.sport,
          name: createFormData.name,
          city: createFormData.city,
          stadium: createFormData.stadium,
          auctioneerName: user.username,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload page to show new franchise
        window.location.reload();
      } else {
        alert(data.message || 'Failed to create franchise');
      }
    } catch (error) {
      console.error('Error creating franchise:', error);
      alert('Error creating franchise');
    }
  };

  const handleCancel = () => {
    setFormData(franchise || {
      id: '',
      name: '',
      auctioneerId: '',
      sport: '',
      city: '',
      stadium: '',
      totalPurse: 0,
      purseRemaining: 0,
      playerCount: 0,
      wins: 0,
      losses: 0,
    });
    setIsEditing(false);
  };

  if (!franchise) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-12 backdrop-blur-xl text-center">
          <h1 className="text-4xl font-black text-white mb-4">🏆 Create Your Franchise</h1>
          <p className="text-slate-400 mb-8">You don't have a franchise yet. Create one now to get started!</p>
        </div>

        {/* Create Franchise Form */}
        <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl max-w-2xl mx-auto">
          <form onSubmit={handleCreateFranchise} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Franchise Name *</label>
              <input
                type="text"
                name="name"
                value={createFormData.name}
                onChange={handleCreateInputChange}
                placeholder="Enter your franchise name..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={createFormData.city}
                  onChange={handleCreateInputChange}
                  placeholder="e.g., New York..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Stadium Name</label>
                <input
                  type="text"
                  name="stadium"
                  value={createFormData.stadium}
                  onChange={handleCreateInputChange}
                  placeholder="e.g., Sports Arena..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Total Purse (₹) *</label>
              <input
                type="number"
                name="totalPurse"
                value={createFormData.totalPurse}
                onChange={handleCreateInputChange}
                min="1000000"
                step="1000000"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Default: ₹{(50000000).toLocaleString()}</p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-lg transition-all"
            >
              🚀 Create Franchise
            </button>
          </form>
        </div>
      </div>
    );
  }

  const purseUsed = franchise.totalPurse - franchise.purseRemaining;
  const pursePercentage = (purseUsed / franchise.totalPurse) * 100;

  return (
    <div className="space-y-8">
      {/* Franchise Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">{franchise.name}</h1>
            <p className="text-slate-400 text-lg mb-4">Owner: {user?.username}</p>
            <div className="flex gap-8">
              <div>
                <p className="text-slate-500 text-sm mb-1">Sport</p>
                <p className="text-white font-bold text-lg">{user?.sport?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Win-Loss Record</p>
                <p className="text-white font-bold text-lg">{franchise.wins}W - {franchise.losses}L</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm mb-1">Location</p>
                <p className="text-white font-bold text-lg">{franchise.city || 'N/A'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (isEditing) handleCancel();
              else setIsEditing(true);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isEditing
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isEditing ? 'Cancel' : '✏️ Edit Franchise'}
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl space-y-6">
              <h3 className="text-xl font-bold text-white">Edit Franchise Details</h3>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Franchise Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Total Purse</label>
                  <input
                    type="number"
                    name="totalPurse"
                    value={formData.totalPurse}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Remaining Purse</label>
                  <input
                    type="number"
                    name="purseRemaining"
                    value={formData.purseRemaining}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Wins</label>
                  <input
                    type="number"
                    name="wins"
                    value={formData.wins}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Losses</label>
                  <input
                    type="number"
                    name="losses"
                    value={formData.losses}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Stadium</label>
                  <input
                    type="text"
                    name="stadium"
                    value={formData.stadium}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                >
                  ✓ Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-6">Franchise Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                    <p className="text-slate-400">Franchise Name</p>
                    <p className="text-white font-semibold">{franchise.name}</p>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                    <p className="text-slate-400">Owner</p>
                    <p className="text-white font-semibold">{user?.username}</p>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                    <p className="text-slate-400">Sport</p>
                    <p className="text-white font-semibold">{user?.sport?.toUpperCase()}</p>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                    <p className="text-slate-400">City</p>
                    <p className="text-white font-semibold">{franchise.city || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                    <p className="text-slate-400">Stadium</p>
                    <p className="text-white font-semibold">{franchise.stadium || 'N/A'}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-slate-400">Player Count</p>
                    <p className="text-white font-semibold">{franchise.playerCount}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats Cards */}
        <div className="space-y-6">
          {/* Purse Status */}
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6">Budget Status</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Total Purse</p>
                <p className="text-3xl font-bold text-blue-400">₹{franchise.totalPurse.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-slate-400 text-sm">Spent</p>
                  <p className="text-white font-semibold">₹{purseUsed.toLocaleString()}</p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all"
                    style={{ width: `${Math.min(pursePercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400">{pursePercentage.toFixed(1)}% used</p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Remaining</p>
                <p className="text-2xl font-bold text-green-400">₹{franchise.purseRemaining.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Wins</p>
                <p className="text-3xl font-bold text-green-400">{franchise.wins}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Losses</p>
                <p className="text-3xl font-bold text-red-400">{franchise.losses}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Win Rate</p>
                <p className="text-2xl font-bold text-blue-400">
                  {((franchise.wins / (franchise.wins + franchise.losses)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerOverview;
