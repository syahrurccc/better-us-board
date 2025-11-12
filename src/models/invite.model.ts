import { Schema, model, type HydratedDocument } from "mongoose";

import type { InviteType } from "../validations/interfaces";

export type InviteDoc = HydratedDocument<InviteType>;

const inviteSchema = new Schema({
  inviterId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  inviteeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    index: true 
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending'
  },
}, { timestamps: true });

export const Invite = model<InviteType>('Invite', inviteSchema);