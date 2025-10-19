import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { Blog } from '../src/models/blog.model';

describe('Blog API Integration Tests', () => {
  let authToken: string;
  let testUser: any;

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
    await Blog.deleteMany({});

    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    const signinResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    authToken = signinResponse.body.token;
    testUser = await User.findOne({ email: userData.email });
  });

  describe('POST /api/blogs', () => {
    it('should create a blog successfully', async () => {
      const blogData = {
        title: 'My First Blog',
        content: 'This is the content of my first blog post.',
        category: 'Technology',
      };

      const response = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(blogData)
        .expect(201);

      expect(response.body.message).toBe('Blog created successfully.');
      expect(response.body.blog).toHaveProperty('_id');
      expect(response.body.blog.title).toBe(blogData.title);
      expect(response.body.blog.content).toBe(blogData.content);
      expect(response.body.blog.category).toBe(blogData.category);
      expect(response.body.blog.owner).toBe(testUser._id.toString());

      const blog = await Blog.findById(response.body.blog._id);
      expect(blog).toBeTruthy();
      expect(blog?.title).toBe(blogData.title);
    });

    it('should return 400 for missing title or content', async () => {
      const invalidBlogData = {
        title: '',
        content: '',
        category: 'Technology',
      };

      const response = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBlogData)
        .expect(400);

      expect(response.body.message).toMatch(/Title and content are required/i);
    });

    it('should return 401 if no authorization token provided', async () => {
      const blogData = {
        title: 'Unauthorized Blog',
        content: 'This should fail',
        category: 'Tech',
      };

      const response = await request(app)
        .post('/api/blogs')
        .send(blogData)
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('GET /api/blogs', () => {
    beforeEach(async () => {
      const blogs = [
        {
          title: 'Tech Blog',
          content: 'Technology content',
          category: 'Technology',
          owner: testUser._id,
        },
        {
          title: 'Life Blog',
          content: 'Life content',
          category: 'Lifestyle',
          owner: testUser._id,
        },
        {
          title: 'Another Tech Blog',
          content: 'More tech content',
          category: 'Technology',
          owner: testUser._id,
        },
      ];

      await Blog.insertMany(blogs);
    });

    it('should fetch all blogs', async () => {
      const response = await request(app)
        .get('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.blogs).toHaveLength(3);
      expect(response.body.blogs[0]).toHaveProperty('title');
      expect(response.body.blogs[0]).toHaveProperty('content');
      expect(response.body.blogs[0]).toHaveProperty('category');
      expect(response.body.blogs[0]).toHaveProperty('owner');
      expect(response.body.blogs[0].owner).toHaveProperty('email');
      expect(response.body.blogs[0].owner).toHaveProperty('name');
    });

    it('should filter blogs by category', async () => {
      const response = await request(app)
        .get('/api/blogs?category=Technology')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.blogs).toHaveLength(2);
      response.body.blogs.forEach((blog: any) => {
        expect(blog.category).toBe('Technology');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const response = await request(app)
        .get('/api/blogs?category=NonExistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.blogs).toHaveLength(0);
    });

    it('should return 401 if no authorization token provided', async () => {
      const response = await request(app)
        .get('/api/blogs')
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('PUT /api/blogs/:id', () => {
    let existingBlog: any;

    beforeEach(async () => {
      existingBlog = await Blog.create({
        title: 'Original Title',
        content: 'Original content',
        category: 'Original Category',
        owner: testUser._id,
      });
    });

    it('should update a blog successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        category: 'Updated Category',
      };

      const response = await request(app)
        .put(`/api/blogs/${existingBlog._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Blog updated successfully.');
      expect(response.body.updated.title).toBe(updateData.title);
      expect(response.body.updated.content).toBe(updateData.content);
      expect(response.body.updated.category).toBe(updateData.category);

      const updatedBlog = await Blog.findById(existingBlog._id);
      expect(updatedBlog?.title).toBe(updateData.title);
      expect(updatedBlog?.content).toBe(updateData.content);
    });

    it('should return 404 for non-existent blog', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const response = await request(app)
        .put(`/api/blogs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Blog not found.');
    });

    it('should return 403 if user is not the owner', async () => {
      const otherUserData = {
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(otherUserData)
        .expect(201);

      const otherSigninResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: otherUserData.email,
          password: otherUserData.password,
        })
        .expect(200);

      const otherToken = otherSigninResponse.body.token;

      const updateData = {
        title: 'Unauthorized Update',
        content: 'This should fail',
      };

      const response = await request(app)
        .put(`/api/blogs/${existingBlog._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to edit this blog.');
    });
  });

  describe('DELETE /api/blogs/:id', () => {
    let existingBlog: any;

    beforeEach(async () => {
      existingBlog = await Blog.create({
        title: 'Blog to Delete',
        content: 'This blog will be deleted',
        category: 'Test',
        owner: testUser._id,
      });
    });

    it('should delete a blog successfully', async () => {
      const response = await request(app)
        .delete(`/api/blogs/${existingBlog._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Blog deleted successfully.');

      const deletedBlog = await Blog.findById(existingBlog._id);
      expect(deletedBlog).toBeNull();
    });

    it('should return 404 for non-existent blog', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/blogs/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Blog not found.');
    });

    it('should return 403 if user is not the owner', async () => {
      const otherUserData = {
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/signup')
        .send(otherUserData)
        .expect(201);

      const otherSigninResponse = await request(app)
        .post('/api/auth/signin')
        .send({
          email: otherUserData.email,
          password: otherUserData.password,
        })
        .expect(200);

      const otherToken = otherSigninResponse.body.token;

      const response = await request(app)
        .delete(`/api/blogs/${existingBlog._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.message).toBe('Not authorized to delete this blog.');
    });
  });

  describe('Blog CRUD flow integration', () => {
    it('should allow complete CRUD operations: create, read, update, delete', async () => {
      // Create
      const blogData = {
        title: 'Integration Test Blog',
        content: 'Testing complete CRUD flow',
        category: 'Integration',
      };

      const createResponse = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(blogData)
        .expect(201);

      const blogId = createResponse.body.blog._id;

      // Read (get all blogs)
      const getAllResponse = await request(app)
        .get('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getAllResponse.body.blogs.length).toBeGreaterThan(0);
      const foundBlog = getAllResponse.body.blogs.find((b: any) => b._id === blogId);
      expect(foundBlog).toBeTruthy();
      expect(foundBlog.title).toBe(blogData.title);

      // Update
      const updateData = {
        title: 'Updated Integration Test Blog',
        content: 'Updated content for integration test',
        category: 'Updated Integration',
      };

      await request(app)
        .put(`/api/blogs/${blogId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verify update
      const getUpdatedResponse = await request(app)
        .get('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedBlog = getUpdatedResponse.body.blogs.find((b: any) => b._id === blogId);
      expect(updatedBlog.title).toBe(updateData.title);
      expect(updatedBlog.content).toBe(updateData.content);

      // Delete
      await request(app)
        .delete(`/api/blogs/${blogId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const getAfterDeleteResponse = await request(app)
        .get('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedBlog = getAfterDeleteResponse.body.blogs.find((b: any) => b._id === blogId);
      expect(deletedBlog).toBeUndefined();
    });
  });
});