# Dayflow HRMS — Human Resource Management System

> **Every workday, perfectly aligned.**  
> *Odoo × NMIT Bangalore Hackathon 2026 Virtual Round Project*  
> **Repository**: [https://github.com/Vignesh-Salian/odoo-dayflow-hackathon-2026.git](https://github.com/Vignesh-Salian/odoo-dayflow-hackathon-2026.git)

---

## 📌 Executive Summary

**Dayflow HRMS** is an enterprise-grade, database-first Human Resource Management System designed to solve core workforce management challenges: employee onboarding, real-time presence tracking, leave management workflows, and formula-driven payroll automation.

Built with a modern decoupled stack (**Express 5 + TypeScript + Prisma ORM + PostgreSQL** on the backend, and **React 19 + Vite + Tailwind CSS v4 + React Router v7** on the frontend), Dayflow delivers real-time interactivity via **Socket.io** while maintaining strict ACID transactional compliance, role-based access control, and complete audit trail logging.

---

## 🎯 Problem Solved & Core Objectives

Traditional HR systems are often fragmented, relying on manual spreadsheets or Backend-as-a-Service platforms that lack database constraints and transparent business logic. Dayflow solves this by offering:
1. **Unified Workforce Directory**: Auto-generating company codes (`OI` for Odoo India) and structured employee profiles with Work Info, Private Info, and Compensation views.
2. **Attendance & Presence Engine**: Automated check-in/out timestamps, daily work-hour calculation, status derivation (`Present` vs `Half-day`), and live presence indicators via WebSockets.
3. **Time-Off Approval Workflows**: Balance validation, date overlap prevention, and automatic sync between approved leave and attendance ledgers.
4. **Transparent Formulated Payroll Engine**: Pure backend formula calculation ($W \rightarrow \text{Basic} \rightarrow \text{HRA} \rightarrow \text{Fixed Allowance} \rightarrow \text{PF} \rightarrow \text{PT} \rightarrow \text{Net Pay}$) with downloadable PDF payslips.
5. **Role-Based Security & Compliance**: Strict role authorization (`ADMIN`, `HR`, `EMPLOYEE`), encrypted JWT session management, rate limiting, and administrative audit logging.

---

## 🏗️ Technology Stack & System Architecture

```
+-----------------------------------------------------------------+
|                        Frontend Layer                           |
|  React 19 • Vite 8 • Tailwind CSS v4 • React Router v7          |
|  TanStack Query v5 • Recharts v3 • Socket.io-client • Zod        |
+-----------------------------------------------------------------+
                                 ▲ REST API (Axios + JWT Bearer)
                                 ▼ WebSockets (Socket.io Real-Time Presence)
+-----------------------------------------------------------------+
|                        Backend Layer                            |
|  Express 5 • Node.js • TypeScript 5 • Zod Validation            |
|  Bcryptjs • JWT Auth • Helmet Security • Express Rate Limit     |
+-----------------------------------------------------------------+
                                 ▲
                                 ▼ Prisma ORM v6
+-----------------------------------------------------------------+
|                   Relational Database Layer                     |
|               PostgreSQL 16 (Neon / Local Docker)               |
|   Normalized relational schema (Company, User, Profile,         |
|   AttendanceRecord, TimeOffRequest, SalaryStructure, Payslip)   |
+-----------------------------------------------------------------+
```

---

## 🔌 API Endpoints Summary

Base URL: `http://localhost:3000/api/v1`

| Module | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/company-signup` | Register new organization & bootstrap Admin | Public |
| **Auth** | `POST` | `/auth/login` | Authenticate via Login ID or Email + Password | Public |
| **Auth** | `POST` | `/auth/refresh` | Refresh access token using refresh token | Public |
| **Auth** | `POST` | `/auth/change-password` | Update user password and clear must-change flag | Authenticated |
| **Auth** | `GET` | `/auth/me` | Retrieve authenticated user profile | Authenticated |
| **Employees** | `GET` | `/employees` | List employee directory with search & department filters | Authenticated |
| **Employees** | `POST` | `/employees` | Onboard new employee with auto-generated Login ID | Admin / HR |
| **Employees** | `GET` | `/employees/:id` | Detailed employee profile (Work, Private, Resume, Salary) | Authenticated |
| **Employees** | `PUT` | `/employees/:id` | Update employee profile details | Admin / HR / Self |
| **Attendance** | `POST` | `/attendance/check-in` | Record daily check-in timestamp | Employee |
| **Attendance** | `POST` | `/attendance/check-out` | Record daily check-out & compute hours | Employee |
| **Attendance** | `GET` | `/attendance/status` | Today's clock-in status for widget | Employee |
| **Attendance** | `GET` | `/attendance/my-logs` | Personal attendance history | Employee |
| **Attendance** | `GET` | `/attendance/company` | Company-wide attendance logs | Admin / HR |
| **Time-Off** | `GET` | `/timeoff/types` | List available leave types | Authenticated |
| **Time-Off** | `GET` | `/timeoff/allocations` | View user's remaining leave balances | Employee |
| **Time-Off** | `POST` | `/timeoff/request` | Submit new time-off application | Employee |
| **Time-Off** | `GET` | `/timeoff/admin/requests` | List pending leave applications | Admin / HR |
| **Time-Off** | `PUT` | `/timeoff/admin/requests/:id/review` | Approve or Reject leave request | Admin / HR |
| **Payroll** | `GET` | `/payroll/my-salary` | View read-only salary component breakdown | Employee |
| **Payroll** | `GET` | `/payroll/admin/structures` | List all employee salary configurations | Admin / HR |
| **Payroll** | `PUT` | `/payroll/admin/structures/:empId` | Update monthly wage $W$ & recalculate | Admin |
| **Analytics** | `GET` | `/analytics/summary` | Retrieve dashboard overview statistics | Admin / HR |
| **Audit** | `GET` | `/audit-logs` | Inspect system audit trail | Admin |

---

## 📁 Project Folder Structure

```
odoo-dayflow-hackathon-2026/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Relational database schema & enums
│   │   ├── seed.ts                    # Demo data seeder (Company, 14 Users, Attendance, Leaves)
│   │   └── migrations/                # Database migration history
│   ├── src/
│   │   ├── app.ts                     # Express app setup, middleware & route mounts
│   │   ├── server.ts                  # HTTP & Socket.io server entry point
│   │   ├── common/
│   │   │   ├── config/env.ts          # Zod-validated environment variables
│   │   │   ├── db/prisma.ts           # Prisma database client instance
│   │   │   ├── middleware/            # Auth, Validation, Error Handling middleware
│   │   │   └── socket/index.ts        # Socket.io presence events handler
│   │   └── modules/
│   │       ├── analytics/             # Analytics controllers, services, repositories
│   │       ├── attendance/            # Check-in/out logic & presence tests
│   │       ├── audit/                 # Audit logging router
│   │       ├── auth/                  # JWT auth, login, password change logic
│   │       ├── employees/             # Employee onboarding & profile management
│   │       ├── notifications/         # Real-time alert notifications
│   │       ├── payroll/               # Formula salary engine, payslip PDF renderer
│   │       └── timeoff/               # Time-off leave application & review logic
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── index.html                     # Single-page app HTML entry point
│   ├── src/
│   │   ├── main.tsx                   # React app mounting
│   │   ├── App.tsx                    # React Router configuration & query provider
│   │   ├── index.css                  # Tailwind CSS v4 styles
│   │   ├── api/                       # Modular Axios API clients (auth, attendance, etc.)
│   │   ├── components/                # Reusable UI system (NavBar, Modal, DataTable, etc.)
│   │   ├── features/                  # Feature views (analytics, attendance, employees, payroll, timeoff)
│   │   └── routes/                    # Protected route guards
│   ├── package.json
│   └── vite.config.ts
│
├── DEMO_CREDENTIALS.md                 # Documented demo login accounts
├── Dayflow_HRMS_Build_Plan.md          # Technical architectural specification
├── TEAM_OWNERS.md                      # Team module ownership matrix
├── docker-compose.yml                  # Local PostgreSQL container specification
└── README.md
```

---

## 🚀 Quick Start & Local Setup Guide

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm**: `v9.0.0` or higher
* **PostgreSQL**: `v15.0` or higher (local installation, Neon cloud, or Docker)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create local environment configuration from template
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Apply database migrations
npx prisma migrate dev

# Seed database with demo data (Company, 14 users, attendance logs, leave requests)
npm run seed

# Start backend development server (HTTP + WebSockets on http://localhost:3000)
npm run dev
```

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Create local environment configuration from template
cp .env.example .env

# Install dependencies
npm install

# Start frontend development server (http://localhost:5173)
npm run dev
```

---

## ⚙️ Environment Configuration

Environment configurations use `.env.example` templates and are protected by `.gitignore` to prevent secret leakage.

### Backend (`backend/.env.example`)
```ini
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

DATABASE_URL="postgresql://dayflow:dayflow@localhost:5432/dayflow?schema=public"
DIRECT_URL="postgresql://dayflow:dayflow@localhost:5432/dayflow?schema=public"

JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (`frontend/.env.example`)
```ini
VITE_API_BASE_URL=/api/v1
```

---

## 🔑 Demo Login Credentials

Demo accounts are auto-populated after running `npm run seed` in the backend.

> **Default Password for all seeded accounts**: `Demo@2026`

| Role | Login ID | Email | Name |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `OIADLO20220001` | `ada.admin@odoo-india.demo` | Ada Lovelace |
| **HR** | `OIHARA20230001` | `hari.hr@odoo-india.demo` | Hari Rao |
| **EMPLOYEE** | `OIJODO20220002` | `john.doe@odoo-india.demo` | John Doe |
| **EMPLOYEE** | `OIPRSH20230002` | `priya.shah@odoo-india.demo` | Priya Shah |

*(For full demo accounts list, see [`DEMO_CREDENTIALS.md`](DEMO_CREDENTIALS.md).)*

---

## 🧪 Automated Test Suite

Dayflow includes automated unit tests covering core business logic (salary engine, payable days, presence status rules, and company code derivation):

```bash
cd backend
npm test
```

### Test Coverage Highlights
* `salaryEngine.test.ts`: Validates formula calculations for Basic, HRA, Fixed Allowance, PF, PT, and Net Salary.
* `payrollMath.test.ts`: Verifies LOP (Loss of Pay) deductions and work-day ratio calculations.
* `presence.test.ts`: Tests green/grey/yellow presence status derivation logic (§5.5).
* `companyCode.test.ts`: Tests automatic 2-letter company code generation (§5.1).
* `analyticsSummary.test.ts`: Tests attendance percentage calculations.

---

## 👥 Team Collaboration & Module Ownership

Dayflow was developed as a modular 4-developer hackathon project with strict file boundary ownership:

| Person | Team Member | Module Ownership |
| :--- | :--- | :--- |
| **Person A** | **Prasanna** | Auth, Prisma database schema, common middleware, seed script, audit logs, core architecture |
| **Person B** | **Nidhish** | Employee directory, profile management, payroll formula engine, payslip PDF renderer |
| **Person C** | **Vignesh** | Attendance check-in/out engine, Socket.io presence indicators, analytics dashboard |
| **Person D** | **Prajwal** | Time-off leave workflows, real-time alert notifications, shared UI component system |

*(For complete ownership guidelines, see [`TEAM_OWNERS.md`](TEAM_OWNERS.md).)*
