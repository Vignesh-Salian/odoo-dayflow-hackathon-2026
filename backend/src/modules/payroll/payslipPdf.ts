/**
 * OWNER: Nidhish (Person B) — Phase 7
 * Payslip PDF generation (Build Plan §5.4 / PDFKit).
 */
import fs from "node:fs";
import path from "node:path";
import { env } from "../../common/config/env.js";

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

/**
 * Writes a simple text-based payslip PDF stub to uploads/.
 * Replace body with PDFKit drawing for production polish.
 */
export async function renderPayslipPdf(payslipId: string, data: PayslipPdfInput): Promise<string> {
  const dir = path.resolve(env.UPLOAD_DIR, "payslips");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `payslip-${payslipId}.txt`;
  const filePath = path.join(dir, filename);

  const lines = [
    "DAYFLOW PAYSLIP",
    "================",
    `Employee: ${data.employeeName} (${data.loginId})`,
    `Period: ${data.month}/${data.year}`,
    `Payable days: ${data.payableDays} | LOP: ${data.lopDays}`,
    "",
    "Earnings / Deductions:",
    ...data.lines.map((l) => `  [${l.type}] ${l.name}: ${l.amount.toFixed(2)}`),
    "",
    `Gross: ${data.grossEarnings.toFixed(2)}`,
    `Deductions: ${data.totalDeductions.toFixed(2)}`,
    `Net pay: ${data.netPay.toFixed(2)}`,
  ];

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  return `/uploads/payslips/${filename}`;
}
