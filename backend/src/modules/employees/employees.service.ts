/** OWNER: Nidhish (Person B) */
import { Role, TokenType } from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../common/config/env.js";
import type { AuthUser } from "../../common/middleware/auth.js";
import {
  generateOpaqueToken,
  generateTempPassword,
  hashPassword,
} from "../../common/utils/security.js";
import { generateLoginId } from "../auth/auth.service.js";
import { authRepository } from "../auth/auth.repository.js";
import { employeesRepository } from "./employees.repository.js";
import type {
  BankDetailsInput,
  CreateEmployeeInput,
  ListEmployeesQuery,
  PatchEmployeeInput,
  PatchMeInput,
} from "./employees.schema.js";

type PresenceStatus = "present" | "on_leave" | "absent" | "unknown";

function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isHrOrAdmin(role: Role) {
  return role === Role.ADMIN || role === Role.HR;
}

function assertCanAccessEmployee(actor: AuthUser, targetEmployeeId: string) {
  if (isHrOrAdmin(actor.role)) return;
  if (actor.employeeId !== targetEmployeeId) {
    throw new AppError(403, "FORBIDDEN", "You can only access your own profile");
  }
}

function toPublic(
  emp: NonNullable<Awaited<ReturnType<typeof employeesRepository.findById>>>,
) {
  return {
    id: emp.id,
    userId: emp.userId,
    firstName: emp.firstName,
    lastName: emp.lastName,
    phone: emp.phone,
    avatarUrl: emp.avatarUrl,
    jobPosition: emp.jobPosition,
    departmentId: emp.departmentId,
    department: emp.department,
    managerId: emp.managerId,
    manager: emp.manager,
    workLocation: emp.workLocation,
    dateOfJoining: emp.dateOfJoining,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    maritalStatus: emp.maritalStatus,
    nationality: emp.nationality,
    residingAddress: emp.residingAddress,
    personalEmail: emp.personalEmail,
    user: emp.user,
    bankDetails: emp.bankDetails,
    resume: emp.resume,
    skills: emp.skills,
    certifications: emp.certifications,
    documents: emp.documents,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  };
}

async function resolvePresence(employeeIds: string[]): Promise<Map<string, PresenceStatus>> {
  const today = startOfUtcDay();
  const map = new Map<string, PresenceStatus>();
  if (employeeIds.length === 0) return map;

  const [attendance, leaves] = await Promise.all([
    employeesRepository.findAttendanceToday(employeeIds, today),
    employeesRepository.findApprovedLeaveCovering(employeeIds, today),
  ]);

  const leaveSet = new Set(leaves.map((l) => l.employeeId));
  const attByEmp = new Map(attendance.map((a) => [a.employeeId, a]));

  for (const id of employeeIds) {
    if (leaveSet.has(id)) {
      map.set(id, "on_leave");
      continue;
    }
    const att = attByEmp.get(id);
    if (att?.checkIn && !att.checkOut) {
      map.set(id, "present");
    } else if (att?.status === "PRESENT" || att?.status === "HALF_DAY") {
      map.set(id, "present");
    } else {
      map.set(id, "absent");
    }
  }
  return map;
}

