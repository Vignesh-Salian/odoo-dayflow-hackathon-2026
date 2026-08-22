/**
 * OWNER: Vignesh (Person C)
 * COPY FROM BRANCH: reference/copy-from-here
 * PATH: backend/src/modules/attendance/attendance.routes.ts
 *
 * Placeholder router so main builds. Replace this entire file from the reference branch.
 */
import { Router } from "express";

export const attendanceRouter = Router();

attendanceRouter.use((_req, res) => {
  res.status(501).json({
    success: false,
    data: null,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "Attendance module (Vignesh) — copy implementation from reference/copy-from-here",
    },
  });
});
