import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const TestBrowser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/api/tests');
        setTests(data.tests || data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Online Tests</h1>
            <p className="mt-1 text-gray-500">Browse and take available tests</p>
          </div>
          {user?.roles?.includes('instructor') || user?.roles?.includes('admin') ? (
            <button
              onClick={() => navigate('/tests/create')}
              className="mt-4 sm:mt-0 inline-flex items-center px-5 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
            >
              + Create Test
            </button>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && tests.length === 0 && (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">📝</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tests available</h3>
            <p className="text-gray-500">Check back later for new tests.</p>
          </div>
        )}

        {/* Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test._id}
              onClick={() => navigate(`/tests/${test._id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
            >
              {/* Title & Description */}
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                {test.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {test.description || 'No description provided.'}
              </p>

              {/* Creator */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {test.creator?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-gray-600">{test.creator?.name || 'Unknown'}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {test.duration && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                    ⏱ {test.duration} min
                  </span>
                )}
                {test.questions && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg">
                    ❓ {test.questions.length || test.questionCount || 0} questions
                  </span>
                )}
                {(test.totalAttempts !== undefined || test.attemptsCount !== undefined) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">
                    👥 {test.totalAttempts ?? test.attemptsCount ?? 0} attempts
                  </span>
                )}
              </div>

              {/* Scheduled time */}
              {test.scheduledStartTime && (
                <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  📅 Scheduled: {formatDate(test.scheduledStartTime)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestBrowser;
