/**
 * OWNER: Vignesh (Person C)
 * Prisma access for attendance records + regularizations.
 */
import {
  AttendanceSource,
  type AttendanceStatus,
  type ApprovalStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";

export const attendanceRepository = {
  findEmployeeByUserId(userId: string) {
    return prisma.employee.findUnique({
      where: { userId },
      include: { user: { select: { id: true, companyId: true, isActive: true } } },
    });
  },

  findEmployeeInCompany(employeeId: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id: employeeId, user: { companyId } },
      include: { user: { select: { id: true, companyId: true, loginId: true } } },
    });
  },

  findRecord(employeeId: string, date: Date) {
    return prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
  },

  upsertRecord(data: {
    employeeId: string;
    date: Date;
    checkIn?: Date | null;
    checkOut?: Date | null;
    workHours?: number;
    extraHours?: number;
    breakMinutes?: number;
    status: AttendanceStatus;
    source?: AttendanceSource;
  }) {
    const { employeeId, date, ...rest } = data;
    return prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: {
        employeeId,
        date,
        checkIn: rest.checkIn ?? null,
        checkOut: rest.checkOut ?? null,
        workHours: rest.workHours ?? 0,
        extraHours: rest.extraHours ?? 0,
        breakMinutes: rest.breakMinutes ?? 0,
        status: rest.status,
        source: rest.source ?? AttendanceSource.SYSTEM,
      },
      update: {
        ...(rest.checkIn !== undefined ? { checkIn: rest.checkIn } : {}),
        ...(rest.checkOut !== undefined ? { checkOut: rest.checkOut } : {}),
        ...(rest.workHours !== undefined ? { workHours: rest.workHours } : {}),
        ...(rest.extraHours !== undefined ? { extraHours: rest.extraHours } : {}),
        ...(rest.breakMinutes !== undefined ? { breakMinutes: rest.breakMinutes } : {}),
        status: rest.status,
        ...(rest.source ? { source: rest.source } : {}),
      },
    });
  },

  listRecordsForEmployeeInRange(employeeId: string, start: Date, end: Date) {
    return prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    });
  },

  listCompanyEmployees(companyId: string, search: string, skip: number, take: number) {
    const where: Prisma.EmployeeWhereInput = {
      user: { companyId, isActive: true },
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { user: { loginId: { contains: search.toUpperCase(), mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    return Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        include: {
          user: { select: { loginId: true, role: true } },
          department: { select: { id: true, name: true } },
        },
      }),
    ]);
  },

  listRecordsForEmployeesOnDate(employeeIds: string[], date: Date) {
    if (employeeIds.length === 0) return Promise.resolve([]);
    return prisma.attendanceRecord.findMany({
      where: { employeeId: { in: employeeIds }, date },
    });
  },

  listApprovedLeavesCoveringDate(employeeIds: string[], date: Date) {
    if (employeeIds.length === 0) return Promise.resolve([]);
    return prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: "APPROVED",
        startDate: { lte: date },
        endDate: { gte: date },
      },
      select: { employeeId: true, startDate: true, endDate: true },
    });
  },

  listApprovedLeavesOverlappingRange(employeeId: string, start: Date, end: Date) {
    return prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { employeeId: true, startDate: true, endDate: true },
    });
  },

  listHolidaysInRange(companyId: string, start: Date, end: Date) {
    return prisma.publicHoliday.findMany({
      where: {
        companyId,
        date: { gte: start, lte: end },
      },
      select: { date: true, name: true },
    });
  },

  createRegularization(data: {
    employeeId: string;
    date: Date;
    requestedCheckIn: Date;
    requestedCheckOut: Date;
    reason: string;
  }) {
    return prisma.attendanceRegularization.create({ data });
  },

  findRegularizationById(id: string) {
    return prisma.attendanceRegularization.findUnique({
      where: { id },
      include: {
        employee: {
          include: { user: { select: { id: true, companyId: true } } },
        },
      },
    });
  },

  updateRegularizationStatus(
    id: string,
    status: ApprovalStatus,
    approverId: string,
  ) {
    return prisma.attendanceRegularization.update({
      where: { id },
      data: { status, approverId },
      include: {
        employee: {
          include: { user: { select: { id: true, companyId: true } } },
        },
      },
    });
  },

  countPresentOnDate(companyId: string, date: Date) {
    return prisma.attendanceRecord.count({
      where: {
        date,
        status: { in: ["PRESENT", "HALF_DAY"] },
        checkIn: { not: null },
        employee: { user: { companyId, isActive: true } },
      },
    });
  },
};
