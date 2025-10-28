import type { NextFunction, Request, Response } from 'express';

const openPaths = new Set<string>([
  '/health',
  '/auth/register',
]);

export function devIdentity(req: Request, res: Response, next: NextFunction) {
  
  if (openPaths.has(req.path)) return next();

  const id = req.headers['x-user-id'];
  if (typeof id === 'string' && id.trim() !== '') {
    req.userId = id.trim();
    return next();
  }

  return res.status(401).json({
    error: 'Missing X-User-Id header (dev mode). Include a user id while DEV_FAKE_AUTH=true.',
  });
}
