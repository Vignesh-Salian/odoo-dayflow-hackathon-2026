import type { Request, Response, NextFunction } from "express";
import { success } from "../../common/middleware/errorHandler.js";
import { authService } from "./auth.service.js";

export const authController = {
  async companySignup(req: Request, res: Response, next: NextFunction) {
    try {
      const logoUrl =
        req.file != null ? `/uploads/${req.file.filename}` : (req.body.logoUrl as string | undefined);
      const data = await authService.companySignup(req.body, logoUrl ?? null);
      return success(res, data, 201);
    } catch (e) {
      return next(e);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.login(req.body);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.refresh(req.body.refreshToken);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.verifyEmail(req.body.token);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.changePassword(req.user!.id, req.body);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.forgotPassword(req.body.email);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.resetPassword(req.body.token, req.body.newPassword);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.me(req.user!.id);
      return success(res, data);
    } catch (e) {
      return next(e);
    }
  },
};
