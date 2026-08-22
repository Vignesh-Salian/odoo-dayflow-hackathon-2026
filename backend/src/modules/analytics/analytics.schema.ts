/**
 * OWNER: Vignesh (Person C)
 * Zod schemas for analytics dashboard query params.
 */
import { z } from "zod";

export const analyticsDashboardQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type AnalyticsDashboardQuery = z.infer<typeof analyticsDashboardQuerySchema>;
