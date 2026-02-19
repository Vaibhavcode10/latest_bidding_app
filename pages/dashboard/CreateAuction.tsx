import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

interface Team {
  id: string;
  name: string;
  sport: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  logoUrl?: string;
}

interface Auctioneer {
  id: string;
  username: string;
  name: string;
  sport?: string;
}

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  imageUrl?: string;
}

export const CreateAuction: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedSport, setSelectedSport] = useState((location.state as any)?.sport || 'football');
  const [teams, setTeams] = useState<Team[]>([]);
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [verifiedPlayers, setVerifiedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    startDate: '',
    endDate: '',
    minBidIncrement: 100000,
    maxPlayersPerTeam: 15,
    bidTimeLimit: 30,
    selectedTeams: [] as string[],
    selectedPlayers: [] as string[],
    assignedAuctioneerId: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedSport]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchTeams(), fetchAuctioneers(), fetchVerifiedPlayers()]);
    setLoading(false);
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get(`/teams/${selectedSport}`);
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchVerifiedPlayers = async () => {
    try {
      const response = await api.get(`/players/${selectedSport}`);
      const availablePlayers = (response.data || []).filter(
        (p: any) => p.status === 'AVAILABLE' || !p.status
      );
      setVerifiedPlayers(availablePlayers);
    } catch (error) {
      console.error('Error fetching verified players:', error);
    }
  };

  const fetchAuctioneers = async () => {
    try {
      const response = await api.get(`/auctions/auctioneers/all/${selectedSport}`, {
        params: { userRole: user?.role }
      });
      if (response.data.success) {
        setAuctioneers(response.data.auctioneers);
      }
    } catch (error) {
      console.error('Error fetching auctioneers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedTeams.length < 2) {
      alert('Please select at least 2 teams for the auction.');
      return;
    }
    
    if (!formData.assignedAuctioneerId) {
      alert('Please assign an auctioneer to the auction.');
      return;
    }
    
    if (formData.selectedPlayers.length === 0) {
      alert('Please select at least 1 verified player for the auction.');
      return;
    }

    try {
      const selectedTeamsData = teams.filter(team => formData.selectedTeams.includes(team.id));
      const assignedAuctioneer = auctioneers.find(a => a.id === formData.assignedAuctioneerId);
      
      const response = await api.post(`/auctions/${selectedSport}`, {
        name: formData.name,
        description: formData.description,
        logoUrl: formData.logoUrl,
        startDate: formData.startDate,
        endDate: formData.endDate,
        participatingTeams: selectedTeamsData.map(team => ({
          id: team.id,
          name: team.name,
          logoUrl: team.logoUrl,
          purseRemaining: team.purseRemaining,
          totalPurse: team.totalPurse
        })),
        playerPool: formData.selectedPlayers,
        assignedAuctioneerId: formData.assignedAuctioneerId,
        assignedAuctioneerName: assignedAuctioneer?.name,
        settings: {
          minBidIncrement: formData.minBidIncrement,
          maxPlayersPerTeam: formData.maxPlayersPerTeam,
          bidTimeLimit: formData.bidTimeLimit
        },
        userRole: user?.role,
        userId: user?.id
      });

      if (response.data.success) {
        alert('Auction created successfully!');
        navigate('/dashboard/auctions');
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      alert('Failed to create auction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 p-4">
      <form onSubmit={handleSubmit} className="max-w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-blue-200 dark:border-blue-900">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Auction
              </h1>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sport:</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {sports.map(sport => (
                    <option key={sport} value={sport}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/auctions')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase">Basic Info</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start *</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End *</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={e => setFormData({...formData, endDate: e.target.value})}
                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase">Settings</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bid ₹</label>
                    <input
                      type="number"
                      value={formData.minBidIncrement}
                      onChange={e => setFormData({...formData, minBidIncrement: parseInt(e.target.value)})}
                      className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Players</label>
                    <input
                      type="number"
                      value={formData.maxPlayersPerTeam}
                      onChange={e => setFormData({...formData, maxPlayersPerTeam: parseInt(e.target.value)})}
                      className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time(s)</label>
                    <input
                      type="number"
                      value={formData.bidTimeLimit}
                      onChange={e => setFormData({...formData, bidTimeLimit: parseInt(e.target.value)})}
                      className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Auctioneer */}
              <div>
                <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase">Auctioneer *</h3>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {auctioneers.map(auctioneer => (
                    <div
                      key={auctioneer.id}
                      onClick={() => setFormData({...formData, assignedAuctioneerId: auctioneer.id})}
                      className={`p-2 rounded border cursor-pointer transition-all ${
                        formData.assignedAuctioneerId === auctioneer.id
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {auctioneer.name.charAt(0)}
                        </div>
                        <p className="font-semibold text-xs text-gray-900 dark:text-white truncate flex-1">{auctioneer.name}</p>
                        {formData.assignedAuctioneerId === auctioneer.id && <span className="text-blue-500 text-sm">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle Column - Teams */}
            <div>
              <h3 className="text-sm font-bold text-green-600 dark:text-green-400 mb-2 uppercase">Teams ({formData.selectedTeams.length})</h3>
              <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => {
                      const isSelected = formData.selectedTeams.includes(team.id);
                      setFormData({
                        ...formData,
                        selectedTeams: isSelected
                          ? formData.selectedTeams.filter(id => id !== team.id)
                          : [...formData.selectedTeams, team.id]
                      });
                    }}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      formData.selectedTeams.includes(team.id)
                        ? 'bg-green-100 dark:bg-green-900/40 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {team.logoUrl && <img src={team.logoUrl} alt={team.name} className="w-7 h-7 rounded-full object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">{team.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">₹{formatPrice(team.purseRemaining)}</p>
                      </div>
                      {formData.selectedTeams.includes(team.id) && <span className="text-green-500 text-sm">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Players */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase">Players ({formData.selectedPlayers.length})</h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, selectedPlayers: verifiedPlayers.map(p => p.id)})}
                    className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded font-medium hover:bg-orange-600"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, selectedPlayers: []})}
                    className="px-2 py-0.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded font-medium hover:bg-gray-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {verifiedPlayers.map(player => (
                  <div
                    key={player.id}
                    onClick={() => {
                      const isSelected = formData.selectedPlayers.includes(player.id);
                      setFormData({
                        ...formData,
                        selectedPlayers: isSelected
                          ? formData.selectedPlayers.filter(id => id !== player.id)
                          : [...formData.selectedPlayers, player.id]
                      });
                    }}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      formData.selectedPlayers.includes(player.id)
                        ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-500'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-orange-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs">
                        {player.name.charAt(0)}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white text-xs truncate">{player.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{player.role}</p>
                      <p className="text-xs text-gray-500">₹{formatPrice(player.basePrice)}</p>
                      {formData.selectedPlayers.includes(player.id) && <span className="text-orange-500 text-sm">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/dashboard/auctions')}
              className="flex-1 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              Create Auction
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateAuction;
