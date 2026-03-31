import { useNavigate } from 'react-router-dom';

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

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const PostCard = ({ post, onLike, currentUserId }) => {
  const navigate = useNavigate();

  const author = post.authorId || {};
  const initials = getInitials(author.firstName, author.lastName);
  const isLiked = post.likes?.includes(currentUserId);

  const handleClick = () => {
    navigate(`/community/${post._id}`);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (onLike) onLike(post._id);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      {/* Author Row */}
      <div className="flex items-center gap-3 mb-3">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={`${author.firstName} ${author.lastName}`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {author.firstName} {author.lastName}
          </p>
          <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
        </div>
        {post.isPinned && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            Pinned
          </span>
        )}
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            categoryColors[post.category] || categoryColors.discussion
          }`}
        >
          {categoryLabels[post.category] || 'Discussion'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-1">
        {post.title}
      </h3>

      {/* Content Preview */}
      <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
        {post.content}
      </p>

      {/* Bottom Row */}
      <div className="flex items-center gap-5 text-sm text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${
            isLiked ? 'text-red-500' : ''
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>{post.likes?.length || 0}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span>💬</span>
          <span>{post.comments?.length || 0}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span>👁️</span>
          <span>{post.views || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
