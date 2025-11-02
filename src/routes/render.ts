import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  return req.userId ? res.render('board', { title: 'Board' }) : res.render('index', { title: 'Board' });
});

router.get('/login', (_req, res) => {
  return res.render('login', { title: 'Login' });
});

router.get('/register', (_req, res) => {
  return res.render('register', { title: 'Register' });
});

export default router;