# Đặc tả chức năng: Quản lý Ứng viên bằng Kanban (ATS Board)

## 1. Giới thiệu chức năng
Chức năng cốt lõi của Module Tuyển dụng, cho phép Chuyên viên Tuyển dụng quản lý ứng viên qua một bảng Kanban kéo thả (Tương tự Trello). Mỗi cột tương ứng với một vòng trong phễu tuyển dụng.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Trạng thái luồng (Strict Pipeline):** Ứng viên phải đi theo luồng chuẩn: `SOURCED` -> `SCREENING` -> `INTERVIEWING` -> `OFFERING` -> `HIRED`. Không được phép kéo lùi lại các vòng trước (chỉ được loại bỏ - `REJECTED`).
- **Auto-provisioning Employee:** Đây là tính năng chuyển đổi dữ liệu trọng tâm. Ngay khi ứng viên được kéo vào trạng thái `HIRED`, hệ thống sẽ kích hoạt một Trigger chạy ngầm để sinh ra Hồ sơ Nhân viên (Core HR) mới, triệt tiêu hoàn toàn thao tác gõ lại dữ liệu bằng tay.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xem bảng Kanban ATS
Hiển thị các ứng viên theo từng cột trạng thái.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (RecruitmentATS.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Truy cập trang "Quản lý Tuyển dụng" (Kanban)
    FE->>BE: GET /api/candidates
    
    rect rgb(240, 248, 255)
        BE->>DB: SELECT Candidates JOIN JobPosting
        DB-->>BE: Danh sách Ứng viên
    end
    
    BE-->>FE: HTTP 200 OK (Mảng ứng viên)
    FE->>FE: Nhóm ứng viên vào 5 mảng con tương ứng với 5 cột trạng thái
    FE->>HR: Render bảng Kanban với các thẻ Ứng viên
```

### 3.2. Luồng Kéo thả thẻ (Chuyển trạng thái Ứng viên bình thường)
Dành cho việc chuyển ứng viên qua các vòng từ SOURCED đến OFFERING.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Kéo thẻ Ứng viên từ cột SCREENING thả vào INTERVIEWING
    FE->>FE: Kiểm tra tính hợp lệ của luồng (Valid Transitions)
    FE->>HR: Hiển thị Modal "Xác nhận chuyển trạng thái"
    HR->>FE: Chọn "Đồng ý"
    
    FE->>BE: PUT /api/candidates/:id (Payload: { status: 'INTERVIEWING' })
    
    rect rgb(240, 248, 255)
        BE->>DB: UPDATE Candidate SET status = 'INTERVIEWING'
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 200 OK
    FE->>FE: Cập nhật lại UI bảng Kanban
    FE->>HR: Kéo thả thành công
```

### 3.3. Luồng Xác nhận HIRED (Tự động tạo Hồ sơ Nhân sự)
Giai đoạn cuối cùng của phễu. Khi ứng viên nhận việc, hệ thống tự động đẩy dữ liệu sang Module Tổ chức & Nhân sự.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Kéo thẻ Ứng viên từ OFFERING sang HIRED
    FE->>HR: Hiển thị Modal "Chuyển ứng viên này thành Nhân viên?"
    HR->>FE: Chọn "Xác nhận & Tạo Hồ sơ"
    
    FE->>BE: PUT /api/candidates/:id/hire
    
    rect rgb(240, 248, 255)
        note right of BE: Bắt đầu Transaction Database
        BE->>DB: 1. UPDATE Candidate SET status = 'HIRED'
        BE->>DB: 2. Lấy thông tin ứng viên (Tên, Email, SDT) & Job (Phòng ban, Vị trí)
        BE->>DB: 3. INSERT INTO Employee (Tên, SDT, DepartmentId, PositionId, Status = 'ONBOARDING')
        DB-->>BE: Commit Transaction OK
    end
    
    BE-->>FE: HTTP 200 OK (Kèm thông báo Đã tạo mã nhân viên)
    FE->>HR: Cập nhật thẻ sang cột HIRED & Hiển thị thông báo thành công
```
