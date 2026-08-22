#!/bin/bash
echo "========================================================"
echo " Odoo x NMIT Hackathon - Starting Full Stack Dev Server"
echo "========================================================"

# Run backend in background
cd backend && python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Run frontend
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo "Frontend running on http://localhost:5173 (PID: $FRONTEND_PID)"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
