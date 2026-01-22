import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuctioneerDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'My Franchise', path: '/auctioneer/dashboard', icon: '🏢', end: true },
    { name: 'Team Details', path: '/auctioneer/dashboard/team', icon: '👥' },
    { name: 'Players', path: '/auctioneer/dashboard/players', icon: '⚾' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-slate-100">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-950/95 to-slate-900/95 backdrop-blur-xl border-r border-blue-600/20 flex flex-col relative z-20">
        <div className="p-6 border-b border-blue-600/20 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎙️</span>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AUCTIONEER</span>
          </div>
          <p className="text-xs text-slate-400">Franchise Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => 
                `block px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`
              }
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-600/20 space-y-3">
          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-bold text-white mt-1">{user?.username}</p>
            <p className="text-xs text-slate-500 mt-1">Auctioneer</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors font-semibold"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-auto bg-transparent relative z-10">
        <header className="h-20 bg-gradient-to-r from-slate-900/80 to-blue-900/50 backdrop-blur-xl border-b border-blue-600/20 flex items-center justify-between px-8 sticky top-0 z-10 shadow-lg">
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Auctioneer Dashboard
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage your team and franchise</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.username}</p>
              <p className="text-xs text-slate-400">Auctioneer</p>
            </div>
          </div>
        </header>
        
        <div className="p-8">
          <Outlet />
        </div>
      </main>

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

export default AuctioneerDashboardLayout;
