import { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        if (activeTab === 'courses') {
          const { data } = await api.get('/api/admin/courses');
          setCourses(data.courses || data.data || []);
        } else {
          const { data } = await api.get('/api/admin/moderation');
          setPosts(data.posts || data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const approveCourse = async (courseId) => {
    try {
      await api.put(`/api/admin/courses/${courseId}/approve`);
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, status: 'published' } : c))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve course');
    }
  };

  const rejectCourse = async (courseId) => {
    try {
      await api.put(`/api/admin/courses/${courseId}/approve`, { status: 'rejected' });
      setCourses((prev) =>
        prev.map((c) => (c._id === courseId ? { ...c, status: 'rejected' } : c))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject course');
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/api/admin/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const removePost = async (postId) => {
    if (!window.confirm('Are you sure you want to remove this post?')) return;
    try {
      await api.delete(`/api/admin/moderation/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove post');
    }
  };

  const statusBadge = (status) => {
    const map = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="mt-1 text-gray-500">Review and moderate platform content</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              x
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'courses'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📚 Courses
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Community Posts
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : activeTab === 'courses' ? (
            /* Courses Tab */
            courses.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl block mb-3">📚</span>
                <p className="text-gray-500">No courses to moderate.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courses.map((course) => (
                      <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{course.title}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {course.instructor?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusBadge(
                              course.status
                            )}`}
                          >
                            {course.status || 'draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(course.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {course.status !== 'published' && (
                              <button
                                onClick={() => approveCourse(course._id)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {course.status !== 'rejected' && (
                              <button
                                onClick={() => rejectCourse(course._id)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => deleteCourse(course._id)}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : /* Posts Tab */
          posts.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-4xl block mb-3">💬</span>
              <p className="text-gray-500">No posts to moderate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 line-clamp-1">
                          {post.title || post.content?.substring(0, 50) || 'Untitled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {post.author?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                          {post.category || 'general'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => removePost(post._id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentModeration;
