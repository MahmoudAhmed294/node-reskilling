import mongoose, { Schema, Model } from 'mongoose';
import { IBlog } from '../types/blog.type';

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Blog: Model<IBlog> = mongoose.model<IBlog>('Blog', blogSchema);
