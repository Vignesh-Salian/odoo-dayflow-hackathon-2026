/** OWNER: Vignesh (Person C) */
import { api } from "./client.ts";

export type AnalyticsDashboard = {
  asOf: string;
  period: { month: number; year: number };
  headcount: number;
  presentToday: number;
  pendingApprovals: {
    leaves: number;
    regularizations: number;
    total: number;
  };
  payrollCost: {
    currency: string;
    monthlyStub: number;
    note: string;
  };
  attendance: {
    monthPresentDays: number;
    workingDays: number;
    percentage: number;
  };
  headcountByDepartment: {
    departmentId: string | null;
    name: string;
    count: number;
  }[];
  trends: {
    presentToday: number;
    headcount: number;
    attendancePct: number;
  };
};

export const analyticsApi = {
  dashboard(params?: { month?: number; year?: number }) {
    return api.get<{ success: true; data: AnalyticsDashboard }>("/analytics/dashboard", {
      params,
    });
  },
};
