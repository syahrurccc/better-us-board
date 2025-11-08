import mongoose, { Schema } from "mongoose";
import { categories, statuses, priorities } from "../utils/schemas";

const ticketSchema = new Schema({
  boardId: { 
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'Board', 
    index: true 
  },
  authorId: { 
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: null 
  },
  category: {
    type: String,
    enum: categories,
    required: true
  },
  priority: {
    type: String,
    enum: priorities,
    required: true
  },
  status: {
    type: String,
    enum: statuses,
    default: 'open'
  },
  archived: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

ticketSchema.index({ boardId: 1, status: 1 });
ticketSchema.index({ boardId: 1, priority: 1 });
ticketSchema.index({ boardId: 1, category: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);