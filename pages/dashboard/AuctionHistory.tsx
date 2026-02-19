import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

interface AuctionHistoryItem {
  auctionId: string;
  auctionName: string;
  sport: string;
  auctioneerId: string;
  auctioneerName: string;
  startedAt: string;
  completedAt: string;
  totalDuration: number;
  status: 'COMPLETED' | 'TERMINATED';
  teamCount: number;
  playerResults: any[];
  currentStats: {
    playersAuctioned: number;
    playersSold: number;
    playersUnsold: number;
    totalSpent: number;
    averageSalePrice: number;
    highestSale: number;
    soldPercentage: number;
  };
}

interface AuctionStats {
  totalAuctions: number;
  totalPlayersAuctioned: number;
  totalPlayersSold: number;
  totalPlayersUnsold: number;
  totalAmountSpent: number;
  averageAuctionDuration: number;
  topSales: any[];
  sportBreakdown: Record<string, any>;
  monthlyBreakdown: Record<string, any>;
}

interface Props {
  userRole: string;
  userId: string;
  sport?: string;
}

const AuctionHistory: React.FC<Props> = ({ userRole, userId, sport }) => {
  const [history, setHistory] = useState<AuctionHistoryItem[]>([]);
  const [stats, setStats] = useState<AuctionStats | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState(sport || 'all');

  // Format currency values
  const formatCurrency = (amount: number) => {
    return `₹${formatPrice(amount)}`;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load auction history
  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await api.getAuctionHistory(
        userRole, 
        userId, 
        selectedSport === 'all' ? undefined : selectedSport
      );
      
      if (response.data.success) {
        setHistory(response.data.history);
        setError('');
      } else {
        setError(response.data.error || 'Failed to load auction history');
      }
    } catch (err) {
      setError('Network error loading history');
    } finally {
      setLoading(false);
    }
  };

  // Load auction statistics
  const loadStats = async () => {
    try {
      const response = await api.getAuctionStats(
        userRole,
        userId,
        selectedSport === 'all' ? undefined : selectedSport
      );
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load auction details
  const loadAuctionDetails = async (auctionId: string) => {
    setLoading(true);
    try {
      const response = await api.getAuctionDetails(auctionId, userRole, userId);
      
      if (response.data.success) {
        setSelectedAuction(response.data.auction);
        setError('');
      } else {
        setError(response.data.error || 'Failed to load auction details');
      }
    } catch (err) {
      setError('Network error loading auction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [selectedSport, userRole, userId]);

  // Access control check
  if (userRole !== 'admin' && userRole !== 'auctioneer') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300">Only administrators and auctioneers can view auction history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-600 dark:text-blue-400">Auction History</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">View completed auction records and statistics</p>
          </div>

          {/* Sport Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Sport:</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Sports</option>
              <option value="cricket">Cricket</option>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="baseball">Baseball</option>
              <option value="volleyball">Volleyball</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Auctions</h3>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.totalAuctions}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Players Auctioned</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalPlayersAuctioned}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Amount Spent</h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.totalAmountSpent)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Success Rate</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalPlayersAuctioned > 0 
                  ? ((stats.totalPlayersSold / stats.totalPlayersAuctioned) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        )}

        {/* Auction History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Auction Records</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading auction history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No auction history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Auction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Amount Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                  {history.map((auction) => (
                    <tr key={auction.auctionId} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{auction.auctionName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">by {auction.auctioneerName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-blue-900 text-primary-800 dark:text-blue-200">
                          {auction.sport}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDuration(auction.totalDuration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="text-green-600 dark:text-green-400">{auction.currentStats.playersSold}</span>
                          /
                          <span className="text-red-600 dark:text-red-400">{auction.currentStats.playersUnsold}</span>
                          <span className="text-gray-500"> ({auction.currentStats.playersAuctioned})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(auction.currentStats.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {auction.currentStats.soldPercentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(auction.completedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => loadAuctionDetails(auction.auctionId)}
                          className="text-primary-600 dark:text-blue-400 hover:text-primary-500 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auction Details Modal */}
        {selectedAuction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAuction.auctionName} - Details</h3>
                <button
                  onClick={() => setSelectedAuction(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                {/* Auction Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Auction Info</h4>
                    <p className="text-white">Sport: {selectedAuction.sport}</p>
                    <p className="text-white">Teams: {selectedAuction.teamCount}</p>
                    <p className="text-white">Status: <span className="text-green-400">{selectedAuction.status}</span></p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Timeline</h4>
                    <p className="text-white">Started: {formatDate(selectedAuction.startedAt)}</p>
                    <p className="text-white">Completed: {formatDate(selectedAuction.completedAt)}</p>
                    <p className="text-white">Duration: {formatDuration(selectedAuction.totalDuration)}</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Performance</h4>
                    <p className="text-white">Success Rate: {selectedAuction.currentStats.soldPercentage.toFixed(1)}%</p>
                    <p className="text-white">Highest Sale: {formatCurrency(selectedAuction.currentStats.highestSale)}</p>
                    <p className="text-white">Average Sale: {formatCurrency(selectedAuction.currentStats.averageSalePrice)}</p>
                  </div>
                </div>

                {/* Player Results */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Player Results ({selectedAuction.playerResults.length})</h4>
                  <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Player</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Base Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Final Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Team</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Bids</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {selectedAuction.playerResults.map((result: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-white">{result.playerName}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{formatCurrency(result.basePrice)}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {result.finalPrice ? formatCurrency(result.finalPrice) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {result.winningTeam?.teamName || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.status === 'SOLD' 
                                  ? 'bg-green-900 text-green-200'
                                  : 'bg-red-900 text-red-200'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{result.totalBids}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionHistory;