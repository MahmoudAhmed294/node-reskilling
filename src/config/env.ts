import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-management',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
};
