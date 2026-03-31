import express from 'express';
import { getProfile, updateProfile, searchUsers } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/:id', getProfile);
router.put('/:id', authMiddleware, updateProfile);

export default router;
