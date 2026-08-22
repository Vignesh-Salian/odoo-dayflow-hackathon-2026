/**
 * OWNER: Prajwal (Person D)
 * Zod schemas for notifications.
 */
import { z } from "zod";

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().uuid(),
});
