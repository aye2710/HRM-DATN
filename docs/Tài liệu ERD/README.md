# BỘ TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU ERD (DATABASE ERD SUITE)
## HỆ THỐNG QUẢN TRỊ NGUỒN NHÂN LỰC DOANH NGHIỆP (ENTERPRISE HRM)

---

### THÔNG TIN TỔNG QUAN
* **Tên hệ thống:** Enterprise Human Resource Management System (HRM)
* **Cơ sở dữ liệu:** PostgreSQL 15+ (Relational Database)
* **Công cụ ORM:** Prisma ORM 5+
* **Phiên bản tài liệu:** 1.0 (Chuẩn hóa Schema Cơ sở dữ liệu Thực tế)
* **Ngày cập nhật:** 27/10/2026
* **Quy mô mô hình:** 34 Thực thể (Models), 10 Kiểu liệt kê (Enums), 7 Phân cụm nghiệp vụ

---

### MỤC LỤC & ĐƯỜNG DẪN BỘ TÀI LIỆU ERD

Dưới đây là danh mục toàn bộ các tài liệu thiết kế cơ sở dữ liệu (ERD) được phân rã theo từng phân cụm chức năng của hệ thống HRM:

| STT | Mã Tài liệu | Tên Phân Cụm Dữ liệu | Bảng CSDL Trọng tâm | Đường dẫn Tài liệu |
| :---: | :--- | :--- | :--- | :---: |
| **00** | `ERD-HRM-SYS-00` | **Tổng quan Kiến trúc CSDL & Master ERD** | Toàn bộ 34 thực thể, sơ đồ quan hệ tổng thể, quy chuẩn đặt tên, indexing và tuân thủ Nghị định 13. | [Xem tài liệu](./00_ERD_Tong_Quan_Kien_Truc_CSDL.md) |
| **01** | `ERD-HRM-MOD-01` | **Cơ cấu Tổ chức & Hồ sơ Nhân sự 360°** | `Department`, `Position`, `Employee`, `ProfileChangeRequest`, `EmploymentHistory`. | [Xem tài liệu](./01_ERD_Co_Cau_To_Chuc_Va_Nhan_Su.md) |
| **02** | `ERD-HRM-MOD-02` | **Tuyển dụng Nhân tài & Phễu Ứng viên (ATS)** | `JobPosting`, `Candidate`, `CandidateUser`, `InterviewRound`, `CandidateFeedback`, `JobOffer`, `PreOnboardingProfile`. | [Xem tài liệu](./02_ERD_Tuyen_Dung_ATS.md) |
| **03** | `ERD-HRM-MOD-03` | **Hợp đồng Lao động, Quyết định & Thân nhân** | `Contract`, `ContractAppendix`, `Decision`, `Relative`, `Degree`, `Certificate`, `OnboardingTask`. | [Xem tài liệu](./03_ERD_Hop_Dong_Quyet_Dinh_Va_Ho_So.md) |
| **04** | `ERD-HRM-MOD-04` | **Quản lý Kho Tài sản & Bàn giao Thiết bị** | `Asset`, `AssetAssignment` (Biên bản bàn giao BBBG-LLA BM-01 & Thu hồi bồi thường BM-02). | [Xem tài liệu](./04_ERD_Quan_Ly_Tai_San_Thiet_Bi.md) |
| **05** | `ERD-HRM-MOD-05` | **Ca kíp, Chấm công, Nghỉ phép & OT** | `Shift`, `Holiday`, `Attendance`, `AttendanceAdjustment`, `LeaveBalance`, `LeaveRequest`, `LeaveTypeConfig`, `OTRequest`. | [Xem tài liệu](./05_ERD_Cham_Cong_Nghi_Phep_OT.md) |
| **06** | `ERD-HRM-MOD-06` | **Đánh giá KPI & Động cơ Tiền lương** | `ReviewCycle`, `KPI`, `PerformanceReview`, `KPITemplate`, `PayrollPeriod`, `Payslip`, `PayslipDetail`, `Allowance`, `TaxBracket`. | [Xem tài liệu](./06_ERD_KPI_Va_Tien_Luong.md) |
| **07** | `ERD-HRM-MOD-07` | **Phân quyền RBAC, Bảo mật & Tham số Hệ thống** | `Account`, `Role`, `Permission`, `RolePermission`, `AuditLog`, `SystemSetting`. | [Xem tài liệu](./07_ERD_Phan_Quyen_Va_He_Thong.md) |

---

### ĐẶC ĐIỂM KỸ THUẬT NỔI BẬT TRONG MÔ HÌNH CSDL
1. **Sơ đồ Mermaid Chuẩn hóa:** Mỗi tài liệu phân cụm đều đi kèm sơ đồ quan hệ thực thể `erDiagram` trực quan thể hiện rõ ràng thuộc tính, kiểu dữ liệu, khóa chính (`PK`), khóa ngoại (`FK`) và bản số quan hệ (1:1, 1:N, N:M).
2. **Từ điển Dữ liệu Toàn diện (Data Dictionary):** Mô tả chi tiết 100% các cột trong bảng: Kiểu dữ liệu trong PostgreSQL, Nullable, Giá trị mặc định, Khóa và Ý nghĩa nghiệp vụ thực tế.
3. **Chiến lược Ràng buộc Toàn vẹn (Referential Integrity):** Quy định rõ ràng hành vi `Cascade`, `Restrict` hoặc `SetNull` khi xóa/sửa dữ liệu nhằm bảo vệ tính toàn vẹn lịch sử công tác và kế toán.
4. **Bảo mật & Kiểm toán Tuân thủ:** Tích hợp kiểm toán bất biến `AuditLog` và bảo vệ dữ liệu nhận dạng cá nhân PII theo đúng quy định của Nghị định 13/2023/NĐ-CP.
