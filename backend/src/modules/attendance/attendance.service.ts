/**
 * OWNER: Vignesh (Person C)
 * Attendance business logic — check-in/out, work hours, monthly/day views, regularization (§5.5).
 */
import {
  ApprovalStatus,
  AttendanceSource,
  AttendanceStatus,
  Prisma,
} from "@prisma/client";
import { AppError } from "../../common/errors/AppError.js";
import type { AuthUser } from "../../common/middleware/auth.js";
import {
  emitAttendanceChecked,
  emitPresenceUpdate,
  type PresenceStatus,
} from "../../common/socket/index.js";
import { attendanceRepository } from "./attendance.repository.js";
import type {
  DayViewQuery,
  MonthlyMeQuery,
  RegularizeDecisionInput,
  RegularizeInput,
} from "./attendance.schema.js";

/** Standard full-day hours used for extra-hours calc (Build Plan §5.4 / demo default). */
export const STANDARD_WORK_HOURS = 8;

/** Parse YYYY-MM-DD as UTC date-only. */
export function parseDateOnly(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(400, "INVALID_DATE", "Invalid date", { date: "Invalid date" });
  }
  return d;
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayUtcDate(): Date {
  return parseDateOnly(toDateKey(new Date()));
}

function decimalToNumber(v: Prisma.Decimal | number): number {
  return typeof v === "number" ? v : Number(v);
}

export function computeWorkHours(
  checkIn: Date,
  checkOut: Date,
  breakMinutes = 0,
): { workHours: number; extraHours: number } {
  const ms = checkOut.getTime() - checkIn.getTime();
  if (ms <= 0) {
    return { workHours: 0, extraHours: 0 };
  }
  const rawHours = ms / (1000 * 60 * 60) - breakMinutes / 60;
  const workHours = Math.max(0, Math.round(rawHours * 100) / 100);
  const extraHours = Math.max(0, Math.round((workHours - STANDARD_WORK_HOURS) * 100) / 100);
  return { workHours, extraHours };
}

function isWeekend(date: Date): boolean {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 6;
}

function countWorkingDaysInMonth(
  year: number,
  month: number,
  holidayKeys: Set<string>,
): number {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  let count = 0;
  const cur = new Date(start.getTime());
  while (cur.getTime() <= end.getTime()) {
    const key = toDateKey(cur);
    if (!isWeekend(cur) && !holidayKeys.has(key)) count += 1;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

function serializeRecord(row: {
  id: string;
  employeeId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  workHours: Prisma.Decimal;
  extraHours: Prisma.Decimal;
  breakMinutes: number;
  status: AttendanceStatus;
  source: AttendanceSource;
}) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    date: toDateKey(row.date),
    checkIn: row.checkIn?.toISOString() ?? null,
    checkOut: row.checkOut?.toISOString() ?? null,
    workHours: decimalToNumber(row.workHours),
    extraHours: decimalToNumber(row.extraHours),
    breakMinutes: row.breakMinutes,
    status: row.status,
    source: row.source,
  };
}

async function requireSelfEmployee(user: AuthUser) {
  if (!user.employeeId) {
    throw new AppError(400, "NO_EMPLOYEE", "Your account is not linked to an employee profile");
  }
  const employee = await attendanceRepository.findEmployeeByUserId(user.id);
  if (!employee || employee.user.companyId !== user.companyId) {
    throw new AppError(404, "NOT_FOUND", "Employee profile not found");
  }
  return employee;
}

/**
 * Presence for today per Build Plan §5.5.
 * Green = IN_OFFICE, Grey = ON_LEAVE, Yellow = ABSENT, Red (self) = NOT_CHECKED_IN.
 */
export function derivePresenceStatus(opts: {
  record: { checkIn: Date | null; checkOut: Date | null } | null;
  onLeave: boolean;
  isWorkingDay: boolean;
}): PresenceStatus {
  if (opts.onLeave) return "ON_LEAVE";
  if (opts.record?.checkIn && !opts.record.checkOut) return "IN_OFFICE";
  if (opts.record?.checkIn && opts.record.checkOut) return "CHECKED_OUT";
  if (!opts.isWorkingDay) return "ABSENT";
  return "NOT_CHECKED_IN";
}

