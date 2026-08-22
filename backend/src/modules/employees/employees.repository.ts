/** OWNER: Nidhish (Person B) */
import type { Prisma } from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";

const cardInclude = {
  user: { select: { id: true, loginId: true, email: true, role: true, isActive: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeInclude;

const fullInclude = {
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
} satisfies Prisma.EmployeeInclude;

export const employeesRepository = {
  findById(id: string) {
    return prisma.employee.findUnique({ where: { id }, include: fullInclude });
  },

  findByUserId(userId: string) {
    return prisma.employee.findUnique({ where: { userId }, include: fullInclude });
  },

  findByIdInCompany(id: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id, user: { companyId } },
      include: fullInclude,
    });
  },

  async listInCompany(opts: {
    companyId: string;
    search?: string;
    skip: number;
    take: number;
  }) {
    const search = opts.search?.trim();
    const where: Prisma.EmployeeWhereInput = {
      user: { companyId: opts.companyId },
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { jobPosition: { contains: search, mode: "insensitive" } },
              { user: { loginId: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: cardInclude,
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        skip: opts.skip,
        take: opts.take,
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, total };
  },

  findAttendanceToday(employeeIds: string[], date: Date) {
    return prisma.attendanceRecord.findMany({
      where: { employeeId: { in: employeeIds }, date },
    });
  },

  findApprovedLeaveCovering(employeeIds: string[], date: Date) {
    return prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: "APPROVED",
        startDate: { lte: date },
        endDate: { gte: date },
      },
      include: { leaveType: { select: { isPaid: true, code: true } } },
    });
  },

  upsertBank(
    employeeId: string,
    data: {
      accountNumber: string;
      bankName: string;
      ifscCode: string;
      panNo: string;
      uanNo: string;
      empCode: string;
    },
  ) {
    return prisma.bankDetails.upsert({
      where: { employeeId },
      create: { employeeId, ...data },
      update: data,
    });
  },

  getBank(employeeId: string) {
    return prisma.bankDetails.findUnique({ where: { employeeId } });
  },

  listSkills(employeeId: string) {
    return prisma.skill.findMany({ where: { employeeId }, orderBy: { name: "asc" } });
  },

  addSkill(employeeId: string, name: string) {
    return prisma.skill.create({ data: { employeeId, name } });
  },

  listCertifications(employeeId: string) {
    return prisma.certification.findMany({ where: { employeeId }, orderBy: { name: "asc" } });
  },

  addCertification(
    employeeId: string,
    data: { name: string; issuedBy?: string | null; year?: number | null },
  ) {
    return prisma.certification.create({
      data: {
        employeeId,
        name: data.name,
        issuedBy: data.issuedBy ?? null,
        year: data.year ?? null,
      },
    });
  },

  listDocuments(employeeId: string) {
    return prisma.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });
  },

  addDocument(data: {
    employeeId: string;
    docType: string;
    fileUrl: string;
    uploadedByUserId: string;
  }) {
    return prisma.document.create({ data });
  },

  upsertResume(
    employeeId: string,
    data: {
      about?: string | null;
      loveAboutJob?: string | null;
      interestsHobbies?: string | null;
    },
  ) {
    return prisma.resume.upsert({
      where: { employeeId },
      create: { employeeId, ...data },
      update: data,
    });
  },

  updateEmployee(id: string, data: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({
      where: { id },
      data,
      include: fullInclude,
    });
  },

  updateAvatar(id: string, avatarUrl: string) {
    return prisma.employee.update({
      where: { id },
      data: { avatarUrl },
      include: fullInclude,
    });
  },
};
