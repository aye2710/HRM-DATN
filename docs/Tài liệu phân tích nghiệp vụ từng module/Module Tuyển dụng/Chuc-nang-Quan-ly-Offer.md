# Đặc tả chức năng: Quản lý Đề nghị nhận việc (Job Offers)

## 1. Giới thiệu chức năng
Giai đoạn cuối cùng của vòng đời ứng viên. HR sẽ tạo và gửi Thư mời nhận việc (Job Offer), chốt mức lương và các thỏa thuận đi làm để ứng viên phản hồi.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Điều kiện kích hoạt:** Chỉ ứng viên ở cột `OFFERING` mới được cấp Job Offer.
- **Khóa dữ liệu (Data Locking):** Khi ứng viên xác nhận đồng ý (Accepted), Bản ghi Job Offer lập tức bị khóa (Read-only) và tự động kích hoạt luồng di chuyển thẻ Kanban của ứng viên đó sang cột `HIRED`.
- **Tái sử dụng dữ liệu:** Thông tin `Mức lương cơ bản` và `Ngày đi làm` nhập ở Offer này sẽ là nguồn cấp dữ liệu (Source of truth) để sinh tự động Hợp đồng thử việc bên Module Quản lý Nhân sự sau này.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Tạo mới Job Offer
Thiết lập thỏa thuận gửi ứng viên.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Offers.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm "Tạo Offer Mới"
    FE->>BE: GET /api/candidates?status=OFFERING
    BE-->>FE: Danh sách ứng viên chờ Offer
    
    FE->>HR: Hiển thị form tạo Offer
    HR->>FE: Nhập Mức lương, Ngày nhận việc, Tỷ lệ thử việc
    FE->>BE: POST /api/offers (Payload)
    
    rect rgb(240, 248, 255)
        BE->>DB: INSERT INTO JobOffer (status = 'PENDING')
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>HR: Tạo Offer thành công, chờ ứng viên phản hồi
```

### 3.2. Luồng Xác nhận Offer (Ứng viên Đồng ý / Từ chối)
Luồng này xử lý logic liên kết ngược lại bảng Kanban (ATS).

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    note over HR, FE: Giả lập việc HR nhận được email đồng ý từ ứng viên và cập nhật thay
    HR->>FE: Bấm chọn "Ứng viên Đồng ý (Accept)" trên một Offer PENDING
    FE->>BE: PUT /api/offers/:id/accept
    
    rect rgb(240, 248, 255)
        note right of BE: Transaction: Khóa Offer & Đổi trạng thái Ứng viên
        BE->>DB: 1. UPDATE JobOffer SET status = 'ACCEPTED'
        BE->>DB: 2. UPDATE Candidate SET status = 'HIRED' WHERE id = offer.candidateId
        DB-->>BE: Commit OK
    end
    
    BE-->>FE: HTTP 200 OK
    FE->>HR: Thông báo "Cập nhật thành công. Ứng viên đã được chuyển sang Hired."
    
    note over BE, DB: Nếu ứng viên Từ chối (Reject), Candidate status sẽ đổi thành REJECTED.
```
