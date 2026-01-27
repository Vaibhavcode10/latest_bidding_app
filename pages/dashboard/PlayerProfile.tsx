import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBiddingRequest } from '../../context/BiddingRequestContext';
import { BiddingRequestStatus } from '../../types';

interface ProfileData {
  name: string;
  sport: string;
  role: string;
  jersey: number | null;
  height: string;
  weight: string;
  age: number | null;
  basePrice: number;
  bio: string;
  email: string;
}

const PlayerProfilePage: React.FC = () => {
  const { user, updateProfile, refreshProfile } = useAuth();
  const { addRequest, getPlayerRequest } = useBiddingRequest();
  const [isEditing, setIsEditing] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form data from user context
  const getInitialFormData = (): ProfileData => ({
    name: user?.name || 'Unavailable',
    sport: user?.sport || 'Unavailable',
    role: user?.playerRole || 'Unavailable',
    jersey: user?.jersey ?? null,
    height: user?.height || 'Unavailable',
    weight: user?.weight || 'Unavailable',
    age: user?.age ?? null,
    basePrice: user?.basePrice || 0,
    bio: user?.bio || 'Unavailable',
    email: user?.email || 'Unavailable',
  });

  const [formData, setFormData] = useState<ProfileData>(getInitialFormData());

  // Update form data when user changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [user]);

  // Refresh profile on mount
  useEffect(() => {
    refreshProfile();
  }, []);

  const playerRequest = user?.id ? getPlayerRequest(user.id) : undefined;
  const hasActiveRequest = playerRequest && playerRequest.status !== BiddingRequestStatus.REJECTED;

  const isNewUser = !user?.name || user?.name === 'Unavailable';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['jersey', 'age', 'basePrice'].includes(name) 
        ? (value === '' ? null : parseInt(value)) 
        : value,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Prepare data for API (map role back to playerRole for the API)
      const updateData = {
        name: formData.name,
        role: formData.role, // This is the playing position
        jersey: formData.jersey,
        height: formData.height,
        weight: formData.weight,
        age: formData.age,
        basePrice: formData.basePrice,
        bio: formData.bio,
      };
      
      await updateProfile(updateData);
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(getInitialFormData());
    setIsEditing(false);
  };

  const handleRequestBid = () => {
    if (!user) return;
    
    addRequest({
      playerId: user.id,
      playerName: formData.name,
      sport: formData.sport,
      role: formData.role,
      basePrice: formData.basePrice,
      status: BiddingRequestStatus.PENDING,
    });
    setRequestSubmitted(true);
  };

  // Get roles based on sport
  const getRolesBySport = (sport: string): string[] => {
    const sportRoles: Record<string, string[]> = {
      cricket: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
      football: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
      baseball: ['Pitcher', 'Catcher', 'Infielder', 'Outfielder'],
      volleyball: ['Setter', 'Libero', 'Spiker', 'Blocker', 'Opposite Hitter'],
    };
    return sportRoles[sport.toLowerCase()] || ['Player'];
  };

  const roles = getRolesBySport(formData.sport);

  const displayValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '' || value === 'Unavailable') {
      return <span className="text-slate-500 italic">Unavailable</span>;
    }
    return value;
  };

  return (
    <div className="space-y-8">
      {/* New User Banner */}
      {isNewUser && (
        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👋</span>
            <div>
              <h3 className="text-lg font-bold text-yellow-300">Welcome, New Player!</h3>
              <p className="text-yellow-200/80 text-sm">Please edit your profile to add your details. Click "Edit Profile" to get started.</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl ${saveMessage.type === 'success' ? 'bg-green-600/20 border border-green-600/30' : 'bg-red-600/20 border border-red-600/30'}`}>
          <p className={saveMessage.type === 'success' ? 'text-green-300' : 'text-red-300'}>{saveMessage.text}</p>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-6">
            <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-6xl font-bold">
              {formData.name && formData.name !== 'Unavailable' ? formData.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2">
                {formData.name !== 'Unavailable' ? formData.name : <span className="text-slate-500 italic">Name Unavailable</span>}
              </h1>
              <p className="text-slate-400 text-lg mb-4">
                {displayValue(formData.role)} • {formData.sport !== 'Unavailable' ? formData.sport.toUpperCase() : 'Sport N/A'}
              </p>
              <div className="space-y-1">
                <p className="text-sm text-slate-300"><span className="text-slate-500">Age:</span> {formData.age ? `${formData.age} years` : displayValue(null)}</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Height:</span> {displayValue(formData.height)}</p>
                <p className="text-sm text-slate-300"><span className="text-slate-500">Weight:</span> {displayValue(formData.weight)}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (isEditing) handleCancel();
              else setIsEditing(true);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              isEditing
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isEditing ? 'Cancel' : '✏️ Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl space-y-6">
              <h3 className="text-xl font-bold text-white">Edit Your Profile</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name === 'Unavailable' ? '' : formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Jersey Number</label>
                  <input
                    type="number"
                    name="jersey"
                    value={formData.jersey ?? ''}
                    onChange={handleInputChange}
                    placeholder="Enter jersey number"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age ?? ''}
                    onChange={handleInputChange}
                    placeholder="Enter your age"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Playing Role *</label>
                  <select
                    name="role"
                    value={formData.role === 'Unavailable' ? '' : formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Height</label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height === 'Unavailable' ? '' : formData.height}
                    onChange={handleInputChange}
                    placeholder="e.g., 6.0 ft"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight === 'Unavailable' ? '' : formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g., 75 kg"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Base Price (₹)</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice || ''}
                  onChange={handleInputChange}
                  placeholder="Enter your base price"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio === 'Unavailable' ? '' : formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself, your achievements, playing style..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 rounded-lg transition-all"
                >
                  {isSaving ? 'Saving...' : '✓ Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl">
                <h3 className="text-xl font-bold text-white mb-6">About</h3>
                <p className="text-slate-300 leading-relaxed">
                  {formData.bio && formData.bio !== 'Unavailable' ? formData.bio : <span className="text-slate-500 italic">No bio available. Edit your profile to add a bio.</span>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
                  <p className="text-slate-400 text-sm mb-2">Jersey Number</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {formData.jersey !== null ? `#${formData.jersey}` : displayValue(null)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
                  <p className="text-slate-400 text-sm mb-2">Base Price</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {formData.basePrice > 0 ? `₹${formData.basePrice.toLocaleString()}` : displayValue(null)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-6">
          {/* Bidding Request Status */}
          {playerRequest && (
            <div className={`rounded-2xl p-6 backdrop-blur-xl border ${
              playerRequest.status === BiddingRequestStatus.PENDING
                ? 'bg-yellow-600/10 border-yellow-600/20'
                : playerRequest.status === BiddingRequestStatus.APPROVED
                ? 'bg-green-600/10 border-green-600/20'
                : playerRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION
                ? 'bg-blue-600/10 border-blue-600/20'
                : 'bg-red-600/10 border-red-600/20'
            }`}>
              <h3 className="text-lg font-bold text-white mb-4">Bidding Request Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Status</p>
                  <p className={`font-semibold text-lg ${
                    playerRequest.status === BiddingRequestStatus.PENDING
                      ? 'text-yellow-400'
                      : playerRequest.status === BiddingRequestStatus.APPROVED
                      ? 'text-green-400'
                      : playerRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION
                      ? 'text-blue-400'
                      : 'text-red-400'
                  }`}>
                    {playerRequest.status === BiddingRequestStatus.PENDING && '⏳ Pending Review'}
                    {playerRequest.status === BiddingRequestStatus.APPROVED && '✓ Approved by Admin'}
                    {playerRequest.status === BiddingRequestStatus.ADDED_TO_AUCTION && '🎯 Added to Auction'}
                    {playerRequest.status === BiddingRequestStatus.REJECTED && '✗ Rejected'}
                  </p>
                </div>
                {playerRequest.approvedAt && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Approved on</p>
                    <p className="text-white font-semibold">{new Date(playerRequest.approvedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {playerRequest.rejectionReason && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Rejection Reason</p>
                    <p className="text-red-300 font-semibold">{playerRequest.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasActiveRequest && !requestSubmitted && !isNewUser && formData.basePrice > 0 && (
            <button
              onClick={handleRequestBid}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-600/20 active:scale-[0.98]"
            >
              🚀 Request to Join Auction
            </button>
          )}

          {isNewUser && (
            <div className="bg-orange-600/10 border border-orange-600/20 rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-orange-300 font-semibold">⚠️ Complete your profile first</p>
              <p className="text-slate-400 text-sm mt-2">You need to fill in your profile details before requesting to join an auction.</p>
            </div>
          )}

          {requestSubmitted && !playerRequest && (
            <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-green-300 font-semibold">✓ Your request has been sent to the admin!</p>
              <p className="text-slate-400 text-sm mt-2">You'll be notified once the admin reviews your profile.</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Profile Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Sport</p>
                <p className="text-white font-semibold">{formData.sport !== 'Unavailable' ? formData.sport.toUpperCase() : displayValue(null)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Role</p>
                <p className="text-white font-semibold">{displayValue(formData.role)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Email</p>
                <p className="text-white font-semibold text-sm break-all">{displayValue(formData.email)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-600/20 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Account Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Username</p>
                <p className="text-white font-semibold">{user?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Member Since</p>
                <p className="text-white font-semibold">{user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Status</p>
                <p className="text-green-400 font-semibold">✓ Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
