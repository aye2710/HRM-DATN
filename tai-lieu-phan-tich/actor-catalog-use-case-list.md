# Danh mục Actor & Hệ thống Use Case Toàn diện

Dựa trên cấu trúc 11 module và 30+ màn hình giao diện thực tế của hệ thống Enterprise HRM Portal.

## 1. Actor Catalog (Danh sách Tác nhân)

1. **System Admin (Quản trị viên):** Người thiết lập phân quyền (RBAC), theo dõi System Audit Logs.
2. **HR Manager (Quản lý Nhân sự):** Điều phối tổng thể các hoạt động tuyển dụng, hội nhập, và vòng đời nhân viên.
3. **C&B Specialist (Chuyên viên Lương thưởng):** Xử lý chấm công, tính phép và phát hành phiếu lương (Payslip).
4. **Line Manager (Quản lý trực tiếp):** Trưởng phòng/Giám đốc - Người chịu trách nhiệm phê duyệt (Workflows) các yêu cầu từ nhân viên và chấm điểm KPI.
5. **Employee (Nhân viên):** Sử dụng nền tảng Employee Portal để thực hiện các thao tác tự phục vụ (Self-service).
6. **Candidate (Ứng viên):** Tương tác với cổng thông tin tuyển dụng (Candidate Landing Page).
7. **System (Hệ thống tự động):** Cron job chạy tự động (Tính lương tự động, bắn thông báo cảnh báo hợp đồng, tổng hợp báo cáo...).

## 2. Danh sách Use Case cốt lõi (Theo Module UI)

### 2.1 Quản trị Hệ thống (System)
- UC-SYS-01: Quản lý Phân quyền (Thêm Role, Ánh xạ quyền)
- UC-SYS-02: Tra cứu Nhật ký Kiểm toán (Audit Logs)
- UC-SYS-03: Cấu hình Kịch bản Thông báo Tự động (Notifications)
- UC-SYS-04: Thao tác Trung tâm Phê duyệt (Duyệt/Từ chối hàng loạt)

### 2.2 Tổ chức (Organization)
- UC-ORG-01: Thêm/Sửa/Xóa cấu trúc Phòng ban
- UC-ORG-02: Quản lý Danh mục Chức danh (Positions)
- UC-ORG-03: Khai phá Sơ đồ Tổ chức dạng cây (Org Chart)

### 2.3 Tuyển dụng (Recruitment)
- UC-REC-01: Tạo và trình duyệt Yêu cầu Tuyển dụng (Requisitions)
- UC-REC-02: Kéo thả ứng viên qua các vòng phỏng vấn (ATS Kanban)
- UC-REC-03: Xếp lịch và đánh giá Phỏng vấn (Interviews)
- UC-REC-04: Tạo Thư mời nhận việc (Offer Letters)

### 2.4 Hội nhập (Onboarding)
- UC-ONB-01: Định nghĩa bộ Checklist Công việc Hội nhập
- UC-ONB-02: Tạo yêu cầu Cấp phát Thiết bị / Tài sản (Laptop, thẻ xe...)
- UC-ONB-03: Yêu cầu mở Tài khoản phần mềm nội bộ (Email, Slack, Jira)
- UC-ONB-04: Theo dõi Tiến độ Hội nhập (Thanh Progress Bar %)

### 2.5 Vòng đời Nhân sự (Employee Lifecycle)
- UC-EMP-01: Quản lý Hồ sơ Nhân sự (Thêm mới, Cập nhật Avatar, Thông tin cá nhân)
- UC-EMP-02: Tra cứu Lịch sử Việc làm & Thăng tiến (Jobs History)
- UC-EMP-03: Quản lý Hợp đồng (Theo dõi hợp đồng sắp hết hạn trong 30 ngày)
- UC-EMP-04: Lập quyết định Điều chuyển công tác (Transfers)
- UC-EMP-05: Thực hiện quy trình Nghỉ việc (Terminations)

### 2.6 Chấm công & Nghỉ phép (Time & Leave)
- UC-ATT-01: Thiết lập Ca làm việc chuẩn (Hành chính, Part-time, Ca đêm)
- UC-ATT-02: Nhập và phê duyệt Yêu cầu Điều chỉnh công (Quên vân tay)
- UC-LEA-01: Cấu hình Loại nghỉ phép và Chính sách cộng phép theo Thâm niên
- UC-LEA-02: Quản lý Lịch nghỉ Lễ quốc gia / Công ty

### 2.7 Tiền lương & Hiệu suất (Payroll & KPI)
- UC-PAY-01: Khởi tạo Kỳ tính lương (Draft ➜ Processing ➜ Completed)
- UC-PAY-02: Phát hành Phiếu lương (Payslip) tới Employee Portal
- UC-KPI-01: Quản lý Mẫu tiêu chí đánh giá (KPI Templates)
- UC-KPI-02: Chấm điểm và Giao chỉ tiêu hiệu suất

### 2.8 Báo cáo & Dashboard (Reports)
- UC-REP-01: Xem biểu đồ tổng quan Nhân sự
- UC-REP-02: Phân tích Tỷ lệ nghỉ việc (Turn-over Rate) và Quỹ Lương

*(Tài liệu này đóng vai trò Xương sống cho quá trình viết Test Case nghiệm thu phần mềm của Hội đồng).*
