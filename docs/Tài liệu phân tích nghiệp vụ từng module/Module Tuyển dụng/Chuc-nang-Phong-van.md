# Đặc tả chức năng: Quản lý Lịch Phỏng vấn và Đánh giá

## 1. Giới thiệu chức năng
Số hóa toàn bộ quá trình giao tiếp giữa Chuyên viên tuyển dụng (Người điều phối) và Người phỏng vấn chuyên môn (Interviewer). Lưu vết lịch sử nhận xét và điểm số của từng ứng viên làm căn cứ ra quyết định nhận việc.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Ràng buộc đối tượng:** Khung danh sách chọn ứng viên để Lên lịch phỏng vấn chỉ hiển thị những người đang nằm ở trạng thái `INTERVIEWING` trên bảng Kanban.
- **Workflow Đánh giá (Feedback):** Chức năng "Chấm điểm" chỉ được phép hiển thị sau khi thời gian `scheduledAt` (Mốc diễn ra phỏng vấn) đã qua đi trong quá khứ. Nếu chưa tới giờ, chỉ hiển thị trạng thái "Chưa diễn ra".
- **Lưu vết 1 lần:** Sau khi Người phỏng vấn nộp Đánh giá (Feedback), hệ thống sẽ lưu lại và không cho phép chỉnh sửa để đảm bảo tính minh bạch.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Lên lịch phỏng vấn
Tạo lịch hẹn và chỉ định người phỏng vấn.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Interviews.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Truy cập trang Lịch Phỏng Vấn -> Chọn "Lên lịch mới"
    FE->>BE: GET /api/candidates?status=INTERVIEWING
    BE-->>FE: Trả về danh sách ứng viên đủ điều kiện
    
    FE->>HR: Hiển thị Modal xếp lịch
    HR->>FE: Chọn Ứng viên, Người phỏng vấn, Thời gian, Tên vòng
    HR->>FE: Bấm "Lưu thông tin"
    
    FE->>BE: POST /api/interviews (payload)
    
    rect rgb(240, 248, 255)
        BE->>DB: INSERT INTO InterviewRound
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>HR: Thông báo thành công và Cập nhật lại Bảng lịch trình
```

### 3.2. Luồng Đánh giá ứng viên sau phỏng vấn (Feedback)
Cho phép người phỏng vấn nhập điểm số và bình luận chi tiết.

```mermaid
sequenceDiagram
    autonumber
    actor IV as Người phỏng vấn (Interviewer)
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    IV->>FE: Xem danh sách phỏng vấn (Các lịch đã qua thời gian)
    FE->>IV: Nút "Chấm điểm" hiện lên (với các lịch isPast = true)
    IV->>FE: Bấm "Chấm điểm"
    FE->>IV: Hiển thị Modal Feedback
    
    IV->>FE: Kéo thanh trượt điểm số (1-10) và Nhập text nhận xét
    IV->>FE: Bấm "Lưu Đánh giá"
    
    FE->>BE: POST /api/interviews/:id/feedback
    
    rect rgb(240, 248, 255)
        note right of BE: Lưu vết Feedback
        BE->>DB: INSERT INTO CandidateFeedback (interviewRoundId, score, comments)
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>IV: Hiển thị trạng thái "Đã đánh giá (Kèm điểm)"
```
