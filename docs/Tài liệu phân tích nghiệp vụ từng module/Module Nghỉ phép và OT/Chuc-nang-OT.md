# Đặc tả chức năng: Quản lý Làm thêm giờ (OT Requests)

## 1. Giới thiệu chức năng
Cho phép nhân viên đăng ký giờ làm thêm ngoài ca hành chính để hệ thống tính toán chi trả lương OT (nhân hệ số x1.5 hoặc x2.0).

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Giới hạn số giờ làm thêm (Theo Luật LĐ 2019):** Hệ thống chặn nghiêm ngặt việc xin làm thêm vượt quá **40 giờ/tháng**. Nếu vi phạm, công ty có thể bị phạt nặng.
- **Giờ xin (Request) vs Giờ thực tế (Actual):** Nhân viên khai báo giờ xin OT (Ví dụ 4 tiếng), nhưng Trưởng phòng/HR có quyền điều chỉnh lại giờ thực tế được duyệt (Ví dụ chỉ duyệt 3 tiếng). Module Tiền lương sẽ lấy giờ thực tế.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xin làm thêm giờ (Kèm Validate Luật LĐ)
```mermaid
sequenceDiagram
    autonumber
    actor NV as Nhân viên
    participant FE as Giao diện (OT.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    NV->>FE: Bấm "Tạo Đơn OT"
    FE->>HR: Hiển thị form khai báo OT
    NV->>FE: Nhập ngày 15/10, xin OT 5 tiếng. Submit.
    
    FE->>BE: POST /api/ot-requests
    
    rect rgb(255, 228, 225)
        note right of BE: Kiểm tra Giới hạn Luật Lao động
        BE->>DB: Tính tổng số giờ OT trong tháng hiện tại của NV
        DB-->>BE: Kết quả: Đã OT 38 tiếng
        
        BE->>BE: Tính tổng: 38 + 5 = 43 tiếng (> 40 tiếng)
        BE-->>FE: HTTP 400 Bad Request (Vượt quá 40h/tháng theo BLLĐ)
    end
    
    FE->>NV: Hiển thị báo lỗi: "Vượt giới hạn 40 giờ OT mỗi tháng"
    
    note over NV, DB: Nếu NV sửa lại xin OT 2 tiếng (Tổng 40h) -> Hệ thống INSERT thành công.
```
