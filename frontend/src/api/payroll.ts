/**
 * OWNER: Nidhish (Person B)
 * PLACEHOLDER — Phase 8 page params. Copy from reference:
 *   git show reference/copy-from-here:frontend/src/api/payroll.ts > frontend/src/api/payroll.ts
 */
import { api } from "./client.ts";

export const payrollApi = {
  getSalaryStructure(employeeId: string) {
    return api.get(`/payroll/salary-structure/${employeeId}`);
  },
  putSalaryStructure(employeeId: string, body: Record<string, unknown>) {
    return api.put(`/payroll/salary-structure/${employeeId}`, body);
  },
  generatePayslips(body: { employeeId?: string; month: number; year: number }) {
    return api.post("/payroll/payslips/generate", body);
  },
  myPayslips(_params?: { page?: number; limit?: number }) {
    return api.get("/payroll/payslips/me");
  },
  pdfUrl(id: string) {
    return `/api/v1/payroll/payslips/${id}/pdf`;
  },
};
