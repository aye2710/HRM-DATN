# HỆ THỐNG TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ HRM TOÀN DIỆN (ENTERPRISE HRM BA SPECIFICATIONS)

> **Dự án Đồ Án Tốt Nghiệp**: Hệ Thống Quản Trị Nguồn Nhân Lực Doanh Nghiệp (Enterprise HRM SaaS)  
> **Bộ tài liệu**: Phân tích Nghiệp vụ Chi tiết 10 Phân Hệ Chức Năng (10 Core Business Modules)  
> **Tiêu chuẩn thiết kế**: ERP/HRM SaaS tương đương Base.vn, 1Office, SAP SuccessFactors, tuân thủ Bộ luật Lao động 2019 (BLLĐ 2019).

---

## 1. Bản đồ Tổng quan Cơ cấu Nghiệp vụ (Master Business Architecture)

Toàn bộ hệ thống được phân rã thành **10 phân hệ nghiệp vụ độc lập nhưng liên kết chặt chẽ** qua cơ chế dữ liệu dùng chung (Master Data), định danh bảo mật 3 cổng (Admin - Employee ESS - Candidate Portal), và các chuỗi xử lý giao dịch nguyên tử ($transaction):

```mermaid
flowchart TD
    classDef foundation fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef core fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef ops fill:#059669,stroke:#34d399,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef finance fill:#d97706,stroke:#fbbf24,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef security fill:#dc2626,stroke:#f87171,stroke-width:2px,color:#ffffff,font-weight:bold;

    subgraph NỀN TẢNG TỔ CHỨC & BẢO MẬT
        M01(["1. Module Tổ chức\n(Org Chart & Positions)"]):::foundation
        M02(["2. Hệ thống Phân quyền\n(RBAC & Audit Log)"]):::security
    end

    subgraph THU HÚT & QUẢN TRỊ NHÂN LỰC
        M03(["3. Cổng Tuyển dụng Ứng viên\n(Career Portal & Pre-Onboard)"]):::core
        M04(["4. Tuyển dụng Nội bộ\n(Requisitions & ATS Kanban)"]):::core
        M05(["5. Core HR & Hợp đồng\n(Employee Lifecycle & Contracts)"]):::core
    end

    subgraph VẬN HÀNH & ĐÃI NGỘ HÀNG NGÀY
        M06(["6. Chấm công Doanh nghiệp\n(Shifts, Sweep, Adjustments)"]):::ops
        M07(["7. Nghỉ phép & Làm thêm giờ\n(Leaves Quota & Overtime)"]):::ops
        M08(["8. Cổng Nhân viên ESS\n(Employee Self-Service)"]):::ops
    end

    subgraph HIỆU SUẤT & TÀI CHÍNH
        M09(["9. Đánh giá Hiệu suất KPI\n(Force Ranking 20-60-20)"]):::finance
        M10(["10. Tiền lương & Thuế/Bảo hiểm\n(Gross-to-Net & Payslips)"]):::finance
    end

    M01 -->|Master Data Phòng/Vị trí| M04
    M01 -->|Định biên & Khung lương| M05
    M03 -->|Hồ sơ trúng tuyển| M04
    M04 -->|Auto-provisioning| M05
    M05 -->|Danh sách nhân sự| M06
    M05 -->|Hạn mức phép năm| M07
    M05 -->|Tài khoản ESS| M08
    M06 -->|Công thực tế & Ngày lễ| M10
    M07 -->|Nghỉ hưởng lương & OT| M10
    M09 -->|Hệ số KPI & Xếp loại| M10
    M02 -.->|Kiểm soát truy cập & Ghi vết| M01
    M02 -.->|Bảo vệ API & Anti-IDOR| M10
```

---

## 2. Danh mục 10 Phân Hệ Nghiệp vụ & Tài liệu Đặc tả (Master Module Index)

Dưới đây là bảng tra cứu đầy đủ 10 phân hệ nghiệp vụ, kèm đường dẫn truy cập trực tiếp đến tài liệu tổng quan và các hồ sơ đặc tả chức năng con chi tiết:

