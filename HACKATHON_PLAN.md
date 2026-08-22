# Odoo x NMIT Hackathon '26 - Master Execution Plan

> **Core Philosophy**: Strong real-world software engineering over flashy gimmicks.  
> Priorities: Problem Understanding $\rightarrow$ Database Design $\rightarrow$ Backend APIs $\rightarrow$ Real Dynamic Data $\rightarrow$ Input Validation & Error Handling $\rightarrow$ Interactive UI $\rightarrow$ End-to-End Integration $\rightarrow$ Demo.

---

## ? Official Schedule & Milestones

| Time Window | Phase | Primary Engineering Objectives | Deliverables / Checkpoints |
| :--- | :--- | :--- | :--- |
| **8:30 – 9:00 AM** | **Problem Analysis** | Complete 18-Point deconstruction, define domain entities, inputs/outputs | 18-Point Analysis Document & Team Alignment |
| **9:00 – 9:30 AM** | **Database & Architecture** | Define relational schema (PostgreSQL/MySQL), API contracts, roles | Submit GitHub Repo, Add Evaluator, DB Initialized |
| **9:30 – 11:00 AM** | **MVP Foundation** | Build the first end-to-end flow: Form $\rightarrow$ Validation $\rightarrow$ API $\rightarrow$ Database $\rightarrow$ UI Table | Working End-to-End Thin Slice on `main` |
| **11:00 – 1:00 PM** | **Core Feature Build** | Parallel implementation of core business logic, CRUD, validation rules | Hourly Commits & Merged Core Flows |
| **1:00 – 2:00 PM** | **Integration & Real Data** | Connect frontend components with backend endpoints, verify dynamic DB updates | Full-Stack Working System with Real Dynamic Data |
| **2:00 – 3:30 PM** | **Edge Cases & Differentiators** | Comprehensive validation rules, constraint checks, analytics/differentiators | Feature Freeze (No new features after 3:30) |
| **3:30 – 4:15 PM** | **Testing & Bug Fixes** | Edge cases, form validation, error states, empty states, UI polish | Robust, Zero-Crash Build on `main` |
| **4:15 – 4:45 PM** | **Demo Prep & Script** | Rehearse 5-min demo flow, prepare realistic test data in PostgreSQL/MySQL | Recorded Dry Run / Script Ready |
| **4:45 – 5:00 PM** | **Code Freeze & Final Push** | Final GitHub repository review, update README with screenshots | Coding Ends (5:00 PM Hard Stop) |
| **5:00 – 5:30 PM** | **Demo Video Submission** | Record, upload open-access video (<= 5 min), submit final link | Submission Completed Before 5:30 PM |

---

## ?? Mandatory Hourly Git Checklist

| Time Check | Dev 1 (Lead) | Dev 2 (Frontend) | Dev 3 (Backend) | Dev 4 (Data/Feature) | Main Branch Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **10:00 AM** | [ ] Initial API router & CORS | [ ] Base layout & forms | [ ] SQLAlchemy models & schema | [ ] Service logic foundation | Main builds cleanly |
| **11:00 AM** | [ ] Core endpoint validation | [ ] Form validation state | [ ] DB queries & CRUD operations | [ ] Business rule calculations | Thin slice working |
| **12:00 PM** | [ ] Error handlers & status codes| [ ] Data tables & modal views | [ ] Transaction & integrity checks| [ ] Secondary workflow services| Midpoint merge |
| **1:00 PM** | [ ] Integration routes | [ ] Connected dynamic API state | [ ] DB constraints & indexes | [ ] Search / filter services | Full system working |
| **2:00 PM** | [ ] Coordinated merged main | [ ] Loading & empty UI states | [ ] Edge case handling in API | [ ] Differentiator feature | Solid stability |
| **3:00 PM** | [ ] Validated dynamic data flow| [ ] Polished responsive UI | [ ] Realistic DB seed datasets | [ ] Final feature polish | Feature complete |
| **4:00 PM** | [ ] Final bug sweep | [ ] UI styling & alignment | [ ] Verified API swagger docs | [ ] Verified test datasets | Code frozen |
| **4:50 PM** | [ ] Final commit & tag | [ ] Cleaned up dev logs | [ ] Verified repo readability | [ ] Updated README & screenshots | Final Main Ready |

