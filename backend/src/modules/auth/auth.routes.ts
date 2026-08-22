import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { env } from "../../common/config/env.js";
import { authController } from "./auth.controller.js";
import {
  changePasswordSchema,
  companySignupSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schema.js";

const uploadDir = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.use(authLimiter);

authRouter.post(
  "/company-signup",
  upload.single("logo"),
  validate(companySignupSchema),
  authController.companySignup,
);

authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
authRouter.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword,
);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
authRouter.get("/me", authMiddleware, authController.me);
