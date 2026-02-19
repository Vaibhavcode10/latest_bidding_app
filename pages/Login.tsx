
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { api } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

interface AuctioneerAvailability {
  sport: string;
  maxAllowed: number;
  currentCount: number;
  availableSlots: number;
  isFull: boolean;
}

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
  const [basePrice, setBasePrice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auctioneerAvailability, setAuctioneerAvailability] = useState<AuctioneerAvailability | null>(null);

  const sports = ['football', 'basketball', 'cricket', 'baseball', 'volleyball'];

  const roles: { id: UserRole; label: string; description: string; iconPath: string; canRegister: boolean }[] = [
    { 
      id: 'admin', 
      label: 'Admin', 
      description: 'Create auctions, assign auctioneers & manage teams', 
      iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', 
      canRegister: false 
    },
    { 
      id: 'player', 
      label: 'Player', 
      description: 'Manage your profile & participate in auctions', 
      iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', 
      canRegister: true 
    },
    { 
      id: 'auctioneer', 
      label: 'Auctioneer', 
      description: 'Conduct live auctions (neutral role)', 
      iconPath: 'M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 010 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 010-2h4zM9 3v1h2V3H9zm0 5a1 1 0 112 0v6a1 1 0 11-2 0V8z M7 8a1 1 0 012 0v6a1 1 0 11-2 0V8z M13 8a1 1 0 012 0v6a1 1 0 11-2 0V8z', 
      canRegister: true 
    },
  ];

  // Check auctioneer availability when in register mode and auctioneer role selected
  useEffect(() => {
    const checkAuctioneerAvailability = async () => {
      if (isRegisterMode && selectedRole === 'auctioneer') {
        try {
          const response = await api.get(`/auth/auctioneer-availability/${selectedSport}`);
          if (response.success) {
            setAuctioneerAvailability(response);
          }
        } catch (err) {
          console.error('Failed to check auctioneer availability:', err);
        }
      } else {
        setAuctioneerAvailability(null);
      }
    };
    checkAuctioneerAvailability();
  }, [isRegisterMode, selectedRole, selectedSport]);

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
        
        // For players, validate base price
        if (selectedRole === 'player') {
          if (!basePrice) {
            throw new Error('Base price is required for player registration');
          }
          const basePriceNum = Number(basePrice);
          if (isNaN(basePriceNum) || basePriceNum <= 0) {
            throw new Error('Base price must be a positive number');
          }
        }
        
        await register(username, email, password, selectedRole, selectedSport, name, selectedRole === 'player' ? Number(basePrice) : undefined);
        
        // Always redirect to teams page for sport selection after registration
        navigate('/teams');
      } else {
        // Login
        let sport = (selectedRole === 'auctioneer' || selectedRole === 'player') ? selectedSport : undefined;
        
        // For admin, set a default sport (can be changed later via sport selection)
        if (selectedRole === 'admin') {
          sport = selectedSport;
        }
        
        await login(username, password, selectedRole, sport);
        
        // Always redirect to teams page for sport selection
        navigate('/teams');
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
    setBasePrice('');
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900 transition-all duration-500 flex items-center justify-center p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20 glass-card p-2">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-2xl glass-card p-12 animate-scale-in">
        <div className="flex justify-center mb-8">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 ${
            isRegisterMode 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
              : 'bg-gradient-to-br from-primary-500 to-purple-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isRegisterMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
          </div>
        </div>

        <h2 className="text-4xl font-bold text-center mb-3 text-gray-900 dark:text-white">
          {isRegisterMode ? 'Join the Platform' : 'System Access'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-10">
          {isRegisterMode ? 'Create your account and start participating' : 'Select your role and authenticate securely'}
        </p>

        {error && (
          <div className="mb-8 glass-card p-4 border border-red-400/50 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {roles.map((role, index) => {
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
                className={`p-4 rounded-lg border-2 transition-all ${
                  isDisabled 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
                    : selectedRole === role.id
                      ? isRegisterMode 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="mb-3 flex justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-8 w-8 ${
                      isDisabled 
                        ? 'text-gray-400 dark:text-gray-500'
                        : selectedRole === role.id
                          ? isRegisterMode ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                    }`} 
                    fill="none" 
                    viewBox="0 0 20 20" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={role.iconPath} />
                  </svg>
                </div>
                <p className={`font-semibold ${
                  isDisabled 
                    ? 'text-gray-500 dark:text-gray-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>{role.label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{role.description}</p>
                {isRegisterMode && !role.canRegister && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Authentication Only</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Sport Selection for Player and Auctioneer */}
        {(selectedRole === 'auctioneer' || selectedRole === 'player') && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Select Sport</label>
            <div className="grid grid-cols-5 gap-2">
              {sports.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                    selectedSport === sport
                      ? isRegisterMode 
                        ? 'bg-green-600 text-white' 
                        : 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Auctioneer Slot Availability Display */}
            {isRegisterMode && selectedRole === 'auctioneer' && auctioneerAvailability && (
              <div className={`mt-4 p-3 rounded-lg border ${
                auctioneerAvailability.isFull 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${
                      auctioneerAvailability.isFull 
                        ? 'text-red-700 dark:text-red-300' 
                        : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {auctioneerAvailability.isFull 
                        ? 'No Positions Available' 
                        : `${auctioneerAvailability.availableSlots} of ${auctioneerAvailability.maxAllowed} Positions Available`}
                    </p>
                    <p className={`text-xs ${
                      auctioneerAvailability.isFull 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {auctioneerAvailability.isFull 
                        ? `Maximum ${auctioneerAvailability.maxAllowed} auctioneers already registered for ${selectedSport}`
                        : `Maximum ${auctioneerAvailability.maxAllowed} auctioneers allowed per sport`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(auctioneerAvailability.maxAllowed)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full ${
                          i < auctioneerAvailability.currentCount 
                            ? 'bg-gray-400 dark:bg-gray-500' 
                            : 'bg-green-500'
                        }`}
                        title={i < auctioneerAvailability.currentCount ? 'Filled' : 'Available'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Full Name (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="Enter your full name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Username</label>
            <input 
              type="text" 
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              placeholder={isRegisterMode ? 'Choose a username...' : 'Enter username or email...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {isRegisterMode && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Email</label>
              <input 
                type="email" 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {isRegisterMode && selectedRole === 'player' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Base Price</label>
              <input 
                type="number" 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="Enter base price (e.g. 2000000, 20000, etc)"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                step="1"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the starting bid amount as a number (no units like CR or Lakh)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegisterMode && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Confirm Password</label>
              <input 
                type="password" 
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || (isRegisterMode && selectedRole === 'auctioneer' && auctioneerAvailability?.isFull)}
            className={`w-full font-semibold py-4 rounded-lg text-white transition-all focus:outline-none focus:ring-4 shadow-lg ${
              isLoading || (isRegisterMode && selectedRole === 'auctioneer' && auctioneerAvailability?.isFull)
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : isRegisterMode
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500/50 hover:shadow-xl'
                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500/50 hover:shadow-xl'
            }`}
          >
            {isLoading 
              ? (isRegisterMode ? 'Creating Account...' : 'Authenticating...') 
              : (isRegisterMode && selectedRole === 'auctioneer' && auctioneerAvailability?.isFull)
                ? 'Registration Closed'
                : (isRegisterMode ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Login/Register */}
        {canShowRegister && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={toggleMode}
                className={`ml-2 font-semibold ${
                  isRegisterMode 
                    ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300' 
                    : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                } transition-colors`}
              >
                {isRegisterMode ? 'Sign In' : 'Register'}
              </button>
            </p>
          </div>
        )}
        
        <button 
          onClick={() => navigate('/')}
          className="w-full mt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default Login;
