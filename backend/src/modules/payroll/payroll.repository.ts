/** OWNER: Nidhish (Person B) */
import type { Prisma } from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";

const structureInclude = {
  components: { orderBy: { sequence: "asc" as const } },
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      userId: true,
      user: { select: { companyId: true, loginId: true, email: true } },
    },
  },
} satisfies Prisma.SalaryStructureInclude;

const payslipInclude = {
  lines: true,
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      userId: true,
      user: { select: { companyId: true } },
    },
  },
} satisfies Prisma.PayslipInclude;

export const payrollRepository = {
  findActiveStructure(employeeId: string) {
    return prisma.salaryStructure.findFirst({
      where: { employeeId, isActive: true },
      include: structureInclude,
      orderBy: { effectiveFrom: "desc" },
    });
  },

  findEmployeeInCompany(employeeId: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id: employeeId, user: { companyId } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
        user: { select: { companyId: true } },
      },
    });
  },

  listActiveEmployeesInCompany(companyId: string) {
    return prisma.employee.findMany({
      where: { user: { companyId, isActive: true } },
      select: { id: true, firstName: true, lastName: true },
    });
  },

  deactivateStructures(employeeId: string, tx: Prisma.TransactionClient = prisma) {
    return tx.salaryStructure.updateMany({
      where: { employeeId, isActive: true },
      data: { isActive: false },
    });
  },

  createStructure(
    data: Prisma.SalaryStructureCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.salaryStructure.create({
      data,
      include: structureInclude,
    });
  },

  findPayslip(employeeId: string, month: number, year: number) {
    return prisma.payslip.findUnique({
      where: { employeeId_month_year: { employeeId, month, year } },
      include: payslipInclude,
    });
  },

  findPayslipById(id: string) {
    return prisma.payslip.findUnique({
      where: { id },
      include: payslipInclude,
    });
  },

  deletePayslip(id: string, tx: Prisma.TransactionClient = prisma) {
    return tx.payslip.delete({ where: { id } });
  },

  createPayslip(data: Prisma.PayslipCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.payslip.create({
      data,
      include: payslipInclude,
    });
  },

  updatePayslipPdf(id: string, pdfUrl: string) {
    return prisma.payslip.update({
      where: { id },
      data: { pdfUrl },
      include: payslipInclude,
    });
  },

  listPayslipsForEmployee(employeeId: string, skip: number, take: number) {
    return Promise.all([
      prisma.payslip.findMany({
        where: { employeeId },
        include: { lines: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip,
        take,
      }),
      prisma.payslip.count({ where: { employeeId } }),
    ]);
  },

  findAttendanceInRange(employeeId: string, start: Date, end: Date) {
    return prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: start, lte: end },
      },
    });
  },

  findApprovedLeavesInRange(employeeId: string, start: Date, end: Date) {
    return prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { leaveType: true },
    });
  },

  findHolidaysInRange(companyId: string, start: Date, end: Date) {
    return prisma.publicHoliday.findMany({
      where: {
        companyId,
        date: { gte: start, lte: end },
      },
    });
  },
};
