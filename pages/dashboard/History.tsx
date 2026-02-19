import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  sport?: string;
  playerId?: string;
  playerName?: string;
  role?: string;
  basePrice?: number;
  adminUserId?: string;
  deletedBy?: string;
  deletedByRole?: string;
  previousStatus?: string;
  newStatus?: string;
  soldPrice?: number;
  soldTo?: string;
  verified?: boolean;
}

export const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verification' | 'deletion'>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/verification/history', {
        params: { userRole: user?.role }
      });
      
      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'verification') return entry.action === 'PLAYER_VERIFICATION';
    if (filter === 'deletion') return entry.action === 'PLAYER_DELETION';
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PLAYER_VERIFICATION':
        return '✅';
      case 'PLAYER_DELETION':
        return '🗑️';
      default:
        return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'PLAYER_VERIFICATION':
        return 'text-green-400';
      case 'PLAYER_DELETION':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  const getActionTitle = (entry: HistoryEntry) => {
    switch (entry.action) {
      case 'PLAYER_VERIFICATION':
        return `Player ${entry.newStatus === 'VERIFIED' ? 'Verified' : 'Unverified'}`;
      case 'PLAYER_DELETION':
        return 'Player Deleted';
      default:
        return entry.action;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            📚 System History
          </h1>
          <p className="text-gray-400">
            Complete audit trail of all player actions and administrative changes
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              All Actions ({history.length})
            </button>
            <button
              onClick={() => setFilter('verification')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'verification'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Verifications ({history.filter(h => h.action === 'PLAYER_VERIFICATION').length})
            </button>
            <button
              onClick={() => setFilter('deletion')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'deletion'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Deletions ({history.filter(h => h.action === 'PLAYER_DELETION').length})
            </button>
          </div>
        </div>

        {/* History Timeline */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No History Found</h3>
            <p className="text-gray-500">No actions have been recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Action Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                        {getActionIcon(entry.action)}
                      </div>
                    </div>

                    {/* Action Details */}
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`text-lg font-semibold ${getActionColor(entry.action)}`}>
                          {getActionTitle(entry)}
                        </h3>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded uppercase font-medium">
                          {entry.sport}
                        </span>
                      </div>

                      {/* Player Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-gray-400 text-sm">Player:</span>
                          <p className="text-white font-medium">{entry.playerName}</p>
                        </div>
                        
                        {entry.role && (
                          <div>
                            <span className="text-gray-400 text-sm">Role:</span>
                            <p className="text-white">{entry.role}</p>
                          </div>
                        )}
                        
                        {entry.basePrice && (
                          <div>
                            <span className="text-gray-400 text-sm">Base Price:</span>
                            <p className="text-white">₹{formatPrice(entry.basePrice)}</p>
                          </div>
                        )}

                        {/* Verification specific details */}
                        {entry.action === 'PLAYER_VERIFICATION' && (
                          <>
                            <div>
                              <span className="text-gray-400 text-sm">Status Change:</span>
                              <p className="text-white">
                                <span className="text-red-400">{entry.previousStatus}</span>
                                <span className="mx-2">→</span>
                                <span className="text-green-400">{entry.newStatus}</span>
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400 text-sm">Verified By:</span>
                              <p className="text-white">{entry.adminUserId}</p>
                            </div>
                          </>
                        )}

                        {/* Deletion specific details */}
                        {entry.action === 'PLAYER_DELETION' && (
                          <>
                            <div>
                              <span className="text-gray-400 text-sm">Deleted By:</span>
                              <p className="text-white">
                                {entry.deletedBy} 
                                <span className="text-gray-400 ml-1">({entry.deletedByRole})</span>
                              </p>
                            </div>
                            
                            {entry.soldPrice && (
                              <div>
                                <span className="text-gray-400 text-sm">Was Sold For:</span>
                                <p className="text-white">${entry.soldPrice.toLocaleString()}</p>
                              </div>
                            )}

                            <div>
                              <span className="text-gray-400 text-sm">Was Verified:</span>
                              <p className={entry.verified ? 'text-green-400' : 'text-red-400'}>
                                {entry.verified ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};