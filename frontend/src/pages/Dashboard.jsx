import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import useAuthStore from '../context/authStore.js';
import api from '../utils/api.js';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [enrolledRes, createdRes, postsRes] = await Promise.allSettled([
          api.get('/api/courses/enrolled/list'),
          api.get('/api/courses/my-courses/list'),
          api.get('/api/community/posts?limit=5'),
        ]);

        if (enrolledRes.status === 'fulfilled') setEnrolledCourses(enrolledRes.value.data);
        if (createdRes.status === 'fulfilled') setCreatedCourses(createdRes.value.data);
        if (postsRes.status === 'fulfilled') setRecentPosts(postsRes.value.data.posts || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeCourses = enrolledCourses.filter(c => c.status === 'active');
  const completedCourses = enrolledCourses.filter(c => c.status === 'completed');

  return (
    <div className="animate-fadeIn">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your learning journey.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📚</span>
            <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded">Enrolled</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{enrolledCourses.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Courses</p>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🔄</span>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Active</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeCourses.length}</p>
          <p className="text-sm text-gray-500 mt-1">In Progress</p>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✅</span>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Done</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completedCourses.length}</p>
          <p className="text-sm text-gray-500 mt-1">Completed</p>
        </div>

        <div className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🎓</span>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Teaching</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{createdCourses.length}</p>
          <p className="text-sm text-gray-500 mt-1">Courses Created</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue learning */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
              <Link to="/courses/my" className="text-sm text-blue-500 hover:text-blue-600">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activeCourses.length > 0 ? (
              <div className="space-y-4">
                {activeCourses.slice(0, 4).map(course => (
                  <div
                    key={course._id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
                        📖
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{course.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${course.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">{course.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-gray-500 mb-4">No courses yet. Start learning today!</p>
                <button
                  onClick={() => navigate('/courses')}
                  className="btn-primary"
                >
                  Browse Courses
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions + recent posts */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/courses')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 text-left transition-colors"
              >
                <span className="text-xl">🔍</span>
                <span className="font-medium text-gray-700">Browse Courses</span>
              </button>
              <button
                onClick={() => navigate('/courses/create')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 text-left transition-colors"
              >
                <span className="text-xl">➕</span>
                <span className="font-medium text-gray-700">Create Course</span>
              </button>
              <button
                onClick={() => navigate('/community')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 text-left transition-colors"
              >
                <span className="text-xl">💬</span>
                <span className="font-medium text-gray-700">Community Feed</span>
              </button>
              <button
                onClick={() => navigate('/tests')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-50 text-left transition-colors"
              >
                <span className="text-xl">📝</span>
                <span className="font-medium text-gray-700">Take a Test</span>
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 text-left transition-colors"
              >
                <span className="text-xl">✉️</span>
                <span className="font-medium text-gray-700">Chat</span>
              </button>
            </div>
          </div>

          {/* Recent community activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Community</h2>
              <Link to="/community" className="text-sm text-blue-500 hover:text-blue-600">
                View all
              </Link>
            </div>
            {recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.slice(0, 3).map(post => (
                  <div
                    key={post._id}
                    className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/community/${post._id}`)}
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{post.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.likes?.length || 0} likes · {post.comments?.length || 0} comments
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No posts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
