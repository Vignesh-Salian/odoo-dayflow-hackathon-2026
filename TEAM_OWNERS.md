# Dayflow — Team ownership & copy-paste workflow

## People

| Person | Name | Owns |
|--------|------|------|
| **A** | **Prasanna** | DB schema, migrations, Auth (login-id, JWT, RBAC), shared backend common |
| **B** | **Nidhish** | Employees / Profile + Salary engine + Payslip PDF |
| **C** | **Vignesh** | Attendance + Socket.io presence + Analytics |
| **D** | **Prajwal** | Time-off + shared UI design system + Notifications |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | **Demo / hourly commits.** Prasanna’s files are complete. B/C/D files are **placeholders** (TODO headers). Each person commits into *their* files every hour. |
| `reference/copy-from-here` | **Full working code** for B/C/D (and A). Teammates open this branch, copy a file’s contents, paste into the same path on `main`. |

### How to copy (B / C / D)

```bash
git fetch
git show reference/copy-from-here:path/to/file.ts > path/to/file.ts
# or open the file on GitHub on that branch and copy-paste
```

Then commit on your feature branch / `main` with your own git user:

```bash
git add path/to/file.ts
git commit -m "feat(module): implement <what you added>"
git push
```

---

## Person A — Prasanna (filled on `main`)

### Backend
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/**`
- `backend/prisma/seed.ts`
- `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, `backend/.gitignore`
- `backend/src/server.ts`
- `backend/src/app.ts` *(wires routers — leave mount lines for B/C/D)*
- `backend/src/common/**` *(config, db, errors, middleware, utils)*
- `backend/src/modules/auth/**`

### Frontend
- `frontend/src/api/client.ts`
- `frontend/src/api/auth.ts`
- `frontend/src/features/auth/**`
- `frontend/src/routes/guards.tsx`
- `frontend/src/main.tsx`
- `docker-compose.yml`

---

## Person B — Nidhish

### Backend
- `backend/src/modules/employees/employees.routes.ts`
- `backend/src/modules/employees/employees.controller.ts`
- `backend/src/modules/employees/employees.service.ts`
- `backend/src/modules/employees/employees.repository.ts`
- `backend/src/modules/employees/employees.schema.ts`
- `backend/src/modules/payroll/payroll.routes.ts`
- `backend/src/modules/payroll/payroll.controller.ts`
- `backend/src/modules/payroll/payroll.service.ts`
- `backend/src/modules/payroll/payroll.repository.ts`
- `backend/src/modules/payroll/payroll.schema.ts`
- `backend/src/modules/payroll/salaryEngine.ts`
- `backend/src/modules/payroll/payslipPdf.ts`

### Frontend
- `frontend/src/api/employees.ts`
- `frontend/src/api/payroll.ts`
- `frontend/src/features/employees/EmployeesPage.tsx`
- `frontend/src/features/employees/EmployeeProfilePage.tsx`
- `frontend/src/features/employees/MyProfilePage.tsx`
- `frontend/src/features/employees/EmployeeCard.tsx`
- `frontend/src/features/payroll/PayrollPage.tsx`

---

## Person C — Vignesh

### Backend
- `backend/src/modules/attendance/attendance.routes.ts`
- `backend/src/modules/attendance/attendance.controller.ts`
- `backend/src/modules/attendance/attendance.service.ts`
- `backend/src/modules/attendance/attendance.repository.ts`
- `backend/src/modules/attendance/attendance.schema.ts`
- `backend/src/modules/analytics/analytics.routes.ts`
- `backend/src/modules/analytics/analytics.controller.ts`
- `backend/src/modules/analytics/analytics.service.ts`
- `backend/src/modules/analytics/analytics.repository.ts`
- `backend/src/common/socket/index.ts`

### Frontend
- `frontend/src/api/attendance.ts`
- `frontend/src/api/analytics.ts`
- `frontend/src/features/attendance/AttendancePage.tsx`
- `frontend/src/features/attendance/AttendanceAllPage.tsx`
- `frontend/src/features/attendance/StatusDot.tsx`
- `frontend/src/features/analytics/AnalyticsPage.tsx`

---

## Person D — Prajwal

### Backend
- `backend/src/modules/timeoff/timeoff.routes.ts`
- `backend/src/modules/timeoff/timeoff.controller.ts`
- `backend/src/modules/timeoff/timeoff.service.ts`
- `backend/src/modules/timeoff/timeoff.repository.ts`
- `backend/src/modules/timeoff/timeoff.schema.ts`
- `backend/src/modules/notifications/notifications.routes.ts`
- `backend/src/modules/notifications/notifications.controller.ts`
- `backend/src/modules/notifications/notifications.service.ts`
- `backend/src/modules/notifications/notifications.repository.ts`
- `backend/src/modules/notifications/notifications.schema.ts`

### Frontend
- `frontend/src/api/timeoff.ts`
- `frontend/src/api/notifications.ts`
- `frontend/src/features/timeoff/TimeOffPage.tsx`
- `frontend/src/features/timeoff/TimeOffManagePage.tsx`
- `frontend/src/components/DataTable.tsx`
- `frontend/src/components/TabsPanel.tsx`
- `frontend/src/components/Modal.tsx`
- `frontend/src/components/StatCard.tsx`
- `frontend/src/components/Calendar.tsx`
- `frontend/src/components/ApprovalButtons.tsx`
- `frontend/src/components/NavBar.tsx` *(shared shell — Prajwal polishes)*
- `frontend/src/components/FormField.tsx` *(shared — Prajwal polishes)*
- `frontend/src/index.css` *(design tokens — Prajwal owns look)*

---

## Shared wiring (careful when merging)

- `backend/src/app.ts` — Prasanna mounts routers; each person only edits **their** `app.use` line if needed.
- `frontend/src/App.tsx` — route table; each person replaces their `PlaceholderPage` with their real page import.

## Hourly commit tip

Commit **only files you own**. Do not rewrite someone else’s filled files on `main`.
