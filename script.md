# Dayflow HRMS — Professional 3-Minute Video Demo Script

* **Total Duration:** 3:00 (180 seconds)
* **Delivery Tone:** Professional, concise, technical, and objective
* **Target Audience:** Hackathon Judges & Technical Reviewers
* **Pacing:** ~130 words per minute

---

## 🛠️ Recording Setup & Pre-Flight Checklist

1. **Seed Demo Data:**
   ```bash
   cd backend && npm run seed
   ```
2. **Pre-Authenticate Two Browser Windows / Tabs:**
   * **Window 1 (Employee Role):** `http://localhost:5173/login`
     * **Login ID:** `OIJODO20220002`
     * **Password:** `Demo@2026`
   * **Window 2 (Admin / HR Role — Incognito):** `http://localhost:5173/login`
     * **Login ID:** `OIADLO20220001`
     * **Password:** `Demo@2026`
3. **Display Settings:** 1080p resolution (1920×1080), browser zoom set to 110%.

---

## 🎬 Second-by-Second Video Script

### Segment 1: System Overview & Architecture [0:00 – 0:25] (25 seconds)

| Timestamp | Visual & On-Screen Actions | Spoken Dialogue |
| :--- | :--- | :--- |
| **0:00 – 0:12** | **Screen:** Login page (`/login`) displaying clean Dayflow interface.<br>**Action:** Highlight system branding, company code generation context, and authentication form. | *"This is Dayflow HRMS, a database-first workforce management platform where attendance records directly drive payroll computation."* |
| **0:12 – 0:25** | **Screen:** Architecture overview / active application running.<br>**Action:** Show the fast loading responsive layout. | *"The application is built with a decoupled architecture: React 19, Vite, and Tailwind CSS on the frontend, backed by Node.js, Express 5, Prisma ORM, and PostgreSQL, with Socket.io handling real-time presence."* |

---

### Segment 2: Employee Self-Service Workflows [0:25 – 1:05] (40 seconds)

| Timestamp | Visual & On-Screen Actions | Spoken Dialogue |
| :--- | :--- | :--- |
| **0:25 – 0:38** | **Screen:** Switch to Employee Window (`/me`).<br>**Action:** Highlight employee details (Role, Department, Manager hierarchy, and Skills). | *"Logging in as an employee, John Doe, the user lands directly on his profile page. This view provides access to organizational hierarchy, personal information, and assigned skill records."* |
| **0:38 – 0:50** | **Screen:** Top Navigation Bar.<br>**Action:** Click the **Check In** button. Status dot transitions to green with active timer. | *"Using the navigation widget, John registers his daily check-in. This writes a timestamped record to the attendance ledger and emits a presence event via WebSocket."* |
| **0:50 – 1:05** | **Screen:** Navigate to **Time Off** (`/timeoff`).<br>**Action:** Click **New Request** → Select `Paid Time Off` (2 days) → Click **Submit**. | *"In the Time Off module, leave quotas are tracked in real-time. Submitting a request automatically evaluates weekends and public holidays to ensure only valid working days deduct from allocations."* |

---

### Segment 3: HR Management & Real-Time Presence [1:05 – 1:50] (45 seconds)

| Timestamp | Visual & On-Screen Actions | Spoken Dialogue |
| :--- | :--- | :--- |
| **1:05 – 1:22** | **Screen:** Switch to Admin Window (`/employees`).<br>**Action:** Filter by department using the search bar. Point to status dots. | *"Switching to the administrator session, the Employee Directory provides a live operational overview. Status indicators reflect active attendance states: green for checked in, yellow for absent, and grey for approved leave."* |
| **1:22 – 1:35** | **Screen:** Navigate to **Time Off Management** (`/timeoff/manage`).<br>**Action:** Click **Approve** on John Doe’s pending leave request. | *"In the leave administration panel, pending requests can be reviewed and approved. Approval updates the employee's ledger balance and syncs with the attendance calendar."* |
| **1:35 – 1:50** | **Screen:** Open John Doe’s profile (`/employees/:id`).<br>**Action:** Scroll to the **Salary Structure** panel. | *"Under compensation, salary structures use a formula engine. Setting a monthly wage automatically computes Basic salary, statutory PF deductions, professional tax, and balances allowances."* |

---

### Segment 4: Payroll Engine & Payslip Generation [1:50 – 2:35] (45 seconds)

| Timestamp | Visual & On-Screen Actions | Spoken Dialogue |
| :--- | :--- | :--- |
| **1:50 – 2:12** | **Screen:** Navigate to **Payroll** (`/payroll`).<br>**Action:** Hover over the columns: *Total Working Days*, *LOP Days*, *Payable Days*, and *Net Pay*. | *"The payroll engine connects attendance directly to disbursements. For the monthly run, the system scans the attendance ledger, calculates Loss-of-Pay days from unapproved absences, and prorates gross earnings by the exact payable-day ratio."* |
| **2:12 – 2:35** | **Screen:** Click **Download Payslip**.<br>**Action:** Open the generated PDF/document. | *"Clicking download generates a standardized payslip server-side, listing itemized earnings, deductions, payable days, and final net pay."* |

---

### Segment 5: Analytics, Audit Logging & Conclusion [2:35 – 3:00] (25 seconds)

| Timestamp | Visual & On-Screen Actions | Spoken Dialogue |
| :--- | :--- | :--- |
| **2:35 – 2:48** | **Screen:** Open **Analytics** (`/analytics`) and **Audit Logs** (`/audit-logs`).<br>**Action:** Scroll through the KPI metrics and the audit log table. | *"The platform includes an Analytics Dashboard for workforce metrics and payroll trends, along with a structured Audit Log tracking all administrative modifications for security compliance."* |
| **2:48 – 3:00** | **Screen:** Return to system home page or repository screen.<br>**Action:** Conclude capture. | *"Dayflow HRMS provides a reliable, relational, and fully auditable solution for workforce administration. Thank you for your review."* |