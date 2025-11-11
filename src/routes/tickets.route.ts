import { Router, type Request } from "express";
import { z } from "zod";
import type { FilterQuery } from "mongoose";

import { Board } from "../models/board.model";
import { Comment } from "../models/comment.model";
import { Ticket } from "../models/ticket.model";
import { requireAuth } from "../middlewares/requireAuth";
import {
  ticketSchema,
  ticketPatchSchema,
  ticketQuerySchema,
  statuses,
  objectId,
} from "../utils/schemas.utils";

const router = Router();

async function findTicket(id: String) {
  const ticketId = objectId.parse(id);
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error("Ticket does not exists");
    (err as any).status = 404;
    throw err;
  }
  return ticket;
}

router.get("/", requireAuth, async (req, res, next) => {
  const board = await Board.findOne({ userIds: req.userId }).lean();
  if (!board) return res.status(404).json({ error: "User has no board" });

  const q = ticketQuerySchema.parse(req.query);

  const filter: FilterQuery<typeof Ticket> = { boardId: board._id };

  if (Object.keys(q).length === 0) {
    filter.status = { $in: statuses };
    filter.archived = false;
  } else {
    if (q.status)
      filter.status = q.status.length === 1 ? q.status[0] : { $in: q.status };
    if (q.priority)
      filter.priority =
        q.priority.length === 1 ? q.priority[0] : { $in: q.priority };
    if (q.category)
      filter.category =
        q.category.length === 1 ? q.category[0] : { $in: q.category };
    if (q.archived) filter.archived = q.archived;
  }

  const tickets = await Ticket.find(filter, {
    category: 0,
    description: 0,
    createdAt: 0,
  })
    .populate("authorId", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(tickets);
});

router.post("/", requireAuth, async (req, res, next) => {
  const board = await Board.findOne({ userIds: req.userId }).lean();
  if (!board) return res.status(303).redirect("/board");

  const ticket = ticketSchema.parse(req.body);

  if (board._id.toString() !== ticket.boardId) {
    return res.status(403).json({
      error: "Not authorized to send ticket to destined board",
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

  return res.status(201).json({ message: "Ticket created" });
});

router.get("/:id", requireAuth, async (req, res, next) => {
  const ticketId = objectId.parse(req.params.id);

  const ticket = await Ticket.findById(ticketId)
    .populate("authorId", "name")
    .lean();
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const isAuthor = ticket.authorId._id.toString() === req.userId;

  return res.status(200).json({ ticket, isAuthor });
});

router.patch(
  "/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    const ticket = await findTicket(req.params.id);

    if (ticket.authorId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this ticket" });
    }

    const data = ticketPatchSchema.parse(req.body);

    // This is a short-circuit evaluation
    // A && B → returns A if A is falsy, otherwise returns B.
    // A || B → returns A if A is truthy, otherwise returns B.
    // ...() → spreads object’s fields or skips false.
    const editedTicket = await ticket.updateOne(
      {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.priority && { priority: data.priority }),
        ...(data.archived && { archived: data.archived }),
      },
      { new: true },
    );

    return res.status(200).json(editedTicket);
  },
);

router.delete(
  "/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    const ticket = await findTicket(req.params.id);

    if (ticket.authorId.toString() !== req.userId) {
      return res.status(403).json({
        error: "Not authorized to delete this ticket",
      });
    }
    await ticket.deleteOne();

    res.status(200).json({ message: "Ticket deleted" });
  },
);

router.patch(
  "/:id/resolve",
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    const ticket = await findTicket(req.params.id);
    if (ticket.status === "resolved") {
      return res.status(409).json({ error: "Ticket is already resolved" });
    }
    await ticket.updateOne({ status: "needs_reflection" });
    return res.status(200).json({
      message: "Ticket needs reflection from both side to mark it as resolved",
    });
  },
);

router.patch(
  "/:id/archive",
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    const ticket = await findTicket(req.params.id);
    const unarchiving = ticket.archived === true;
    await ticket.updateOne({ archived: !ticket.archived });
    return res.status(200).json({
      message: unarchiving ? "Ticket is unarchived" : "Ticket is archived",
    });
  },
);

router.get(
  "/:id/comments",
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    const ticket = await findTicket(req.params.id);
    const page = z.coerce
      .number()
      .int()
      .positive()
      .default(1)
      .parse(req.query.page);

    const p = Math.max(1, page);
    const limit = 5;
    const filter: FilterQuery<typeof Comment> = { ticketId: ticket._id };

    const [items, total] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * limit)
        .limit(limit)
        .populate("authorId", "name")
        .lean(),
      Comment.countDocuments(filter),
    ]);

    return res.status(200).json({
      items,
      nextPage: p + 1,
      total: (total - (p * limit)),
      hasNextPage: p * limit < total,
    });
  },
);

router.post(
  "/:id/comments",
  requireAuth,
  async (req: Request<{ id: string }>, res, next) => {
    const ticket = await findTicket(req.params.id);

    const body = z.string().min(1).trim().parse(req.body.body);

    const comment = await Comment.create({
      ticketId: ticket._id,
      authorId: req.userId,
      body: body,
    });
    await comment.populate("authorId", "name");

    if (ticket.status === "open" && ticket.authorId.toString() !== req.userId) {
      await ticket.updateOne({ status: "in_progress" });
    }

    console.log(comment);
    res.status(201).json({ comment });
  },
);

export default router;
