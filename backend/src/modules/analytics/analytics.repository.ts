/**
 * OWNER: Vignesh (Person C) — Phase 8
 * PLACEHOLDER on `main`. Copy from reference:
 *   git show reference/copy-from-here:backend/src/modules/analytics/analytics.repository.ts > backend/src/modules/analytics/analytics.repository.ts
 */
import { prisma } from "../../common/db/prisma.js";

export const analyticsRepository = {
  countActiveEmployees(companyId: string) {
    return prisma.employee.count({
      where: { user: { companyId, isActive: true } },
    });
  },

  countPresentToday(companyId: string, date: Date) {
    return prisma.attendanceRecord.count({
      where: {
        date,
        checkIn: { not: null },
        status: { in: ["PRESENT", "HALF_DAY"] },
        employee: { user: { companyId, isActive: true } },
      },
    });
  },

  countPendingLeaveRequests(companyId: string) {
    return prisma.leaveRequest.count({
      where: { status: "PENDING", employee: { user: { companyId } } },
    });
  },

  countPendingRegularizations(companyId: string) {
    return prisma.attendanceRegularization.count({
      where: { status: "PENDING", employee: { user: { companyId } } },
    });
  },

  /** TODO: replace with aggregate() from reference/copy-from-here */
  async sumActiveMonthlyWages(companyId: string) {
    const rows = await prisma.salaryStructure.findMany({
      where: {
        isActive: true,
        employee: { user: { companyId, isActive: true } },
      },
      select: { monthlyWage: true },
    });
    return rows.reduce((sum, r) => sum + Number(r.monthlyWage), 0);
  },

  headcountByDepartment(companyId: string) {
    return prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true, _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });
  },

  async attendancePresentDaysInMonth(companyId: string, start: Date, end: Date) {
    return prisma.attendanceRecord.count({
      where: {
        date: { gte: start, lte: end },
        checkIn: { not: null },
        status: { in: ["PRESENT", "HALF_DAY"] },
        employee: { user: { companyId, isActive: true } },
      },
    });
  },

  async activeEmployeeCountForPct(companyId: string) {
    return prisma.employee.count({
      where: { user: { companyId, isActive: true } },
    });
  },
};
