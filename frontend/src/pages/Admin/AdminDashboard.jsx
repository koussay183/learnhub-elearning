import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, GraduationCap, MessageSquare, UserCog, Shield, Library, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../utils/api.js';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'yellow' },
  { key: 'totalCourses', label: 'Total Courses', icon: BookOpen, color: 'purple' },
  { key: 'totalEnrollments', label: 'Total Enrollments', icon: GraduationCap, color: 'green' },
  { key: 'totalPosts', label: 'Total Posts', icon: MessageSquare, color: 'blue' },
];

const colorMap = {
  yellow: { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/20' },
  purple: { bg: 'bg-purple-400/10', text: 'text-purple-400', border: 'border-purple-400/20' },
  green: { bg: 'bg-green-400/10', text: 'text-green-400', border: 'border-green-400/20' },
  blue: { bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/20' },
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500">Platform overview and management</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card) => {
            const colors = colorMap[card.color];
            const value = stats[card.key] ?? 0;
            const trend = stats[`${card.key}Trend`];
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className="bg-[#111111] border-2 border-gray-800 rounded-2xl p-6 hover:border-yellow-400/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  {trend !== undefined && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                        trend >= 0
                          ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}
                    >
                      {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trend >= 0 ? '+' : ''}
                      {trend}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-black text-white">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#111111] border-2 border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-800 hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-yellow-400 transition-colors">Manage Users</p>
                <p className="text-xs text-gray-500">View, edit & manage user accounts</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/moderation')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-800 hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-yellow-400 transition-colors">Moderate Content</p>
                <p className="text-xs text-gray-500">Review courses & community posts</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-800 hover:border-yellow-400/30 hover:bg-yellow-400/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                <Library className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-white group-hover:text-yellow-400 transition-colors">View Courses</p>
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
