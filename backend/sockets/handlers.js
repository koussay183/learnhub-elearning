import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

const activeUsers = new Map(); // userId -> { socketId, roomId }
const testRooms = new Map(); // testId -> { participants, startTime, duration }

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.id}`);

    // CHAT EVENTS
    socket.on('chat:join-room', async (data) => {
      const { roomId, userId } = data;
      socket.join(roomId);
      activeUsers.set(userId, { socketId: socket.id, roomId });

      io.to(roomId).emit('chat:user-online', { userId, status: 'online' });
    });

    socket.on('chat:send-message', async (data) => {
      try {
        const { roomId, content, attachmentUrl } = data;

        const message = new ChatMessage({
          senderId: data.userId,
          roomId,
          content,
          attachmentUrl,
        });

        await message.save();
        const populated = await message.populate('senderId', 'firstName lastName avatar');

        io.to(roomId).emit('chat:receive-message', {
          _id: populated._id,
          senderId: populated.senderId,
          content,
          attachmentUrl,
          timestamp: populated.createdAt,
          roomId,
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('chat:typing', (data) => {
      const { roomId, userId } = data;
      io.to(roomId).emit('chat:user-typing', { userId, roomId });
    });

    socket.on('chat:leave-room', (data) => {
      const { roomId, userId } = data;
      socket.leave(roomId);
      activeUsers.delete(userId);
      io.to(roomId).emit('chat:user-offline', { userId, status: 'offline' });
    });

    // TEST ROOM EVENTS
    socket.on('test:join-room', (data) => {
      const { testId, userId } = data;
      const roomId = `test-${testId}`;
      socket.join(roomId);

      if (!testRooms.has(testId)) {
        testRooms.set(testId, {
          participants: [],
          startTime: new Date(),
          duration: data.duration,
        });
      }

      const room = testRooms.get(testId);
      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
      }

      io.to(roomId).emit('test:participant-joined', {
        userId,
        count: room.participants.length,
      });
    });

    socket.on('test:timer-sync-request', (data) => {
      const { testId, userId } = data;
      const roomId = `test-${testId}`;
      const room = testRooms.get(testId);

      if (room) {
        const elapsed = Date.now() - room.startTime.getTime();
        const remaining = Math.max(0, room.duration * 60 * 1000 - elapsed);

        socket.emit('test:timer-sync', {
          timeRemaining: remaining,
          serverTime: Date.now(),
        });
      }
    });

    socket.on('test:submit-answer', async (data) => {
      const { testId, questionId, answer, userId } = data;
      const roomId = `test-${testId}`;

      io.to(roomId).emit('test:answer-received', {
        userId,
        questionId,
        ack: true,
      });
    });

    socket.on('test:reconnect', (data) => {
      const { testId, userId, sessionId } = data;
      const roomId = `test-${testId}`;
      socket.join(roomId);

      socket.emit('test:reconnect-ack', {
        sessionId,
        serverTime: Date.now(),
      });

      io.to(roomId).emit('test:user-reconnected', { userId });
    });

    socket.on('test:leave-room', (data) => {
      const { testId, userId } = data;
      const roomId = `test-${testId}`;
      socket.leave(roomId);

      const room = testRooms.get(testId);
      if (room) {
        room.participants = room.participants.filter(id => id !== userId);
        if (room.participants.length === 0) {
          testRooms.delete(testId);
        }
      }

      io.to(roomId).emit('test:participant-left', { userId });
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      activeUsers.forEach((user, userId) => {
        if (user.socketId === socket.id) {
          activeUsers.delete(userId);
        }
      });
      console.log(`✓ User disconnected: ${socket.id}`);
    });
  });

  // Emit timer sync every 5 seconds to all test rooms
  setInterval(() => {
    testRooms.forEach((room, testId) => {
      const roomId = `test-${testId}`;
      const elapsed = Date.now() - room.startTime.getTime();
      const remaining = Math.max(0, room.duration * 60 * 1000 - elapsed);

      io.to(roomId).emit('test:timer-sync', {
        timeRemaining: remaining,
        serverTime: Date.now(),
      });

      if (remaining === 0) {
        io.to(roomId).emit('test:test-ended', { testId, message: 'Time is up' });
        testRooms.delete(testId);
      }
    });
  }, 5000);
};
