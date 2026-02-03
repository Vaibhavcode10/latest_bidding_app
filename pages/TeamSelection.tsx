import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

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

const TeamSelection: React.FC = () => {
  const { user, setSport } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [sport, setSportLocal] = useState<string>(user?.sport || 'football');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    totalPurse: 10000000,
  });
  const navigate = useNavigate();

  const sports = ['football', 'cricket', 'volleyball', 'baseball', 'basketball'];

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 3000);
    return () => clearInterval(interval);
  }, [sport]);

  const handleSportChange = (newSport: string) => {
    console.log('Changing sport from', sport, 'to', newSport);
    setSportLocal(newSport);
    setSport(newSport); // Save to user context
    console.log('Sport changed to', newSport);
    
    // Redirect to appropriate dashboard based on user role
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else if (user?.role === 'player') {
      navigate('/player/dashboard');
    } else if (user?.role === 'auctioneer') {
      navigate('/auctioneer/dashboard');
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 3000);
    return () => clearInterval(interval);
  }, [sport]);

  const fetchTeams = async () => {
    const data = await api.getEntity<Team>('teams', sport);
    setTeams(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.updateEntity('teams', editingId, { ...formData, purseRemaining: formData.totalPurse }, sport);
    } else {
      await api.createEntity('teams', { ...formData, purseRemaining: formData.totalPurse }, sport);
    }
    setFormData({ name: '', owner: '', totalPurse: 10000000 });
    setEditingId(null);
    setShowForm(false);
    fetchTeams();
  };

  const handleEdit = (team: Team) => {
    setFormData({ name: team.name, owner: team.owner, totalPurse: team.totalPurse });
    setEditingId(team.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this team?')) {
      await api.deleteEntity('teams', id, sport);
      fetchTeams();
    }
  };

  const getSportColor = (s: string) => {
    const colors: { [key: string]: string } = {
      football: 'from-blue-600 to-cyan-600',
      cricket: 'from-orange-600 to-red-600',
      volleyball: 'from-yellow-600 to-amber-600',
      baseball: 'from-red-600 to-pink-600',
      basketball: 'from-purple-600 to-indigo-600',
    };
    return colors[s] || 'from-blue-600 to-cyan-600';
  };

  const getSportIcon = (s: string) => {
    const sportEmojis: { [key: string]: string } = {
      football: '⚽',
      cricket: '🏏',
      volleyball: '🏐',
      baseball: '⚾',
      basketball: '🏀',
    };
    return sportEmojis[s] || '⚽';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-gray-200 dark:border-gray-700 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Management System
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-400">Select sport and manage team roster</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - with top padding for fixed header */}
      <main className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 min-h-screen overflow-y-auto">
          {/* Sport Selector */}
          <div className="mb-12">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-6">Select Sport</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sports.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSportChange(s)}
                  className={`p-4 rounded-lg font-semibold transition-all duration-200 ${
                    sport === s
                      ? 'bg-white dark:bg-gray-800 shadow-lg ring-2 ring-primary-500 dark:ring-primary-400'
                      : 'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getSportColor(s)} flex items-center justify-center mb-3 mx-auto`}>
                    <span className="text-white text-xl">
                      {getSportIcon(s)}
                    </span>
                  </div>
                  <div className={`text-sm text-center ${
                    sport === s
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Teams Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {sport.charAt(0).toUpperCase() + sport.slice(1)} Teams
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Manage participating teams for auction</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  showForm
                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg'
                }`}
              >
                {showForm ? 'Cancel' : 'Add New Team'}
              </button>
            </div>

            {/* Add Team Form */}
            {showForm && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">{editingId ? 'Edit Team' : 'Create New Team'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Team Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Owner Name"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Total Purse"
                      value={formData.totalPurse}
                      onChange={(e) => setFormData({ ...formData, totalPurse: Number(e.target.value) })}
                      className="px-4 py-3 bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                  >
                    {editingId ? '✓ Update Team' : '✓ Create Team'}
                  </button>
                </form>
              </div>
            )}

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="group bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-cyan-900/30 hover:border-blue-400 dark:hover:border-cyan-500/50 rounded-2xl p-6 hover:shadow-xl dark:hover:shadow-cyan-500/10 transition-all transform hover:scale-[1.02] shadow-sm"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors mb-1">
                        {team.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Owner: <span className="text-gray-700 dark:text-gray-300 font-semibold">{team.owner}</span></p>
                    </div>
                    <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity">{getSportIcon(sport)}</div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Total Purse</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">${(team.totalPurse / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Remaining</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">${(team.purseRemaining / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all"
                        style={{
                          width: `${(team.purseRemaining / team.totalPurse) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Squad</span>
                      <span className="font-bold text-blue-600 dark:text-cyan-400">{team.playerCount} Players</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Record</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{team.wins}W • {team.losses}L</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="flex-1 px-4 py-2 bg-blue-100 dark:bg-cyan-500/20 hover:bg-blue-200 dark:hover:bg-cyan-500/30 text-blue-600 dark:text-cyan-400 rounded-lg text-xs font-bold transition-all"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {teams.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🏟️</div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No teams found for {sport}</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Create one to get started with the auction!</p>
              </div>
            )}
          </div>

          <style>{`
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
          `}</style>
        </div>
      </main>
    </div>
  );
};

export default TeamSelection;
