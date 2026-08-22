/** OWNER: Nidhish (Person B) */
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { Role } from "@prisma/client";
import { authMiddleware, rbacMiddleware, requirePasswordChanged } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { env } from "../../common/config/env.js";
import { employeesController } from "./employees.controller.js";
import {
  bankDetailsSchema,
  certificationBodySchema,
  createEmployeeSchema,
  documentBodySchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  patchEmployeeSchema,
  patchMeSchema,
  resumeBodySchema,
  skillBodySchema,
} from "./employees.schema.js";

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

export const employeesRouter = Router();

employeesRouter.use(authMiddleware, requirePasswordChanged);

employeesRouter.get(
  "/",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(listEmployeesQuerySchema, "query"),
  employeesController.list,
);

employeesRouter.post(
  "/",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(createEmployeeSchema),
  employeesController.create,
);

employeesRouter.get("/me", employeesController.getMe);
employeesRouter.patch("/me", validate(patchMeSchema), employeesController.patchMe);

employeesRouter.get(
  "/:id",
  validate(employeeIdParamSchema, "params"),
  employeesController.getById,
);

employeesRouter.patch(
  "/:id",
  rbacMiddleware(Role.ADMIN, Role.HR),
  validate(employeeIdParamSchema, "params"),
  validate(patchEmployeeSchema),
  employeesController.patchById,
);

employeesRouter.post(
  "/:id/avatar",
  validate(employeeIdParamSchema, "params"),
  upload.single("avatar"),
  employeesController.uploadAvatar,
);

employeesRouter.get(
  "/:id/bank",
  validate(employeeIdParamSchema, "params"),
  employeesController.getBank,
);

employeesRouter.put(
  "/:id/bank",
  validate(employeeIdParamSchema, "params"),
  validate(bankDetailsSchema),
  employeesController.putBank,
);

employeesRouter.get(
  "/:id/skills",
  validate(employeeIdParamSchema, "params"),
  employeesController.listSkills,
);

employeesRouter.post(
  "/:id/skills",
  validate(employeeIdParamSchema, "params"),
  validate(skillBodySchema),
  employeesController.addSkill,
);

employeesRouter.get(
  "/:id/certifications",
  validate(employeeIdParamSchema, "params"),
  employeesController.listCertifications,
);

employeesRouter.post(
  "/:id/certifications",
  validate(employeeIdParamSchema, "params"),
  validate(certificationBodySchema),
  employeesController.addCertification,
);

employeesRouter.get(
  "/:id/documents",
  validate(employeeIdParamSchema, "params"),
  employeesController.listDocuments,
);

employeesRouter.post(
  "/:id/documents",
  validate(employeeIdParamSchema, "params"),
  validate(documentBodySchema),
  employeesController.addDocument,
);

employeesRouter.put(
  "/:id/resume",
  validate(employeeIdParamSchema, "params"),
  validate(resumeBodySchema),
  employeesController.putResume,
);
