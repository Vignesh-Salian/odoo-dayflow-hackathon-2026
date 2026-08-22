# Dayflow — Human Resource Management System (HRMS)

> **Odoo x NMIT Bangalore Hackathon '26 Virtual Round Project**  
> *Track*: HRMS & Enterprise Software  
> *Repository*: [https://github.com/Vignesh-Salian/odoo-dayflow-hackathon-2026.git](https://github.com/Vignesh-Salian/odoo-dayflow-hackathon-2026.git)

---

## ?? Executive Summary
**Dayflow** is a complete, production-grade Human Resource Management System built with Python FastAPI, PostgreSQL (via SQLAlchemy), React, Vite, and Tailwind CSS. It provides role-gated administration for HR Officers and self-service capabilities for employees across employee onboarding, profile management, attendance tracking, time-off leave approval workflows, and formula-driven payroll calculation.

---

## ??? Tech Stack & Architecture

```
+---------------------------------------------------------+
¦                    Frontend Layer                       ¦
¦       React 18 + Vite + Tailwind CSS + Lucide Icons     ¦
+---------------------------------------------------------+
                             ¦ REST API (Axios + JWT Bearer)
+----------------------------?----------------------------+
¦                    Backend Layer                        ¦
¦          FastAPI (Python 3.10+) + Pydantic v2           ¦
¦     (JWT Auth, Role Security, Validation Middleware)    ¦
+---------------------------------------------------------+
                ¦                         ¦
+---------------?----------+   +----------?---------------+
¦   Relational Database    ¦   ¦  Business Service Layer  ¦
¦       PostgreSQL         ¦   ¦  Formula Payroll Engine  ¦
¦  (SQLAlchemy Engine)     ¦   ¦  Attendance Hour Calc    ¦
+--------------------------+   +--------------------------+
```

---

## ? Quick Start & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL running locally (or SQLite dev fallback)

### 1. Clone & Setup
```bash
git clone https://github.com/Vignesh-Salian/odoo-dayflow-hackathon-2026.git
cd odoo-dayflow-hackathon-2026

# Backend Setup
cd backend
cp .env.example .env
pip install -r requirements.txt

# Frontend Setup
cd ../frontend
cp .env.example .env
npm install
```

### 2. Run Dev Servers
* **Windows (One-click)**: Run `start-dev.bat`
* **Linux/macOS**: `./start-dev.sh`
* **Backend Docs (Swagger)**: `http://localhost:8000/docs`
* **Frontend Application**: `http://localhost:5173`

---

## ?? 4-DEVELOPER WORK DISTRIBUTION & TEAM INSTRUCTIONS

---

### ?? DEVELOPER 1 — Backend Core, Database & Authentication

#### ?? Primary Ownership & Files
* `backend/app/models/auth_models.py`
* `backend/app/routes/auth.py`
* `backend/app/routes/employees.py`
* `backend/app/utils/security.py`
* `backend/app/utils/errors.py`

#### ?? Exact Tasks & Instructions
1. **Database Schema**: Maintain SQLAlchemy models for `User` and `Employee` tables with PostgreSQL primary/foreign keys and unique constraints (`users.email UNIQUE`, `employees.employee_code UNIQUE`).
2. **JWT Security**: Maintain JWT encoding, decoding, and password hashing in `security.py`. Expose `get_current_user` and `require_admin` security dependencies.
3. **Authentication APIs**:
   * `POST /api/auth/login`: Validate email/password $\rightarrow$ return JWT bearer token & user role.
   * `GET /api/auth/me`: Return authenticated user details and role.
4. **Employee Onboarding APIs**:
   * `POST /api/employees`: Admin-only endpoint to onboard new employees, auto-generate Employee Code (`EMP-2026-xxx`), provision default leave allocations, and calculate initial salary structure.
   * `GET /api/employees`: Admin list with search and department filtering.
   * `GET /api/employees/{id}` & `PUT /api/employees/{id}`: Profile retrieval and update with role checks.
5. **Database Seeding**: Ensure default Admin (`admin@dayflow.com` / `Admin@2026`) and default Leave Types (`PAID`, `SICK`, `UNPAID`) are populated on startup.

*?? **Do NOT touch**: Attendance check-in logic, Leave request approval handlers, or Payroll formula code.*

---

### ?? DEVELOPER 2 — Frontend Core, Auth Shell & Dashboards

#### ?? Primary Ownership & Files
* `frontend/src/context/AuthContext.jsx`
* `frontend/src/pages/LoginPage.jsx`
* `frontend/src/pages/DashboardPage.jsx`
* `frontend/src/pages/EmployeesPage.jsx`
* `frontend/src/layouts/DashboardLayout.jsx`
* `frontend/src/components/common/*` (`Navbar.jsx`, `Sidebar.jsx`, `Button.jsx`, `Card.jsx`, `Table.jsx`, `Modal.jsx`, `Input.jsx`, `StatCard.jsx`, `Badge.jsx`, `Alert.jsx`)

#### ?? Exact Tasks & Instructions
1. **Auth Context**: Manage global token storage in `localStorage`, user session state, and role checks (`isAdmin`).
2. **Login View**: Maintain `LoginPage.jsx` with credential inputs and demo account quick-fill buttons (`Admin / HR` vs `Employee`).
3. **Layout & Navigation**: Maintain `Navbar.jsx` (avatar, role badge, check-in widget, sign out) and `Sidebar.jsx` with tab navigation (`/dashboard`, `/employees`, `/attendance`, `/leave`, `/payroll`).
4. **Admin & Employee Dashboards**:
   * Admin Dashboard: Headcount stat card, pending leave count, monthly payroll budget summary, and employee directory table.
   * Employee Dashboard: Welcome banner, today's attendance clock, paid leave balance, and net salary summary.
5. **Employee Directory UI**: Maintain `EmployeesPage.jsx` with search bar, department filter dropdown, and Admin "Onboard New Employee" modal.
6. **Reusable Component System**: Maintain design system components for Developers 3 & 4 to use.

*?? **Do NOT touch**: Backend Python files or complex Attendance/Payroll calculations in frontend.*

---

### ?? DEVELOPER 3 — Attendance Module (Full-Stack Vertical)

#### ?? Primary Ownership & Files
* `backend/app/routes/attendance.py`
* `backend/app/models/attendance_models.py`
* `backend/app/services/attendance_service.py`
* `frontend/src/pages/AttendancePage.jsx`
* `frontend/src/components/attendance/*`

#### ?? Exact Tasks & Instructions
1. **Attendance Database Model**: Maintain `AttendanceRecord` table (`employee_id`, `date`, `check_in`, `check_out`, `total_hours`, `status`) with `UNIQUE(employee_id, date)`.
2. **Attendance Backend APIs**:
   * `POST /api/attendance/check-in`: Record check-in timestamp; prevent duplicate active check-ins.
   * `POST /api/attendance/check-out`: Record check-out timestamp, calculate total work hours, set status (`Present` if $\ge 4.0$ hrs else `Half-day`). Prevent checkout without check-in.
   * `GET /api/attendance/status`: Return today's status for the header widget.
   * `GET /api/attendance/my-logs`: Personal attendance log history.
   * `GET /api/attendance/company`: Company-wide attendance logs for Admin.
3. **Frontend Attendance UI**:
   * Maintain `AttendancePage.jsx` with live Check-In / Check-Out timer card.
   * Render Attendance Log Table with status badges (`Present`, `Half-day`, `Leave`, `Absent`).

*?? **Do NOT touch**: Auth login endpoints, Leave allocations, or Payroll salary calculation code.*

---

### ?? DEVELOPER 4 — Time-Off Leave & Payroll Engine (Full-Stack Vertical)

#### ?? Primary Ownership & Files
* `backend/app/routes/leave.py`
* `backend/app/routes/payroll.py`
* `backend/app/services/payroll_service.py`
* `backend/app/models/leave_payroll_models.py`
* `frontend/src/pages/LeavePage.jsx`
* `frontend/src/pages/PayrollPage.jsx`
* `frontend/src/components/leave/*` & `frontend/src/components/payroll/*`

#### ?? Exact Tasks & Instructions
1. **Leave Management Engine**:
   * `GET /api/leave/types` & `GET /api/leave/allocations`: List leave balances.
   * `POST /api/leave/request`: Validate date range ($end \ge start$), check balance, verify no overlapping leave requests, and save `Pending` request.
   * `GET /api/leave/admin/requests` & `PUT /api/leave/admin/requests/{id}/review`: Admin review endpoint to Approve or Reject requests + add comments. Automatically update attendance status to `Leave` when approved.
   * Frontend `LeavePage.jsx`: Render allocation cards, "Apply for Time Off" modal, and Admin Review modal.
2. **Backend Formulated Payroll Engine**:
   * `payroll_service.py`: Implement formula calculations for Monthly Wage $W$:
     * $\text{Basic} = 50\% \times W$
     * $\text{HRA} = 50\% \times \text{Basic}$
     * $\text{Standard Allowance} = \min(2500, 5\% \times W)$
     * $\text{LTA} = \min(1500, 3\% \times W)$
     * $\text{Fixed Allowance} = W - (\text{Basic} + \text{HRA} + \text{Standard Allowance} + \text{LTA} + \text{Bonus})$
     * $\text{PF} = 12\% \times \text{Basic}$, $\text{PT} = ?200$
     * $\text{Net} = W - (\text{PF} + \text{PT})$
   * `GET /api/payroll/my-salary`: Employee read-only breakdown.
   * `PUT /api/payroll/admin/structures/{emp_id}`: Admin wage updater $\rightarrow$ auto-recalculates components.
   * Frontend `PayrollPage.jsx`: Render salary breakdown card and Admin Wage Configuration modal.

*?? **Do NOT touch**: Password hashing, Check-In timer code, or common layout components.*

---

## ?? API Endpoint Reference Summary

| Endpoint | Method | Role | Owner |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | **Dev 1** |
| `/api/auth/me` | `GET` | Authenticated | **Dev 1** |
| `/api/employees` | `GET` / `POST` | Admin | **Dev 1** |
| `/api/employees/{id}` | `GET` / `PUT` | Admin / Self | **Dev 1** |
| `/api/attendance/check-in` | `POST` | Employee | **Dev 3** |
| `/api/attendance/check-out` | `POST` | Employee | **Dev 3** |
| `/api/attendance/status` | `GET` | Employee | **Dev 3** |
| `/api/attendance/my-logs` | `GET` | Employee | **Dev 3** |
| `/api/attendance/company` | `GET` | Admin | **Dev 3** |
| `/api/leave/types` | `GET` | Authenticated | **Dev 4** |
| `/api/leave/allocations` | `GET` | Employee | **Dev 4** |
| `/api/leave/my-requests` | `GET` | Employee | **Dev 4** |
| `/api/leave/request` | `POST` | Employee | **Dev 4** |
| `/api/leave/admin/requests` | `GET` / `PUT` | Admin | **Dev 4** |
| `/api/payroll/my-salary` | `GET` | Employee | **Dev 4** |
| `/api/payroll/admin/structures` | `GET` / `PUT` | Admin | **Dev 4** |
