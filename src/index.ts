import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRouter from './routes/auth';
import connRouter from './routes/connections';
import notifRouter from './routes/notifications';
import renderRouter from './routes/render';
import ticketsRouter from './routes/tickets';

const app = express();
const port: number = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await mongoose.connect('mongodb://127.0.0.1:27017/betterus')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', renderRouter);
app.use('/auth', authRouter);
app.use('/connections', connRouter);
app.use('/notifications', notifRouter);
app.use('/tickets', ticketsRouter);

app.listen(port);