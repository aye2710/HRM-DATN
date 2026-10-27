# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (ERD)
## PHÂN CỤM: PHÂN QUYỀN, BẢO MẬT & QUẢN TRỊ HỆ THỐNG (RBAC & SYSTEM)

---

### THÔNG TIN TÀI LIỆU
* **Tên tài liệu:** Entity Relationship Diagram (ERD) – Phân cụm Tài khoản, Phân quyền RBAC, Nhật ký Kiểm toán & Tham số Động
* **Mã tài liệu:** `ERD-HRM-MOD-07`
* **Phiên bản:** 1.0 (Chuẩn hóa Schema PostgreSQL & Prisma ORM)
* **Ngày cập nhật:** 27/10/2026
* **Các thực thể chính:** `Account`, `Role`, `Permission`, `RolePermission`, `AuditLog`, `SystemSetting`
* **Tình trạng:** Bản hoàn thiện chính thức

---

### MỤC LỤC
1. [Sơ đồ Quan hệ Thực thể Phân cụm (Domain Mermaid ERD)](#1-sơ-đồ-quan-hệ-thực-thể-phân-cụm-domain-mermaid-erd)
2. [Từ điển Dữ liệu Chi tiết (Data Dictionary)](#2-từ-điển-dữ-liệu-chi-tiết-data-dictionary)
3. [Ràng buộc Khóa ngoại & Bảng Nối (Junction Table)](#3-ràng-buộc-khóa-ngoại--bảng-nối-junction-table)
4. [Cơ chế Nhật ký Kiểm toán Bất biến (Immutable Audit Trail)](#4-cơ-chế-nhật-ký-kiểm-toán-bất-biến-immutable-audit-trail)
5. [Cấu hình Tham số Nghiệp vụ Động (Dynamic System Settings)](#5-cấu-hình-tham-số-nghiệp-vụ-động-dynamic-system-settings)

---

### 1. SƠ ĐỒ QUAN HỆ THỰC THỂ PHÂN CỤM (DOMAIN MERMAID ERD)

```mermaid
erDiagram
    Employee ||--o| Account : "authenticated via (1-1)"
    Role ||--o{ Account : "roleId (1-N)"
    Role ||--o{ RolePermission : "roleId"
    Permission ||--o{ RolePermission : "permissionId"

    Account {
        string id PK "UUID"
        string username UK "Tên đăng nhập hệ thống"
        string password "Mật khẩu mã hóa Bcrypt"
        string employeeId FK/UK "Liên kết hồ sơ nhân sự"
        string roleId FK "Vai trò phân quyền"
        boolean isActive "Trạng thái kích hoạt (Khóa an ninh)"
    }

    Role {
        string id PK "UUID"
        string name UK "Tên vai trò (SUPER_ADMIN, HR_MANAGER...)"
        string description "Mô tả phạm vi quyền hạn"
    }

    Permission {
        string id PK "UUID"
        string action UK "Mã hành động (VIEW_PAYROLL, EDIT_EMP...)"
        string description "Mô tả chi tiết quyền hạn"
    }

    RolePermission {
        string roleId PK,FK "Vai trò"
        string permissionId PK,FK "Quyền hạn được cấp"
    }

    AuditLog {
        string id PK "UUID"
        string action "Hành động (CREATE, UPDATE, FINALIZE...)"
        string tableName "Bảng CSDL bị tác động"
        string recordId "ID bản ghi bị tác động"
        string accountId "ID tài khoản thực hiện"
        string details "Chi tiết thay đổi dữ liệu JSON"
        datetime createdAt "Thời điểm phát sinh thao tác"
    }

    SystemSetting {
        string id PK "UUID"
        string category "Phân loại (PAYROLL, ATTENDANCE...)"
        string key UK "Mã tham số duy nhất"
        string name "Tên tham số dễ hiểu"
        string value "Giá trị tham số đang áp dụng"
        string dataType "NUMBER / STRING / BOOLEAN / PERCENT"
        string unit "Đơn vị tính (%, VNĐ, Ngày)"
        string description "Căn cứ pháp lý & Ý nghĩa"
        datetime updatedAt "Thời điểm cập nhật gần nhất"
    }
```

---

### 2. TỪ ĐIỂN DỮ LIỆU CHI TIẾT (DATA DICTIONARY)

#### 2.1 Bảng `Account` (Tài khoản Người dùng Hệ thống)
| Tên Cột | Kiểu Dữ liệu | Nullable | Mặc định | Khóa | Ý nghĩa Nghiệp vụ & Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `String` (UUID) | Không | `uuid()` | PK | Định danh duy nhất toàn cầu của tài khoản. |
| `username` | `String` | Không | - | UK | Tên đăng nhập hệ thống duy nhất (thường là Email công vụ). |
| `password` | `String` | Không | - | - | Mật khẩu tài khoản đã được băm an toàn bằng thuật toán Bcrypt. |
| `employeeId` | `String` | Có | `null` | FK/UK| Khóa ngoại 1-1 trỏ tới hồ sơ nhân sự `Employee.id`. |
| `roleId` | `String` | Không | - | FK | Khóa ngoại vai trò phân quyền `Role.id`. |
| `isActive` | `Boolean` | Không | `true` | - | Trạng thái: `false` khi tài khoản bị vô hiệu hóa hoặc nhân viên thôi việc. |

#### 2.2 Bảng `Role` (Danh mục Vai trò Người dùng)
| Tên Cột | Kiểu Dữ liệu | Nullable | Mặc định | Khóa | Ý nghĩa Nghiệp vụ & Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `String` (UUID) | Không | `uuid()` | PK | Định danh duy nhất của vai trò. |
| `name` | `String` | Không | - | UK | Tên vai trò chuẩn hóa (VD: `SUPER_ADMIN`, `HR_MANAGER`, `EMPLOYEE`). |
| `description` | `String` | Có | `null` | - | Diễn giải phạm vi chức năng và trách nhiệm của vai trò. |

#### 2.3 Bảng `Permission` (Danh mục Quyền hạn Thao tác)
| Tên Cột | Kiểu Dữ liệu | Nullable | Mặc định | Khóa | Ý nghĩa Nghiệp vụ & Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `String` (UUID) | Không | `uuid()` | PK | Định danh duy nhất của quyền hạn. |
| `action` | `String` | Không | - | UK | Mã định danh quyền (VD: `VIEW_PAYROLL`, `APPROVE_LEAVE`, `MANAGE_ASSET`). |
| `description` | `String` | Có | `null` | - | Diễn giải quyền được phép thực hiện trên giao diện và API. |

#### 2.4 Bảng `RolePermission` (Bảng Nối Phân quyền N-N)
| Tên Cột | Kiểu Dữ liệu | Nullable | Mặc định | Khóa | Ý nghĩa Nghiệp vụ & Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `roleId` | `String` | Không | - | PK, FK | Khóa ngoại liên kết `Role.id`. |
| `permissionId` | `String` | Không | - | PK, FK | Khóa ngoại liên kết `Permission.id`. |

*Khóa chính phức hợp:* `@@id([roleId, permissionId])`.

#### 2.5 Bảng `AuditLog` (Nhật ký Kiểm toán Hệ thống Bất biến)
| Tên Cột | Kiểu Dữ liệu | Nullable | Mặc định | Khóa | Ý nghĩa Nghiệp vụ & Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `String` (UUID) | Không | `uuid()` | PK | Định danh duy nhất của bản ghi nhật ký. |
| `action` | `String` | Không | - | - | Hành động thực hiện (VD: `INITIATE_OFFBOARDING`, `OFFBOARDING_FINALIZE`, `LOCK_PAYROLL`). |
| `tableName` | `String` | Không | - | - | Tên bảng cơ sở dữ liệu bị thay đổi (`Employee`, `Payslip`, `Asset`). |
| `recordId` | `String` | Không | - | - | Khóa chính của bản ghi bị tác động. |
| `accountId` | `String` | Không | - | - | Mã tài khoản của người thực hiện hành động. |
| `details` | `String` (Text) | Có | `null` | - | Chi tiết nội dung thay đổi dạng văn bản hoặc chuỗi JSON. |
| `createdAt` | `DateTime` | Không | `now()` | - | Mốc thời gian chính xác ghi nhận thao tác (Audit Timestamp). |

#### 2.6 Bảng `SystemSetting` (Bảng Tham số Nghiệp vụ Động)
| Tên Cột | Kiểu Dữ liệu | Nullable | Mặc định | Khóa | Ý nghĩa Nghiệp vụ & Ràng buộc |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `id` | `String` (UUID) | Không | `uuid()` | PK | Định danh duy nhất của tham số. |
| `category` | `String` | Không | - | - | Phân loại tham số: `PAYROLL`, `ATTENDANCE`, `HR`, `GENERAL`. |
| `key` | `String` | Không | - | UK | Khóa duy nhất dùng để truy vấn trong code (VD: `INSURANCE_RATE`). |
| `name` | `String` | Không | - | - | Tên tham số dễ hiểu hiển thị cho người dùng quản trị. |
| `value` | `String` | Không | - | - | Giá trị hiện hành của tham số (VD: "10.5", "11000000"). |
| `dataType` | `String` | Không | `"NUMBER"` | - | Kiểu dữ liệu để ép kiểu: `NUMBER`, `STRING`, `BOOLEAN`, `PERCENT`. |
| `unit` | `String` | Có | `null` | - | Đơn vị tính: `%`, `VNĐ / tháng`, `Ngày`. |
| `description` | `String` (Text) | Có | `null` | - | Căn cứ luật pháp và hướng dẫn áp dụng. |
| `updatedAt` | `DateTime` | Không | - | - | Thời điểm cập nhật giá trị mới gần nhất. |

---

### 3. RÀNG BUỘC KHÓA NGOẠI & BẢNG NỐI (JUNCTION TABLE)

* **Quan hệ 1-1 giữa Account và Employee:**
  Mỗi tài khoản hệ thống chỉ được gắn duy nhất với một hồ sơ nhân sự: `Account(employeeId) UNIQUE REFERENCES Employee(id)`. Khi nhân viên bị xóa hoặc thôi việc, tài khoản bị thu hồi tương ứng.
* **Quan hệ Nhiều - Nhiều (Many-to-Many) giữa Role và Permission:**
  Được mô hình hóa thông qua bảng nối `RolePermission` với khóa chính phức hợp hai trường `(roleId, permissionId)`. Thiết kế này cho phép phân quyền linh hoạt (Granular Permissions) mà không cần thay đổi cấu trúc bảng khi mở rộng chức năng mới.

---

### 4. CƠ CHẾ NHẬT KÝ KIỂM TOÁN BẤT BIẾN (IMMUTABLE AUDIT TRAIL)

* **Nguyên tắc Ghi một lần (Write-Once / Append-Only):**
  Bảng `AuditLog` là sổ cái bất biến:
  * Không cung cấp bất kỳ API nào cho phép sửa (`UPDATE`) hoặc xóa (`DELETE`) dữ liệu trong bảng này.
  * Mọi hành động nhạy cảm trong hệ thống (thôi việc, phê duyệt tăng lương, sửa chấm công, xuất báo cáo) đều bắt buộc phải kích hoạt hàm `createAuditLog()`.
* **Phục vụ Pháp lý & Nghị định 13/2023/NĐ-CP:**
  Lưu trữ bằng chứng phục vụ công tác thanh tra dữ liệu cá nhân, chứng minh rõ ràng ai đã truy cập hoặc sửa đổi thông tin lương/hồ sơ của nhân sự vào thời điểm nào.

---

### 5. CẤU HÌNH THAM SỐ NGHIỆP VỤ ĐỘNG (DYNAMIC SYSTEM SETTINGS)

Danh mục các tham số chuẩn hóa được quản lý tập trung trong bảng `SystemSetting`:

```sql
INSERT INTO "SystemSetting" ("category", "key", "name", "value", "dataType", "unit") VALUES
('PAYROLL', 'INSURANCE_RATE', 'Tỷ lệ trích nộp bảo hiểm của NLĐ', '10.5', 'PERCENT', '%'),
('PAYROLL', 'PERSONAL_DEDUCTION', 'Mức giảm trừ gia cảnh bản thân', '11000000', 'NUMBER', 'VNĐ / tháng'),
('PAYROLL', 'DEPENDENT_DEDUCTION', 'Mức giảm trừ mỗi người phụ thuộc', '4400000', 'NUMBER', 'VNĐ / người / tháng'),
('PAYROLL', 'MAX_INSURANCE_SALARY', 'Mức trần lương đóng BHXH bắt buộc', '46800000', 'NUMBER', 'VNĐ'),
('PAYROLL', 'STANDARD_WORKING_DAYS', 'Số ngày công định mức trong tháng', '22', 'NUMBER', 'Ngày'),
('ATTENDANCE', 'OT_RATE_NORMAL', 'Hệ số lương OT ngày thường', '150', 'PERCENT', '%'),
('ATTENDANCE', 'OT_RATE_WEEKEND', 'Hệ số lương OT cuối tuần', '200', 'PERCENT', '%'),
('ATTENDANCE', 'OT_RATE_HOLIDAY', 'Hệ số lương OT ngày nghỉ lễ', '300', 'PERCENT', '%');
```

Khi chính sách Nhà nước thay đổi (ví dụ điều chỉnh mức lương cơ sở hoặc thuế TNCN), Quản trị viên chỉ cần cập nhật cột `value` trong bảng `SystemSetting` mà không cần biên dịch hay khởi động lại máy chủ backend.
