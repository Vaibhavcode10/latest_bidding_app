import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  imageUrl?: string;
  verified?: boolean;
  age?: number;
  country?: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  purseRemaining: number;
  totalPurse: number;
}

interface AssignedAuction {
  id: string;
  name: string;
  sport: string;
  status: string;
  playerPool: string[];
  teamIds: string[];
  bidSlabs: { maxPrice: number | null; increment: number }[];
  timerDuration: number;
  participatingTeams?: Team[];
  assignedAuctioneer?: { id: string; name: string };
}

interface BidEntry {
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: string;
}

// Convert crores to raw number
const crToRaw = (cr: number) => cr * 10000000;
// Convert raw to crores
const rawToCr = (raw: number) => raw / 10000000;

export const AuctioneerLiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auction state
  const [assignedAuctions, setAssignedAuctions] = useState<AssignedAuction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<AssignedAuction | null>(null);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  // Live auction state
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerQueue, setPlayerQueue] = useState<string[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [teams, setTeams] = useState<Team[]>([]);

  // Current player bidding state - ALL VALUES IN CRORES
  const [currentBid, setCurrentBid] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [highestBidder, setHighestBidder] = useState<{ teamId: string; teamName: string } | null>(null);
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);
  const [customBidAmounts, setCustomBidAmounts] = useState<Record<string, string>>({});

  // Timer state (60 seconds)
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Undo state
  const [canUndo, setCanUndo] = useState(false);
  const [undoRemainingTime, setUndoRemainingTime] = useState(0);
  const [lastBidTeam, setLastBidTeam] = useState<string>('');

  // Animation state
  const [showSoldAnimation, setShowSoldAnimation] = useState(false);
  const [soldToTeam, setSoldToTeam] = useState<string>('');
  const [soldPrice, setSoldPrice] = useState(0);
  const [showUnsoldAnimation, setShowUnsoldAnimation] = useState(false);
  const [bidPulse, setBidPulse] = useState(false);

  // Get current player
  const currentPlayer = useMemo(() => {
    if (playerQueue.length === 0) return null;
    const playerId = playerQueue[currentPlayerIndex];
    return players.find(p => p.id === playerId) || null;
  }, [players, playerQueue, currentPlayerIndex]);

  // Calculate bid increment based on slabs (in Crores)
  const getIncrement = useCallback((currentAmount: number) => {
    if (!selectedAuction?.bidSlabs) return 0.25;
    for (const slab of selectedAuction.bidSlabs) {
      if (slab.maxPrice === null || currentAmount < slab.maxPrice) {
        return slab.increment;
      }
    }
    return 1;
  }, [selectedAuction]);

  // Next valid bid (in Crores)
  const nextValidBid = useMemo(() => {
    return currentBid + getIncrement(currentBid);
  }, [currentBid, getIncrement]);

  // Format currency (input in Crores)
  const formatCr = (amountInCr: number) => `₹${amountInCr.toFixed(2)} CR`;

  // Check if we came from overview with a selected auction
  useEffect(() => {
    const state = location.state as { selectedAuction?: AssignedAuction } | null;
    if (state?.selectedAuction) {
      setSelectedAuction(state.selectedAuction);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch assigned auctions
  useEffect(() => {
    const fetchAssignedAuctions = async () => {
      if (!user?.id) return;
      setLoadingAuctions(true);
      try {
        const response = await api.get(`/auctions/assigned/${user.id}`);
        if (response.data?.success) {
          setAssignedAuctions(response.data.auctions || []);
        }
      } catch (err) {
        console.error('Failed to fetch assigned auctions:', err);
      } finally {
        setLoadingAuctions(false);
      }
    };
    fetchAssignedAuctions();
  }, [user?.id]);

  // Fetch players when auction selected
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedAuction?.sport) return;
      try {
        const response: any = await api.get(`/players/${selectedAuction.sport}`);
        const allPlayers = response.data || response.players || response || [];
        setPlayers(Array.isArray(allPlayers) ? allPlayers : []);
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    fetchPlayers();
  }, [selectedAuction?.sport]);

  // Initialize teams from auction - REFETCH to get latest purse values
  useEffect(() => {
    const fetchFreshAuctionData = async () => {
      if (!selectedAuction?.id || !selectedAuction?.sport) return;
      
      try {
        // Refetch auction to get latest team purses
        const response = await api.get(`/auctions/${selectedAuction.sport}`);
        const auctions = response.data?.auctions || response.data || [];
        const freshAuction = auctions.find((a: any) => a.id === selectedAuction.id);
        
        if (freshAuction?.participatingTeams) {
          console.log('Fresh team data loaded:', freshAuction.participatingTeams);
          setTeams(freshAuction.participatingTeams);
        } else if (selectedAuction.participatingTeams) {
          setTeams(selectedAuction.participatingTeams);
        }
      } catch (err) {
        console.error('Failed to fetch fresh auction data:', err);
        if (selectedAuction.participatingTeams) {
          setTeams(selectedAuction.participatingTeams);
        }
      }
    };
    
    fetchFreshAuctionData();
  }, [selectedAuction?.id, selectedAuction?.sport]);

  // Check undo availability - MUST be defined before useEffect that uses it
  const checkUndoAvailability = useCallback(async () => {
    if (!isTimerRunning || !isLive) {
      setCanUndo(false);
      return;
    }
    
    try {
      const response = await api.get('/live-auction/state');
      if (response.data?.ledger?.lastBidUndoable) {
        const timeSince = Date.now() - response.data.ledger.lastBidUndoable.timestamp;
        const remaining = Math.max(0, 15000 - timeSince); // 15 second window
        
        if (remaining > 0) {
          setCanUndo(true);
          setUndoRemainingTime(remaining);
          setLastBidTeam(response.data.ledger.bidHistory?.length > 0 
            ? response.data.ledger.bidHistory[response.data.ledger.bidHistory.length - 1].teamName 
            : ''
          );
        } else {
          setCanUndo(false);
        }
      } else {
        setCanUndo(false);
      }
    } catch (err) {
      console.error('Check undo error:', err);
      setCanUndo(false);
    }
  }, [isTimerRunning, isLive]);

  // Timer countdown
  useEffect(() => {
    if (isTimerRunning && !isPaused && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerRunning && !isPaused) {
      handleTimerExpired();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, isPaused, timeRemaining]);

  // Check undo availability periodically
  useEffect(() => {
    let undoCheckInterval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning && !isPaused) {
      checkUndoAvailability();
      undoCheckInterval = setInterval(checkUndoAvailability, 1000);
    } else {
      setCanUndo(false);
    }

    return () => {
      if (undoCheckInterval) clearInterval(undoCheckInterval);
    };
  }, [isTimerRunning, isPaused, checkUndoAvailability]);

  const handleTimerExpired = () => {
    setIsTimerRunning(false);
    if (highestBidder) {
      handleSellPlayer();
    } else {
      handleUnsoldPlayer();
    }
  };

  const startTimer = () => {
    setTimeRemaining(60);
    setIsTimerRunning(true);
  };

  const restartTimer = () => {
    setTimeRemaining(60);
  };

  const shufflePlayers = () => {
    if (!isLive) {
      const pool = selectedAuction?.playerPool || [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      setPlayerQueue(shuffled);
    } else {
      const remaining = playerQueue.slice(currentPlayerIndex + 1);
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      setPlayerQueue([...playerQueue.slice(0, currentPlayerIndex + 1), ...shuffled]);
    }
  };

  const handleStartAuction = () => {
    if (!selectedAuction) return;
    const queue = playerQueue.length > 0 ? playerQueue : [...selectedAuction.playerPool];
    setPlayerQueue(queue);
    setCurrentPlayerIndex(0);
    setIsLive(true);
    setIsPaused(false);
    
    const firstPlayerId = queue[0];
    const firstPlayer = players.find(p => p.id === firstPlayerId);
    if (firstPlayer) {
      // Convert raw basePrice to CR (10000000 raw = 1 CR)
      const basePriceCr = rawToCr(firstPlayer.basePrice);
      setBasePrice(basePriceCr);
      setCurrentBid(basePriceCr);
      setHighestBidder(null);
      setBidHistory([]);
      startTimer();
    }
  };

  const loadNextPlayer = () => {
    const nextIndex = currentPlayerIndex + 1;
    if (nextIndex >= playerQueue.length) {
      setIsLive(false);
      setIsTimerRunning(false);
      return;
    }

    setCurrentPlayerIndex(nextIndex);
    const nextPlayerId = playerQueue[nextIndex];
    const nextPlayer = players.find(p => p.id === nextPlayerId);
    
    if (nextPlayer) {
      // Convert raw basePrice to CR (10000000 raw = 1 CR)
      const basePriceCr = rawToCr(nextPlayer.basePrice);
      setBasePrice(basePriceCr);
      setCurrentBid(basePriceCr);
      setHighestBidder(null);
      setBidHistory([]);
      setCustomBidAmounts({});
      startTimer();
    }
  };

  // RAISE BID - Simple one-click (team purse is in raw, bid is in CR)
  const handleRaiseBid = (team: Team) => {
    if (isPaused || !isTimerRunning) return;
    
    const newBidCr = nextValidBid;
    const newBidRaw = crToRaw(newBidCr);
    
    // Check if team can afford
    if (team.purseRemaining < newBidRaw) {
      alert(`${team.name} cannot afford ₹${newBidCr.toFixed(2)} CR!`);
      return;
    }

    setCurrentBid(newBidCr);
    setHighestBidder({ teamId: team.id, teamName: team.name });
    setBidHistory(prev => [...prev, {
      teamId: team.id,
      teamName: team.name,
      amount: newBidCr,
      timestamp: new Date().toISOString()
    }]);
    
    setBidPulse(true);
    setTimeout(() => setBidPulse(false), 500);
    restartTimer();
  };

  // UNDO LAST BID
  const handleUndoBid = async () => {
    try {
      const response = await api.undoLastBid('auctioneer', user?.id || '');
      
      if (response.data.success) {
        // Update local state
        setCurrentBid(response.data.newCurrentBid || basePrice);
        setHighestBidder(response.data.newHighestBidder || null);
        setBidHistory(prev => prev.slice(0, -1)); // Remove last entry
        
        console.log(`Undid bid: ${response.data.message}`);
        setCanUndo(false); // Clear undo immediately
      } else {
        console.error('Undo failed:', response.data.error);
        alert(response.data.error);
      }
    } catch (err) {
      console.error('Undo error:', err);
      alert('Failed to undo bid');
    }
  };

  // JUMP BID - Custom amount
  const handleJumpBid = (team: Team) => {
    if (isPaused || !isTimerRunning) return;
    
    const customAmountCr = parseFloat(customBidAmounts[team.id] || '0');
    if (!customAmountCr || customAmountCr <= currentBid) {
      alert('Jump bid must be higher than current bid!');
      return;
    }
    
    const customAmountRaw = crToRaw(customAmountCr);
    if (team.purseRemaining < customAmountRaw) {
      alert(`${team.name} cannot afford ₹${customAmountCr.toFixed(2)} CR!`);
      return;
    }

    setCurrentBid(customAmountCr);
    setHighestBidder({ teamId: team.id, teamName: team.name });
    setBidHistory(prev => [...prev, {
      teamId: team.id,
      teamName: team.name,
      amount: customAmountCr,
      timestamp: new Date().toISOString()
    }]);
    setCustomBidAmounts(prev => ({ ...prev, [team.id]: '' }));
    
    setBidPulse(true);
    setTimeout(() => setBidPulse(false), 500);
    restartTimer();
  };

  const handleSellPlayer = async () => {
    if (!highestBidder || !currentPlayer || !selectedAuction) return;
    
    setIsTimerRunning(false);
    setSoldToTeam(highestBidder.teamName);
    setSoldPrice(currentBid);
    setShowSoldAnimation(true);

    // Deduct from team purse (convert CR to raw)
    const soldPriceRaw = crToRaw(currentBid);
    const updatedTeams = teams.map(t => 
      t.id === highestBidder.teamId 
        ? { ...t, purseRemaining: t.purseRemaining - soldPriceRaw }
        : t
    );
    setTeams(updatedTeams);

    try {
      // Save sale to backend
      await api.post(`/live-auction/sell`, {
        auctionId: selectedAuction.id,
        sport: selectedAuction.sport,
        playerId: currentPlayer.id,
        teamId: highestBidder.teamId,
        soldPrice: currentBid,
        bidHistory
      });

      // Update the auction with new team purses (using the teams endpoint)
      await api.put(`/auctions/${selectedAuction.sport}/${selectedAuction.id}/teams`, {
        participatingTeams: updatedTeams,
        userRole: 'auctioneer',
        userId: user?.id
      });
    } catch (err) {
      console.error('Failed to save sold player:', err);
    }

    setTimeout(() => {
      setShowSoldAnimation(false);
      loadNextPlayer();
    }, 3000);
  };

  const handleUnsoldPlayer = async () => {
    if (!currentPlayer) return;
    
    setIsTimerRunning(false);
    setShowUnsoldAnimation(true);

    try {
      await api.post(`/live-auction/unsold`, {
        auctionId: selectedAuction?.id,
        sport: selectedAuction?.sport,
        playerId: currentPlayer.id
      });
    } catch (err) {
      console.error('Failed to mark unsold:', err);
    }

    setTimeout(() => {
      setShowUnsoldAnimation(false);
      loadNextPlayer();
    }, 2500);
  };

  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);

  const handleEndAuction = async () => {
    if (confirm('TERMINATE THIS AUCTION?')) {
      try {
        await api.put(`/auctions/${selectedAuction?.sport}/${selectedAuction?.id}`, {
          status: 'COMPLETED'
        });
        setIsLive(false);
        setIsPaused(false);
        setIsTimerRunning(false);
        navigate('/auctioneer');
      } catch (err) {
        console.error('Failed to end auction:', err);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loadingAuctions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] flex items-center justify-center">
        <div className="text-primary-600 dark:text-cyan-400 text-xl tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  // ============================================
  // AUCTION SELECTION
  // ============================================
  if (!selectedAuction) {
    const readyAuctions = assignedAuctions.filter(a => a.status === 'READY');
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-wider uppercase mb-8 border-l-4 border-primary-500 dark:border-cyan-500 pl-4">
            Select Auction
          </h1>
          
          {readyAuctions.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1f35] border border-gray-200 dark:border-cyan-900/50 p-12 text-center rounded-xl">
              <p className="text-gray-800 dark:text-gray-200 uppercase tracking-wider">No auctions available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {readyAuctions.map(auction => (
                <div 
                  key={auction.id}
                  onClick={() => setSelectedAuction(auction)}
                  className="bg-white dark:bg-[#0d1f35] border border-gray-200 dark:border-cyan-900/30 p-6 cursor-pointer hover:border-primary-500 dark:hover:border-cyan-500 transition-all group rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">{auction.name}</h2>
                      <p className="text-primary-600 dark:text-cyan-600 uppercase text-sm tracking-wider mt-1">{auction.sport}</p>
                      <div className="flex gap-6 mt-3 text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        <span>{auction.participatingTeams?.length || 0} Teams</span>
                        <span>{auction.playerPool?.length || 0} Players</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 border border-primary-500/50 dark:border-cyan-500/50 flex items-center justify-center group-hover:bg-primary-500 dark:group-hover:bg-cyan-500 transition-all rounded-lg">
                      <span className="text-primary-500 dark:text-cyan-500 group-hover:text-white dark:group-hover:text-[#0a1628] text-xl">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // PRE-START SCREEN
  // ============================================
  if (!isLive) {
    const playersInPool = (playerQueue.length > 0 ? playerQueue : selectedAuction.playerPool)
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1628] p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-cyan-900/30 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">{selectedAuction.name}</h1>
              <p className="text-primary-600 dark:text-cyan-600 uppercase text-sm tracking-wider mt-1">
                {playersInPool.length} Players • {teams.length} Teams
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedAuction(null)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 uppercase tracking-wider text-sm hover:border-gray-400 dark:hover:border-gray-500 transition-all rounded-lg"
              >
                Back
              </button>
              <button
                onClick={shufflePlayers}
                className="px-6 py-3 border border-primary-500 dark:border-cyan-700 text-primary-600 dark:text-cyan-400 uppercase tracking-wider text-sm hover:bg-primary-50 dark:hover:bg-cyan-900/30 transition-all rounded-lg"
              >
                🔀 Shuffle
              </button>
              <button
                onClick={handleStartAuction}
                className="px-8 py-3 bg-primary-500 dark:bg-cyan-500 text-white dark:text-[#0a1628] font-bold uppercase tracking-wider hover:bg-primary-600 dark:hover:bg-cyan-400 transition-all rounded-lg"
              >
                🚀 Start Auction
              </button>
            </div>
          </div>

          {/* Teams */}
          <div className="mb-8">
            <h2 className="text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4">Participating Teams</h2>
            <div className="grid grid-cols-4 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white dark:bg-[#0d1f35] border border-gray-200 dark:border-cyan-900/30 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#0a1628] border border-gray-200 dark:border-cyan-900/50 flex items-center justify-center rounded-lg">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-primary-500 dark:text-cyan-500 text-sm font-bold">{team.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm font-semibold uppercase">{team.name}</p>
                      <p className="text-primary-600 dark:text-cyan-600 text-xs">{formatCr(rawToCr(team.purseRemaining))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Queue */}
          <div>
            <h2 className="text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4">Player Queue</h2>
            <div className="grid grid-cols-6 gap-3">
              {playersInPool.map((player, idx) => (
                <div key={player.id} className="bg-white dark:bg-[#0d1f35] border border-gray-200 dark:border-cyan-900/30 p-3 relative rounded-xl shadow-sm">
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary-500 dark:bg-cyan-500 flex items-center justify-center rounded">
                    <span className="text-white dark:text-[#0a1628] text-xs font-bold">{idx + 1}</span>
                  </div>
                  <div className="w-full h-16 bg-gray-100 dark:bg-[#0a1628] mb-2 flex items-center justify-center overflow-hidden rounded-lg">
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 text-2xl">👤</span>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white text-xs font-semibold uppercase truncate">{player.name}</p>
                  <p className="text-primary-600 dark:text-cyan-600 text-xs">{formatCr(rawToCr(player.basePrice))}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // LIVE AUCTION - PREMIUM BROADCAST DESIGN
  // ============================================
  return (
    <div className="h-screen bg-gray-50 dark:bg-[#0a1628] flex flex-col overflow-hidden">
      
      {/* SOLD Animation Overlay */}
      {showSoldAnimation && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#0a1628]/95 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-8xl mb-4">🎉</div>
            <div className="text-6xl font-black text-primary-500 dark:text-cyan-400 tracking-widest mb-4">SOLD!</div>
            <div className="text-3xl text-gray-900 dark:text-white uppercase tracking-wider">{currentPlayer?.name}</div>
            <div className="text-4xl text-yellow-500 dark:text-yellow-400 font-bold mt-4">
              {formatCr(soldPrice)} → {soldToTeam}
            </div>
          </div>
        </div>
      )}

      {/* UNSOLD Animation Overlay */}
      {showUnsoldAnimation && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#0a1628]/95 flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-4">😔</div>
            <div className="text-6xl font-black text-red-500 tracking-widest mb-4">UNSOLD</div>
            <div className="text-3xl text-gray-900 dark:text-white uppercase tracking-wider">{currentPlayer?.name}</div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className="bg-white dark:bg-[#0d1f35] border-b border-gray-200 dark:border-cyan-900/30 px-6 py-3 flex-shrink-0 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">{selectedAuction.name}</h1>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 dark:text-red-400 text-sm uppercase tracking-wider font-semibold">Live</span>
            </div>
            <span className="text-gray-800 dark:text-gray-200 text-sm">
              Player {currentPlayerIndex + 1} of {playerQueue.length}
            </span>
          </div>
          
          <div className="flex gap-3">
            <button onClick={shufflePlayers} className="px-4 py-2 border border-primary-500 dark:border-cyan-800 text-primary-600 dark:text-cyan-500 text-xs uppercase hover:bg-primary-50 dark:hover:bg-cyan-900/30 rounded-lg">
              🔀 Shuffle
            </button>
            {isPaused ? (
              <button onClick={handleResume} className="px-4 py-2 bg-green-500 text-white text-xs uppercase font-bold hover:bg-green-600 rounded-lg">
                ▶ Resume
              </button>
            ) : (
              <button onClick={handlePause} className="px-4 py-2 bg-yellow-600 text-black text-xs uppercase font-bold hover:bg-yellow-500">
                ⏸ Pause
              </button>
            )}
            <button onClick={handleEndAuction} className="px-4 py-2 bg-red-600 text-white text-xs uppercase font-bold hover:bg-red-500">
              ⛔ End
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {currentPlayer ? (
          <>
            {/* PLAYER SECTION */}
            <div className="flex-1 flex items-center justify-center gap-12 mb-6">
              
              {/* LEFT - BASE PRICE */}
              <div className="text-center">
                <p className="text-gray-800 dark:text-gray-200 uppercase tracking-wider text-xs mb-2">Base Price</p>
                <p className="text-3xl text-gray-700 dark:text-gray-400">{formatCr(basePrice)}</p>
              </div>

              {/* CENTER - PLAYER CARD */}
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-primary-500/30 dark:border-cyan-500/30 rotate-45 rounded-xl"></div>
                  <div className="absolute inset-4 bg-white dark:bg-[#0d1f35] flex items-center justify-center overflow-hidden rounded-lg shadow-lg">
                    {currentPlayer.imageUrl ? (
                      <img src={currentPlayer.imageUrl} alt={currentPlayer.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">👤</span>
                    )}
                  </div>
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                  {currentPlayer.name}
                </h2>
                <p className="text-primary-500 dark:text-cyan-500 uppercase tracking-wider">
                  {currentPlayer.role} {currentPlayer.age ? `• ${currentPlayer.age} YRS` : ''}
                </p>
              </div>

              {/* RIGHT - CURRENT BID & TIMER */}
              <div className="text-center">
                <p className="text-primary-500 dark:text-cyan-500 uppercase tracking-wider text-sm mb-2">Current Bid</p>
                <div className={`text-6xl font-black text-gray-900 dark:text-white mb-4 transition-all ${bidPulse ? 'scale-110 text-primary-500 dark:text-cyan-400' : ''}`}>
                  {formatCr(currentBid)}
                </div>
                
                {highestBidder && (
                  <p className="text-yellow-500 dark:text-yellow-400 uppercase tracking-wider mb-4">
                    👑 {highestBidder.teamName}
                  </p>
                )}

                {/* Timer */}
                <div className={`text-5xl font-mono font-bold ${
                  timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 
                  timeRemaining <= 30 ? 'text-yellow-500' : 'text-green-500'
                }`}>
                  {formatTimer(timeRemaining)}
                </div>
                <p className="text-gray-600 dark:text-gray-600 text-xs uppercase mt-1">
                  {isPaused ? '⏸ PAUSED' : 'Time Remaining'}
                </p>

                {/* Sell/Unsold Buttons */}
                <div className="flex gap-3 mt-6 justify-center">
                  <button
                    onClick={handleSellPlayer}
                    disabled={!highestBidder || isPaused}
                    className="px-8 py-3 bg-green-500 text-white font-bold uppercase tracking-wider hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                  >
                    ✅ SELL
                  </button>
                  
                  {/* UNDO BUTTON - only show when undo is available */}
                  {canUndo && (
                    <button
                      onClick={handleUndoBid}
                      className="px-6 py-3 bg-orange-500 text-white font-bold uppercase tracking-wider hover:bg-orange-400 border-2 border-orange-400 animate-pulse rounded-lg"
                      title={`Undo last bid from ${lastBidTeam} (${Math.ceil(undoRemainingTime / 1000)}s remaining)`}
                    >
                      ↶ UNDO
                    </button>
                  )}
                  
                  <button
                    onClick={handleUnsoldPlayer}
                    disabled={isPaused}
                    className="px-8 py-3 bg-red-500 text-white font-bold uppercase tracking-wider hover:bg-red-600 disabled:opacity-30 rounded-lg"
                  >
                    ❌ UNSOLD
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM - TEAMS WITH BIG BID BUTTONS */}
            <div className="bg-white dark:bg-[#0d1f35] border-t border-gray-200 dark:border-cyan-900/30 p-4 flex-shrink-0 shadow-lg">
              <div className="grid grid-cols-4 gap-4">
                {teams.map(team => {
                  const isLeading = highestBidder?.teamId === team.id;
                  const purseCr = rawToCr(team.purseRemaining);
                  const canAfford = purseCr >= nextValidBid;

                  return (
                    <div
                      key={team.id}
                      className={`p-4 transition-all rounded-xl ${
                        isLeading 
                          ? 'bg-primary-100 dark:bg-cyan-500/20 border-2 border-primary-500 dark:border-cyan-400' 
                          : 'bg-gray-50 dark:bg-[#0a1628] border border-gray-200 dark:border-cyan-900/30'
                      }`}
                    >
                      {/* Team Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                            isLeading ? 'bg-primary-500 dark:bg-cyan-500' : 'bg-white dark:bg-[#0d1f35] border border-gray-200 dark:border-cyan-900/50'
                          }`}>
                            {team.logoUrl ? (
                              <img src={team.logoUrl} alt={team.name} className="w-6 h-6 object-contain" />
                            ) : (
                              <span className={`text-xs font-bold ${isLeading ? 'text-white dark:text-[#0a1628]' : 'text-primary-500 dark:text-cyan-500'}`}>
                                {team.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold uppercase text-sm ${isLeading ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {team.name}
                            </p>
                            <p className={`text-xs ${isLeading ? 'text-primary-600 dark:text-cyan-300' : 'text-gray-500'}`}>
                              {formatCr(purseCr)} left
                            </p>
                          </div>
                        </div>
                        {isLeading && <span className="text-2xl">👑</span>}
                      </div>

                      {/* BIG RAISE BID BUTTON */}
                      <button
                        onClick={() => handleRaiseBid(team)}
                        disabled={isPaused || !canAfford}
                        className={`w-full py-4 font-bold text-lg uppercase tracking-wider transition-all mb-2 rounded-lg ${
                          !canAfford || isPaused
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-500 dark:bg-cyan-500 text-white dark:text-[#0a1628] hover:bg-primary-600 dark:hover:bg-cyan-400 active:scale-95'
                        }`}
                      >
                        {isPaused ? '⏸ PAUSED' : !canAfford ? '💸 LOW PURSE' : `⬆️ BID ${formatCr(nextValidBid)}`}
                      </button>

                      {/* Jump Bid Row */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.25"
                          placeholder="Jump CR"
                          value={customBidAmounts[team.id] || ''}
                          onChange={(e) => setCustomBidAmounts(prev => ({ ...prev, [team.id]: e.target.value }))}
                          disabled={isPaused || !isTimerRunning}
                          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#0d1f35] border border-gray-300 dark:border-cyan-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500 dark:focus:border-cyan-500 disabled:opacity-50 rounded-lg"
                        />
                        <button
                          onClick={() => handleJumpBid(team)}
                          disabled={isPaused || !customBidAmounts[team.id] || !isTimerRunning}
                          className="px-4 py-2 bg-yellow-500 text-white dark:text-[#0a1628] font-bold hover:bg-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
                        >
                          🚀
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Auction Complete!</h2>
              <button
                onClick={() => navigate('/auctioneer')}
                className="mt-6 px-8 py-3 bg-primary-500 dark:bg-cyan-500 text-white dark:text-[#0a1628] font-bold uppercase rounded-lg hover:bg-primary-600 dark:hover:bg-cyan-400"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctioneerLiveDashboard;
