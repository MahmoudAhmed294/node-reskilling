import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';

let token: string;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect('mongodb://localhost:27017/blog-management-test');
  }
  await mongoose?.connection?.db?.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Blog APIs (Integration)', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Tester',
      email: 'test@example.com',
      password: 'abc12345',
    });

    const loginRes = await request(app).post('/api/auth/signin').send({
      email: 'test@example.com',
      password: 'abc12345',
    });

    token = loginRes.body.token;
  });

  it('should fail to create a blog without title or content', async () => {
    const res = await request(app).post('/api/blogs').set('Authorization', `Bearer ${token}`).send({
      title: '',
      content: '',
      category: 'Tech',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Title and content are required/i);
  });

  it('should create a blog successfully and then update it', async () => {
    const res = await request(app).post('/api/blogs').set('Authorization', `Bearer ${token}`).send({
      title: 'My First Blog',
      content: 'Hello world content',
      category: 'Tech',
    });

    expect(res.status).toBe(201);
    expect(res.body.blog.title).toBe('My First Blog');
    expect(res.body.blog.content).toBe('Hello world content');

    const updateRes = await request(app)
      .put(`/api/blogs/${res.body.blog._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Title',
        content: 'Updated Content',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.updated.title).toBe('Updated Title');
    expect(updateRes.body.updated.content).toBe('Updated Content');
  });

  it('should create and then fetch blogs', async () => {
    const createRes = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'My First Blog',
        content: 'Hello world',
        category: 'Tech',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.blog.title).toBe('My First Blog');
    expect(createRes.body.blog.content).toBe('Hello world');
    expect(createRes.body.blog.category).toBe('Tech');

    const fetchRes = await request(app).get('/api/blogs').set('Authorization', `Bearer ${token}`);

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.blogs.length).toBeGreaterThan(0);
    expect(fetchRes.body.blogs[0].title).toBe('My First Blog');
    expect(fetchRes.body.blogs[0].content).toBe('Hello world');
    expect(fetchRes.body.blogs[0].category).toBe('Tech');
  });
});
