import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.log(err.issues);
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues,
    });
  }

  const status = err?.status || 500;
  const message = err?.message || "Internal Server Error";

  res.status(status).json({ error: message });
}
