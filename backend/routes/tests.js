import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getTests, getTest, createTest, updateTest, deleteTest, startTest, submitAnswer, submitTest, getAttempt } from '../controllers/testController.js';

const router = Router();

// Static routes FIRST
router.get('/', getTests);
router.post('/', authMiddleware, createTest);
router.post('/start', authMiddleware, startTest);
router.post('/submit-answer', authMiddleware, submitAnswer);
router.post('/submit-test', authMiddleware, submitTest);
router.get('/attempts/:attemptId', authMiddleware, getAttempt);

// Dynamic :testId routes AFTER
router.get('/:testId', getTest);
router.put('/:testId', authMiddleware, updateTest);
router.delete('/:testId', authMiddleware, deleteTest);

export default router;
