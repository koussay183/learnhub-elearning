import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import { Button } from '../../components/Button.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const TABS = ['Overview', 'Sessions', 'Reviews'];

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(new Set());

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/courses/${id}`);
      const data = res.data.course || res.data;
      setCourse(data);
      setSessions(data.sessions || []);
      setReviews(data.reviews || []);
      setEnrolled(data.isEnrolled || false);
      setProgress(data.progress || 0);
      const completed = (data.completedSessions || []).map((s) => (typeof s === 'string' ? s : s._id));
      setCompletedSessions(new Set(completed));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post('/api/courses/enroll', { courseId: id });
      setEnrolled(true);
      fetchCourse();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const firstIncompleteSession = sessions.find((s) => !completedSessions.has(s._id));

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
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Not Found</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        {course.thumbnail && (
          <div className="absolute inset-0">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover opacity-20"
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Courses
          </button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-sm font-medium bg-blue-500/20 text-blue-300 rounded-full">
                  {course.level || 'Beginner'}
                </span>
                {course.category && (
                  <span className="px-3 py-1 text-sm font-medium bg-white/10 text-gray-300 rounded-full">
                    {course.category}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-gray-300 mb-6 max-w-2xl">
                {course.description?.substring(0, 200)}
                {(course.description?.length || 0) > 200 ? '...' : ''}
              </p>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold">
                  {(course.instructor?.firstName || 'I')[0]}
                </div>
                <div>
                  <p className="font-medium">
                    {course.instructor?.firstName
                      ? `${course.instructor.firstName} ${course.instructor.lastName || ''}`
                      : course.instructorName || 'Instructor'}
                  </p>
                  <p className="text-sm text-gray-400">Instructor</p>
                </div>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="w-full lg:w-80 bg-white rounded-xl shadow-lg p-6 text-gray-900">
              <div className="text-3xl font-bold mb-4 text-center">
                {course.price === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span className="text-blue-500">${course.price}</span>
                )}
              </div>

              {enrolled ? (
                <>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    to={
                      firstIncompleteSession
                        ? `/courses/${id}/sessions/${firstIncompleteSession._id}`
                        : sessions.length > 0
                        ? `/courses/${id}/sessions/${sessions[0]._id}`
                        : '#'
                    }
                  >
                    <Button variant="primary" className="w-full text-base py-3">
                      Continue Learning
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  variant="primary"
                  className="w-full text-base py-3"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? <LoadingSpinner size="sm" /> : 'Enroll Now'}
                </Button>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Sessions</span>
                  <span className="font-medium text-gray-900">{sessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Level</span>
                  <span className="font-medium text-gray-900">{course.level || 'Beginner'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Language</span>
                  <span className="font-medium text-gray-900">{course.language || 'English'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Students</span>
                  <span className="font-medium text-gray-900">{course.enrollmentCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            <div className="py-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{course.enrollmentCount || 0}</p>
              <p className="text-sm text-gray-500">Students</p>
            </div>
            <div className="py-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              <p className="text-sm text-gray-500">Sessions</p>
            </div>
            <div className="py-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{course.level || 'Beginner'}</p>
              <p className="text-sm text-gray-500">Level</p>
            </div>
            <div className="py-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{course.language || 'English'}</p>
              <p className="text-sm text-gray-500">Language</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-1 mb-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="animate-fadeIn">
            <div className="card p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this course</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {course.learningPoints && course.learningPoints.length > 0 && (
              <div className="card p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'Sessions' && (
          <div className="animate-fadeIn">
            <div className="card overflow-hidden">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No sessions available yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sessions
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((session, index) => {
                      const isCompleted = completedSessions.has(session._id);
                      const isLocked = !enrolled;
                      return (
                        <div
                          key={session._id}
                          className={`flex items-center gap-4 p-5 transition-colors ${
                            isLocked ? 'opacity-60' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Number / Status */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                              isCompleted
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {session.title}
                            </h4>
                            {session.duration && (
                              <p className="text-sm text-gray-500">{session.duration}</p>
                            )}
                          </div>

                          {/* Lock or Play */}
                          {isLocked ? (
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <Link
                              to={`/courses/${id}/sessions/${session._id}`}
                              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium flex-shrink-0"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Play
                            </Link>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'Reviews' && (
          <div className="animate-fadeIn">
            {reviews.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500">Be the first to share your experience with this course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <div key={review._id || i} className="card p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 flex-shrink-0">
                        {(review.user?.firstName || 'U')[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {review.user?.firstName
                              ? `${review.user.firstName} ${review.user.lastName || ''}`
                              : 'Anonymous'}
                          </h4>
                          {/* Star rating */}
                          {review.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }, (_, j) => (
                                <svg
                                  key={j}
                                  className={`w-4 h-4 ${
                                    j < review.rating ? 'text-yellow-400' : 'text-gray-200'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment || review.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
