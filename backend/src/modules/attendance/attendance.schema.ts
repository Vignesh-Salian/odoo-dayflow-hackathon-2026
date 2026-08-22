/**
 * OWNER: Vignesh (Person C)
 * Zod schemas for attendance check-in/out, monthly/day views, regularization.
 */
import { z } from "zod";
import { ApprovalStatus } from "@prisma/client";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const isoDateTime = z
  .string()
  .min(1, "Date-time is required")
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date-time" });

export const monthlyMeQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const dayViewQuerySchema = z.object({
  date: dateOnly,
  search: z.string().optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const regularizeSchema = z
  .object({
    date: dateOnly,
    requestedCheckIn: isoDateTime,
    requestedCheckOut: isoDateTime,
    reason: z.string().min(3, "Reason is required").max(2000),
  })
  .refine((d) => new Date(d.requestedCheckOut) > new Date(d.requestedCheckIn), {
    message: "Check-out must be after check-in",
    path: ["requestedCheckOut"],
  });

export const regularizeDecisionSchema = z.object({
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  comment: z.string().max(2000).optional(),
});

export const regularizeIdParamSchema = z.object({
  id: z.string().uuid("Invalid regularization id"),
});

export type MonthlyMeQuery = z.infer<typeof monthlyMeQuerySchema>;
export type DayViewQuery = z.infer<typeof dayViewQuerySchema>;
export type RegularizeInput = z.infer<typeof regularizeSchema>;
export type RegularizeDecisionInput = z.infer<typeof regularizeDecisionSchema>;
