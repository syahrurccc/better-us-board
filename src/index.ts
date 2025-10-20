import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import apiRouter from './routes/api';
import renderRouter from './routes/render';

const app = express();
const port: number = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', renderRouter);
app.use('/auth',);
app.use('/connections',);
app.use('/tickets');
app.use('/notifications');

app.listen(port);