/** OWNER: Nidhish (Person B) */
import { z } from "zod";
import { ComputationType } from "@prisma/client";

const uuid = z.string().uuid("Invalid id");

export const employeeIdParamSchema = z.object({
  employeeId: uuid,
});

export const payslipIdParamSchema = z.object({
  id: uuid,
});

const componentSchema = z.object({
  name: z.string().min(1),
  computationType: z.nativeEnum(ComputationType),
  value: z.number().nullable().optional(),
  sequence: z.number().int().min(1),
});

export const putSalaryStructureSchema = z.object({
  monthlyWage: z.number().positive("Monthly wage must be positive"),
  workingDaysPerWeek: z.number().int().min(1).max(7).default(5),
  breakTimeHours: z.number().min(0).optional().nullable(),
  pfEmployeeRate: z.number().min(0).max(100).default(12),
  pfEmployerRate: z.number().min(0).max(100).default(12),
  professionalTax: z.number().min(0).default(200),
  effectiveFrom: z.coerce.date().optional(),
  components: z.array(componentSchema).optional(),
});

export const generatePayslipsSchema = z.object({
  employeeId: uuid.optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  overwrite: z.boolean().optional().default(false),
});

export const myPayslipsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const putCompanySalaryPolicySchema = z.object({
  pfEmployeeRate: z.number().min(0).max(100).default(12),
  pfEmployerRate: z.number().min(0).max(100).default(12),
  professionalTax: z.number().min(0).default(200),
  components: z.array(componentSchema).min(1, "At least one component required"),
});

export type PutSalaryStructureInput = z.infer<typeof putSalaryStructureSchema>;
export type GeneratePayslipsInput = z.infer<typeof generatePayslipsSchema>;
export type MyPayslipsQuery = z.infer<typeof myPayslipsQuerySchema>;
export type PutCompanySalaryPolicyInput = z.infer<typeof putCompanySalaryPolicySchema>;

