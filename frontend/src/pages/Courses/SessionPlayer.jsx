import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import { Button } from '../../components/Button.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

/**
 * Converts a video URL to an embeddable format.
 * Supports YouTube and Vimeo links.
 */
const getEmbedUrl = (url) => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
};

const SessionPlayer = () => {
  const { courseId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [slideDir, setSlideDir] = useState('');

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/courses/${courseId}`);
      const data = res.data.course || res.data;
      setCourse(data);

      const sortedSessions = (data.sessions || []).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      setSessions(sortedSessions);

      const current = sortedSessions.find((s) => s._id === sessionId) || sortedSessions[0];
      setCurrentSession(current);

      setProgress(data.progress || 0);
      const completed = (data.completedSessions || []).map((s) =>
        typeof s === 'string' ? s : s._id
      );
      setCompletedSessions(new Set(completed));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [courseId, sessionId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // When sessionId changes in URL, update the current session with slide animation
  useEffect(() => {
    if (sessions.length > 0) {
      const session = sessions.find((s) => s._id === sessionId);
      if (session) {
        setCurrentSession(session);
      }
    }
  }, [sessionId, sessions]);

  const currentIndex = sessions.findIndex((s) => s._id === currentSession?._id);
  const prevSession = currentIndex > 0 ? sessions[currentIndex - 1] : null;
  const nextSession = currentIndex < sessions.length - 1 ? sessions[currentIndex + 1] : null;

  const navigateSession = (session, direction) => {
    setSlideDir(direction === 'next' ? 'slide-left' : 'slide-right');
    setTimeout(() => {
      navigate(`/courses/${courseId}/sessions/${session._id}`);
      setSlideDir('');
    }, 200);
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/api/courses/${courseId}/sessions/${currentSession._id}/complete`);
      setCompletedSessions((prev) => new Set([...prev, currentSession._id]));

      // Recalculate progress
      const newCompleted = completedSessions.size + 1;
      const newProgress = sessions.length > 0 ? (newCompleted / sessions.length) * 100 : 0;
      setProgress(newProgress);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as complete');
    } finally {
      setCompleting(false);
    }
  };

  const embedUrl = getEmbedUrl(currentSession?.videoUrl);
  const isCurrentCompleted = completedSessions.has(currentSession?._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Progress bar at top */}
      <div className="h-1 bg-gray-800 w-full">
        <div
          className="h-full bg-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top nav */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back to Course</span>
            </button>
            <div className="hidden md:block text-sm text-gray-500">
              <span className="text-gray-300 font-medium">{course?.title}</span>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {currentIndex + 1} / {sessions.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          <div
            className={`session-content ${slideDir}`}
          >
            {/* Video Player */}
            <div className="bg-black">
              <div className="max-w-5xl mx-auto">
                {embedUrl ? (
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={embedUrl}
                      title={currentSession?.title}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : currentSession?.videoUrl ? (
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <video
                      src={currentSession.videoUrl}
                      controls
                      className="absolute inset-0 w-full h-full"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center bg-gray-800 text-gray-500"
                    style={{ paddingTop: '56.25%', position: 'relative' }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p>No video available for this session</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-gray-900 px-6 py-6">
              <div className="max-w-5xl mx-auto">
                {error && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {currentSession?.title}
                    </h2>
                    {currentSession?.description && (
                      <p className="text-gray-400 mt-2">{currentSession.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {currentSession?.pdfUrl && (
                      <a
                        href={currentSession.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View PDF
                      </a>
                    )}

                    {isCurrentCompleted ? (
                      <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/30 text-green-400 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={handleMarkComplete}
                        disabled={completing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {completing ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark as Complete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Previous / Next buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  {prevSession ? (
                    <button
                      onClick={() => navigateSession(prevSession, 'prev')}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">Previous</p>
                        <p className="font-medium">{prevSession.title}</p>
                      </div>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextSession ? (
                    <button
                      onClick={() => navigateSession(nextSession, 'next')}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm text-right"
                    >
                      <div>
                        <p className="text-xs text-gray-500">Next</p>
                        <p className="font-medium">{nextSession.title}</p>
                      </div>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Session List */}
        <div className="w-full lg:w-80 bg-gray-850 border-t lg:border-t-0 lg:border-l border-gray-800 overflow-y-auto"
          style={{ background: '#1a1d23' }}
        >
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Course Content
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {completedSessions.size} of {sessions.length} completed
            </p>
          </div>

          <div className="divide-y divide-gray-800/50">
            {sessions.map((session, index) => {
              const isActive = session._id === currentSession?._id;
              const isCompleted = completedSessions.has(session._id);
              return (
                <button
                  key={session._id}
                  onClick={() => {
                    const dir = index > currentIndex ? 'next' : 'prev';
                    navigateSession(session, dir);
                  }}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-800/50 border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Status indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                      isCompleted
                        ? 'bg-green-500/20 text-green-400'
                        : isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {session.title}
                    </p>
                    {session.duration && (
                      <p className="text-xs text-gray-500 mt-0.5">{session.duration}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPlayer;