| STT | Phân hệ (Module) | Thư mục Lưu trữ | Tài liệu Tổng quan | Số lượng Chức năng Con | Danh mục Đặc tả Chi tiết |
|:---:|---|---|---|:---:|---|
| **01** | **Cơ cấu Tổ chức & Sơ đồ Cây**<br/>*(Organization Management)* | `Module Tổ chức` | [Module Tổ chức.md](./Module%20Tổ%20chức/Module%20Tổ%20chức.md) | 15 Use Cases | - [Quản lý Danh mục Phòng ban](./Module%20Tổ%20chức/Chuc-nang-Quan-ly-Phong-ban.md)<br/>- [Quản lý Vị trí Công tác & Dải lương](./Module%20Tổ%20chức/Chuc-nang-Quan-ly-Vi-tri.md)<br/>- [Trực quan hóa Sơ đồ Cây Tổ chức](./Module%20Tổ%20chức/Chuc-nang-Xem-So-do-To-chuc.md) |
| **02** | **Bảo mật, Phân quyền & Kiểm toán**<br/>*(Security, RBAC & Audit)* | `Module Hệ thống Phân quyền` | [Module Hệ thống Phân quyền.md](./Module%20Hệ%20thống%20Phân%20quyền/Module%20Hệ%20thống%20Phân%20quyền.md) | 11 Use Cases | - [Phân quyền Động RBAC](./Module%20Hệ%20thống%20Phân%20quyền/Chuc-nang-Phan-Quyen-RBAC.md)<br/>- [Nhật ký Hệ thống & Audit Log](./Module%20Hệ%20thống%20Phân%20quyền/Chuc-nang-Audit-Log.md) |
| **03** | **Cổng Tuyển dụng Ứng viên**<br/>*(Candidate Career Portal)* | `Module Cổng Tuyển dụng Ứng viên` | [Module Cổng Tuyển dụng Ứng viên.md](./Module%20Cổng%20Tuyển%20dụng%20Ứng%20viên/Module%20Cổng%20Tuyển%20dụng%20Ứng%20viên.md) | 10 Use Cases | - [Trang chủ Tuyển dụng & Thương hiệu](./Module%20Cổng%20Tuyển%20dụng%20Ứng%20viên/Chuc-nang-Trang-chu-Tuyen-dung.md)<br/>- [Nộp Hồ sơ, Theo dõi & Pre-Onboarding](./Module%20Cổng%20Tuyển%20dụng%20Ứng%20viên/Chuc-nang-Nop-Ho-so-Va-Theo-doi.md) |
| **04** | **Quản trị Tuyển dụng Nội bộ & ATS**<br/>*(Recruitment & ATS Kanban)* | `Module Tuyển dụng` | [Module Tuyển dụng.md](./Module%20Tuyển%20dụng/Module%20Tuyển%20dụng.md) | 20 Use Cases | - [Yêu cầu Tuyển dụng & Đăng tin](./Module%20Tuyển%20dụng/Chuc-nang-Yeu-cau-Tuyen-dung.md)<br/>- [Quản lý Phễu ATS Kanban](./Module%20Tuyển%20dụng/Chuc-nang-Quan-ly-ATS.md)<br/>- [Lịch Phỏng vấn & Chấm điểm](./Module%20Tuyển%20dụng/Chuc-nang-Phong-van.md)<br/>- [Quản lý Offer & Tiếp nhận](./Module%20Tuyển%20dụng/Chuc-nang-Quan-ly-Offer.md) |
| **05** | **Hồ sơ Nhân sự & Hợp đồng (Core HR)**<br/>*(Employee Lifecycle & Contracts)* | `Module Core HR` | [Module Core HR.md](./Module%20Core%20HR/Module%20Core%20HR.md) | 18 Use Cases | - [Quản lý Hồ sơ Nhân sự 360°](./Module%20Core%20HR/Chuc-nang-Ho-so-Nhan-su.md)<br/>- [Hợp đồng Lao động & Cảnh báo](./Module%20Core%20HR/Chuc-nang-Hop-dong.md)<br/>- [Quy trình Hội nhập Onboarding](./Module%20Core%20HR/Chuc-nang-Onboarding.md) |
| **06** | **Quản lý Chấm công Doanh nghiệp**<br/>*(Time & Attendance)* | `Module Chấm công` | [Module Chấm công.md](./Module%20Chấm%20công/Module%20Chấm%20công.md) | 14 Use Cases | - [Điểm danh Vào/Ra & Tính ngày công](./Module%20Chấm%20công/Chuc-nang-Checkin-Checkout.md)<br/>- [Quản lý Ca làm việc & Ngày lễ BLLĐ](./Module%20Chấm%20công/Chuc-nang-Quan-ly-Ca-lam.md)<br/>- [Điều chỉnh Chấm công & Giải trình](./Module%20Chấm%20công/Chuc-nang-Dieu-chinh-Cham-cong.md) |
| **07** | **Quản lý Nghỉ phép & Làm thêm giờ**<br/>*(Leave & Overtime Management)* | `Module Nghỉ phép và OT` | [Module Nghỉ phép & OT.md](./Module%20Nghỉ%20phép%20và%20OT/Module%20Nghỉ%20phép%20&%20OT.md) | 12 Use Cases | - [Nghỉ phép & Quỹ phép năm BLLĐ](./Module%20Nghỉ%20phép%20và%20OT/Chuc-nang-Nghi-Phep.md)<br/>- [Đăng ký & Phê duyệt OT hệ số](./Module%20Nghỉ%20phép%20và%20OT/Chuc-nang-OT.md) |
| **08** | **Cổng Dịch vụ Nhân viên Tự phục vụ**<br/>*(Employee Self-Service - ESS)* | `Module Cổng Nhân viên ESS` | [Module Cổng Nhân viên ESS.md](./Module%20Cổng%20Nhân%20viên%20ESS/Module%20Cổng%20Nhân%20viên%20ESS.md) | 14 Use Cases | - [Dashboard & Điểm danh Online](./Module%20Cổng%20Nhân%20viên%20ESS/Chuc-nang-Dashboard-Diem-danh.md)<br/>- [Hồ sơ & Hợp đồng Cá nhân](./Module%20Cổng%20Nhân%20viên%20ESS/Chuc-nang-Ho-so-Ca-nhan.md)<br/>- [Quản lý Nghỉ phép Cá nhân](./Module%20Cổng%20Nhân%20viên%20ESS/Chuc-nang-Nghi-phep-Ca-nhan.md)<br/>- [Tra cứu Phiếu lương Bảo mật](./Module%20Cổng%20Nhân%20viên%20ESS/Chuc-nang-Tra-cuu-Phieu-luong.md)<br/>- [Mục tiêu & Đánh giá KPI Cá nhân](./Module%20Cổng%20Nhân%20viên%20ESS/Chuc-nang-Muc-tieu-KPI.md) |
| **09** | **Đánh giá Hiệu suất & Xếp loại KPI**<br/>*(Performance & Force Ranking)* | `Module Đánh giá KPI` | [Module Đánh giá KPI.md](./Module%20Đánh%20giá%20KPI/Module%20Đánh%20giá%20KPI.md) | 12 Use Cases | - [Chu kỳ Đánh giá & Gán Mục tiêu](./Module%20Đánh%20giá%20KPI/Chuc-nang-Chu-ky-Danh-gia.md)<br/>- [Chấm điểm & Phân bổ Force Ranking](./Module%20Đánh%20giá%20KPI/Chuc-nang-Cham-diem.md) |
| **10** | **Quản lý Tiền lương, Thuế & Bảo hiểm**<br/>*(Payroll, Tax & Insurance)* | `Module Tiền lương` | [Module Tiền lương.md](./Module%20Tiền%20lương/Module%20Tiền%20lương.md) | 12 Use Cases | - [Chạy Bảng lương Gross-to-Net & Khóa kỳ](./Module%20Tiền%20lương/Chuc-nang-Tinh-Luong.md)<br/>- [Phiếu lương Điện tử & Quyết toán](./Module%20Tiền%20lương/Chuc-nang-Phieu-Luong.md) |

