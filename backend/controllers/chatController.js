import ChatMessage from '../models/ChatMessage.js';
import mongoose from 'mongoose';

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await ChatMessage.find({ roomId, isDeleted: false })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getRooms = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const roomIds = await ChatMessage.distinct('roomId', {
      senderId: userId,
    });

    // Always include 'general' room
    if (!roomIds.includes('general')) {
      roomIds.unshift('general');
    }

    res.json({ rooms: roomIds });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};
