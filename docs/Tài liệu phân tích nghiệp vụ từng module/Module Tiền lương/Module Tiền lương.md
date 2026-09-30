# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE TIỀN LƯƠNG (PAYROLL)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Điểm hội tụ của toàn bộ hệ thống HRM. Chuyển đổi dữ liệu Chấm công, Phép, OT thành các con số tài chính chính xác để chi trả cho nhân viên.
- **Giá trị mang lại:** Giảm thiểu sai sót tính lương, tự động tính Thuế TNCN và Bảo hiểm. Tránh các rủi ro kiện cáo.
- **Phạm vi (In-scope):** Kỳ lương (Payroll Period), Bảng tính lương Gross to Net, Khấu trừ BHXH/BHYT, Tính thuế TNCN, Phiếu lương (Payslip).
- **Các bên liên quan (Stakeholders):** C&B (Người chạy lương), Giám đốc (Duyệt bảng lương), Nhân viên (Nhận phiếu lương).

---

## 2. Cấu trúc dữ liệu chính
1. **PayrollPeriod (Kỳ lương):** Lưu trữ thông tin tháng/năm và số ngày công chuẩn của tháng đó.
2. **Payslip (Phiếu lương):** Lưu con số chốt cuối cùng (Gross Salary, Tiền thuế, Tiền bảo hiểm, Net Salary) của từng nhân viên.
3. **TaxBracket (Bậc thuế):** Cấu hình biểu thuế lũy tiến 7 bậc theo luật định.

---

## 3. Danh sách Chức năng con
1. **Chức năng Chạy Lương Gross to Net (PR-01, PR-02, PR-03)**
2. **Chức năng Chốt Phiếu Lương (Payslip) (PR-04, PR-05)**
