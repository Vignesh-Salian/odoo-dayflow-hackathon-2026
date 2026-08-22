/**
 * OWNER: Prajwal (Person D)
 * Zod schemas for leave types, allocations, requests, holidays.
 */
import { z } from "zod";
import { LeaveRequestStatus } from "@prisma/client";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const leaveRequestCreateSchema = z
  .object({
    leaveTypeId: z.string().uuid("Invalid leave type"),
    startDate: dateOnly,
    endDate: dateOnly,
    reason: z.string().max(2000).optional(),
    attachmentUrl: z.union([z.string().url(), z.literal("")]).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const leaveDecisionSchema = z.object({
  comment: z.string().max(2000).optional(),
});

export const leaveAllocationCreateSchema = z.object({
  employeeId: z.string().uuid("Invalid employee"),
  leaveTypeId: z.string().uuid("Invalid leave type"),
  year: z.coerce.number().int().min(2000).max(2100),
  allocatedDays: z.coerce.number().min(0).max(999),
});

export const leaveRequestsQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.nativeEnum(LeaveRequestStatus).optional()),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const leaveAllocationsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  employeeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const publicHolidaysQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const myLeaveRequestsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>;
export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;
export type LeaveAllocationCreateInput = z.infer<typeof leaveAllocationCreateSchema>;
export type MyLeaveRequestsQuery = z.infer<typeof myLeaveRequestsQuerySchema>;
