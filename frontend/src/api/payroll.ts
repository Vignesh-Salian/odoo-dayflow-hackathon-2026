/**
 * OWNER: Nidhish (Person B)
 */
import { api } from "./client.ts";

export const payrollApi = {
  getCompanySalaryPolicy() {
    return api.get("/payroll/company-policy");
  },
  putCompanySalaryPolicy(body: Record<string, unknown>) {
    return api.put("/payroll/company-policy", body);
  },
  getSalaryStructure(employeeId: string) {
    return api.get(`/payroll/salary-structure/${employeeId}`);
  },
  putSalaryStructure(employeeId: string, body: Record<string, unknown>) {
    return api.put(`/payroll/salary-structure/${employeeId}`, body);
  },
  generatePayslips(body: { employeeId?: string; month: number; year: number }) {
    return api.post("/payroll/payslips/generate", body);
  },
  myPayslips(params?: { page?: number; limit?: number }) {
    return api.get("/payroll/payslips/me", { params });
  },
  /** Authenticated PDF fetch — plain href misses the Bearer token. */
  downloadPdf(id: string) {
    return api.get(`/payroll/payslips/${id}/pdf`, { responseType: "blob" });
  },
};

