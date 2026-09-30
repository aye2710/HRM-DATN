# Đặc tả chức năng: Ghi nhận và Chốt công (Check-in/Check-out)

## 1. Giới thiệu chức năng
Giao diện để nhân viên tự bấm nút (Hoặc nhận dữ liệu từ Máy chấm công vân tay) ghi nhận giờ đến công ty và ra về. 

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Chống gian lận (Anti-fraud):** Nút Check-in trên Web sẽ kiểm tra địa chỉ IP. Nếu IP nằm ngoài dải IP của Công ty -> Từ chối ghi nhận.
- **Tính ngày công (Working Days):** Nếu tổng số giờ làm việc (Sau khi trừ giờ nghỉ trưa) >= 8 tiếng -> 1 Ngày công. Nếu làm 4 tiếng -> 0.5 Ngày công.
- **Quên Check-out:** Lúc 23:59 hàng ngày, hệ thống sẽ chốt công. Ai có Check-in mà không có Check-out sẽ bị đánh trạng thái `ERROR` (Cần làm đơn giải trình).

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Bấm nút Check-in (Web)
```mermaid
sequenceDiagram
    autonumber
    actor NV as Nhân viên
    participant FE as Giao diện (Dashboard)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    NV->>FE: Bấm nút "Check-in"
    FE->>BE: POST /api/attendance/check-in
    
    rect rgb(240, 248, 255)
        note right of BE: Validate Dữ liệu
        BE->>BE: Kiểm tra IP Công ty (Hợp lệ)
        BE->>DB: Kiểm tra xem hôm nay đã Check-in chưa? (Chưa)
        BE->>DB: Lấy thông tin Ca làm việc (Shift) để đối chiếu giờ
        BE->>DB: INSERT INTO Attendance (checkIn = now, status = NORMAL hoặc LATE)
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 200 OK
    FE->>NV: Thông báo "Check-in thành công lúc 08:05. Trạng thái: LATE (Đi muộn)"
```

### 3.2. Luồng Job chạy ngầm chốt công vắng mặt (23:59)
```mermaid
sequenceDiagram
    autonumber
    participant Cron as Hệ thống Cron (Daily 23:59)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    Cron->>BE: Trigger chốt công cuối ngày
    
    rect rgb(240, 248, 255)
        BE->>DB: Lấy danh sách Employee (Trừ những ai có LeaveRequest = APPROVED hoặc nằm trong Holiday)
        BE->>DB: Kiểm tra bảng Attendance hôm nay
        
        note right of DB: Phân loại 2 trường hợp lỗi
        BE->>DB: Trường hợp 1: Có Check-in, Không Check-out -> UPDATE status = 'ERROR'
        BE->>DB: Trường hợp 2: Không có Check-in -> INSERT bản ghi mới status = 'ABSENT' (workingDay = 0)
        
        DB-->>BE: Commit OK
    end
```
