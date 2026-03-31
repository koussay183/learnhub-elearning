import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, HelpCircle, Users, Calendar, Plus, FileQuestion, Lock, Timer } from 'lucide-react';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';

// Returns 'upcoming', 'open', or 'closed' based on scheduled times
const getTestStatus = (test) => {
  const now = new Date();
  const start = test.settings?.scheduledStartTime ? new Date(test.settings.scheduledStartTime) : null;
  const end = test.settings?.scheduledEndTime ? new Date(test.settings.scheduledEndTime) : null;

  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'closed';
  return 'open';
};

// Format a countdown from milliseconds
const formatCountdown = (ms) => {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const TestBrowser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cardsRef = useRef([]);
  const [now, setNow] = useState(new Date());

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

  // Tick every second for live countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
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
            <h1 className="text-3xl font-black text-txt">Online Tests</h1>
            <p className="mt-1 text-txt-muted">Browse and take available tests</p>
          </div>
          {user ? (
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
            <div className="w-16 h-16 bg-surface-card border-2 border-bdr rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-txt-muted" />
            </div>
            <h3 className="text-xl font-bold text-txt mb-2">No tests available</h3>
            <p className="text-txt-muted">Check back later for new tests.</p>
          </div>
        )}

        {/* Test Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test, index) => {
            const status = getTestStatus(test);
            const isClosed = status === 'closed';
            const isUpcoming = status === 'upcoming';
            const startTime = test.settings?.scheduledStartTime ? new Date(test.settings.scheduledStartTime) : null;
            const endTime = test.settings?.scheduledEndTime ? new Date(test.settings.scheduledEndTime) : null;
            const countdownMs = isUpcoming && startTime ? startTime.getTime() - now.getTime() : 0;

            return (
              <div
                key={test._id}
                ref={(el) => (cardsRef.current[index] = el)}
                onClick={() => !isClosed && navigate(`/tests/${test._id}/take`)}
                style={{ opacity: 0 }}
                className={`bg-surface-card border-2 rounded-2xl p-6 transition-all group relative ${
                  isClosed
                    ? 'border-bdr opacity-60 cursor-not-allowed'
                    : 'border-bdr hover:border-yellow-400/30 cursor-pointer'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  {status === 'open' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-400/10 text-green-400 border border-green-400/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Open Now
                    </span>
                  )}
                  {status === 'upcoming' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-400/10 text-blue-400 border border-blue-400/20">
                      <Timer className="w-3 h-3" />
                      Upcoming
                    </span>
                  )}
                  {status === 'closed' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-400/10 text-red-400 border border-red-400/20">
                      <Lock className="w-3 h-3" />
                      Closed
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className={`text-lg font-bold transition-colors mb-2 line-clamp-1 ${
                  isClosed ? 'text-txt-muted' : 'text-txt group-hover:text-yellow-400'
                }`}>
                  {test.title}
                </h3>
                <p className="text-txt-muted text-sm mb-4 line-clamp-2">
                  {test.description || 'No description provided.'}
                </p>

                {/* Creator */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-yellow-400/10 flex items-center justify-center text-xs font-bold text-yellow-400">
                    {test.createdBy?.firstName?.charAt(0)?.toUpperCase() || test.creator?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-sm text-txt-secondary">{test.createdBy?.firstName ? `${test.createdBy.firstName} ${test.createdBy.lastName || ''}` : test.creator?.name || 'Unknown'}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(test.settings?.duration || test.duration) && (
                    <span className="badge badge-accent inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {test.settings?.duration || test.duration} min
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

                {/* Schedule Time Window */}
                {(startTime || endTime) && (
                  <div className="space-y-1.5 pt-3 border-t border-bdr">
                    {startTime && (
                      <div className="flex items-center gap-2 text-xs text-txt-secondary">
                        <Calendar className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span>Opens: {formatDate(test.settings.scheduledStartTime)}</span>
                      </div>
                    )}
                    {endTime && (
                      <div className="flex items-center gap-2 text-xs text-txt-secondary">
                        <Calendar className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span>Closes: {formatDate(test.settings.scheduledEndTime)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Countdown for upcoming tests */}
                {isUpcoming && countdownMs > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-blue-400/5 border border-blue-400/20 text-center">
                    <span className="text-xs text-blue-400 font-semibold">Opens in </span>
                    <span className="text-sm text-blue-400 font-mono font-bold">
                      {formatCountdown(countdownMs)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestBrowser;
