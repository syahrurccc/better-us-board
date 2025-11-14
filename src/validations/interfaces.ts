import type { Types } from "mongoose";
import type { Request } from "express";

import type { Category, Priority, Status } from "./constants";
import type { TicketDoc } from "../models/ticket.model";
import type { UserDoc } from "../models/user.model";

interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardType extends Timestamps {
  name: string;
  userIds: (Types.ObjectId | UserType)[];
}

export interface CommentType extends Timestamps {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
}

export interface InviteType extends Timestamps {
  inviterId: Types.ObjectId | UserType;
  inviteeId: Types.ObjectId | UserType;
  status: "pending" | "accepted";
}

export interface ReflectionType extends Timestamps {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
}

export interface TicketType extends Timestamps {
  boardId: Types.ObjectId | BoardType;
  authorId: Types.ObjectId | UserType | UserDoc;
  title: string;
  description: string | null;
  category: Category;
  priority: Priority;
  status: Status;
  archived: boolean;
}

export interface UserType extends Document {
  name: string;
  email: string;
  password: string;
  partnerId: Types.ObjectId | UserType | null;
}

export type PaginatedTickets = {
  items: TicketType[];
  nextPage: number;
  total: number;
  hasNextPage: boolean;
};


export type AuthedRequest<P = any> = Request<P> & { userId: string };