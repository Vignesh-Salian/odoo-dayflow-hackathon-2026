/**
 * OWNER: Nidhish (Person B) — Phase 7
 *
 * PLACEHOLDER on `main`. Copy the full file from `reference/copy-from-here`:
 *   git show reference/copy-from-here:backend/src/modules/payroll/payslipPdf.ts > backend/src/modules/payroll/payslipPdf.ts
 */
export type PayslipPdfInput = {
  employeeName: string;
  loginId: string;
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  payableDays: number;
  lopDays: number;
  lines: { name: string; type: "EARNING" | "DEDUCTION"; amount: number }[];
};

/** TODO: copy full renderer from reference/copy-from-here */
export async function renderPayslipPdf(_payslipId: string, _data: PayslipPdfInput): Promise<string> {
  throw new Error("TODO: copy payslipPdf.ts from branch reference/copy-from-here");
}
