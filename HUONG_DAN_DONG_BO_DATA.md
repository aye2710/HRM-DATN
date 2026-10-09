# 📖 HƯỚNG DẪN ĐỒNG BỘ DỮ LIỆU DATABASE (CHO MÁY Ở NHÀ / AI ASSISTANT)

> **Mục đích tài liệu:** Tài liệu này được tạo ra để khi bạn về nhà mở dự án trên máy cá nhân, bạn hoặc **Trợ lý AI (Antigravity/ChatGPT/Claude/Copilot)** có thể đọc và tự động khôi phục toàn bộ dữ liệu PostgreSQL giống 100% máy làm việc hiện tại.

---

## 🤖 DÀNH CHO TRỢ LÝ AI Ở NHÀ (INSTRUCTIONS FOR AI ASSISTANT)

> **Gửi AI Assistant tại máy ở nhà:** 
> Khi người dùng yêu cầu: *"seed data", "đồng bộ dữ liệu", "chạy database giống máy công ty"*, bạn hãy làm theo các bước tự động sau:

### Cách 1: Chạy script tự động 1-chạm (Khuyên dùng)
Mở PowerShell tại thư mục gốc của dự án (`HRM-ĐATN`) và thực thi:
```powershell
powershell -ExecutionPolicy Bypass -File .\restore_database.ps1
```
*Script này sẽ tự động:*
1. Đọc chuỗi kết nối `DATABASE_URL` trong file `backend/.env` (tự động nhận diện host, port, user, password, db name của máy hiện tại).
2. Tìm kiếm `psql.exe` trong PATH hoặc trong thư mục `C:\Program Files\PostgreSQL\*\bin`.
3. Tự động tạo cơ sở dữ liệu (Database) nếu chưa tồn tại.
4. Đọc file `hrm_backup.sql` và nạp toàn bộ cấu trúc bảng, khóa ngoại, chuỗi tuần tự và dữ liệu đầy đủ.
5. Tự động chạy `npx prisma generate` trong thư mục `backend` để cập nhật Prisma Client.

---

### Cách 2: Chạy lệnh thủ công từng bước (Nếu không dùng script)

#### 1. Kiểm tra cấu hình `backend/.env` máy ở nhà:
Mở file `backend/.env`, chỉnh sửa cổng (Port) và Mật khẩu PostgreSQL cho khớp với cấu hình máy ở nhà (PostgreSQL mặc định thường là port `5432`):
```env
DATABASE_URL="postgresql://postgres:MAT_KHAU_CUA_BAN@localhost:5432/hrm_db?schema=public"
```

#### 2. Nạp dữ liệu bằng dòng lệnh PostgreSQL:
```powershell
# Bước 2.1: Đặt biến môi trường mật khẩu (thay '123456' bằng mật khẩu postgres máy bạn)
$env:PGPASSWORD = "MAT_KHAU_CUA_BAN"

# Bước 2.2: Tạo database hrm_db (nếu chưa có)
psql -U postgres -p 5432 -c "CREATE DATABASE hrm_db;"

# Bước 2.3: Nạp toàn bộ dữ liệu từ file hrm_backup.sql
psql -U postgres -p 5432 -d hrm_db -f hrm_backup.sql
```
*(Nếu Windows báo không tìm thấy lệnh `psql`, thay `psql` bằng đường dẫn đầy đủ, ví dụ: `& 'C:\Program Files\PostgreSQL\17\bin\psql.exe'` hoặc phiên bản tương ứng đã cài).*

#### 3. Sinh lại Prisma Client:
```powershell
cd backend
npx prisma generate
```

#### 4. Khởi động 2 ứng dụng:
* **Backend:** `cd backend` -> `npm run dev` (hoặc `npx tsx watch src/index.ts`) (Chạy trên cổng `5000`)
* **Frontend:** `cd hrm-frontend` -> `npm run dev` (Chạy trên cổng `5173`)

---

## 🗂 THÔNG TIN DỮ LIỆU ĐÃ BACKUP TRONG `hrm_backup.sql`

File [hrm_backup.sql](file:///c:/Users/truclh/Desktop/HRM-ĐATN/hrm_backup.sql) chứa dữ liệu hoàn chỉnh của toàn bộ hệ thống HRM:
* **Cơ cấu tổ chức:** Toàn bộ Phòng ban (Department), Chức vụ/Vị trí (Position).
* **Quản trị nhân sự:** Hơn 130+ Nhân viên (Employee), Hợp đồng lao động (Contract), Lịch sử công tác (EmploymentHistory), Quan hệ nhân thân, Bằng cấp.
* **Quy trình Tuyển dụng & Onboarding:**
  * Tin tuyển dụng (JobPosting)
  * Hồ sơ ứng viên (Candidate) và tài khoản ứng viên (CandidateUser)
  * Lịch và kết quả phỏng vấn các vòng (InterviewRound, CandidateFeedback)
  * Thư mời nhận việc (JobOffer) có hạn chót 24h và trạng thái
  * Hồ sơ ứng viên tự khai nhận việc (PreOnboardingProfile)
  * Nhiệm vụ hội nhập (OnboardingTask)
* **Chấm công & Tiền lương:** Ca làm việc (Shift), Ngày nghỉ lễ (Holiday), Bảng chấm công (Attendance), Nghỉ phép (LeaveRequest), Bảng lương & Phụ cấp.
* **Đánh giá hiệu suất & Tài sản:** Chu kỳ KPI (ReviewCycle, PerformanceReview), Danh mục tài sản & biên bản bàn giao (AssetAssignment).

---

## 🔑 TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH SAU KHI RESTORE
* **Cổng Quản trị Nội bộ (Internal Portal):**
  * Email: `admin@hrm.com` (hoặc tài khoản HR hiện có trong hệ thống)
  * Mật khẩu: `123456`
* **Cổng Tuyển dụng Ứng viên (Candidate Portal):**
  * Sử dụng Email ứng viên đã nộp đơn để nhận mã OTP hoặc đăng nhập bằng tài khoản ứng viên.
