# Dayflow ER diagram (Phase 7 — Prajwal)

Source: Build Plan §4. Paste into README or slides for the demo.

```mermaid
erDiagram
    COMPANY ||--o{ USER : has
    COMPANY ||--o{ DEPARTMENT : has
    COMPANY ||--o{ LEAVE_TYPE : defines
    COMPANY ||--o{ PUBLIC_HOLIDAY : defines
    COMPANY ||--o{ EMPLOYEE_SERIAL_COUNTER : tracks
    USER ||--|| EMPLOYEE : is
    EMPLOYEE ||--o| BANK_DETAILS : has
    EMPLOYEE ||--o| RESUME : has
    EMPLOYEE ||--o{ SKILL : has
    EMPLOYEE ||--o{ CERTIFICATION : has
    EMPLOYEE ||--o{ DOCUMENT : has
    EMPLOYEE ||--o{ SALARY_STRUCTURE : has
    SALARY_STRUCTURE ||--o{ SALARY_COMPONENT : contains
    EMPLOYEE ||--o{ ATTENDANCE_RECORD : logs
    EMPLOYEE ||--o{ LEAVE_ALLOCATION : holds
    LEAVE_TYPE ||--o{ LEAVE_ALLOCATION : for
    EMPLOYEE ||--o{ LEAVE_REQUEST : submits
    LEAVE_TYPE ||--o{ LEAVE_REQUEST : of
    EMPLOYEE ||--o{ PAYSLIP : receives
    PAYSLIP ||--o{ PAYSLIP_LINE : has
    DEPARTMENT ||--o{ EMPLOYEE : groups
    EMPLOYEE ||--o{ EMPLOYEE : manages
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : performs
```

## Demo talking points
- Money as `numeric`, never float
- Unique `(employee_id, date)` on attendance — no double check-in
- Salary components always sum to wage via `BALANCE`
- Attendance ledger drives payslip payable days
