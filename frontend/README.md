# Dayflow Frontend

React single-page app for Dayflow HRMS. Talks to the Express API over `/api/v1` (Vite proxy in development) and Socket.io for live presence.

Root project docs: [../README.md](../README.md)

---

## Stack

| Library | Role |
|---------|------|
| React 19 + TypeScript | UI |
| Vite 8 | Dev server & build |
| Tailwind CSS v4 | Styling (`index.css` design tokens) |
| React Router 7 | Client routes + auth guards |
| TanStack Query v5 | Server state / caching |
| Axios | HTTP client + Bearer token interceptor |
| Lucide React | Icons |
| Recharts | Analytics charts |
| Socket.io-client | Real-time presence |
| Zod | Client-side validation where used |

---

## Quick start

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: **http://localhost:5173**  
API (proxied): `http://localhost:3000` via Vite (`/api`, `/uploads`, `/socket.io`)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite on port 5173 |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |

---

## Environment

Copy from `.env.example`:

```ini
VITE_API_BASE_URL=/api/v1

# Optional demo clock (UTC YYYY-MM-DD). Empty = real today.
# Must match backend DEMO_TODAY when set.
VITE_DEMO_TODAY=
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Axios base URL. Prefer `/api/v1` so the Vite proxy forwards to the backend. |
| `VITE_DEMO_TODAY` | Overrides “today” for check-in UI / attendance month lookups (weekend demos). |

Helpers live in `src/utils/today.ts` (`todayKey()`, `todayMonthYear()`).

---

## Folder structure

```
frontend/
├── index.html
├── vite.config.ts          # React + Tailwind plugins, API/uploads/socket proxy
├── src/
│   ├── main.tsx
│   ├── App.tsx             # Routes, QueryClient, Theme + Auth providers
│   ├── index.css           # Light/dark tokens, df-card / df-btn utilities
│   ├── api/                # Axios modules (auth, employees, attendance, …)
│   ├── components/         # Shell + shared UI (NavBar, Modal, DataTable, …)
│   ├── features/           # Screens by domain
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── timeoff/
│   │   ├── payroll/
│   │   ├── analytics/
│   │   ├── audit/
│   │   └── theme/
│   ├── routes/guards.tsx   # RequireAuth, GuestOnly, role home redirect
│   └── utils/              # format.ts, today.ts
└── package.json
```

---

## Routes

| Path | Who | Screen |
|------|-----|--------|
| `/login` | Guest | Sign in |
| `/signup` | Guest | Create company + first admin |
| `/change-password` | Auth | Forced password change |
| `/employees` | Admin / HR | Directory + org chart |
| `/employees/:id` | Scoped | Employee profile (tabs: work, salary, …) |
| `/me` | All | My profile |
| `/attendance` | All | My monthly attendance + check-in |
| `/attendance/all` | Admin / HR | Company day view |
| `/timeoff` | All | Request leave / balances |
| `/timeoff/manage` | Admin / HR | Approvals |
| `/payroll` | All | My payslips; Admin/HR can generate |
| `/salary-policy` | Admin | Company salary calculation rules |
| `/analytics` | Admin / HR | Charts / summaries |
| `/settings` | Admin | Company settings |
| `/audit` | Admin | Audit log |

Default landing after login:

- Admin / HR → `/employees`
- Employee → `/me`

---

## UI system

- **Theme:** `ThemeProvider` (`features/theme`) + CSS variables in `index.css` (light lavender/sky, dark navy). Toggle in nav / auth shell.
- **Shell:** `AppLayout` + sidebar `NavBar` (desktop fixed, mobile drawer).
- **Primitives:** `df-card`, `df-btn`, `df-btn-primary`, `df-input`, `StatCard`, `Modal`, `DataTable`, `Skeleton`, `EmptyState`, `FormField` / `AuthShell`.
- **Auth links** on login/signup footers: bold blue text, underline on hover (no button chrome).

---

## Feature notes

### Auth (`features/auth`)

- Tokens stored in `localStorage` (`dayflow_access_token`); Axios attaches `Authorization: Bearer …`.
- Signup creates company + admin; login accepts login ID or email.

### Employees

- Paginated directory, create modal (temp credentials shown once).
- Profile: avatar upload, resume, skills, certifications, bank details.
- `OrgChart` on Employees page; `AssignManagerPanel` for Admin/HR.

### Attendance

- Check-in widget + monthly view; company day view for managers.
- Uses app “today” (`VITE_DEMO_TODAY`) so UI matches backend weekend override.

### Payroll

- Payslip list; PDF opens via authenticated blob download (not a bare `href` — avoids missing auth header).
- Admin: **Salary Policy** page; salary forms on employee profile use company policy for live preview.

### Time off & analytics

- Request / approve leave; analytics charts for managers.

---

## API client pattern

```ts
// src/api/client.ts — shared Axios instance + getApiError()
// src/api/payroll.ts — domain helpers, e.g. downloadPdf(id) with responseType: "blob"
```

Always call protected file endpoints through Axios (or `fetch` with the Bearer token). Opening `/api/v1/.../pdf` in a new tab without headers returns `UNAUTHORIZED`.

---

## Proxy (dev)

From `vite.config.ts`:

| Browser path | Target |
|--------------|--------|
| `/api/*` | `http://localhost:3000` |
| `/uploads/*` | `http://localhost:3000` |
| `/socket.io/*` | `http://localhost:3000` (WebSocket) |

Backend must be running on port **3000** for local UI work.
