import { Router } from "express";
import { z } from "zod";

import { acceptBodySchema, objectId } from "../validations/zodSchemas";
import { Board } from "../models/board.model";
import { Invite } from "../models/invite.model";
import { Ticket } from "../models/ticket.model";
import { User } from "../models/user.model";
import { requireAuth } from "../middlewares/requireAuth";
import type { Types } from "mongoose";

const router = Router();

router.post("/invite", requireAuth, async (req, res) => {
  const inviter = await User.findById(req.userId).lean().exec();
  if (!inviter)
    return res.status(404).json({
      error: "Inviter is not registered",
    });

  if (inviter.partnerId) {
    return res.status(403).json({
      error: "You already have a partner",
    });
  }
  const inviteeEmail = z.email().parse(req.body.inviteeEmail);
  if (inviter.email === inviteeEmail) {
    return res.status(403).json({
      error: "Cannot invite yourself",
    });
  }

  const invitee = await User.findOne({
    email: inviteeEmail,
  })
    .lean()
    .exec();
  if (!invitee)
    return res.status(404).json({
      error: "No user found.",
    });

  if (invitee.partnerId) {
    return res.status(403).json({
      error: "Invitee already have a partner",
    });
  }

  const exists = await Invite.exists({
    inviterId: inviter._id,
    inviteeId: invitee._id,
  });
  if (exists) {
    return res.status(409).json({
      error: "An invite is already pending",
    });
  }

  await Invite.create({
    inviterId: req.userId,
    inviteeId: invitee._id,
  });

  return res.status(201).json({
    message: "Invite sent",
  });
});

router.get("/requests", requireAuth, async (req, res) => {
  const invites = await Invite.find({
    inviteeId: req.userId,
    status: "pending",
  })
    .populate("inviterId", "name")
    .lean()
    .exec();

  return res.status(200).json(invites);
});

router.post("/respond", requireAuth, async (req, res) => {
  const { inviteId, response } = acceptBodySchema.parse(req.body);

  const invite = await Invite.findById(inviteId).exec();
  if (!invite)
    return res.status(400).json({
      error: "No invite found",
    });

  if (invite.status !== "pending") {
    return res.status(409).json({
      error: "Invite already accepted/rejected",
    });
  }

  if (!response) {
    await invite.deleteOne().exec();
    return res.status(200).json({ message: "Invite rejected" });
  }

  const inviter = await User.findById(invite.inviterId)
    .select("partnerId")
    .lean()
    .exec();

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
    Invite.findByIdAndUpdate(inviteId, { status: "accepted" }).exec(),
    Invite.deleteMany({
      inviteeId: [invite.inviterId, invite.inviteeId],
      status: "pending",
    }).exec(),
    User.findByIdAndUpdate(invite.inviterId, {
      partnerId: invite.inviteeId,
    }).exec(),
    User.findByIdAndUpdate(invite.inviteeId, {
      partnerId: invite.inviterId,
    }).exec(),
  ]);

  await Board.create({
    name: "Our Board",
    userIds: [invite.inviterId, invite.inviteeId],
  });

  return res.status(202).json({
    message: "Invite accepted",
  });
});

router.post("/break", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).exec();
  if (!user)
    return res.status(401).json({
      error: "Invalid user",
    });

  const partnerId = objectId.parse(req.body.partnerId);

  const partner = await User.findById(partnerId).exec();
  if (!partner) {
    return res.status(404).json({
      error: "Partner account does not exist",
    });
  }

  const userP = user.partnerId as Types.ObjectId;
  const partnerP = partner.partnerId as Types.ObjectId;

  if (!userP.equals(partner._id) || !partnerP.equals(user._id)) {
    return res.status(400).json({
      error: "You are not this user's partner",
    });
  }

  const board = await Board.findOne({
    userIds: [user._id, partner._id],
  }).exec();
  if (!board)
    return res.status(404).json({
      error: "Board not found",
    });

  await Promise.all([
    board.deleteOne().exec(),
    Ticket.deleteMany({ boardId: board._id }).exec(),
    user.updateOne({ partnerId: null }).exec(),
    partner.updateOne({ partnerId: null }).exec(),
  ]);

  return res.status(200).json({
    message: "Successfully breaking up",
  });
});

export default router;
