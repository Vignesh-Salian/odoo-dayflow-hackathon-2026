import "dotenv/config";

// Neon: use direct (non-pooler) URL for long seed transactions
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

import {
  AttendanceSource,
  AttendanceStatus,
  LeaveRequestStatus,
  PayslipLineType,
  PayslipStatus,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateLoginId } from "../src/modules/auth/auth.service.js";
import {
  computeComponents,
  computeDeductions,
  defaultComponentTemplate,
  round2,
} from "../src/modules/payroll/salaryEngine.js";

/**
 * Phase 7 / Build Plan §15 — full demo seed.
 * Run: npm run seed
 *
 * Demo logins (password for all): Demo@2026
 *   Admin  → printed loginId (e.g. OIADLO2026…)
 *   HR     → printed after seed
 *   Employees → printed after seed
 */
const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@2026";
const YEAR = new Date().getFullYear();
const MONTH = new Date().getMonth(); // 0-indexed; seed previous month attendance too

function utcDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function isWeekend(d: Date) {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

async function main() {
  console.info("Seeding Dayflow demo data…");

  const existing = await prisma.company.findFirst({ where: { code: "OI" } });
  if (existing) {
    console.info("Removing previous OI demo company…");
    await prisma.company.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const company = await prisma.company.create({
    data: {
      name: "Odoo India",
      code: "OI",
      country: "India",
    },
  });

  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: {
        companyId: company.id,
        name: "Paid Time Off",
        code: "PTO",
        isPaid: true,
        requiresAttachment: false,
        defaultAllocation: 24,
        color: "#22c55e",
      },
    }),
    prisma.leaveType.create({
      data: {
        companyId: company.id,
        name: "Sick Leave",
        code: "SICK",
        isPaid: true,
        requiresAttachment: true,
        defaultAllocation: 7,
        color: "#ef4444",
      },
    }),
    prisma.leaveType.create({
      data: {
        companyId: company.id,
        name: "Unpaid Leave",
        code: "UNPAID",
        isPaid: false,
        requiresAttachment: false,
        defaultAllocation: 999,
        color: "#94a3b8",
      },
    }),
  ]);
  const pto = leaveTypes[0]!;
  const sick = leaveTypes[1]!;

  const holidays = [
    { date: utcDate(YEAR, 0, 26), name: "Republic Day" },
    { date: utcDate(YEAR, 7, 15), name: "Independence Day" },
    { date: utcDate(YEAR, 9, 2), name: "Gandhi Jayanti" },
  ];
  await prisma.publicHoliday.createMany({
    data: holidays.map((h) => ({
      companyId: company.id,
      date: h.date,
      name: h.name,
      year: YEAR,
    })),
  });

  const depts = await Promise.all(
    ["Engineering", "Human Resources", "Sales"].map((name) =>
      prisma.department.create({ data: { companyId: company.id, name } }),
    ),
  );
  const [engineering, hrDept, sales] = depts;

  type EmpSpec = {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    departmentId: string;
    jobPosition: string;
    wage: number;
    join: Date;
  };

  const specs: EmpSpec[] = [
    {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada.admin@odoo-india.demo",
      role: Role.ADMIN,
      departmentId: hrDept!.id,
      jobPosition: "Administrator",
      wage: 120000,
      join: utcDate(2022, 0, 10),
    },
    {
      firstName: "Hari",
      lastName: "Rao",
      email: "hari.hr@odoo-india.demo",
      role: Role.HR,
      departmentId: hrDept!.id,
      jobPosition: "HR Officer",
      wage: 80000,
      join: utcDate(2023, 2, 1),
    },
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "Software Engineer",
      wage: 75000,
      join: utcDate(2022, 5, 15),
    },
    {
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "Frontend Developer",
      wage: 70000,
      join: utcDate(2023, 8, 1),
    },
    {
      firstName: "Rahul",
      lastName: "Mehta",
      email: "rahul.mehta@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "Backend Developer",
      wage: 72000,
      join: utcDate(2024, 0, 8),
    },
    {
      firstName: "Neha",
      lastName: "Iyer",
      email: "neha.iyer@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: sales!.id,
      jobPosition: "Account Executive",
      wage: 65000,
      join: utcDate(2023, 4, 20),
    },
    {
      firstName: "Vikram",
      lastName: "Singh",
      email: "vikram.singh@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: sales!.id,
      jobPosition: "Sales Manager",
      wage: 90000,
      join: utcDate(2022, 10, 1),
    },
    {
      firstName: "Ananya",
      lastName: "Patel",
      email: "ananya.patel@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "QA Engineer",
      wage: 60000,
      join: utcDate(2024, 3, 12),
    },
    {
      firstName: "Karan",
      lastName: "Desai",
      email: "karan.desai@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: hrDept!.id,
      jobPosition: "Recruiter",
      wage: 55000,
      join: utcDate(2024, 6, 1),
    },
    {
      firstName: "Meera",
      lastName: "Nair",
      email: "meera.nair@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: sales!.id,
      jobPosition: "Customer Success",
      wage: 58000,
      join: utcDate(2023, 11, 5),
    },
  ];

  const created: {
    loginId: string;
    email: string;
    role: Role;
    employeeId: string;
    userId: string;
    wage: number;
    firstName: string;
    lastName: string;
  }[] = [];

  for (const spec of specs) {
    const row = await prisma.$transaction(
      async (tx) => {
        const loginId = await generateLoginId(
          tx,
          company.id,
          company.code,
          spec.firstName,
          spec.lastName,
          spec.join,
        );
        const user = await tx.user.create({
          data: {
            companyId: company.id,
            loginId,
            email: spec.email,
            passwordHash,
            role: spec.role,
            mustChangePassword: false,
            emailVerified: true,
          },
        });
        const employee = await tx.employee.create({
          data: {
            userId: user.id,
            firstName: spec.firstName,
            lastName: spec.lastName,
            jobPosition: spec.jobPosition,
            departmentId: spec.departmentId,
            workLocation: "Bengaluru",
            dateOfJoining: spec.join,
            phone: "+91-98000-00000",
          },
        });

        await tx.leaveAllocation.createMany({
          data: leaveTypes.map((lt) => ({
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: YEAR,
            allocatedDays: lt.defaultAllocation,
            usedDays: lt.code === "PTO" ? 2 : lt.code === "SICK" ? 1 : 0,
          })),
        });

        await tx.resume.create({
          data: {
            employeeId: employee.id,
            about: `${spec.firstName} works as ${spec.jobPosition} at Odoo India.`,
            loveAboutJob: "Building great HR products.",
            interestsHobbies: "Coffee, cricket, open source.",
          },
        });

        const components = computeComponents(spec.wage, defaultComponentTemplate());
        await tx.salaryStructure.create({
          data: {
            employeeId: employee.id,
            monthlyWage: spec.wage,
            yearlyWage: spec.wage * 12,
            effectiveFrom: spec.join,
            isActive: true,
            components: {
              create: components.map((c) => ({
                name: c.name,
                computationType: c.computationType,
                value: c.value,
                computedAmount: c.computedAmount,
                sequence: c.sequence,
              })),
            },
          },
        });

        return {
          loginId,
          email: spec.email,
          role: spec.role,
          employeeId: employee.id,
          userId: user.id,
          wage: spec.wage,
          firstName: spec.firstName,
          lastName: spec.lastName,
        };
      },
      { timeout: 60_000, maxWait: 20_000 },
    );
    created.push(row);
    console.info(`  + ${row.role} ${row.loginId} (${row.firstName} ${row.lastName})`);
  }

  const john = created.find((c) => c.email.startsWith("john.doe"))!;
  const priya = created.find((c) => c.email.startsWith("priya"))!;
  const admin = created.find((c) => c.role === Role.ADMIN)!;

  // Manager links
  await prisma.employee.update({
    where: { id: john.employeeId },
    data: { managerId: created.find((c) => c.email.startsWith("vikram"))!.employeeId },
  });

  // Attendance for last 30 working days for each employee
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

  for (const emp of created) {
    for (let i = 35; i >= 1; i--) {
      const d = addDays(today, -i);
      if (isWeekend(d)) continue;
      const key = d.toISOString().slice(0, 10);
      if (holidaySet.has(key)) {
        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.employeeId,
            date: d,
            status: AttendanceStatus.HOLIDAY,
            source: AttendanceSource.SYSTEM,
          },
        });
        continue;
      }

      // Mix: most present, some half-day, some absent
      const roll = (emp.employeeId.charCodeAt(0) + i) % 10;
      if (roll === 0) {
        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.employeeId,
            date: d,
            status: AttendanceStatus.ABSENT,
            source: AttendanceSource.SYSTEM,
          },
        });
      } else if (roll === 1) {
        const checkIn = new Date(d);
        checkIn.setUTCHours(4, 0, 0, 0); // 09:30 IST-ish demo
        const checkOut = new Date(d);
        checkOut.setUTCHours(8, 0, 0, 0);
        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.employeeId,
            date: d,
            checkIn,
            checkOut,
            workHours: 4,
            status: AttendanceStatus.HALF_DAY,
            source: AttendanceSource.SYSTEM,
          },
        });
      } else {
        const checkIn = new Date(d);
        checkIn.setUTCHours(3, 30, 0, 0);
        const checkOut = new Date(d);
        checkOut.setUTCHours(12, 30, 0, 0);
        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.employeeId,
            date: d,
            checkIn,
            checkOut,
            workHours: 9,
            extraHours: 1,
            status: AttendanceStatus.PRESENT,
            source: AttendanceSource.SYSTEM,
          },
        });
      }
    }
  }

  // Leave requests
  const leaveStart = addDays(today, -10);
  while (isWeekend(leaveStart)) leaveStart.setUTCDate(leaveStart.getUTCDate() + 1);
  const leaveEnd = addDays(leaveStart, 1);

  await prisma.leaveRequest.create({
    data: {
      employeeId: john.employeeId,
      leaveTypeId: pto.id,
      startDate: leaveStart,
      endDate: leaveEnd,
      days: 2,
      reason: "Family function",
      status: LeaveRequestStatus.APPROVED,
      approverId: admin.userId,
      approverComment: "Approved",
      decidedAt: new Date(),
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: priya.employeeId,
      leaveTypeId: sick.id,
      startDate: addDays(today, 3),
      endDate: addDays(today, 3),
      days: 1,
      reason: "Fever",
      attachmentUrl: "/uploads/demo-sick-note.pdf",
      status: LeaveRequestStatus.PENDING,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: john.userId,
        type: "LEAVE_DECISION",
        title: "Leave approved",
        message: "Your PTO request was approved.",
        relatedEntity: "leave_request",
      },
      {
        userId: admin.userId,
        type: "LEAVE_PENDING",
        title: "Leave pending approval",
        message: "Priya Shah requested sick leave.",
        relatedEntity: "leave_request",
      },
    ],
  });

  // One payslip for John for previous month
  const payMonth = MONTH === 0 ? 12 : MONTH; // previous calendar month 1-12
  const payYear = MONTH === 0 ? YEAR - 1 : YEAR;
  const periodStart = utcDate(payYear, payMonth - 1, 1);
  const periodEnd = utcDate(payYear, payMonth, 0); // last day of pay month
  const totalWorkingDays = 22;
  const lopDays = 1;
  const payableDays = totalWorkingDays - lopDays;
  const ratio = payableDays / totalWorkingDays;
  const components = computeComponents(john.wage, defaultComponentTemplate());
  const earnings = components.map((c) => ({
    name: c.name,
    type: PayslipLineType.EARNING as const,
    amount: round2(c.computedAmount * ratio),
  }));
  const basic = components.find((c) => c.name === "Basic")!.computedAmount * ratio;
  const deductions = computeDeductions({
    basicAmount: basic,
    pfEmployeeRate: 12,
    professionalTax: 200,
  });
  const gross = round2(earnings.reduce((s, e) => s + e.amount, 0));
  const net = round2(gross - deductions.total);

  await prisma.payslip.create({
    data: {
      employeeId: john.employeeId,
      month: payMonth,
      year: payYear,
      periodStart,
      periodEnd,
      totalWorkingDays,
      payableDays,
      lopDays,
      grossEarnings: gross,
      totalDeductions: deductions.total,
      netPay: net,
      status: PayslipStatus.GENERATED,
      generatedAt: new Date(),
      lines: {
        create: [
          ...earnings,
          {
            name: "PF (Employee)",
            type: PayslipLineType.DEDUCTION,
            amount: deductions.pfEmployee,
          },
          {
            name: "Professional Tax",
            type: PayslipLineType.DEDUCTION,
            amount: deductions.professionalTax,
          },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.userId,
      action: "SEED",
      entityType: "company",
      entityId: company.id,
      newValue: { note: "Demo seed applied" },
      ipAddress: "127.0.0.1",
    },
  });

  console.info("\n========== Dayflow demo credentials ==========");
  console.info(`Password for ALL accounts: ${DEMO_PASSWORD}\n`);
  for (const c of created) {
    console.info(`${c.role.padEnd(8)}  ${c.loginId.padEnd(18)}  ${c.email}  (${c.firstName} ${c.lastName})`);
  }
  console.info("==============================================\n");
  console.info("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
