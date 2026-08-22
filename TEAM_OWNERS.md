# Dayflow — Team ownership & copy-paste workflow

## People

| Person | Name | Owns |
|--------|------|------|
| **A** | **Prasanna** | Auth, Prisma, common middleware, seed, audit, company logo, routing/home |
| **B** | **Nidhish** | Employees / Profile UI + Salary panel + Payslip PDFKit |
| **C** | **Vignesh** | Attendance day-view pagination + Analytics query polish |
| **D** | **Prajwal** | NavBar (role-aware) + Time-off list polish |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Hourly commits. **Prasanna’s Phase-8 files are complete.** B/C/D Phase-8 files may be **placeholders**. |
| `reference/copy-from-here` | **Full working code.** Copy → same path on `main` → commit with **your** git user. |

### How to copy (B / C / D)

```bash
git fetch
git show reference/copy-from-here:path/to/file > path/to/file
git add path/to/file
git commit -m "feat(module): implement <what>"
git push
```

**Rules**
- Commit **only files you own** (tables below).
- Do **not** edit someone else’s filled files on `main`.

---

## Phase 0–7 (existing — already on main)

See prior module ownership: Auth (A), Employees/Payroll (B), Attendance/Analytics (C), Time-off/UI (D). Phase 7 copy-paste is done.

---

## Phase 8 ownership (UI polish + logo + PDF — no overlapping files)

### Person A — Prasanna (**largest — filled on `main`**)
| File | What |
|------|------|
| `frontend/src/routes/guards.tsx` | Role-based `homePathFor` / `HomeRedirect` (employees → `/me`) |
| `frontend/src/App.tsx` | Routes: settings, audit, HomeRedirect |
| `frontend/src/utils/format.ts` | `formatMoney` + `mediaUrl` |
| `frontend/src/components/PaginationControls.tsx` | Shared pagination footer |
| `frontend/src/hooks/useDebouncedValue.ts` | Debounced search hook |
| `frontend/src/features/auth/LoginPage.tsx` | Login lands on role home |
| `frontend/src/features/auth/SignupPage.tsx` | Logo upload on signup |
| `frontend/src/features/auth/ChangePasswordPage.tsx` | Post-change role home |
| `frontend/src/features/auth/AuthContext.tsx` | Signup accepts `logo` file |
| `frontend/src/features/auth/CompanySettingsPage.tsx` | Admin upload/replace logo |
| `frontend/src/api/auth.ts` | FormData signup + `updateCompanyLogo` |
| `frontend/src/features/audit/AuditLogsPage.tsx` | Audit log UI |
| `backend/src/modules/auth/auth.controller.ts` | Logo update handler |
| `backend/src/modules/auth/auth.routes.ts` | `POST /auth/company/logo` |
| `backend/src/modules/auth/auth.service.ts` | `updateCompanyLogo` |
| `backend/prisma/schema.prisma` + `migrations/20260822064905_add_list_query_indexes/**` | List-query indexes |
| `backend/package.json` / `package-lock.json` | `pdfkit` dependency |
| `TEAM_OWNERS.md` | This file |

### Person B — Nidhish (copy from reference)
| File | What |
|------|------|
| `frontend/src/features/payroll/SalaryStructurePanel.tsx` | Salary UI (not raw JSON) |
| `frontend/src/features/employees/EmployeeProfilePage.tsx` | Full profile + salary panel |
| `frontend/src/features/employees/MyProfilePage.tsx` | My profile + salary panel |
| `frontend/src/features/employees/EmployeesPage.tsx` | Directory pagination + employee redirect |
| `frontend/src/features/payroll/PayrollPage.tsx` | Payslips pagination unwrap |
| `frontend/src/api/payroll.ts` | `myPayslips` page params |
| `backend/src/modules/payroll/payslipPdf.ts` | Real PDFKit payslip + logo |
| `backend/src/modules/payroll/payroll.service.ts` | PDF download wiring |
| `backend/src/modules/payroll/payroll.repository.ts` | Slim payslip list + company on PDF |

### Person C — Vignesh (copy from reference)
| File | What |
|------|------|
| `frontend/src/features/attendance/AttendanceAllPage.tsx` | Day-view pagination |
| `backend/src/modules/analytics/analytics.repository.ts` | Wage `aggregate` (no findMany+reduce) |

### Person D — Prajwal (copy from reference)
| File | What |
|------|------|
| `frontend/src/components/NavBar.tsx` | Logo + role-aware links (no Employees for staff) |
| `frontend/src/features/timeoff/TimeOffManagePage.tsx` | Requests/allocations pagination |
| `frontend/src/features/timeoff/TimeOffPage.tsx` | Year-scoped my requests |
| `frontend/src/api/timeoff.ts` | `myRequests(year)` |
| `backend/src/modules/timeoff/timeoff.schema.ts` | `myLeaveRequestsQuerySchema` |
| `backend/src/modules/timeoff/timeoff.routes.ts` | Validate year on `/leave/requests/me` |
| `backend/src/modules/timeoff/timeoff.controller.ts` | Pass year |
| `backend/src/modules/timeoff/timeoff.service.ts` | Year filter |
| `backend/src/modules/timeoff/timeoff.repository.ts` | `listMyRequests` year filter |

---

## Demo credentials

```bash
cd backend && npm run seed
```

Password: **`Demo@2026`** · Admin: **`OIADLO20220001`** — see [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md).
