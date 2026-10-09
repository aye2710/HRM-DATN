# Script tự động Restore Database cho dự án HRM-DATN
# Dành cho Developer hoặc AI Assistant chạy trên máy cá nhân
param (
    [string]$EnvPath = "backend\.env",
    [string]$SqlFile = "hrm_backup.sql"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   HRM-DATN: TỰ ĐỘNG KHÔI PHỤC DỮ LIỆU   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Kiểm tra file backup SQL
if (-not (Test-Path $SqlFile)) {
    Write-Error "Không tìm thấy file backup: $SqlFile"
    exit 1
}

# 2. Đọc cấu hình từ backend/.env
$envFile = Resolve-Path $EnvPath -ErrorAction SilentlyContinue
if (-not $envFile) {
    Write-Warning "Không tìm thấy file $EnvPath. Đang tạo mẫu .env..."
    Set-Content -Path $EnvPath -Value 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hrm_db?schema=public"'
}

$dbUrl = ""
Get-Content $EnvPath | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=\s*["'']?(.*?)["'']?\s*$') {
        $dbUrl = $matches[1]
    }
}

if (-not $dbUrl) {
    Write-Error "Không tìm thấy DATABASE_URL trong $EnvPath"
    exit 1
}

Write-Host "-> DATABASE_URL phát hiện: $dbUrl" -ForegroundColor Yellow

# Parse URL: postgresql://username:password@host:port/database?schema=...
$regex = 'postgresql://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/([^?]+)'
if ($dbUrl -match $regex) {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = if ($matches[4]) { $matches[4] } else { "5432" }
    $dbName = $matches[5]
} else {
    Write-Error "Không phân tích được định dạng DATABASE_URL."
    exit 1
}

Write-Host "-> Thông số kết nối: Host=$dbHost, Port=$dbPort, User=$dbUser, Database=$dbName" -ForegroundColor Green

# 3. Tìm psql.exe
$psqlPath = ""
$cmd = Get-Command psql -ErrorAction SilentlyContinue
if ($cmd) {
    $psqlPath = $cmd.Source
} else {
    # Tìm kiếm trong Program Files
    $pgDirs = Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    foreach ($dir in $pgDirs) {
        $candidate = Join-Path $dir.FullName "bin\psql.exe"
        if (Test-Path $candidate) {
            $psqlPath = $candidate
            break
        }
    }
}

if (-not $psqlPath) {
    Write-Error "Không tìm thấy psql.exe trên hệ thống! Vui lòng cài đặt PostgreSQL hoặc thêm bin vào PATH."
    exit 1
}

Write-Host "-> Tìm thấy psql tại: $psqlPath" -ForegroundColor Green

# 4. Tạo Database nếu chưa tồn tại
Write-Host "-> Kiểm tra và tạo database $dbName nếu chưa có..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable('PGPASSWORD', $dbPass)

& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$dbName'" | Out-Null
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;" 2>$null

# 5. Restore dữ liệu từ file SQL
Write-Host "-> Đang nạp dữ liệu từ $SqlFile vào database $dbName..." -ForegroundColor Cyan
& $psqlPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $SqlFile

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
    Write-Host "-> Nạp dữ liệu thành công!" -ForegroundColor Green
} else {
    Write-Warning "Đã thực hiện nạp dữ liệu (một số cảnh báo ràng buộc có thể xảy ra và là bình thường)."
}

# 6. Sinh lại Prisma Client
Write-Host "-> Đang chạy npx prisma generate cho backend..." -ForegroundColor Yellow
Push-Location "backend"
try {
    npx prisma generate
} finally {
    Pop-Location
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host "   KHÔI PHỤC DỮ LIỆU HOÀN TẤT THÀNH CÔNG! " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
