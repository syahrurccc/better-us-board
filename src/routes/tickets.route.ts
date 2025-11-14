import { Router } from "express";
import { z } from "zod";
import type { FilterQuery, Types } from "mongoose";

import { Board } from "../models/board.model";
import { Comment } from "../models/comment.model";
import { Ticket, type TicketDoc } from "../models/ticket.model";
import { Reflection } from "../models/reflection.model";
import type { PaginatedTickets, TicketType } from "../validations/interfaces";
import { statuses, type Status } from "../validations/constants";
import { requireAuth } from "../middlewares/requireAuth";
import { assertAuth, queryTickets, verifyReqAndTicket } from "../utils/utils";
import {
  bodySchema,
  ticketSchema,
  ticketQuerySchema,
  ticketPatchSchema,
  pageQSchema,
} from "../validations/zodSchemas";
import type { UserDoc } from "../models/user.model";

const router = Router();
const LIMIT = 5;

// TODO: FINISH TICKET QUERYING
router.get("/", requireAuth, async (req, res) => {
  const board = await Board.findOne({
    userIds: req.userId,
  })
    .lean()
    .exec();
  if (!board)
    return res.status(404).json({
      error: "User has no board",
    });

  const q = ticketQuerySchema.parse(req.query);
  const noQuery = Object.keys(q).length === 0;
  const archive = q.archived ?? false;
  const page = pageQSchema.parse(req.query.page);

  const p = Math.max(1, page);
  const limit = LIMIT;

  const filter: FilterQuery<typeof Ticket> = {
    boardId: board._id,
    archived: archive,
  };

  /* What's happening here is that statuses const will be
   *  iterated over to check that: 1. Queried status exist
   *  on the list, and 2. If it does match one of the statuses
   *  it will check with XOR operator to make sure only one
   *  of the conditions is true. After that it will create promises of
   *  [status, items], then they all will be resolved on the
   *  line below which gets us the real tuple of [status, items].
   */
  const promises = statuses
    .filter((status) => (q.status === status) !== noQuery)
    .map(async (status) => {
      const statusFilter = { ...filter, status } as FilterQuery<typeof Ticket>;
      const [items, total] = await queryTickets(statusFilter, p, limit);
      return [status, items, total] as const;
    });

  const entries = await Promise.all(promises);

  const tickets: Partial<Record<Status, PaginatedTickets>> = {};
  for (const [status, items, total] of entries) {
    tickets[status] = {
      items,
      nextPage: p + 1,
      total: total - p * limit,
      hasNextPage: p * limit < total,
    };
  }

  res.status(200).json();
});

router.post("/", requireAuth, async (req, res) => {
  const board = await Board.findOne({
    userIds: req.userId,
  })
    .lean()
    .exec();
  if (!board)
    return res.status(404).json({
      error: "You don't have a board, yet. Try refreshing the page",
    });

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

  return res.status(201).json({
    message: "Ticket created",
  });
});

router.get("/:id", requireAuth, async (req, res) => {
  const { ticket, isAuthor } = await verifyReqAndTicket(req);
  await ticket.populate("authorId", "name");

  return res.status(200).json({ ticket, isAuthor });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  const data = await ticketPatchSchema.parseAsync(req.body);

  // This is a short-circuit evaluation
  // A && B → returns A if A is falsy, otherwise returns B.
  // A || B → returns A if A is truthy, otherwise returns B.
  // ...() → spreads object’s fields or skips false.
  const editedTicket = await ticket
    .updateOne(
      {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.priority && { priority: data.priority }),
        ...(data.archived && { archived: data.archived }),
      },
      { new: true },
    )
    .exec();

  return res.status(200).json(editedTicket);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  await Comment.find({
    ticketId: ticket._id,
  })
    .deleteMany()
    .exec();
  await ticket.deleteOne().exec();

  res.status(200).json({
    message: "Ticket deleted",
  });
});

router.patch("/:id/resolve", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  if (ticket.status === "resolved") {
    return res.status(409).json({
      error: "Ticket is already resolved",
    });
  }

  await ticket
    .updateOne({
      status: "needs_reflection",
    })
    .exec();
  return res.status(200).json({
    message: "Ticket needs reflection from both side to mark it as resolved",
  });
});

router.patch("/:id/archive", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  const unarchiving = ticket.archived === true;
  await ticket
    .updateOne({
      archived: !ticket.archived,
    })
    .exec();
  return res.status(200).json({
    message: unarchiving ? "Ticket is unarchived" : "Ticket is archived",
  });
});

router.get("/:id/comments", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  const page = pageQSchema.parse(req.query.page);

  const p = Math.max(1, page);
  const limit = LIMIT;
  const filter: FilterQuery<typeof Comment> = { ticketId: ticket._id };

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * limit)
      .limit(limit)
      .populate("authorId", "name")
      .lean()
      .exec(),
    Comment.countDocuments(filter).exec(),
  ]);

  return res.status(200).json({
    items,
    nextPage: p + 1,
    total: total - p * limit,
    hasNextPage: p * limit < total,
  });
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  const body = bodySchema.parse(req.body.body);

  const comment = await Comment.create({
    ticketId: ticket._id,
    authorId: req.userId,
    body,
  });
  await comment.populate("authorId", "name");

  const isOpen = ticket.status === "open";
  const fromPartner = !(ticket.authorId as UserDoc)._id.equals(req.userId);

  if (isOpen && fromPartner) {
    await ticket.updateOne({ status: "in_talks" }).exec();
  }

  console.log(comment);
  res.status(201).json({ comment });
});

router.post("/:id/reflect", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  const reflections = await Reflection.find({
    ticket: ticket._id,
  }).exec();

  res.status(200).json(reflections);
});

router.post("/:id/reflect", requireAuth, async (req, res) => {
  const { ticket } = await verifyReqAndTicket(req);

  if (ticket.status !== "needs_reflection") {
    return res.status(400).json({
      error: "The ticket is in the wrong status for writing reflections",
    });
  }

  const body = bodySchema.parse(req.body.body);

  const reflection = await Reflection.create({
    ticketId: ticket._id,
    authorId: req.userId,
    body,
  });
  await reflection.populate("authorId", "name");

  const reflections = await Reflection.countDocuments({
    ticketId: ticket._id,
  }).exec();
  if (reflections === 2) {
    await ticket.updateOne({ status: "resolved" });
    return res.status(201).json({
      message: "Reflection posted. Ticket has been resolved",
    });
  }

  return res.status(201).json({
    message: "Reflection posted. Need partner's reflection to resolve ticket",
  });
});

export default router;
