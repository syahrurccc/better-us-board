import { Router } from 'express';
import { z } from 'zod';

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
  
});

router.post('login', async (req, res, next) => {
  
});

router.post('logout', (req, res, next) => {
  
});

export default router;