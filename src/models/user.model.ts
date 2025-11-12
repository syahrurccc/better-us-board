import { Schema, model, type HydratedDocument } from "mongoose";

import type { UserType } from "../validations/interfaces";

export type UserDoc = HydratedDocument<UserType>;

const userSchema = new Schema<UserType>({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  password: { 
    type: String, 
    required: true
  },
  partnerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }
});

export const User = model<UserType>("User", userSchema);