/** OWNER: Nidhish (Person B) */
import { Router } from "express";
import { Role } from "@prisma/client";
import {
  authMiddleware,
  rbacMiddleware,
  requirePasswordChanged,
} from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { payrollController } from "./payroll.controller.js";
import {
  employeeIdParamSchema,
  generatePayslipsSchema,
  myPayslipsQuerySchema,
  payslipIdParamSchema,
  putCompanySalaryPolicySchema,
  putSalaryStructureSchema,
} from "./payroll.schema.js";

export const payrollRouter = Router();

payrollRouter.use(authMiddleware, requirePasswordChanged);

payrollRouter.get("/company-policy", payrollController.getCompanySalaryPolicy);
payrollRouter.put(
  "/company-policy",
  rbacMiddleware(Role.ADMIN),
  validate(putCompanySalaryPolicySchema, "body"),
  payrollController.putCompanySalaryPolicy,
);

payrollRouter.get(
  "/salary-structure/:employeeId",
  validate(employeeIdParamSchema, "params"),
  payrollController.getSalaryStructure,
);
payrollRouter.put(
  "/salary-structure/:employeeId",
  rbacMiddleware(Role.ADMIN),
  validate(employeeIdParamSchema, "params"),
  validate(putSalaryStructureSchema, "body"),
  payrollController.putSalaryStructure,
);
payrollRouter.post(
  "/payslips/generate",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(generatePayslipsSchema, "body"),
  payrollController.generatePayslips,
);
payrollRouter.get(
  "/payslips/me",
  validate(myPayslipsQuerySchema, "query"),
  payrollController.myPayslips,
);
payrollRouter.get(
  "/payslips/:id/pdf",
  validate(payslipIdParamSchema, "params"),
  payrollController.downloadPdf,
);

