import { Request, Response } from 'express';
import { createBlog, getBlogs, updateBlog, deleteBlog } from '../src/controllers/blog.controller';
import { Blog } from '../src/models/blog.model';

jest.mock('../src/models/blog.model');

const mockBlog = Blog as jest.Mocked<typeof Blog>;

describe('Blog Controller Unit Tests', () => {
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

  describe('createBlog', () => {
    it('should create a blog successfully', async () => {
      const blogData = {
        title: 'Test Blog',
        content: 'Test Content',
        category: 'Tech',
      };
      const userId = 'user123';
      const savedBlog = { ...blogData, _id: 'blog123', owner: userId };

      mockRequest.body = { ...blogData, user: { id: userId } };
      const mockBlogInstance = {
        save: jest.fn().mockResolvedValue(savedBlog),
      };
      (mockBlog as any).mockImplementation(() => mockBlogInstance);

      await createBlog(mockRequest as Request, mockResponse as Response);

      expect(mockBlog).toHaveBeenCalledWith({
        title: blogData.title,
        content: blogData.content,
        category: blogData.category,
        owner: userId,
      });
      expect(mockBlogInstance.save).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Blog created successfully.',
        blog: mockBlogInstance,
      });
    });

    it('should return 400 if title or content is missing', async () => {
      mockRequest.body = { title: '', content: '', category: 'Tech', user: { id: 'user123' } };

      await createBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Title and content are required.',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.body = { title: 'Test', content: 'Content' };

      await createBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not authenticated.',
      });
    });

    it('should handle errors during blog creation', async () => {
      const error = new Error('Database error');
      mockRequest.body = { title: 'Test', content: 'Content', user: { id: 'user123' } };
      const mockBlogInstance = {
        save: jest.fn().mockRejectedValue(error),
      };
      (mockBlog as any).mockImplementation(() => mockBlogInstance);

      await createBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating blog.',
        error,
      });
    });
  });

  describe('getBlogs', () => {
    it('should fetch all blogs without category filter', async () => {
      const blogs = [
        { _id: '1', title: 'Blog 1', content: 'Content 1', category: 'Tech' },
        { _id: '2', title: 'Blog 2', content: 'Content 2', category: 'Life' },
      ];
      const mockQuery = {
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(blogs),
          }),
        }),
      };
      mockBlog.find = jest.fn().mockReturnValue(mockQuery);
      mockBlog.countDocuments = jest.fn().mockResolvedValue(2);
      mockRequest.query = {};

      await getBlogs(mockRequest as Request, mockResponse as Response);

      expect(mockBlog.find).toHaveBeenCalledWith({});
      expect(mockQuery.populate).toHaveBeenCalledWith('owner', 'email name');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        blogs,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should fetch blogs with category filter', async () => {
      const category = 'Tech';
      const blogs = [{ _id: '1', title: 'Blog 1', content: 'Content 1', category }];
      mockRequest.query = { category };
      const mockQuery = {
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(blogs),
          }),
        }),
      };
      mockBlog.find = jest.fn().mockReturnValue(mockQuery);
      mockBlog.countDocuments = jest.fn().mockResolvedValue(1);

      await getBlogs(mockRequest as Request, mockResponse as Response);

      expect(mockBlog.find).toHaveBeenCalledWith({ category });
      expect(mockQuery.populate).toHaveBeenCalledWith('owner', 'email name');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        blogs,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should handle errors during blog fetching', async () => {
      const error = new Error('Database error');
      mockRequest.query = {};
      const mockQuery = {
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(error),
          }),
        }),
      };
      mockBlog.find = jest.fn().mockReturnValue(mockQuery);
      mockBlog.countDocuments = jest.fn().mockResolvedValue(0);

      await getBlogs(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching blogs.',
        error,
      });
    });
  });

  describe('updateBlog', () => {
    it('should update a blog successfully', async () => {
      const blogId = 'blog123';
      const userId = 'user123';
      const updateData = { title: 'Updated Title', content: 'Updated Content' };
      const existingBlog = { _id: blogId, owner: userId, title: 'Old Title' };
      const updatedBlog = { ...existingBlog, ...updateData };

      mockRequest.params = { id: blogId };
      mockRequest.body = { ...updateData, user: { id: userId } };
      mockBlog.findById = jest.fn().mockResolvedValue(existingBlog);
      mockBlog.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedBlog);

      await updateBlog(mockRequest as Request, mockResponse as Response);

      expect(mockBlog.findById).toHaveBeenCalledWith(blogId);
      expect(mockBlog.findByIdAndUpdate).toHaveBeenCalledWith(blogId, mockRequest.body, {
        new: true,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Blog updated successfully.',
        updated: updatedBlog,
      });
    });

    it('should return 404 if blog not found', async () => {
      const blogId = 'nonexistent';
      mockRequest.params = { id: blogId };
      mockRequest.body = { user: { id: 'user123' } };
      mockBlog.findById = jest.fn().mockResolvedValue(null);

      await updateBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Blog not found.',
      });
    });

    it('should return 403 if user is not authorized', async () => {
      const blogId = 'blog123';
      const existingBlog = { _id: blogId, owner: 'differentUser' };
      mockRequest.params = { id: blogId };
      mockRequest.body = { user: { id: 'user123' } };
      mockBlog.findById = jest.fn().mockResolvedValue(existingBlog);

      await updateBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Not authorized to edit this blog.',
      });
    });

    it('should handle errors during blog update', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'blog123' };
      mockRequest.body = { user: { id: 'user123' } };
      mockBlog.findById = jest.fn().mockRejectedValue(error);

      await updateBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error updating blog.',
        error,
      });
    });
  });

  describe('deleteBlog', () => {
    it('should delete a blog successfully', async () => {
      const blogId = 'blog123';
      const userId = 'user123';
      const existingBlog = {
        _id: blogId,
        owner: userId,
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      mockRequest.params = { id: blogId };
      mockRequest.body = { user: { id: userId } };
      mockBlog.findById = jest.fn().mockResolvedValue(existingBlog);

      await deleteBlog(mockRequest as Request, mockResponse as Response);

      expect(mockBlog.findById).toHaveBeenCalledWith(blogId);
      expect(existingBlog.deleteOne).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Blog deleted successfully.',
      });
    });

    it('should return 404 if blog not found', async () => {
      const blogId = 'nonexistent';
      mockRequest.params = { id: blogId };
      mockRequest.body = { user: { id: 'user123' } };
      mockBlog.findById = jest.fn().mockResolvedValue(null);

      await deleteBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Blog not found.',
      });
    });

    it('should return 403 if user is not authorized', async () => {
      const blogId = 'blog123';
      const existingBlog = { _id: blogId, owner: 'differentUser' };
      mockRequest.params = { id: blogId };
      mockRequest.body = { user: { id: 'user123' } };
      mockBlog.findById = jest.fn().mockResolvedValue(existingBlog);

      await deleteBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Not authorized to delete this blog.',
      });
    });

    it('should handle errors during blog deletion', async () => {
      const error = new Error('Database error');
      mockRequest.params = { id: 'blog123' };
      mockRequest.body = { user: { id: 'user123' } };
      mockBlog.findById = jest.fn().mockRejectedValue(error);

      await deleteBlog(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting blog.',
        error,
      });
    });
  });
});
