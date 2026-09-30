# PHÂN TÍCH NGHIỆP VỤ: MODULE ĐÁNH GIÁ HIỆU SUẤT (PERFORMANCE & KPI)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Lượng hóa chất lượng công việc của nhân viên theo định kỳ (Tháng/Quý/Năm) thông qua hệ thống KPI. Làm cơ sở xét tăng lương, thưởng hoặc sa thải.
- **Giá trị mang lại:** Tạo sự công bằng, minh bạch trong đánh giá. Giúp Ban lãnh đạo phát hiện được nhân viên xuất sắc hoặc nhân viên yếu kém.
- **Phạm vi (In-scope):** Quản lý Chu kỳ đánh giá (Review Cycles), Gán mục tiêu KPI, Chấm điểm hiệu suất.
- **Các bên liên quan:** Nhân viên (Tự đánh giá/Thực hiện KPI), Line Manager (Đánh giá cấp dưới), HR (Kiểm soát chu kỳ).

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| PER-01 | Chu kỳ Đánh giá | Tạo đợt đánh giá (VD: Đánh giá Quý 3/2026), thiết lập ngày bắt đầu/kết thúc. | HR Admin | Must have |
| PER-02 | Gán mục tiêu KPI | Trưởng phòng hoặc HR gán các chỉ tiêu công việc cho từng nhân viên. | Line Manager | Must have |
| PER-03 | Đánh giá & Chấm điểm | Manager vào chấm điểm hoàn thành KPI cho nhân sự của mình. | Line Manager | Must have |

---

## 3. Quy trình nghiệp vụ
**Luồng đánh giá hàng Quý:**
1. Đầu quý, HR Admin tạo một `ReviewCycle` (Ví dụ: Q1-2026).
2. Line Manager vào hệ thống, tạo các `KPI` cho từng nhân viên phòng mình (Ví dụ: Sales cần đạt 500tr).
3. Cuối quý (Trong khoảng startDate - endDate của chu kỳ), Manager tiến hành truy cập form `PerformanceReview`.
4. Manager chấm điểm (Ví dụ: Đạt 4/5) và ghi nhận xét. Hệ thống khóa bản ghi sau khi Submit.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-PER-01 | Khóa thời gian đánh giá | Manager CHỈ được phép Submit form đánh giá nếu ngày hiện tại nằm trong khung thời gian `startDate` đến `endDate` của ReviewCycle. | Ràng buộc HT | Đảm bảo đúng deadline |
| BR-PER-02 | Chỉnh sửa KPI | Không được phép sửa đổi/xóa Mục tiêu KPI khi Chu kỳ đánh giá đã kết thúc. | Ràng buộc HT | Tính toàn vẹn dữ liệu |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: ReviewCycle**
- `UPCOMING`: Khởi tạo trước, chưa tới hạn.
- `ACTIVE`: Đang trong thời gian đánh giá.
- `CLOSED`: Đã kết thúc, cấm mọi thao tác thêm/sửa điểm.

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **ReviewCycle** | id, name, startDate, endDate, status | PK, String, Date, Date, Enum | 1-n PerformanceReview | "Đánh giá Q1" |
| **KPI** | id, employeeId, description, target, achieved | PK, FK, String, Decimal, Decimal | n-1 Employee | Target = 100%, Achieved = 85% |
| **PerformanceReview**| id, employeeId, reviewCycleId, score, comments | PK, FK, FK, Decimal, Text | n-1 Employee, n-1 Cycle | Điểm tổng hợp |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **HR Admin**, tôi muốn **Hệ thống tự động Đóng chu kỳ đánh giá khi hết hạn**, để **đảm bảo tính kỷ luật của các Trưởng phòng**.
- *AC1:* Đến ngày `endDate`, Job chạy ngầm đổi status của Cycle thành `CLOSED`.
- *AC2:* Manager truy cập form chấm điểm vào ngày hôm sau -> Giao diện hiện "Read-only", nút Submit bị disable.

---

## 8. Phân quyền & bảo mật
- **Nhân viên:** Chỉ xem được Điểm đánh giá và KPI của chính mình.
- **Trưởng phòng:** Có quyền gán KPI và Chấm điểm cho nhân sự trong phòng mình. Không xem được phòng khác.

---

## 9. Tích hợp & phụ thuộc
- **Giao cắt Module Tiền lương:** Điểm `PerformanceReview` có thể được xuất ra làm tham số để tính Lương tháng thứ 13 hoặc tính Tiền thưởng hiệu suất (Bonus) bên phân hệ Payroll.

---

## 10. Yêu cầu phi chức năng
- Báo cáo biểu đồ Radar hoặc Bar chart hiển thị phổ điểm của toàn công ty (Bao nhiêu % xuất sắc, bao nhiêu % yếu kém).

---

## 11. Edge cases & rủi ro
1. *Nhân viên nghỉ việc giữa chu kỳ:* Chưa đến hạn chót nhưng nhân viên Resign. Cần cơ chế Đánh giá đột xuất hoặc tự động loại khỏi danh sách đánh giá của Quý đó.
2. *Chuyển phòng ban (Transfer):* Làm 1 nửa quý ở phòng A, nửa quý ở phòng B. Ai là người chấm điểm? (Xử lý: Hệ thống cho phép Multi-reviewer, 2 manager cùng chấm và lấy trung bình cộng).

---

## 12. Câu hỏi cần làm rõ
- Hệ thống có hỗ trợ phương pháp Đánh giá 360 độ (Đồng nghiệp tự chấm nhau) không, hay chỉ Top-down (Sếp chấm lính)? *(Giả định: Giai đoạn 1 chỉ làm Top-down để giảm độ phức tạp)*.
