# Dayflow — Team ownership & copy-paste workflow

## People

| Person | Name | Owns |
|--------|------|------|
| **A** | **Prasanna** | Auth, Prisma schema, common middleware, **seed**, **audit logs**, README/demo docs |
| **B** | **Nidhish** | Employees / Profile + Salary engine + Payslip PDF + **payroll tests** |
| **C** | **Vignesh** | Attendance + Socket.io presence + Analytics + **presence/analytics tests** |
| **D** | **Prajwal** | Time-off + Notifications + shared UI + **ER diagram / EmptyState / LoadingState** |

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Hourly commits. **Prasanna’s files are complete.** B/C/D Phase-7 (and any unfinished) files may be **placeholders**. |
| `reference/copy-from-here` | **Full working code** for everyone. Copy a file from this branch → paste into the **same path** on `main` → commit with **your** git user. |

### How to copy (B / C / D)

```bash
git fetch
git show reference/copy-from-here:path/to/file.ts > path/to/file.ts
git add path/to/file.ts
git commit -m "feat(module): implement <what>"
git push
```

**Rules**
- Commit **only files you own** (tables below).
- Do **not** edit someone else’s filled files on `main`.
- Do **not** change `backend/src/app.ts` unless you are Prasanna (router mounts / rate-limit).

---

## Phase 0–6 module ownership (existing)

### Person A — Prasanna
- `backend/prisma/schema.prisma`, `migrations/**`
- `backend/src/common/**` (except `common/socket` → Vignesh)
- `backend/src/modules/auth/**`
- `backend/src/server.ts`
- `backend/src/app.ts`
- `frontend/src/api/client.ts`, `frontend/src/api/auth.ts`
- `frontend/src/features/auth/**`
- `frontend/src/routes/guards.tsx`

### Person B — Nidhish
- `backend/src/modules/employees/**`
- `backend/src/modules/payroll/**` (except see Phase 7 test files — still B)
- `frontend/src/api/employees.ts`, `frontend/src/api/payroll.ts`
- `frontend/src/features/employees/**`
- `frontend/src/features/payroll/**`

### Person C — Vignesh
- `backend/src/common/socket/**`
- `backend/src/modules/attendance/**`
- `backend/src/modules/analytics/**`
- `frontend/src/api/attendance.ts`, `frontend/src/api/analytics.ts`
- `frontend/src/features/attendance/**`
- `frontend/src/features/analytics/**`

### Person D — Prajwal
- `backend/src/modules/timeoff/**`
- `backend/src/modules/notifications/**`
- `frontend/src/api/timeoff.ts`, `frontend/src/api/notifications.ts`
- `frontend/src/features/timeoff/**`
- `frontend/src/components/NavBar.tsx`, `FormField.tsx`, `Modal.tsx`, `DataTable.tsx`, `TabsPanel.tsx`, `StatCard.tsx`, `Calendar.tsx`, `ApprovalButtons.tsx`
- `frontend/src/index.css`

---

## Phase 7 ownership (no overlapping files)

### Person A — Prasanna (**largest share — already filled on `main`**)
| File | What |
|------|------|
| `backend/prisma/seed.ts` | Full demo seed (Odoo India, 10 users, attendance, leaves, payslip) |
| `backend/src/modules/audit/audit.routes.ts` | `GET /api/v1/audit-logs` (ADMIN) |
| `backend/src/modules/auth/companyCode.test.ts` | Company-code unit tests |
| `backend/src/app.ts` | Rate-limit + audit router mount |
| `backend/package.json` | `seed` / `test` scripts |
| `README.md` | Runbook |
| `DEMO_CREDENTIALS.md` | Demo logins |

### Person B — Nidhish (copy from reference)
| File | What |
|------|------|
| `backend/src/modules/payroll/salaryEngine.test.ts` | Salary engine unit tests (§5.3) |
| `backend/src/modules/payroll/payrollMath.test.ts` | Payable-day / LOP maths (§5.4) |
| `backend/src/modules/payroll/payslipPdf.ts` | Payslip PDF/text renderer |

### Person C — Vignesh (copy from reference)
| File | What |
|------|------|
| `backend/src/modules/attendance/presence.test.ts` | Presence status rules (§5.5) |
| `backend/src/modules/analytics/analyticsSummary.test.ts` | Dashboard summary helper tests |

### Person D — Prajwal (copy from reference)
| File | What |
|------|------|
| `docs/ER_DIAGRAM.md` | Mermaid ER diagram for demo |
| `frontend/src/components/EmptyState.tsx` | Empty-state UI |
| `frontend/src/components/LoadingState.tsx` | Loading-state UI |

---

## Demo credentials (after seed)

```bash
cd backend && npm run seed
```

Password for all seeded users: **`Demo@2026`**  
Admin login ID: **`OIADLO20220001`** — see [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md).
