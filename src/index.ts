import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import authRouter from './routes/auth';
import renderRouter from './routes/render';
import connRouter from './routes/connections';
import ticketsRouter from './routes/tickets';
import notifRouter from './routes/notifications';

const app = express();
const port: number = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', renderRouter);
app.use('/auth', authRouter);
app.use('/connections', connRouter);
app.use('/tickets', ticketsRouter);
app.use('/notifications', notifRouter);

app.listen(port);