# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE CHẤM CÔNG (TIME & ATTENDANCE)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Ghi nhận giờ làm việc thực tế của nhân viên. Tự động đối soát giờ Check-in/out với Ca làm việc (Shift) để tính toán Ngày công chuẩn (Working Days).
- **Giá trị mang lại:** Loại bỏ sai sót khi chấm công thủ công (bằng Excel). Giảm thiểu phàn nàn của nhân viên về số ngày công cuối tháng.
- **Phạm vi (In-scope):** Quản lý Ca làm việc (Shifts), Khai báo Ngày nghỉ Lễ (Holidays), Quản lý dữ liệu Ra/Vào (Check-in/Check-out).
- **Các bên liên quan (Stakeholders):** Nhân viên (Thực hiện chấm công), Quản lý (Duyệt/Xác nhận công lỗi), HR/C&B (Tổng hợp công cuối tháng).

---

## 2. Cấu trúc dữ liệu chính
Module này bao gồm 3 thực thể (Entities) cốt lõi:
1. **Shift (Ca làm việc):** Khung giờ chuẩn (Ví dụ: Hành chính 08:00 - 17:30).
2. **Holiday (Ngày lễ):** Cấu hình các ngày nghỉ quốc gia để tính nguyên công.
3. **Attendance (Bảng chấm công):** Lưu trữ lịch sử quét vân tay/bấm nút check-in hàng ngày của nhân viên.

---

## 3. Danh sách Chức năng con
Module được chia thành 2 chức năng lớn, mỗi chức năng sẽ có tài liệu đặc tả và sơ đồ luồng riêng:
1. **Chức năng Quản lý Ca làm việc và Ngày lễ (TA-01, TA-04)**
2. **Chức năng Check-in/Check-out và Chốt công (TA-02, TA-03)**
