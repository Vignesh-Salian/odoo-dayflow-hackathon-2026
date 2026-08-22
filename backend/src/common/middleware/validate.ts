import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

/**
 * Express 5 exposes `req.query` / `req.params` as getter-only.
 * Replacing them with `req.query = …` throws; override via defineProperty instead.
 */
export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[part]);

    if (part === "body") {
      req.body = parsed as never;
    } else {
      Object.defineProperty(req, part, {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
}
