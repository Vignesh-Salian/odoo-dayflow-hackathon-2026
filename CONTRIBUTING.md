# Hackathon Team Contribution & Git Workflow Guide

## Odoo x NMIT Hackathon Rules Compliance
1. **Hourly Commit Requirement**: Every team member must commit and push at least once every hour.
2. **Individual Accountability**: Each team member must make their own commits from their own Git credentials.
3. **Main Branch Stability**: `main` must always contain working, tested code.
4. **Secret Protection**: Never push `.env`, API keys, or credentials.

---

## Team Role Distribution (4 Developers)

| Role | Member Focus | Primary Working Directory | Default Branch |
| :--- | :--- | :--- | :--- |
| **Dev 1 (Team Lead)** | Architecture, Integration, Core API Routes, Deployment | `backend/app/routes/`, Root config | `feat/core-api` |
| **Dev 2 (Frontend Lead)** | UI Views, Forms, Dashboard, User Journey | `frontend/src/pages/`, `layouts/` | `feat/frontend-ui` |
| **Dev 3 (Backend & Data)** | Business Logic, Database Models, CRUD Services | `backend/app/services/`, `models/` | `feat/data-services` |
| **Dev 4 (AI / Feature Lead)** | External APIs, AI Integration, UI Components, Polish | `backend/app/services/ai_service.py`, `frontend/src/components/` | `feat/ai-features` |

---

## Step-by-Step Git Commands

### 1. Initial Setup
```bash
# Clone the repository
git clone <repo-url>
cd <repo-name>

# Create and switch to your feature branch
git checkout -b feat/your-feature-name
```

### 2. Hourly Development Cycle
```bash
# Check modified files
git status

# Stage your specific working files
git add <files>

# Commit with a clear conventional message
git commit -m "feat(module): add user input validation and error states"

# Push to your feature branch
git push origin feat/your-feature-name
```

### 3. Merging to Main (Every 1-2 Hours)
```bash
# 1. Update local main
git checkout main
git pull origin main

# 2. Merge your feature branch
git merge feat/your-feature-name

# 3. Test locally that everything runs!
# (Run start-dev.bat or verify frontend & backend)

# 4. Push working main
git push origin main
```

---

## Commit Message Convention
* `feat(area)`: New feature or screen (e.g., `feat(ui): add analytics stat cards`)
* `fix(area)`: Bug fix (e.g., `fix(api): handle missing payload fields in response`)
* `refactor(area)`: Code clean up without changing functionality
* `docs(area)`: Documentation, README, or schema docs update
