# Đặc tả chức năng: Quản lý Hồ sơ Nhân sự (Employee Profile)

## 1. Giới thiệu chức năng
Nơi quản lý toàn bộ thông tin cá nhân, thông tin công việc, và trạng thái làm việc của nhân viên trong công ty. Dữ liệu từ đây sẽ được các module khác (như Chấm công, Tính lương) sử dụng làm dữ liệu gốc.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Toàn vẹn CCCD:** Căn cước công dân (`cccd`) phải là duy nhất. Tuy nhiên, cho phép bỏ trống (Nullable) trong giai đoạn ứng viên mới nhận việc (Trạng thái ONBOARDING). Bắt buộc phải cập nhật CCCD khi ký hợp đồng chính thức.
- **Mã nhân viên (Code):** Được hệ thống sinh tự động hoặc HR nhập thủ công nhưng tuyệt đối không được trùng lặp.
- **Bảo mật PII:** Các dữ liệu cá nhân nhạy cảm (CCCD, SĐT) chỉ có HR Admin và chính nhân viên đó được quyền xem/sửa.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xem danh sách nhân sự
```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Admin
    participant FE as Giao diện (Employees.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Truy cập trang "Hồ sơ Nhân sự"
    FE->>BE: GET /api/employees
    
    rect rgb(240, 248, 255)
        BE->>DB: SELECT Employees JOIN Department JOIN Position
        DB-->>BE: Danh sách nhân viên
    end
    
    BE-->>FE: HTTP 200 OK
    FE->>HR: Hiển thị bảng danh sách nhân viên
```

### 3.2. Luồng Chỉnh sửa trạng thái làm việc (Cập nhật nghỉ việc)
Quản lý việc nhân viên thôi việc và tự động cắt quyền truy cập hệ thống.

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Admin
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Chọn Nhân viên A -> Đổi trạng thái thành "RESIGNED" (Nghỉ việc)
    FE->>BE: PUT /api/employees/:id/status (status: RESIGNED)
    
    rect rgb(255, 228, 225)
        note right of BE: Khóa tài khoản đăng nhập tương ứng
        BE->>DB: 1. UPDATE Employee SET status = 'RESIGNED'
        BE->>DB: 2. UPDATE Account SET isActive = false WHERE employeeId = :id
        DB-->>BE: Commit OK
    end
    
    BE-->>FE: HTTP 200 OK
    FE->>HR: Thông báo "Đã cập nhật trạng thái và vô hiệu hóa tài khoản"
```
