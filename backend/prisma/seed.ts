import "dotenv/config";

// Neon: use direct (non-pooler) URL for long seed transactions
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

import {
  ApprovalStatus,
  AttendanceSource,
  AttendanceStatus,
  Gender,
  LeaveRequestStatus,
  MaritalStatus,
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
 * Phase 7 / Build Plan §15 — full demo seed with comprehensive data points.
 * Run: npm run seed
 *
 * Demo logins (password for all): Demo@2026
 *   Admin     → OIADLO20220001 (ada.admin@odoo-india.demo)
 *   HR        → OIHARA20230001 (hari.hr@odoo-india.demo)
 *   Employees → OIJODO20220002 (john.doe@odoo-india.demo), etc.
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
  console.info("Seeding Dayflow comprehensive demo data…");

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

  // Leave Types
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
    prisma.leaveType.create({
      data: {
        companyId: company.id,
        name: "Casual Leave",
        code: "CASUAL",
        isPaid: true,
        requiresAttachment: false,
        defaultAllocation: 12,
        color: "#3b82f6",
      },
    }),
  ]);
  const pto = leaveTypes[0]!;
  const sick = leaveTypes[1]!;
  const unpaid = leaveTypes[2]!;
  const casual = leaveTypes[3]!;

  // Public Holidays
  const holidays = [
    { date: utcDate(YEAR, 0, 1), name: "New Year's Day" },
    { date: utcDate(YEAR, 0, 26), name: "Republic Day" },
    { date: utcDate(YEAR, 2, 25), name: "Holi" },
    { date: utcDate(YEAR, 4, 1), name: "May Day" },
    { date: utcDate(YEAR, 7, 15), name: "Independence Day" },
    { date: utcDate(YEAR, 9, 2), name: "Gandhi Jayanti" },
    { date: utcDate(YEAR, 9, 24), name: "Dussehra" },
    { date: utcDate(YEAR, 10, 12), name: "Diwali" },
    { date: utcDate(YEAR, 11, 25), name: "Christmas" },
  ];
  await prisma.publicHoliday.createMany({
    data: holidays.map((h) => ({
      companyId: company.id,
      date: h.date,
      name: h.name,
      year: YEAR,
    })),
  });

  // Departments
  const departmentNames = [
    "Engineering",
    "Human Resources",
    "Sales",
    "Product & Design",
    "Finance & Accounts",
    "Operations",
  ];
  const depts = await Promise.all(
    departmentNames.map((name) =>
      prisma.department.create({ data: { companyId: company.id, name } }),
    ),
  );
  const [engineering, hrDept, sales, productDesign, finance, operations] = depts;

  type EmpSpec = {
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    departmentId: string;
    jobPosition: string;
    wage: number;
    join: Date;
    dob: Date;
    gender: Gender;
    maritalStatus: MaritalStatus;
    skills: string[];
    certifications: { name: string; issuedBy: string; year: number }[];
    bankAccount: string;
    panNo: string;
  };

  const specs: EmpSpec[] = [
    {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada.admin@odoo-india.demo",
      role: Role.ADMIN,
      departmentId: hrDept!.id,
      jobPosition: "Administrator & VP People",
      wage: 150000,
      join: utcDate(2022, 0, 10),
      dob: utcDate(1988, 11, 10),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.MARRIED,
      skills: ["Strategic HR", "Org Design", "Executive Leadership", "Compliance"],
      certifications: [{ name: "SHRM Senior Certified Professional (SHRM-SCP)", issuedBy: "SHRM", year: 2020 }],
      bankAccount: "987654321001",
      panNo: "ABCPL1234A",
    },
    {
      firstName: "Hari",
      lastName: "Rao",
      email: "hari.hr@odoo-india.demo",
      role: Role.HR,
      departmentId: hrDept!.id,
      jobPosition: "HR Operations Lead",
      wage: 85000,
      join: utcDate(2023, 2, 1),
      dob: utcDate(1992, 4, 15),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.MARRIED,
      skills: ["Payroll Management", "Conflict Resolution", "Statutory Compliance", "Onboarding"],
      certifications: [{ name: "Certified HR Professional", issuedBy: "CHRP Institute", year: 2021 }],
      bankAccount: "987654321002",
      panNo: "ABCPL1234B",
    },
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "Senior Software Engineer",
      wage: 95000,
      join: utcDate(2022, 5, 15),
      dob: utcDate(1994, 7, 22),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["TypeScript", "Node.js", "PostgreSQL", "Prisma", "Docker"],
      certifications: [{ name: "AWS Certified Developer - Associate", issuedBy: "Amazon Web Services", year: 2023 }],
      bankAccount: "987654321003",
      panNo: "ABCPL1234C",
    },
    {
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "Frontend Tech Lead",
      wage: 90000,
      join: utcDate(2023, 8, 1),
      dob: utcDate(1995, 2, 18),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Web Performance"],
      certifications: [{ name: "Meta Frontend Developer Professional", issuedBy: "Coursera / Meta", year: 2022 }],
      bankAccount: "987654321004",
      panNo: "ABCPL1234D",
    },
    {
      firstName: "Rahul",
      lastName: "Mehta",
      email: "rahul.mehta@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "Backend Developer",
      wage: 75000,
      join: utcDate(2024, 0, 8),
      dob: utcDate(1997, 9, 5),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["Express", "Socket.io", "Redis", "REST APIs", "Microservices"],
      certifications: [{ name: "Node.js Application Developer", issuedBy: "Linux Foundation", year: 2023 }],
      bankAccount: "987654321005",
      panNo: "ABCPL1234E",
    },
    {
      firstName: "Neha",
      lastName: "Iyer",
      email: "neha.iyer@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: sales!.id,
      jobPosition: "Enterprise Account Executive",
      wage: 70000,
      join: utcDate(2023, 4, 20),
      dob: utcDate(1993, 11, 30),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.MARRIED,
      skills: ["B2B SaaS Sales", "CRM Pipelines", "Negotiation", "Key Account Management"],
      certifications: [{ name: "HubSpot Inbound Sales", issuedBy: "HubSpot Academy", year: 2022 }],
      bankAccount: "987654321006",
      panNo: "ABCPL1234F",
    },
    {
      firstName: "Vikram",
      lastName: "Singh",
      email: "vikram.singh@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: sales!.id,
      jobPosition: "Head of Sales",
      wage: 110000,
      join: utcDate(2022, 10, 1),
      dob: utcDate(1990, 6, 12),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.MARRIED,
      skills: ["Revenue Operations", "Sales Leadership", "Forecasting", "Territory Strategy"],
      certifications: [{ name: "Certified Sales Leader (CSL)", issuedBy: "Sales Management Association", year: 2021 }],
      bankAccount: "987654321007",
      panNo: "ABCPL1234G",
    },
    {
      firstName: "Ananya",
      lastName: "Patel",
      email: "ananya.patel@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: engineering!.id,
      jobPosition: "QA Automation Engineer",
      wage: 65000,
      join: utcDate(2024, 3, 12),
      dob: utcDate(1998, 1, 25),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["Playwright", "Cypress", "Jest", "CI/CD Pipelines", "API Testing"],
      certifications: [{ name: "ISTQB Certified Tester", issuedBy: "ISTQB", year: 2023 }],
      bankAccount: "987654321008",
      panNo: "ABCPL1234H",
    },
    {
      firstName: "Karan",
      lastName: "Desai",
      email: "karan.desai@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: hrDept!.id,
      jobPosition: "Senior Technical Recruiter",
      wage: 62000,
      join: utcDate(2024, 6, 1),
      dob: utcDate(1996, 8, 14),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["Tech Sourcing", "Interview Coordination", "Employer Branding", "ATS Management"],
      certifications: [{ name: "AIRS Certified Internet Recruiter (CIR)", issuedBy: "AIRS", year: 2023 }],
      bankAccount: "987654321009",
      panNo: "ABCPL1234I",
    },
    {
      firstName: "Meera",
      lastName: "Nair",
      email: "meera.nair@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: productDesign!.id,
      jobPosition: "Senior Product Designer",
      wage: 80000,
      join: utcDate(2023, 11, 5),
      dob: utcDate(1995, 5, 20),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["Figma", "Design Systems", "User Research", "Wireframing", "Prototyping"],
      certifications: [{ name: "NN/g UX Master Certified", issuedBy: "Nielsen Norman Group", year: 2022 }],
      bankAccount: "987654321010",
      panNo: "ABCPL1234J",
    },
    {
      firstName: "Arjun",
      lastName: "Verma",
      email: "arjun.verma@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: productDesign!.id,
      jobPosition: "Principal Product Manager",
      wage: 125000,
      join: utcDate(2023, 1, 10),
      dob: utcDate(1991, 3, 3),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.MARRIED,
      skills: ["Product Strategy", "Agile/Scrum", "Roadmap Planning", "Data Analytics"],
      certifications: [{ name: "Certified Scrum Product Owner (CSPO)", issuedBy: "Scrum Alliance", year: 2021 }],
      bankAccount: "987654321011",
      panNo: "ABCPL1234K",
    },
    {
      firstName: "Sneha",
      lastName: "Kulkarni",
      email: "sneha.kulkarni@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: finance!.id,
      jobPosition: "Finance Manager",
      wage: 95000,
      join: utcDate(2022, 8, 1),
      dob: utcDate(1992, 10, 19),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.MARRIED,
      skills: ["Financial Modeling", "Corporate Tax", "Budgeting", "Auditing"],
      certifications: [{ name: "Chartered Accountant (CA)", issuedBy: "ICAI", year: 2018 }],
      bankAccount: "987654321012",
      panNo: "ABCPL1234L",
    },
    {
      firstName: "Dev",
      lastName: "Kapoor",
      email: "dev.kapoor@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: operations!.id,
      jobPosition: "DevOps & Infrastructure Lead",
      wage: 105000,
      join: utcDate(2023, 3, 15),
      dob: utcDate(1993, 12, 8),
      gender: Gender.MALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["Kubernetes", "Terraform", "AWS", "GitHub Actions", "Monitoring"],
      certifications: [{ name: "Certified Kubernetes Administrator (CKA)", issuedBy: "CNCF", year: 2022 }],
      bankAccount: "987654321013",
      panNo: "ABCPL1234M",
    },
    {
      firstName: "Roshni",
      lastName: "Chatterjee",
      email: "roshni.chatterjee@odoo-india.demo",
      role: Role.EMPLOYEE,
      departmentId: operations!.id,
      jobPosition: "IT Support Specialist",
      wage: 52000,
      join: utcDate(2024, 2, 1),
      dob: utcDate(1999, 4, 11),
      gender: Gender.FEMALE,
      maritalStatus: MaritalStatus.SINGLE,
      skills: ["Network Administration", "Hardware Troubleshooting", "Security Compliance"],
      certifications: [{ name: "CompTIA Security+", issuedBy: "CompTIA", year: 2023 }],
      bankAccount: "987654321014",
      panNo: "ABCPL1234N",
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
    departmentId: string;
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
            workLocation: "Bengaluru HQ",
            dateOfJoining: spec.join,
            dateOfBirth: spec.dob,
            gender: spec.gender,
            maritalStatus: spec.maritalStatus,
            nationality: "Indian",
            residingAddress: `${spec.firstName} Residency, Indiranagar, Bengaluru 560038`,
            personalEmail: `${spec.firstName.toLowerCase()}.${spec.lastName.toLowerCase()}@personal-mail.demo`,
            phone: `+91-98${String(10000000 + created.length).slice(0, 8)}`,
          },
        });

        // Bank Details
        await tx.bankDetails.create({
          data: {
            employeeId: employee.id,
            accountNumber: spec.bankAccount,
            bankName: "HDFC Bank",
            ifscCode: "HDFC0001234",
            panNo: spec.panNo,
            uanNo: `1009876543${String(20 + created.length).padStart(2, "0")}`,
            empCode: loginId,
          },
        });

        // Skills
        await tx.skill.createMany({
          data: spec.skills.map((name) => ({ employeeId: employee.id, name })),
        });

        // Certifications
        await tx.certification.createMany({
          data: spec.certifications.map((c) => ({
            employeeId: employee.id,
            name: c.name,
            issuedBy: c.issuedBy,
            year: c.year,
          })),
        });

        // Leave Allocations
        await tx.leaveAllocation.createMany({
          data: leaveTypes.map((lt) => ({
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: YEAR,
            allocatedDays: lt.defaultAllocation,
            usedDays: lt.code === "PTO" ? 2 : lt.code === "SICK" ? 1 : 0,
          })),
        });

        // Resume / Bio
        await tx.resume.create({
          data: {
            employeeId: employee.id,
            about: `${spec.firstName} is ${spec.jobPosition} at Odoo India, passionate about excellence, team building, and delivering high-quality results.`,
            loveAboutJob: "Collaborative team spirit, transparent engineering culture, and building world-class HR software.",
            interestsHobbies: "Specialty coffee, open-source technology, hiking, and badminton.",
          },
        });

        // Salary Structure & Dynamic Components
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
          departmentId: spec.departmentId,
        };
      },
      { timeout: 60_000, maxWait: 20_000 },
    );
    created.push(row);
    console.info(`  + ${row.role.padEnd(8)} ${row.loginId} (${row.firstName} ${row.lastName})`);
  }

  // Find key personas
  const admin = created.find((c) => c.role === Role.ADMIN)!;
  const hari = created.find((c) => c.role === Role.HR)!;
  const john = created.find((c) => c.email.startsWith("john.doe"))!;
  const priya = created.find((c) => c.email.startsWith("priya"))!;
  const rahul = created.find((c) => c.email.startsWith("rahul"))!;
  const vikram = created.find((c) => c.email.startsWith("vikram"))!;
  const arjun = created.find((c) => c.email.startsWith("arjun"))!;
  const dev = created.find((c) => c.email.startsWith("dev"))!;

  // Management Hierarchy
  await prisma.employee.update({
    where: { id: john.employeeId },
    data: { managerId: priya.employeeId },
  });
  await prisma.employee.update({
    where: { id: rahul.employeeId },
    data: { managerId: priya.employeeId },
  });
  await prisma.employee.update({
    where: { id: priya.employeeId },
    data: { managerId: admin.employeeId },
  });
  await prisma.employee.update({
    where: { id: vikram.employeeId },
    data: { managerId: admin.employeeId },
  });
  await prisma.employee.update({
    where: { id: arjun.employeeId },
    data: { managerId: admin.employeeId },
  });
  await prisma.employee.update({
    where: { id: dev.employeeId },
    data: { managerId: admin.employeeId },
  });

  // Attendance for last 35 days for all employees
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

      // Dynamic mix of attendance patterns
      const roll = (emp.employeeId.charCodeAt(0) + i) % 12;
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
        checkIn.setUTCHours(4, 0, 0, 0); // 09:30 AM IST
        const checkOut = new Date(d);
        checkOut.setUTCHours(8, 0, 0, 0); // 01:30 PM IST
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
        checkIn.setUTCHours(3, 30, 0, 0); // 09:00 AM IST
        const checkOut = new Date(d);
        checkOut.setUTCHours(12, 30, 0, 0); // 06:00 PM IST
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

  // Attendance Regularization Requests
  const regDate1 = addDays(today, -2);
  const regDate2 = addDays(today, -5);
  await prisma.attendanceRegularization.create({
    data: {
      employeeId: john.employeeId,
      date: regDate1,
      requestedCheckIn: new Date(regDate1.setUTCHours(3, 30, 0, 0)),
      requestedCheckOut: new Date(regDate1.setUTCHours(12, 30, 0, 0)),
      reason: "Forgot biometric badge swipe at the turnstile due to morning team meeting.",
      status: ApprovalStatus.PENDING,
      approverId: hari.userId,
    },
  });

  await prisma.attendanceRegularization.create({
    data: {
      employeeId: priya.employeeId,
      date: regDate2,
      requestedCheckIn: new Date(regDate2.setUTCHours(4, 0, 0, 0)),
      requestedCheckOut: new Date(regDate2.setUTCHours(13, 0, 0, 0)),
      reason: "Late check-out after emergency production release deployment.",
      status: ApprovalStatus.APPROVED,
      approverId: admin.userId,
    },
  });

  // Multiple Leave Requests across various statuses
  const leaveStart1 = addDays(today, -12);
  while (isWeekend(leaveStart1)) leaveStart1.setUTCDate(leaveStart1.getUTCDate() + 1);
  const leaveEnd1 = addDays(leaveStart1, 2);

  await prisma.leaveRequest.create({
    data: {
      employeeId: john.employeeId,
      leaveTypeId: pto.id,
      startDate: leaveStart1,
      endDate: leaveEnd1,
      days: 3,
      reason: "Attending annual family get-together in hometown.",
      status: LeaveRequestStatus.APPROVED,
      approverId: admin.userId,
      approverComment: "Approved. Enjoy your vacation!",
      decidedAt: new Date(),
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: priya.employeeId,
      leaveTypeId: sick.id,
      startDate: addDays(today, 2),
      endDate: addDays(today, 3),
      days: 2,
      reason: "Viral fever and physician-recommended bed rest.",
      attachmentUrl: "/uploads/demo-sick-note.pdf",
      status: LeaveRequestStatus.PENDING,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: rahul.employeeId,
      leaveTypeId: casual.id,
      startDate: addDays(today, 5),
      endDate: addDays(today, 6),
      days: 2,
      reason: "Personal vehicle registration and licensing appointments.",
      status: LeaveRequestStatus.PENDING,
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: vikram.employeeId,
      leaveTypeId: pto.id,
      startDate: addDays(today, -20),
      endDate: addDays(today, -18),
      days: 3,
      reason: "Annual conference and personal leave extension.",
      status: LeaveRequestStatus.APPROVED,
      approverId: admin.userId,
      approverComment: "Approved.",
      decidedAt: addDays(today, -21),
    },
  });

  // Comprehensive Payslips for Multiple Employees (Current & Previous month)
  const payMonth = MONTH === 0 ? 12 : MONTH;
  const payYear = MONTH === 0 ? YEAR - 1 : YEAR;
  const periodStart = utcDate(payYear, payMonth - 1, 1);
  const periodEnd = utcDate(payYear, payMonth, 0);
  const totalWorkingDays = 22;

  const payslipEmployees = [john, priya, rahul, vikram, dev, arjun];

  for (const emp of payslipEmployees) {
    const lopDays = emp.employeeId === john.employeeId ? 1 : 0;
    const payableDays = totalWorkingDays - lopDays;
    const ratio = payableDays / totalWorkingDays;
    const components = computeComponents(emp.wage, defaultComponentTemplate());
    const earnings = components.map((c) => ({
      name: c.name,
      type: PayslipLineType.EARNING as const,
      amount: round2(c.computedAmount * ratio),
    }));
    const basic = (components.find((c) => c.name === "Basic")?.computedAmount ?? emp.wage * 0.5) * ratio;
    const deductions = computeDeductions({
      basicAmount: basic,
      pfEmployeeRate: 12,
      professionalTax: 200,
    });
    const gross = round2(earnings.reduce((s, e) => s + e.amount, 0));
    const net = round2(gross - deductions.total);

    await prisma.payslip.create({
      data: {
        employeeId: emp.employeeId,
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
        status: emp.employeeId === john.employeeId ? PayslipStatus.PAID : PayslipStatus.GENERATED,
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
  }

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: john.userId,
        type: "LEAVE_DECISION",
        title: "Leave Approved",
        message: "Your PTO request for 3 days has been approved by Ada Lovelace.",
        relatedEntity: "leave_request",
      },
      {
        userId: admin.userId,
        type: "LEAVE_PENDING",
        title: "New Leave Application",
        message: "Priya Shah submitted a sick leave request (2 days) awaiting approval.",
        relatedEntity: "leave_request",
      },
      {
        userId: hari.userId,
        type: "REGULARIZATION_PENDING",
        title: "Attendance Regularization",
        message: "John Doe requested attendance correction for turnstile issue.",
        relatedEntity: "attendance_regularization",
      },
      {
        userId: priya.userId,
        type: "REGULARIZATION_APPROVED",
        title: "Regularization Approved",
        message: "Your late check-out correction was approved by Ada Lovelace.",
        relatedEntity: "attendance_regularization",
      },
      {
        userId: john.userId,
        type: "PAYSLIP_GENERATED",
        title: "Payslip Ready",
        message: `Your payslip for ${payMonth}/${payYear} is now generated and marked as paid.`,
        relatedEntity: "payslip",
      },
    ],
  });

  // Realistic Audit Trail Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: admin.userId,
        action: "COMPANY_INITIALIZED",
        entityType: "company",
        entityId: company.id,
        newValue: { name: company.name, code: company.code },
        ipAddress: "127.0.0.1",
      },
      {
        actorUserId: admin.userId,
        action: "LEAVE_APPROVED",
        entityType: "leave_request",
        entityId: john.employeeId,
        newValue: { status: "APPROVED", days: 3, approver: "Ada Lovelace" },
        ipAddress: "127.0.0.1",
      },
      {
        actorUserId: hari.userId,
        action: "PAYROLL_RUN_COMPLETED",
        entityType: "payslip_batch",
        entityId: company.id,
        newValue: { month: payMonth, year: payYear, count: payslipEmployees.length },
        ipAddress: "127.0.0.1",
      },
    ],
  });

  console.info("\n========== Dayflow Demo Credentials ==========");
  console.info(`Password for ALL accounts: ${DEMO_PASSWORD}\n`);
  for (const c of created) {
    console.info(`${c.role.padEnd(8)}  ${c.loginId.padEnd(18)}  ${c.email.padEnd(35)} (${c.firstName} ${c.lastName})`);
  }
  console.info("==============================================\n");
  console.info("✅ Seed completed successfully with expanded data points.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
