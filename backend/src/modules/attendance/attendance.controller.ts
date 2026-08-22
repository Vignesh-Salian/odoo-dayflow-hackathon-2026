/**
 * OWNER: Vignesh (Person C)
 * HTTP handlers for attendance.
 */
import type { Request, Response, NextFunction } from "express";
import { success } from "../../common/middleware/errorHandler.js";
import { attendanceService } from "./attendance.service.js";
import type {
  DayViewQuery,
  MonthlyMeQuery,
  RegularizeDecisionInput,
} from "./attendance.schema.js";

export const attendanceController = {
  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.checkIn(req.user!);
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.checkOut(req.user!);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as MonthlyMeQuery;
      const data = await attendanceService.myMonthly(req.user!, query);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async dayView(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as DayViewQuery;
      const data = await attendanceService.dayView(req.user!, query);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async regularize(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.regularize(req.user!, req.body);
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async decideRegularization(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.decideRegularization(
        req.user!,
        req.params.id as string,
        req.body as RegularizeDecisionInput,
      );
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },
};
