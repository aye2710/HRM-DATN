# Script khởi động đồng thời Backend và Frontend cho HRM Enterprise
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    KHOI DONG HE THONG HRM ENTERPRISE (SaaS)       " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Dang khoi dong Backend API Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[2/2] Dang khoi dong Frontend Web App (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\hrm-frontend'; npm run dev"

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host " HE THONG DA KHOI DONG THANH CONG!                " -ForegroundColor Green
Write-Host " - Backend API:  http://localhost:5000            " -ForegroundColor White
Write-Host " - Frontend Web: http://localhost:5173            " -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Green
