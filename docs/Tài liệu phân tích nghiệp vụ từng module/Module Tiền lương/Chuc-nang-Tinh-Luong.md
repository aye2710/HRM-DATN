# Đặc tả chức năng: Chạy Lương Gross to Net

## 1. Giới thiệu chức năng
Chức năng dành cho C&B để tổng hợp dữ liệu từ tất cả các Module khác (Lương cơ bản từ Core HR, Ngày công từ Chấm công, Giờ từ OT) và đưa vào công thức tính toán tài chính.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Chặn Re-run (Không chạy lại):** Khi Giám đốc đã duyệt bảng lương và chuyển sang trạng thái `LOCKED`, C&B tuyệt đối không được phép chạy lại (Re-run) bảng lương tháng đó để tránh thay đổi chứng từ kế toán.
- **Tỷ lệ Khấu trừ Luật định:** Tự động trừ 10.5% lương đóng BHXH của NLĐ.
- **Tính Thuế TNCN:** Dựa trên Biểu thuế lũy tiến từng phần (7 bậc).

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Tổng hợp & Chạy bảng lương
```mermaid
sequenceDiagram
    autonumber
    actor CB as Chuyên viên C&B
    participant FE as Giao diện (Payroll.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    CB->>FE: Bấm "Chạy Lương Tháng 10/2026"
    FE->>BE: POST /api/payroll-periods/:id/run
    
    rect rgb(240, 248, 255)
        note right of BE: Quá trình gom dữ liệu lớn (Heavy Query)
        BE->>DB: Lấy Lương Cơ Bản (Contract = ACTIVE)
        BE->>DB: Lấy Ngày Công Thực Tế (Attendance)
        BE->>DB: Lấy Giờ OT Thực Tế (OTRequest = APPROVED)
        
        BE->>BE: Tính Lương Gross = (Lương Cơ Bản / Ngày Công Chuẩn) * Ngày Thực Tế + Tiền OT
        BE->>BE: Tính Khấu trừ Bảo Hiểm (10.5%)
        BE->>BE: Tính Giảm trừ gia cảnh (11tr) & Áp dụng Thuế lũy tiến
        BE->>BE: Lương Net = Gross - BH - Thuế
        
        BE->>DB: INSERT INTO Payslip (Trạng thái = DRAFT)
        DB-->>BE: Commit
    end
    
    BE-->>FE: HTTP 200 OK
    FE->>CB: Hiển thị Bảng lương tổng (DRAFT)
```
