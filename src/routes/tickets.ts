import { Router } from 'express';
import { z } from 'zod';

const router = Router();

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