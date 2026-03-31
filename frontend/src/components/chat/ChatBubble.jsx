const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const ChatBubble = ({ message, isOwn }) => {
  const sender = message.senderId || {};
  const initial = sender.firstName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && (
          <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0 mt-1">
            {initial}
          </div>
        )}
        <div>
          {!isOwn && (
            <p className="text-xs text-gray-500 mb-1 ml-1 font-medium">
              {sender.firstName} {sender.lastName}
            </p>
          )}
          <div className={`px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-yellow-400/20 text-yellow-100 rounded-l-2xl rounded-tr-2xl'
              : 'bg-[#1a1a1a] text-gray-300 rounded-r-2xl rounded-tl-2xl border border-gray-800'
          }`}>
            {message.content}
          </div>
          <p className={`text-[10px] text-gray-600 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
            {formatTime(message.createdAt || message.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
