import { Prisma, Role, TokenType } from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../common/config/env.js";
import {
  companyCodeFromName,
  generateOpaqueToken,
  hashPassword,
  signAccessToken,
  verifyPassword,
} from "../../common/utils/security.js";
import { authRepository } from "./auth.repository.js";
import type {
  ChangePasswordInput,
  CompanySignupInput,
  LoginInput,
} from "./auth.schema.js";

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function addHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Atomic login-id generation per Build Plan §5.1 */
export async function generateLoginId(
  tx: Prisma.TransactionClient,
  companyId: string,
  companyCode: string,
  firstName: string,
  lastName: string,
  joinDate: Date,
): Promise<string> {
  const year = joinDate.getFullYear();
  const counter = await tx.employeeSerialCounter.upsert({
    where: { companyId_year: { companyId, year } },
    create: { companyId, year, lastSerial: 1 },
    update: { lastSerial: { increment: 1 } },
  });

  const fn = firstName.slice(0, 2).toUpperCase().padEnd(2, "X");
  const ln = lastName.slice(0, 2).toUpperCase().padEnd(2, "X");
  const serial = String(counter.lastSerial).padStart(4, "0");
  return `${companyCode.toUpperCase()}${fn}${ln}${year}${serial}`;
}

async function issueTokens(user: {
  id: string;
  companyId: string;
  role: Role;
  mustChangePassword: boolean;
}) {
  const accessToken = signAccessToken({
    sub: user.id,
    companyId: user.companyId,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
  const refreshToken = generateOpaqueToken();

  await authRepository.revokeUserTokens(user.id, TokenType.REFRESH);
  await authRepository.createToken({
    userId: user.id,
    token: refreshToken,
    type: TokenType.REFRESH,
    expiresAt: addDays(7),
  });

  return { accessToken, refreshToken };
}

function publicUser(user: {
  id: string;
  email: string;
  loginId: string;
  role: Role;
  mustChangePassword: boolean;
  emailVerified: boolean;
  companyId: string;
  employee?: { id: string; firstName: string; lastName: string } | null;
  company?: { id: string; name: string; code: string; logoUrl: string | null } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    loginId: user.loginId,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    emailVerified: user.emailVerified,
    companyId: user.companyId,
    employeeId: user.employee?.id ?? null,
    firstName: user.employee?.firstName ?? null,
    lastName: user.employee?.lastName ?? null,
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          code: user.company.code,
          logoUrl: user.company.logoUrl,
        }
      : undefined,
  };
}

export const authService = {
  async companySignup(input: CompanySignupInput, logoUrl?: string | null) {
    const email = input.email.toLowerCase();
    const existing = await authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "Email is already registered", {
        email: "Email is already registered",
      });
    }

    const code = companyCodeFromName(input.companyName);
    const passwordHash = await hashPassword(input.password);
    const joinDate = new Date();
    joinDate.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.companyName.trim(),
          code,
          country: input.country?.trim() || null,
          logoUrl: logoUrl ?? null,
        },
      });

      const loginId = await generateLoginId(
        tx,
        company.id,
        code,
        input.adminFirstName,
        input.adminLastName,
        joinDate,
      );

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          loginId,
          email,
          passwordHash,
          role: Role.ADMIN,
          mustChangePassword: false,
          emailVerified: false,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          firstName: input.adminFirstName.trim(),
          lastName: input.adminLastName.trim(),
          dateOfJoining: joinDate,
          phone: input.phone?.trim() || null,
        },
      });

      // Default leave types for the company
      await tx.leaveType.createMany({
        data: [
          {
            companyId: company.id,
            name: "Paid Time Off",
            code: "PTO",
            isPaid: true,
            requiresAttachment: false,
            defaultAllocation: 24,
            color: "#22c55e",
          },
          {
            companyId: company.id,
            name: "Sick Leave",
            code: "SICK",
            isPaid: true,
            requiresAttachment: true,
            defaultAllocation: 7,
            color: "#ef4444",
          },
          {
            companyId: company.id,
            name: "Unpaid Leave",
            code: "UNPAID",
            isPaid: false,
            requiresAttachment: false,
            defaultAllocation: 999,
            color: "#94a3b8",
          },
        ],
      });

      return { company, user, employee };
    });

    const verifyToken = generateOpaqueToken();
    await authRepository.createToken({
      userId: result.user.id,
      token: verifyToken,
      type: TokenType.EMAIL_VERIFY,
      expiresAt: addDays(2),
    });

    // Phase 1: log verification link (email service later)
    console.info(
      `[email-verify] ${env.APP_URL}/verify-email?token=${verifyToken} → ${result.user.email}`,
    );

    const tokens = await issueTokens({
      id: result.user.id,
      companyId: result.company.id,
      role: result.user.role,
      mustChangePassword: result.user.mustChangePassword,
    });

    return {
      ...tokens,
      mustChangePassword: false,
      user: publicUser({
        ...result.user,
        employee: result.employee,
        company: result.company,
      }),
      verifyEmailToken: env.NODE_ENV === "development" ? verifyToken : undefined,
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByIdentifier(input.identifier);
    if (!user || !user.isActive) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid login ID/email or password");
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid login ID/email or password");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await issueTokens({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword,
      user: publicUser(user),
    };
  },

  async refresh(refreshToken: string) {
    const stored = await authRepository.findValidToken(refreshToken, TokenType.REFRESH);
    if (!stored) {
      throw new AppError(401, "INVALID_REFRESH", "Invalid or expired refresh token");
    }

    await authRepository.markTokenUsed(stored.id);
    const user = await authRepository.findUserById(stored.userId);
    if (!user || !user.isActive) {
      throw new AppError(401, "UNAUTHORIZED", "User not found or inactive");
    }

    const tokens = await issueTokens({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword,
      user: publicUser(user),
    };
  },

  async verifyEmail(token: string) {
    const record = await authRepository.findValidToken(token, TokenType.EMAIL_VERIFY);
    if (!record) {
      throw new AppError(400, "INVALID_TOKEN", "Invalid or expired verification token");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.token.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return { emailVerified: true };
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

    const ok = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect", {
        currentPassword: "Current password is incorrect",
      });
    }

    const passwordHash = await hashPassword(input.newPassword);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
      include: { employee: true, company: true },
    });

    await authRepository.revokeUserTokens(userId, TokenType.REFRESH);
    const tokens = await issueTokens({
      id: updated.id,
      companyId: updated.companyId,
      role: updated.role,
      mustChangePassword: false,
    });

    return {
      ...tokens,
      mustChangePassword: false,
      user: publicUser(updated),
    };
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email.toLowerCase());
    // Always succeed to avoid email enumeration
    if (!user) return { sent: true };

    await authRepository.revokeUserTokens(user.id, TokenType.PASSWORD_RESET);
    const token = generateOpaqueToken();
    await authRepository.createToken({
      userId: user.id,
      token,
      type: TokenType.PASSWORD_RESET,
      expiresAt: addHours(2),
    });

    console.info(`[password-reset] ${env.APP_URL}/reset-password?token=${token} → ${user.email}`);
    return {
      sent: true,
      resetToken: env.NODE_ENV === "development" ? token : undefined,
    };
  },

  async resetPassword(token: string, newPassword: string) {
    const record = await authRepository.findValidToken(token, TokenType.PASSWORD_RESET);
    if (!record) {
      throw new AppError(400, "INVALID_TOKEN", "Invalid or expired reset token");
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      prisma.token.update({ where: { id: record.id }, data: { used: true } }),
    ]);
    await authRepository.revokeUserTokens(record.userId, TokenType.REFRESH);

    return { reset: true };
  },

  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
    return publicUser(user);
  },

  async updateCompanyLogo(userId: string, logoUrl: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
    if (user.role !== Role.ADMIN) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN can update the company logo");
    }
    await prisma.company.update({
      where: { id: user.companyId },
      data: { logoUrl },
    });
    const refreshed = await authRepository.findUserById(userId);
    if (!refreshed) throw new AppError(404, "NOT_FOUND", "User not found");
    return publicUser(refreshed);
  },
};
