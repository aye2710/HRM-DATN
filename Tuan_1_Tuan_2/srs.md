# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## Hệ thống quản trị nguồn nhân lực (HRM) chuyên sâu cho doanh nghiệp
### Enterprise HRM System

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Mô tả tổng quan hệ thống](#2-mô-tả-tổng-quan-hệ-thống)
3. [Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
4. [Yêu cầu phi chức năng](#4-yêu-cầu-phi-chức-năng)
5. [Yêu cầu giao diện](#5-yêu-cầu-giao-diện)
6. [Yêu cầu dữ liệu](#6-yêu-cầu-dữ-liệu)
7. [Yêu cầu phân quyền](#7-yêu-cầu-phân-quyền)
8. [Yêu cầu bảo mật](#8-yêu-cầu-bảo-mật)
9. [Ràng buộc thiết kế](#9-ràng-buộc-thiết-kế)

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này đặc tả toàn bộ yêu cầu phần mềm cho hệ thống quản trị nguồn nhân lực (HRM) chuyên sâu dành cho doanh nghiệp. Tài liệu hướng đến các bên liên quan bao gồm: nhóm phát triển, nhóm kiểm thử, quản lý dự án và khách hàng.

### 1.2. Phạm vi

Hệ thống HRM doanh nghiệp bao gồm các module chính:

| STT | Module | Mô tả |
|-----|--------|-------|
| 1 | Quản lý tổ chức | Phòng ban, chức vụ |
| 2 | Tuyển dụng | Yêu cầu tuyển, đăng tin, quản lý ứng viên, phỏng vấn, offer |
| 3 | Onboarding | Quy trình tiếp nhận nhân viên mới |
| 4 | Quản lý nhân sự | Hồ sơ, hợp đồng, thử việc, điều chuyển, nghỉ việc |
| 5 | Chấm công | Check-in/out, ca làm việc, tăng ca |
| 6 | Nghỉ phép | Đơn nghỉ, quỹ phép, phê duyệt |
| 7 | KPI | Mục tiêu, đánh giá, xếp loại |
| 8 | Lương | Bảng lương, phiếu lương, phụ cấp, khấu trừ |
| 9 | BHXH & Thuế | Bảo hiểm xã hội, thuế TNCN |
| 10 | Tài sản | Quản lý tài sản cấp phát |
| 11 | Văn bản & Quyết định | Giấy tờ nhân sự, quyết định bổ nhiệm |
| 12 | Báo cáo | Dashboard, thống kê nhân sự |

### 1.3. Định nghĩa, từ viết tắt

| Từ viết tắt | Giải thích |
|-------------|------------|
| HRM | Human Resource Management |
| RBAC | Role-Based Access Control |
| SRS | Software Requirements Specification |
| ERD | Entity Relationship Diagram |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| BHXH | Bảo hiểm xã hội |
| BHYT | Bảo hiểm y tế |
| BHTN | Bảo hiểm thất nghiệp |
| TNCN | Thu nhập cá nhân |

---

## 2. Mô tả tổng quan hệ thống

### 2.1. Kiến trúc hệ thống

Hệ thống sử dụng kiến trúc **3-Layer Architecture**:

```
┌──────────────────────────────────┐
│   PRESENTATION LAYER             │
│   Candidate / Employee / Internal│
│   Portal (Web, Mobile)           │
└──────────────┬───────────────────┘
               │ REST API / HTTPS
┌──────────────┴───────────────────┐
│   BUSINESS LOGIC LAYER           │
│   - Application Services         │
│   - Business Rules Engine        │
│   - Cross-Cutting: Logging,      │
│     Audit, Notification, RBAC    │
└──────────────┬───────────────────┘
               │
┌──────────────┴───────────────────┐
│   DATA ACCESS LAYER              │
│   - Repository Pattern           │
│   - ORM (EF / Hibernate)         │
└──────────────┬───────────────────┘
               │
┌──────────────┴───────────────────┐
│   DATABASE LAYER                 │
│   SQL Server / PostgreSQL        │
│   Thiết kế tập trung, UUID PK    │
└──────────────────────────────────┘
```

### 2.2. Cổng (Portal)

| Cổng | Đối tượng | Mô tả |
|------|-----------|-------|
| **Candidate Portal** | Ứng viên bên ngoài | Xem tin tuyển dụng, nộp hồ sơ, theo dõi trạng thái |
| **Employee Portal** | Nhân viên | Chấm công, nghỉ phép, xem lương, KPI, hồ sơ |
| **Internal Portal** | Manager, HR, Admin | Quản lý nhân sự, tuyển dụng, duyệt đơn, tính lương, báo cáo |

### 2.3. Actor (Tác nhân)

| Actor | Cổng | Vai trò |
|-------|------|---------|
| Admin | Internal | Quản trị hệ thống doanh nghiệp |
| HR | Internal | Nghiệp vụ nhân sự và tiền lương |
| Manager | Internal | Quản lý phòng ban/nhóm nhân viên |
| Employee | Employee | Nhân viên |
| Candidate | Candidate | Ứng viên (External) |
| System | Nội bộ | Hệ thống tự động xử lý (Job/Cron) |

### 2.4. Mô hình dữ liệu cốt lõi

```
[ EMPLOYEE ]
```
Toàn bộ nghiệp vụ (Chấm công, Nghỉ phép, Đánh giá, Tính lương) đều liên kết trực tiếp với thực thể `Employee`.

### 2.5. Nguyên tắc thiết kế cơ sở dữ liệu

- UUID làm Primary Key cho tất cả bảng
- Soft Delete: `Status = INACTIVE` hoặc `IsDeleted`, `DeletedAt`, `DeletedBy`
- Audit Fields: `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`

### 2.6. Cấu trúc tổ chức

```
Enterprise (Doanh nghiệp)
  └── Department (Phòng ban)
        └── Position (Chức vụ)
              └── Employee (Nhân viên)
```

### 2.7. Luồng khởi tạo hệ thống

```
Admin
  ├── Tạo tài khoản HR
  ├── Tạo phòng ban, chức vụ
  └── Tạo tài khoản Manager

HR
  └── Tạo hồ sơ nhân sự Employee (cấp tài khoản tự động)
```

---

## 3. Yêu cầu chức năng

### 3.1. Module Quản lý tổ chức

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-ORG-001 | Hệ thống cho phép Admin tạo, sửa, xóa phòng ban (Department) | Admin | Critical |
| FR-ORG-002 | Hệ thống cho phép Admin phân công Manager cho từng phòng ban | Admin | High |
| FR-ORG-003 | Hệ thống cho phép Admin tạo, sửa, xóa chức vụ (Position) | Admin | High |

### 3.2. Module Quản lý người dùng

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-USR-001 | Hệ thống cho phép Admin tạo/sửa/khóa tài khoản toàn hệ thống | Admin | Critical |
| FR-USR-002 | Hệ thống cho phép Admin phân quyền (gán Role) cho người dùng | Admin | High |
| FR-USR-003 | Hệ thống tự động cấp tài khoản khi HR tạo mới Employee | System | High |
| FR-USR-004 | Hệ thống cho phép người dùng đăng nhập bằng email và mật khẩu | Tất cả | Critical |
| FR-USR-005 | Hệ thống hỗ trợ tính năng Quên mật khẩu qua email | Tất cả | High |

### 3.3. Module Tuyển dụng

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-REC-001 | HR tạo yêu cầu tuyển dụng (Job Requisition) dựa trên Department/Position | HR | Critical |
| FR-REC-002 | Hệ thống tự động đăng tin tuyển dụng lên Candidate Portal khi có Job Req | System | High |
| FR-REC-003 | Ứng viên đăng ký tài khoản, nộp hồ sơ trên Candidate Portal | Candidate | Critical |
| FR-REC-004 | HR sàng lọc hồ sơ, thiết lập lịch phỏng vấn | HR | High |
| FR-REC-005 | Manager tham gia phỏng vấn, ghi nhận kết quả đánh giá | Manager | High |
| FR-REC-006 | HR tạo Offer Letter cho ứng viên trúng tuyển | HR | High |
| FR-REC-007 | Manager phê duyệt Offer | Manager | High |
| FR-REC-008 | Ứng viên xác nhận Offer (Chấp nhận / Từ chối) | Candidate | Critical |
| FR-REC-009 | Khi ứng viên chấp nhận, hệ thống hỗ trợ chuyển Candidate thành Employee | System | Critical |

### 3.4. Module Onboarding

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-ONB-001 | HR tạo các task Onboarding cho Employee mới | HR | High |
| FR-ONB-002 | Hệ thống nhắc nhở HR và Employee theo dõi tiến độ Onboarding | System | Medium |

### 3.5. Module Quản lý nhân sự

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-EMP-001 | HR tạo hồ sơ Employee (thông tin cá nhân, liên hệ, CCCD, MST) | HR | Critical |
| FR-EMP-002 | HR quản lý Hợp đồng lao động của Employee | HR | Critical |
| FR-EMP-003 | Thiết lập Probation (Thử việc) cho Employee mới | HR | High |
| FR-EMP-004 | Manager đánh giá kết quả Probation | Manager | High |
| FR-EMP-005 | HR thực hiện điều chuyển nội bộ (đổi Department, Position, Manager) | HR | High |
| FR-EMP-006 | Manager xác nhận tiếp nhận nhân sự điều chuyển | Manager | High |
| FR-EMP-007 | HR thực hiện quy trình nghỉ việc (Offboarding) | HR | Critical |
| FR-EMP-008 | Employee cập nhật thông tin cá nhân, người phụ thuộc (Dependent) | Employee | Medium |
| FR-EMP-009 | Ghi nhận các quyết định bổ nhiệm, khen thưởng, kỷ luật | HR | High |

### 3.6. Module Chấm công

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-ATT-001 | Employee check-in/check-out qua Portal hoặc nhận dữ liệu từ máy chấm công | Employee/System | Critical |
| FR-ATT-002 | Hệ thống tự động đối chiếu thời gian Check-in với Shift để phân loại: On Time, Late, Absent | System | High |
| FR-ATT-003 | Hệ thống tính toán tổng giờ làm việc thực tế và giờ OT | System | High |
| FR-ATT-004 | Admin hoặc HR định nghĩa các ca làm việc (Shift) | Admin/HR | High |
| FR-ATT-005 | Manager phân ca (Shift Assignment) cho Employee thuộc team mình | Manager | High |

### 3.7. Module Nghỉ phép

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-LVE-001 | Hệ thống tự động cấp quỹ phép năm (Leave Balance) cho Employee | System | Critical |
| FR-LVE-002 | Employee tạo Leave Request, hệ thống trừ tạm quỹ phép | Employee | Critical |
| FR-LVE-003 | Cho phép tạo đơn kết hợp Nghỉ có lương và Nghỉ không lương khi hết quỹ phép | Employee | High |
| FR-LVE-004 | Manager nhận thông báo và phê duyệt / từ chối đơn nghỉ phép | Manager | Critical |
| FR-LVE-005 | Hệ thống cập nhật chính thức quỹ phép khi đơn được duyệt | System | Critical |

### 3.8. Module KPI

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-KPI-001 | Manager thiết lập mục tiêu KPI cho Employee | Manager | High |
| FR-KPI-002 | Employee cập nhật tiến độ thực hiện KPI định kỳ | Employee | Medium |
| FR-KPI-003 | Manager đánh giá, cho điểm KPI cuối kỳ | Manager | High |
| FR-KPI-004 | Điểm KPI được sử dụng làm đầu vào tính thưởng (Bonus) trong Payroll | System | High |

### 3.9. Module Lương

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-PAY-001 | HR cấu hình mức lương cơ bản (Base Salary), phụ cấp (Allowance), khấu trừ (Deduction) cho Employee | HR | Critical |
| FR-PAY-002 | HR thực hiện thay đổi lương qua Salary Revision | HR | High |
| FR-PAY-003 | Tính tự động Gross Salary = Lương cơ bản (Pro-rata) + Phụ cấp + Tiền OT + KPI Bonus | System | Critical |
| FR-PAY-004 | Tính tự động Net Salary = Gross Salary - BHXH - Thuế TNCN - Khấu trừ - Phạt đi muộn/Nghỉ không lương | System | Critical |
| FR-PAY-005 | HR xem trước bảng lương tạm tính, kiểm tra đối soát | HR | High |
| FR-PAY-006 | HR chốt lương (Lock Payroll). Sau khi chốt không thể sửa chữa. | HR | Critical |
| FR-PAY-007 | Hệ thống tạo và phân phối Payslip điện tử (PDF) tới Employee | System | High |

### 3.10. Module BHXH & Thuế

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-INS-001 | Cấu hình tỷ lệ đóng BHXH, BHYT, BHTN theo luật (Ví dụ: 10.5% NLĐ, 21.5% DN) | HR | High |
| FR-INS-002 | Hệ thống tự động trích nộp bảo hiểm khi tính Payroll | System | Critical |
| FR-INS-003 | Hệ thống tính thuế TNCN theo biểu thuế lũy tiến từng phần, tự động áp dụng mức giảm trừ bản thân và giảm trừ người phụ thuộc | System | Critical |
| FR-INS-004 | HR xuất báo cáo BHXH và Thuế TNCN định kỳ | HR | High |

### 3.11. Module Tài sản

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-AST-001 | Quản lý danh mục tài sản của công ty | Admin | Medium |
| FR-AST-002 | Cấp phát tài sản cho Employee | HR/Admin | High |
| FR-AST-003 | Thu hồi tài sản khi nhân viên nghỉ việc hoặc thuyên chuyển | HR/Admin | High |

### 3.12. Module Báo cáo & Thông báo

| Mã | Yêu cầu | Actor | Ưu tiên |
|----|---------|-------|---------|
| FR-RPT-001 | Dashboard tổng quan nhân sự, biến động nhân sự, quỹ lương | Admin, Manager | High |
| FR-RPT-002 | Phân quyền truy cập Dashboard: Manager chỉ xem team mình, Admin xem toàn công ty | System | High |
| FR-RPT-003 | Xuất báo cáo danh sách nhân sự, báo cáo lương ra định dạng Excel/PDF | Admin, HR | Medium |
| FR-NOT-001 | Gửi thông báo hệ thống / email khi có đơn nghỉ phép mới, khi có phiếu lương mới | System | High |

---

## 4. Yêu cầu phi chức năng

### 4.1. Hiệu năng (Performance)
- NFR-PF-01: Thời gian phản hồi API < 500ms cho 95% request.
- NFR-PF-02: Thời gian chạy Batch tính lương cho 1000 Employee < 30 giây.
- NFR-PF-03: Dashboard hiển thị < 2 giây.

### 4.2. Bảo mật (Security)
- NFR-SC-01: Xác thực qua JWT (JSON Web Token).
- NFR-SC-02: Phân quyền RBAC áp dụng nghiêm ngặt ở lớp Backend (Middleware/Guard).
- NFR-SC-03: Mật khẩu mã hóa BCrypt.
- NFR-SC-04: Lưu Audit Log mọi thay đổi trên bảng nghiệp vụ (Ai, Làm gì, Dữ liệu cũ/mới, Thời gian).

### 4.3. Khả dụng (Availability) & Mở rộng
- NFR-AV-01: Uptime ≥ 99.5%.
- NFR-SC-05: Hệ thống hỗ trợ thiết kế theo domain module dễ mở rộng chức năng.

---

## 5. Yêu cầu giao diện

- **Responsive**: Hỗ trợ Desktop, Tablet. (Employee Portal hỗ trợ mạnh mẽ trên Mobile).
- **Trải nghiệm người dùng (UX)**: Thao tác đơn giản, hiển thị trạng thái trực quan (Duyệt, Chờ, Từ chối bằng mã màu).

---

## 6. Yêu cầu dữ liệu

Các nhóm bảng dữ liệu chính (ước tính 25-30 bảng):
- **Tổ chức**: `tbl_department`, `tbl_position`
- **Nhân sự**: `tbl_employee`, `tbl_dependent`, `tbl_contract`, `tbl_user_account`
- **Tuyển dụng**: `tbl_job_requisition`, `tbl_job_posting`, `tbl_candidate`, `tbl_interview`, `tbl_offer`
- **Hoạt động**: `tbl_attendance`, `tbl_shift`, `tbl_leave_request`, `tbl_leave_balance`, `tbl_kpi`
- **Tiền lương & BHXH**: `tbl_payroll`, `tbl_payslip`, `tbl_salary_revision`, cấu hình phụ cấp/khấu trừ/BHXH/Thuế.

---

## 7. Yêu cầu phân quyền

Cơ chế phân quyền 2 cấp: Quyền theo Role và Phạm vi dữ liệu (Data Scope).

| Role | Data Scope |
|------|------------|
| ADMIN | Toàn bộ dữ liệu doanh nghiệp |
| HR | Toàn bộ hồ sơ nhân sự, bảng lương |
| MANAGER | Chỉ dữ liệu của Employee thuộc quyền quản lý trực tiếp (đệ quy theo cây phòng ban) |
| EMPLOYEE | Dữ liệu cá nhân |
| CANDIDATE | Dữ liệu ứng tuyển cá nhân |

---

## 8. Yêu cầu bảo mật

- Tất cả kết nối qua HTTPS.
- Không phơi bày ID nội bộ (dùng UUID).
- Dữ liệu lương và CCCD là dữ liệu nhạy cảm, chỉ hiển thị với Role có thẩm quyền.

---

## 9. Ràng buộc thiết kế

- CON-01: Không dùng công nghệ lưu trữ phi cấu trúc (NoSQL) cho các core module giao dịch kế toán, tiền lương (sử dụng SQL Database).
- CON-02: Áp dụng chuẩn RESTful API.
- CON-03: Module Payroll phải xử lý được số thập phân chính xác tới 2 chữ số (DECIMAL/NUMERIC).
