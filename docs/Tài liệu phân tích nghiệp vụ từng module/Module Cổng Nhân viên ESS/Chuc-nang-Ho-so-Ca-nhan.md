# Usecase: UC-ESS-02 - Tra cứu Hồ sơ Cá nhân & Hợp đồng Lao động (Employee Profile & Contract Self-Service)

## 1. Giới thiệu chức năng
- **Mục đích**: Cung cấp cho nhân viên quyền tự chủ tra cứu toàn bộ thông tin cá nhân được doanh nghiệp lưu trữ, bao gồm lý lịch nhân thân, vị trí công tác, hợp đồng lao động hiện tại, tài khoản ngân hàng chi trả lương và mã số bảo hiểm/thuế. Tính năng này nâng cao tính minh bạch dữ liệu nhân sự và tuân thủ quyền tiếp cận dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.
- **Actor (Tác nhân)**: Nhân viên (Employee) - Đã đăng nhập vào hệ thống với vai trò `EMPLOYEE`.
- **Điều kiện tiên quyết**: Nhân viên đã có bản ghi hồ sơ trong bảng `Employee` của hệ thống Core HR.

### Danh mục các chức năng con (Sub-features):
1. **UC-ESS-02-01: Tra cứu Lý lịch & Thông tin Liên lạc Cá nhân**: Xem họ tên, ngày sinh, giới tính, số CCCD, số điện thoại, email công vụ và địa chỉ thường trú.
2. **UC-ESS-02-02: Xem Vị trí Công tác & Cơ cấu Tổ chức**: Tra cứu phòng ban trực thuộc, chức danh chuyên môn, cấp bậc (level) và thông tin người quản lý trực tiếp.
3. **UC-ESS-02-03: Tra cứu Hợp đồng Lao động & Thông tin Tài chính**: Xem loại hợp đồng lao động hiện tại, ngày ký, ngày hết hạn (nếu có), số tài khoản ngân hàng thụ hưởng lương, mã số thuế cá nhân và mã sổ BHXH.

---

## 2. Dữ liệu nghiệp vụ (Data Structure & Parameters)

| Tên trường | Kiểu dữ liệu | Mô tả hiển thị |
|---|---|---|
| `fullName` | String | Họ và tên đầy đủ của nhân viên |
| `code` | String | Mã định danh nhân viên (VD: `NV001` hoặc `EMP-2026-001`) |
| `email` | String | Email công vụ do công ty cấp |
| `phone` | String | Số điện thoại liên hệ chính |
| `idCard` | String | Số CCCD 12 số |
| `department.name` | String | Tên phòng ban trực thuộc |
| `position.title` | String | Tên chức danh công việc chính thức |
| `manager.fullName` | String | Họ tên người quản lý trực tiếp |
| `contracts` | Array | Danh sách hợp đồng lao động (Loại HĐ, ngày bắt đầu, ngày kết thúc, trạng thái) |
| `bankName` / `bankAccount` | String | Tên ngân hàng và số tài khoản nhận lương |
| `taxCode` / `insuranceNumber` | String | Mã số thuế TNCN và mã sổ BHXH |

---

## 3. Quy tắc nghiệp vụ (Business Rules)

| Mã Quy tắc | Tình huống nghiệp vụ | Cách hệ thống xử lý | Thông báo hiển thị |
|---|---|---|---|
| **BR-PROF-01** | **Chế độ Chỉ Đọc (Read-only Policy)**: Nhân viên xem thông tin hồ sơ. | Nhân viên chỉ được xem, không được tự ý sửa đổi trực tiếp các thông tin pháp lý (CCCD, Họ tên, Phòng ban). | "Để cập nhật thông tin cá nhân, vui lòng liên hệ phòng Nhân sự." |
| **BR-PROF-02** | **Bảo mật Dữ liệu Riêng tư (Data Privacy)**: Truy vấn thông tin hồ sơ. | API backend kiểm tra `req.user.employeeId` từ JWT Token; nhân viên tuyệt đối không thể xem hồ sơ của nhân sự khác bằng cách truyền ID lạ. | (Trả về đúng hồ sơ của tài khoản đang đăng nhập) |

---

## 4. Bảng đặc tả chi tiết Use Case

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-ESS-02`<br/>- **UC Name**: Tra cứu Hồ sơ Cá nhân (My Profile)<br/>- **Actor**: Nhân viên (Employee)<br/>- **Priority**: High |
| **2** | **Trigger** | Nhân viên nhấp chuột vào mục **"Hồ sơ cá nhân"** trên thanh menu bên trái. |
| **3** | **Pre-condition** | Nhân viên đã đăng nhập thành công vào Cổng ESS (`/employee`). |
| **4** | **Post-condition** | Toàn bộ 4 nhóm thông tin cá nhân hiển thị trực quan qua giao diện Tabs. |
| **5** | **Main Flow** | 1. Hệ thống điều hướng đến `/employee/profile`.<br/>2. Gửi yêu cầu `GET /api/employees/:id` với `employeeId` từ phiên đăng nhập.<br/>3. Hiển thị Header Thẻ nhân viên gồm: Avatar viết tắt, Họ tên, Badge trạng thái "Chính thức", Mã nhân sự và Chức danh.<br/>4. Cung cấp 4 Tab điều hướng mượt mà: "Lý lịch & Liên hệ", "Công việc & Chức danh", "Hợp đồng lao động", "Tài khoản lương & Thuế".<br/>5. Cung cấp nút "Yêu cầu sửa đổi thông tin" để hướng dẫn nhân viên liên hệ bộ phận HR khi có biến động thông tin nhân thân. |
| **6** | **Exception Flow** | - Không tìm thấy `employeeId`: Hệ thống sử dụng cơ chế Fallback hiển thị dữ liệu phiên để đảm bảo không bị gãy giao diện, đồng thời ghi log kiểm toán. |
| **7** | **Acceptance Criteria** | - Nhân viên thấy chính xác chức danh, phòng ban và số tài khoản ngân hàng của mình.<br/>- Giao diện có độ tương phản cao, trình bày dạng thẻ card sang trọng. |
