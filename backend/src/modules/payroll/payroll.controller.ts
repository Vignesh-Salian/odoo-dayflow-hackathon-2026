/** OWNER: Nidhish (Person B) */
import type { NextFunction, Request, Response } from "express";
import { success } from "../../common/middleware/errorHandler.js";
import { payrollService } from "./payroll.service.js";

export const payrollController = {
  async getSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await payrollService.getSalaryStructure(
        req.user!,
        req.params.employeeId as string,
      );
      return success(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async putSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await payrollService.putSalaryStructure(
        req.user!,
        req.params.employeeId as string,
        req.body,
      );
      return success(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async generatePayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await payrollService.generatePayslips(req.user!, req.body);
      return success(res, data, 201);
    } catch (error) {
      return next(error);
    }
  },

  async myPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await payrollService.myPayslips(req.user!, req.query as never);
      return success(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const file = await payrollService.pdfFile(req.user!, req.params.id as string);
      return res.download(file.filePath, file.fileName);
    } catch (error) {
      return next(error);
    }
  },

  async getCompanySalaryPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await payrollService.getCompanySalaryPolicy(req.user!);
      return success(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async putCompanySalaryPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await payrollService.putCompanySalaryPolicy(req.user!, req.body);
      return success(res, data);
    } catch (error) {
      return next(error);
    }
  },
};
