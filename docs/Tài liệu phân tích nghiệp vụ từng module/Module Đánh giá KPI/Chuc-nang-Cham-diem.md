# Đặc tả chức năng: Chấm điểm Hiệu suất (Performance Review)

## 1. Giới thiệu chức năng
Chức năng dành cho Trưởng phòng (Sếp) chốt điểm cuối cùng cho nhân viên dựa trên các KPI đã hoàn thành.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Khung thời gian cứng:** Manager **CHỈ** được phép Submit form chấm điểm nếu ngày hiện tại nằm trong khung thời gian `startDate` đến `endDate` của ReviewCycle. Vượt quá hạn chót, hệ thống tự động khóa form thành Read-only.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Chấm điểm & Khóa hạn (Lock deadline)
```mermaid
sequenceDiagram
    autonumber
    actor MNG as Line Manager
    participant FE as Giao diện (Review.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    MNG->>FE: Mở phiếu chấm điểm của Nhân viên A (Chu kỳ Q3)
    FE->>BE: GET /api/review-cycles/:id
    BE-->>FE: Thông tin chu kỳ (endDate = 30/09/2026)
    
    FE->>FE: Validate Client: Hôm nay là 01/10/2026 (> 30/09)
    FE->>MNG: Disable nút Submit (Chuyển form sang Read-only)
    
    note over MNG, FE: Nếu đang trong hạn, Manager nhập điểm (VD: 4.5/5) và Submit
    
    FE->>BE: POST /api/performance-reviews
    
    rect rgb(240, 248, 255)
        note right of BE: Backend Re-validate an toàn
        BE->>BE: So sánh (Today <= endDate)
        BE->>DB: INSERT INTO PerformanceReview
        DB-->>BE: OK
    end
    
    BE-->>FE: HTTP 201 Created
    FE->>MNG: "Chấm điểm thành công"
```
