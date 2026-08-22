# Dayflow HRMS

> *Every workday, perfectly aligned.*  
> Odoo × NMIT Hackathon 2026 — database-first HRMS (attendance ledger → payroll).

## Stack

- **Frontend:** React + Vite + Tailwind CSS v4 + React Router + TanStack Query  
- **Backend:** Node.js + Express + Prisma + Zod + JWT + Socket.io  
- **Database:** PostgreSQL (Neon now; Docker Compose for local later)

## Quick start

### Backend
```bash
cd backend
cp .env.example .env   # set DATABASE_URL + DIRECT_URL (Neon)
npm install
npx prisma migrate deploy
npm run seed           # demo company + users
npm run dev            # http://localhost:3000
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## Demo credentials (after `npm run seed`)

**Password for all accounts:** `Demo@2026`

| Role | Login ID | Email |
|------|----------|-------|
| ADMIN | `OIADLO20220001` | ada.admin@odoo-india.demo |
| HR | `OIHARA20230001` | hari.hr@odoo-india.demo |
| EMPLOYEE | `OIJODO20220002` | john.doe@odoo-india.demo |

(More employees are printed by the seed script.)

## Team

See [TEAM_OWNERS.md](TEAM_OWNERS.md) and branch `reference/copy-from-here` for full module copies.

| Person | Name | Owns |
|--------|------|------|
| A | Prasanna | Auth, Prisma schema, common middleware, seed/audit |
| B | Nidhish | Employees + Payroll |
| C | Vignesh | Attendance + Socket + Analytics |
| D | Prajwal | Time-off + Notifications + UI system |

## API

Base: `http://localhost:3000/api/v1`  
Health: `GET /health`  
Audit (ADMIN): `GET /api/v1/audit-logs`

## Tests
```bash
cd backend && npm test
```

## Plan

Source of truth: [Dayflow_HRMS_Build_Plan.md](Dayflow_HRMS_Build_Plan.md)
