/** OWNER: Vignesh (Person C) */
import { api } from "./client.ts";

export type PresenceStatus =
  | "IN_OFFICE"
  | "CHECKED_OUT"
  | "ON_LEAVE"
  | "ABSENT"
  | "NOT_CHECKED_IN";

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  extraHours: number;
  breakMinutes: number;
  status: string;
  source: string;
};

export type MonthlyAttendance = {
  month: number;
  year: number;
  employeeId: string;
  counts: {
    daysPresent: number;
    leaveDays: number;
    totalWorkingDays: number;
  };
  holidays: { date: string; name: string }[];
  records: AttendanceRecord[];
};

export type DayViewItem = {
  employeeId: string;
  firstName: string;
  lastName: string;
  loginId: string;
  department: { id: string; name: string } | null;
  presence: PresenceStatus;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number;
  extraHours: number;
  status: string;
  attendance: AttendanceRecord | null;
};

export type DayViewResponse = {
  date: string;
  page: number;
  limit: number;
  total: number;
  items: DayViewItem[];
};

export const attendanceApi = {
  checkIn() {
    return api.post<{ success: true; data: AttendanceRecord }>("/attendance/check-in");
  },

  checkOut() {
    return api.post<{ success: true; data: AttendanceRecord }>("/attendance/check-out");
  },

  me(month: number, year: number) {
    return api.get<{ success: true; data: MonthlyAttendance }>("/attendance/me", {
      params: { month, year },
    });
  },

  dayView(params: { date: string; search?: string; page?: number; limit?: number }) {
    return api.get<{ success: true; data: DayViewResponse }>("/attendance", { params });
  },

  regularize(payload: {
    date: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    reason: string;
  }) {
    return api.post<{ success: true; data: unknown }>("/attendance/regularize", payload);
  },

  decideRegularization(id: string, status: "APPROVED" | "REJECTED", comment?: string) {
    return api.patch<{ success: true; data: unknown }>(`/attendance/regularize/${id}/decision`, {
      status,
      comment,
    });
  },
};
