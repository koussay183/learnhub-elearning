import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import ChatBubble from '../../components/chat/ChatBubble';
import MessageInput from '../../components/chat/MessageInput';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const ChatRoom = () => {
  const { user } = useAuth();
  const socket = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/api/chat/rooms');
        const roomList = data.rooms || [];
        // Ensure "general" is always in the list
        if (!roomList.includes('general')) {
          roomList.unshift('general');
        }
        setRooms(roomList);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setRooms(['general']);
      }
    };
    fetchRooms();
  }, []);

  // Fetch messages when room changes
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/chat/${activeRoom}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeRoom]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Socket events
  useEffect(() => {
    if (!socket || !user) return;

    // Join room
    socket.emit('chat:join-room', { roomId: activeRoom, userId: user._id });

    // Listen for new messages
    const handleReceiveMessage = (msg) => {
      if (msg.roomId === activeRoom) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    // Typing indicator
    const handleTyping = ({ userId, roomId }) => {
      if (roomId === activeRoom && userId !== user._id) {
        setTypingUser('Someone');
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
      }
    };

    socket.on('chat:receive-message', handleReceiveMessage);
    socket.on('chat:user-typing', handleTyping);

    return () => {
      socket.off('chat:receive-message', handleReceiveMessage);
      socket.off('chat:user-typing', handleTyping);
      socket.emit('chat:leave-room', { roomId: activeRoom, userId: user._id });
    };
  }, [socket, activeRoom, user]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (content) => {
    if (!socket || !user) return;

    socket.emit('chat:send-message', {
      roomId: activeRoom,
      content,
      userId: user._id,
    });
  };

  const handleTyping = () => {
    if (!socket || !user) return;
    socket.emit('chat:typing', { roomId: activeRoom, userId: user._id });
  };

  const switchRoom = (roomId) => {
    if (roomId === activeRoom) return;
    setActiveRoom(roomId);
    setSidebarOpen(false);
  };

  const formatRoomName = (roomId) => {
    if (roomId === 'general') return 'General';
    return roomId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-xl shadow-md border border-gray-200 text-sm"
      >
        {sidebarOpen ? 'x' : '☰'}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-40 w-72 h-full bg-white border-r border-gray-100 flex flex-col transition-transform duration-200`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Chat</h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time messaging</p>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Rooms
          </p>
          {rooms.map((roomId) => (
            <button
              key={roomId}
              onClick={() => switchRoom(roomId)}
              className={`w-full text-left px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-colors flex items-center gap-3 ${
                activeRoom === roomId
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  activeRoom === roomId ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
              <span className="truncate">{formatRoomName(roomId)}</span>
            </button>
          ))}
        </div>

        {/* Current User */}
        {user && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <h3 className="text-base font-semibold text-gray-900">
            {formatRoomName(activeRoom)}
          </h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">No messages yet</p>
                <p className="text-gray-300 text-xs">Be the first to say something!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const senderId =
                  typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                const isOwn = senderId === user?._id;
                return <ChatBubble key={msg._id || i} message={msg} isOwn={isOwn} />;
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          disabled={!socket}
          typingUser={typingUser}
        />
      </div>
    </div>
  );
};

export default ChatRoom;
