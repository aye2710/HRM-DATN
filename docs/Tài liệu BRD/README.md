# BỘ TÀI LIỆU YÊU CẦU NGHIỆP VỤ HỆ THỐNG HRM (BRD SUITE)
## TỔNG QUAN DANH MỤC TÀI LIỆU NGHIỆP VỤ PHÂN HỆ

---

### THÔNG TIN TỔNG QUAN
* **Tên dự án:** Hệ thống Quản trị Nguồn nhân lực Doanh nghiệp (Enterprise Human Resource Management System - HRM)
* **Phiên bản chuẩn hóa:** 1.0 (Bản hoàn thiện theo chuẩn vận hành thực tế & Pháp chế Việt Nam)
* **Ngày cập nhật:** 27/10/2026
* **Cơ quan thẩm định:** Ban Dự án Chuyển đổi số & Khối Nhân sự - Tài chính

---

### MỤC LỤC & ĐƯỜNG DẪN BỘ TÀI LIỆU BRD

Dưới đây là danh mục toàn bộ 10 tài liệu BRD tương ứng với 10 phân hệ chuyên sâu của hệ thống HRM:

| STT | Mã Tài liệu | Tên Phân hệ Nghiệp vụ | Nội dung Trọng tâm & Điểm nhấn Pháp lý | Đường dẫn Tài liệu |
| :---: | :--- | :--- | :--- | :---: |
| 00 | `BRD-HRM-MOD-00` | **Tổng quan Kiến trúc Hệ thống HRM** | Bức tranh tổng thể 10 phân hệ, kiến trúc công nghệ, luồng dữ liệu E2E và tiêu chuẩn an ninh thông tin. | [Xem tài liệu](./00_BRD_Tong_Quan_Kien_Truc_HRM.md) |
| 01 | `BRD-HRM-MOD-01` | **Cơ cấu Tổ chức & Định biên Nhân sự** | Mô hình cây tổ chức đa cấp, ma trận chức danh, quản lý định biên (Headcount Quota) và chống xóa vòng lặp. | [Xem tài liệu](./01_BRD_Co_Cau_To_Chuc.md) |
| 02 | `BRD-HRM-MOD-02` | **Tuyển dụng Nhân tài (ATS)** | Phễu tuyển dụng Kanban 6 giai đoạn, quản lý ứng viên, chấm điểm phỏng vấn và phê duyệt Offer Letter. | [Xem tài liệu](./02_BRD_Tuyen_Dung.md) |
| 03 | `BRD-HRM-MOD-03` | **Hội nhập Nhân viên Mới (Onboarding)** | Lộ trình 30-60-90 ngày, phân công Buddy/Mentor, kiểm soát nộp hồ sơ gốc cứng trong 7 ngày. | [Xem tài liệu](./03_BRD_Hoi_Nhap_Onboarding.md) |
| 04 | `BRD-HRM-MOD-04` | **Hồ sơ Nhân sự & Hợp đồng Lao động** | Vòng đời nhân sự, mã nhân viên tự động, hợp đồng theo Điều 20 BLLĐ 2019, cảnh báo hết hạn HĐLĐ 30-15-7 ngày. | [Xem tài liệu](./04_BRD_Ho_So_Nhan_Su_Hop_Dong.md) |
| 05 | `BRD-HRM-MOD-05` | **Quản lý & Bàn giao Tài sản (BM-01 & BM-02)** | Cấp phát thiết bị BM-01 khi onboard, thu hồi BM-02, xử lý bồi thường tài sản hư hỏng khấu trừ vào lương. | [Xem tài liệu](./05_BRD_Quan_Ly_Ban_Giao_Tai_San.md) |
| 06 | `BRD-HRM-MOD-06` | **Thôi việc & Bàn giao** | Quy trình thôi việc 5 bước, checklist 4 khối, Hard Lock 100% tài sản, quyết toán phép tồn Điều 48 BLLĐ và khóa tài khoản an ninh. | [Xem tài liệu](./06_BRD_Thoi_Viec_Va_Ban_Giao.md) |
| 07 | `BRD-HRM-MOD-07` | **Ca kíp, Chấm công & Nghỉ phép** | Check-in ân hạn 15 phút, tính ngày công tự động, tính ngày phép loại trừ T7/CN/Lễ, quy định OT Điều 98 BLLĐ. | [Xem tài liệu](./07_BRD_Cham_Cong_Nghi_Phep.md) |
| 08 | `BRD-HRM-MOD-08` | **Đánh giá Hiệu suất KPI & Tiền lương** | Động cơ tính lương tự động, biểu thuế TNCN 7 bậc, trần bảo hiểm 46.8M, khóa chi trả do chậm nộp hồ sơ và bất biến khi Locked. | [Xem tài liệu](./08_BRD_KPI_Va_Tien_Luong.md) |
| 09 | `BRD-HRM-MOD-09` | **Báo cáo Phân tích & Quản trị Hệ thống** | Dashboard HR Analytics, kiểm soát định biên phòng ban, tham số động (SystemSetting), RBAC 8 vai trò và Audit Log. | [Xem tài liệu](./09_BRD_Bao_Cao_Va_He_Thong.md) |

---

### CẤU TRÚC CHUẨN MỰC 8 MỤC TRONG MỖI TÀI LIỆU BRD
Mỗi tài liệu BRD độc lập trong bộ tài liệu trên đều tuân thủ nghiêm ngặt khung cấu trúc 8 phần chuyên sâu:
1. **Bảng Giải thích Từ viết tắt & Thuật ngữ Nghiệp vụ:** Định nghĩa rõ ràng cho cả nhân sự nghiệp vụ và đội ngũ phát triển kỹ thuật.
2. **Tóm tắt Điều hành 3 Chiều (Executive Summary):** Phân tích dưới 3 lăng kính: Vận hành Quản trị, Tuân thủ Pháp chế và Trải nghiệm An ninh.
3. **Mục tiêu Kinh doanh & Đo lường Thành công:** Các chỉ số đo lường hiệu quả (KPI) định lượng rõ ràng.
4. **Phân tích Hiện trạng Vận hành (As-Is vs To-Be):** Đối chiếu chi tiết sự khác biệt giữa quy trình thủ công và hệ thống HRM số hóa.
5. **Phạm vi Triển khai & Bản đồ Tích hợp Phân hệ:** Sơ đồ luồng công việc E2E và mối quan hệ liên phân hệ.
6. **Danh mục Yêu cầu Chức năng & Quy tắc Nghiệp vụ Chi tiết:** Các quy tắc kinh doanh cụ thể (Business Rules: `BR-*`), công thức toán học và logic xử lý nghiệp vụ.
7. **Giả định, Ràng buộc Nghiệp vụ & Kế hoạch Quản trị Rủi ro:** Ma trận rủi ro và các giải pháp chốt chặn kỹ thuật tương ứng.
8. **Ma trận Phân quyền RBAC & Thiết kế Giao diện Vận hành:** Bảng ma trận phân quyền theo từng vai trò và đặc tả giao diện người dùng UI/UX.
