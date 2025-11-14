import { Router } from "express";

import { Board } from "../models/board.model";
import { User } from "../models/user.model";
import { Invite } from "../models/invite.model";
import { boardNameSchema } from "../validations/zodSchemas";
import { requireAuth } from "../middlewares/requireAuth";
import { assertAuth, verifyBoardOwner } from "../utils/utils";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).lean().exec();
  if (!user) return res.status(401).json({ error: "No user found" });

  const inviteCount = await Invite.countDocuments({
    inviteeId: user._id,
    status: "pending",
  }).exec();

  if (!user.partnerId) {
    return res.status(200).json({
      username: user.name,
      inviteCount,
      board: null,
    });
  }

  let board = await Board.findOne({
    userIds: user._id,
  }).exec();

  if (!board)
    board = await Board.create({
      userIds: [user._id, user.partnerId],
    });

  return res.status(200).json({
    username: user.name,
    inviteCount,
    board,
  });
});

// This route updates the board name
router.post("/", requireAuth, async (req, res) => {
  assertAuth(req);
  const { boardId, boardName } = boardNameSchema.parse(req.body);

  const board = await Board.findById(boardId).exec();
  if (!board) return res.status(404).json({ error: "Board not found" });

  verifyBoardOwner(board, req.userId);

  await board.updateOne({ name: boardName }).exec();
  return res.status(200).json({ message: "Board name updated" });
});

export default router;
