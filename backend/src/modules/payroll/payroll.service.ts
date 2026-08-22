/** OWNER: Nidhish (Person B) */
import fsSync from "node:fs";
import path from "node:path";
import { AttendanceStatus, ComputationType, PayslipLineType, PayslipStatus, Role, WageType } from "@prisma/client";
import { prisma } from "../../common/db/prisma.js";
import { env } from "../../common/config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import type { AuthUser } from "../../common/middleware/auth.js";
import type {
  GeneratePayslipsInput,
  MyPayslipsQuery,
  PutSalaryStructureInput,
} from "./payroll.schema.js";
import { payrollRepository } from "./payroll.repository.js";
import {
  computeComponents,
  computeDeductions,
  defaultComponentTemplate,
  round2,
} from "./salaryEngine.js";
import { renderPayslipPdf } from "./payslipPdf.js";

function isHrOrAdmin(role: Role): boolean {
  return role === Role.ADMIN || role === Role.HR;
}

function requireEmployee(actor: AuthUser): string {
  if (!actor.employeeId) {
    throw new AppError(404, "NOT_FOUND", "No employee profile linked to this user");
  }
  return actor.employeeId;
}

async function assertEmployeeScope(actor: AuthUser, employeeId: string) {
  const employee = await payrollRepository.findEmployeeInCompany(employeeId, actor.companyId);
  if (!employee) throw new AppError(404, "NOT_FOUND", "Employee not found");
  if (!isHrOrAdmin(actor.role) && actor.employeeId !== employeeId) {
    throw new AppError(403, "FORBIDDEN", "You can only access your own payroll");
  }
  return employee;
}

function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInPeriod(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(new Date(date));
  }
  return dates;
}

function isScheduledWorkday(date: Date, workingDaysPerWeek: number): boolean {
  if (workingDaysPerWeek >= 7) return true;
  const day = date.getUTCDay();
  const mondayBasedDay = day === 0 ? 7 : day;
  return mondayBasedDay <= workingDaysPerWeek;
}

