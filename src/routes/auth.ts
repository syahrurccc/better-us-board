import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { User } from '../db/schema';
import { parse } from 'zod/mini';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
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

const loginSchema = z.object ({
  email: z.email(),
  password: z.string().min(8)
})

router.post('register', async (req, res, next) => {
  try {
    const parsedData = registerSchema.parse(req.body);

    const hash = await bcrypt.hash(parsedData.password, 10);
    await User.create({
      name: parsedData.name,
      email: parsedData.email,
      password: hash,
    });
    
    res.redirect('/login');
    
  } catch (e: any) {
    console.log(e.messsage);
    if (e.code === 11000) {
      return res.status(400).json({ error: 'User already exists. Please login.' });
    }
    return res.status(400).json({ error: e.message });
  }
});

router.post('login', async (req, res, next) => {
  try {
    const parsedData = loginSchema.parse(req.body);
    
    const user = await User.findOne({ email: parsedData.email });
    if (!user) return res.status(400).json({ error: 'User is not registered. Please register' });
    
    const pass = await bcrypt.compare(parsedData.password, user.password)
    if (!pass) return res.status(400).json({ error: 'Incorrect password.' });
    
    // authorize user
    
    res.redirect('/board');
  } catch (e: any) {
    console.log(e.message);
  }
});

router.post('logout', (req, res, next) => {
  
});

export default router;