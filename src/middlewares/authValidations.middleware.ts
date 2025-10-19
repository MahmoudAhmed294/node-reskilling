import { body } from 'express-validator';

export const signupValidations = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Za-z]/)
    .matches(/\d/)
    .withMessage('Password must include letters and numbers'),
];

export const signinValidations = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];