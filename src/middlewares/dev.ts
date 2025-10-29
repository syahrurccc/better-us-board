import type { NextFunction, Request, Response } from 'express';

const DEFAULT_USER = "68ff2eaf96f205b777498594";

export function devIdentity(req: Request, _res: Response, next: NextFunction) {
  const id = req.headers['x-user-id'];

  req.userId =
    typeof id === 'string' && id.trim() !== ''
      ? id.trim()
      : DEFAULT_USER;

  next();
}