---

## ?? 8:30 AM Official 18-Point Problem Statement Analysis Framework
*(Copy and complete this at 8:30 AM before writing any code)*

```markdown
### 1. Problem Understanding
- What exact real-world bottleneck or requirement is being addressed?

### 2. Target Users
- Primary Persona: [e.g. Inventory Manager, Accountant, Operator]
- Secondary Persona: [e.g. Auditor, End Customer, Executive]

### 3. Core Requirements
- Functional Requirements (Must do):
- Non-Functional Requirements (Performance, validation, accuracy):

### 4. User Workflow
- Step 1: User enters / imports data
- Step 2: System validates at boundary
- Step 3: Backend processes business logic and commits to Database
- Step 4: UI reflects real-time dynamic state

### 5. Must-Have MVP (Non-Negotiable by 1:00 PM)
1. ...
2. ...
3. ...

### 6. Optional / Differentiating Features (Only after 2:00 PM)
1. ...
2. ...

### 7. Database Entities (Relational Models)
- Entity 1: Table name, primary key, columns, data types, constraints
- Entity 2: Table name, primary key, columns, data types, constraints

### 8. Database Relationships & Constraints
- Foreign keys: [e.g., TableA.id -> TableB.table_a_id]
- Unique constraints & Indexes: [e.g., unique email, composite index on status + date]

### 9. API Endpoints Contract
- `GET /api/...` - List / Filter records
- `POST /api/...` - Create record with Pydantic validation
- `PUT /api/.../{id}` - Update record
- `DELETE /api/.../{id}` - Remove record

### 10. Backend Architecture & Service Separation
- Routes layer (`app/routes/`)
- Business service layer (`app/services/`)
- Data access layer (`app/models/`, `app/database.py`)

### 11. Frontend Screens & Components
- Screen 1: Dashboard / Overview
- Screen 2: Data Input & Form validation
- Screen 3: Details modal & status inspection

### 12. Input Validation Rules
- Field validations: Email format, numeric ranges, non-empty text, enum states
- Business validations: Date ranges, unique constraints, balance reconciliation

### 13. Error Handling & Edge Cases
- Missing payload fields $\rightarrow$ 422 with specific field error list
- Duplicate unique keys $\rightarrow$ 400 Bad Request with readable explanation
- Resource not found $\rightarrow$ 404 Not Found
- Unexpected failure $\rightarrow$ 500 without leaking stack traces or credentials

### 14. Security Considerations
- Zero hardcoded credentials; all secrets in `.env`
- SQL Injection protection via SQLAlchemy parameter binding
- Input sanitization via Pydantic v2

### 15. Team Allocation (4 Developers)
- Dev 1 (Lead): Architecture, API endpoints, integration
- Dev 2 (Frontend): UI views, form validations, responsive components
- Dev 3 (Backend): Database models, CRUD services, integrity constraints
- Dev 4 (Data/Feature): Business calculations, edge case handlers, seed data

### 16. Implementation Sequence (Hour-by-Hour)
- Hour 1 (9-10 AM): Database models & API skeleton
- Hour 2 (10-11 AM): Core CRUD & basic UI forms
- Hour 3 (11-12 PM): Input validation on both ends & first full flow
- Hour 4 (12-1 PM): Complete core workflows & dynamic tables
- Hour 5 (1-2 PM): End-to-end integration & test data population
- Hour 6 (2-3 PM): Edge cases & differentiator feature
- Hour 7 (3-4 PM): Testing, error states, and UI polish
- Hour 8 (4-5 PM): Code freeze, README documentation, demo rehearsal

### 17. Testing Strategy
- Automated backend route testing via TestClient
- Boundary validation tests (empty inputs, invalid characters, duplicates)
- UI state verification (loading spinner, empty state, success toast, error toast)

### 18. 5-Minute Demo Strategy
- 0:00-0:45: Problem & real-world pain point
- 0:45-3:15: End-to-end live flow with real dynamic database operations
- 3:15-4:15: Robust validation demo & differentiating feature
- 4:15-5:00: Impact, technical architecture summary, and wrap-up
```
