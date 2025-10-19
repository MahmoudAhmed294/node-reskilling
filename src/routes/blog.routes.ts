import express from 'express';
import { withSecurity } from '../middlewares/auth.middleware';
import { checkBlogOwnership } from '../middlewares/blogOwnership.middleware';
import { createBlog, deleteBlog, getBlogs, updateBlog } from '../controllers/blog.controller';
import { validateRequest } from '../middlewares/validateRequest.middleware';
import { updateBlogValidations, getBlogsValidations, deleteBlogValidations } from '../middlewares/blogValidations.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog title
 *               content:
 *                 type: string
 *                 description: Blog content
 *               category:
 *                 type: string
 *                 description: Blog category (optional)
 *     responses:
 *       201:
 *         description: Blog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 blog:
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Title and content are required
 *       401:
 *         description: User not withSecurityd
 *       500:
 *         description: Error creating blog
 */
router.post('/', withSecurity, createBlog);

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all blog posts with pagination and search
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter blogs by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of blogs per page (default 10, max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search blogs by title or content (case-insensitive)
 *     responses:
 *       200:
 *         description: List of blogs with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blogs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Error fetching blogs
 */
router.get('/', withSecurity, getBlogsValidations, validateRequest, getBlogs);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Blog title
 *               content:
 *                 type: string
 *                 description: Blog content
 *               category:
 *                 type: string
 *                 description: Blog category
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updated:
 *                   $ref: '#/components/schemas/Blog'
 *       403:
 *         description: Not authorized to edit this blog
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Error updating blog
 */
router.put('/:id', withSecurity, checkBlogOwnership, updateBlogValidations, validateRequest, updateBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Not authorized to delete this blog
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Error deleting blog
 */
router.delete('/:id', withSecurity, checkBlogOwnership, deleteBlogValidations, validateRequest, deleteBlog);

export default router;
