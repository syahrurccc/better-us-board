import type { Request } from "express";
import { Types, type FilterQuery } from "mongoose";

import type { AuthedRequest } from "../validations/interfaces";
import type { BoardDoc } from "../models/board.model";
import { objectId } from "../validations/zodSchemas";
import { Ticket, type TicketDoc } from "../models/ticket.model";
import type { TicketType } from "../validations/interfaces";
import { User } from "../models/user.model";

function throwErr(msg: string, code: number): never {
  const err = new Error("Unauthorized");
  (err as any).status = code;
  throw err;
}

export async function queryTickets(
  filter: FilterQuery<typeof Ticket>,
  p: number,
  limit: number,
): Promise<[TicketType[], number]> {
  const [tickets, total] = await Promise.all([
    Ticket.find(filter, {
      category: 0,
      description: 0,
      createdAt: 0,
    })
      .sort({ createdAt: -1 })
      .skip((p - 1) * limit)
      .limit(limit)
      .populate("authorId", "name")
      .lean()
      .exec(),
    Ticket.countDocuments(filter).exec(),
  ]);

  return [tickets as TicketType[], total];
}

export function assertAuth(req: Request): asserts req is AuthedRequest {
  if (!req.userId) throwErr("Unauthorized", 401);
}

export async function verifyTicket(req: Request): Promise<TicketDoc> {
  const ticketId = objectId.parse(req.params.id);
  const ticket = await Ticket.findById(ticketId)
    .populate("boardId", "userIds")
    .exec();
  
  if (!ticket) throwErr("Ticket not found", 404);

  return ticket;
}

export function verifyBoardOwner(board: BoardDoc, userId: string) {
  const boardOwners = board.userIds as Types.ObjectId[];
  if (!boardOwners.some((id) => id.equals(userId))) {
    throwErr("User is not authorized to edit this board", 403);
  }
}

export async function verifyTicketAuthor(
  ticket: TicketDoc, userId: string): Promise<boolean> {
  const author = await User.findById(ticket.authorId).lean().exec();
  if (!author) throwErr("User does not exist", 401);
  const partner = author.partnerId as Types.ObjectId;
  if (!partner) throwErr("User is not author's partner", 409);
  
  const isAuthor = author._id.equals(userId);
  const isPartner = partner.equals(userId);
  if (!isAuthor && !isPartner) {
    throwErr("User is not authorized to modify this ticket", 403);
  }

  return isAuthor;
}

export async function verifyReqAndTicket(
  req: Request,
): Promise<{ ticket: TicketDoc; isAuthor: boolean }> {
  assertAuth(req);
  const ticket = await verifyTicket(req);
  const isAuthor = await verifyTicketAuthor(ticket, req.userId);
  verifyBoardOwner(ticket.boardId as BoardDoc, req.userId);

  return { ticket, isAuthor };
}
