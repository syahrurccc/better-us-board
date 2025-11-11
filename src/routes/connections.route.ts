import { Router } from "express";
import { z } from "zod";

import { acceptBodySchema, objectId } from "../utils/schemas.utils";
import { Board } from "../models/board.model";
import { User } from "../models/user.model";
import { Invite } from "../models/invite.model";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/invite", requireAuth, async (req, res, next) => {
  const inviter = await User.findById(req.userId).lean();
  if (!inviter) return res.status(404).json({ error: "Inviter not found" });

  if (inviter.partnerId) {
    return res.status(403).json({ error: "You already have a partner" });
  }
  const inviteeEmail = z.email().parse(req.body.inviteeEmail);
  if (inviter.email === inviteeEmail) {
    return res.status(403).json({ error: "Cannot invite yourself" });
  }

  const invitee = await User.findOne({ email: inviteeEmail }).lean();
  if (!invitee) return res.status(404).json({ error: "No user found." });

  if (invitee.partnerId) {
    return res.status(403).json({ error: "Invitee already have a partner" });
  }

  const exists = await Invite.exists({
    inviterId: req.userId,
    inviteeId: invitee._id,
  });
  if (exists) {
    return res.status(409).json({ error: "An invite is already pending" });
  }

  await Invite.create({
    inviterId: req.userId,
    inviteeId: invitee._id,
  });

  return res.status(201).json({ message: "Invite sent" });
});

router.get("/requests", requireAuth, async (req, res, next) => {
  const invites = await Invite.find({
    inviteeId: req.userId,
    status: "pending",
  })
    .populate("inviterId", "name")
    .lean();

  return res.status(200).json(invites);
});

router.post("/respond", requireAuth, async (req, res, next) => {
  const { inviteId, response } = acceptBodySchema.parse(req.body);

  const invite = await Invite.findById(inviteId);
  if (!invite) return res.status(400).json({ error: "No invite found" });

  if (invite.status !== "pending") {
    return res.status(409).json({
      error: "Invite already accepted/rejected",
    });
  }

  if (!response) {
    await invite.deleteOne();
    return res.status(200).json({ message: "Invite rejected" });
  }

  const inviter = await User.findById(invite.inviterId)
    .select("partnerId")
    .lean();

  if (!inviter)
    return res.status(409).json({
      error: "Inviter do not exists",
    });

  if (inviter.partnerId) {
    return res.status(409).json({
      error: "Inviter already has a partner",
    });
  }

  await Promise.all([
    Invite.findByIdAndUpdate(inviteId, { status: "accepted" }),
    Invite.deleteMany({
      inviteeId: [invite.inviterId, invite.inviteeId],
      status: "pending",
    }),
    User.findByIdAndUpdate(invite.inviterId, { partnerId: invite.inviteeId }),
    User.findByIdAndUpdate(invite.inviteeId, { partnerId: invite.inviterId }),
  ]);

  await Board.create({
    name: "Our Board",
    userIds: [invite.inviterId, invite.inviteeId],
  });

  return res.status(202).json({ message: "Invite accepted" });
});

router.post("/break", requireAuth, async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Invalid user" });

  const partnerId = objectId.parse(req.body.partnerId);

  const partner = await User.findById(partnerId);
  if (!partner)
    return res.status(404).json({ error: "Partner account does not exist" });

  if (
    !user.partnerId.equals(partnerId) ||
    !partner.partnerId.equals(user._id)
  ) {
    return res.status(400).json({ error: "You are not this user's partner" });
  }

  await Promise.all([
    user.updateOne({ partnerId: null }),
    partner.updateOne({ partnerId: null }),
  ]);

  return res.status(200).json({ message: "Successfully breaking up" });
});

export default router;
