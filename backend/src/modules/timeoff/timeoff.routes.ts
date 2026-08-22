/**
 * OWNER: Prajwal (Person D)
 * Mount at `/api/v1` so paths match Build Plan §7:
 *   GET  /leave-types
 *   GET  /leave/allocations/me
 *   GET/POST /leave/allocations
 *   POST /leave/requests
 *   GET  /leave/requests/me
 *   GET  /leave/requests
 *   PATCH /leave/requests/:id/approve|reject
 *   GET  /public-holidays
 */
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { Role } from "@prisma/client";
import { env } from "../../common/config/env.js";
import {
  authMiddleware,
  rbacMiddleware,
  requirePasswordChanged,
} from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { timeoffController } from "./timeoff.controller.js";
import {
  leaveAllocationCreateSchema,
  leaveAllocationsQuerySchema,
  leaveDecisionSchema,
  leaveRequestCreateSchema,
  leaveRequestsQuerySchema,
  myLeaveRequestsQuerySchema,
  publicHolidaysQuerySchema,
} from "./timeoff.schema.js";

const uploadDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `leave-${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const timeoffRouter = Router();

timeoffRouter.use(authMiddleware, requirePasswordChanged);

timeoffRouter.get("/leave-types", timeoffController.listLeaveTypes);

timeoffRouter.get("/leave/allocations/me", timeoffController.myAllocations);

timeoffRouter.get(
  "/leave/allocations",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(leaveAllocationsQuerySchema, "query"),
  timeoffController.listAllocations,
);

timeoffRouter.post(
  "/leave/allocations",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(leaveAllocationCreateSchema),
  timeoffController.createAllocation,
);

timeoffRouter.post(
  "/leave/requests",
  upload.single("attachment"),
  validate(leaveRequestCreateSchema),
  timeoffController.createRequest,
);

timeoffRouter.get(
  "/leave/requests/me",
  validate(myLeaveRequestsQuerySchema, "query"),
  timeoffController.myRequests,
);

timeoffRouter.get(
  "/leave/requests",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(leaveRequestsQuerySchema, "query"),
  timeoffController.listRequests,
);

timeoffRouter.patch(
  "/leave/requests/:id/approve",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(leaveDecisionSchema),
  timeoffController.approve,
);

timeoffRouter.patch(
  "/leave/requests/:id/reject",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(leaveDecisionSchema),
  timeoffController.reject,
);

timeoffRouter.get(
  "/public-holidays",
  validate(publicHolidaysQuerySchema, "query"),
  timeoffController.listPublicHolidays,
);
