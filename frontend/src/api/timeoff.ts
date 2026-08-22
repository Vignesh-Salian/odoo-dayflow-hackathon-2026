/**
 * OWNER: Prajwal (Person D)
 * PLACEHOLDER — Phase 8 year param. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/api/timeoff.ts > frontend/src/api/timeoff.ts
 */
import { api } from "./client.ts";

export type LeaveType = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  isPaid: boolean;
  requiresAttachment: boolean;
  defaultAllocation: number;
  color: string | null;
};

export type LeaveAllocation = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  leaveType: LeaveType | Omit<LeaveType, "companyId" | "defaultAllocation">;
  employee?: { id: string; firstName: string; lastName: string };
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  attachmentUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  leaveType?: { id: string; name: string; code: string; isPaid: boolean; color: string | null; requiresAttachment: boolean };
  employee?: { id: string; firstName: string; lastName: string };
};

export type PublicHoliday = { id: string; date: string; name: string; year: number };

type Paginated<T> = { items: T[]; page: number; limit: number; total: number };

export const timeoffApi = {
  leaveTypes() {
    return api.get<{ success: true; data: LeaveType[] }>("/leave-types");
  },
  myAllocations(year?: number) {
    return api.get<{ success: true; data: LeaveAllocation[] }>("/leave/allocations/me", {
      params: year ? { year } : undefined,
    });
  },
  listAllocations(params?: { year?: number; employeeId?: string; page?: number; limit?: number }) {
    return api.get<{ success: true; data: Paginated<LeaveAllocation> }>("/leave/allocations", { params });
  },
  createAllocation(payload: {
    employeeId: string;
    leaveTypeId: string;
    year: number;
    allocatedDays: number;
  }) {
    return api.post<{ success: true; data: LeaveAllocation }>("/leave/allocations", payload);
  },
  createRequest(payload: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
    attachment?: File | null;
  }) {
    const form = new FormData();
    form.append("leaveTypeId", payload.leaveTypeId);
    form.append("startDate", payload.startDate);
    form.append("endDate", payload.endDate);
    if (payload.reason) form.append("reason", payload.reason);
    if (payload.attachment) form.append("attachment", payload.attachment);
    return api.post<{ success: true; data: LeaveRequest }>("/leave/requests", form, {
      headers: { "Content-Type": undefined },
    });
  },
  myRequests(_year?: number) {
    return api.get<{ success: true; data: LeaveRequest[] }>("/leave/requests/me");
  },
  listRequests(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    return api.get<{ success: true; data: Paginated<LeaveRequest> }>("/leave/requests", { params });
  },
  approve(id: string, comment?: string) {
    return api.patch<{ success: true; data: LeaveRequest }>(`/leave/requests/${id}/approve`, { comment });
  },
  reject(id: string, comment?: string) {
    return api.patch<{ success: true; data: LeaveRequest }>(`/leave/requests/${id}/reject`, { comment });
  },
  publicHolidays(year?: number) {
    return api.get<{ success: true; data: PublicHoliday[] }>("/public-holidays", {
      params: year ? { year } : undefined,
    });
  },
};
