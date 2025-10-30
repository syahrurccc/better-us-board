import { Router } from 'express';
import { z } from 'zod';
import type { FilterQuery } from 'mongoose';

import { Ticket, Comment, Board, User } from '../models/schema';

const router = Router();

const categories = ['communication', 'household', 'finance', 'wellbeing', 'other'] as const;
const priorities = ['low', 'medium', 'high'] as const;
const statuses = ['open', 'in_progress', 'resolved'] as const;
type Category = typeof categories[number];
type Priority = typeof priorities[number]
type Status = typeof statuses[number];

const asArray = <T extends readonly string[]>(choices: T) =>
  z.preprocess((v) => {
    if (v == null || v === '') return undefined;
    const arr = Array.isArray(v) ? v : [v];
    return arr.map(s => String(s).trim().toLowerCase());
  }, z.array(z.enum(choices)).nonempty().optional());

const ticketQuerySchema = z.object({
  category: asArray(categories),
  priority: asArray(priorities),
  status:   asArray(statuses),
})

const ticketSchema = z.object({
  title:       z.string().min(3).trim(),
  description: z.string().min(3).trim(),
  category:    z.enum(['communication', 'household', 'finance', 'wellbeing', 'other']),
  priority:    z.enum(['low', 'medium', 'high'])
});

const commentSchema = z.object({
  body: z.string().min(3).trim()
})

router.get('/', async (req, res, next) => {
  try {
    const board = await Board.findOne({ userIds: req.userId }).lean();
    if (!board) return res.status(303).redirect('/board');
    
    const parsed = ticketQuerySchema.safeParse(req.query);
    
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid status', details: parsed.error.flatten() });
    }
    const q = parsed.data;
    
    const filter: FilterQuery<typeof Ticket> = { boardId: board._id };
    
    if (Object.keys(q).length === 0) {
      filter.status = { $in: ['open', 'in_progress'] };
    } else {
      if (q.status)   filter.status   = q.status.length   === 1 ? q.status[0]   : { $in: q.status };
      if (q.priority) filter.priority = q.priority.length === 1 ? q.priority[0] : { $in: q.priority };
      if (q.category) filter.category = q.category.length === 1 ? q.category[0] : { $in: q.category };
    }
    
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).lean();
    
    res.status(200).json(tickets)
  } catch (e) {
    next(e);
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