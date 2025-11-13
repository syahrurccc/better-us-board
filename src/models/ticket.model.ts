import { Schema, model, type HydratedDocument } from "mongoose";

import { categories, priorities, statuses } from "../validations/constants";
import type { TicketType } from "../validations/interfaces";

export type TicketDoc = HydratedDocument<TicketType>;

const ticketSchema = new Schema<TicketType>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      index: true,
      required: true
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: categories,
      required: true,
    },
    priority: {
      type: String,
      enum: priorities,
      required: true,
    },
    status: {
      type: String,
      enum: statuses,
      default: "open",
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

ticketSchema.index({ boardId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ boardId: 1, archived: 1, createdAt: -1 });

export const Ticket = model<TicketType>("Ticket", ticketSchema);
