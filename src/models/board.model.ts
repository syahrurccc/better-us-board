import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import type { BoardType, UserType } from "../validations/interfaces";

export type BoardDoc = HydratedDocument<
  Omit<BoardType, "userIds"> & {
    userIds: (Types.ObjectId | UserType)[];
  }
>;

const boardSchema = new Schema<BoardType>(
  {
    name: {
      type: String,
      default: "Our Board",
    },
    userIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      validate: {
        validator: function (v: Schema.Types.ObjectId[]) {
          return v.length <= 2
        },
        message: "A board can only have 2 users",
      },
    },
  },
  {
    timestamps: true,
  },
);

boardSchema.index({ userIds: 1 }, { unique: true });

export const Board = model<BoardType>("Board", boardSchema);
