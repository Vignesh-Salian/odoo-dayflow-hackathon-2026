import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, isAppError } from "../errors/AppError.js";

export function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data, error: null });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "form";
      fields[key] = issue.message;
    }
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "Validation failed", fields },
    });
  }

  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: { code: err.code, message: err.message, fields: err.fields },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    data: null,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    data: null,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
}
