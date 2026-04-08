import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateTest } from '../middleware/validate.js';
import { getTests, getTest, createTest, updateTest, deleteTest, startTest, submitAnswer, submitTest, getAttempt, getMyTests, getTestAttempts } from '../controllers/testController.js';

const router = Router();

// Static routes FIRST
router.get('/', getTests);
router.get('/my', authMiddleware, getMyTests);
router.post('/', authMiddleware, validateTest, createTest);
router.post('/start', authMiddleware, startTest);
router.post('/submit-answer', authMiddleware, submitAnswer);
router.post('/submit-test', authMiddleware, submitTest);
router.get('/attempts/:attemptId', authMiddleware, getAttempt);

// Dynamic :testId routes AFTER
router.get('/:testId', getTest);
router.get('/:testId/attempts', authMiddleware, getTestAttempts);
router.put('/:testId', authMiddleware, updateTest);
router.delete('/:testId', authMiddleware, deleteTest);

export default router;
