import { Router } from 'express';
import { z } from 'zod';

import { Board, User } from '../models/schema';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const boardNameSchema = z.object({
  boardId: objectId,
  boardName: z.string().min(1)
})

router.get('/board', async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'You are not logged in' });
    
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(400).json({ error: 'No user found' });
    
    if (!user.partnerId) return res.status(200).json({ board: null });
    
    let board = await Board.findOne({ userIds: user._id });
    if (!board) {
      board = await Board.create({
        name: 'Our Board',
        userIds: [user._id, user.partnerId]
      });
    }
    
    return res.status(200).json({ board });
  } catch (e: any) {
    next(e);
  }
});

router.post('/board', async (req, res, next) => {
  try {
    const parsed = boardNameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    
    const { boardId, boardName } = parsed.data;
    
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    if (!board.userIds.some(id => id.equals(req.userId))) {
      return res.status(403).json({ error: 'User is not authorized to edit this board' });
    }
    
    await board.updateOne({ name: boardName });
    return res.status(200).json({ message: 'Board name updated' })
  } catch (e) {
    next(e)
  }
});