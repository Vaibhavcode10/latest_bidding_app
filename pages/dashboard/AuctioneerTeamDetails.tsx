import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
}

const AuctioneerTeamDetails: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [teamData, setTeamData] = useState({
    name: 'Champion Dragons',
    city: 'New York',
    founded: '2020',
    coach: 'John Anderson',
    coachEmail: 'john@champions.com',
    stadium: 'Thunder Arena',
    capacity: 55000,
    description: 'A powerhouse team with a strong track record of winning auctions and developing talent.',
  });

  const [formData, setFormData] = useState(teamData);

  const [teamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Aaron Johnson', role: 'Pitcher', status: 'ACTIVE', joinDate: '2024-01-15' },
    { id: '2', name: 'Mike Davis', role: 'Outfielder', status: 'ACTIVE', joinDate: '2024-02-01' },
    { id: '3', name: 'Carlos Rodriguez', role: 'Catcher', status: 'ACTIVE', joinDate: '2024-01-20' },
    { id: '4', name: 'David Wilson', role: 'Infielder', status: 'ACTIVE', joinDate: '2024-02-10' },
    { id: '5', name: 'James Brown', role: 'Pitcher', status: 'INACTIVE', joinDate: '2023-11-05' },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? parseInt(value) : value,
    });
  };

  const handleSave = () => {
    setTeamData(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(teamData);
    setIsEditing(false);
  };

  const activeMembers = teamMembers.filter((m) => m.status === 'ACTIVE').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <h1 className="text-4xl font-black text-white mb-2">Team Management</h1>
        <p className="text-slate-400">Edit team information and manage squad details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl space-y-6">
              <h3 className="text-xl font-bold text-white">Edit Team Details</h3>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Team Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Founded Year</label>
                  <input
                    type="text"
                    name="founded"
                    value={formData.founded}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Coach Name</label>
                  <input
                    type="text"
                    name="coach"
                    value={formData.coach}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Coach Email</label>
                  <input
                    type="email"
                    name="coachEmail"
                    value={formData.coachEmail}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Stadium Name</label>
                  <input
                    type="text"
                    name="stadium"
                    value={formData.stadium}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                >
                  ✓ Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">Team Details</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all"
                  >
                    ✏️ Edit
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="pb-4 border-b border-slate-700">
                      <p className="text-slate-500 text-sm mb-1">Team Name</p>
                      <p className="text-white font-semibold text-lg">{teamData.name}</p>
                    </div>
                    <div className="pb-4 border-b border-slate-700">
                      <p className="text-slate-500 text-sm mb-1">City</p>
                      <p className="text-white font-semibold text-lg">{teamData.city}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="pb-4 border-b border-slate-700">
                      <p className="text-slate-500 text-sm mb-1">Founded</p>
                      <p className="text-white font-semibold text-lg">{teamData.founded}</p>
                    </div>
                    <div className="pb-4 border-b border-slate-700">
                      <p className="text-slate-500 text-sm mb-1">Stadium</p>
                      <p className="text-white font-semibold">{teamData.stadium}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="pb-4 border-b border-slate-700">
                      <p className="text-slate-500 text-sm mb-1">Coach</p>
                      <p className="text-white font-semibold">{teamData.coach}</p>
                    </div>
                    <div className="pb-4 border-b border-slate-700">
                      <p className="text-slate-500 text-sm mb-1">Coach Email</p>
                      <p className="text-white font-semibold">{teamData.coachEmail}</p>
                    </div>
                  </div>

                  <div className="pb-4 border-b border-slate-700">
                    <p className="text-slate-500 text-sm mb-1">Stadium Capacity</p>
                    <p className="text-white font-semibold">{teamData.capacity.toLocaleString()} seats</p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm mb-2">Description</p>
                    <p className="text-slate-300 leading-relaxed">{teamData.description}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Squad Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Squad Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">Total Players</p>
                <p className="text-4xl font-black text-blue-400">{teamMembers.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Active Players</p>
                <p className="text-3xl font-bold text-green-400">{activeMembers}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Inactive Players</p>
                <p className="text-3xl font-bold text-orange-400">{teamMembers.length - activeMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Stadium:</span>
                <span className="text-white font-semibold">{teamData.stadium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capacity:</span>
                <span className="text-white font-semibold">{teamData.capacity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coach:</span>
                <span className="text-white font-semibold">{teamData.coach}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Squad Members */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-6">Current Squad</h3>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-blue-600/30 transition-all"
            >
              <div>
                <p className="text-white font-semibold">{member.name}</p>
                <p className="text-slate-400 text-sm">{member.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  member.status === 'ACTIVE'
                    ? 'bg-green-600/30 text-green-300'
                    : 'bg-orange-600/30 text-orange-300'
                }`}>
                  {member.status}
                </span>
                <p className="text-slate-400 text-sm">Joined: {new Date(member.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuctioneerTeamDetails;
