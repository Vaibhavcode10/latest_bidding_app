import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

interface Auction {
  id: string;
  name: string;
  sport: string;
  description: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'CREATED' | 'READY';
  createdBy: string;
  createdAt: string;
  registeredPlayers: Array<{
    id: string;
    name: string;
    registeredAt: string;
  }>;
  assignedAuctioneer?: {
    id: string;
    name: string;
    assignedAt: string;
  };
  participatingTeams: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    purseRemaining: number;
    totalPurse: number;
  }>;
  playerPool?: string[];
  settings: {
    minBidIncrement: number;
    maxPlayersPerTeam: number;
    bidTimeLimit: number;
  };
}

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
  // Auctioneers are neutral - they don't have franchises
  sport?: string;
}

export const AuctionManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('football');
  const [activeTab, setActiveTab] = useState<'auctions' | 'create'>('auctions');
  const [viewingAuction, setViewingAuction] = useState<Auction | null>(null);

  const sports = ['football', 'cricket', 'basketball', 'baseball', 'volleyball'];

  useEffect(() => {
    fetchAuctions();
    fetchAuctioneers();
    fetchTeams();
  }, [selectedSport]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auctions/${selectedSport}`);
      if (response.data.success) {
        setAuctions(response.data.auctions);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get(`/teams/${selectedSport}`);
      setTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
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

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm('Are you sure you want to delete this auction?')) return;

    try {
      const response = await api.delete(`/auctions/${selectedSport}/${auctionId}`, {
        params: { userRole: user?.role, userId: user?.id }
      });

      if (response.data.success) {
        alert('Auction deleted successfully!');
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error deleting auction:', error);
      alert('Failed to delete auction');
    }
  };

  const handleUpdateStatus = async (auctionId: string, status: string) => {
    try {
      const response = await api.put(`/auctions/${selectedSport}/${auctionId}`, {
        status,
        userRole: user?.role,
        userId: user?.id
      });

      if (response.data.success) {
        alert('Auction status updated!');
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error updating auction:', error);
      alert('Failed to update auction');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-400 dark:border-yellow-500/50';
      case 'READY': return 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-400 dark:border-cyan-500/50';
      case 'SCHEDULED': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-500/50';
      case 'LIVE': return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 border-green-400 dark:border-green-500/50 animate-pulse';
      case 'COMPLETED': return 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300 border-gray-400 dark:border-gray-500/50';
      case 'CANCELLED': return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border-red-400 dark:border-red-500/50';
      default: return 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300 border-gray-400 dark:border-gray-500/50';
    }
  };

  const getSportEmoji = (sport: string) => {
    const emojis: { [key: string]: string } = {
      football: '⚽',
      cricket: '🏏',
      basketball: '🏀',
      baseball: '⚾',
      volleyball: '🏐'
    };
    return emojis[sport] || '🏆';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-slate-400 text-lg font-semibold">Access Denied</p>
        <p className="text-slate-500 text-sm mt-2">Only admins can manage auctions</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Auction Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage auctions</p>
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
            {getSportEmoji(sport)} {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </button>
        ))}
      </div>



      {/* Create Auction Button */}
      <button
        onClick={() => navigate('/dashboard/auctions/create', { state: { sport: selectedSport } })}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
      >
        ➕ Create New Auction for {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}
      </button>

      {/* Auctions Tab */}
      {activeTab === 'auctions' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading auctions...</p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-6xl mb-4">💭</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No auctions yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Create your first auction for {selectedSport}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {auctions.map(auction => (
                <div
                  key={auction.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 dark:border-blue-900/50 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {auction.logoUrl && (
                        <img 
                          src={auction.logoUrl} 
                          alt={auction.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-600"
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{auction.name}</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{auction.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                      {auction.status}
                    </span>
                  </div>

                  {/* Assigned Auctioneer & Teams & Player Pool */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Assigned Auctioneer */}
                    {auction.assignedAuctioneer && (
                      <div className="p-3 bg-blue-100 dark:bg-blue-600/20 border-2 border-blue-300 dark:border-blue-500/30 rounded-lg">
                        <p className="text-gray-700 dark:text-blue-200 text-xs mb-1 font-medium">Assigned Auctioneer</p>
                        <p className="text-blue-700 dark:text-blue-300 font-semibold">{auction.assignedAuctioneer.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Assigned {formatDate(auction.assignedAuctioneer.assignedAt)}</p>
                      </div>
                    )}
                    
                    {/* Participating Teams */}
                    {auction.participatingTeams && auction.participatingTeams.length > 0 && (
                      <div className="p-3 bg-green-100 dark:bg-green-600/20 border-2 border-green-300 dark:border-green-500/30 rounded-lg">
                        <p className="text-gray-700 dark:text-green-200 text-xs mb-2 font-medium">Participating Teams ({auction.participatingTeams.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {auction.participatingTeams.slice(0, 3).map(team => (
                            <div key={team.id} className="flex items-center space-x-1 bg-white dark:bg-slate-700/50 px-2 py-1 rounded border border-green-200 dark:border-green-700 text-xs">
                              {team.logoUrl && <img src={team.logoUrl} alt={team.name} className="w-4 h-4 rounded" />}
                              <span className="text-green-800 dark:text-green-300">{team.name}</span>
                            </div>
                          ))}
                          {auction.participatingTeams.length > 3 && (
                            <span className="text-gray-700 dark:text-gray-400 text-xs font-medium">+{auction.participatingTeams.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Player Pool */}
                    {auction.playerPool && auction.playerPool.length > 0 && (
                      <div className="p-3 bg-purple-100 dark:bg-purple-600/20 border-2 border-purple-300 dark:border-purple-500/30 rounded-lg">
                        <p className="text-gray-700 dark:text-purple-200 text-xs mb-1 font-medium">Player Pool</p>
                        <p className="text-purple-700 dark:text-purple-300 font-semibold text-lg">{auction.playerPool.length} Players</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Verified & ready for auction</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">Start Date</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{formatDate(auction.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">End Date</p>
                      <p className="text-gray-900 dark:text-white font-semibold">{formatDate(auction.endDate)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setViewingAuction(auction)}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-600/30 transition-all border border-blue-300 dark:border-blue-600"
                    >
                      👁️ View Details
                    </button>
                    {auction.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleUpdateStatus(auction.id, 'LIVE')}
                        className="px-4 py-2 bg-green-100 dark:bg-green-600/20 text-green-800 dark:text-green-300 rounded-lg text-sm font-semibold hover:bg-green-200 dark:hover:bg-green-600/30 transition-all border border-green-300 dark:border-green-600"
                      >
                        🚀 Start Auction
                      </button>
                    )}
                    {auction.status === 'LIVE' && (
                      <button
                        onClick={() => handleUpdateStatus(auction.id, 'COMPLETED')}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-600/20 text-gray-800 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600/30 transition-all border border-gray-300 dark:border-gray-600"
                      >
                        ✅ End Auction
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAuction(auction.id)}
                      className="px-4 py-2 bg-red-100 dark:bg-red-600/20 text-red-800 dark:text-red-300 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-600/30 transition-all border border-red-300 dark:border-red-600"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Auction Details Modal */}
      {viewingAuction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setViewingAuction(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-300 dark:border-blue-700 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {viewingAuction.logoUrl && (
                  <img 
                    src={viewingAuction.logoUrl} 
                    alt={viewingAuction.name} 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-blue-300 dark:border-blue-700"
                  />
                )}
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{viewingAuction.name}</h2>
                  <p className="text-gray-700 dark:text-gray-300">{viewingAuction.description}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(viewingAuction.status)}`}>
                    {viewingAuction.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingAuction(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Auction Information */}
            <div className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">Start Date & Time</p>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">{formatDate(viewingAuction.startDate)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">End Date & Time</p>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">{formatDate(viewingAuction.endDate)}</p>
                </div>
              </div>

              {/* Assigned Auctioneer */}
              {viewingAuction.assignedAuctioneer && (
                <div className="p-5 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl">
                  <h3 className="text-gray-800 dark:text-blue-200 text-lg font-bold mb-3">👤 Assigned Auctioneer</h3>
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-blue-700 dark:text-blue-300 font-bold text-xl">{viewingAuction.assignedAuctioneer.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Assigned on {formatDate(viewingAuction.assignedAuctioneer.assignedAt)}</p>
                  </div>
                </div>
              )}
              
              {/* Participating Teams */}
              {viewingAuction.participatingTeams && viewingAuction.participatingTeams.length > 0 && (
                <div className="p-5 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-xl">
                  <h3 className="text-gray-800 dark:text-green-200 text-lg font-bold mb-3">🏆 Participating Teams ({viewingAuction.participatingTeams.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewingAuction.participatingTeams.map(team => (
                      <div key={team.id} className="bg-white dark:bg-gray-800/50 p-4 rounded-lg flex items-center space-x-3 border border-green-200 dark:border-green-800">
                        {team.logoUrl && <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />}
                        <div className="flex-1">
                          <p className="text-green-800 dark:text-green-300 font-bold">{team.name}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Purse: ₹{formatPrice(team.purseRemaining)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Player Pool */}
              {viewingAuction.playerPool && viewingAuction.playerPool.length > 0 && (
                <div className="p-5 bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-xl">
                  <h3 className="text-gray-800 dark:text-purple-200 text-lg font-bold mb-3">⚡ Player Pool ({viewingAuction.playerPool.length} Players)</h3>
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-purple-700 dark:text-purple-300 font-semibold text-xl">{viewingAuction.playerPool.length} Verified Players</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ready for auction bidding</p>
                  </div>
                </div>
              )}

              {/* Auction Settings */}
              <div className="p-5 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-700 rounded-xl">
                <h3 className="text-gray-800 dark:text-orange-200 text-lg font-bold mb-3">⚙️ Auction Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Min Bid Increment</p>
                    <p className="text-orange-700 dark:text-orange-300 font-bold text-lg">₹{(viewingAuction.settings.minBidIncrement / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Max Players/Team</p>
                    <p className="text-orange-700 dark:text-orange-300 font-bold text-lg">{viewingAuction.settings.maxPlayersPerTeam}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Bid Time Limit</p>
                    <p className="text-orange-700 dark:text-orange-300 font-bold text-lg">{viewingAuction.settings.bidTimeLimit}s</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Created By</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{viewingAuction.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Created At</p>
                    <p className="text-gray-900 dark:text-white font-semibold">{formatDate(viewingAuction.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewingAuction(null)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManagement;
