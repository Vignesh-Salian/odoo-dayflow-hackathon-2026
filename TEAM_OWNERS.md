# Dayflow — Team ownership & copy-paste workflow

## People

| Person | Name | Owns |
|--------|------|------|
| **A** | **Prasanna** | Auth, Prisma, seed, audit, company logo, routing/home, shared pagination utils |
| **B** | **Nidhish** | Employees / Profile UI + Salary panel + Payroll page |
| **C** | **Vignesh** | Attendance day-view pagination + Analytics wage aggregate |
| **D** | **Prajwal** | NavBar (logo + role links) + Time-off list polish |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | **Prasanna’s Phase-8 files are complete.** B/C/D Phase-8 files are **placeholders**. |
| `reference/copy-from-here` | **Full working code.** Copy → same path on `main` → commit with **your** git user. |

### How to copy (B / C / D)

```bash
git fetch
git show reference/copy-from-here:path/to/file > path/to/file
git add path/to/file
git commit -m "feat(phase8): <what>"
git push
```

---

## Phase 8 ownership (no overlapping files)

### Person A — Prasanna (**filled on `main`**)
| File | What |
|------|------|
| `frontend/src/routes/guards.tsx` | Employees land on `/me`, not `/employees` |
| `frontend/src/App.tsx` | HomeRedirect + settings/audit routes |
| `frontend/src/utils/format.ts` | `formatMoney` + `mediaUrl` |
| `frontend/src/components/PaginationControls.tsx` | Shared pagination |
| `frontend/src/hooks/useDebouncedValue.ts` | Debounced search |
| `frontend/src/features/auth/*` (Login/Signup/ChangePassword/CompanySettings/AuthContext) | Logo + role home |
| `frontend/src/api/auth.ts` | FormData signup + logo upload |
| `frontend/src/features/audit/AuditLogsPage.tsx` | Audit UI |
| `backend/src/modules/auth/auth.*` | `POST /auth/company/logo` |
| `backend/prisma/schema.prisma` + indexes migration | List indexes |
| `backend/package.json` (+ lock) | `pdfkit` |
| `backend/src/modules/payroll/payslipPdf.ts` + `payroll.service.ts` + `payroll.repository.ts` | PDFKit wiring (runtime on main) |
| `backend/src/modules/timeoff/*` (year filter) | Year-scoped my requests (runtime on main) |
| `TEAM_OWNERS.md` | This file |

### Person B — Nidhish (copy from reference)
| File | What |
|------|------|
| `frontend/src/features/payroll/SalaryStructurePanel.tsx` | Salary UI (not JSON) |
| `frontend/src/features/employees/EmployeeProfilePage.tsx` | Full profile page |
| `frontend/src/features/employees/MyProfilePage.tsx` | My profile page |
| `frontend/src/features/employees/EmployeesPage.tsx` | Paginated directory |
| `frontend/src/features/payroll/PayrollPage.tsx` | Paginated payslips |
| `frontend/src/api/payroll.ts` | `myPayslips({ page, limit })` |

```bash
git show reference/copy-from-here:frontend/src/features/payroll/SalaryStructurePanel.tsx > frontend/src/features/payroll/SalaryStructurePanel.tsx
git show reference/copy-from-here:frontend/src/features/employees/EmployeeProfilePage.tsx > frontend/src/features/employees/EmployeeProfilePage.tsx
git show reference/copy-from-here:frontend/src/features/employees/MyProfilePage.tsx > frontend/src/features/employees/MyProfilePage.tsx
git show reference/copy-from-here:frontend/src/features/employees/EmployeesPage.tsx > frontend/src/features/employees/EmployeesPage.tsx
git show reference/copy-from-here:frontend/src/features/payroll/PayrollPage.tsx > frontend/src/features/payroll/PayrollPage.tsx
git show reference/copy-from-here:frontend/src/api/payroll.ts > frontend/src/api/payroll.ts
```

### Person C — Vignesh (copy from reference)
| File | What |
|------|------|
| `frontend/src/features/attendance/AttendanceAllPage.tsx` | Day-view pagination |
| `backend/src/modules/analytics/analytics.repository.ts` | Wage `aggregate` |

```bash
git show reference/copy-from-here:frontend/src/features/attendance/AttendanceAllPage.tsx > frontend/src/features/attendance/AttendanceAllPage.tsx
git show reference/copy-from-here:backend/src/modules/analytics/analytics.repository.ts > backend/src/modules/analytics/analytics.repository.ts
```

### Person D — Prajwal (copy from reference)
| File | What |
|------|------|
| `frontend/src/components/NavBar.tsx` | Logo + role-aware nav + notifications |
| `frontend/src/features/timeoff/TimeOffManagePage.tsx` | Paginated manage UI |
| `frontend/src/features/timeoff/TimeOffPage.tsx` | Calendar + year filter |
| `frontend/src/api/timeoff.ts` | `myRequests(year)` |

```bash
git show reference/copy-from-here:frontend/src/components/NavBar.tsx > frontend/src/components/NavBar.tsx
git show reference/copy-from-here:frontend/src/features/timeoff/TimeOffManagePage.tsx > frontend/src/features/timeoff/TimeOffManagePage.tsx
git show reference/copy-from-here:frontend/src/features/timeoff/TimeOffPage.tsx > frontend/src/features/timeoff/TimeOffPage.tsx
git show reference/copy-from-here:frontend/src/api/timeoff.ts > frontend/src/api/timeoff.ts
```

---

## Demo credentials

Password: **`Demo@2026`** · Admin: **`OIADLO20220001`** — see [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md).

**Employee login** goes to **`/me`** (My Profile), not the HR directory.
