/**
 * OWNER: Vignesh (Person C)
 * COPY FROM BRANCH: reference/copy-from-here
 * PATH: backend/src/modules/analytics/analytics.routes.ts
 *
 * Placeholder router so main builds. Replace this entire file from the reference branch.
 */
import { Router } from "express";

export const analyticsRouter = Router();

analyticsRouter.use((_req, res) => {
  res.status(501).json({
    success: false,
    data: null,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Analytics module (Vignesh) — copy implementation from reference/copy-from-here",
    },
  });
});
