import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ArrowLeft, Heart, MessageCircle, Eye, Clock, Pin, Send } from 'lucide-react';
import gsap from 'gsap';

const categoryColors = {
  discussion: 'badge-blue',
  question: 'badge-green',
  announcement: 'badge-accent',
  resource: 'badge-purple',
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

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const postCardRef = useRef(null);
  const commentsRef = useRef(null);

  // GSAP entrance animation
  useEffect(() => {
    if (!loading && post && postCardRef.current) {
      gsap.fromTo(postCardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
    if (!loading && post && commentsRef.current) {
      gsap.fromTo(commentsRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.3 }
      );
    }
  }, [loading, post]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Post not found</p>
          <button
            onClick={() => navigate('/community')}
            className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const author = post.authorId || {};
  const isLiked = post.likes?.includes(user?._id);
  const initial = author.firstName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-yellow-400 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Community</span>
        </button>

        {/* Post Card */}
        <div ref={postCardRef} className="bg-[#111111] border-2 border-gray-800 rounded-2xl p-6 mb-6">
          {/* Author Info */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-sm font-bold flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">
                {author.firstName} {author.lastName}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Joined {formatDate(author.createdAt || post.createdAt)}</span>
                <span className="text-gray-700">&middot;</span>
                <Clock className="w-3 h-3" />
                <span>{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.isPinned && (
                <span className="badge badge-accent flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              <span className={`badge ${categoryColors[post.category] || 'badge-blue'}`}>
                {post.category}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-white mb-3">{post.title}</h1>

          {/* Content */}
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-6 text-sm">
            {post.content}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5 pt-4 border-t border-gray-800">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes?.length || 0} {post.likes?.length === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments?.length || 0} Comments</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              <span>{post.views || 0} Views</span>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-[#111111] border-2 border-gray-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Add a Comment</h3>
          <form onSubmit={handleComment}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="w-full px-4 py-3 bg-[#1a1a1a] border-2 border-gray-800 rounded-xl text-sm text-white placeholder-gray-600
                         focus:outline-none focus:border-yellow-400/50 transition-all resize-none mb-3"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="bg-yellow-400 text-black px-5 py-2 rounded-xl text-sm font-semibold
                           border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                           hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
                           transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4">
            Comments ({post.comments?.length || 0})
          </h3>

          {(!post.comments || post.comments.length === 0) ? (
            <div className="bg-[#111111] border-2 border-gray-800 rounded-2xl p-6 text-center">
              <MessageCircle className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            <div ref={commentsRef} className="space-y-3">
              {post.comments.map((c) => {
                const cAuthor = c.authorId || {};
                const cInitial = cAuthor.firstName?.charAt(0)?.toUpperCase() || '?';
                return (
                  <div
                    key={c._id}
                    className="bg-[#111111] border-2 border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0">
                        {cInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">
                            {cAuthor.firstName} {cAuthor.lastName}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {timeAgo(c.createdAt)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
