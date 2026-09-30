# 🏢 Hệ thống Quản trị Nhân sự Hiện đại (HRM Enterprise)

![HRM Enterprise Banner](https://img.shields.io/badge/Status-Completed-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Version](https://img.shields.io/badge/Version-1.0.0-orange)

HRM Enterprise là một giải pháp phần mềm Quản trị Nguồn nhân lực toàn diện, được thiết kế để số hóa 100% các nghiệp vụ nhân sự truyền thống. Hệ thống giúp doanh nghiệp tự động hóa từ khâu tuyển dụng ứng viên (ATS), quản lý hồ sơ, chấm công, tính lương tự động, cho đến đánh giá hiệu suất KPI.

Dự án này bao gồm 3 cổng kết nối (Portals) chính:
1. **Admin / HR Portal:** Dành cho Ban Giám đốc và Chuyên viên Nhân sự quản trị hệ thống.
2. **Employee Portal:** Dành cho nhân viên tự chấm công, xem phiếu lương, xin nghỉ phép.
3. **Candidate Portal:** Trang tuyển dụng công khai cho ứng viên nộp hồ sơ.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

Dự án được xây dựng trên kiến trúc Client-Server hiện đại:

**Frontend (Giao diện người dùng):**
- **Core:** React.js + Vite (Fast Bundler)
- **Styling:** Custom CSS (Giao diện chuẩn Sneat UI / Glassmorphism)
- **Routing:** React Router v6
- **Icons & UI Feedback:** Lucide-React, React-Hot-Toast
- **State Management & Fetching:** Axios + React Hooks

**Backend (Máy chủ & API):**
- **Core:** Node.js với Express.js framework (TypeScript)
- **Database ORM:** Prisma ORM
- **Database Engine:** PostgreSQL
- **Security:** JWT (JSON Web Tokens) cho Authentication, Bcryptjs mã hóa mật khẩu
- **CORS:** Cấu hình cho phép Frontend giao tiếp API an toàn.

---

## 🚀 Hướng dẫn Cài đặt & Chạy dự án (Local Development)

### Yêu cầu hệ thống:
- Node.js (Phiên bản v18 trở lên)
- PostgreSQL (Đã cài đặt và tạo sẵn một Database trống)

### Bước 1: Thiết lập Backend
1. Mở Terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường: Tạo file `.env` trong thư mục `backend` và thêm chuỗi kết nối Database của bạn:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<dbname>?schema=public"
   JWT_SECRET="your_super_secret_key"
   ```
4. Đồng bộ Cấu trúc Database và Nạp dữ liệu mẫu (Seed):
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts        # Tạo phòng ban, nhân viên mẫu
   npx tsx create_accounts.ts    # Tạo tài khoản admin và emp01
   ```
5. Khởi động server Backend (Chạy tại `http://localhost:5000`):
   ```bash
   npx tsx watch src/index.ts
   ```

### Bước 2: Thiết lập Frontend
1. Mở một Terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd hrm-frontend
   ```
2. Cài đặt các gói thư viện:
   ```bash
   npm install
   ```
3. Khởi động môi trường dev:
   ```bash
   npm run dev
   ```
4. Truy cập hệ thống trên trình duyệt tại: `http://localhost:5173`

---

## 🔑 Tài khoản Demo (Test Accounts)
Sau khi chạy các file seed thành công, bạn có thể sử dụng các tài khoản sau để trải nghiệm:

- **Quản trị viên (Admin):**
  - Username: `admin`
  - Password: `123456`
- **Nhân viên (Employee):**
  - Username: `emp01`
  - Password: `123456`

---

## 📚 Sổ tay Hướng dẫn Sử dụng (Documentation)
Để hiểu rõ cách thức vận hành và luồng công việc (Workflow) của hệ thống, vui lòng tham khảo các tài liệu cực kỳ chi tiết trong thư mục `Huong_Dan_Su_Dung/`:
- [`admin_portal_guide.md`](./Huong_Dan_Su_Dung/admin_portal_guide.md) - Dành cho Quản lý.
- [`employee_portal_guide.md`](./Huong_Dan_Su_Dung/employee_portal_guide.md) - Dành cho Nhân viên.
- [`candidate_portal_guide.md`](./Huong_Dan_Su_Dung/candidate_portal_guide.md) - Dành cho Ứng viên.

---
*Dự án Đồ án Tốt nghiệp - Cung cấp Giải pháp số hóa Nguồn Nhân lực hiện đại & tối ưu.*
