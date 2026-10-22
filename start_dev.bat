@echo off
title HRM Enterprise - System Launcher
echo ===================================================
echo     KHOI DONG HE THONG HRM ENTERPRISE (SaaS)
echo ===================================================
echo.
echo [1/2] Dang khoi dong Backend API Server (Port 5000)...
start "HRM Backend (:5000)" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Dang khoi dong Frontend Web App (Port 5173)...
start "HRM Frontend (:5173)" cmd /k "cd /d %~dp0hrm-frontend && npm run dev"

echo.
echo ===================================================
echo  HE THONG DA KHOI DONG THANH CONG!
echo  - Backend API:  http://localhost:5000
echo  - Frontend Web: http://localhost:5173
echo ===================================================
echo.
