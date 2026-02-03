import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';

interface Team {
  id: string;
  name: string;
  sport: string;
  owner: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  playerCount: number;
  logoUrl?: string;
}

interface Player {
  id: string;
  name: string;
  sport: string;
  role: string;
  basePrice: number;
  currentBid: number;
  status: string;
  verified?: boolean;
  imageUrl?: string;
}

const TeamsAndPlayers: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'verification'>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [unverifiedPlayers, setUnverifiedPlayers] = useState<Player[]>([]);
  const [selectedSport, setSelectedSport] = useState(user?.sport || 'football');
  
  // Form states
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    owner: '',
    totalPurse: 10000000,
    logoUrl: ''
  });
  
  const [playerFormData, setPlayerFormData] = useState({
    name: '',
    role: '',
    basePrice: 0,
    imageUrl: ''
  });

  const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];

  useEffect(() => {
    fetchTeams();
    fetchPlayers();
    fetchUnverifiedPlayers();
  }, [selectedSport]);

  const fetchTeams = async () => {
    const data = await api.getEntity<Team>('teams', selectedSport);
    setTeams(data);
  };

  const fetchPlayers = async () => {
    const data = await api.getEntity<Player>('players', selectedSport);
    setPlayers(data);
  };

  const fetchUnverifiedPlayers = async () => {
    try {
      const response = await api.get(`/verification/${selectedSport}/pending`);
      if (response.data.success) {
        setUnverifiedPlayers(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching unverified players:', error);
    }
  };

  // Team handlers
  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeamId) {
      await api.updateEntity('teams', editingTeamId, { ...teamFormData, purseRemaining: teamFormData.totalPurse }, selectedSport);
    } else {
      await api.createEntity('teams', { ...teamFormData, purseRemaining: teamFormData.totalPurse }, selectedSport);
    }
    resetTeamForm();
    fetchTeams();
  };

  const handleEditTeam = (team: Team) => {
    setTeamFormData({ 
      name: team.name, 
      owner: team.owner, 
      totalPurse: team.totalPurse,
      logoUrl: team.logoUrl || ''
    });
    setEditingTeamId(team.id);
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (confirm('Delete this team?')) {
      await api.deleteEntity('teams', id, selectedSport);
      fetchTeams();
    }
  };

  const resetTeamForm = () => {
    setTeamFormData({ name: '', owner: '', totalPurse: 10000000, logoUrl: '' });
    setEditingTeamId(null);
    setShowTeamForm(false);
  };

  // Player handlers
  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlayerId) {
      await api.updateEntity('players', editingPlayerId, playerFormData, selectedSport);
    } else {
      await api.createEntity('players', playerFormData, selectedSport);
    }
    resetPlayerForm();
    fetchPlayers();
  };

  const handleEditPlayer = (player: Player) => {
    setPlayerFormData({ 
      name: player.name, 
      role: player.role, 
      basePrice: player.basePrice,
      imageUrl: player.imageUrl || ''
    });
    setEditingPlayerId(player.id);
    setShowPlayerForm(true);
  };

  const handleDeletePlayer = async (id: string) => {
    if (confirm('Delete this player?')) {
      await api.deleteEntity('players', id, selectedSport);
      fetchPlayers();
    }
  };

  const resetPlayerForm = () => {
    setPlayerFormData({ name: '', role: '', basePrice: 0, imageUrl: '' });
    setEditingPlayerId(null);
    setShowPlayerForm(false);
  };

  // Verification handlers
  const handleVerifyPlayer = async (playerId: string) => {
    try {
      const response = await api.post(`/verification/${selectedSport}/${playerId}/verify`, {
        userId: user?.id,
        userRole: user?.role
      });
      if (response.data.success) {
        alert('Player verified successfully!');
        fetchUnverifiedPlayers();
        fetchPlayers();
      }
    } catch (error) {
      console.error('Error verifying player:', error);
      alert('Failed to verify player');
    }
  };

  const handleRejectPlayer = async (playerId: string, reason: string) => {
    try {
      const response = await api.post(`/verification/${selectedSport}/${playerId}/reject`, {
        userId: user?.id,
        userRole: user?.role,
        reason
      });
      if (response.data.success) {
        alert('Player rejected');
        fetchUnverifiedPlayers();
      }
    } catch (error) {
      console.error('Error rejecting player:', error);
    }
  };

  const getSportIcon = (sport: string) => {
    const sportEmojis: { [key: string]: string } = {
      football: '⚽',
      cricket: '🏏', 
      basketball: '🏀',
      baseball: '⚾',
      volleyball: '🏐'
    };
    return sportEmojis[sport] || '⚽';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Teams & Players Management</h1>
        <p className="text-gray-700 dark:text-gray-400">Manage teams and players for your auctions</p>
      </div>

      {/* Sport Selector */}
      <div className="flex flex-wrap gap-2">
        {sports.map(sport => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedSport === sport
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="text-lg">{getSportIcon(sport)}</span>
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
            activeTab === 'teams'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          Teams ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
            activeTab === 'players'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          Players ({players.length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex-1 py-3 px-6 rounded-md font-medium transition-all ${
            activeTab === 'verification'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          ✅ Verification ({unverifiedPlayers.length})
        </button>
      </div>

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Add Team Button */}
          <button
            onClick={() => setShowTeamForm(!showTeamForm)}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] ${
              showTeamForm
                ? 'bg-gray-400 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-primary-500/30'
            }`}
          >
            {showTeamForm ? '✕ Cancel' : '+ Create New Team'}
          </button>

          {/* Team Form */}
          {showTeamForm && (
            <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingTeamId ? 'Edit Team' : 'Create New Team'}
              </h3>
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Owner Name"
                    value={teamFormData.owner}
                    onChange={(e) => setTeamFormData({ ...teamFormData, owner: e.target.value })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Total Purse"
                    value={teamFormData.totalPurse}
                    onChange={(e) => setTeamFormData({ ...teamFormData, totalPurse: Number(e.target.value) })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                  <input
                    type="url"
                    placeholder="Logo URL (optional)"
                    value={teamFormData.logoUrl}
                    onChange={(e) => setTeamFormData({ ...teamFormData, logoUrl: e.target.value })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                  >
                    ✓ {editingTeamId ? 'Update' : 'Create'} Team
                  </button>
                  {editingTeamId && (
                    <button
                      type="button"
                      onClick={resetTeamForm}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Teams Grid */}
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => {
                const spentBudget = team.totalPurse - team.purseRemaining;
                const spentPercentage = (spentBudget / team.totalPurse) * 100;
                return (
                  <div key={team.id} className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 hover:border-primary-400 dark:hover:border-cyan-500/50 rounded-2xl p-6 transition-all shadow-sm hover:shadow-lg dark:hover:shadow-cyan-500/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{team.name}</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">Owner: {team.owner}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Total Purse</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{(team.totalPurse / 10000000).toFixed(2)} Cr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Remaining</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">₹{(team.purseRemaining / 10000000).toFixed(2)} Cr</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${spentPercentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                        <span>Players: {team.playerCount || 0}</span>
                        <span>{spentPercentage.toFixed(0)}% spent</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="flex-1 py-2 bg-blue-100 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 rounded-lg text-sm font-semibold hover:bg-blue-200 dark:hover:bg-cyan-500/30 transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="flex-1 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-500/30 transition-all"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No teams yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Create teams to start the auction</p>
            </div>
          )}
        </div>
      )}

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {/* Add Player Button */}
          <button
            onClick={() => setShowPlayerForm(!showPlayerForm)}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] ${
              showPlayerForm
                ? 'bg-gray-400 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-blue-500/30'
            }`}
          >
            {showPlayerForm ? '✕ Cancel' : '+ Add New Player'}
          </button>

          {/* Player Form */}
          {showPlayerForm && (
            <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingPlayerId ? '✏️ Edit Player' : '⭐ Add New Player'}
              </h3>
              <form onSubmit={handlePlayerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Player Name"
                    value={playerFormData.name}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, name: e.target.value })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g., Batsman, Forward)"
                    value={playerFormData.role}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, role: e.target.value })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Base Price"
                    value={playerFormData.basePrice}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, basePrice: Number(e.target.value) })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    required
                  />
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={playerFormData.imageUrl}
                    onChange={(e) => setPlayerFormData({ ...playerFormData, imageUrl: e.target.value })}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                  >
                    ✓ {editingPlayerId ? 'Update' : 'Add'} Player
                  </button>
                  {editingPlayerId && (
                    <button
                      type="button"
                      onClick={resetPlayerForm}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Players Grid */}
          {players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map(player => (
                <div key={player.id} className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 hover:border-primary-400 dark:hover:border-cyan-500/50 rounded-2xl p-6 transition-all shadow-sm hover:shadow-lg dark:hover:shadow-cyan-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {player.imageUrl ? (
                        <img src={player.imageUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xl">⭐</div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{player.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 rounded text-xs font-semibold">{player.role}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Base Price</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{(player.basePrice / 10000000).toFixed(2)} Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        player.status === 'AVAILABLE' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {player.status || 'AVAILABLE'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Verified</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        player.verified ? 'bg-blue-100 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                      }`}>
                        {player.verified ? '✅ Yes' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="flex-1 py-2 bg-blue-100 dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 rounded-lg text-sm font-semibold hover:bg-blue-200 dark:hover:bg-cyan-500/30 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="flex-1 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-500/30 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 rounded-2xl">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No players yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Add players to be auctioned</p>
            </div>
          )}
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              ⚠️ Players must be verified before they can be added to an auction. Review and approve player registrations below.
            </p>
          </div>

          {unverifiedPlayers.length > 0 ? (
            <div className="space-y-4">
              {unverifiedPlayers.map((player: any) => (
                <div key={player.id} className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                  <div className="flex items-center space-x-4">
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt={player.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-2xl">👤</div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{player.name || player.playerName}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Role: {player.role}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Base Price: ₹{((player.basePrice || 0) / 10000000).toFixed(2)} Cr</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Requested: {new Date(player.requestedAt || player.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerifyPlayer(player.id || player.playerId)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all"
                    >
                      ✅ Verify
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) handleRejectPlayer(player.id || player.playerId, reason);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 rounded-2xl">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">All players verified!</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">No pending verification requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamsAndPlayers;
