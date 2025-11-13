import { Schema, model, type HydratedDocument } from "mongoose";

import type { BoardType } from "../validations/interfaces";

export type BoardDoc = HydratedDocument<BoardType>;

const boardSchema = new Schema<BoardType>(
  {
    name: {
      type: String,
      default: "Our Board",
    },
    userIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: (v: Schema.Types.ObjectId[]) => v.length <= 2,
          message: "A board can only have 2 users",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

boardSchema.index({ userIds: 1 }, { unique: true });

export const Board = model<BoardType>("Board", boardSchema);
