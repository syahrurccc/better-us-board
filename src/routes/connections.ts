import { Router } from 'express';
import { z } from 'zod';

import { User, Invite } from '../models/schema';

const router = Router();

const inviteSchema = z.object({
  inviteeId: z.string().min(24).max(24)
})

router.post('/invite', async (req, res, next) => {
  const parsedData = inviteSchema.safeParse(req.body);
  
  if (!parsedData.success) return res.status(400).json({ error: 'Invalid userId.' });
  
  const invitee = await User.findById(`${parsedData.data.inviteeId}`).lean();
  
  if (!invitee) return res.status(400).json({ error: 'No user found.' });
  
  await Invite.create({
    inviterId: req.userId,
    inviteeEmail: invitee.email,
  });
});

router.post('/accept', async (req, res, next) => {
  
});

export default router;