export const attendanceService = {
  async checkIn(user: AuthUser) {
    const employee = await requireSelfEmployee(user);
    const date = todayUtcDate();
    const dateKey = toDateKey(date);

    if (isWeekend(date)) {
      throw new AppError(400, "WEEKEND", "Cannot check in on a weekend");
    }

    const holidays = await attendanceRepository.listHolidaysInRange(
      user.companyId,
      date,
      date,
    );
    if (holidays.length > 0) {
      throw new AppError(400, "HOLIDAY", "Cannot check in on a public holiday");
    }

    const onLeave = await attendanceRepository.listApprovedLeavesCoveringDate(
      [employee.id],
      date,
    );
    if (onLeave.length > 0) {
      throw new AppError(400, "ON_LEAVE", "You are on approved leave today");
    }

    const existing = await attendanceRepository.findRecord(employee.id, date);
    if (existing?.checkIn) {
      throw new AppError(409, "ALREADY_CHECKED_IN", "You have already checked in today");
    }

    const now = new Date();
    const record = await attendanceRepository.upsertRecord({
      employeeId: employee.id,
      date,
      checkIn: now,
      checkOut: null,
      workHours: 0,
      extraHours: 0,
      status: AttendanceStatus.PRESENT,
      source: AttendanceSource.SYSTEM,
    });

    emitPresenceUpdate(user.companyId, {
      employeeId: employee.id,
      status: "IN_OFFICE",
      date: dateKey,
    });
    emitAttendanceChecked(user.companyId, {
      employeeId: employee.id,
      date: dateKey,
      action: "check-in",
    });

    return serializeRecord(record);
  },

  async checkOut(user: AuthUser) {
    const employee = await requireSelfEmployee(user);
    const date = todayUtcDate();
    const dateKey = toDateKey(date);

    const existing = await attendanceRepository.findRecord(employee.id, date);
    if (!existing?.checkIn) {
      throw new AppError(400, "NOT_CHECKED_IN", "You must check in before checking out");
    }
    if (existing.checkOut) {
      throw new AppError(409, "ALREADY_CHECKED_OUT", "You have already checked out today");
    }

    const now = new Date();
    const { workHours, extraHours } = computeWorkHours(
      existing.checkIn,
      now,
      existing.breakMinutes,
    );

    const status =
      workHours > 0 && workHours < STANDARD_WORK_HOURS / 2
        ? AttendanceStatus.HALF_DAY
        : AttendanceStatus.PRESENT;

    const record = await attendanceRepository.upsertRecord({
      employeeId: employee.id,
      date,
      checkIn: existing.checkIn,
      checkOut: now,
      workHours,
      extraHours,
      breakMinutes: existing.breakMinutes,
      status,
      source: existing.source,
    });

    emitPresenceUpdate(user.companyId, {
      employeeId: employee.id,
      status: "CHECKED_OUT",
      date: dateKey,
    });
    emitAttendanceChecked(user.companyId, {
      employeeId: employee.id,
      date: dateKey,
      action: "check-out",
    });

    return serializeRecord(record);
  },

  async myMonthly(user: AuthUser, query: MonthlyMeQuery) {
    const employee = await requireSelfEmployee(user);
    const { month, year } = query;
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    const [records, holidays] = await Promise.all([
      attendanceRepository.listRecordsForEmployeeInRange(employee.id, start, end),
      attendanceRepository.listHolidaysInRange(user.companyId, start, end),
    ]);

    const holidayKeys = new Set(holidays.map((h) => toDateKey(h.date)));
    const totalWorkingDays = countWorkingDaysInMonth(year, month, holidayKeys);

    const daysPresent = records.filter(
      (r) =>
        r.status === AttendanceStatus.PRESENT ||
        r.status === AttendanceStatus.HALF_DAY ||
        (r.checkIn != null && r.status !== AttendanceStatus.ABSENT),
    ).length;

    const leaveInMonth = await attendanceRepository.listApprovedLeavesOverlappingRange(
      employee.id,
      start,
      end,
    );

    const leaveDaySet = new Set<string>();
    for (const lr of leaveInMonth) {
      const cur = new Date(Math.max(lr.startDate.getTime(), start.getTime()));
      const last = Math.min(lr.endDate.getTime(), end.getTime());
      while (cur.getTime() <= last) {
        const key = toDateKey(cur);
        if (!isWeekend(cur) && !holidayKeys.has(key)) leaveDaySet.add(key);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    const approvedLeaveWorkingDays = leaveDaySet.size;

    return {
      month,
      year,
      employeeId: employee.id,
      counts: {
        daysPresent,
        leaveDays: approvedLeaveWorkingDays,
        totalWorkingDays,
      },
      holidays: holidays.map((h) => ({ date: toDateKey(h.date), name: h.name })),
      records: records.map(serializeRecord),
    };
  },

  async dayView(user: AuthUser, query: DayViewQuery) {
    const date = parseDateOnly(query.date);
    const dateKey = toDateKey(date);
    const skip = (query.page - 1) * query.limit;

    const [total, employees] = await attendanceRepository.listCompanyEmployees(
      user.companyId,
      query.search.trim(),
      skip,
      query.limit,
    );

    const employeeIds = employees.map((e) => e.id);
    const [records, leaves, holidays] = await Promise.all([
      attendanceRepository.listRecordsForEmployeesOnDate(employeeIds, date),
      attendanceRepository.listApprovedLeavesCoveringDate(employeeIds, date),
      attendanceRepository.listHolidaysInRange(user.companyId, date, date),
    ]);

    const recordByEmp = new Map(records.map((r) => [r.employeeId, r]));
    const onLeaveSet = new Set(leaves.map((l) => l.employeeId));
    const isHoliday = holidays.length > 0;
    const workingDay = !isWeekend(date) && !isHoliday;

    const items = employees.map((emp) => {
      const record = recordByEmp.get(emp.id) ?? null;
      const onLeave = onLeaveSet.has(emp.id);
      const presence = derivePresenceStatus({
        record,
        onLeave,
        isWorkingDay: workingDay,
      });

      return {
        employeeId: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        loginId: emp.user.loginId,
        department: emp.department,
        presence,
        checkIn: record?.checkIn?.toISOString() ?? null,
        checkOut: record?.checkOut?.toISOString() ?? null,
        workHours: record ? decimalToNumber(record.workHours) : 0,
        extraHours: record ? decimalToNumber(record.extraHours) : 0,
        status: onLeave
          ? AttendanceStatus.ON_LEAVE
          : record?.status ?? (workingDay ? AttendanceStatus.ABSENT : isHoliday ? AttendanceStatus.HOLIDAY : AttendanceStatus.WEEKEND),
        attendance: record ? serializeRecord(record) : null,
      };
    });

    return {
      date: dateKey,
      page: query.page,
      limit: query.limit,
      total,
      items,
    };
  },

  async regularize(user: AuthUser, input: RegularizeInput) {
    const employee = await requireSelfEmployee(user);
    const date = parseDateOnly(input.date);

    if (date.getTime() > todayUtcDate().getTime()) {
      throw new AppError(400, "FUTURE_DATE", "Cannot regularize a future date");
    }

    const row = await attendanceRepository.createRegularization({
      employeeId: employee.id,
      date,
      requestedCheckIn: new Date(input.requestedCheckIn),
      requestedCheckOut: new Date(input.requestedCheckOut),
      reason: input.reason.trim(),
    });

    return {
      id: row.id,
      employeeId: row.employeeId,
      date: toDateKey(row.date),
      requestedCheckIn: row.requestedCheckIn.toISOString(),
      requestedCheckOut: row.requestedCheckOut.toISOString(),
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  },

  async decideRegularization(
    user: AuthUser,
    id: string,
    input: RegularizeDecisionInput,
  ) {
    const existing = await attendanceRepository.findRegularizationById(id);
    if (!existing || existing.employee.user.companyId !== user.companyId) {
      throw new AppError(404, "NOT_FOUND", "Regularization request not found");
    }
    if (existing.status !== ApprovalStatus.PENDING) {
      throw new AppError(409, "ALREADY_DECIDED", "This request has already been decided");
    }

    const updated = await attendanceRepository.updateRegularizationStatus(
      id,
      input.status,
      user.id,
    );

    let attendance = null;
    if (input.status === ApprovalStatus.APPROVED) {
      const { workHours, extraHours } = computeWorkHours(
        updated.requestedCheckIn,
        updated.requestedCheckOut,
      );
      const status =
        workHours > 0 && workHours < STANDARD_WORK_HOURS / 2
          ? AttendanceStatus.HALF_DAY
          : AttendanceStatus.PRESENT;

      const record = await attendanceRepository.upsertRecord({
        employeeId: updated.employeeId,
        date: updated.date,
        checkIn: updated.requestedCheckIn,
        checkOut: updated.requestedCheckOut,
        workHours,
        extraHours,
        status,
        source: AttendanceSource.REGULARIZED,
      });
      attendance = serializeRecord(record);

      const dateKey = toDateKey(updated.date);
      const isToday = dateKey === toDateKey(todayUtcDate());
      if (isToday) {
        emitPresenceUpdate(user.companyId, {
          employeeId: updated.employeeId,
          status: "CHECKED_OUT",
          date: dateKey,
        });
      }
      emitAttendanceChecked(user.companyId, {
        employeeId: updated.employeeId,
        date: dateKey,
        action: "regularized",
      });
    }

    return {
      id: updated.id,
      employeeId: updated.employeeId,
      date: toDateKey(updated.date),
      status: updated.status,
      approverId: updated.approverId,
      attendance,
      comment: input.comment ?? null,
    };
  },
};
