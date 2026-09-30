# Đặc tả chức năng: Quản lý Nghỉ phép (Leave Requests)

## 1. Giới thiệu chức năng
Cung cấp giao diện để nhân viên theo dõi quỹ phép năm của mình và nộp đơn xin nghỉ. Trưởng phòng (Line Manager) sẽ tiến hành phê duyệt.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Chặn số phép âm (Anti-negative Balance):** Nếu tổng số ngày xin nghỉ (Loại Paid Leave) lớn hơn số ngày phép còn lại -> Hệ thống chặn không cho Submit đơn. Bắt buộc nhân viên chuyển sang loại Unpaid Leave (Nghỉ không lương).
- **Giao cắt Module Chấm công:** Khi Đơn xin nghỉ (Paid) được duyệt, hệ thống tự động sinh 1 bản ghi `ON_LEAVE` vào bảng Chấm công (Attendance), giúp nhân viên ngày đó không cần bấm Check-in mà vẫn có 1 Ngày công chuẩn.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xin nghỉ phép & Trừ quỹ phép tạm thời
```mermaid
sequenceDiagram
    autonumber
    actor NV as Nhân viên
    participant FE as Giao diện (Leave.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    NV->>FE: Bấm "Tạo Đơn xin nghỉ phép"
    FE->>BE: GET /api/leave-balances/me
    BE-->>FE: Trả về số phép còn lại (Ví dụ: Còn 5 ngày)
    
    NV->>FE: Chọn từ ngày 10/10 đến 12/10 (3 ngày), Loại: Nghỉ có lương (Paid)
    FE->>FE: Validate Client (3 <= 5) -> Cho đi tiếp
    NV->>FE: Bấm Submit
    
    FE->>BE: POST /api/leave-requests
    
    rect rgb(240, 248, 255)
        BE->>DB: INSERT INTO LeaveRequest (status = 'PENDING')
        note right of DB: Lock tạm thời số ngày phép để tránh tạo đúp đơn
        BE->>DB: UPDATE LeaveBalance SET usedDays = usedDays + 3
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>NV: Thông báo thành công, chờ Manager duyệt
```

### 3.2. Luồng Manager phê duyệt đơn
```mermaid
sequenceDiagram
    autonumber
    actor MNG as Line Manager
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    MNG->>FE: Xem danh sách Đơn chờ duyệt
    MNG->>FE: Chọn đơn của NV -> Bấm "Approve" (Duyệt)
    FE->>BE: PUT /api/leave-requests/:id/approve
    
    rect rgb(240, 248, 255)
        note right of BE: Giao cắt với Module Chấm công
        BE->>DB: UPDATE LeaveRequest SET status = 'APPROVED'
        BE->>DB: Tự động INSERT bảng Attendance (workingDay = 1.0) cho các ngày nghỉ
        DB-->>BE: OK
    end
    
    BE-->>FE: Cập nhật UI
    
    note over MNG, DB: Luồng Từ chối (Reject): Hệ thống sẽ hoàn trả lại 3 ngày phép vào LeaveBalance.
```
