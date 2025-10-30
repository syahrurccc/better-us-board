import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import authRouter from './routes/auth';
import boardRouter from './routes/board'
import connRouter from './routes/connections';
import healthRouter from './routes/health';
import notifRouter from './routes/notifications';
import renderRouter from './routes/render';
import ticketsRouter from './routes/tickets';
import { devIdentity } from './middlewares/dev';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/error';
import { env } from './config/env';

export function createApp() {
  const app = express();
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(helmet());
  app.use(morgan('dev'));
  
  if (env.DEV_FAKE_AUTH) {
    app.use(devIdentity);
  }
  
  app.use('/', renderRouter);
  app.use('/auth', authRouter);
  app.use('/board', boardRouter);
  app.use('/connections', connRouter);
  app.use('/health', healthRouter);
  app.use('/notifications', notifRouter);
  app.use('/tickets', ticketsRouter);
  
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

