import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token!, ENV.JWT_SECRET!) as jwt.JwtPayload;

    req.body = {
      ...req.body,
      user: decoded,
    };
    
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
