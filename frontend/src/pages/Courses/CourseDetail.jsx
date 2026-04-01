import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  ArrowLeft, BookOpen, Users, Globe, BarChart3,
  Play, FileText, CheckCircle, Lock, Star,
  Clock, LogOut, MessageSquare
} from 'lucide-react';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';

const TABS = ['Overview', 'Sessions', 'Reviews'];

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef(null);
  const contentRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(new Set());

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/courses/${id}`);
      const { course: courseData, sessions: sessionData, enrollment: enrollmentData } = res.data;
      const data = courseData || res.data;
      setCourse(data);
      setSessions(sessionData || data.sessions || []);
      setReviews(data.reviews || []);
      setEnrollment(enrollmentData || res.data.enrollment || (data.isEnrolled ? data : null));
      setProgress(enrollmentData?.progress || data.progress || 0);
      const completed = (enrollmentData?.completedSessions || data.completedSessions || []).map((s) =>
        typeof s === 'string' ? s : s._id
      );
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

  // GSAP entrance animation
  useEffect(() => {
    if (!loading && course) {
      if (heroRef.current) {
        gsap.fromTo(heroRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
      }
      if (contentRef.current) {
        gsap.fromTo(contentRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power3.out' });
      }
    }
  }, [loading, course]);

  const isEnrolled = !!(enrollment || course?.isEnrolled);

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    if (course.price > 0) return navigate(`/checkout/${course._id}`);
    try {
      setEnrolling(true);
      await api.post('/api/courses/enroll', { courseId: course._id });
      // Refresh course data to show enrolled state
      const res = await api.get(`/api/courses/${id}`);
      const { course: courseData, sessions: sessionData, enrollment: enrollmentData } = res.data;
      const refreshed = courseData || res.data;
      setCourse(refreshed);
      if (sessionData) setSessions(sessionData);
      setEnrollment(enrollmentData || (refreshed.isEnrolled ? refreshed : null));
      setProgress(enrollmentData?.progress || refreshed.progress || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm('Are you sure you want to leave this course?')) return;
    try {
      await api.delete(`/api/courses/enroll/${course._id}`);
      setEnrollment(null);
      setProgress(0);
      const res = await api.get(`/api/courses/${id}`);
      const { course: courseData, sessions: sessionData } = res.data;
      const refreshed = courseData || res.data;
      setCourse(refreshed);
      if (sessionData) setSessions(sessionData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unenroll');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      const res = await api.post(`/api/courses/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      setReviews(res.data.reviews || []);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const firstIncompleteSession = sessions.find((s) => !completedSessions.has(s._id));

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-bdr border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-400/10 rounded-2xl border-2 border-red-400/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-txt mb-2">Course Not Found</h3>
          <p className="text-txt-muted mb-4">{error}</p>
          <button onClick={() => navigate('/courses')} className="btn-secondary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <div ref={heroRef} className="relative border-b border-bdr" style={{ backgroundColor: 'var(--surface-card)' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-txt-muted hover:text-yellow-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex items-center gap-3 mb-4">
                <span className="badge badge-accent">{course.level || 'Beginner'}</span>
                {course.category && (
                  <span className="badge badge-blue">{course.category}</span>
                )}
              </div>

              <h1 className="text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>{course.title}</h1>
              <p className="text-lg mb-6 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                {course.description?.substring(0, 200)}
                {(course.description?.length || 0) > 200 ? '...' : ''}
              </p>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-sm font-bold border border-yellow-400/20">
                  {(course.instructor?.firstName || 'I')[0]}
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {course.instructor?.firstName
                      ? `${course.instructor.firstName} ${course.instructor.lastName || ''}`
                      : course.instructorName || 'Instructor'}
                  </p>
                  <p className="text-sm text-txt-muted">Instructor</p>
                </div>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="w-full lg:w-80 card p-6">
              <div className="text-3xl font-black mb-4 text-center">
                {course.price === 0 ? (
                  <span className="text-green-400">Free</span>
                ) : (
                  <span className="text-yellow-400">${course.price}</span>
                )}
              </div>

              {isEnrolled ? (
                <>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-txt-secondary">Progress</span>
                      <span className="text-yellow-400 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-bdr">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-yellow-400 to-yellow-500"
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
                    <button className="btn-primary w-full py-3 text-base mb-3">
                      <span className="flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />
                        Continue Learning
                      </span>
                    </button>
                  </Link>
                  <button
                    onClick={handleUnenroll}
                    className="btn-danger w-full py-2.5 text-sm"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Leave Course
                    </span>
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary w-full py-3 text-base"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Enrolling...
                    </span>
                  ) : course.price > 0 ? (
                    `Enroll for $${course.price}`
                  ) : (
                    'Enroll Now - Free'
                  )}
                </button>
              )}

              <div className="mt-5 pt-5 border-t border-bdr space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-txt-muted flex items-center gap-2"><BookOpen className="w-4 h-4" /> Sessions</span>
                  <span className="font-semibold text-txt">{sessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-txt-muted flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Level</span>
                  <span className="font-semibold text-txt">{course.level || 'Beginner'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-txt-muted flex items-center gap-2"><Globe className="w-4 h-4" /> Language</span>
                  <span className="font-semibold text-txt">{course.language || 'English'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-txt-muted flex items-center gap-2"><Users className="w-4 h-4" /> Students</span>
                  <span className="font-semibold text-txt">{course.enrollmentCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="border-b border-bdr">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-bdr">
            <div className="py-5 text-center">
              <p className="text-2xl font-black text-txt">{course.enrollmentCount || 0}</p>
              <p className="text-sm text-txt-muted">Students</p>
            </div>
            <div className="py-5 text-center">
              <p className="text-2xl font-black text-txt">{sessions.length}</p>
              <p className="text-sm text-txt-muted">Sessions</p>
            </div>
            <div className="py-5 text-center">
              <p className="text-2xl font-black text-yellow-400">{course.level || 'Beginner'}</p>
              <p className="text-sm text-txt-muted">Level</p>
            </div>
            <div className="py-5 text-center">
              <p className="text-2xl font-black text-txt">{course.language || 'English'}</p>
              <p className="text-sm text-txt-muted">Language</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-1 mb-8 border-b border-bdr">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab
                  ? 'text-yellow-400'
                  : 'text-txt-muted hover:text-txt-secondary'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400 rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="animate-fadeIn">
            <div className="card p-8 mb-6">
              <h2 className="text-2xl font-black text-txt mb-4">About this course</h2>
              <p className="text-txt-secondary leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {course.learningPoints && course.learningPoints.length > 0 && (
              <div className="card p-8">
                <h2 className="text-2xl font-black text-txt mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-txt-secondary">{point}</span>
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
                <div className="p-8 text-center text-txt-muted">
                  No sessions available yet.
                </div>
              ) : (
                <div className="divide-y divide-bdr">
                  {sessions
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((session, index) => {
                      const isCompleted = completedSessions.has(session._id);
                      const isLocked = !isEnrolled;
                      return (
                        <div
                          key={session._id}
                          className={`flex items-center gap-4 p-5 transition-colors ${
                            isLocked ? 'opacity-50' : 'hover:bg-surface-input'
                          }`}
                        >
                          {/* Number / Status */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold border-2 ${
                              isCompleted
                                ? 'bg-green-400/10 text-green-400 border-green-400/30'
                                : 'bg-surface text-txt-muted border-bdr'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              index + 1
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-txt truncate">
                              {session.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              {session.duration && (
                                <span className="text-xs text-txt-muted flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {session.duration}
                                </span>
                              )}
                              {session.videoUrl && (
                                <span className="text-xs text-txt-muted flex items-center gap-1">
                                  <Play className="w-3 h-3" /> Video
                                </span>
                              )}
                              {session.pdfUrl && (
                                <span className="text-xs text-txt-muted flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> PDF
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Lock or Play */}
                          {isLocked ? (
                            <Lock className="w-5 h-5 text-txt-muted flex-shrink-0" />
                          ) : (
                            <Link
                              to={`/courses/${id}/sessions/${session._id}`}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 text-sm font-semibold flex-shrink-0 transition-colors"
                            >
                              <Play className="w-4 h-4" />
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
            {/* Review Form - only for enrolled users */}
            {isEnrolled && (
              <form onSubmit={handleReviewSubmit} className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-txt mb-4">Write a Review</h3>
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }, (_, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setReviewRating(j + 1)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${j < reviewRating ? 'text-yellow-400 fill-current' : 'text-txt-muted'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-txt-muted">{reviewRating}/5</span>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this course..."
                  rows={3}
                  className="input-field resize-none mb-4"
                />
                <button type="submit" disabled={reviewSubmitting} className="btn-primary">
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {reviews.length === 0 && !isEnrolled ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface rounded-2xl border-2 border-bdr flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-txt-muted" />
                </div>
                <h3 className="text-lg font-bold text-txt mb-2">No reviews yet</h3>
                <p className="text-txt-muted">Enroll to be the first to review this course.</p>
              </div>
            ) : reviews.length === 0 ? null : (
              <div className="space-y-4">
                {reviews.map((review, i) => (
                  <div key={review._id || i} className="card p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-sm font-bold text-yellow-400 flex-shrink-0 border border-yellow-400/20">
                        {(review.user?.firstName || 'U')[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-txt">
                            {review.user?.firstName
                              ? `${review.user.firstName} ${review.user.lastName || ''}`
                              : 'Anonymous'}
                          </h4>
                          {/* Star rating */}
                          {review.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }, (_, j) => (
                                <Star
                                  key={j}
                                  className={`w-4 h-4 ${
                                    j < review.rating ? 'text-yellow-400 fill-current' : 'text-txt-muted'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-txt-secondary text-sm">{review.comment || review.text}</p>
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
