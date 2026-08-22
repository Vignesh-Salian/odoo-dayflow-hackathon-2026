/**
 * OWNER: Vignesh (Person C)
 * Analytics dashboard aggregates (Build Plan §7 / §9).
 */
import { analyticsRepository } from "./analytics.repository.js";
import type { AnalyticsDashboardQuery } from "./analytics.schema.js";
import { todayUtcDate, toDateKey } from "../attendance/attendance.service.js";

function monthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end };
}

function countWorkingDays(year: number, month: number): number {
  const { start, end } = monthBounds(year, month);
  let count = 0;
  const cur = new Date(start.getTime());
  while (cur.getTime() <= end.getTime()) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) count += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

export const analyticsService = {
  async dashboard(companyId: string, query: AnalyticsDashboardQuery) {
    const now = new Date();
    const month = query.month ?? now.getUTCMonth() + 1;
    const year = query.year ?? now.getUTCFullYear();
    const today = todayUtcDate();
    const { start, end } = monthBounds(year, month);

    const [
      headcount,
      presentToday,
      pendingLeaves,
      pendingRegularizations,
      payrollCostMonthly,
      departments,
      presentDaysInMonth,
    ] = await Promise.all([
      analyticsRepository.countActiveEmployees(companyId),
      analyticsRepository.countPresentToday(companyId, today),
      analyticsRepository.countPendingLeaveRequests(companyId),
      analyticsRepository.countPendingRegularizations(companyId),
      analyticsRepository.sumActiveMonthlyWages(companyId),
      analyticsRepository.headcountByDepartment(companyId),
      analyticsRepository.attendancePresentDaysInMonth(companyId, start, end),
    ]);

    const workingDays = countWorkingDays(year, month);
    const possiblePresentSlots = Math.max(1, headcount * workingDays);
    const attendancePct = Math.round((presentDaysInMonth / possiblePresentSlots) * 1000) / 10;

    const unassigned = Math.max(
      0,
      headcount - departments.reduce((s, d) => s + d._count.employees, 0),
    );

    return {
      asOf: toDateKey(today),
      period: { month, year },
      headcount,
      presentToday,
      pendingApprovals: {
        leaves: pendingLeaves,
        regularizations: pendingRegularizations,
        total: pendingLeaves + pendingRegularizations,
      },
      /** Stub until full payroll run cost is available — sum of active monthly wages. */
      payrollCost: {
        currency: "INR",
        monthlyStub: Math.round(payrollCostMonthly * 100) / 100,
        note: "Sum of active salary structure monthly wages (stub)",
      },
      attendance: {
        monthPresentDays: presentDaysInMonth,
        workingDays,
        percentage: attendancePct,
      },
      headcountByDepartment: [
        ...departments.map((d) => ({
          departmentId: d.id,
          name: d.name,
          count: d._count.employees,
        })),
        ...(unassigned > 0
          ? [{ departmentId: null as string | null, name: "Unassigned", count: unassigned }]
          : []),
      ],
      trends: {
        presentToday,
        headcount,
        attendancePct,
      },
    };
  },
};
