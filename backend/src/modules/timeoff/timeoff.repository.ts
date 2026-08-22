/**
 * OWNER: Prajwal (Person D)
 * Data access for leave types, allocations, requests, public holidays.
 */
import { LeaveRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";

export const timeoffRepository = {
  listLeaveTypes(companyId: string) {
    return prisma.leaveType.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
  },

  findLeaveType(id: string, companyId: string) {
    return prisma.leaveType.findFirst({ where: { id, companyId } });
  },

  listAllocationsForEmployee(employeeId: string, year: number) {
    return prisma.leaveAllocation.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
      orderBy: { leaveType: { name: "asc" } },
    });
  },

  findAllocation(employeeId: string, leaveTypeId: string, year: number) {
    return prisma.leaveAllocation.findUnique({
      where: {
        employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
      },
      include: { leaveType: true },
    });
  },

  upsertAllocation(data: {
    employeeId: string;
    leaveTypeId: string;
    year: number;
    allocatedDays: number;
  }) {
    return prisma.leaveAllocation.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year: data.year,
        },
      },
      create: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        year: data.year,
        allocatedDays: data.allocatedDays,
        usedDays: 0,
      },
      update: { allocatedDays: data.allocatedDays },
      include: { leaveType: true, employee: true },
    });
  },

  listAllocations(params: {
    companyId: string;
    year?: number;
    employeeId?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.LeaveAllocationWhereInput = {
      employee: { user: { companyId: params.companyId } },
      ...(params.year != null ? { year: params.year } : {}),
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
    };
    return prisma.$transaction([
      prisma.leaveAllocation.count({ where }),
      prisma.leaveAllocation.findMany({
        where,
        include: {
          leaveType: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ year: "desc" }, { employee: { firstName: "asc" } }],
        skip: params.skip,
        take: params.take,
      }),
    ]);
  },

  createRequest(data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    days: number;
    reason?: string | null;
    attachmentUrl?: string | null;
  }) {
    return prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        reason: data.reason ?? null,
        attachmentUrl: data.attachmentUrl ?? null,
        status: LeaveRequestStatus.PENDING,
      },
      include: {
        leaveType: true,
        employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
      },
    });
  },

  findRequestById(id: string, companyId: string) {
    return prisma.leaveRequest.findFirst({
      where: { id, employee: { user: { companyId } } },
      include: {
        leaveType: true,
        employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
        approver: { select: { id: true, email: true, loginId: true } },
      },
    });
  },

  listMyRequests(employeeId: string, opts?: { year?: number }) {
    const year = opts?.year;
    const where = {
      employeeId,
      ...(year
        ? {
            startDate: { lte: new Date(Date.UTC(year, 11, 31)) },
            endDate: { gte: new Date(Date.UTC(year, 0, 1)) },
          }
        : {}),
    };
    return prisma.leaveRequest.findMany({
      where,
      include: { leaveType: true },
      orderBy: { startDate: "asc" },
    });
  },

  listRequests(params: {
    companyId: string;
    status?: LeaveRequestStatus;
    search?: string;
    skip: number;
    take: number;
  }) {
    const search = params.search?.trim();
    const where: Prisma.LeaveRequestWhereInput = {
      employee: {
        user: { companyId: params.companyId },
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      ...(params.status ? { status: params.status } : {}),
    };
    return prisma.$transaction([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        include: {
          leaveType: true,
          employee: { select: { id: true, firstName: true, lastName: true } },
          approver: { select: { id: true, loginId: true } },
        },
        orderBy: [{ status: "asc" }, { appliedAt: "desc" }],
        skip: params.skip,
        take: params.take,
      }),
    ]);
  },

  findOverlappingRequests(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ) {
    return prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  updateRequestStatus(
    id: string,
    data: {
      status: LeaveRequestStatus;
      approverId: string;
      approverComment?: string | null;
      decidedAt: Date;
    },
  ) {
    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: data.status,
        approverId: data.approverId,
        approverComment: data.approverComment ?? null,
        decidedAt: data.decidedAt,
      },
      include: {
        leaveType: true,
        employee: { select: { id: true, firstName: true, lastName: true, userId: true } },
      },
    });
  },

  incrementUsedDays(allocationId: string, days: number) {
    return prisma.leaveAllocation.update({
      where: { id: allocationId },
      data: { usedDays: { increment: days } },
    });
  },

  decrementUsedDays(allocationId: string, days: number) {
    return prisma.leaveAllocation.update({
      where: { id: allocationId },
      data: { usedDays: { decrement: days } },
    });
  },

  listPublicHolidays(companyId: string, year?: number) {
    return prisma.publicHoliday.findMany({
      where: {
        companyId,
        ...(year != null ? { year } : {}),
      },
      orderBy: { date: "asc" },
    });
  },

  listHolidayDatesInRange(companyId: string, start: Date, end: Date) {
    return prisma.publicHoliday.findMany({
      where: {
        companyId,
        date: { gte: start, lte: end },
      },
      select: { date: true },
    });
  },

  findEmployeeInCompany(employeeId: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id: employeeId, user: { companyId } },
      select: { id: true, userId: true, firstName: true, lastName: true },
    });
  },

  findEmployeeByUserId(userId: string) {
    return prisma.employee.findUnique({
      where: { userId },
      select: { id: true, userId: true, firstName: true, lastName: true },
    });
  },
};
