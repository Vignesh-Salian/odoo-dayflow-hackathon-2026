/**
 * OWNER: Nidhish (Person B)
 * COPY FROM BRANCH: reference/copy-from-here
 * PATH: backend/src/modules/payroll/payroll.routes.ts
 *
 * Placeholder router so main builds. Replace this entire file from the reference branch.
 */
import { Router } from "express";

export const payrollRouter = Router();

payrollRouter.use((_req, res) => {
  res.status(501).json({
    success: false,
    data: null,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Payroll module (Nidhish) — copy implementation from reference/copy-from-here",
    },
  });
});
