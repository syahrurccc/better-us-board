import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
  ticketId: { 
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'Ticket', 
    index: true },
  authorId: { 
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'User' 
  },
  body: String,
}, { timestamps: true });

export const Comment = mongoose.model('Comment', commentSchema);