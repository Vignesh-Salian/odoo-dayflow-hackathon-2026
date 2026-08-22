/**
 * OWNER: Nidhish (Person B)
 * COPY FROM BRANCH: reference/copy-from-here
 * PATH: backend/src/modules/employees/employees.routes.ts
 *
 * Placeholder router so main builds. Replace this entire file from the reference branch.
 */
import { Router } from "express";

export const employeesRouter = Router();

employeesRouter.use((_req, res) => {
  res.status(501).json({
    success: false,
    data: null,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Employees module (Nidhish) — copy implementation from reference/copy-from-here",
    },
  });
});
