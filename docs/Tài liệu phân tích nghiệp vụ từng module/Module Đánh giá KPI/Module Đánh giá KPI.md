# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE ĐÁNH GIÁ (PERFORMANCE & KPI)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Lượng hóa chất lượng công việc của nhân viên theo định kỳ (Tháng/Quý/Năm) thông qua hệ thống KPI. Làm cơ sở xét tăng lương, thưởng hoặc sa thải.
- **Giá trị mang lại:** Tạo sự công bằng, minh bạch trong đánh giá.
- **Phạm vi (In-scope):** Quản lý Chu kỳ đánh giá (Review Cycles), Gán mục tiêu KPI, Chấm điểm hiệu suất.
- **Các bên liên quan:** Nhân viên (Thực hiện KPI), Line Manager (Đánh giá cấp dưới), HR (Kiểm soát chu kỳ).

---

## 2. Cấu trúc dữ liệu chính
1. **ReviewCycle (Chu kỳ):** Ví dụ "Đánh giá Quý 3/2026", định nghĩa rõ ngày bắt đầu và ngày kết thúc nộp điểm.
2. **KPI:** Các mục tiêu cụ thể (Ví dụ: Doanh số đạt 500tr).
3. **PerformanceReview (Phiếu đánh giá):** Nơi Line Manager chốt điểm tổng và ghi feedback.

---

## 3. Danh sách Chức năng con
1. **Chức năng Quản lý Chu kỳ và Mục tiêu (PER-01, PER-02)**
2. **Chức năng Chấm điểm Hiệu suất (PER-03)**
