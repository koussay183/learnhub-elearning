import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: '👥', color: 'blue' },
  { key: 'totalCourses', label: 'Total Courses', icon: '📚', color: 'purple' },
  { key: 'totalEnrollments', label: 'Total Enrollments', icon: '🎓', color: 'green' },
  { key: 'totalPosts', label: 'Total Posts', icon: '💬', color: 'amber' },
];

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  green: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/admin/stats');
        setStats(data.stats || data || {});
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">Platform overview and management</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card) => {
            const colors = colorMap[card.color];
            const value = stats[card.key] ?? 0;
            const trend = stats[`${card.key}Trend`];
            return (
              <div
                key={card.key}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-2xl`}
                  >
                    {card.icon}
                  </span>
                  {trend !== undefined && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        trend >= 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {trend >= 0 ? '+' : ''}
                      {trend}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
            >
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-semibold text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500">View, edit & manage user accounts</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/moderation')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
            >
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-semibold text-gray-900">Moderate Content</p>
                <p className="text-xs text-gray-500">Review courses & community posts</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left"
            >
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-semibold text-gray-900">View Courses</p>
                <p className="text-xs text-gray-500">Browse all platform courses</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
