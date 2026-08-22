import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./common/config/env.js";
import { errorHandler, notFoundHandler } from "./common/middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { attendanceRouter } from "./modules/attendance/attendance.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { timeoffRouter } from "./modules/timeoff/timeoff.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { employeesRouter } from "./modules/employees/employees.routes.js";
import { payrollRouter } from "./modules/payroll/payroll.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" }, error: null });
  });

  app.use("/api/v1/auth", authRouter);

  // Person C — attendance + analytics
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/analytics", analyticsRouter);

  // Person D — leave + notifications (paths relative to /api/v1 per Build Plan §7)
  app.use("/api/v1", timeoffRouter);
  app.use("/api/v1", notificationsRouter);

  // Person B — employees + payroll
  app.use("/api/v1/employees", employeesRouter);
  app.use("/api/v1/payroll", payrollRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
