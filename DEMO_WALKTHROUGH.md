# Dayflow — End-to-end test (start from new company)

This walkthrough starts with **creating a brand-new company** and walks the full product flow.  
Use a **second browser / incognito** for the employee login.

**URLs:** frontend `http://localhost:5173` · API `http://localhost:3000`

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

> **Note:** There is still **no “Add employee” button in the UI**. Creating staff is done via API (steps below). Watch the **backend terminal** for the printed `loginId` + temp password.

---

## Nidhish’s Phase 8 commit

**Yes — done correctly.**

- Commit: `4619add` — *feat(phase8): implement paginated employees, profile, payroll and salary panel UI*
- All 6 owned files match `reference/copy-from-here` (no placeholders left)

---

## Phase 1 — Create company (Admin signup)

### 1.1 Open signup
| | |
|--|--|
| **Page** | `http://localhost:5173/signup` |
| **What** | “Create your company” form |

### 1.2 Fill and submit
| Field | Value to enter |
|-------|----------------|
| Company name | `Acme Robotics` |
| Company logo | Optional — any PNG/JPG |
| Country | `India` |
| First name | `Riya` |
| Last name | `Kapoor` |
| Admin email | `riya.admin@acme-robotics.test` |
| Password | `Admin@2026` (must have upper + lower + digit, ≥8 chars) |

| **Expected** |
|--------------|
| Account created. You land on **`/employees`** (Admin home). |
| Navbar shows **Acme Robotics** (+ logo if uploaded). |
| Backend created default leave types: PTO, Sick, Unpaid (and Casual if seeded in signup). |
| Your admin login ID was auto-generated (looks like `ACRIKA2026xxxx`) — save it from profile/API if you need to re-login. Email also works: `riya.admin@acme-robotics.test`. |

**Weak-password check (optional):** try password `abc` first → expect field error, then use `Admin@2026`.

---

## Phase 2 — Create an employee (API — no UI yet)

Stay logged in as Admin in the browser. Open DevTools → Application → Local Storage → copy `dayflow_access_token`.

### 2.1 Create employee via API

In PowerShell (replace `YOUR_TOKEN`):

```powershell
$token = "YOUR_TOKEN"

$body = @{
  email         = "amit.employee@acme-robotics.test"
  firstName     = "Amit"
  lastName      = "Sharma"
  dateOfJoining = "2026-01-15"
  role          = "EMPLOYEE"
  phone         = "+91-98765-43210"
  jobPosition   = "Software Engineer"
  workLocation  = "Bengaluru"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/v1/employees" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body
```

| **Expected** |
|--------------|
| JSON with new employee `id` and user `loginId`. |
| **Backend console** prints something like: |
| `[employee-created] loginId=ACAMSH2026xxxx email=amit.employee@acme-robotics.test tempPassword=........` |
| **Copy `loginId` + `tempPassword`** — employee needs them next. |
| Default leave allocations are created for the employee. |

Save from the response:
- `employeeId` (UUID)
- `loginId`

### 2.2 Set salary structure (Admin only)

```powershell
$employeeId = "PASTE_EMPLOYEE_UUID"

$salary = @{
  monthlyWage       = 60000
  workingDaysPerWeek = 5
  pfEmployeeRate    = 12
  pfEmployerRate    = 12
  professionalTax   = 200
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/v1/payroll/salary-structure/$employeeId" `
  -Method PUT `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $salary
```

| **Expected** |
|--------------|
| Returns structure with components (Basic 50%, HRA, allowances, Fixed Allowance BALANCE) summing to ₹60,000. |

### 2.3 Refresh Employees page
| | |
|--|--|
| **Page** | `/employees` |
| **Expected** | Amit Sharma card appears (search `Amit` if needed). Click card → profile shows job + **salary table** (not JSON). |

---

## Phase 3 — First employee login + forced password change

### 3.1 Open incognito / second browser → Login
| | |
|--|--|
| **Page** | `/login` |
| **Input** | Login ID = printed `ACAMSH…` · Password = **temp password from backend log** |

| **Expected** |
|--------------|
| Redirect to **`/change-password`** (`mustChangePassword = true`). |

### 3.2 Change password
| Field | Value |
|-------|--------|
| Current password | *(temp from backend)* |
| New password | `Emp@2026` |

| **Expected** |
|--------------|
| Redirect to **`/me`** (employee home — not Employees directory). |
| Navbar shows **My Profile**, Attendance, Time Off, Payroll — **no** Approvals / Analytics / All attendance / Audit / Company logo. |

### 3.3 My Profile
| **Page** | `/me` |
| **Expected** | Name, phone, location. Salary section read-only with INR breakdown. |

---

## Phase 4 — Daily attendance (Employee)

