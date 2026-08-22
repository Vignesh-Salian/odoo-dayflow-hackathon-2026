/** OWNER: Nidhish (Person B) */
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { success } from "../../common/middleware/errorHandler.js";
import { employeesService } from "./employees.service.js";

export const employeesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.list(req.user!, req.query as never);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.create(req.user!, req.body);
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.getMe(req.user!);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async patchMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.patchMe(req.user!, req.body);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.getById(req.user!, req.params.id as string);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async patchById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.patchById(req.user!, req.params.id as string, req.body);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, "VALIDATION_ERROR", "Avatar file is required", {
          avatar: "Avatar file is required",
        });
      }
      const avatarUrl = `/uploads/${req.file.filename}`;
      const data = await employeesService.uploadAvatar(
        req.user!,
        req.params.id as string,
        avatarUrl,
      );
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async getBank(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.getBank(req.user!, req.params.id as string);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async putBank(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.putBank(req.user!, req.params.id as string, req.body);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async listSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.listSkills(req.user!, req.params.id as string);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.addSkill(
        req.user!,
        req.params.id as string,
        req.body.name,
      );
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async listCertifications(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.listCertifications(req.user!, req.params.id as string);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async addCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.addCertification(
        req.user!,
        req.params.id as string,
        req.body,
      );
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.listDocuments(req.user!, req.params.id as string);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async addDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.addDocument(req.user!, req.params.id as string, req.body);
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async putResume(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await employeesService.putResume(req.user!, req.params.id as string, req.body);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },
};
