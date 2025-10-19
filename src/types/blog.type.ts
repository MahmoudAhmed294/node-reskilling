import mongoose, { Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  content: string;
  category?: string;
  owner: mongoose.Types.ObjectId;
}