### 4.1 Check-in
| | |
|--|--|
| **Page** | `/attendance` |
| **Action** | Click **Check In** |

| **Expected** |
|--------------|
| Success banner. Today shows check-in time. Presence → in-office. |

### 4.2 Check-out (later)
| **Action** | **Check Out** |
| **Expected** | Check-out time + work hours calculated. Cannot check in twice the same day. |

### 4.3 Regularization (optional)
| | |
|--|--|
| **Action** | **Request regularization** |
| **Input** | Date = yesterday (weekday). Check-in `09:00`. Check-out `18:00`. Reason: `Forgot to punch out`. |
| **Expected** | Pending request created (Admin/HR can decide later if UI exists; API supports it). |

---

## Phase 5 — Leave (Employee → Admin approve)

### 5.1 Employee applies
| | |
|--|--|
| **Page** | `/timeoff` → **New request** |
| **Input** | Type: **Paid Time Off**. Start/End: two future weekdays. Reason: `Family function`. Submit. |

| **Expected** |
|--------------|
| Calendar shows pending leave. Balance cards visible. |

**Sick leave variant:** Type **Sick** → attach a small PDF/PNG → Submit. Without file → validation error.

### 5.2 Admin approves
| | |
|--|--|
| **Browser** | Back to Admin (Riya) |
| **Page** | `/timeoff/manage` · Status **Pending** |
| **Action** | Approve Amit’s request → comment `Approved for wedding travel` → Confirm |

| **Expected** |
|--------------|
| Status → APPROVED. Employee bell gets a notification. Calendar colour updates when Amit refreshes. |

---

## Phase 6 — Payroll chain (Admin → Employee PDF)

### 6.1 Admin generates payslips
| | |
|--|--|
| **Page** | `/payroll` (as Admin) |
| **Input** | Month = current month · Year = `2026` → **Generate payslips** |

| **Expected** |
|--------------|
| Success (uses attendance + leave + salary structure). If already generated, may need overwrite or pick another month. |

### 6.2 Employee downloads PDF
| | |
|--|--|
| **Browser** | Amit |
| **Page** | `/payroll` → **PDF** on his slip |

| **Expected** |
|--------------|
| Real PDF downloads. Header shows **Acme Robotics** (+ logo if you uploaded one). Net pay / lines present. |

---

## Phase 7 — Admin extras

### 7.1 Company attendance day view
| **Page** | `/attendance/all` |
| **Expected** | Amit appears for today with presence / times. Pagination works if many staff. |

### 7.2 Analytics
| **Page** | `/analytics` |
| **Expected** | Headcount ≥ 2 (admin + Amit), present today, pending counts, charts. |

### 7.3 Audit log
| **Page** | Avatar → **Audit log** → `/audit` |
| **Expected** | Admin-only list of sensitive actions. |

### 7.4 Notifications
| **Page** | Bell icon |
| **Expected** | Unread badge; mark read works. |

### 7.5 Security
| As Amit, open `/employees` or `/analytics` or `/settings` |
| **Expected** | Redirected away — cannot manage company or see directory. |

---

## Phase 8 — Optional: create HR user

As Admin, API create with `"role": "HR"`:

```json
{
  "email": "hr.lead@acme-robotics.test",
  "firstName": "Sana",
  "lastName": "Iyer",
  "dateOfJoining": "2026-02-01",
  "role": "HR",
  "jobPosition": "HR Lead"
}
```

Then login with printed temp password → change password → HR can use Approvals / Analytics but **not** Company logo / Audit.

---

## Cheat sheet — accounts you just created

| Role | How to sign in | Password after setup |
|------|----------------|----------------------|
| Admin | `riya.admin@acme-robotics.test` (or generated login ID) | `Admin@2026` |
| Employee | Login ID from backend log | `Emp@2026` (after forced change) |

---

## If something breaks

| Issue | Fix |
|-------|-----|
| Signup email already used | Pick a new email (`riya2@…`) or wipe that company in DB |
| No temp password | Look at **backend** terminal right after POST `/employees` |
| Employee not forced to change password | Confirm create response had `mustChangePassword: true` |
| No salary on profile | Re-run PUT salary-structure (step 2.2) |
| Empty Employees list | Hard refresh; confirm token is Admin’s |
| PDF missing logo | Upload logo on `/settings`, regenerate/download PDF again |
| Generate payslip fails “no structure” | Salary PUT must succeed first |

---

## Fast path (10 min for judges)

1. **Signup** Acme + logo  
2. **API create** Amit + salary  
3. **Employee** login → password change → check-in  
4. **Leave** apply → Admin approve  
5. **Generate payslip** → download PDF with logo  
6. **Analytics** + **Audit** flash  

For a pre-filled company instead, use seed + [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md) (`OIADLO20220001` / `Demo@2026`).
