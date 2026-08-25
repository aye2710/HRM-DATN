# ĐẶC TẢ CHI TIẾT NGHIỆP VỤ & SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS)
**Dự án:** Quản trị Nhân sự Tổng thể (Enterprise HRM Portal)

Tài liệu này đặc tả luồng xử lý dữ liệu chi tiết của 8 phân hệ cốt lõi trong hệ thống. Sơ đồ tuần tự (Sequence Diagram) minh họa sự tương tác giữa Người dùng (Actor), Giao diện (Frontend), Hệ thống máy chủ (Backend), và Cơ sở dữ liệu (Database).

---

## 1. Phân hệ Tuyển dụng (ATS Kanban)

**Mô tả nghiệp vụ:** Luồng luân chuyển thẻ ứng viên qua các vòng phỏng vấn. Khi ứng viên chấp nhận thư mời nhận việc (Hired), hệ thống tự động sinh hồ sơ bên phân hệ Hội nhập.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Nhân sự (HR)
    participant FE as Giao diện Kanban
    participant BE as Backend Server
    participant DB as Database

    HR->>FE: Kéo thẻ ứng viên từ "Gửi thư mời" sang "Đã nhận việc"
    FE->>BE: PUT /api/candidates/{id}/status (Status: HIRED)
    BE->>DB: Cập nhật Candidate.Status = HIRED
    BE-->>FE: HTTP 200 OK
    FE->>HR: Hiển thị thông báo thành công
    
    rect rgb(230, 240, 255)
        note right of BE: Hệ thống tự động sinh dữ liệu Hội nhập
        BE->>DB: Truy vấn thông tin Candidate (Tên, Email, Vị trí)
        DB-->>BE: Dữ liệu Candidate
        BE->>DB: INSERT INTO Onboarding (EmployeeID, Status=PENDING)
    end
```

---

## 2. Phân hệ Hội nhập (Onboarding)

**Mô tả nghiệp vụ:** Quá trình chuẩn bị đón nhân sự mới. Thanh tiến độ (ProgressBar) tự động cập nhật phần trăm khi IT/HR hoàn thành các tác vụ yêu cầu.

```mermaid
sequenceDiagram
    autonumber
    actor IT as Bộ phận IT
    participant FE as Giao diện Hội nhập
    participant BE as Backend Server
    participant DB as Database

    IT->>FE: Tích chọn "Đã cấp phát Laptop"
    FE->>BE: POST /api/onboarding/{id}/tasks/{taskId}/complete
    BE->>DB: Cập nhật Task.IsCompleted = True
    
    note right of BE: Tính toán lại tiến độ
    BE->>DB: SELECT COUNT(*) FROM Tasks WHERE OnboardingID = {id}
    BE->>DB: SELECT COUNT(*) FROM Tasks WHERE IsCompleted = True
    BE->>BE: Tính % = (Completed / Total) * 100
    BE->>DB: Cập nhật Onboarding.Progress = %
    
    BE-->>FE: Trả về % mới
    FE->>IT: Cập nhật thanh ProgressBar (Ví dụ: 50% ➜ 100%)
```

---

## 3. Phân hệ Hợp đồng & Cảnh báo

**Mô tả nghiệp vụ:** Khi người dùng truy cập màn hình Hồ sơ, hệ thống tự động quét và đánh dấu cảnh báo màu cam đối với các hợp đồng sắp hết hạn (<= 30 ngày).

```mermaid
sequenceDiagram
    autonumber
    actor HR as Nhân sự (HR)
    participant FE as Giao diện Hợp đồng
    participant BE as Backend Server
    participant DB as Database

    HR->>FE: Truy cập trang Quản lý Hợp đồng
    FE->>BE: GET /api/contracts
    BE->>DB: SELECT * FROM Contracts WHERE Status = ACTIVE
    DB-->>BE: Danh sách Hợp đồng
    
    loop Duyệt từng hợp đồng
        BE->>BE: Tính số ngày còn lại: Days = EndDate - CurrentDate
        alt Days <= 30
            BE->>BE: Gắn cờ IsWarning = True
        else
            BE->>BE: Gắn cờ IsWarning = False
        end
    end
    
    BE-->>FE: Danh sách Hợp đồng (Kèm cờ cảnh báo)
    FE->>HR: Hiển thị giao diện (Thẻ hợp đồng <= 30 ngày bị bôi màu cam)
```

---

## 4. Phân hệ Nghỉ phép (Leave Management)

**Mô tả nghiệp vụ:** Nhân viên nộp đơn xin nghỉ, hệ thống kiểm tra số dư phép trước khi gửi cho Trưởng phòng phê duyệt.

```mermaid
sequenceDiagram
    autonumber
    actor EMP as Nhân viên
    participant FE as Giao diện Nghỉ phép
    participant BE as Backend Server
    participant DB as Database
    actor MNG as Trưởng phòng

    EMP->>FE: Bấm "Nộp đơn Nghỉ phép" (2 ngày)
    FE->>BE: POST /api/leaves/request (Days: 2)
    BE->>DB: SELECT LeaveBalance FROM Employee WHERE ID = {empId}
    DB-->>BE: Balance = 1
    
    alt Balance < Requested Days
        BE-->>FE: HTTP 400 Bad Request (Không đủ phép)
        FE->>EMP: Hiển thị lỗi "Số dư phép không đủ!"
    else
        BE->>DB: INSERT INTO LeaveRequests (Status: PENDING)
        BE-->>FE: HTTP 200 OK
        FE->>EMP: Báo nộp đơn thành công
        BE->>MNG: Đẩy thông báo có Đơn chờ duyệt vào Hộp thư
    end
