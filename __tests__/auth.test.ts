import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';

beforeAll(async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB is already connected');
    return;
  }
  await mongoose.connect('mongodb://localhost:27017/blog-management-test');
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  const userData = { name: 'test', email: 'test@test.com', password: 'test1234' };

  it('Signup with valid data', async () => {
    const res = await request(app).post('/api/auth/signup').send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User created successfully');
  });

  it('should not allow signup with existing email', async () => {
    await request(app).post('/api/auth/signup').send(userData);

    const res = await request(app).post('/api/auth/signup').send(userData);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email already registered');
  });

  it('Signin with correct credentials', async () => {
    await request(app).post('/api/auth/signup').send(userData);

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: userData.email, password: userData.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('Signin with wrong password should fail', async () => {
    await request(app).post('/api/auth/signup').send(userData);

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: userData.email, password: 'wrongPassword' });
    expect(res.statusCode).toBe(400);
  });
});
