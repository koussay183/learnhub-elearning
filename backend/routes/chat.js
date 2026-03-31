import express from 'express';
import { getMessages, getRooms } from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/chat/rooms - get rooms user has participated in
router.get('/rooms', authMiddleware, getRooms);

// GET /api/chat/:roomId/messages - get last 50 messages for a room
router.get('/:roomId/messages', authMiddleware, getMessages);

export default router;
