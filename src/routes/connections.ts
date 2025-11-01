import { Router } from 'express';
import { z } from 'zod';

import { User, Invite, Board, objectId } from '../models/schema';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

const acceptBodySchema = z.object({ 
  inviteId: objectId,
  response: z.boolean
});

router.post('/invite', requireAuth, async (req, res, next) => {
  try {
    const inviter = await User.findById(req.userId).lean();
    if (!inviter) return res.status(404).json({ error: 'Inviter not found' });
    
    if (!inviter.partnerId) {
      return res.status(403).json({ error: 'You already have a partner' });
    }
    const inviteeEmail = objectId.parse(req.body.inviteeEmail);
   
    const invitee = await User.findOne({ email: inviteeEmail }).lean();
    if (!invitee) return res.status(404).json({ error: 'No user found.' });
    
    if (invitee.partnerId) {
      return res.status(403).json({ error: 'Invitee already have a partner' });
    }
    
    const exists = await Invite.exists({
      inviterId: req.userId,
      inviteeId: invitee._id,
    });
    if (exists) {
      return res.status(409).json({ error: 'An invite is already pending' });
    }
    
    const invite = await Invite.create({
      inviterId: req.userId,
      inviteeId: invitee._id,
    });
    
    return res.status(201).json(invite);
  } catch (e) {
    next(e);
  } 
});

router.get('/request', requireAuth, async (req, res, next) => {
  try {
    const invites = await Invite.find({ inviteeId: req.userId });
    return res.status(200).json({ invites });
  } catch (e: any) {
    next(e);
  }
});

router.post('/accept', requireAuth, async (req, res, next) => {
  try {
    const { inviteId, response } = acceptBodySchema.parse(req.body);
    
    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(400).json({ error: 'No invite found' });
    if (invite.status !== 'pending') {
      return res.status(409).json({ error: "Invite already accepted/rejected" });
    }
    
    if (!response) {
      await invite.deleteOne();
      return res.status(200).json({ message: 'Invite rejected' })
    }
    
    const inviterPartner = await User.findById(invite.inviterId).select('parnerId').lean();
    if (inviterPartner) {
      return res.status(409).json({ error: 'Inviter already has a parner' });
    }
    
    await Promise.all([
      Invite.findByIdAndUpdate(inviteId, { status: 'accepted' }),
      Invite.deleteMany({ inviteeId: [invite.inviterId, invite.inviteeId], status: 'pending' }),
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

router.post('/break', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Invalid user' })
    
    const partnerId = objectId.parse(req.body.partnerId);
    
    const partner = await User.findById(partnerId);
    if (!partner) return res.status(404).json({ error: 'Partner account does not exist' });
    
    if (!user.partnerId.equals(partnerId) || !partner.partnerId.equals(user._id)) {
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