async function buildPayslip(
  employeeId: string,
  companyId: string,
  month: number,
  year: number,
  overwrite: boolean,
) {
  const structure = await payrollRepository.findActiveStructure(employeeId);
  if (!structure) {
    throw new AppError(400, "SALARY_STRUCTURE_MISSING", "Active salary structure not found");
  }

  const existing = await payrollRepository.findPayslip(employeeId, month, year);
  if (existing && !overwrite) {
    throw new AppError(409, "PAYSLIP_EXISTS", "Payslip already exists for this period");
  }

  const periodStart = utcDate(year, month - 1, 1);
  const periodEnd = utcDate(year, month, 0);
  const [attendance, leaves, holidays] = await Promise.all([
    payrollRepository.findAttendanceInRange(employeeId, periodStart, periodEnd),
    payrollRepository.findApprovedLeavesInRange(employeeId, periodStart, periodEnd),
    payrollRepository.findHolidaysInRange(companyId, periodStart, periodEnd),
  ]);

  const holidayKeys = new Set(holidays.map((holiday) => dateKey(holiday.date)));
  const workingDates = daysInPeriod(periodStart, periodEnd).filter(
    (date) => isScheduledWorkday(date, structure.workingDaysPerWeek) && !holidayKeys.has(dateKey(date)),
  );
  const workingKeys = new Set(workingDates.map(dateKey));
  const attendanceByDate = new Map(attendance.map((record) => [dateKey(record.date), record]));
  const paidLeaveKeys = new Set<string>();
  const unpaidLeaveKeys = new Set<string>();

  for (const leave of leaves) {
    const start = leave.startDate < periodStart ? periodStart : leave.startDate;
    const end = leave.endDate > periodEnd ? periodEnd : leave.endDate;
    for (const date of daysInPeriod(start, end)) {
      const key = dateKey(date);
      if (!workingKeys.has(key)) continue;
      (leave.leaveType.isPaid ? paidLeaveKeys : unpaidLeaveKeys).add(key);
    }
  }

  let unauthorizedAbsentDays = 0;
  for (const key of workingKeys) {
    if (paidLeaveKeys.has(key) || unpaidLeaveKeys.has(key)) continue;
    const record = attendanceByDate.get(key);
    if (!record || record.status === AttendanceStatus.ABSENT) unauthorizedAbsentDays += 1;
  }

  const totalWorkingDays = workingDates.length;
  if (totalWorkingDays === 0) {
    throw new AppError(400, "NO_WORKING_DAYS", "The selected period has no working days");
  }
  const lopDays = Math.min(totalWorkingDays, unpaidLeaveKeys.size + unauthorizedAbsentDays);
  const payableDays = totalWorkingDays - lopDays;
  const factor = payableDays / totalWorkingDays;

  const earningLines = structure.components.map((component) => ({
    name: component.name,
    type: PayslipLineType.EARNING,
    amount: round2(Number(component.computedAmount) * factor),
  }));
  const grossEarnings = round2(earningLines.reduce((sum, line) => sum + line.amount, 0));
  const basic = earningLines.find((line) => line.name.toLowerCase() === "basic")?.amount ?? 0;
  const deductions = computeDeductions({
    basicAmount: basic,
    pfEmployeeRate: Number(structure.pfEmployeeRate),
    professionalTax: Number(structure.professionalTax),
  });
  const deductionLines = [
    { name: "Provident Fund (Employee)", type: PayslipLineType.DEDUCTION, amount: deductions.pfEmployee },
    { name: "Professional Tax", type: PayslipLineType.DEDUCTION, amount: deductions.professionalTax },
  ];

  return prisma.$transaction(async (tx) => {
    if (existing) await payrollRepository.deletePayslip(existing.id, tx);
    return payrollRepository.createPayslip(
      {
        employee: { connect: { id: employeeId } },
        month,
        year,
        periodStart,
        periodEnd,
        totalWorkingDays,
        payableDays,
        lopDays,
        grossEarnings,
        totalDeductions: deductions.total,
        netPay: round2(grossEarnings - deductions.total),
        status: PayslipStatus.GENERATED,
        generatedAt: new Date(),
        lines: { create: [...earningLines, ...deductionLines] },
      },
      tx,
    );
  });
}

