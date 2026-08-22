/**
 * OWNER: Prasanna (Person A) — audit log viewer (Phase 7).
 */
import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../common/db/prisma.js";
import { authMiddleware, rbacMiddleware, requirePasswordChanged } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { success } from "../../common/middleware/errorHandler.js";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const auditRouter = Router();

auditRouter.use(authMiddleware, requirePasswordChanged, rbacMiddleware(Role.ADMIN));

auditRouter.get("/", validate(querySchema, "query"), async (req, res, next) => {
  try {
    const { page, limit } = req.query as unknown as z.infer<typeof querySchema>;
    const companyId = req.user!.companyId;
    const [total, items] = await Promise.all([
      prisma.auditLog.count({
        where: { actor: { companyId } },
      }),
      prisma.auditLog.findMany({
        where: { actor: { companyId } },
        include: {
          actor: { select: { id: true, loginId: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return success(res, { items, page, limit, total });
  } catch (e) {
    return next(e);
  }
});
