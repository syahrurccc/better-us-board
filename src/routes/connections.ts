import { Router } from 'express';
import { z } from 'zod';

import { User, Invite, Board } from '../models/schema';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const inviteBodySchema = z.object({ inviteeId: objectId });
const breakBodySchema = z.object({ partnerId: objectId });
const acceptBodySchema = z.object({ 
  inviteId: objectId,
  response: z.boolean
});

router.post('/invite', async (req, res, next) => {
  try {
    const inviter = await User.findById(req.userId).lean();
    if (!inviter) return res.status(404).json({ error: 'Inviter not found' });
    
    if (inviter.partnerId !== null && inviter.partnerId !== undefined) {
      return res.status(403).json({ error: 'You already have a partner' });
    }
    
    const parsed = inviteBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    } 
    const { inviteeId } = parsed.data; 
   
    const invitee = await User.findById(inviteeId).lean();
    if (!invitee) return res.status(400).json({ error: 'No user found.' });
    
    if (invitee.partnerId !== null && invitee.partnerId !== undefined) {
      return res.status(403).json({ error: 'User already have a partner' });
    }
    
    const exists = await Invite.exists({
      inviterId: req.userId,
      inviteeId: invitee._id,
      status: 'pending'
    });
    if (exists) {
      return res.status(400).json({ error: 'An invite is already pending' });
    }
    
    const invite = await Invite.create({
      inviterId: req.userId,
      inviteeId: invitee._id,
    });
    
    return res.status(201).json(invite);
  } catch (e: any) {
    next(e);
  } 
});

router.get('/request', async (req, res, next) => {
  try {
    const invites = await Invite.find({ inviteeId: req.userId });
    return res.status(200).json({ invites });
  } catch (e: any) {
    next(e);
  }
});

router.post('/accept', async (req, res, next) => {
  try {
    const parsed = acceptBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    const { inviteId, response } = parsed.data;
    
    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(400).json({ error: 'No invite found' });
    if (invite.status !== 'pending') {
      return res.status(409).json({ error: "Invite already accepted/rejected" });
    }
    
    if (!response) {
      await invite.deleteOne();
      return res.status(204).json({ message: 'Invite rejected' })
    }
    
    await Promise.all([
      Invite.findByIdAndUpdate(inviteId, { status: 'accepted' }),
      User.findByIdAndUpdate(invite.inviterId, { partnerId: invite.inviteeId }),
      User.findByIdAndUpdate(invite.inviteeId, { partnerId: invite.inviterId }),
    ]);
    
    await Board.create({
      name: 'Our Board',
      userIds: [invite.inviterId, invite.inviteeId]
    });
    
    return res.status(202).json({ message: 'Invite accepted' });
  } catch (e: any) {
    next(e);
  }
});

router.post('/break', async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Invalid user' })
    
    const parsed = breakBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.flatten() });
    }
    const { partnerId } = parsed.data;
    
    const partner = await User.findById(partnerId);
    if (!partner) return res.status(404).json({ error: 'Partner account does not exist' });
    
    if (!user.partnerId.equals(partnerId) && !partner.partnerId.equals(user._id)) {
      return res.status(400).json({ error: "You are not this user's partner" })
    }
    
    await Promise.all([
      user.updateOne({ partnerId: null }),
      partner.updateOne({ partnerId: null })
    ]);
    
    return res.status(200).json({ message: 'Successfully breaking up' });
  } catch (e: any) {
    next(e);
  }
});

export default router;