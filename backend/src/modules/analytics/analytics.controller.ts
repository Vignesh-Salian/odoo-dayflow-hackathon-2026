/**
 * OWNER: Vignesh (Person C)
 * HTTP handlers for analytics.
 */
import type { Request, Response, NextFunction } from "express";
import { success } from "../../common/middleware/errorHandler.js";
import { analyticsService } from "./analytics.service.js";
import type { AnalyticsDashboardQuery } from "./analytics.schema.js";

export const analyticsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as AnalyticsDashboardQuery;
      const data = await analyticsService.dashboard(req.user!.companyId, query);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },
};
