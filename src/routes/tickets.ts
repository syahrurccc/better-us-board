import { Router } from 'express';
import { z } from 'zod';

import { Ticket, Comment, Board } from '../models/schema';

const router = Router();

const stats = ['open', 'in_progress', 'resolved'] as const;
type Status = (typeof stats)[number];

const statusSchema = z.preprocess((v) => {
  if (v === null) return undefined;
  if (Array.isArray(v)) return undefined;
  const s = String(v).trim();
  return s.toLowerCase();
}, z.enum(stats).optional());

const ticketSchema = z.object({
  title: z.string().min(3).trim(),
  description: z.string().min(3).trim(),
  category: z.enum(['communication', 'household', 'finance', 'wellbeing', 'other']),
  priority: z.enum(['low', 'medium', 'high'])
});

const commentSchema = z.object({
  body: z.string().min(3).trim()
})

router.get('/', async (req, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.query.status);
    
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    
    const status: Status | undefined = parsed.data;
    
    if (!status) {
      const tickets = await Ticket.find()
    }
    
  } catch (e) {
    
  }
});

router.post('/', async (req, res, next) => {
  
});

router.get('/:id', async (req, res, next) => {
  
});

router.patch('/:id', async (req, res, next) => {
  
});

router.delete('/:id', async (req, res, next) => {
  
});

router.get('/:id/comments', async (req, res, next) => {
  
});

router.post('/:id/comments', async (req, res, next) => {
  
});


export default router;