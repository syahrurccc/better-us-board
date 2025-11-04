import mongoose, { Schema } from "mongoose";
import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
export const categories = ['communication', 'household', 'finance', 'wellbeing', 'other'] as const;
export const priorities = ['low', 'medium', 'high'] as const;
export const statuses = ['open', 'in_progress', 'needs_reflection', 'resolved'] as const;

const boardSchema = new Schema({
  name: { type: String, default: 'Our Board' },
  userIds: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
}, { timestamps: true })

boardSchema.index({ userIds: 1 }, { unique: true });

const commentSchema = new Schema({
  ticketId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Ticket', index: true },
  authorId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  body: String,
}, { timestamps: true });

const inviteSchema = new Schema({
  inviterId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  inviteeId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', index: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
}, { timestamps: true });

const ticketSchema = new Schema({
  boardId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Board', index: true },
  authorId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
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
  archived: { type: Boolean, default: false }
}, { timestamps: true });

ticketSchema.index({ boardId: 1, status: 1 });
ticketSchema.index({ boardId: 1, priority: 1 });
ticketSchema.index({ boardId: 1, category: 1 });

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true},
  partnerId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null }
});

export const Board = mongoose.model('Board', boardSchema);
export const Comment = mongoose.model('Comment', commentSchema);
export const Invite = mongoose.model('Invite', inviteSchema)
export const Ticket = mongoose.model('Ticket', ticketSchema);
export const User = mongoose.model('User', userSchema);