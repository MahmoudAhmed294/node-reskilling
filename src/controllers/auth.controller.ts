import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Request, Response } from 'express';
import { ENV } from '../config/env';

const JWT_SECRET = ENV.JWT_SECRET;

export const signup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user._id, email: user.email },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user!.password);
    if (!isMatch) res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user!._id, email: user!.email }, JWT_SECRET as string, {
      expiresIn: '2h',
    });

    res.status(200).json({ message: 'Login successful', token });
    
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
