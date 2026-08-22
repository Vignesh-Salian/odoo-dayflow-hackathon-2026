/**
 * OWNER: Prajwal (Person D)
 * HTTP handlers for leave / public holidays.
 */
import type { Request, Response, NextFunction } from "express";
import { success } from "../../common/middleware/errorHandler.js";
import { timeoffService } from "./timeoff.service.js";

export const timeoffController = {
  async listLeaveTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timeoffService.listLeaveTypes(req.user!.companyId);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async myAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const data = await timeoffService.myAllocations(req.user!.id, req.user!.companyId, year);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async listAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        year?: number;
        employeeId?: string;
        page: number;
        limit: number;
      };
      const data = await timeoffService.listAllocations(req.user!.companyId, q);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async createAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timeoffService.createAllocation(req.user!.companyId, req.body);
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const uploaded =
        req.file != null ? `/uploads/${req.file.filename}` : (req.body.attachmentUrl as string | undefined);
      const data = await timeoffService.createRequest(
        req.user!.id,
        req.user!.companyId,
        req.body,
        uploaded ?? null,
      );
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async myRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timeoffService.myRequests(req.user!.id);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as unknown as {
        status?: import("@prisma/client").LeaveRequestStatus;
        search?: string;
        page: number;
        limit: number;
      };
      const data = await timeoffService.listRequests(req.user!.companyId, q);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timeoffService.decideRequest(
        req.user!.companyId,
        req.user!.id,
        req.params.id as string,
        "APPROVED",
        req.body,
      );
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await timeoffService.decideRequest(
        req.user!.companyId,
        req.user!.id,
        req.params.id as string,
        "REJECTED",
        req.body,
      );
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async listPublicHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const data = await timeoffService.listPublicHolidays(req.user!.companyId, year);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },
};
