import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before, limit = 50 } = req.query;

    const query = { roomId, isDeleted: { $ne: true } };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await ChatMessage.find(query)
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRooms = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Get all rooms this user has sent messages in
    const roomIds = await ChatMessage.distinct('roomId', { senderId: userId });

    // Also find DM rooms where the user received messages
    const dmPattern = new RegExp(req.userId);
    const dmRoomIds = await ChatMessage.distinct('roomId', { roomId: dmPattern });

    // Merge and dedupe
    const allRooms = [...new Set([...roomIds, ...dmRoomIds])];

    // Always include general room
    if (!allRooms.includes('general')) allRooms.unshift('general');

    // Build room info
    const rooms = await Promise.all(allRooms.map(async (roomId) => {
      const lastMessage = await ChatMessage.findOne({ roomId })
        .populate('senderId', 'firstName lastName')
        .sort({ createdAt: -1 });

      const unread = await ChatMessage.countDocuments({
        roomId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
        createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      // For DM rooms, get the other user's info
      let roomName = roomId;
      let roomAvatar = null;
      let isDM = false;

      if (roomId.includes('_dm_')) {
        isDM = true;
        const userIds = roomId.split('_dm_');
        const otherUserId = userIds.find(id => id !== req.userId);
        if (otherUserId) {
          const otherUser = await User.findById(otherUserId).select('firstName lastName avatar');
          if (otherUser) {
            roomName = `${otherUser.firstName} ${otherUser.lastName}`;
            roomAvatar = otherUser.avatar;
          }
        }
      }

      return {
        roomId,
        roomName,
        roomAvatar,
        isDM,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          sender: lastMessage.senderId ? `${lastMessage.senderId.firstName}` : 'Unknown',
          time: lastMessage.createdAt,
        } : null,
        unread,
      };
    }));

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('firstName lastName avatar email roles')
      .sort({ firstName: 1 })
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
