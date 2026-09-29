# Ma trận Phân quyền & Quản lý Truy cập (RBAC Matrix)

Tài liệu định nghĩa các Role mặc định trong hệ thống và ma trận quyền hạn truy cập tương ứng với 30+ màn hình chức năng của Enterprise Portal.

## 1. Định nghĩa Nhóm quyền (Roles)

- **ROLE_ADMIN (Super Admin):** Quản trị viên hệ thống có toàn quyền tối cao. Sở hữu "ALL PERMISSIONS", truy cập được mọi Module và thực hiện cấu hình hệ thống (Settings).
- **ROLE_HR (HR Manager / Executive):** Quản trị viên Nhân sự. Có quyền truy cập sâu vào các module cốt lõi (Tổ chức, Nhân sự, Tuyển dụng, Hội nhập) nhưng bị hạn chế ở module Tiền lương (Nếu chia tách C&B) và Hệ thống.
- **ROLE_CB (C&B Manager):** Chuyên viên Tiền lương. Đặc quyền truy cập module Chấm công, Nghỉ phép và Tiền lương.
- **ROLE_MANAGER (Line Manager):** Quản lý trực tiếp (Trưởng phòng). Có quyền truy cập Trung tâm Phê duyệt để duyệt đơn, Giao KPI và xem dữ liệu nhân viên thuộc phòng ban quản lý.
- **ROLE_EMPLOYEE (Nhân viên):** Chỉ có quyền đăng nhập vào **Employee Portal** (Self-service). Xem hồ sơ cá nhân, Nộp đơn nghỉ, Xem phiếu lương.

## 2. Ma trận Phân quyền (Access Matrix)

Ký hiệu:
- `F` (Full): Xem, Thêm, Sửa, Xóa
- `V` (View): Chỉ xem (Read-only)
- `A` (Approve): Có quyền Duyệt yêu cầu
- `X` (No Access): Chặn truy cập (Hiển thị 403 Forbidden)

### 2.1 Module Tổ chức (Organization)
| Màn hình | Route | ADMIN | HR | CB | MANAGER | EMPLOYEE |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Phòng ban | `/internal/organization/departments` | F | F | V | V | X |
| Chức danh | `/internal/organization/positions` | F | F | V | V | X |
| Sơ đồ Tổ chức | `/internal/organization/chart` | F | V | V | V | (Portal) |

### 2.2 Module Tuyển dụng (Recruitment)
| Màn hình | Route | ADMIN | HR | CB | MANAGER | EMPLOYEE |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Yêu cầu Tuyển dụng | `/internal/recruitment/requisitions` | F | F | X | F | X |
| Ứng viên (ATS) | `/internal/recruitment/candidates` | F | F | X | V | X |
| Phỏng vấn | `/internal/recruitment/interviews` | F | F | X | F | X |
| Quản lý Offer | `/internal/recruitment/offers` | F | F | X | A | X |

### 2.3 Module Hội nhập (Onboarding)
| Màn hình | Route | ADMIN | HR | CB | MANAGER | EMPLOYEE |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Nhân viên mới | `/internal/onboarding/newbies` | F | F | V | V | X |
| Cấu hình Checklist | `/internal/onboarding/checklist` | F | F | X | X | X |
| Cấp thiết bị | `/internal/onboarding/equipment` | F | F | X | X | X |
| Cấp tài khoản | `/internal/onboarding/accounts` | F | F (IT) | X | X | X |
| Tiến độ Hội nhập | `/internal/onboarding/progress` | F | V | X | V | X |

### 2.4 Module Nhân sự (Employee Lifecycle)
| Màn hình | Route | ADMIN | HR | CB | MANAGER | EMPLOYEE |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Hồ sơ Nhân sự | `/internal/employees/profiles` | F | F | V | V (Team) | X |
| Việc làm (Jobs) | `/internal/employees/jobs` | F | F | V | V (Team) | X |
| Hợp đồng | `/internal/employees/contracts` | F | F | V | X | X |
| Điều chuyển | `/internal/employees/transfers` | F | F | V | A | X |
| Nghỉ việc | `/internal/employees/terminations` | F | F | V | A | X |

### 2.5 Cụm C&B (Chấm công, Nghỉ phép, Tiền lương)
| Màn hình | Route | ADMIN | HR | CB | MANAGER | EMPLOYEE |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Ca làm việc | `/internal/attendance/shifts` | F | X | F | V | X |
| Điều chỉnh công | `/internal/attendance/adjustments` | F | X | F | A | X |
| Chính sách Nghỉ phép | `/internal/leave/policies` | F | X | F | X | X |
| Yêu cầu Nghỉ phép | `/internal/leave/requests` | F | X | F | A | X |
| Kỳ lương & Payslip | `/internal/payroll/*` | F | X | F | X | X |

### 2.6 Hệ thống & Báo cáo (System & Reports)
| Màn hình | Route | ADMIN | HR | CB | MANAGER | EMPLOYEE |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| Dashboard Báo cáo | `/internal/reports` | F | F | F | X | X |
| Trung tâm phê duyệt | `/internal/system/workflows` | F | A | A | A | X |
| Thông báo | `/internal/system/notifications` | F | F | X | X | X |
| Nhật ký Kiểm toán | `/internal/system/audit` | F | X | X | X | X |
| Phân quyền (RBAC) | `/internal/system/rbac` | F | X | X | X | X |

## 3. Quy tắc Bảo mật Cấp thấp (Row-Level Security)
Được triển khai ẩn phía dưới Backend:
- Dù có quyền V (View), **ROLE_MANAGER** chỉ được xem các bản ghi (Hồ sơ, Chấm công, KPI) của các nhân sự nằm trong phòng ban (Department) hoặc chịu sự quản lý trực tiếp (Direct Report) của mình.
- Dữ liệu Lương (Salary) được mã hóa. **ROLE_HR** không thấy lương, chỉ **ROLE_CB** và **ROLE_ADMIN** mới được phép tiếp cận trường dữ liệu này.
