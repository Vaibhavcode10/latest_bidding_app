import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

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
  const [isEditing, setIsEditing] = useState(false);
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
        <div className="bg-yellow-100 dark:bg-yellow-600/20 border border-yellow-400 dark:border-yellow-600/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👋</span>
            <div>
              <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-300">Welcome, New Player!</h3>
              <p className="text-yellow-600 dark:text-yellow-200/80 text-sm">Please edit your profile to add your details. Click "Edit Profile" to get started.</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl ${saveMessage.type === 'success' ? 'bg-green-100 dark:bg-green-600/20 border border-green-400 dark:border-green-600/30' : 'bg-red-100 dark:bg-red-600/20 border border-red-400 dark:border-red-600/30'}`}>
          <p className={saveMessage.type === 'success' ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>{saveMessage.text}</p>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-6">
            <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-6xl font-bold">
              {formData.name && formData.name !== 'Unavailable' ? formData.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                {formData.name !== 'Unavailable' ? formData.name : <span className="text-gray-400 dark:text-slate-500 italic">Name Unavailable</span>}
              </h1>
              <p className="text-gray-600 dark:text-slate-400 text-lg mb-4">
                {displayValue(formData.role)} • {formData.sport !== 'Unavailable' ? formData.sport.toUpperCase() : 'Sport N/A'}
              </p>
              <div className="space-y-1">
                <p className="text-sm text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-500">Age:</span> {formData.age ? `${formData.age} years` : displayValue(null)}</p>
                <p className="text-sm text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-500">Height:</span> {displayValue(formData.height)}</p>
                <p className="text-sm text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-500">Weight:</span> {displayValue(formData.weight)}</p>
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
            <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl space-y-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Your Profile</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name === 'Unavailable' ? '' : formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Jersey Number</label>
                  <input
                    type="number"
                    name="jersey"
                    value={formData.jersey ?? ''}
                    onChange={handleInputChange}
                    placeholder="Enter jersey number"
                    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age ?? ''}
                    onChange={handleInputChange}
                    placeholder="Enter your age"
                    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Playing Role *</label>
                  <select
                    name="role"
                    value={formData.role === 'Unavailable' ? '' : formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Height</label>
                  <input
                    type="text"
                    name="height"
                    value={formData.height === 'Unavailable' ? '' : formData.height}
                    onChange={handleInputChange}
                    placeholder="e.g., 6.0 ft"
                    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight === 'Unavailable' ? '' : formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g., 75 kg"
                    className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Base Price (₹)</label>
                <input
                  type="number"
                  name="basePrice"
                  value={formData.basePrice || ''}
                  onChange={handleInputChange}
                  placeholder="Enter your base price"
                  className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio === 'Unavailable' ? '' : formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-white dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:bg-gray-200/50 dark:disabled:bg-slate-700/50 text-gray-800 dark:text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-8 backdrop-blur-xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">About</h3>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                  {formData.bio && formData.bio !== 'Unavailable' ? formData.bio : <span className="text-gray-400 dark:text-slate-500 italic">No bio available. Edit your profile to add a bio.</span>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl shadow-sm">
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">Jersey Number</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formData.jersey !== null ? `#${formData.jersey}` : displayValue(null)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900/50 dark:to-slate-800/50 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl shadow-sm">
                  <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">Base Price</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formData.basePrice > 0 ? `₹${formatPrice(formData.basePrice)}` : displayValue(null)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gradient-to-r dark:from-blue-600/10 dark:to-purple-600/10 border border-gray-200 dark:border-blue-600/20 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Profile Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Sport</p>
                <p className="text-gray-800 dark:text-white font-semibold">{formData.sport !== 'Unavailable' ? formData.sport.toUpperCase() : displayValue(null)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Role</p>
                <p className="text-gray-800 dark:text-white font-semibold">{displayValue(formData.role)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Email</p>
                <p className="text-gray-800 dark:text-white font-semibold text-sm break-all">{displayValue(formData.email)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gradient-to-r dark:from-green-600/10 dark:to-emerald-600/10 border border-gray-200 dark:border-green-600/20 rounded-2xl p-6 backdrop-blur-xl shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Account Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Username</p>
                <p className="text-gray-800 dark:text-white font-semibold">{user?.username || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Member Since</p>
                <p className="text-gray-800 dark:text-white font-semibold">{user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Status</p>
                <p className="text-green-600 dark:text-green-400 font-semibold">✓ Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfilePage;
