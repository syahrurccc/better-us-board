import type { Types } from "mongoose";
import type { Request } from "express";

import type { Category, Priority, Status } from "./constants";
import type { BoardDoc } from "../models/board.model";
import type { UserDoc } from "../models/user.model";

// TODO: FIX INTERFACES TYPES TO BE MORE GENERIC

interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardType extends Timestamps {
  name: string;
  userIds: (Types.ObjectId | UserDoc)[];
}

export interface CommentType extends Timestamps {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
}

export interface InviteType extends Timestamps {
  inviterId: Types.ObjectId | UserDoc;
  inviteeId: Types.ObjectId | UserDoc;
  status: "pending" | "accepted";
}

export interface ReflectionType extends Timestamps {
  ticketId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
}

export interface TicketType extends Timestamps {
  boardId: Types.ObjectId | BoardDoc;
  authorId: Types.ObjectId | UserDoc;
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
  partnerId: Types.ObjectId | UserDoc | null;
}

export type AuthedRequest<P = any> = Request<P> & { userId: string };