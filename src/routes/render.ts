import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  console.log(req.cookies.jwt);
  return req.cookies.jwt ? res.render('board', { title: 'Board' }) : res.render('index', { title: 'Board' });
});

router.get('/login', (_req, res) => {
  return res.render('login', { title: 'Login' });
});

router.get('/register', (_req, res) => {
  return res.render('register', { title: 'Register' });
});

export default router;