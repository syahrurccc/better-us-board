import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  return res.render('index');
});

router.get('/login', (_req, res) => {
  return res.render('login');
});

router.get('/register', (_req, res) => {
  return res.render('register');
});

export default router;