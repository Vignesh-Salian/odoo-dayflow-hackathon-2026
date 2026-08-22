@echo off
echo ========================================================
echo  Odoo x NMIT Hackathon - Starting Full Stack Dev Server
echo ========================================================

:: Check if backend virtualenv exists or run directly
echo Starting Backend (FastAPI on http://localhost:8000)...
start "Backend - FastAPI" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo Starting Frontend (Vite on http://localhost:5173)...
start "Frontend - React Vite" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Frontend: http://localhost:5173
echo ========================================================
