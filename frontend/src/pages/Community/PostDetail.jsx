import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const categoryColors = {
  discussion: 'bg-blue-100 text-blue-700',
  question: 'bg-green-100 text-green-700',
  announcement: 'bg-yellow-100 text-yellow-700',
  resource: 'bg-purple-100 text-purple-700',
};

const categoryLabels = {
  discussion: 'Discussion',
  question: 'Question',
  announcement: 'Announcement',
  resource: 'Resource',
};

const timeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get('/api/community/posts', {
          params: { page: 1, limit: 1 },
        });
        // The API returns a list; find the target post by ID
        // If a dedicated endpoint exists, use it. Otherwise fetch all and filter.
        const allData = await api.get('/api/community/posts', { params: { limit: 100 } });
        const found = allData.data.posts.find((p) => p._id === postId);
        if (found) {
          setPost(found);
        }
      } catch (err) {
        console.error('Failed to fetch post:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    try {
      await api.post(`/api/community/posts/${postId}/like`);
      setPost((prev) => {
        if (!prev) return prev;
        const alreadyLiked = prev.likes?.includes(user?._id);
        return {
          ...prev,
          likes: alreadyLiked
            ? prev.likes.filter((id) => id !== user?._id)
            : [...(prev.likes || []), user?._id],
        };
      });
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/api/community/posts/${postId}/comments`, {
        content: comment,
      });
      setPost(data.post);
      setComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Post not found</p>
          <button
            onClick={() => navigate('/community')}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const author = post.authorId || {};
  const isLiked = post.likes?.includes(user?._id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <span>&larr;</span>
          <span>Back to Community</span>
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          {/* Author Info */}
          <div className="flex items-start gap-4 mb-5">
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={`${author.firstName} ${author.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {getInitials(author.firstName, author.lastName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">
                {author.firstName} {author.lastName}
              </p>
              <p className="text-xs text-gray-400">
                Joined {formatDate(author.createdAt || post.createdAt)}
                {' '}&middot;{' '}
                {timeAgo(post.createdAt)}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                categoryColors[post.category] || categoryColors.discussion
              }`}
            >
              {categoryLabels[post.category] || 'Discussion'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h1>

          {/* Content */}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
            {post.content}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <span className="text-base">{isLiked ? '❤️' : '🤍'}</span>
              <span>{post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-base">💬</span>
              <span>{post.comments?.length || 0} Comments</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-base">👁️</span>
              <span>{post.views || 0} Views</span>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add a Comment</h3>
          <form onSubmit={handleComment}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Comments ({post.comments?.length || 0})
          </h3>

          {(!post.comments || post.comments.length === 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            post.comments.map((c) => {
              const cAuthor = c.authorId || {};
              return (
                <div
                  key={c._id}
                  className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {cAuthor.avatar ? (
                      <img
                        src={cAuthor.avatar}
                        alt={`${cAuthor.firstName} ${cAuthor.lastName}`}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {getInitials(cAuthor.firstName, cAuthor.lastName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {cAuthor.firstName} {cAuthor.lastName}
                        </p>
                        <span className="text-xs text-gray-400">
                          {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
