import React, { useState } from 'react';

interface AuctioneerPlayer {
  id: string;
  name: string;
  role: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD' | 'UNSOLD';
  soldTo?: string;
  soldPrice?: number;
}

const AuctioneerPlayers: React.FC = () => {
  const [players, setPlayers] = useState<AuctioneerPlayer[]>([
    { id: '1', name: 'Aaron Johnson', role: 'Pitcher', price: 1500000, status: 'SOLD', soldTo: 'Dragons', soldPrice: 1800000 },
    { id: '2', name: 'Mike Davis', role: 'Outfielder', price: 1800000, status: 'AVAILABLE' },
    { id: '3', name: 'Carlos Rodriguez', role: 'Catcher', price: 1300000, status: 'SOLD', soldTo: 'Tigers', soldPrice: 1500000 },
    { id: '4', name: 'David Wilson', role: 'Infielder', price: 1200000, status: 'AVAILABLE' },
    { id: '5', name: 'James Brown', role: 'Pitcher', price: 1400000, status: 'UNSOLD' },
  ]);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    role: 'Pitcher',
    price: 0,
  });

  const handleAddPlayer = () => {
    if (newPlayer.name && newPlayer.price > 0) {
      const player: AuctioneerPlayer = {
        id: `p_${Date.now()}`,
        name: newPlayer.name,
        role: newPlayer.role,
        price: newPlayer.price,
        status: 'AVAILABLE',
      };
      setPlayers([...players, player]);
      setNewPlayer({ name: '', role: 'Pitcher', price: 0 });
      setShowAddModal(false);
    }
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
    setSelectedPlayer(null);
  };

  const availablePlayers = players.filter((p) => p.status === 'AVAILABLE').length;
  const soldPlayers = players.filter((p) => p.status === 'SOLD').length;
  const unsoldPlayers = players.filter((p) => p.status === 'UNSOLD').length;

  const roles = ['Pitcher', 'Catcher', 'Infielder', 'Outfielder', 'Designated Hitter'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Manage Players</h1>
            <p className="text-slate-400">View and manage players in your franchise</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all"
          >
            + Add New Player
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-blue-300 text-sm font-semibold mb-2">Available</p>
          <p className="text-4xl font-black text-blue-400">{availablePlayers}</p>
          <p className="text-slate-400 text-xs mt-2">Players ready for auction</p>
        </div>
        <div className="bg-green-600/20 border border-green-600/30 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-green-300 text-sm font-semibold mb-2">Sold</p>
          <p className="text-4xl font-black text-green-400">{soldPlayers}</p>
          <p className="text-slate-400 text-xs mt-2">Players sold to teams</p>
        </div>
        <div className="bg-orange-600/20 border border-orange-600/30 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-orange-300 text-sm font-semibold mb-2">Unsold</p>
          <p className="text-4xl font-black text-orange-400">{unsoldPlayers}</p>
          <p className="text-slate-400 text-xs mt-2">Did not sell at auction</p>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-4">
        {players.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg">No players added yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
            >
              Add First Player
            </button>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 hover:border-blue-600/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{player.name}</h3>
                  <p className="text-slate-400 mb-4">{player.role}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Base Price</p>
                      <p className="text-white font-bold">₹{player.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Status</p>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold inline-block ${
                        player.status === 'AVAILABLE'
                          ? 'bg-blue-600/30 text-blue-300'
                          : player.status === 'SOLD'
                          ? 'bg-green-600/30 text-green-300'
                          : 'bg-orange-600/30 text-orange-300'
                      }`}>
                        {player.status}
                      </span>
                    </div>
                    {player.soldTo && (
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Sold To</p>
                        <p className="text-white font-bold">{player.soldTo}</p>
                      </div>
                    )}
                    {player.soldPrice && (
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Sold Price</p>
                        <p className="text-green-400 font-bold">₹{player.soldPrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlayer(player.id)}
                  className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-600/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6">Add New Player</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Player Name</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="Enter player name..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Role</label>
                <select
                  value={newPlayer.role}
                  onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Base Price</label>
                <input
                  type="number"
                  value={newPlayer.price}
                  onChange={(e) => setNewPlayer({ ...newPlayer, price: parseInt(e.target.value) || 0 })}
                  placeholder="Enter base price..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddPlayer}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all"
              >
                Add Player
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPlayer({ name: '', role: 'Pitcher', price: 0 });
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-600/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-4">Remove Player</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to remove {players.find((p) => p.id === selectedPlayer)?.name}? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleDeletePlayer(selectedPlayer);
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-all"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctioneerPlayers;
