import { Router } from 'express';
import { env } from '../config/env';

const router = Router();

router.get('/', function (_req, res) {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

export default router;
