import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createBlog, deleteBlog, getBlogs, updateBlog } from '../controllers/blog.controller';

const router = express.Router();

router.post('/', authenticate, createBlog);
router.get('/', authenticate, getBlogs);
router.put('/:id', authenticate, updateBlog);
router.delete('/:id', authenticate, deleteBlog);

export default router;
