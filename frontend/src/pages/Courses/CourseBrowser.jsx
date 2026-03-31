import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api.js';
import useAuth from '../../hooks/useAuth.js';
import { Button } from '../../components/Button.jsx';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const CATEGORIES = [
  'All Categories',
  'Development',
  'Business',
  'Design',
  'Marketing',
  'Science',
  'Language',
  'Music',
  'Other',
];

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const PRICE_OPTIONS = ['All', 'Free', 'Paid'];
const PAGE_SIZE = 9;

const CourseBrowser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    category: 'All Categories',
    level: 'All Levels',
    price: 'All',
  });

  const [enrolledIds, setEnrolledIds] = useState(new Set());

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.category !== 'All Categories') params.category = filters.category;
      if (filters.level !== 'All Levels') params.level = filters.level;
      if (filters.price === 'Free') params.price = 0;
      if (filters.price === 'Paid') params.minPrice = 1;

      const res = await api.get('/api/courses', { params });
      setCourses(res.data.courses || res.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const fetchEnrolled = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/courses/enrolled/list');
      const ids = (res.data.courses || res.data || []).map((c) => c._id || c.course?._id);
      setEnrolledIds(new Set(ids));
    } catch {
      // silently fail - user may not be logged in
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchEnrolled();
  }, [fetchEnrolled]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/api/courses/enroll`, { courseId });
      setEnrolledIds((prev) => new Set([...prev, courseId]));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Courses</h1>
          <p className="text-lg text-gray-500">
            Discover courses taught by expert instructors and level up your skills
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div className="card p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search courses..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-gray-400 transition-colors"
              />
            </div>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 bg-white transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Level */}
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 bg-white transition-colors"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>

            {/* Price */}
            <select
              value={filters.price}
              onChange={(e) => handleFilterChange('price', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 bg-white transition-colors"
            >
              {PRICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? 'All Prices' : opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : courses.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your filters or search terms to find what you're looking for.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({ search: '', category: 'All Categories', level: 'All Levels', price: 'All' });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          /* Course grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="card hover:shadow-lg transition-all duration-200 overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-blue-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Price badge */}
                    <span
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold ${
                        course.price === 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                        {course.level || 'Beginner'}
                      </span>
                      {course.category && (
                        <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          {course.category}
                        </span>
                      )}
                    </div>

                    {/* Title and description */}
                    <Link to={`/courses/${course._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1.5 hover:text-blue-500 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Instructor and stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {(course.instructor?.firstName || course.instructorName || 'I')[0]}
                        </div>
                        <span>
                          {course.instructor?.firstName
                            ? `${course.instructor.firstName} ${course.instructor.lastName || ''}`
                            : course.instructorName || 'Instructor'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{course.enrollmentCount || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-100">
                      {enrolledIds.has(course._id) ? (
                        <Link to={`/courses/${course._id}`} className="block">
                          <Button variant="secondary" className="w-full">
                            Continue Learning
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => handleEnroll(course._id)}
                        >
                          Enroll Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseBrowser;
