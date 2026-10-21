@echo off
echo =========================================================
echo               Starting TruSight System
echo =========================================================
echo.
echo [1/2] Launching Backend API (FastAPI) on http://127.0.0.1:8000 ...
start "TruSight Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && set PYTHONPATH=%~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Frontend Dashboard (Vite) on http://localhost:5173 ...
start "TruSight Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =========================================================
echo Both services have been launched in separate windows!
echo - Frontend UI:  http://localhost:5173
echo - Backend Docs: http://127.0.0.1:8000/docs
echo =========================================================
pause
