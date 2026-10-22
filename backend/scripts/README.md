# HƯỚNG DẪN CÁC SCRIPT TIỆN ÍCH BACKEND (BACKEND SCRIPTS DIRECTORY)

Thư mục này chứa các kịch bản (scripts) phục vụ khởi tạo dữ liệu mẫu (Seeding), di chuyển dữ liệu (Migration) và kiểm tra cơ sở dữ liệu.

---

## 1. Script Khởi Tạo Dữ Liệu Chuẩn (Official Seeding Script)

### `seed_lla.ts` (Khuyên dùng)
- **Mục đích**: Khởi tạo toàn bộ dữ liệu mẫu doanh nghiệp hoàn chỉnh cho Đồ án Tốt nghiệp (LLA Enterprise).
- **Phạm vi dữ liệu**:
  - Danh mục Phòng ban & Định biên (Department Hierarchy & Quotas).
  - Vị trí công tác & Dải lương trần/sàn (Positions & Salary Bands).
  - Nhân sự mẫu (Employees), Tài khoản đăng nhập (Users & Roles).
  - Ca làm việc chuẩn (Shifts) & Lịch ngày lễ BLLĐ (Holidays).
  - Hợp đồng lao động mẫu (Contracts: Thử việc, 1 năm, KXDTH).
  - Bảng chấm công mẫu (Attendance logs).
  - Dữ liệu phễu tuyển dụng ATS (Job Postings & Candidates).
- **Cách chạy**:
  ```bash
  npm run seed
  # hoặc: npx tsx scripts/seed_lla.ts
  ```

---

## 2. Scripts Khởi Tạo Bổ Sung & Quản Trị Tài Khoản

- **`create_accounts.ts`**: Tự động sinh tài khoản cho các nhân viên chưa có tài khoản hệ thống (mật khẩu mặc định: `123456`).
- **`add_depts.ts`**: Bổ sung nhanh các phòng ban mẫu vào CSDL.
- **`add_positions.ts`**: Bổ sung danh mục vị trí chức danh công tác.
- **`create-db.js`**: Tạo mới database PostgreSQL nếu chưa tồn tại.

---

## 3. Scripts Chẩn Đoán & Kiểm Tra (Diagnostic & Testing)

- **`check_db.ts`** / **`test_db.js`**: Kiểm tra kết nối nhanh tới cơ sở dữ liệu PostgreSQL.
- **`clear.js`**: Xóa sạch dữ liệu các bảng phục vụ reset môi trường.