export const employeesService = {
  async create(actor: AuthUser, input: CreateEmployeeInput) {
    if (!isHrOrAdmin(actor.role)) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN or HR can create employees");
    }
    if (input.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN can create another ADMIN");
    }

    const email = input.email.toLowerCase();
    const existing = await authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "Email is already registered", {
        email: "Email is already registered",
      });
    }

    const company = await prisma.company.findUnique({ where: { id: actor.companyId } });
    if (!company) throw new AppError(404, "NOT_FOUND", "Company not found");

    if (input.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: input.departmentId, companyId: actor.companyId },
      });
      if (!dept) {
        throw new AppError(400, "INVALID_DEPARTMENT", "Department not found", {
          departmentId: "Invalid department",
        });
      }
    }

    if (input.managerId) {
      const mgr = await employeesRepository.findByIdInCompany(input.managerId, actor.companyId);
      if (!mgr) {
        throw new AppError(400, "INVALID_MANAGER", "Manager not found", {
          managerId: "Invalid manager",
        });
      }
    }

    const joinDate = new Date(input.dateOfJoining);
    joinDate.setUTCHours(0, 0, 0, 0);
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const created = await prisma.$transaction(async (tx) => {
      const loginId = await generateLoginId(
        tx,
        company.id,
        company.code,
        input.firstName,
        input.lastName,
        joinDate,
      );

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          loginId,
          email,
          passwordHash,
          role: input.role,
          mustChangePassword: true,
          emailVerified: false,
        },
      });

      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone?.trim() || null,
          jobPosition: input.jobPosition?.trim() || null,
          departmentId: input.departmentId ?? null,
          managerId: input.managerId ?? null,
          workLocation: input.workLocation?.trim() || null,
          dateOfJoining: joinDate,
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          maritalStatus: input.maritalStatus ?? null,
          nationality: input.nationality?.trim() || null,
          residingAddress: input.residingAddress?.trim() || null,
          personalEmail: input.personalEmail?.trim() || null,
        },
      });

      const leaveTypes = await tx.leaveType.findMany({ where: { companyId: company.id } });
      const year = joinDate.getUTCFullYear();
      if (leaveTypes.length > 0) {
        await tx.leaveAllocation.createMany({
          data: leaveTypes.map((lt) => ({
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year,
            allocatedDays: lt.defaultAllocation,
            usedDays: 0,
          })),
        });
      }

      return { user, employee };
    });

    const verifyToken = generateOpaqueToken();
    await authRepository.createToken({
      userId: created.user.id,
      token: verifyToken,
      type: TokenType.EMAIL_VERIFY,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    });

    console.info(
      `[employee-created] loginId=${created.user.loginId} email=${created.user.email} tempPassword=${tempPassword}`,
    );
    console.info(
      `[email-verify] ${env.APP_URL}/verify-email?token=${verifyToken} → ${created.user.email}`,
    );

    const full = await employeesRepository.findById(created.employee.id);
    return {
      employee: toPublic(full!),
      credentials: {
        loginId: created.user.loginId,
        tempPassword,
        mustChangePassword: true,
      },
      verifyEmailToken: env.NODE_ENV === "development" ? verifyToken : undefined,
    };
  },

  async list(actor: AuthUser, query: ListEmployeesQuery) {
    if (!isHrOrAdmin(actor.role)) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN or HR can list employees");
    }

    const { items, total } = await employeesRepository.listInCompany({
      companyId: actor.companyId,
      search: query.search,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const presence = await resolvePresence(items.map((e) => e.id));

    return {
      items: items.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        avatarUrl: e.avatarUrl,
        jobPosition: e.jobPosition,
        workLocation: e.workLocation,
        department: e.department,
        user: e.user,
        presenceStatus: presence.get(e.id) ?? "unknown",
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  },

  async getById(actor: AuthUser, id: string) {
    const emp = await employeesRepository.findByIdInCompany(id, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    assertCanAccessEmployee(actor, emp.id);
    return toPublic(emp);
  },

  async getMe(actor: AuthUser) {
    if (!actor.employeeId) {
      throw new AppError(404, "NOT_FOUND", "No employee profile linked to this user");
    }
    const emp = await employeesRepository.findById(actor.employeeId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    return toPublic(emp);
  },

  async patchById(actor: AuthUser, id: string, input: PatchEmployeeInput) {
    const emp = await employeesRepository.findByIdInCompany(id, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role)) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN or HR can edit other employees");
    }
    if (input.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN can assign ADMIN role");
    }

    if (input.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: input.departmentId, companyId: actor.companyId },
      });
      if (!dept) {
        throw new AppError(400, "INVALID_DEPARTMENT", "Department not found", {
          departmentId: "Invalid department",
        });
      }
    }
    if (input.managerId) {
      const manager = await employeesRepository.findByIdInCompany(
        input.managerId,
        actor.companyId,
      );
      if (!manager || manager.id === id) {
        throw new AppError(400, "INVALID_MANAGER", "Manager not found or invalid", {
          managerId: "Invalid manager",
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (input.role !== undefined || input.isActive !== undefined) {
        await tx.user.update({
          where: { id: emp.userId },
          data: {
            ...(input.role !== undefined ? { role: input.role } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
        });
      }

      return tx.employee.update({
        where: { id },
        data: {
          ...(input.firstName !== undefined ? { firstName: input.firstName.trim() } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.jobPosition !== undefined ? { jobPosition: input.jobPosition } : {}),
          ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
          ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
          ...(input.workLocation !== undefined ? { workLocation: input.workLocation } : {}),
          ...(input.dateOfJoining !== undefined ? { dateOfJoining: input.dateOfJoining } : {}),
          ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
          ...(input.gender !== undefined ? { gender: input.gender } : {}),
          ...(input.maritalStatus !== undefined ? { maritalStatus: input.maritalStatus } : {}),
          ...(input.nationality !== undefined ? { nationality: input.nationality } : {}),
          ...(input.residingAddress !== undefined ? { residingAddress: input.residingAddress } : {}),
          ...(input.personalEmail !== undefined
            ? { personalEmail: input.personalEmail || null }
            : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              loginId: true,
              email: true,
              role: true,
              isActive: true,
              mustChangePassword: true,
              emailVerified: true,
            },
          },
          department: { select: { id: true, name: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
          bankDetails: true,
          resume: true,
          skills: true,
          certifications: true,
          documents: true,
        },
      });
    });

    return toPublic(updated);
  },

  async patchMe(actor: AuthUser, input: PatchMeInput) {
    if (!actor.employeeId) {
      throw new AppError(404, "NOT_FOUND", "No employee profile linked to this user");
    }

    const updated = await employeesRepository.updateEmployee(actor.employeeId, {
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.residingAddress !== undefined ? { residingAddress: input.residingAddress } : {}),
      ...(input.personalEmail !== undefined ? { personalEmail: input.personalEmail || null } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.maritalStatus !== undefined ? { maritalStatus: input.maritalStatus } : {}),
      ...(input.nationality !== undefined ? { nationality: input.nationality } : {}),
    });

    return toPublic(updated);
  },

  async uploadAvatar(actor: AuthUser, employeeId: string, avatarUrl: string) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
      throw new AppError(403, "FORBIDDEN", "You can only update your own avatar");
    }
    return toPublic(await employeesRepository.updateAvatar(employeeId, avatarUrl));
  },

  async getBank(actor: AuthUser, employeeId: string) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    assertCanAccessEmployee(actor, emp.id);
    return (await employeesRepository.getBank(employeeId)) ?? null;
  },

  async putBank(actor: AuthUser, employeeId: string, input: BankDetailsInput) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
      throw new AppError(403, "FORBIDDEN", "You cannot edit another employee's bank details");
    }
    return employeesRepository.upsertBank(employeeId, input);
  },

  async listSkills(actor: AuthUser, employeeId: string) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    assertCanAccessEmployee(actor, emp.id);
    return employeesRepository.listSkills(employeeId);
  },

  async addSkill(actor: AuthUser, employeeId: string, name: string) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
      throw new AppError(403, "FORBIDDEN", "You cannot edit another employee's skills");
    }
    return employeesRepository.addSkill(employeeId, name.trim());
  },

  async listCertifications(actor: AuthUser, employeeId: string) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    assertCanAccessEmployee(actor, emp.id);
    return employeesRepository.listCertifications(employeeId);
  },

  async addCertification(
    actor: AuthUser,
    employeeId: string,
    data: { name: string; issuedBy?: string | null; year?: number | null },
  ) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
      throw new AppError(403, "FORBIDDEN", "You cannot edit another employee's certifications");
    }
    return employeesRepository.addCertification(employeeId, data);
  },

  async listDocuments(actor: AuthUser, employeeId: string) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    assertCanAccessEmployee(actor, emp.id);
    return employeesRepository.listDocuments(employeeId);
  },

  async addDocument(
    actor: AuthUser,
    employeeId: string,
    data: { docType: string; fileUrl: string },
  ) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
      throw new AppError(403, "FORBIDDEN", "You cannot upload documents for another employee");
    }
    return employeesRepository.addDocument({
      employeeId,
      docType: data.docType,
      fileUrl: data.fileUrl,
      uploadedByUserId: actor.id,
    });
  },

  async putResume(
    actor: AuthUser,
    employeeId: string,
    data: {
      about?: string | null;
      loveAboutJob?: string | null;
      interestsHobbies?: string | null;
    },
  ) {
    const emp = await employeesRepository.findByIdInCompany(employeeId, actor.companyId);
    if (!emp) throw new AppError(404, "NOT_FOUND", "Employee not found");
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
      throw new AppError(403, "FORBIDDEN", "You cannot edit another employee's resume");
    }
    return employeesRepository.upsertResume(employeeId, {
      about: data.about,
      loveAboutJob: data.loveAboutJob,
      interestsHobbies: data.interestsHobbies,
    });
  },
};