```

---

## 5. Phân hệ Chấm công (Điều chỉnh giờ)

**Mô tả nghiệp vụ:** Luồng xử lý khi nhân viên gửi đơn xin sửa giờ chấm công do bị lỗi hoặc quên quẹt thẻ.

```mermaid
sequenceDiagram
    autonumber
    actor MNG as Trưởng phòng
    participant FE as Giao diện Phê duyệt
    participant BE as Backend Server
    participant DB as Database

    MNG->>FE: Bấm xem đơn Điều chỉnh giờ
    FE->>BE: GET /api/attendance/adjustments/{id}
    BE-->>FE: Trả về Dữ liệu Giờ Cũ & Giờ Mới
    FE->>MNG: Hiển thị: Giờ cũ (gạch ngang) ➜ Giờ mới (In đậm)
    
    MNG->>FE: Bấm "Phê duyệt"
    FE->>BE: POST /api/attendance/adjustments/{id}/approve
    
    BE->>DB: Kiểm tra Payroll Kỳ này đã bị khóa chưa?
    alt Đã khóa (Processing)
        BE-->>FE: HTTP 403 (Kỳ lương đã chốt, cấm sửa)
    else Chưa khóa
        BE->>DB: UPDATE Attendance SET TimeIn = NewTimeIn
        BE->>DB: UPDATE AdjustmentRequest SET Status = APPROVED
        BE-->>FE: HTTP 200 OK
    end
```

---

## 6. Phân hệ Tiền lương (Quy trình Khóa sổ)

**Mô tả nghiệp vụ:** Hành động quan trọng nhất của phân hệ Lương. Chuyên viên C&B chốt dữ liệu để chuẩn bị chuyển khoản, cấm mọi hành vi sửa công.

```mermaid
sequenceDiagram
    autonumber
    actor CB as Chuyên viên C&B
    participant FE as Giao diện Tiền lương
    participant BE as Backend Server
    participant DB as Database

    CB->>FE: Bấm nút "Khóa bảng lương" (Lock)
    FE->>BE: POST /api/payroll/{periodId}/lock
    
    BE->>DB: UPDATE PayrollPeriod SET Status = PROCESSING
    BE->>DB: Khởi chạy thủ tục Trigger Database
    note right of DB: Bật cờ (Flag) chặn lệnh UPDATE/INSERT <br/> trên bảng Attendance và Leave của tháng này.
    
    BE-->>FE: HTTP 200 OK
    FE->>CB: Đổi giao diện sang chế độ "Chỉ xem" (Read-only)
```

---

## 7. Phân hệ Đánh giá KPI

**Mô tả nghiệp vụ:** Trưởng phòng tiến hành chấm điểm hiệu suất của nhân viên cuối kỳ.

```mermaid
sequenceDiagram
    autonumber
    actor MNG as Trưởng phòng
    participant FE as Giao diện KPI
    participant BE as Backend Server
    participant DB as Database

    MNG->>FE: Nhập điểm các tiêu chí (Ví dụ: 8, 9, 7)
    FE->>BE: POST /api/kpi/evaluate
    
    BE->>BE: Tính điểm trung bình cộng (Trọng số 100%)
    BE->>DB: Lưu điểm số vào KPI_Records
    BE->>DB: Cập nhật Hạng (Xếp loại A, B, C dựa trên điểm)
    
    BE-->>FE: HTTP 200 OK
    FE->>MNG: Hiển thị biểu đồ Spider Radar kết quả đánh giá
```

---

## 8. Phân hệ Hệ thống (Nhật ký kiểm toán / Audit Logs)

**Mô tả nghiệp vụ:** Bất kể hệ thống nào thay đổi dữ liệu nhạy cảm (như Tiền lương, Cấp quyền), hệ thống sẽ ngầm (background) ghi vết lại IP và dữ liệu thay đổi.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Bất kỳ Actor nào
    participant BE as Backend Server
    participant DB as Database
    participant Audit as Dịch vụ Audit Log

    Admin->>BE: Gửi lệnh thay đổi dữ liệu (Ví dụ: Sửa Lương cơ bản)
    
    BE->>DB: SELECT OldValue FROM Salary WHERE ID = 1
    DB-->>BE: Trả về OldValue = 10.000.000
    
    BE->>DB: UPDATE Salary SET Value = 12.000.000
    
    note right of BE: Ghi log chạy bất đồng bộ (Async)
    BE-)$Audit: Gửi (User_IP, Action="Sửa lương", Old=10M, New=12M)
    Audit->>DB: INSERT INTO AuditLogs
```
