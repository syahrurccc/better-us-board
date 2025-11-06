import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.log(err);
  if (err instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: err.issues
        });
      }
  
  const status = err?.status || 500;
  const message = err?.message || 'Internal Server Error';
  
  res.status(status).json({ error: message });
}