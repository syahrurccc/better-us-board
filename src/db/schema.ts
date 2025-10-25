import mongoose, { Schema, Model } from "mongoose";

const userSchema = new Schema({
  email: String,
  name: String,
  password: String,
  partnerId: mongoose.Types.ObjectId
})

const ticketSchema = new Schema({
  boardId: mongoose.Types.ObjectId,
  authorId: mongoose.Types.ObjectId,
  assigneeId: mongoose.Types.ObjectId,
  title: String,
  description: String,
  category: {
    type: String,
    enum: ['communication', 'household', 'finance', 'wellbeing', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
})

const commentSchema = new Schema({
  ticketId: mongoose.Types.ObjectId,
  authorId: mongoose.Types.ObjectId,
  body: String,
  createdAt: { type: Date, default: Date.now }
})