export const payrollService = {
  async getCompanySalaryPolicy(actor: AuthUser) {
    let policy = await payrollRepository.findCompanySalaryPolicy(actor.companyId);
    if (!policy) {
      policy = await payrollRepository.upsertCompanySalaryPolicy(actor.companyId, {
        pfEmployeeRate: 12,
        pfEmployerRate: 12,
        professionalTax: 200,
        components: defaultComponentTemplate(),
      });
    }
    return policy;
  },

  async putCompanySalaryPolicy(actor: AuthUser, input: PutCompanySalaryPolicyInput) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN can edit company salary policies");
    }
    return payrollRepository.upsertCompanySalaryPolicy(actor.companyId, input);
  },

  async getSalaryStructure(actor: AuthUser, employeeId: string) {
    await assertEmployeeScope(actor, employeeId);
    const structure = await payrollRepository.findActiveStructure(employeeId);
    if (!structure) throw new AppError(404, "NOT_FOUND", "Active salary structure not found");
    return structure;
  },

  async putSalaryStructure(
    actor: AuthUser,
    employeeId: string,
    input: PutSalaryStructureInput,
  ) {
    if (actor.role !== Role.ADMIN) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN can edit salary structures");
    }
    const employee = await assertEmployeeScope(actor, employeeId);
    let policyComponents = input.components;
    let pfEmpRate = input.pfEmployeeRate;
    let pfErRate = input.pfEmployerRate;
    let ptAmt = input.professionalTax;

    if (!policyComponents) {
      const policy = await this.getCompanySalaryPolicy(actor);
      policyComponents = policy.components.map((c) => ({
        name: c.name,
        computationType: c.computationType,
        value: c.value ? Number(c.value) : null,
        sequence: c.sequence,
      }));
    }

    const componentInputs = policyComponents.map((component) => ({
      name: component.name.trim(),
      computationType: component.computationType,
      value: component.computationType === ComputationType.BALANCE ? null : (component.value ?? 0),
      sequence: component.sequence,
    }));
    const components = computeComponents(input.monthlyWage, componentInputs);
    const effectiveFrom = input.effectiveFrom ?? new Date();
    effectiveFrom.setUTCHours(0, 0, 0, 0);

    return prisma.$transaction(async (tx) => {
      await payrollRepository.deactivateStructures(employeeId, tx);
      return payrollRepository.createStructure(
        {
          employee: { connect: { id: employee.id } },
          wageType: WageType.FIXED,
          monthlyWage: input.monthlyWage,
          yearlyWage: round2(input.monthlyWage * 12),
          workingDaysPerWeek: input.workingDaysPerWeek,
          breakTimeHours: input.breakTimeHours ?? null,
          pfEmployeeRate: pfEmpRate,
          pfEmployerRate: pfErRate,
          professionalTax: ptAmt,
          effectiveFrom,
          isActive: true,
          components: {
            create: components.map((component) => ({
              name: component.name,
              computationType: component.computationType,
              value: component.value,
              computedAmount: component.computedAmount,
              sequence: component.sequence,
            })),
          },
        },
        tx,
      );
    });
  },


  async generatePayslips(actor: AuthUser, input: GeneratePayslipsInput) {
    if (!isHrOrAdmin(actor.role)) {
      throw new AppError(403, "FORBIDDEN", "Only ADMIN or HR can generate payslips");
    }
    const employees = input.employeeId
      ? [await assertEmployeeScope(actor, input.employeeId)]
      : await payrollRepository.listActiveEmployeesInCompany(actor.companyId);

    const generated = [];
    const skipped = [];
    for (const employee of employees) {
      try {
        generated.push(
          await buildPayslip(employee.id, actor.companyId, input.month, input.year, input.overwrite),
        );
      } catch (error) {
        if (input.employeeId) throw error;
        skipped.push({
          employeeId: employee.id,
          reason: error instanceof AppError ? error.message : "Payslip generation failed",
        });
      }
    }
    return { generated, skipped };
  },

  async myPayslips(actor: AuthUser, query: MyPayslipsQuery) {
    const employeeId = requireEmployee(actor);
    const [items, total] = await payrollRepository.listPayslipsForEmployee(
      employeeId,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  },

  async pdfFile(actor: AuthUser, payslipId: string) {
    const payslip = await payrollRepository.findPayslipById(payslipId);
    if (!payslip || payslip.employee.user.companyId !== actor.companyId) {
      throw new AppError(404, "NOT_FOUND", "Payslip not found");
    }
    if (!isHrOrAdmin(actor.role) && actor.employeeId !== payslip.employeeId) {
      throw new AppError(403, "FORBIDDEN", "You can only download your own payslips");
    }

    const company = payslip.employee.user.company;
    const logoCandidate = company?.logoUrl
      ? path.resolve(env.UPLOAD_DIR, path.basename(company.logoUrl))
      : null;
    const logoPath = logoCandidate && fsSync.existsSync(logoCandidate) ? logoCandidate : null;

    const pdfUrl = await renderPayslipPdf(payslip.id, {
      companyName: company?.name ?? "Dayflow",
      logoPath,
      employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
      loginId: payslip.employee.user.loginId,
      month: payslip.month,
      year: payslip.year,
      grossEarnings: Number(payslip.grossEarnings),
      totalDeductions: Number(payslip.totalDeductions),
      netPay: Number(payslip.netPay),
      payableDays: Number(payslip.payableDays),
      lopDays: Number(payslip.lopDays),
      totalWorkingDays: Number(payslip.totalWorkingDays),
      lines: payslip.lines.map((line) => ({
        name: line.name,
        type: line.type as "EARNING" | "DEDUCTION",
        amount: Number(line.amount),
      })),
    });

    await payrollRepository.updatePayslipPdf(payslip.id, pdfUrl);
    const filePath = path.resolve(env.UPLOAD_DIR, "payslips", path.basename(pdfUrl));
    return { filePath, fileName: path.basename(filePath) };
  },
};
