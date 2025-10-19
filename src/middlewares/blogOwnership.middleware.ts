import { Request, Response, NextFunction } from 'express';
import { Blog } from '../models/blog.model';

export const checkBlogOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      res.status(404).json({ message: 'Blog not found.' });
      return;
    }

    if (blog.owner.toString() !== req.body.user.id) {
      const action = req.method === 'PUT' ? 'edit' : 'delete';
      res.status(403).json({ message: `Not authorized to ${action} this blog.` });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};