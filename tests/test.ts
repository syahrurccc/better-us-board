import mongoose from "mongoose";
import { Board } from "../src/models/schema";

mongoose.connect('mongodb://127.0.0.1:27017/betterus');

async function run() {
  const board = await Board.create({
    name: 'Our Board',
    userIds: ['68ff2eaf96f205b777498594', '68ff2ebed2874c9aeab21350']
  })
  console.log(board);
}

run();