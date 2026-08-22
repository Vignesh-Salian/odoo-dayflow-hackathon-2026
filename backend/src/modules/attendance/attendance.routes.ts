/**
 * OWNER: Vignesh (Person C)
 * Mounted at /api/v1/attendance (Build Plan §7).
 */
import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  rbacMiddleware,
  requirePasswordChanged,
} from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { attendanceController } from "./attendance.controller.js";
import {
  dayViewQuerySchema,
  monthlyMeQuerySchema,
  regularizeDecisionSchema,
  regularizeIdParamSchema,
  regularizeSchema,
} from "./attendance.schema.js";

export const attendanceRouter = Router();

attendanceRouter.use(authMiddleware, requirePasswordChanged);

attendanceRouter.post("/check-in", attendanceController.checkIn);
attendanceRouter.post("/check-out", attendanceController.checkOut);

attendanceRouter.get(
  "/me",
  validate(monthlyMeQuerySchema, "query"),
  attendanceController.me,
);

attendanceRouter.get(
  "/",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(dayViewQuerySchema, "query"),
  attendanceController.dayView,
);

attendanceRouter.post(
  "/regularize",
  validate(regularizeSchema),
  attendanceController.regularize,
);

attendanceRouter.patch(
  "/regularize/:id/decision",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(regularizeIdParamSchema, "params"),
  validate(regularizeDecisionSchema),
  attendanceController.decideRegularization,
);
