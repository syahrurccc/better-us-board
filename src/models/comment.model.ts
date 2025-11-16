import { Schema, model, type HydratedDocument } from "mongoose";

import type { CommentType } from "../validations/interfaces";

export type CommentDoc = HydratedDocument<CommentType>;

const commentSchema = new Schema<CommentType>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    body: String,
  },
  { timestamps: true },
);

commentSchema.index({ ticketId: 1, createdAt: -1 });

export const Comment = model<CommentType>("Comment", commentSchema);
