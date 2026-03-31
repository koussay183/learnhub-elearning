const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const ChatBubble = ({ message, isOwn }) => {
  const sender = message.senderId || {};

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (only for others) */}
        {!isOwn && (
          <p className="text-xs text-gray-400 mb-1 ml-1 font-medium">
            {sender.firstName} {sender.lastName}
          </p>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl'
              : 'bg-gray-100 text-gray-900 rounded-r-2xl rounded-tl-2xl'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <p
          className={`text-xs text-gray-400 mt-1 ${
            isOwn ? 'text-right mr-1' : 'ml-1'
          }`}
        >
          {formatTime(message.createdAt || message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
