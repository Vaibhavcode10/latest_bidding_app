
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedSport, setSelectedSport] = useState('football');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sports = ['football', 'basketball', 'cricket', 'baseball', 'volleyball'];

  const roles: { id: UserRole; label: string; description: string; icon: string; canRegister: boolean }[] = [
    { id: 'admin', label: 'Admin', description: 'Manage auctions and teams', icon: '⚙️', canRegister: false },
    { id: 'player', label: 'Player', description: 'Manage your profile & view auctions', icon: '👤', canRegister: true },
    { id: 'auctioneer', label: 'Auctioneer', description: 'Conduct auctions & manage franchise', icon: '🎙️', canRegister: true },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // Registration
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        await register(username, email, password, selectedRole, selectedSport, name);
        
        // Navigate based on role
        if (selectedRole === 'player') {
          navigate('/player/dashboard');
        } else if (selectedRole === 'auctioneer') {
          navigate('/auctioneer/dashboard');
        }
      } else {
        // Login
        const sport = (selectedRole === 'auctioneer' || selectedRole === 'player') ? selectedSport : undefined;
        await login(username, password, selectedRole, sport);
        
        if (selectedRole === 'admin') {
          navigate('/teams');
        } else if (selectedRole === 'player') {
          navigate('/player/dashboard');
        } else if (selectedRole === 'auctioneer') {
          navigate('/auctioneer/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
  };

  const toggleMode = () => {
    resetForm();
    setIsRegisterMode(!isRegisterMode);
    // If switching to register and admin is selected, switch to player
    if (!isRegisterMode && selectedRole === 'admin') {
      setSelectedRole('player');
    }
  };

  const canShowRegister = selectedRole !== 'admin';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-10">
        <div className="flex justify-center mb-8">
          <div className={`p-4 rounded-2xl border ${isRegisterMode ? 'bg-green-600/10 border-green-600/20' : 'bg-blue-600/10 border-blue-600/20'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isRegisterMode ? 'text-green-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isRegisterMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-black text-center mb-2 tracking-tight">
          {isRegisterMode ? 'Create Account' : 'Sports Auction'}
        </h2>
        <p className="text-slate-500 text-center mb-8 text-sm">
          {isRegisterMode ? 'Register as a new player or auctioneer' : 'Select your role and login'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {roles.map((role) => {
            // In register mode, disable admin
            const isDisabled = isRegisterMode && !role.canRegister;
            return (
              <button
                key={role.id}
                onClick={() => {
                  if (!isDisabled) {
                    setSelectedRole(role.id);
                    setError('');
                  }
                }}
                disabled={isDisabled}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isDisabled 
                    ? 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'
                    : selectedRole === role.id
                      ? isRegisterMode ? 'border-green-500 bg-green-600/10' : 'border-blue-500 bg-blue-600/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                <div className="text-3xl mb-2">{role.icon}</div>
                <p className="font-bold text-white">{role.label}</p>
                <p className="text-xs text-slate-400 mt-1">{role.description}</p>
                {isRegisterMode && !role.canRegister && (
                  <p className="text-xs text-red-400 mt-1">Login only</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Sport Selection for Player and Auctioneer */}
        {(selectedRole === 'auctioneer' || selectedRole === 'player') && (
          <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest ml-1 mb-3">Select Sport</label>
            <div className="grid grid-cols-5 gap-2">
              {sports.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                    selectedSport === sport
                      ? isRegisterMode ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-white placeholder:text-slate-600"
                placeholder="Enter your full name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
            <input 
              type="text" 
              className={`w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 ${isRegisterMode ? 'focus:ring-green-500' : 'focus:ring-blue-500'} transition-all text-white placeholder:text-slate-600`}
              placeholder={isRegisterMode ? 'Choose a username...' : 'Enter username or email...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {isRegisterMode && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email" 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-white placeholder:text-slate-600"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              className={`w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 ${isRegisterMode ? 'focus:ring-green-500' : 'focus:ring-blue-500'} transition-all text-white placeholder:text-slate-600`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegisterMode && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <input 
                type="password" 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-white placeholder:text-slate-600"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full ${isRegisterMode ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30 hover:shadow-green-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30 hover:shadow-blue-600/20'} disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98]`}
          >
            {isLoading ? (isRegisterMode ? 'Creating Account...' : 'Logging in...') : (isRegisterMode ? 'Create Account' : 'Login')}
          </button>
        </form>

        {/* Demo Credentials */}
        {!isRegisterMode && (
          <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <p className="text-blue-300 text-xs">
              <span className="font-bold">Demo Credentials:</span> {selectedRole === 'admin' ? "username: 'admin', password: 'admin123'" : selectedRole === 'player' ? `Try 'virat_kohli' (cricket), 'lionel_messi' (football) with password 'password123'` : `Try 'james_mitchell' (football), 'rajesh_kumar' (cricket) with password 'password123'`}
            </p>
          </div>
        )}

        {/* Toggle Login/Register */}
        {canShowRegister && (
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={toggleMode}
                className={`ml-2 font-bold ${isRegisterMode ? 'text-blue-400 hover:text-blue-300' : 'text-green-400 hover:text-green-300'} transition-colors`}
              >
                {isRegisterMode ? 'Login' : 'Register'}
              </button>
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
