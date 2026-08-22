/**
 * OWNER: Prajwal (Person D)
 * Leave business logic — working-day counting (§5.6), balances, approvals.
 */
import { LeaveRequestStatus, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/AppError.js";
import { notificationsService } from "../notifications/notifications.service.js";
import { timeoffRepository } from "./timeoff.repository.js";
import type {
  LeaveAllocationCreateInput,
  LeaveDecisionInput,
  LeaveRequestCreateInput,
} from "./timeoff.schema.js";

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

/**
 * Working days between start and end inclusive, excluding Sat/Sun and public holidays.
 * Build Plan §5.6
 */
export function countWorkingDays(
  start: Date,
  end: Date,
  holidayKeys: Set<string>,
): number {
  let count = 0;
  const cur = new Date(start.getTime());
  const last = end.getTime();
  while (cur.getTime() <= last) {
    const dow = cur.getUTCDay();
    const key = toDateKey(cur);
    if (dow !== 0 && dow !== 6 && !holidayKeys.has(key)) {
      count += 1;
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

function decimalToNumber(v: Prisma.Decimal | number): number {
  return typeof v === "number" ? v : Number(v);
}

function serializeAllocation(row: {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: Prisma.Decimal;
  usedDays: Prisma.Decimal;
  leaveType: {
    id: string;
    name: string;
    code: string;
    isPaid: boolean;
    color: string | null;
    requiresAttachment: boolean;
  };
}) {
  const allocated = decimalToNumber(row.allocatedDays);
  const used = decimalToNumber(row.usedDays);
  return {
    id: row.id,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    year: row.year,
    allocatedDays: allocated,
    usedDays: used,
    remainingDays: Math.max(0, allocated - used),
    leaveType: row.leaveType,
  };
}

function serializeRequest(row: {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  days: Prisma.Decimal;
  reason: string | null;
  attachmentUrl: string | null;
  status: LeaveRequestStatus;
  approverId: string | null;
  approverComment: string | null;
  appliedAt: Date;
  decidedAt: Date | null;
  leaveType?: {
    id: string;
    name: string;
    code: string;
    isPaid: boolean;
    color: string | null;
    requiresAttachment: boolean;
  };
  employee?: { id: string; firstName: string; lastName: string };
  approver?: { id: string; loginId?: string; email?: string } | null;
}) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    startDate: toDateKey(row.startDate),
    endDate: toDateKey(row.endDate),
    days: decimalToNumber(row.days),
    reason: row.reason,
    attachmentUrl: row.attachmentUrl,
    status: row.status,
    approverId: row.approverId,
    approverComment: row.approverComment,
    appliedAt: row.appliedAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    leaveType: row.leaveType,
    employee: row.employee,
    approver: row.approver ?? null,
  };
}

async function holidayKeySet(companyId: string, start: Date, end: Date): Promise<Set<string>> {
  const holidays = await timeoffRepository.listHolidayDatesInRange(companyId, start, end);
  return new Set(holidays.map((h) => toDateKey(h.date)));
}

export const timeoffService = {
  async listLeaveTypes(companyId: string) {
    const rows = await timeoffRepository.listLeaveTypes(companyId);
    return rows.map((t) => ({
      ...t,
      defaultAllocation: decimalToNumber(t.defaultAllocation),
    }));
  },

  async myAllocations(userId: string, companyId: string, year?: number) {
    const employee = await timeoffRepository.findEmployeeByUserId(userId);
    if (!employee) {
      throw new AppError(404, "NO_EMPLOYEE", "No employee profile linked to this user");
    }
    const y = year ?? new Date().getUTCFullYear();
    const rows = await timeoffRepository.listAllocationsForEmployee(employee.id, y);

    // Ensure default allocations exist for company leave types
    const types = await timeoffRepository.listLeaveTypes(companyId);
    const have = new Set(rows.map((r) => r.leaveTypeId));
    for (const t of types) {
      if (have.has(t.id)) continue;
      await timeoffRepository.upsertAllocation({
        employeeId: employee.id,
        leaveTypeId: t.id,
        year: y,
        allocatedDays: decimalToNumber(t.defaultAllocation),
      });
    }
    const fresh = await timeoffRepository.listAllocationsForEmployee(employee.id, y);
    return fresh.map(serializeAllocation);
  },

  async listAllocations(
    companyId: string,
    query: { year?: number; employeeId?: string; page: number; limit: number },
  ) {
    const skip = (query.page - 1) * query.limit;
    const [total, rows] = await timeoffRepository.listAllocations({
      companyId,
      year: query.year,
      employeeId: query.employeeId,
      skip,
      take: query.limit,
    });
    return {
      items: rows.map((r) => ({
        ...serializeAllocation(r),
        employee: r.employee,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  },

  async createAllocation(companyId: string, input: LeaveAllocationCreateInput) {
    const employee = await timeoffRepository.findEmployeeInCompany(input.employeeId, companyId);
    if (!employee) {
      throw new AppError(404, "EMPLOYEE_NOT_FOUND", "Employee not found", {
        employeeId: "Employee not found in this company",
      });
    }
    const leaveType = await timeoffRepository.findLeaveType(input.leaveTypeId, companyId);
    if (!leaveType) {
      throw new AppError(404, "LEAVE_TYPE_NOT_FOUND", "Leave type not found", {
        leaveTypeId: "Leave type not found",
      });
    }
    const row = await timeoffRepository.upsertAllocation({
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      year: input.year,
      allocatedDays: input.allocatedDays,
    });
    return {
      ...serializeAllocation(row),
      employee: {
        id: row.employee.id,
        firstName: row.employee.firstName,
        lastName: row.employee.lastName,
      },
    };
  },

  async createRequest(
    userId: string,
    companyId: string,
    input: LeaveRequestCreateInput,
    uploadedAttachmentUrl?: string | null,
  ) {
    const employee = await timeoffRepository.findEmployeeByUserId(userId);
    if (!employee) {
      throw new AppError(404, "NO_EMPLOYEE", "No employee profile linked to this user");
    }

    const leaveType = await timeoffRepository.findLeaveType(input.leaveTypeId, companyId);
    if (!leaveType) {
      throw new AppError(404, "LEAVE_TYPE_NOT_FOUND", "Leave type not found", {
        leaveTypeId: "Leave type not found",
      });
    }

    const attachmentUrl = uploadedAttachmentUrl || input.attachmentUrl || null;
    if (leaveType.requiresAttachment && !attachmentUrl) {
      throw new AppError(400, "ATTACHMENT_REQUIRED", "This leave type requires an attachment", {
        attachment: "Attachment is required for this leave type",
      });
    }

    const startDate = parseDateOnly(input.startDate);
    const endDate = parseDateOnly(input.endDate);
    const holidays = await holidayKeySet(companyId, startDate, endDate);
    const days = countWorkingDays(startDate, endDate, holidays);

    if (days <= 0) {
      throw new AppError(
        400,
        "NO_WORKING_DAYS",
        "Selected range has no working days (weekends/holidays excluded)",
        { startDate: "No working days in range", endDate: "No working days in range" },
      );
    }

    const overlap = await timeoffRepository.findOverlappingRequests(
      employee.id,
      startDate,
      endDate,
    );
    if (overlap.length > 0) {
      throw new AppError(
        409,
        "OVERLAPPING_LEAVE",
        "You already have a pending or approved leave overlapping these dates",
        { startDate: "Overlaps an existing leave request" },
      );
    }

    const year = startDate.getUTCFullYear();
    let allocation = await timeoffRepository.findAllocation(employee.id, leaveType.id, year);
    if (!allocation) {
      allocation = await timeoffRepository.upsertAllocation({
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        year,
        allocatedDays: decimalToNumber(leaveType.defaultAllocation),
      });
    }

    const remaining =
      decimalToNumber(allocation.allocatedDays) - decimalToNumber(allocation.usedDays);
    const uncapped = !leaveType.isPaid || leaveType.code === "UNPAID";
    if (!uncapped && days > remaining) {
      throw new AppError(
        400,
        "INSUFFICIENT_BALANCE",
        `Not enough leave balance (need ${days}, have ${remaining})`,
        { leaveTypeId: `Only ${remaining} day(s) remaining` },
      );
    }

    const created = await timeoffRepository.createRequest({
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate,
      endDate,
      days,
      reason: input.reason,
      attachmentUrl,
    });

    return serializeRequest(created);
  },

  async myRequests(userId: string) {
    const employee = await timeoffRepository.findEmployeeByUserId(userId);
    if (!employee) {
      throw new AppError(404, "NO_EMPLOYEE", "No employee profile linked to this user");
    }
    const rows = await timeoffRepository.listMyRequests(employee.id);
    return rows.map(serializeRequest);
  },

  async listRequests(
    companyId: string,
    query: { status?: LeaveRequestStatus; search?: string; page: number; limit: number },
  ) {
    const skip = (query.page - 1) * query.limit;
    const [total, rows] = await timeoffRepository.listRequests({
      companyId,
      status: query.status,
      search: query.search,
      skip,
      take: query.limit,
    });
    return {
      items: rows.map(serializeRequest),
      page: query.page,
      limit: query.limit,
      total,
    };
  },

  async decideRequest(
    companyId: string,
    approverUserId: string,
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    input: LeaveDecisionInput,
  ) {
    const request = await timeoffRepository.findRequestById(requestId, companyId);
    if (!request) {
      throw new AppError(404, "NOT_FOUND", "Leave request not found");
    }
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new AppError(400, "INVALID_STATUS", `Request is already ${request.status}`);
    }

    const year = request.startDate.getUTCFullYear();
    let allocation = await timeoffRepository.findAllocation(
      request.employeeId,
      request.leaveTypeId,
      year,
    );
    if (!allocation) {
      allocation = await timeoffRepository.upsertAllocation({
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
        allocatedDays: decimalToNumber(request.leaveType.defaultAllocation),
      });
    }

    const days = decimalToNumber(request.days);
    const uncapped = !request.leaveType.isPaid || request.leaveType.code === "UNPAID";

    if (decision === "APPROVED") {
      const remaining =
        decimalToNumber(allocation.allocatedDays) - decimalToNumber(allocation.usedDays);
      if (!uncapped && days > remaining) {
        throw new AppError(
          400,
          "INSUFFICIENT_BALANCE",
          `Cannot approve — balance would go negative (need ${days}, have ${remaining})`,
        );
      }
      await timeoffRepository.incrementUsedDays(allocation.id, days);
    }

    const updated = await timeoffRepository.updateRequestStatus(requestId, {
      status: decision === "APPROVED" ? LeaveRequestStatus.APPROVED : LeaveRequestStatus.REJECTED,
      approverId: approverUserId,
      approverComment: input.comment,
      decidedAt: new Date(),
    });

    await notificationsService.create({
      userId: request.employee.userId,
      type: decision === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      title: decision === "APPROVED" ? "Leave approved" : "Leave rejected",
      message:
        decision === "APPROVED"
          ? `Your ${request.leaveType.name} request (${toDateKey(request.startDate)} → ${toDateKey(request.endDate)}) was approved.`
          : `Your ${request.leaveType.name} request (${toDateKey(request.startDate)} → ${toDateKey(request.endDate)}) was rejected.${input.comment ? ` Comment: ${input.comment}` : ""}`,
      relatedEntity: "leave_request",
      relatedId: request.id,
    });

    return serializeRequest(updated);
  },

  async listPublicHolidays(companyId: string, year?: number) {
    const y = year ?? new Date().getUTCFullYear();
    const rows = await timeoffRepository.listPublicHolidays(companyId, y);
    return rows.map((h) => ({
      id: h.id,
      companyId: h.companyId,
      date: toDateKey(h.date),
      name: h.name,
      year: h.year,
    }));
  },
};
