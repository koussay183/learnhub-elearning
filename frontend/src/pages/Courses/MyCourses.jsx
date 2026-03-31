import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import { Button } from '../../components/Button.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const TABS = ['Enrolled Courses', 'Created Courses'];

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('Enrolled Courses');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(true);
  const [loadingCreated, setLoadingCreated] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchEnrolled = useCallback(async () => {
    setLoadingEnrolled(true);
    try {
      const res = await api.get('/api/courses/enrolled/list');
      setEnrolledCourses(res.data.courses || res.data || []);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load enrolled courses');
      }
    } finally {
      setLoadingEnrolled(false);
    }
  }, []);

  const fetchCreated = useCallback(async () => {
    setLoadingCreated(true);
    try {
      const res = await api.get('/api/courses/my-courses/list');
      setCreatedCourses(res.data.courses || res.data || []);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load your courses');
      }
    } finally {
      setLoadingCreated(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrolled();
    fetchCreated();
  }, [fetchEnrolled, fetchCreated]);

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    setDeleting(courseId);
    try {
      await api.delete(`/api/courses/${courseId}`);
      setCreatedCourses((prev) => prev.filter((c) => (c._id || c.course?._id) !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  const isLoading =
    activeTab === 'Enrolled Courses' ? loadingEnrolled : loadingCreated;
  const courses =
    activeTab === 'Enrolled Courses' ? enrolledCourses : createdCourses;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="text-gray-500 mt-1">
                Manage your learning journey and course creations
              </p>
            </div>
            <Link to="/courses/create">
              <Button variant="primary" className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
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

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'Enrolled Courses'
                ? "You haven't enrolled in any courses yet"
                : "You haven't created any courses yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'Enrolled Courses'
                ? 'Browse our catalog to find courses that interest you.'
                : 'Share your expertise by creating your first course.'}
            </p>
            {activeTab === 'Enrolled Courses' ? (
              <Link to="/courses">
                <Button variant="primary">Browse Courses</Button>
              </Link>
            ) : (
              <Link to="/courses/create">
                <Button variant="primary">Create Your First Course</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {courses.map((item) => {
              // Handle both direct course objects and enrollment objects
              const course = item.course || item;
              const courseProgress = item.progress || 0;
              const courseId = course._id;

              return (
                <div
                  key={courseId}
                  className="card overflow-hidden hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                        course.price === 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                        {course.level || 'Beginner'}
                      </span>
                    </div>

                    <Link to={`/courses/${courseId}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-blue-500 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Enrolled tab: progress bar + continue */}
                    {activeTab === 'Enrolled Courses' && (
                      <>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                            <span>Progress</span>
                            <span className="font-medium">{Math.round(courseProgress)}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                courseProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${courseProgress}%` }}
                            />
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <Link to={`/courses/${courseId}`}>
                            <Button variant="primary" className="w-full">
                              {courseProgress >= 100 ? 'Review Course' : 'Continue Learning'}
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}

                    {/* Created tab: stats + edit/delete */}
                    {activeTab === 'Created Courses' && (
                      <>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{course.enrollmentCount || 0} students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>{course.totalSessions || course.sessions?.length || 0} sessions</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                          <Link to={`/courses/${courseId}`} className="flex-1">
                            <Button variant="secondary" className="w-full">
                              <span className="flex items-center justify-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </span>
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="flex-1"
                            onClick={() => handleDelete(courseId)}
                            disabled={deleting === courseId}
                          >
                            {deleting === courseId ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </span>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
