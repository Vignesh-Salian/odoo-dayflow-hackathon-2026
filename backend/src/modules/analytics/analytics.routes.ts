/**
 * OWNER: Vignesh (Person C)
 * Mounted at /api/v1/analytics (Build Plan §7).
 */
import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  rbacMiddleware,
  requirePasswordChanged,
} from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { analyticsController } from "./analytics.controller.js";
import { analyticsDashboardQuerySchema } from "./analytics.schema.js";

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware, requirePasswordChanged);

analyticsRouter.get(
  "/dashboard",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(analyticsDashboardQuerySchema, "query"),
  analyticsController.dashboard,
);
