# PHÂN TÍCH NGHIỆP VỤ: MODULE TIỀN LƯƠNG (PAYROLL)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Điểm hội tụ của toàn bộ hệ thống HRM. Chuyển đổi dữ liệu Chấm công, Phép, OT, Thưởng phạt thành các con số tài chính chính xác (Phiếu lương / Payslip).
- **Giá trị mang lại:** Giảm thiểu sai sót tính lương (rủi ro kiện cáo luật pháp), tự động tính Thuế TNCN (Personal Income Tax).
- **Phạm vi (In-scope):** Kỳ lương (Payroll Period), Bảng tính lương Gross to Net, Khấu trừ BHXH/BHYT, Tính thuế TNCN, Phiếu lương (Payslip).
- **Các bên liên quan:** C&B Specialist (Người chạy lương), Giám đốc (Duyệt bảng lương), Nhân viên (Nhận phiếu lương).

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| PR-01 | Kỳ lương (Payroll Period) | Khởi tạo bảng lương tháng (Ví dụ: Lương Tháng 9/2026). | C&B | Must have |
| PR-02 | Chạy Lương (Run Payroll) | Tổng hợp dữ liệu chấm công, tính toán công thức Gross to Net. | C&B | Must have |
| PR-03 | Biểu thuế (Tax Brackets) | Setup bảng lũy tiến tính thuế TNCN theo luật định. | HR Admin | Should have |
| PR-04 | Phụ cấp (Allowances) | Gán các khoản phụ cấp (Điện thoại, ăn trưa) cho nhân sự. | C&B | Should have |
| PR-05 | Phiếu lương (Payslip) | Xuất báo cáo chi tiết thu nhập/khấu trừ cho từng nhân viên. | Employee | Must have |

---

## 3. Quy trình nghiệp vụ
**Luồng tính lương định kỳ (Cuối tháng):**
1. C&B tạo Kỳ lương mới (Ví dụ: Tháng 9).
2. Hệ thống đếm số "Ngày công chuẩn" (Thường là 22 hoặc 26 ngày).
3. (Tự động) C&B bấm "Chạy Lương". Hệ thống lấy Lương cơ bản (Từ Contract), Công thực tế (Từ Attendance), Số giờ OT (Từ OTRequest).
4. Hệ thống tính `Gross Salary` = (Lương cơ bản / Ngày công chuẩn) * Công thực tế + Lương OT + Phụ cấp.
5. Hệ thống tính Khấu trừ: 10.5% BHXH/BHYT/BHTN + Thuế TNCN.
6. Kết quả ra `Net Salary` (Lương thực nhận). Bảng lương ở trạng thái DRAFT.
7. Giám đốc Review. Nếu OK, đổi trạng thái sang LOCKED. Hệ thống bắn Payslip vào màn hình của từng nhân viên.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-PR-01 | Mức lương tối thiểu vùng | Lương đóng BHXH không được thấp hơn mức tối thiểu vùng do Nhà nước quy định. | Pháp luật | NĐ 38/2022/NĐ-CP |
| BR-PR-02 | Tỷ lệ trích đóng BHXH | NLĐ đóng 8% BHXH, 1.5% BHYT, 1% BHTN (Tổng 10.5%). | Pháp luật | Luật BHXH 2014 |
| BR-PR-03 | Trạng thái Kỳ lương | Nếu Kỳ lương đã bị khóa (LOCKED), tuyệt đối cấm C&B tính lại (Re-run) bảng lương để tránh sai lệch chứng từ ngân hàng. | Ràng buộc HT | Tài chính toàn vẹn |
| BR-PR-04 | Thuế TNCN Lũy tiến | Nếu thu nhập chịu thuế > 0, tính theo 7 bậc lũy tiến (5%, 10%, 15%...). Phải trừ giảm trừ gia cảnh (11tr cho bản thân) trước khi tính. | Pháp luật | Luật Thuế TNCN |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: PayrollPeriod**
- `DRAFT`: Đang trong quá trình C&B chỉnh sửa, chạy thử, thêm bớt phụ cấp.
- `LOCKED`: Đã chốt số, chuyển khoản ngân hàng. Không thể sửa.

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **PayrollPeriod** | id, monthYear, standardWorkingDays, status | PK, String, Int, Enum | 1-n Payslip | |
| **Payslip** | id, employeeId, payrollPeriodId, actualWorkingDays, baseSalary, grossSalary, insuranceDeduction, taxDeduction, netSalary | PK, FK, FK, Decimal, Decimal, Decimal, Decimal, Decimal, Decimal | n-1 Employee | Lưu "Snapshot" con số |
| **PayslipDetail**| id, payslipId, type, amount, description | PK, FK, String, Decimal, String | n-1 Payslip | Liệt kê chi tiết thu/trừ |
| **TaxBracket** | id, tier, minIncome, maxIncome, taxRate | PK, Int, Decimal, Decimal, Decimal | Khởi tạo 7 bậc cố định | |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **C&B**, tôi muốn **hệ thống tự động tính Thuế TNCN theo 7 bậc**, để **tôi không phải nhẩm tính bằng Excel rất dễ sai sót**.
- *AC1:* Nhân viên có lương 30tr. Hệ thống trừ 11tr gia cảnh. Còn 19tr thu nhập tính thuế. Tự động chia 19tr vào các bậc (5%, 10%, 15%) và ra chính xác số tiền Thuế. Ghi vào cột `taxDeduction`.

---

## 8. Phân quyền & bảo mật
- **Che dấu thông tin (Data Masking):** Bảng lương là tuyệt mật. DBA (Quản trị DB) và Developer không được quyền select raw data. HR bình thường (Recruiter) cũng không được xem lương, chỉ C&B và C-Level được xem.
- **Audit Log:** Mọi hành động Sửa tay cột Lương Thực Nhận (Net Salary) trong chế độ DRAFT phải bị ghi Log "AI đã can thiệp vào số tiền".

---

## 9. Tích hợp & phụ thuộc
- Phụ thuộc 100% vào data của: Module Tổ chức (Lương), Chấm công (Working Days), Phép/OT.

---

## 10. Yêu cầu phi chức năng
- Báo cáo File Excel: Cho phép Export toàn bộ bảng lương tổng ra file `.xlsx` theo chuẩn form Ngân hàng để C&B import vào app ngân hàng chuyển khoản.

---

## 11. Edge cases & rủi ro
1. *Nghỉ việc giữa tháng:* Ngày công chỉ có 10 ngày. Tính lương Prorated (Theo tỷ lệ).
2. *Lương thực nhận bị Âm:* Do nghỉ không lương quá nhiều nhưng lại trừ tiền phạt/bảo hiểm. **Xử lý:** Lương Net tối thiểu = 0. Phần nợ treo sang kỳ lương tháng sau.

---

## 12. Câu hỏi cần làm rõ
- Hệ thống có hỗ trợ quản lý Giảm trừ gia cảnh người phụ thuộc (4.4tr/người) không? *(Đề xuất: Thêm bảng `Dependant` bên Core HR để nhập số lượng người phụ thuộc).*
