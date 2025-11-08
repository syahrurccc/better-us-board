import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from '../models/user';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(3).trim(),
  email: z.email().trim(),
  password: z.string().min(8),
  confirmation: z.string().min(8)
}).refine((s) => s.password === s.confirmation, {
  message: 'Password must match',
  path: ['confirmation'],
  when(payload) { 
    return registerSchema 
      .pick({ password: true, confirmation: true }) 
      .safeParse(payload.value).success; 
  },  
});

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8)
}).strict();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = await registerSchema.parseAsync(req.body);
    
    const user = await User.exists({ email: email });
    if (user) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });
    
    res.status(201).json({ message: 'User registered successfully' })
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ error: 'Authentication failed' });
    
    const pass = await bcrypt.compare(password, user.password)
    if (!pass) return res.status(401).json({ error: 'Authentication failed' });
    
    // authorize user
    const token = jwt.sign({
      id: user._id.toString(), name: user.name
    }, process.env.TOKEN_SECRET!, { expiresIn: '1h' });
    
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 59 * 60 * 1000,
    });
    return res.sendStatus(204);
  } catch (e: any) {
    next(e);
  }
});

router.get('/logout', (_req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  
  return res.sendStatus(204);
});

export default router;