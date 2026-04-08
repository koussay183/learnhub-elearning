import express from 'express';
import {
  getCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  getEnrolledCourses,
  getProgress,
  getMyCourses,
  processCheckout,
  addReview,
  createSession,
  updateSession,
  deleteSession,
  completeSession,
} from '../controllers/courseController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { validateCourse, validateReview } from '../middleware/validate.js';
import { getCourseTests } from '../controllers/testController.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/my-courses/list', authMiddleware, getMyCourses);
router.get('/enrolled/list', authMiddleware, getEnrolledCourses);
router.get('/:courseId/tests', optionalAuth, getCourseTests);
router.get('/:id', optionalAuth, getCourseDetail);
router.post('/', authMiddleware, validateCourse, createCourse);
router.put('/:id', authMiddleware, validateCourse, updateCourse);
router.delete('/:id', authMiddleware, deleteCourse);
router.post('/enroll', authMiddleware, enrollCourse);
router.post('/checkout', authMiddleware, processCheckout);
router.delete('/enroll/:courseId', authMiddleware, unenrollCourse);
router.get('/:courseId/progress', authMiddleware, getProgress);
router.post('/:id/reviews', authMiddleware, validateReview, addReview);
router.post('/:courseId/sessions', authMiddleware, createSession);
router.put('/:courseId/sessions/:sessionId', authMiddleware, updateSession);
router.delete('/:courseId/sessions/:sessionId', authMiddleware, deleteSession);
router.post('/:courseId/sessions/:sessionId/complete', authMiddleware, completeSession);

export default router;
