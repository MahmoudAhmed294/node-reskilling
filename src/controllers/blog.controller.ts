import { Request, Response } from 'express';
import { Blog } from '../models/blog.model';

export const createBlog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required.' });
    }

    if (!req?.body.user) {
      res.status(401).json({ message: 'User not authenticated.' });
    }
    const blog = new Blog({
      title,
      content,
      category,
      owner: req.body.user.id,
    });

    await blog.save();
    res.status(201).json({ message: 'Blog created successfully.', blog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog.', error });
  }
};

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    const filter: any = {};

    if (!req?.body.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    filter.owner = req.body.user.id;

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const blogs = await Blog.find(filter)
      .populate('owner', 'email name')
      .skip(skip)
      .limit(limitNum);

    const total = await Blog.countDocuments(filter);

    res.status(200).json({
      blogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs.', error });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      res.status(404).json({ message: 'Blog not found.' });
    }

    if (blog?.owner.toString() !== req?.body.user.id) {
      res.status(403).json({ message: 'Not authorized to edit this blog.' });
    }

    const updated = await Blog.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: 'Blog updated successfully.', updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog.', error });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      res.status(404).json({ message: 'Blog not found.' });
    }

    if (blog?.owner.toString() !== req?.body.user.id) {
      res.status(403).json({ message: 'Not authorized to delete this blog.' });
    }

    await blog?.deleteOne();
    res.status(200).json({ message: 'Blog deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog.', error });
  }
};
