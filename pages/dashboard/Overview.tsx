
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

interface Team {
  id: string;
  name: string;
  sport: string;
  owner: string;
  purseRemaining: number;
  totalPurse: number;
  playerIds: string[];
  playerCount: number;
  wins: number;
  losses: number;
}

const Overview: React.FC = () => {
  const [sport, setSport] = useState<string>('football');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const sports = ['football', 'cricket', 'volleyball', 'baseball', 'basketball'];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [sport]);

  const fetchData = async () => {
    setLoading(true);
    const playersData = await api.get<Player>('players', sport);
    const teamsData = await api.get<Team>('teams', sport);
    setPlayers(playersData);
    setTeams(teamsData);
    setLoading(false);
  };

  const totalBudget = teams.reduce((sum, team) => sum + team.purseRemaining, 0);
  const soldPlayers = players.filter(p => p.status === 'SOLD').length;
  const availablePlayers = players.filter(p => p.status === 'AVAILABLE').length;

  const getSportIcon = (s: string) => {
    const icons: { [key: string]: string } = {
      football: '⚽',
      cricket: '🏏',
      volleyball: '🏐',
      baseball: '⚾',
      basketball: '🏀',
    };
    return icons[s] || '⚽';
  };

  return (
    <div className="space-y-8">
      {/* Sport Selector */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Select Sport</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`p-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
                sport === s
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <div className="text-xl mb-1">{getSportIcon(s)}</div>
              <div className="text-xs">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
          {sport.charAt(0).toUpperCase() + sport.slice(1)} Auction Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Players Card */}
          <div className="p-6 bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl border border-blue-700/50 hover:border-blue-500 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Players</p>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-4xl font-bold text-blue-400">{players.length}</p>
            <p className="text-xs text-slate-500 mt-2">All registered players</p>
          </div>

          {/* Registered Teams Card */}
          <div className="p-6 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-xl border border-emerald-700/50 hover:border-emerald-500 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Registered Teams</p>
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-4xl font-bold text-emerald-400">{teams.length}</p>
            <p className="text-xs text-slate-500 mt-2">Participating teams</p>
          </div>

          {/* Available Players Card */}
          <div className="p-6 bg-gradient-to-br from-amber-900/40 to-amber-800/20 rounded-xl border border-amber-700/50 hover:border-amber-500 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Available</p>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-4xl font-bold text-amber-400">{availablePlayers}</p>
            <p className="text-xs text-slate-500 mt-2">Players to bid</p>
          </div>

          {/* Sold Players Card */}
          <div className="p-6 bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl border border-purple-700/50 hover:border-purple-500 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Sold</p>
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-4xl font-bold text-purple-400">{soldPlayers}</p>
            <p className="text-xs text-slate-500 mt-2">Auctioned players</p>
          </div>

          {/* Total Budget Card */}
          <div className="p-6 bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-xl border border-red-700/50 hover:border-red-500 transition-all lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Budget</p>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-4xl font-bold text-red-400">${(totalBudget / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-500 mt-2">Remaining purse across all teams</p>
          </div>
        </div>
      </div>

      {/* Live Auction Status */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-all">
        <h3 className="text-xl font-bold mb-2 text-white">Live Auction Status</h3>
        <p className="text-slate-400 mb-6 text-sm italic">
          {sport.charAt(0).toUpperCase() + sport.slice(1)} Auction: {players.length} Players • {teams.length} Teams
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105">
            Initialize Auction
          </button>
          <button className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-bold transition-all">
            Pause Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
