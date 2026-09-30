# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE QUẢN LÝ NHÂN SỰ (CORE HR)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Trái tim của hệ thống HRM. Nơi lưu trữ Single Source of Truth (Nguồn dữ liệu thật duy nhất) về toàn bộ hồ sơ nhân viên, hợp đồng và quá trình hội nhập.
- **Giá trị mang lại:** Xóa bỏ hồ sơ giấy, tự động hóa nhắc nhở hết hạn hợp đồng, chuyên nghiệp hóa ngày đi làm đầu tiên của nhân viên.
- **Phạm vi (In-scope):** Quản lý Hồ sơ Nhân sự (Employee Profile), Quản lý Hợp đồng lao động (Contracts), Quy trình Onboarding Tasks.
- **Phạm vi (Out-of-scope):** Chấm công và Tính lương.
- **Các bên liên quan (Stakeholders):** C&B (Chuyên viên Lương thưởng), HR Admin, Nhân viên (Employee).

---

## 2. Cấu trúc dữ liệu chính
Module này bao gồm 3 thực thể (Entities) cốt lõi:
1. **Employee (Nhân viên):** Hồ sơ thông tin cá nhân, phòng ban trực thuộc, vị trí công tác.
2. **Contract (Hợp đồng):** Lưu trữ các loại hợp đồng (Thử việc, Chính thức), mức lương cơ bản và thời hạn.
3. **OnboardingTask (Nhiệm vụ hội nhập):** Các công việc cần chuẩn bị cho người mới (Cấp máy tính, tạo email).

---

## 3. Danh sách Chức năng con
Module được chia thành 3 chức năng chi tiết, mỗi chức năng sẽ có tài liệu đặc tả và sơ đồ luồng riêng:
1. **Chức năng Quản lý Hồ sơ nhân sự (HR-01)**
2. **Chức năng Quản lý Hợp đồng lao động (HR-02)**
3. **Chức năng Quản lý Quy trình Hội nhập - Onboarding (HR-03)**
