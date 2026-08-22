import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  APP_URL: z.string().default("http://localhost:5173"),
  EMAIL_FROM: z.string().default("Dayflow <noreply@dayflow.local>"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  UPLOAD_DIR: z.string().default("uploads"),
  /**
   * Optional demo override for "today" (YYYY-MM-DD, UTC).
   * Empty / unset = real calendar date. Use a weekday when demos fall on weekends.
   */
  DEMO_TODAY: z
    .string()
    .default("")
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "DEMO_TODAY must be YYYY-MM-DD or empty",
    }),
});

export const env = envSchema.parse(process.env);
