import { Schema, model, type HydratedDocument } from "mongoose";

import type { ReflectionType } from "../validations/interfaces";

export type ReflectionDoc = HydratedDocument<ReflectionType>;

const reflectionSchema = new Schema(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    body: String,
  },
  { timestamps: true },
);

reflectionSchema.index(
  {
    ticketId: 1,
    authorId: 1,
  },
  { unique: true },
);

export const Reflection = model<ReflectionType>("Reflection", reflectionSchema);
