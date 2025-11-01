import { Router } from 'express';
import { z } from 'zod';
import type { FilterQuery } from 'mongoose';

import { Ticket, Comment, Board} from '../models/schema';
import { categories, priorities, statuses, objectId } from '../models/schema';

const router = Router();

const asArray = <T extends readonly string[]>(choices: T) =>
  z.preprocess((v) => {
    if (v == null || v === '') return undefined;
    const arr = Array.isArray(v) ? v : [v];
    return arr.map(s => String(s).trim().toLowerCase());
  }, z.array(z.enum(choices)).nonempty().optional());

const ticketQuerySchema = z.object({
  category: asArray(categories),
  priority: asArray(priorities),
  status: asArray(statuses),
}).strict();

const ticketSchema = z.object({
  boardId: objectId,
  title: z.string().min(3).trim(),
  description: z.string().min(3).trim().optional(),
  category: z.enum(categories),
  priority: z.enum(priorities),
}).strict();

const ticketPatchSchema = z.object({
  title: z.string().min(3).trim().optional(),
  description: z.string().min(3).trim().optional(),
  category: z.enum(categories).optional(),
  priority: z.enum(priorities).optional(),
}).refine(d => Object.keys(d).length > 0, 
  { message: 'No fields changed' });

const commentSchema = z.string().min(1).trim();

async function findTicket(id: String) {
  const ticketId = objectId.parse(id)
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error('Ticket does not exists');
    (err as any).status = 404;
    throw err
  }
  return ticket;
}

router.get('/', async (req, res, next) => {
  try {
    const board = await Board.findOne({ userIds: req.userId }).lean();
    if (!board) return res.status(404).json({ error: 'User has no board' })
    
    const q = ticketQuerySchema.parse(req.query);
    
    const filter: FilterQuery<typeof Ticket> = { boardId: board._id };
    
    if (Object.keys(q).length === 0) {
      filter.status = { $in: ['open', 'in_progress'] };
    } else {
      if (q.status)   filter.status   = q.status.length   === 1 ? q.status[0]   : { $in: q.status };
      if (q.priority) filter.priority = q.priority.length === 1 ? q.priority[0] : { $in: q.priority };
      if (q.category) filter.category = q.category.length === 1 ? q.category[0] : { $in: q.category };
    }
    
    const tickets = await Ticket.find(
      filter, 
      { category: 0, description: 0, createdAt: 0 }
    )
    .populate('authorId', 'name')
    .select('title')
    .sort({ updatedAt: -1 })
    .lean();
    
    res.status(200).json(tickets);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const board = await Board.findOne({ userIds: req.userId }).lean();
    if (!board) return res.status(303).redirect('/board');

    const ticket = ticketSchema.parse(req.body);
    
    if (board._id.toString() !== ticket.boardId) {
      return res.status(403).json({ 
        error: 'Not authorized to send ticket to destined board' 
      });
    }
    
    await Ticket.create({
      boardId: ticket.boardId,
      authorId: req.userId,
      title: ticket.title,
      description: ticket.description ?? null,
      category: ticket.category,
      priority: ticket.priority,
    });
    
    return res.status(201);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const ticketId = objectId.parse(req.params.id);
    
    const ticket = await Ticket.findById(
      ticketId
    ).populate('authorId', 'name').lean();
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    const comments = await Comment.find({ ticketId: ticket._id });
    
    return res.status(200).json({ ticket, comments });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const ticket = await findTicket(req.params.id);
    
    if (ticket.authorId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this ticket' });
    }
    
    const resolve = String(req.query.resolve).toLowerCase() === 'true';
    if (resolve) {
      if (ticket.status === 'resolved') {
        return res.status(409).json({ error: 'Ticket is already resolved' })
      }
      await ticket.updateOne({ status: 'resolved' });
      return res.status(200).json({ message: 'Ticket resolved' });
    }
    
    const data = ticketPatchSchema.parse(req.body);
    
    // This is a short-circuit evaluation
    // A && B → returns A if A is falsy, otherwise returns B.
    // A || B → returns A if A is truthy, otherwise returns B.
    // ...() → spreads object’s fields or skips false.
    const editedTicket = await ticket.updateOne({
      ...(!data.title && { title: data.title }),
      ...(!data.description && { description: data.description }),
      ...(!data.category && { category: data.category }),
      ...(!data.priority && { priority: data.priority }),
    }, { new: true });
    
    return res.status(200).json(editedTicket)
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ticket = await findTicket(req.params.id);
    
    if (ticket.authorId.toString() !== req.userId) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this ticket' 
      });
    }
    await ticket.deleteOne();
    
    res.status(200).json({ message: 'Ticket deleted' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/comments', async (req, res, next) => {
  try {
    const ticket = await findTicket(req.params.id);
    
    const body = commentSchema.parse(req.body.body);
    
    const comment = await Comment.create({
      ticketId: ticket._id,
      authorId: req.userId,
      body: body
    });
    
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

export default router;