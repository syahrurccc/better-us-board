import mongoose, { Schema } from "mongoose";

const inviteSchema = new Schema({
  inviterId: { 
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'User' 
  },
  inviteeId: { 
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'User', 
    index: true 
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
}, { timestamps: true });

export const Invite = mongoose.model('Invite', inviteSchema);