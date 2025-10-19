import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signup, signin } from '../src/controllers/auth.controller';
import { User } from '../src/models/user.model';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../src/models/user.model');
jest.mock('../src/config/env', () => ({
  ENV: {
    JWT_SECRET: 'test-secret',
  },
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockUser = User as jest.Mocked<typeof User>;

describe('Auth Controller Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        _id: 'user123',
        email: userData.email,
        name: userData.name,
      };

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockResolvedValue(null);
      mockBcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);
      mockUser.create = jest.fn().mockResolvedValue(createdUser);

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUser.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: { id: createdUser._id, email: createdUser.email },
      });
    });

    it('should return 400 if email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };
      const existingUser = { _id: 'existing123', email: userData.email };

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockResolvedValue(existingUser);

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email already registered',
      });
      expect(mockUser.create).not.toHaveBeenCalled();
    });

    it('should handle errors during user creation', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const error = new Error('Database error');

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockResolvedValue(null);
      mockBcrypt.hash = jest.fn().mockRejectedValue(error);

      await signup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: error.message,
      });
    });
  });

  describe('signin', () => {
    it('should sign in user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        _id: 'user123',
        email: userData.email,
        password: 'hashedPassword',
      };
      const token = 'jwt-token';

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockResolvedValue(user);
      mockBcrypt.compare = jest.fn().mockResolvedValue(true);
      mockJwt.sign = jest.fn().mockReturnValue(token);

      await signin(mockRequest as Request, mockResponse as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(userData.password, user.password);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { id: user._id, email: user.email },
        'test-secret',
        { expiresIn: '2h' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token,
      });
    });

    it('should return 400 if user not found', async () => {
      const userData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockResolvedValue(null);

      await signin(mockRequest as Request, mockResponse as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should return 400 if password does not match', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const user = {
        _id: 'user123',
        email: userData.email,
        password: 'hashedPassword',
      };

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockResolvedValue(user);
      mockBcrypt.compare = jest.fn().mockResolvedValue(false);

      await signin(mockRequest as Request, mockResponse as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(userData.password, user.password);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
      });
    });

    it('should handle errors during sign in', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const error = new Error('Database error');

      mockRequest.body = userData;
      mockUser.findOne = jest.fn().mockRejectedValue(error);

      await signin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: error.message,
      });
    });
  });
});