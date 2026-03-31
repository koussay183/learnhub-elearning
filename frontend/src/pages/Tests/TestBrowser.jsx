import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, HelpCircle, Users, Calendar, Plus, FileQuestion, Search } from 'lucide-react';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';

const TestBrowser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cardsRef = useRef([]);

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

  // GSAP stagger animation
  useEffect(() => {
    if (!loading && tests.length > 0 && cardsRef.current.length > 0) {
      const loadGsap = async () => {
        try {
          const gsap = (await import('gsap')).default || (await import('gsap')).gsap;
          gsap.fromTo(
            cardsRef.current.filter(Boolean),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
          );
        } catch {
          // GSAP not available, cards will show normally
          cardsRef.current.forEach((el) => {
            if (el) el.style.opacity = '1';
          });
        }
      };
      loadGsap();
    }
  }, [loading, tests]);

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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-content">Online Tests</h1>
            <p className="mt-1 text-content-muted">Browse and take available tests</p>
          </div>
          {user?.roles?.includes('instructor') || user?.roles?.includes('admin') ? (
            <button
              onClick={() => navigate('/tests/create')}
              className="btn-primary mt-4 sm:mt-0 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Test
            </button>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!error && tests.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-surface-card border-2 border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-content-muted" />
            </div>
            <h3 className="text-xl font-bold text-content mb-2">No tests available</h3>
            <p className="text-content-muted">Check back later for new tests.</p>
          </div>
        )}

        {/* Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test, index) => (
            <div
              key={test._id}
              ref={(el) => (cardsRef.current[index] = el)}
              onClick={() => navigate(`/tests/${test._id}/take`)}
              style={{ opacity: 0 }}
              className="bg-surface-card border-2 border-border rounded-2xl p-6 hover:border-yellow-400/30 transition-all cursor-pointer group"
            >
              {/* Title & Description */}
              <h3 className="text-lg font-bold text-content group-hover:text-yellow-400 transition-colors mb-2 line-clamp-1">
                {test.title}
              </h3>
              <p className="text-content-muted text-sm mb-4 line-clamp-2">
                {test.description || 'No description provided.'}
              </p>

              {/* Creator */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-yellow-400/10 flex items-center justify-center text-xs font-bold text-yellow-400">
                  {test.createdBy?.firstName?.charAt(0)?.toUpperCase() || test.creator?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-sm text-content-secondary">{test.createdBy?.firstName ? `${test.createdBy.firstName} ${test.createdBy.lastName || ''}` : test.creator?.name || 'Unknown'}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {test.duration && (
                  <span className="badge badge-accent inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {test.duration} min
                  </span>
                )}
                {test.questions && (
                  <span className="badge badge-purple inline-flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> {test.questions.length || test.questionCount || 0} questions
                  </span>
                )}
                {(test.totalAttempts !== undefined || test.attemptsCount !== undefined) && (
                  <span className="badge badge-green inline-flex items-center gap-1">
                    <Users className="w-3 h-3" /> {test.totalAttempts ?? test.attemptsCount ?? 0} attempts
                  </span>
                )}
              </div>

              {/* Scheduled time */}
              {test.scheduledStartTime && (
                <div className="flex items-center gap-2 text-xs badge badge-accent">
                  <Calendar className="w-3 h-3" /> Scheduled: {formatDate(test.scheduledStartTime)}
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
