import express from 'express';
import { body } from 'express-validator';
import { signup, signin } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validateRequest.middleware';

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .matches(/[A-Za-z]/)
      .matches(/\d/)
      .withMessage('Password must include letters and numbers'),
  ],
  validateRequest,
  signup
);

router.post(
  '/signin',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  signin
);

export default router;
