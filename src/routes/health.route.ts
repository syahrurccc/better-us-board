import { Router } from 'express';

const router = Router();

router.get('/', function (_req, res) {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

export default router;
