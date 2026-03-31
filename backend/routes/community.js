import express from 'express';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
} from '../controllers/communityController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/posts', getPosts);
router.post('/posts', authMiddleware, createPost);
router.put('/posts/:postId', authMiddleware, updatePost);
router.delete('/posts/:postId', authMiddleware, deletePost);
router.post('/posts/:postId/like', authMiddleware, likePost);
router.post('/posts/:postId/comments', authMiddleware, addComment);
router.delete('/posts/:postId/comments/:commentId', authMiddleware, deleteComment);

export default router;
