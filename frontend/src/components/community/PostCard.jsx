import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Pin, Clock } from 'lucide-react';

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

const PostCard = ({ post, onLike, currentUserId }) => {
  const navigate = useNavigate();
  const author = post.authorId || {};
  const isLiked = post.likes?.includes(currentUserId);
  const initial = author.firstName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      onClick={() => navigate(`/community/${post._id}`)}
      className="card p-5 cursor-pointer group hover:shadow-brutal transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-sm font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-content">{author.firstName} {author.lastName}</p>
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <Clock className="w-3 h-3" />
            {timeAgo(post.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.isPinned && (
            <span className="badge badge-accent flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>
          )}
          <span className={`badge ${categoryColors[post.category] || 'badge-blue'}`}>
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-content group-hover:text-yellow-400 transition-colors mb-2">
        {post.title}
      </h3>
      <p className="text-content-secondary text-sm line-clamp-3 mb-4">{post.content}</p>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <button
          onClick={(e) => { e.stopPropagation(); onLike && onLike(post._id); }}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? 'text-red-400' : 'text-content-muted hover:text-red-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          {post.likes?.length || 0}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-content-muted">
          <MessageCircle className="w-4 h-4" /> {post.comments?.length || 0}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-content-muted">
          <Eye className="w-4 h-4" /> {post.views || 0}
        </span>
      </div>
    </div>
  );
};

export default PostCard;
