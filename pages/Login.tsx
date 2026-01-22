
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedSport, setSelectedSport] = useState('football');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sports = ['football', 'basketball', 'cricket', 'baseball', 'volleyball'];

  const roles: { id: UserRole; label: string; description: string; icon: string }[] = [
    { id: 'admin', label: 'Admin', description: 'Manage auctions and teams', icon: '⚙️' },
    { id: 'player', label: 'Player', description: 'Manage your profile & view auctions', icon: '👤' },
    { id: 'auctioneer', label: 'Auctioneer', description: 'Conduct auctions & manage franchise', icon: '🎙️' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, selectedRole, selectedRole === 'auctioneer' ? selectedSport : undefined);
      
      if (selectedRole === 'admin') {
        navigate('/teams');
      } else if (selectedRole === 'player') {
        navigate('/player/select-sport');
      } else if (selectedRole === 'auctioneer') {
        navigate('/auctioneer/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-10">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center mb-2 tracking-tight">Sports Auction</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Select your role and login</p>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRole(role.id);
                setError('');
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedRole === role.id
                  ? 'border-blue-500 bg-blue-600/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <div className="text-3xl mb-2">{role.icon}</div>
              <p className="font-bold text-white">{role.label}</p>
              <p className="text-xs text-slate-400 mt-1">{role.description}</p>
            </button>
          ))}
        </div>

        {/* Sport Selection for Auctioneer */}
        {selectedRole === 'auctioneer' && (
          <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest ml-1 mb-3">Select Sport</label>
            <div className="grid grid-cols-5 gap-2">
              {sports.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                    selectedSport === sport
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600"
              placeholder={selectedRole === 'auctioneer' ? 'e.g., james_mitchell' : 'Enter username...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-600/20 active:scale-[0.98]"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {selectedRole === 'auctioneer' && (
          <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <p className="text-blue-300 text-xs">
              <span className="font-bold">Demo Credentials:</span> Try logging in with username 'james_mitchell' and password 'password123'
            </p>
          </div>
        )}
        
        <button 
          onClick={() => navigate('/')}
          className="w-full mt-6 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Cancel and return home
        </button>
      </div>
    </div>
  );
};

export default Login;
