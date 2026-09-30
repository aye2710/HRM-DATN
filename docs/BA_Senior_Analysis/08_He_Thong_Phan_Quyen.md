# PHÂN TÍCH NGHIỆP VỤ: MODULE HỆ THỐNG & PHÂN QUYỀN (SYSTEM & SECURITY)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Đảm bảo an toàn thông tin (Security) và Quản trị truy cập dựa trên Vai trò (RBAC - Role Based Access Control). Đảm bảo "Ai có quyền nào thì mới thấy chức năng đó".
- **Giá trị mang lại:** Ngăn chặn rò rỉ dữ liệu nhạy cảm (Đặc biệt là Tiền lương và Căn cước công dân). Hỗ trợ truy vết thủ phạm khi có dữ liệu bị xóa sai (Audit Log).
- **Phạm vi (In-scope):** Quản lý Tài khoản (Account), Phân quyền động (Roles & Permissions), Nhật ký hệ thống (Audit Logs).
- **Các bên liên quan:** System Admin (Người quản trị hệ thống - IT).

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| SYS-01 | Quản lý Tài khoản | Cấp phát, khóa tài khoản người dùng, đổi mật khẩu. | Admin | Must have |
| SYS-02 | RBAC (Role-Based Access Control) | Tạo vai trò mới (VD: HRBP), gán các quyền (Permission) chi tiết vào Vai trò. | Admin | Must have |
| SYS-03 | Audit Log (Nhật ký truy vết) | Ghi nhận mọi thao tác CREATE, UPDATE, DELETE kèm Timestamp và UserID. | Admin | Must have |

---

## 3. Quy trình nghiệp vụ
**Luồng Phân quyền động:**
1. Hệ thống có sẵn (Seed) các `Permission` vật lý (Ví dụ: `VIEW_PAYROLL`, `EDIT_EMPLOYEE`, `DELETE_JOB`).
2. Admin tạo một `Role` mới tên là "Chuyên viên Tuyển dụng".
3. Admin tick chọn các quyền liên quan đến Tuyển dụng (`CREATE_JOB`, `VIEW_CANDIDATE`...) gán vào Role này.
4. Admin gán Role "Chuyên viên Tuyển dụng" cho nhân viên Nguyễn Văn A.
5. Khi A login, Frontend tải danh sách Quyền của A và chỉ hiển thị các Menu/Button tương ứng.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-SYS-01 | Khóa Role SUPER_ADMIN | Không ai được phép XÓA hoặc SỬA quyền của nhóm ROLE `SUPER_ADMIN`. Đảm bảo hệ thống luôn có người cao nhất. | Ràng buộc HT | Anti-lockout |
| BR-SYS-02 | Khóa tài khoản Employee | Khi bảng Employee bị đổi status sang `RESIGNED` (Nghỉ việc), hệ thống phải ngầm UPDATE bảng Account `isActive = false` ngay lập tức. | Ràng buộc HT | Cắt quyền truy cập |
| BR-SYS-03 | Immutable Audit Log | Bảng `AuditLog` chỉ được phép INSERT (Ghi thêm). TUYỆT ĐỐI không có API DELETE hoặc UPDATE bảng này, kể cả là Admin. | Ràng buộc HT | Data Compliance |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: Account**
- `TRUE` (Active): Đăng nhập bình thường.
- `FALSE` (Locked): Tài khoản bị vô hiệu hóa, token login bị từ chối.

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Account** | id, username, password, employeeId, roleId, isActive | PK, String, String(Hash), FK, FK, Boolean | 1-1 Employee, n-1 Role | Password mã hóa bcrypt |
| **Role** | id, name, description | PK, String, String | 1-n Account, 1-n RolePermission | VD: HR_MANAGER |
| **Permission** | id, action, description | PK, String, String | 1-n RolePermission | VD: DELETE_DEPT |
| **RolePermission**| roleId, permissionId | FK, FK | Composite PK | Bảng nối n-n |
| **AuditLog** | id, action, tableName, recordId, accountId, details, createdAt | PK, String, String, String, String, Text, DateTime | | Lưu log truy vết |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **Hệ thống**, tôi muốn **kiểm tra Quyền của User mỗi khi gọi API**, để **chặn các Request độc hại từ Hacker/Nhân viên tò mò**.
- *AC1:* Nhân viên A (Không có quyền `VIEW_PAYROLL`) gọi postman chọc thẳng vào API `GET /api/payroll`. Hệ thống Middleware chặn lại và trả về HTTP 403 Forbidden.

**US-02:** Là **Giám đốc**, tôi muốn **biết ai đã xóa Yêu cầu tuyển dụng**, để **quy trách nhiệm**.
- *AC1:* Admin mở màn hình Nhật ký hệ thống (Audit Log). Tìm theo bảng `JobPosting`, hành động `DELETE`. Giao diện hiển thị rõ "Tài khoản B đã xóa record lúc 14:00 ngày X".

---

## 8. Phân quyền & bảo mật
- Chức năng này chỉ dành riêng cho tài khoản Root hoặc IT Admin. HR bình thường không được thấy Menu Hệ thống.

---

## 9. Tích hợp & phụ thuộc
- Là tầng bọc bên ngoài (Middleware Wrapper) bảo vệ toàn bộ API của 7 Module còn lại. Mọi request (trừ Login) đều phải mang chuỗi JWT (JSON Web Token) chứa RoleId để verify.

---

## 10. Yêu cầu phi chức năng
- Mật khẩu phải mã hóa một chiều (Bcrypt/Argon2). Cấm lưu Plaintext.
- Cần có cơ chế Rate Limiting (Giới hạn truy cập) để chống tấn công Brute-force mật khẩu.

---

## 11. Edge cases & rủi ro
1. *Admin tự khóa tài khoản của chính mình:* Hậu quả là không ai vào được hệ thống. **Xử lý:** Chặn việc tài khoản tự de-activate chính mình.
2. *Quên mật khẩu:* Cần luồng gửi link Reset Password qua Email thay vì Admin cấp lại mật khẩu bằng miệng (rủi ro bảo mật).

---

## 12. Câu hỏi cần làm rõ
- Hệ thống có cần tích hợp Đăng nhập bằng Google/Microsoft (OAuth2) hay chỉ dùng Local Username/Password? *(Đề xuất: Giai đoạn 1 dùng Local Login để tiết kiệm thời gian dev đồ án).*
