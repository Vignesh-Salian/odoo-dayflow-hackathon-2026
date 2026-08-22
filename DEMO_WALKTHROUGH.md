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

> **Greenfield tip:** After signup, use **Employees → + New** in the UI. Copy the one-time login ID + temp password from the modal, then open **Salary Info** on the profile to set wage.

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
| Upload logo | Optional — any PNG/JPG |
| Country | `India` |
| First name | `Riya` |
| Last name | `Kapoor` |
| Email | `riya.admin@acme-robotics.test` |
| Phone | `+91-98000-11111` (optional) |
| Password | `Admin@2026` (must have upper + lower + digit, ≥8 chars) |
| Confirm password | `Admin@2026` |

| **Expected** |
|--------------|
| Account created. You land on **`/employees`** (Admin home). |
| Navbar shows **Acme Robotics** (+ logo if uploaded). Avatar has a **red** presence dot until you Check In. |
| Backend created default leave types: PTO, Sick, Unpaid. |
| Your admin login ID was auto-generated (looks like `ACRIKA2026xxxx`) — save it from **My Profile**. Email also works: `riya.admin@acme-robotics.test`. |

**Weak-password check (optional):** try password `abc` first → expect field error, then use `Admin@2026`.

---

## Phase 2 — Create an employee (UI)

Stay logged in as the new company Admin.

### 2.1 Add employee

| | |
|--|--|
| **Page** | `/employees` |
| **Action** | Click **+ New** |

| Field | Value |
|-------|--------|
| First name | `Amit` |
| Last name | `Sharma` |
| Work email | `amit.employee@acme-robotics.test` |
| Date of joining | `2026-01-15` |
| Role | Employee |
| Job position | `Software Engineer` |
| Phone | `+91-98765-43210` |
| Work location | `Bengaluru` |

Click **Create employee**.

| **Expected** |
|--------------|
| Modal switches to **“Employee created — save credentials”**. |
| Shows **Login ID** (e.g. `ACAMSH2026xxxx`) + **Temp password**. |
| Use **Copy login details** — employee needs these next (also printed in backend console). |
| Default leave allocations are created for the employee. |
| Directory card shows avatar initials + presence dot (yellow absent until check-in). |

### 2.2 Set salary structure

| | |
|--|--|
| **Action** | In the same modal, click **Open profile & set salary** (or open Amit’s card). |
| **Page** | `/employees/:id` → tab **Salary Info** |

Enter monthly wage `60000` → **Save salary structure**.

| **Expected** |
|--------------|
| Profile tabs: **Resume | Private Info | Salary Info**. |
| Salary Info shows Basic / HRA / allowances summing to ₹60,000 (+ break time if set). |
| Directory card for Amit Sharma is visible (search `Amit` if needed). |

Use the bottom **Check In → / Entry / Check Out →** widget on Employees to mark yourself present — avatar dot turns **green**.

---

## Phase 3 — First employee login + forced password change

### 3.1 Open incognito / second browser → Login
| | |
|--|--|
| **Page** | `/login` |
| **Input** | Login ID from the create modal · Password = **temp password from the modal** |

| **Expected** |
|--------------|
| Redirect to **`/change-password`** (`mustChangePassword = true`). |

### 3.2 Change password
| Field | Value |
|-------|--------|
| Current password | *(temp from create modal)* |
| New password | `Emp@2026` |

| **Expected** |
|--------------|
| Redirect to **`/me`** (employee home — not Employees directory). |
| Navbar shows **My Profile**, Attendance, Time Off, Payroll — **no** Approvals / Analytics / All attendance / Audit / Company logo. |

### 3.3 My Profile
| **Page** | `/me` |
| **Expected** | Tabs **Resume | Private Info | Salary Info | Security**. Header shows company / dept / manager / location. Salary Info read-only. Security can change password later. |

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

As Admin on `/employees` → **+ New**, set Role = **HR**:

| Field | Value |
|-------|--------|
| First name | `Sana` |
| Last name | `Iyer` |
| Work email | `hr.lead@acme-robotics.test` |
| Date of joining | `2026-02-01` |
| Role | HR |
| Job position | `HR Lead` |

Copy credentials from the modal → login → change password → HR can use Approvals / Analytics but **not** Company logo / Audit.

---

## Cheat sheet — accounts you just created

| Role | How to sign in | Password after setup |
|------|----------------|----------------------|
| Admin | `riya.admin@acme-robotics.test` (or generated login ID) | `Admin@2026` |
| Employee | Login ID from create-employee modal | `Emp@2026` (after forced change) |

---

## If something breaks

| Issue | Fix |
|-------|-----|
| Signup email already used | Pick a new email (`riya2@…`) or wipe that company in DB |
| No temp password | Copy from the create-employee modal (also logged in backend console) |
| Employee not forced to change password | Confirm they used the **temp** password from the modal |
| No salary on profile | Open employee → **Salary Info** as Admin → set monthly wage (step 2.2) |
| Empty Employees list | Hard refresh; confirm you are logged in as that company’s Admin |
| PDF missing logo | Upload logo on `/settings`, regenerate/download PDF again |
| Generate payslip fails “no structure” | Save salary structure under **Salary Info** first |

---

## Fast path (10 min for judges)

1. **Signup** Acme + logo (+ phone / confirm password)  
2. **+ New** Amit → copy creds → **Salary Info** set wage  
3. **Employee** login → password change → check-in (avatar turns green)  
4. **Leave** NEW request (see day count) → Admin **Time Off** approve  
5. **Generate payslip** → download PDF with logo  
6. **Analytics** + **Audit** flash  

For a pre-filled company instead, use seed + [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md) (`OIADLO20220001` / `Demo@2026`).
