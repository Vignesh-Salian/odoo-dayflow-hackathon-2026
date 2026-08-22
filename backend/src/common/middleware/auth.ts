import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { AppError } from "../errors/AppError.js";
import { verifyAccessToken } from "../utils/security.js";

export type AuthUser = {
  id: string;
  companyId: string;
  role: Role;
  mustChangePassword: boolean;
  email: string;
  loginId: string;
  employeeId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header"));
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { employee: { select: { id: true } } },
    });

    if (!user || !user.isActive) {
      return next(new AppError(401, "UNAUTHORIZED", "User not found or inactive"));
    }

    req.user = {
      id: user.id,
      companyId: user.companyId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      email: user.email,
      loginId: user.loginId,
      employeeId: user.employee?.id ?? null,
    };
    return next();
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired access token"));
  }
}

export function rbacMiddleware(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "FORBIDDEN", "You do not have permission for this action"));
    }
    return next();
  };
}

/** Blocks API use until first-login password change (except change-password itself). */
export function requirePasswordChanged(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.mustChangePassword) {
    return next(
      new AppError(403, "MUST_CHANGE_PASSWORD", "You must change your password before continuing"),
    );
  }
  return next();
}
