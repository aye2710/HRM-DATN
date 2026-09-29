# Bảng Quy Tắc Kinh Doanh (Business Rules) - Enterprise HRM

Tài liệu này định nghĩa chi tiết các quy tắc logic nghiệp vụ được áp dụng xuyên suốt 30+ màn hình của hệ thống HRM.

## 1. Quy tắc Quản lý Tổ chức (Organization)
- **BR-ORG-01 (Sơ đồ tổ chức - Org Chart):** Hệ thống cho phép hiển thị dạng phân cấp cây (Tree). Một nhân viên chỉ thuộc duy nhất một phòng ban tại một thời điểm, nhưng có thể có nhiều người quản lý trực tiếp (Matrix Reporting) hoặc 1 người duy nhất.
- **BR-ORG-02 (Chức danh - Positions):** Khi một chức danh bị đánh dấu "Ngừng hoạt động" (Inactive), không được phép bổ nhiệm chức danh đó cho nhân sự mới, nhưng các nhân sự cũ đang giữ chức danh đó không bị ảnh hưởng cho đến khi có luồng Điều chuyển (Transfer).

## 2. Quy tắc Tuyển dụng (Recruitment ATS)
- **BR-REC-01 (Duyệt định biên):** Yêu cầu tuyển dụng (Requisition) bắt buộc phải trải qua Trung tâm Phê duyệt (Approval Workflows). Chỉ khi trạng thái là `Approved` mới được phép đăng tuyển.
- **BR-REC-02 (Bảng Kanban Ứng viên):** Ứng viên (Candidate) tuân thủ luồng di chuyển trạng thái: `Sourced` ➜ `Screening` ➜ `Interview` ➜ `Offered` ➜ `Hired` ➜ `Rejected`. 
- **BR-REC-03 (Chuyển đổi Hired):** Khi Ứng viên chuyển sang trạng thái `Hired`, hệ thống tự động sinh ra một bản ghi trong module Hội nhập (Onboarding - Nhân viên mới).

## 3. Quy tắc Hội nhập (Onboarding)
- **BR-ONB-01 (Tiến độ Hội nhập - Progress):** Mức độ hoàn thành của nhân sự mới được tính bằng tỷ lệ phần trăm (0-100%) dựa trên số lượng Checklist bắt buộc (Mandatory = True) đã được hoàn tất.
- **BR-ONB-02 (Kênh Thông báo tự động):** Khi nhân sự đạt mốc 100% hội nhập, một kịch bản thông báo (Notification Trigger) sẽ tự động kích hoạt gửi Email chào mừng chính thức toàn công ty.

## 4. Quy tắc Quản lý Vòng đời Nhân sự (Employee Lifecycle)
- **BR-EMP-01 (Cảnh báo Hợp đồng):** Hệ thống tự động kích hoạt badge cảnh báo (Badge Warning) đối với các Hợp đồng lao động còn dưới **30 ngày** tính đến ngày hết hạn.
- **BR-EMP-02 (Điều chuyển - Transfers):** Khi thực hiện Điều chuyển, nếu Lý do điều chuyển (Reason) là "Thăng chức" (Promotion), hệ thống tự động cập nhật Lịch sử Việc làm (Employment History) và gắn badge Thăng chức màu xanh (Success).
- **BR-EMP-03 (Quy trình Nghỉ việc - Terminations):** Khi nhân sự có trạng thái "Đã nghỉ việc", quyền truy cập hệ thống của nhân sự đó lập tức bị thu hồi, và tài khoản nội bộ (System Accounts) chuyển sang trạng thái `Disabled`.

## 5. Quy tắc Chấm công (Time & Attendance)
- **BR-ATT-01 (Ca làm việc):** Tổng công tiêu chuẩn được tính bằng thời gian từ Giờ vào đến Giờ ra, trừ đi Giờ nghỉ trưa (Nếu có). Ca đêm phải được tính theo tỷ lệ công khác (Hệ số 1.3).
- **BR-ATT-02 (Điều chỉnh công - Adjustments):** Các yêu cầu quên chấm công phải được Quản lý trực tiếp duyệt. Trong giao diện hiển thị, Giờ cũ sẽ bị gạch ngang (line-through), Giờ mới in đậm.

## 6. Quy tắc Nghỉ phép (Leave Management)
- **BR-LEA-01 (Phép năm Tiêu chuẩn):** Nhân sự được cấp 12 ngày phép/năm (Cộng dồn 1 ngày mỗi tháng làm việc).
- **BR-LEA-02 (Phép Thâm niên):** Nếu thâm niên làm việc > 5 năm, hệ thống tự động cộng thêm số ngày nghỉ (Ví dụ: +1 ngày/năm).
- **BR-LEA-03 (Bảo lưu phép - Carry Forward):** Phép tồn đọng của năm cũ được bảo lưu sử dụng tối đa đến tháng 3 của năm tiếp theo, sau mốc này sẽ tự động hủy.

## 7. Quy tắc Tiền lương (Payroll)
- **BR-PAY-01 (Workflow Kỳ lương):** 
  - Trạng thái `Draft` (Nháp): Cho phép tính toán lại bảng lương nhiều lần.
  - Trạng thái `Processing` (Đang xử lý): Chốt dữ liệu công (Lock), không nhận thêm dữ liệu điều chỉnh công muộn.
  - Trạng thái `Completed` (Đã hoàn tất): Phát hành Payslip (Phiếu lương) điện tử tới Employee Portal.

## 8. Quy tắc Hệ thống (System & Audit)
- **BR-SYS-01 (Nhật ký Kiểm toán - Audit Logs):** Bắt buộc lưu vết địa chỉ IP, Thời gian, Người thực hiện và Dữ liệu thay đổi (Cũ ➜ Mới) cho các hành động: UPDATE_SALARY, DELETE_CONTRACT, LOGIN_FAILED, RBAC_CHANGED.
- **BR-SYS-02 (Chế độ Super Admin):** Quyền `ROLE_ADMIN` có đặc quyền All Permissions, không chịu bất cứ ràng buộc nào của Validation UI.
