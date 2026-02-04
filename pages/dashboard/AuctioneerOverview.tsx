import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

interface AssignedAuction {
  id: string;
  name: string;
  sport: string;
  status: string;
  startDate: string;
  teamIds?: string[];
  playerPool?: string[];
  participatingTeams?: Array<{
    id: string;
    name: string;
    logoUrl?: string;
  }>;
  assignedAuctioneer?: {
    id: string;
    name: string;
    assignedAt: string;
  };
}

interface AuctionStats {
  totalAssigned: number;
  readyToStart: number;
  completed: number;
  live: number;
}

const AuctioneerOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedAuctions, setAssignedAuctions] = useState<AssignedAuction[]>([]);
  const [stats, setStats] = useState<AuctionStats>({ totalAssigned: 0, readyToStart: 0, completed: 0, live: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignedAuctions();
  }, [user?.id]);

  const fetchAssignedAuctions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Fetching auctions for user:', user.id);
      const response = await api.get(`/auctions/assigned/${user.id}`);
      console.log('Response:', response.data);
      
      if (response.data?.success) {
        const auctions = response.data.auctions || [];
        setAssignedAuctions(auctions);
        
        // Calculate stats
        setStats({
          totalAssigned: auctions.length,
          readyToStart: auctions.filter((a: AssignedAuction) => a.status === 'READY').length,
          completed: auctions.filter((a: AssignedAuction) => a.status === 'COMPLETED').length,
          live: auctions.filter((a: AssignedAuction) => a.status === 'LIVE').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch assigned auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = (auction: AssignedAuction) => {
    // Navigate to live auction page with auction context
    navigate('/auctioneer/live', { state: { selectedAuction: auction } });
  };

  const handlePostponeAuction = async (auction: AssignedAuction) => {
    if (!confirm(`Postpone "${auction.name}"? This will change the status to SCHEDULED.`)) return;
    
    setActionLoading(auction.id);
    try {
      await api.put(`/auctions/${auction.sport}/${auction.id}`, {
        status: 'SCHEDULED',
        userRole: 'auctioneer',
        userId: user?.id
      });
      alert('Auction postponed successfully');
      fetchAssignedAuctions();
    } catch (err) {
      console.error('Failed to postpone auction:', err);
      alert('Failed to postpone auction');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTerminateAuction = async (auction: AssignedAuction) => {
    if (!confirm(`TERMINATE "${auction.name}"? This action will end the auction completely.`)) return;
    
    setActionLoading(auction.id);
    try {
      await api.put(`/auctions/${auction.sport}/${auction.id}`, {
        status: 'COMPLETED',
        userRole: 'auctioneer',
        userId: user?.id
      });
      alert('Auction terminated');
      fetchAssignedAuctions();
    } catch (err) {
      console.error('Failed to terminate auction:', err);
      alert('Failed to terminate auction');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      'READY': 'bg-emerald-900/40 text-emerald-400 border-emerald-600/60 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/50',
      'LIVE': 'bg-red-900/40 text-red-400 border-red-600/60 animate-pulse dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50',
      'CREATED': 'bg-amber-900/40 text-amber-400 border-amber-600/60 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50',
      'SCHEDULED': 'bg-blue-900/40 text-blue-400 border-blue-600/60 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50',
      'COMPLETED': 'bg-slate-800/60 text-slate-400 border-slate-600/60 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/50',
    };
    return styles[status] || 'bg-slate-800/60 text-slate-400 border-slate-600/60';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-300 text-lg font-medium tracking-wide">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Welcome Header */}
      <div className="bg-gradient-to-br from-slate-100 via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-blue-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Welcome, {user?.username}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-slate-700 dark:bg-blue-600/30 text-white dark:text-blue-300 text-xs font-semibold rounded uppercase tracking-wider">
                Official Auctioneer
              </span>
              <span className="text-slate-500 dark:text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wide text-sm">{user?.sport}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-200/80 dark:bg-slate-800/60 border-l-4 border-slate-600 dark:border-blue-500 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold text-sm uppercase tracking-wide mb-1">Your Responsibilities</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                As an <span className="font-semibold text-slate-800 dark:text-white">official neutral auctioneer</span>, you are responsible for conducting live auctions with fairness and impartiality. 
                You do not represent any team — your role is to facilitate bidding, verify bid authenticity, and officially mark players as <span className="font-mono text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">SOLD</span> or <span className="font-mono text-red-700 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">UNSOLD</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Professional Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Assigned</span>
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalAssigned}</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">Total Auctions</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">Ready</span>
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.readyToStart}</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">Pending Start</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-600 dark:text-red-400 text-xs font-semibold uppercase tracking-wider">Live</span>
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.live}</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">In Progress</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.completed}</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">Finished</p>
        </div>
      </div>

      {/* Quick Actions - Professional Alert */}
      {stats.readyToStart > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Auctions Ready to Begin</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{stats.readyToStart} auction(s) awaiting your initiation</p>
              </div>
            </div>
            <Link
              to="/auctioneer/live"
              className="px-6 py-3 bg-slate-800 dark:bg-emerald-600 text-white font-semibold rounded-lg hover:bg-slate-900 dark:hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
            >
              <span>Launch Auction</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Assigned Auctions List */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Assigned Auctions</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and monitor your auction assignments</p>
        </div>
        
        {assignedAuctions.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">No Auctions Assigned</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-2 max-w-sm mx-auto">
              You will be notified when an administrator creates and assigns an auction to your account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {assignedAuctions.map(auction => (
              <div
                key={auction.id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{auction.name}</h3>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded border uppercase tracking-wider ${getStatusBadge(auction.status)}`}>
                        {auction.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wide mb-3">{auction.sport}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(auction.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {auction.teamIds?.length || 0} Teams
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {auction.playerPool?.length || 0} Players
                      </span>
                    </div>

                    {/* Teams Preview */}
                    {auction.participatingTeams && auction.participatingTeams.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {auction.participatingTeams.slice(0, 4).map(team => (
                          <div key={team.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                            {team.logoUrl && <img src={team.logoUrl} alt={team.name} className="w-5 h-5 rounded-full object-cover" />}
                            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{team.name}</span>
                          </div>
                        ))}
                        {auction.participatingTeams.length > 4 && (
                          <span className="text-slate-500 text-sm px-2 py-1.5 font-medium">+{auction.participatingTeams.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {auction.status === 'READY' && (
                      <button
                        onClick={() => handleStartAuction(auction)}
                        disabled={actionLoading === auction.id}
                        className="px-5 py-2.5 bg-slate-800 dark:bg-emerald-600 text-white font-semibold rounded-lg hover:bg-slate-900 dark:hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                        Start Auction
                      </button>
                    )}
                    
                    {auction.status === 'LIVE' && (
                      <Link
                        to="/auctioneer/live"
                        className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all shadow-md flex items-center gap-2 animate-pulse"
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        Continue Live
                      </Link>
                    )}

                    {(auction.status === 'READY' || auction.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handlePostponeAuction(auction)}
                        disabled={actionLoading === auction.id}
                        className="px-4 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-600/50 font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Postpone
                      </button>
                    )}

                    {auction.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleTerminateAuction(auction)}
                        disabled={actionLoading === auction.id}
                        className="px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-600/50 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Terminate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works - Professional Process Steps */}
      <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Auction Process</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Standard operating procedure for live auctions</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800/80 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">01</div>
                <h3 className="text-slate-800 dark:text-white font-semibold">Auction Creation</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Administrator configures the auction parameters including player pool, participating teams, and bidding rules, then assigns you as the officiating auctioneer.</p>
            </div>
            <div className="bg-white dark:bg-slate-800/80 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">02</div>
                <h3 className="text-slate-800 dark:text-white font-semibold">Initiate Session</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Once the auction status is READY, launch the live bidding session and systematically present each player to the participating franchise representatives.</p>
            </div>
            <div className="bg-white dark:bg-slate-800/80 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 dark:bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">03</div>
                <h3 className="text-slate-800 dark:text-white font-semibold">Execute Bidding</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Acknowledge and record bids from teams in real-time, manage jump bids according to slab rules, and officially declare players as SOLD or UNSOLD.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerOverview;
