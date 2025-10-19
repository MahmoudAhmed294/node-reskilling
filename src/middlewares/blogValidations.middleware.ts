import { body, param, query } from 'express-validator';

export const createBlogValidations = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').optional().isString().withMessage('Category must be a string'),
];

export const updateBlogValidations = [
  param('id').isMongoId().withMessage('Invalid blog ID'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('category').optional().isString().withMessage('Category must be a string'),
];

export const getBlogsValidations = [
  query('category').optional().isString().withMessage('Category must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
];

export const deleteBlogValidations = [
  param('id').isMongoId().withMessage('Invalid blog ID'),
];