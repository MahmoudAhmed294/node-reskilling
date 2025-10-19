import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-management-test-integration');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', userData.email);

      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);
      expect(user?.email).toBe(userData.email);
      expect(user?.password).not.toBe(userData.password);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe',
        // missing email and password
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(incompleteData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Email already registered');
    });

    it('should hash the password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email });
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });
  });

  describe('POST /api/auth/signin', () => {
    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);
    });

    it('should sign in successfully with correct credentials', async () => {
      const signinData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(signinData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');

      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should return 400 for non-existent email', async () => {
      const signinData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(signinData)
        .expect(400);

      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.token).toBeUndefined();
    });

    it('should return 400 for wrong password', async () => {
      const signinData = {
        email: userData.email,
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(signinData)
        .expect(400);

      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.token).toBeUndefined();
    });

    it('should return 400 for missing email or password', async () => {
      const incompleteData = {
        email: userData.email,
        // missing password
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(incompleteData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return valid JWT token that can be decoded', async () => {
      const signinData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(signinData)
        .expect(200);

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'your-secret-key');

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email', userData.email);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('Auth flow integration', () => {
    it('should allow signup, signin, and use token for authenticated requests', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'integration123',
      };

      // Signup
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Signin
      const signinResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const token = signinResponse.body.token;

      const blogResponse = await request(app)
        .get('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(blogResponse.body.blogs)).toBe(true);
    });
  });
});