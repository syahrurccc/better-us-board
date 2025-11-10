import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
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
    type: mongoose.SchemaTypes.ObjectId, 
    ref: 'User', 
    default: null 
  }
});

export const User = mongoose.model('User', userSchema);