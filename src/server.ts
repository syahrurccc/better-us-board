import { createApp } from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const { MONGODB_URI, PORT } = process.env;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing');
  } 
  
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
  
  const app = createApp();
  app.listen(Number(PORT) ?? 3000, function () {
    console.log(`Server listening on http://localhost:${process.env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
