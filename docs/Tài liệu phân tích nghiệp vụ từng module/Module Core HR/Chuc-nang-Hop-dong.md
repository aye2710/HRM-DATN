# Đặc tả chức năng: Quản lý Hợp đồng Lao động (Contracts)

## 1. Giới thiệu chức năng
Số hóa quy trình ký kết và quản lý thời hạn hợp đồng lao động. Theo dõi mức lương cơ bản để làm căn cứ tính lương (Payroll).

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Giới hạn thử việc:** Thời hạn hợp đồng thử việc tối đa là 60 ngày. (Pháp luật: Khoản 1 Điều 27 BLLĐ 2019).
- **Trạng thái Độc quyền (Exclusive Status):** Tại một thời điểm, một nhân viên chỉ có thể có TỐI ĐA 1 Hợp đồng ở trạng thái `ACTIVE` (Đang hiệu lực).
- **Cảnh báo tự động:** Hệ thống quét mỗi ngày, nếu hợp đồng còn <= 15 ngày là hết hạn, sẽ bắn thông báo cảnh báo cho HR (C&B).

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Tạo mới Hợp đồng
```mermaid
sequenceDiagram
    autonumber
    actor CB as Chuyên viên C&B
    participant FE as Giao diện (Contracts.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    CB->>FE: Chọn Nhân viên -> Bấm "Tạo Hợp đồng mới"
    FE->>BE: Kiểm tra nhân viên có Hợp đồng ACTIVE nào không?
    BE-->>FE: Trả về trạng thái hợp lệ
    
    CB->>FE: Điền Loại HĐ, Mức lương, Ngày bắt đầu/Kết thúc
    FE->>BE: POST /api/contracts
    
    rect rgb(240, 248, 255)
        BE->>DB: INSERT INTO Contract (status = 'ACTIVE')
        BE->>DB: UPDATE Employee SET status = 'ACTIVE' (nếu là HĐ chính thức)
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>CB: Thông báo tạo hợp đồng thành công
```

### 3.2. Luồng Cron Job Cảnh báo Hợp đồng hết hạn
Luồng chạy ngầm của Server không cần người dùng thao tác.

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Hệ thống Cron (Daily 00:00)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu
    participant Noti as Hệ thống Thông báo

    Cron->>BE: Trigger Job kiểm tra hợp đồng
    
    rect rgb(240, 248, 255)
        BE->>DB: SELECT Contract WHERE endDate - Today <= 15 days AND status = 'ACTIVE'
        DB-->>BE: Trả về danh sách HĐ sắp hết hạn
    end
    
    BE->>DB: Đổi status = 'EXPIRED' với các HĐ đã qua ngày endDate
    BE->>Noti: Gửi Alert/Email cho bộ phận C&B danh sách sắp hết hạn
```
