import express from 'express';
import {
  getCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getEnrolledCourses,
  getProgress,
  getMyCourses,
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
router.get('/:courseId/progress', authMiddleware, getProgress);

export default router;
