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
  completeSession,
} from '../controllers/courseController.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/my-courses/list', authMiddleware, getMyCourses);
router.get('/enrolled/list', authMiddleware, getEnrolledCourses);
router.get('/:id', optionalAuth, getCourseDetail);
router.post('/', authMiddleware, createCourse);
router.put('/:id', authMiddleware, updateCourse);
router.delete('/:id', authMiddleware, deleteCourse);
router.post('/enroll', authMiddleware, enrollCourse);
router.post('/checkout', authMiddleware, processCheckout);
router.delete('/enroll/:courseId', authMiddleware, unenrollCourse);
router.get('/:courseId/progress', authMiddleware, getProgress);
router.post('/:id/reviews', authMiddleware, addReview);
router.post('/:courseId/sessions', authMiddleware, createSession);
router.post('/:courseId/sessions/:sessionId/complete', authMiddleware, completeSession);

export default router;
