
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated or not admin (only after loading completes)
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-gray-900 dark:text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const navItems = [
    { 
      name: 'Teams & Players', 
      path: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Auctions', 
      path: '/dashboard/auctions', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    { 
      name: 'Auction History', 
      path: '/dashboard/auction-history', 
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
  ];

  const getSportIcon = (sport: string) => {
    const sportEmojis: { [key: string]: string } = {
      football: '⚽',
      cricket: '🏏', 
      basketball: '🏀',
      baseball: '⚾',
      volleyball: '🏐'
    };
    return sportEmojis[sport] || '⚽';
  };

  const currentSport = user?.sport || 'football';

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed left-0 top-0 h-screen z-30 transition-all duration-300 shadow-lg`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 mb-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</span>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
          {!sidebarCollapsed && <p className="text-xs text-gray-500 dark:text-gray-400">Sports Auction Management</p>}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => 
                `flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
              title={sidebarCollapsed ? item.name : ''}
            >
              <span className="mr-3">{item.icon}</span>
              {!sidebarCollapsed && item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <button 
            onClick={() => navigate('/teams')}
            className={`w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600 font-medium flex items-center gap-2 ${
              sidebarCollapsed ? 'justify-center' : 'justify-center'
            }`}
            title={sidebarCollapsed ? 'Switch Sport' : ''}
          >
            <span className="text-lg">{getSportIcon(currentSport)}</span>
            {!sidebarCollapsed && <span>Switch Sport</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Sport:</p>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400 capitalize">{currentSport}</p>
            </div>
          )}
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className={`w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium flex items-center gap-2 ${
              sidebarCollapsed ? 'justify-center' : 'justify-center'
            }`}
            title={sidebarCollapsed ? 'Sign Out' : ''}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className={`flex-1 bg-gray-50 dark:bg-gray-900 relative transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className={`h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 fixed top-0 z-20 shadow-sm transition-all duration-300 ${
          sidebarCollapsed ? 'left-16 right-0' : 'left-64 right-0'
        }`}>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Auction Management System
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-400">Sports bidding and team management</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center font-medium text-white text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
              </div>
            </div>
          </div>
        </header>
        
        <div className="pt-16 p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
