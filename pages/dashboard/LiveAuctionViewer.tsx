import React, { useState } from 'react';
import { useLiveAuction } from '../../context/LiveAuctionContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { BidEntry } from '../../types';
import { formatPrice } from '../../utils/formatPrice';

export const LiveAuctionViewer: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    session,
    ledger,
    teams,
    currentPlayer,
    hasActiveAuction,
    isLoading,
    timeRemaining,
    isTimerRunning,
    getPlayerHistory
  } = useLiveAuction();

  const [selectedHistoryPlayerId, setSelectedHistoryPlayerId] = useState<string | null>(null);
  const [playerHistory, setPlayerHistory] = useState<BidEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load player history
  const handleViewHistory = async (playerId: string) => {
    setSelectedHistoryPlayerId(playerId);
    setLoadingHistory(true);
    const history = await getPlayerHistory(playerId);
    setPlayerHistory(history);
    setLoadingHistory(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center">
        <div className="text-gray-800 dark:text-white text-xl">Loading auction...</div>
      </div>
    );
  }

  // No active auction
  if (!hasActiveAuction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl p-12 text-center max-w-md shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Live Auction</h2>
          <p className="text-gray-600 dark:text-gray-300">
            There is no live auction in progress right now. Check back later or contact the admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-500/20 border border-red-400 dark:border-red-500 rounded-full mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
            <span className="text-red-600 dark:text-red-300 font-semibold">LIVE</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{session?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Auctioneer: {session?.auctioneerName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Current Player */}
          <div className="lg:col-span-1">
            {ledger && currentPlayer ? (
              <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl p-6 text-center shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">CURRENT PLAYER</div>
                
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl">
                  {currentPlayer.imageUrl ? (
                    <img src={currentPlayer.imageUrl} alt={currentPlayer.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{ledger.playerName}</h2>
                <p className="text-purple-600 dark:text-purple-300 mb-4">{currentPlayer.role}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3">
                    <div className="text-gray-500 dark:text-gray-400">Base Price</div>
                    <div className="text-green-600 dark:text-green-400 font-bold">₹{formatPrice(ledger.basePrice)}</div>
                  </div>
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3">
                    <div className="text-gray-500 dark:text-gray-400">Status</div>
                    <div className={`font-bold ${
                      ledger.state === 'LIVE' ? 'text-green-600 dark:text-green-400' :
                      ledger.state === 'PAUSED' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {ledger.state}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl p-6 text-center shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Waiting for Next Player</h2>
                <p className="text-gray-500 dark:text-gray-400">The auctioneer is selecting the next player</p>
              </div>
            )}

            {/* Teams Overview */}
            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl p-4 mt-4 shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">PARTICIPATING TEAMS</h3>
              <div className="space-y-2">
                {teams.map(team => {
                  const isLeading = ledger?.highestBidder?.teamId === team.id;
                  return (
                    <div
                      key={team.id}
                      className={`p-3 rounded-lg ${
                        isLeading ? 'bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-400 dark:border-yellow-500/50' : 'bg-gray-100 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 dark:text-white font-medium">
                          {team.name}
                          {isLeading && <span className="ml-2">👑</span>}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">₹{formatPrice(team.purseRemaining)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel - Main Bidding Display */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-purple-100/80 to-pink-100/80 dark:from-purple-500/20 dark:to-pink-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-200 dark:border-purple-500/30 shadow-lg dark:shadow-none">
              {/* Timer */}
              <div className={`text-center mb-8 p-6 rounded-xl ${
                timeRemaining <= 5 && isTimerRunning 
                  ? 'bg-red-100 dark:bg-red-500/30 animate-pulse' 
                  : 'bg-white/50 dark:bg-white/5'
              }`}>
                <div className="text-7xl font-mono font-bold text-gray-800 dark:text-white mb-2">
                  {ledger?.state === 'PAUSED' ? (
                    <span className="text-yellow-600 dark:text-yellow-400">PAUSED</span>
                  ) : ledger?.state === 'READY' ? (
                    <span className="text-blue-600 dark:text-blue-400">READY</span>
                  ) : (
                    `${timeRemaining}s`
                  )}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {!ledger && 'Waiting for player selection'}
                  {ledger?.state === 'READY' && 'Bidding about to start'}
                  {ledger?.state === 'LIVE' && 'Time remaining'}
                  {ledger?.state === 'PAUSED' && 'Bidding paused'}
                </div>
              </div>

              {/* Current Bid */}
              {ledger && (
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">CURRENT BID</div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-4">
                    ₹{formatPrice(ledger.currentBid)}
                  </div>

                  {ledger.highestBidder ? (
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-200/80 to-orange-200/80 dark:from-yellow-500/30 dark:to-orange-500/30 border border-yellow-400 dark:border-yellow-500/50 rounded-full">
                      <span className="text-yellow-700 dark:text-yellow-400 font-bold text-lg">
                        👑 {ledger.highestBidder.teamName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">No bids yet</div>
                  )}

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {ledger.bidHistory.length} bid{ledger.bidHistory.length !== 1 ? 's' : ''} placed
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Bid History */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Bid History</h3>
              
              {ledger && ledger.bidHistory.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[...ledger.bidHistory].reverse().map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-3 rounded-lg ${
                        index === 0 
                          ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-500/20 dark:to-orange-500/20 border border-yellow-300 dark:border-yellow-500/30' 
                          : bid.isJumpBid 
                            ? 'bg-purple-100 dark:bg-purple-500/20 border border-purple-300 dark:border-purple-500/30'
                            : 'bg-gray-100 dark:bg-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-gray-800 dark:text-white font-medium">{bid.teamName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(bid.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 dark:text-green-400 font-bold">₹{formatPrice(bid.bidAmount)}</div>
                          {bid.isJumpBid && (
                            <span className="text-xs text-purple-600 dark:text-purple-300">Jump</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📝</div>
                  <div>No bids yet</div>
                </div>
              )}
            </div>

            {/* Auction Progress */}
            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-xl p-4 mt-4 shadow-lg dark:shadow-none border border-gray-200 dark:border-transparent">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">AUCTION PROGRESS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{session?.completedPlayerIds.length || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                </div>
                <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{session?.playerPool.length || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Banner */}
        <div className="mt-6 bg-gray-100 dark:bg-white/5 rounded-lg p-3 text-center text-gray-600 dark:text-gray-400 text-sm">
          {user ? (
            <>Viewing as {user.role}: {user.name || user.username}</>
          ) : (
            <>Viewing as guest</>
          )}
          <span className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Read Only</span>
        </div>
      </div>
    </div>
  );
};

export default LiveAuctionViewer;
