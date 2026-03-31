import express from 'express';
import {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  completeSession,
} from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.get('/', getSessions);
router.get('/:sessionId', getSession);
router.post('/', authMiddleware, createSession);
router.put('/:sessionId', authMiddleware, updateSession);
router.delete('/:sessionId', authMiddleware, deleteSession);
router.post('/:sessionId/complete', authMiddleware, completeSession);

export default router;
