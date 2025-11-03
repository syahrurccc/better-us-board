import { Router } from 'express';
import { z } from 'zod';

import { Board, User, objectId } from '../models/schema';
import { requireAuth } from '../middlewares/requireAuth';


const router = Router();

const boardNameSchema = z.object({
  boardId: objectId,
  boardName: z.string().min(1)
})

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ error: 'No user found' });
    
    if (!user.partnerId) {
      return res.status(200).json({ username: user.name, board: null});
    } 
    
    let board = await Board.findOne({ userIds: user._id }).lean();
    if (!board) board = await Board.create({ userIds: [user._id, user.partnerId] });
    
    return res.status(200).json({ username: user.name, board });
  } catch (e: any) {
    next(e);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { boardId, boardName } = boardNameSchema.parse(req.body);
    
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

export default router;