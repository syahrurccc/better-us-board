import mongoose, { Schema } from "mongoose";

const boardSchema = new Schema({
  name: {
    type: String,
    default: 'Our Board'
  },
  userIds: [{
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true
});

boardSchema.index(
  { userIds: 1 }, 
  { unique: true }
);

export const Board = mongoose.model('Board', boardSchema);