import { Ticket } from "../models/ticket.model";
import { objectId } from "../validations/zodSchemas";

import { Types } from "mongoose";
import type { BoardDoc } from "../models/board.model";
import type { Request } from "express";
import type { TicketDoc } from "../models/ticket.model";
import type { AuthedRequest } from "../validations/interfaces";

export function assertAuth(req: Request): asserts req is AuthedRequest {
  if (!req.userId) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }
}

export async function verifyTicket(req: Request): Promise<TicketDoc> {
  const ticketId = objectId.parse(req.params.id);
  const ticket = await Ticket.findById(ticketId).populate("boardId", "userIds");
  if (!ticket) {
    const err = new Error("Ticket not found");
    (err as any).status = 404;
    throw err;
  }

  return ticket;
}

export function verifyBoardOwner(board: BoardDoc, userId: string) {
  const boardOwners = board.userIds as Types.ObjectId[];
  if (!boardOwners.some((id) => id.equals(userId))) {
    const err = new Error("User is not authorized to edit this board");
    (err as any).status = 403;
    throw err;
  }
}

export function verifyTicketAuthor(ticket: TicketDoc, userId: string): boolean {
  const author = ticket.authorId as Types.ObjectId;
  const isAuthor = author.equals(userId);
  if (!isAuthor) {
    const err = new Error("User is not authorized to modify this ticket");
    (err as any).status = 403;
    throw err;
  }

  return isAuthor;
}

export async function verifyReqAndTicket(
  req: Request,
): Promise<{ ticket: TicketDoc; isAuthor: boolean }> {
  assertAuth(req);
  const ticket = await verifyTicket(req);
  const isAuthor = verifyTicketAuthor(ticket, req.userId);
  verifyBoardOwner(ticket.boardId as BoardDoc, req.userId);

  return { ticket, isAuthor };
}
