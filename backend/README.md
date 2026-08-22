# Dayflow Backend

Express + TypeScript API for Dayflow HRMS. Owns auth, employees, attendance, time off, payroll, analytics, notifications, and audit — with Prisma/PostgreSQL and Socket.io presence.

Root project docs: [../README.md](../README.md)

---

## Stack

| Piece | Tech |
|-------|------|
| Runtime | Node.js, Express 5, TypeScript (ESM) |
| Validation | Zod |
| ORM / DB | Prisma 6 → PostgreSQL |
| Auth | JWT access + refresh, bcrypt passwords |
| Realtime | Socket.io |
| Files / PDF | Multer uploads, PDFKit payslips |
| Security | Helmet, CORS, rate limiting |

---

## Quick start

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL, DIRECT_URL, JWT_* secrets

npm install
npx prisma generate
npx prisma db push          # or: npx prisma migrate dev
npm run seed                # Odoo India demo company + users
npm run dev                 # http://localhost:3000
```

Health / API base: **`http://localhost:3000/api/v1`**

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | `tsx watch` — API + Socket.io |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled server |
| `npm run seed` | Seed demo data |
| `npm test` | Unit tests (salary, presence, analytics, …) |
| `npx prisma studio` | Browse DB |
| `npx prisma generate` | Regenerate client after schema changes |

---

## Environment

See `.env.example`. Important variables:

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `CORS_ORIGIN` | Allowed frontends (comma-separated) |
| `DATABASE_URL` | Pooled Postgres URL (runtime) |
| `DIRECT_URL` | Direct URL (migrations) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets (≥16 chars) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `UPLOAD_DIR` | Local upload root (default `uploads`) |
| `APP_URL` | Frontend URL (links in emails / tokens) |
| `SMTP_*` | Optional email; if unset, tokens may be logged |
| **`DEMO_TODAY`** | Optional `YYYY-MM-DD` (UTC). Overrides “today” for check-in / presence. Empty = real date. Use a weekday for weekend demos. |

`DEMO_TODAY` is read in `todayUtcDate()` (attendance + employee presence). Keep frontend `VITE_DEMO_TODAY` in sync.

---

## Folder structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Models & enums
│   └── seed.ts             # Demo company, 14 employees, attendance, leaves, payslips
├── src/
│   ├── server.ts           # HTTP + Socket.io listen
│   ├── app.ts              # Middleware & routers
│   ├── common/
│   │   ├── config/env.ts   # Zod-parsed env (incl. DEMO_TODAY)
│   │   ├── db/prisma.ts
│   │   ├── middleware/     # auth, validate, errors
│   │   ├── errors/
│   │   ├── socket/         # presence / attendance events
│   │   └── utils/
│   └── modules/
│       ├── auth/
│       ├── employees/
│       ├── attendance/
│       ├── timeoff/
│       ├── payroll/        # salaryEngine, payslipPdf, company policy
│       ├── analytics/
│       ├── notifications/
│       └── audit/
├── uploads/                # Runtime files (gitignored)
└── package.json
```

Each module typically has: `*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.repository.ts` + Zod `*.schema.ts`.

---

## Modules

### Auth

- Company signup (creates company + ADMIN + default leave types)
- Login (login ID or email), refresh, logout patterns
- Change password / `mustChangePassword` gate
- Company settings (logo, etc.)

### Employees

- Paginated list, create (auto login ID + temp password), profile get/patch
- Resume, skills, certifications (file upload), bank details
- Manager assignment; presence status for directory

### Attendance

- Check-in / check-out (blocked on weekends & holidays unless `DEMO_TODAY` is a weekday)
- Monthly self view; company day view (Admin/HR)
- Regularization request / decision
- Emits Socket.io presence updates

### Time off

- Leave types, balances, request, approve/reject
- Working-day counting (excludes weekends/holidays)
- Sync with attendance when approved

### Payroll

- **Company salary policy** (`GET/PUT /payroll/company-policy`) — ADMIN configures component rules + PF/PT defaults
- **Salary structure** per employee — uses company policy components when creating/updating wage
- **Salary engine** (`salaryEngine.ts`) — `PERCENT_OF_WAGE` / `PERCENT_OF_BASIC` / `FIXED_AMOUNT` / `BALANCE`
- Generate payslips (Admin/HR); list mine; download PDF (auth required)

### Analytics / notifications / audit

- Manager dashboards; in-app notifications; admin audit trail

---

## API overview

Base path: **`/api/v1`**

Auth header: `Authorization: Bearer <access_token>`

### Auth

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/auth/company-signup` | Public |
| `POST` | `/auth/login` | Public |
| `POST` | `/auth/refresh` | Public |
| `POST` | `/auth/change-password` | Authenticated |
| `GET` | `/auth/me` | Authenticated |

