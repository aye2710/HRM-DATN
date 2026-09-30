# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE NGHỈ PHÉP & LÀM THÊM (LEAVE & OT)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Quản lý số ngày phép tồn đọng (Leave Balance) của nhân viên và quy trình phê duyệt các loại Đơn xin nghỉ, Đơn xin làm thêm giờ (OT).
- **Giá trị mang lại:** Minh bạch quỹ phép cho nhân viên, tính toán chính xác số giờ OT để làm cơ sở trả lương. Đảm bảo tuân thủ Luật Lao động về giới hạn làm thêm giờ.
- **Phạm vi (In-scope):** Quản lý Quỹ phép năm, Đơn xin nghỉ phép (Paid/Unpaid), Đơn xin làm thêm giờ (OT), Quy trình phê duyệt đa cấp.
- **Các bên liên quan (Stakeholders):** Nhân viên (Người tạo đơn), Line Manager (Người duyệt đơn), HR/C&B (Kiểm soát quỹ phép).

---

## 2. Cấu trúc dữ liệu chính
Module này bao gồm 3 thực thể (Entities) cốt lõi:
1. **LeaveBalance (Quỹ phép):** Lưu trữ tổng số ngày phép được cấp và số ngày đã sử dụng trong năm.
2. **LeaveRequest (Đơn xin nghỉ):** Thông tin đơn nghỉ phép (Từ ngày, Đến ngày, Lý do).
3. **OTRequest (Đơn làm thêm giờ):** Khai báo số giờ OT dự kiến và số giờ OT thực tế.

---

## 3. Danh sách Chức năng con
Module được chia thành 2 nhóm chức năng chính, mỗi chức năng có tài liệu đặc tả và sơ đồ luồng riêng:
1. **Chức năng Quản lý Nghỉ phép (LO-01, LO-02)**
2. **Chức năng Quản lý Làm thêm giờ - OT (LO-03)**
