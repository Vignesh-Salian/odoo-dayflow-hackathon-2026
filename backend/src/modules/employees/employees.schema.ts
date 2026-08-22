/** OWNER: Nidhish (Person B) */
import { z } from "zod";
import { Gender, MaritalStatus, Role } from "@prisma/client";

const uuid = z.string().uuid("Invalid id");

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().default(""),
});

export const employeeIdParamSchema = z.object({
  id: uuid,
});

export const createEmployeeSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfJoining: z.coerce.date(),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  phone: z.string().optional(),
  jobPosition: z.string().optional(),
  departmentId: uuid.optional().nullable(),
  managerId: uuid.optional().nullable(),
  workLocation: z.string().optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  nationality: z.string().optional().nullable(),
  residingAddress: z.string().optional().nullable(),
  personalEmail: z.string().email().optional().nullable().or(z.literal("")),
});

export const patchEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  jobPosition: z.string().optional().nullable(),
  departmentId: uuid.optional().nullable(),
  managerId: uuid.optional().nullable(),
  workLocation: z.string().optional().nullable(),
  dateOfJoining: z.coerce.date().optional(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  nationality: z.string().optional().nullable(),
  residingAddress: z.string().optional().nullable(),
  personalEmail: z.string().email().optional().nullable().or(z.literal("")),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().optional().nullable(),
});

export const patchMeSchema = z.object({
  phone: z.string().optional().nullable(),
  residingAddress: z.string().optional().nullable(),
  personalEmail: z.string().email().optional().nullable().or(z.literal("")),
  avatarUrl: z.string().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  nationality: z.string().optional().nullable(),
});

export const bankDetailsSchema = z.object({
  accountNumber: z.string().min(1, "Account number is required"),
  bankName: z.string().min(1, "Bank name is required"),
  ifscCode: z.string().min(1, "IFSC is required"),
  panNo: z.string().min(1, "PAN is required"),
  uanNo: z.string().min(1, "UAN is required"),
  empCode: z.string().min(1, "Employee code is required"),
});

export const skillBodySchema = z.object({
  name: z.string().min(1, "Skill name is required"),
});

export const certificationBodySchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuedBy: z.string().optional().nullable(),
  year: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
});

export const documentBodySchema = z.object({
  docType: z.string().min(1, "Document type is required"),
  fileUrl: z.string().min(1, "File URL is required"),
});

export const resumeBodySchema = z.object({
  about: z.string().optional().nullable(),
  loveAboutJob: z.string().optional().nullable(),
  interestsHobbies: z.string().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type PatchEmployeeInput = z.infer<typeof patchEmployeeSchema>;
export type PatchMeInput = z.infer<typeof patchMeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
