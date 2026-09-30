# Đặc tả chức năng: Quản lý Phiếu Lương (Payslip)

## 1. Giới thiệu chức năng
Giai đoạn cuối cùng của kỳ lương. Sau khi chốt sổ, phiếu lương chi tiết sẽ được "bắn" về màn hình tài khoản cá nhân của từng nhân viên.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Bảo mật tuyệt đối (Data Masking):** Dữ liệu bảng lương là tối mật. Các API liên quan đến Payslip chỉ được phép truy cập bởi: 1) Chính nhân viên sở hữu phiếu đó. 2) C&B hoặc Giám đốc. Mọi nhân sự khác gọi API sẽ bị chặn 403 Forbidden.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Chốt Lương (Lock) & Gửi Phiếu
```mermaid
sequenceDiagram
    autonumber
    actor CEO as Giám đốc (CEO)
    actor NV as Nhân viên
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    CEO->>FE: Xem bảng lương tổng (DRAFT) -> Bấm "Phê duyệt & Chốt sổ"
    FE->>BE: PUT /api/payroll-periods/:id/lock
    
    rect rgb(240, 248, 255)
        BE->>DB: UPDATE PayrollPeriod SET status = 'LOCKED'
        BE->>DB: UPDATE Payslip SET status = 'PUBLISHED'
        DB-->>BE: OK
    end
    
    BE-->>FE: "Đã chốt sổ thành công"
    
    note over NV, DB: Nhân viên xem phiếu lương cá nhân
    NV->>FE: Đăng nhập -> Vào mục Lương của tôi
    FE->>BE: GET /api/payslips/me
    BE-->>FE: Trả về duy nhất Payslip của NV đó
    FE->>NV: Hiển thị phiếu lương chi tiết (Có nút tải PDF)
```
