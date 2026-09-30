# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE HỆ THỐNG & PHÂN QUYỀN

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Đảm bảo an toàn thông tin (Security) và Quản trị truy cập dựa trên Vai trò (RBAC - Role Based Access Control). Đảm bảo "Ai có quyền nào thì mới thấy chức năng đó".
- **Giá trị mang lại:** Ngăn chặn rò rỉ dữ liệu nhạy cảm. Hỗ trợ truy vết thủ phạm khi có dữ liệu bị xóa sai thông qua Nhật ký hệ thống (Audit Log).
- **Phạm vi (In-scope):** Quản lý Tài khoản (Account), Phân quyền động (Roles & Permissions), Nhật ký hệ thống (Audit Logs).
- **Các bên liên quan (Stakeholders):** System Admin (Người quản trị hệ thống / IT).

---

## 2. Cấu trúc dữ liệu chính
1. **Account (Tài khoản):** Liên kết 1-1 với Employee. Chứa Username, Password (Mã hóa).
2. **Role & Permission:** Vai trò (Ví dụ: Trưởng phòng) và Danh sách các quyền vật lý (Ví dụ: VIEW_SALARY).
3. **AuditLog:** Bảng lưu vết lịch sử mọi thao tác thay đổi dữ liệu của người dùng.

---

## 3. Danh sách Chức năng con
1. **Chức năng Phân quyền động RBAC (SYS-01, SYS-02)**
2. **Chức năng Truy vết hệ thống - Audit Log (SYS-03)**
