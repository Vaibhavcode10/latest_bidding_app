import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import '../../index.css';

interface Season {
  id: string;
  sport: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  description?: string;
  actionIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const SeasonManagement: React.FC = () => {
  const { user, userRole } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('cricket');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    description: ''
  });

  const sports = ['cricket', 'football', 'basketball', 'baseball', 'volleyball'];

  // Fetch seasons for selected sport
  useEffect(() => {
    fetchSeasons();
  }, [selectedSport]);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getSeasonsBySport(selectedSport);
      if (response.data.success) {
        setSeasons(response.data.seasons || []);
      } else {
        setError('Failed to fetch seasons');
      }
    } catch (err) {
      setError('Error fetching seasons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!formData.name || !formData.startDate || !formData.endDate) {
        setError('Please fill in all required fields');
        return;
      }

      if (editingId) {
        // Update season
        const response = await api.updateSeason(editingId, {
          ...formData,
          userRole,
          userId: user?.id
        });
        if (response.data.success) {
          setSuccessMessage('Season updated successfully');
          fetchSeasons();
        } else {
          setError('Failed to update season');
        }
      } else {
        // Create season
        const response = await api.createSeason({
          ...formData,
          sport: selectedSport,
          userRole,
          userId: user?.id
        });
        if (response.data.success) {
          setSuccessMessage('Season created successfully');
          fetchSeasons();
        } else {
          setError('Failed to create season');
        }
      }

      resetForm();
      setShowCreateModal(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Error saving season');
      console.error(err);
    }
  };

  const handleEdit = (season: Season) => {
    setFormData({
      name: season.name,
      year: season.year,
      startDate: season.startDate,
      endDate: season.endDate,
      description: season.description || ''
    });
    setEditingId(season.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (seasonId: string) => {
    if (!window.confirm('Are you sure you want to delete this season?')) return;

    try {
      const response = await api.deleteSeason(seasonId, userRole, user?.id!);
      if (response.data.success) {
        setSuccessMessage('Season deleted successfully');
        fetchSeasons();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to delete season');
      }
    } catch (err) {
      setError('Error deleting season');
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  return (
    <div className="w-full h-full p-6 overflow-auto dark:bg-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Season Management</h1>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Season
          </button>
        </div>

        {/* Sport Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {sports.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-lg capitalize ${
                selectedSport === sport
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Seasons List */}
        {loading ? (
          <div className="text-center py-8">Loading seasons...</div>
        ) : seasons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No seasons found. Create one to get started!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seasons.map(season => (
              <div
                key={season.id}
                className="p-4 border rounded-lg dark:border-gray-700 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">{season.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Year: {season.year}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs rounded">
                    {season.sport}
                  </span>
                </div>

                <div className="space-y-1 mb-4 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Start:</strong> {new Date(season.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>End:</strong> {new Date(season.endDate).toLocaleDateString()}
                  </p>
                  {season.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {season.description}
                    </p>
                  )}
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Actions:</strong> {season.actionIds.length}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(season)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(season.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Season' : 'Create New Season'}
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1">Season Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., IPL 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Year *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Optional season description"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonManagement;
