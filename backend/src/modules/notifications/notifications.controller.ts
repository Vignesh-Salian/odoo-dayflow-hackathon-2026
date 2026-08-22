/**
 * OWNER: Prajwal (Person D)
 * HTTP handlers for notifications.
 */
import type { Request, Response, NextFunction } from "express";
import { success } from "../../common/middleware/errorHandler.js";
import { notificationsService } from "./notifications.service.js";

export const notificationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        page: number;
        limit: number;
        unreadOnly?: boolean;
      };
      const data = await notificationsService.list(req.user!.id, q);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationsService.markRead(req.user!.id, req.params.id as string);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationsService.markAllRead(req.user!.id);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },
};
