import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = (err as any)?.status || 500;
  const message = (err as any)?.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}