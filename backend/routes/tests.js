import express from 'express';
import {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  startTest,
  submitAnswer,
  submitTest,
  getAttempt,
} from '../controllers/testController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTests);
router.get('/:testId', getTest);
router.post('/', authMiddleware, createTest);
router.put('/:testId', authMiddleware, updateTest);
router.delete('/:testId', authMiddleware, deleteTest);
router.post('/start', authMiddleware, startTest);
router.post('/submit-answer', authMiddleware, submitAnswer);
router.post('/submit-test', authMiddleware, submitTest);
router.get('/attempts/:attemptId', authMiddleware, getAttempt);

export default router;
