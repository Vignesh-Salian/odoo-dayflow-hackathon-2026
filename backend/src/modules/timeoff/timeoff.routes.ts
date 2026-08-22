/**
 * OWNER: Prajwal (Person D)
 * COPY FROM BRANCH: reference/copy-from-here
 * PATH: backend/src/modules/timeoff/timeoff.routes.ts
 *
 * Placeholder router so main builds. Replace this entire file from the reference branch.
 */
import { Router } from "express";

export const timeoffRouter = Router();

timeoffRouter.use((_req, res) => {
  res.status(501).json({
    success: false,
    data: null,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Time-off module (Prajwal) — copy implementation from reference/copy-from-here",
    },
  });
});
