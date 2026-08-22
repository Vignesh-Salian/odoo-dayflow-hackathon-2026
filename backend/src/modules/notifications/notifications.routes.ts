/**
 * OWNER: Prajwal (Person D)
 * Mount at `/api/v1` so paths match Build Plan §7:
 *   GET   /notifications
 *   PATCH /notifications/:id/read
 *   PATCH /notifications/read-all  (convenience)
 */
import { Router } from "express";
import { authMiddleware, requirePasswordChanged } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { notificationsController } from "./notifications.controller.js";
import {
  notificationIdParamsSchema,
  notificationsQuerySchema,
} from "./notifications.schema.js";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware, requirePasswordChanged);

notificationsRouter.get(
  "/notifications",
  validate(notificationsQuerySchema, "query"),
  notificationsController.list,
);

notificationsRouter.patch(
  "/notifications/read-all",
  notificationsController.markAllRead,
);

notificationsRouter.patch(
  "/notifications/:id/read",
  validate(notificationIdParamsSchema, "params"),
  notificationsController.markRead,
);
