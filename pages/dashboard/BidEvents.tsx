import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

interface AuctionPlayer {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  currentBid: number;
  status: 'UPCOMING' | 'LIVE' | 'SOLD' | 'UNSOLD';
}

interface Team {
  id: string;
  name: string;
  logo: string;
}

interface Auction {
  id: string;
  name: string;
  date: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
  teams: Team[];
  players: AuctionPlayer[];
  bidIncrement: number;
}

const BidEvents: React.FC = () => {
  const { user } = useAuth();
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);

  // Mock data for auctions
  const auctions: Auction[] = [
    {
      id: '1',
      name: `${user?.sport?.toUpperCase() || 'FOOTBALL'} Auction 2024`,
      date: '2024-02-15',
      status: 'LIVE',
      teams: [
        { id: '1', name: 'Thunder Tigers', logo: '🐯' },
        { id: '2', name: 'Fire Hawks', logo: '🦅' },
        { id: '3', name: 'Storm Warriors', logo: '⚡' },
      ],
      players: [
        { id: '1', name: 'Virat Sharma', role: 'Batsman', basePrice: 500000, currentBid: 1200000, status: 'LIVE' },
        { id: '2', name: 'Rohit Kumar', role: 'Bowler', basePrice: 400000, currentBid: 950000, status: 'UPCOMING' },
        { id: '3', name: 'Ajit Patel', role: 'All-rounder', basePrice: 450000, currentBid: 1100000, status: 'SOLD' },
      ],
      bidIncrement: 50000,
    },
    {
      id: '2',
      name: `${user?.sport?.toUpperCase() || 'FOOTBALL'} Super League`,
      date: '2024-03-10',
      status: 'SCHEDULED',
      teams: [
        { id: '4', name: 'Victory Kings', logo: '👑' },
        { id: '5', name: 'Elite Squad', logo: '⭐' },
      ],
      players: [
        { id: '4', name: 'Ravi Singh', role: 'Keeper', basePrice: 350000, currentBid: 0, status: 'UPCOMING' },
      ],
      bidIncrement: 75000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600/30';
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-600/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-600/30';
      case 'SCHEDULED':
        return 'bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600/30';
      default:
        return 'bg-gray-100 dark:bg-slate-600/20 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600/30';
    }
  };

  const getPlayerStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE':
        return '🔴';
      case 'SOLD':
        return '✓';
      case 'UNSOLD':
        return '✗';
      case 'UPCOMING':
        return '⏳';
      default:
        return '•';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-blue-600/10 dark:to-purple-600/10 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl shadow-sm dark:shadow-none">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Bid Events</h1>
        <p className="text-gray-600 dark:text-slate-400">Watch live auctions for {user?.sport?.toUpperCase()} and follow the bidding action</p>
      </div>

      {/* Auctions Grid */}
      <div className="space-y-6">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm"
          >
            {/* Auction Header */}
            <div className="p-8 border-b border-gray-200 dark:border-blue-600/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{auction.name}</h2>
                  <p className="text-gray-600 dark:text-slate-400">Scheduled for {new Date(auction.date).toLocaleDateString()}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border font-semibold ${getStatusColor(auction.status)}`}>
                  {auction.status === 'LIVE' && '🔴 LIVE NOW'}
                  {auction.status === 'SCHEDULED' && '⏳ Coming Soon'}
                  {auction.status === 'COMPLETED' && '✓ Completed'}
                </div>
              </div>

              {/* Teams */}
              <div className="flex flex-wrap gap-3">
                {auction.teams.map((team) => (
                  <div
                    key={team.id}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg flex items-center gap-2"
                  >
                    <span className="text-2xl">{team.logo}</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{team.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Players Section */}
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Players in Auction</h3>

              {selectedAuction === auction.id ? (
                <div className="space-y-4">
                  {auction.players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:border-primary-500 dark:hover:border-blue-600/30 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{player.name}</h4>
                            <span className="text-2xl">{getPlayerStatusIcon(player.status)}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              player.status === 'LIVE' ? 'bg-red-100 dark:bg-red-600/30 text-red-600 dark:text-red-300' :
                              player.status === 'SOLD' ? 'bg-green-100 dark:bg-green-600/30 text-green-600 dark:text-green-300' :
                              player.status === 'UNSOLD' ? 'bg-gray-100 dark:bg-gray-600/30 text-gray-600 dark:text-gray-300' :
                              'bg-blue-100 dark:bg-blue-600/30 text-blue-600 dark:text-blue-300'
                            }`}>
                              {player.status}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">{player.role}</p>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Base Price</p>
                              <p className="text-gray-800 dark:text-white font-bold">₹{formatPrice(player.basePrice)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Current Bid</p>
                              <p className={`text-lg font-bold ${player.currentBid > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-500'}`}>
                                {player.currentBid > 0 ? `₹${player.currentBid.toLocaleString()}` : 'No bids yet'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-slate-500 mb-1">Increase</p>
                              <p className="text-gray-800 dark:text-white font-bold">+₹{auction.bidIncrement.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Spectator Note */}
                      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-600/10 border border-blue-300 dark:border-blue-600/20 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-300">👁️ You are viewing as a spectator. Bidding is restricted.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setSelectedAuction(auction.id)}
                  className="w-full bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-600/40 hover:bg-blue-200 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-300 font-semibold py-4 rounded-xl transition-all"
                >
                  + View {auction.players.length} Players
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 dark:bg-gradient-to-r dark:from-amber-600/10 dark:to-orange-600/10 border border-amber-300 dark:border-amber-600/20 rounded-2xl p-6 backdrop-blur-xl">
        <p className="text-amber-700 dark:text-amber-300 text-sm">
          <span className="font-bold">ℹ️ Spectator Mode:</span> You can view all upcoming and live auctions for {user?.sport?.toUpperCase()}.
          Track players in real-time, but bidding is restricted. To participate in bidding, you must register as a team owner.
        </p>
      </div>
    </div>
  );
};

export default BidEvents;
