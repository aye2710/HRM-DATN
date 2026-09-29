# Đặc tả chức năng: Quản lý Yêu cầu Tuyển dụng (Job Requisitions)

## 1. Giới thiệu chức năng
Chức năng cho phép người dùng (Trưởng phòng, Quản lý nhân sự) thiết lập các chiến dịch tuyển dụng dựa trên nhu cầu định biên. Mọi tin đăng tuyển sau này đều phải tham chiếu tới một Yêu cầu tuyển dụng đã được duyệt.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Toàn vẹn dữ liệu:** Không được tạo Yêu cầu tuyển dụng trống. Phải bắt buộc liên kết với `DepartmentId` và `PositionId`.
- **Auto-fetch dữ liệu:** Khi chọn Chức danh (Position), hệ thống tự động điền Phòng ban và Ngân sách lương của Chức danh đó.
- **Logic Xóa:** Chỉ được phép xóa chiến dịch khi nó ở trạng thái Nháp (DRAFT) và chưa có ứng viên nào ứng tuyển. Nếu đã có ứng viên, chỉ được Đóng (CLOSED).
- **Tính toán tỷ lệ lấp đầy (Fill Rate):** Tiến độ tuyển dụng = (Số lượng ứng viên đã chuyển sang HIRED / Số lượng cần tuyển) * 100%.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xem danh sách Yêu cầu tuyển dụng
Hiển thị toàn bộ các chiến dịch tuyển dụng kèm theo tỷ lệ lấp đầy của từng chiến dịch.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Requisitions.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Truy cập trang "Yêu cầu Tuyển dụng"
    FE->>BE: GET /api/job-postings
    
    rect rgb(240, 248, 255)
        note right of BE: Truy vấn thông tin & Đếm ứng viên
        BE->>DB: SELECT JobPostings JOIN Department JOIN Position
        BE->>DB: COUNT(Candidates) WHERE status = 'HIRED' (GROUP BY JobPosting)
        DB-->>BE: Danh sách Job Postings kèm thông tin liên quan
    end
    
    BE-->>FE: HTTP 200 OK (Mảng dữ liệu)
    FE->>FE: Lọc dữ liệu theo từ khóa tìm kiếm (nếu có)
    FE->>HR: Hiển thị bảng danh sách & Thanh tiến độ (Progress bar)
```

### 3.2. Luồng Thêm mới Yêu cầu tuyển dụng
Quản lý tạo mới một yêu cầu. Hệ thống tự động fetch phòng ban và lương dựa trên vị trí được chọn.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Requisitions.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm "Tạo Yêu cầu mới"
    FE->>BE: GET /api/departments & GET /api/positions
    BE-->>FE: Trả về danh sách Department và Position
    FE->>HR: Hiển thị Modal Thêm mới
    
    HR->>FE: Chọn Vị trí (Position)
    FE->>FE: Tự động điền Department và Salary Range tương ứng
    HR->>FE: Điền các thông tin còn lại và bấm "Lưu thông tin"
    
    FE->>BE: POST /api/job-postings (payload)
    
    rect rgb(240, 248, 255)
        note right of BE: Validate dữ liệu & Thêm mới
        BE->>DB: INSERT INTO JobPosting
        DB-->>BE: Bản ghi vừa tạo
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>HR: Hiển thị thông báo thành công & Tắt Modal
    FE->>BE: Gọi lại GET /api/job-postings để refresh bảng
```

### 3.3. Luồng Xóa Yêu cầu tuyển dụng
Bảo vệ dữ liệu không bị xóa nhầm nếu chiến dịch đang chạy.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm Xóa chiến dịch
    FE->>HR: Hiển thị cảnh báo xác nhận xóa
    HR->>FE: Xác nhận "Đồng ý"
    FE->>BE: DELETE /api/job-postings/:id
    
    rect rgb(255, 228, 225)
        note right of BE: Kiểm tra điều kiện xóa
        BE->>DB: Kiểm tra xem có Ứng viên (Candidate) nào thuộc Job này không?
        alt Có ứng viên
            DB-->>BE: Số lượng > 0
            BE-->>FE: HTTP 400 Error (Không thể xóa vì đã có ứng viên nộp CV)
        else Không có ứng viên
            DB-->>BE: Số lượng = 0
            BE->>DB: DELETE FROM JobPosting WHERE id = :id
            DB-->>BE: OK
            BE-->>FE: HTTP 200 OK
        end
    end
    
    FE->>HR: Hiển thị thông báo kết quả và refresh bảng
```
