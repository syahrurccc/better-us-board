import mongoose, { Schema } from "mongoose";

const boardSchema = new Schema({
  name: { type: String, default: 'Our Board' },
  userIds: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'User' }],
}, { timestamps: true })

const commentSchema = new Schema({
  ticketId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Ticket', index: true },
  authorId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  body: String,
}, { timestamps: true });

const inviteSchema = new Schema({
  inviterId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  inviteeEmail: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'open'
  },
}, { timestamps: true });

const ticketSchema = new Schema({
  boardId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Board', index: true },
  authorId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  assigneeId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null },
  description: String,
  category: {
    type: String,
    enum: ['communication', 'household', 'finance', 'wellbeing', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open'
  },
}, { timestamps: true });

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true},
  partnerId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', default: null }
});

export const Board = mongoose.model('Board', boardSchema);
export const Comment = mongoose.model('Comment', commentSchema);
export const Invite = mongoose.model('Invite', inviteSchema)
export const Ticket = mongoose.model('Ticket', ticketSchema);
export const User = mongoose.model('User', userSchema);