---

## 3. Khung Quy chuẩn Tuân thủ Pháp luật & Kỹ thuật (Compliance & Standards)

Toàn bộ các tài liệu phân tích nghiệp vụ trong bộ hồ sơ này được xây dựng bám sát 4 nguyên tắc kỹ thuật cốt lõi:

1. **Tuân thủ Tuyệt đối Bộ luật Lao động 2019 (BLLĐ 2019)**:
   - **Điều 112**: Nghỉ lễ, tết nguyên lương (tự động ghi nhận 1.0 ngày công chuẩn khi trùng ngày Holiday).
   - **Điều 113 - 114**: Quỹ phép năm (12 ngày chuẩn + thâm niên 5 năm tăng 1 ngày, cơ chế khóa mềm số dư khi có đơn Pending).
   - **Điều 98**: Tính lương làm thêm giờ theo hệ số luật định (150% ngày thường, 200% ngày nghỉ tuần, 300% ngày lễ/tết).
   - **Quy định Thuế TNCN & Bảo hiểm**: Trừ 10.5% BHXH/YT/TN người lao động đóng, giảm trừ gia cảnh bản thân (11M) và người phụ thuộc (4.4M), áp dụng biểu thuế lũy tiến từng phần 7 bậc.

2. **Kiểm soát Bảo mật Phân quyền Phân tầng (Multi-tier RBAC & Anti-IDOR)**:
   - Ngăn chặn triệt để lỗ hổng Insecure Direct Object References (IDOR): Mọi truy vấn phiếu lương, đơn nghỉ phép cá nhân đều bắt buộc xác thực quyền sở hữu `req.user.employeeId === resource.employeeId`.
   - Cơ chế Soft-lock: Khóa sổ kỳ lương (`LOCKED`), đóng băng phòng ban/vị trí (`INACTIVE`) bảo vệ toàn vẹn lịch sử mà không làm mất mát dữ liệu.

3. **Tính Toàn vẹn Dữ liệu Qua Giao dịch Nguyên tử (Atomic Transactions)**:
   - Các nghiệp vụ liên bảng như Onboarding Ứng viên $\rightarrow$ Nhân viên & Hợp đồng, Duyệt đơn nghỉ phép $\rightarrow$ Trừ quỹ phép, Chốt công cuối ngày $\rightarrow$ Tổng hợp công tháng đều được bọc trong `prisma.$transaction`.

4. **Chuẩn hóa Định dạng Tài liệu 5 Mục (Standard 5-Section BA Structure)**:
   - Tất cả 10 tài liệu Module Tổng quan đều tuân thủ 5 mục chuẩn hóa: *Giới thiệu $\rightarrow$ Kiến trúc luồng $\rightarrow$ Ma trận phân rã $\rightarrow$ Danh mục đặc tả $\rightarrow$ Điểm nhấn nghiệp vụ*.
   - Tất cả 28 tài liệu chức năng con đều bao gồm: *Mục đích $\rightarrow$ Dữ liệu vào $\rightarrow$ Quy tắc nghiệp vụ $\rightarrow$ Bảng đặc tả 8 mục Use Case $\rightarrow$ Kịch bản kiểm thử (Test Cases)*.
