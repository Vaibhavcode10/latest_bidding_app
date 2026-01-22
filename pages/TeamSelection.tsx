import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [sport, setSport] = useState<string>('football');
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

  const fetchTeams = async () => {
    const data = await api.get<Team>('teams', sport);
    setTeams(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.update('teams', editingId, { ...formData, purseRemaining: formData.totalPurse }, sport);
    } else {
      await api.create('teams', { ...formData, purseRemaining: formData.totalPurse }, sport);
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
      await api.delete('teams', id, sport);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Sports Auction
                </h1>
                <p className="text-xs text-slate-400">Select your sport and manage teams</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-300 transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Sport Selector */}
          <div className="mb-12">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Choose Your Sport</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sports.map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`p-4 rounded-2xl font-bold transition-all transform hover:scale-105 ${
                    sport === s
                      ? `bg-gradient-to-br ${getSportColor(s)} shadow-lg scale-105 text-white`
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{getSportIcon(s)}</div>
                  <div className="text-sm">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Teams Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black mb-2">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </span>
                  <span className="text-slate-400"> Teams</span>
                </h2>
                <p className="text-slate-400 text-sm">Manage participating teams for auction</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
                  showForm
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/50'
                }`}
              >
                {showForm ? '✕ Cancel' : '+ Add New Team'}
              </button>
            </div>

            {/* Add Team Form */}
            {showForm && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 mb-8 backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-6 text-white">{editingId ? 'Edit Team' : 'Create New Team'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Team Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Owner Name"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Total Purse"
                      value={formData.totalPurse}
                      onChange={(e) => setFormData({ ...formData, totalPurse: Number(e.target.value) })}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                  className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all transform hover:scale-105 backdrop-blur-xl"
                >
                  {/* Team Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors mb-1">
                        {team.name}
                      </h3>
                      <p className="text-xs text-slate-400">Owner: <span className="text-slate-300 font-semibold">{team.owner}</span></p>
                    </div>
                    <div className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity">{getSportIcon(sport)}</div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Total Purse</span>
                      <span className="font-bold text-emerald-400">${(team.totalPurse / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Remaining</span>
                      <span className="font-bold text-amber-400">${(team.purseRemaining / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all"
                        style={{
                          width: `${(team.purseRemaining / team.totalPurse) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Squad</span>
                      <span className="font-bold text-blue-400">{team.playerCount} Players</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Record</span>
                      <span className="font-bold text-purple-400">{team.wins}W • {team.losses}L</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(team)}
                      className="flex-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-bold transition-all"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-bold transition-all"
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
                <p className="text-slate-400 text-lg font-semibold">No teams found for {sport}</p>
                <p className="text-slate-500 text-sm mt-2">Create one to get started with the auction!</p>
              </div>
            )}
          </div>
        </div>
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
  );
};

export default TeamSelection;