### Employees

| Method | Path | Access |
|--------|------|--------|
| `GET` | `/employees` | Authenticated (scoped) |
| `POST` | `/employees` | Admin / HR |
| `GET` | `/employees/:id` | Scoped |
| `PATCH` | `/employees/:id` / `/employees/me` | Scoped |

*(Plus bank / resume / certifications / manager endpoints as implemented in `employees.routes.ts`.)*

### Attendance

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/attendance/check-in` | Self |
| `POST` | `/attendance/check-out` | Self |
| `GET` | `/attendance/me` | Self (month/year query) |
| `GET` | `/attendance/day` | Admin / HR |
| Regularize routes | … | Self / managers |

### Time off

| Method | Path | Access |
|--------|------|--------|
| Types / balances / requests | `/timeoff/...` | Authenticated |
| Approve / reject | `/timeoff/manage/...` | Admin / HR |

### Payroll

| Method | Path | Access |
|--------|------|--------|
| `GET` / `PUT` | `/payroll/company-policy` | Get: auth; Put: **ADMIN** |
| `GET` / `PUT` | `/payroll/salary-structure/:employeeId` | Get: scoped; Put: **ADMIN** |
| `POST` | `/payroll/payslips/generate` | Admin / HR |
| `GET` | `/payroll/payslips/me` | Self |
| `GET` | `/payroll/payslips/:id/pdf` | Scoped (Bearer required) |

### Analytics / audit / notifications

Mounted under `/analytics`, `/audit`, `/notifications` — see respective `*.routes.ts`.

Envelope shape:

```json
{ "success": true, "data": { }, "error": null }
```

Errors:

```json
{ "success": false, "data": null, "error": { "code": "WEEKEND", "message": "…" } }
```

---

## Salary formula (default policy)

When no custom policy exists, defaults mirror:

1. Basic = 50% of monthly wage  
2. HRA = 50% of Basic  
3. Standard Allowance = fixed ₹4,167  
4. Performance Bonus ≈ 8.333% of Basic  
5. LTA ≈ 8.333% of Basic  
6. Fixed Allowance = **balance** so components sum exactly to wage  
7. Employee PF % of Basic + Professional Tax → deductions; net ≈ wage − deductions  

Company admins can change rules on **Salary Policy**; new/updated structures pull those components server-side.

---

## Database & seed

- Schema: `prisma/schema.prisma` (Company, User, Employee, Attendance, TimeOff, SalaryStructure, CompanySalaryPolicy, Payslip, …)
- Seed (`npm run seed`): company **Odoo India**, departments, ~14 employees with profiles, attendance history, leaves, payslips, notifications  
- Credentials: [../DEMO_CREDENTIALS.md](../DEMO_CREDENTIALS.md) — password **`Demo@2026`**

After schema changes:

```bash
npx prisma generate
npx prisma db push   # hackathon-friendly; use migrate in stricter workflows
```

If `prisma generate` fails with `EPERM` on Windows, stop `npm run dev` and retry (query engine DLL lock).

---

## Tests

```bash
npm test
```

Covers:

- `salaryEngine.test.ts` — component math / balance  
- `payrollMath.test.ts` — payable days / LOP style math  
- `presence.test.ts` — presence status derivation  
- `companyCode.test.ts` — company code generation  
- `analyticsSummary.test.ts` — summary aggregates  

---

## Socket.io

Server attaches to the same HTTP server. Clients join company rooms; attendance check-in/out emits presence updates so directory / nav indicators refresh without full reload.

---

## Local Postgres (optional)

If using root `docker-compose.yml`:

```bash
# from repo root
docker compose up -d
```

Then point `DATABASE_URL` / `DIRECT_URL` at local Postgres as commented in `.env.example`.
