# BẢN ĐỀ XUẤT ĐỀ TÀI ĐỒ ÁN TỐT NGHIỆP (ĐATN)

**Kính gửi:** Giảng viên hướng dẫn

Dưới đây là nội dung khái quát về đề tài Đồ án tốt nghiệp em dự định thực hiện để Thầy/Cô xem xét và đánh giá khối lượng công việc. Nội dung này được soạn thảo bám sát theo cấu trúc Mẫu ĐATN-01 của nhà trường.

---

## 1. Thông tin chung
- **Tên đề tài:** Nghiên cứu và xây dựng hệ thống Quản trị nguồn nhân lực (HRM) chuyên sâu cho doanh nghiệp.
- **Lĩnh vực/Ngành:** Công nghệ phần mềm / Hệ thống thông tin.
- **Hình thức thực hiện:** Cá nhân (hoặc Nhóm - *bạn tự điền nếu làm nhóm*).

## 2. Bối cảnh và Lý do chọn đề tài
Trong bối cảnh chuyển đổi số, quản trị nguồn nhân lực đang là một trong những bài toán sống còn của mọi doanh nghiệp. Tuy nhiên, hiện nay nhiều công ty vẫn đang sử dụng các công cụ rời rạc như Excel, Google Sheets, Email hoặc các phần mềm độc lập để quản lý nhân sự. Điều này dẫn đến các vấn đề:
- **Dữ liệu phân tán:** Thông tin nhân viên được lưu trữ ở nhiều file hoặc hệ thống khác nhau, gây khó khăn trong việc tra cứu, cập nhật và đồng bộ.
- **Quy trình thủ công:** Các hoạt động như chấm công, xét duyệt nghỉ phép, theo dõi quỹ phép năm tốn rất nhiều thời gian của bộ phận hành chính nhân sự và dễ xảy ra sai sót.
- **Tính lương phức tạp:** Bài toán tính lương (Payroll) bị phụ thuộc nhiều vào các loại phụ cấp, làm thêm giờ (OT), thuế TNCN lũy tiến và bảo hiểm xã hội. Làm thủ công thường mất nhiều ngày để chốt lương mỗi tháng.
- **Đánh giá hiệu suất thiếu minh bạch:** Mục tiêu (KPI) được giao rời rạc, khó theo dõi và đo lường.

Do đó, việc xây dựng một hệ thống Quản trị nguồn nhân lực (HRM) toàn diện và chuyên sâu là vô cùng cần thiết nhằm tập trung hóa dữ liệu, chuẩn hóa quy trình nghiệp vụ (từ tuyển dụng đến nghỉ việc), và tự động hóa các nghiệp vụ phức tạp như chấm công, tính lương.

## 3. Mục tiêu và Yêu cầu của ĐATN
**Mục tiêu của đề tài:**
- Quản lý tập trung dữ liệu hồ sơ nhân sự của doanh nghiệp.
- Tự động hóa quy trình quản lý vòng đời nhân viên (Tuyển dụng -> Tiếp nhận -> Thử việc -> Chính thức -> Nghỉ việc).
- Tự động hóa quy trình chấm công và quản lý đơn từ nghỉ phép.
- Hỗ trợ đánh giá KPI và hiệu suất làm việc.
- Số hóa và tự động hóa toàn bộ quy trình tính lương (bao gồm OT, phụ cấp, BHXH và thuế TNCN).
- Cung cấp hệ thống báo cáo nhân sự theo thời gian thực cho Ban giám đốc.

**Yêu cầu kỹ thuật:** Hệ thống áp dụng kiến trúc chuẩn (3-Layer hoặc Clean Architecture), cơ sở dữ liệu có tính toàn vẹn cao (Audit Log), có khả năng chịu tải cơ bản và phân quyền bảo mật tốt.

## 4. Phạm vi, nội dung công việc và khối lượng (Nhiệm vụ ĐATN)
Hệ thống bao gồm **3 Cổng (Portals)**: Candidate Portal (cho ứng viên), Employee Portal (cho nhân viên tự phục vụ) và Admin/HR Portal (dành cho Ban giám đốc, HR, Manager).

Khối lượng công việc dự kiến bao gồm việc phân tích, thiết kế và lập trình các module sau:
1. **Module Quản trị tổ chức & Phân quyền (RBAC):** Quản lý sơ đồ tổ chức (Department -> Position). Phân quyền dựa trên Role (Manager, HR, Employee).
2. **Module Tuyển dụng (Recruitment):** Quản lý quy trình từ đăng tin, ứng viên nộp CV, xếp lịch phỏng vấn đến gửi Offer Letter.
3. **Module Quản lý nhân sự (Core HR):** Quản lý hồ sơ cá nhân và vòng đời công tác (Onboarding -> Thử việc -> Điều chuyển phòng ban -> Gia hạn hợp đồng -> Nghỉ việc).
4. **Module Chấm công & Nghỉ phép:** Ghi nhận Check-in/Check-out, duyệt đơn OT, đi muộn về sớm, quản lý quỹ phép năm linh hoạt.
5. **Module Đánh giá KPI:** Manager giao mục tiêu, nhân viên cập nhật tiến độ, Manager chấm điểm cuối kỳ.
6. **Module Payroll, Thuế & BHXH:** Động cơ tính lương (Payroll Engine) có khả năng tự động tính Gross sang Net, xử lý thuế TNCN (Lũy tiến hoặc khấu trừ 10%), tự động tính tỷ lệ BHXH (32%), quyết toán phép năm khi nghỉ việc.

## 5. Dữ liệu đầu vào, tiêu chuẩn và công nghệ sử dụng
- **Dữ liệu đầu vào:** Luật Lao động, Luật Thuế TNCN và Luật BHXH hiện hành của Việt Nam để xây dựng công thức tính lương.
- **Công nghệ (Dự kiến):**
  - **Frontend:** ReactJS (kết hợp thư viện UI như Ant Design/Material-UI).
  - **Backend:** Node.js (sử dụng framework Express/NestJS kết hợp TypeScript) hoặc Java (Spring Boot).
  - **Database:** PostgreSQL hoặc MySQL.
- **Kiến trúc & Bảo mật:** 
  - Tổng thể: Mô hình Client-Server giao tiếp qua RESTful API.
  - Kiến trúc Backend: Kiến trúc 3 lớp (Controller - Service - Repository).
  - Bảo mật: Xác thực bằng JWT (JSON Web Token) và Phân quyền RBAC.

## 6. Kế hoạch / Mốc tiến độ dự kiến (Theo chuẩn ĐHXDHN)
| STT | Kế hoạch thực hiện | Thời gian dự kiến | Đầu ra (Deliverables) |
|---|---|---|---|
| 1 | **Giai đoạn Khởi tạo:** Chốt đề tài, khảo sát nghiệp vụ và viết tài liệu đặc tả (BRD, SRS). | Tuần 1 - Tuần 2 | Tài liệu BRD, SRS, Use Case. (Chuẩn bị Mốc M1) |
| 2 | **Giai đoạn Thiết kế:** Thiết kế Database (ERD, Schema), thiết kế System Architecture và Mockup UI/UX. | Tuần 3 - Tuần 4 | Database Schema, Wireframes, Tài liệu thiết kế hệ thống. |
| 3 | **Giai đoạn Lập trình (Phần 1):** Xây dựng Core HR, RBAC, Tổ chức và Cổng Employee Portal. | Tuần 5 - Tuần 8 | Bản demo chức năng (Chuẩn bị Mốc M2). |
| 4 | **Giai đoạn Lập trình (Phần 2):** Hoàn thiện các luồng tính toán phức tạp (Chấm công, Lương, Tuyển dụng). | Tuần 9 - Tuần 12 | Toàn bộ Source code Backend & Frontend. |
| 5 | **Giai đoạn Kiểm thử & Báo cáo:** Chạy test, sửa lỗi và hoàn thiện cuốn Thuyết minh ĐATN. | Tuần 13 - Tuần 14 | Thuyết minh ĐATN (PDF), Source code. |
| 6 | **Bảo vệ ĐATN:** Nộp hồ sơ và bảo vệ trước Hội đồng. | Tuần 15 | Hoàn thành Mốc M3. |

---
**Nhận xét về khối lượng:**
Với hệ thống tính lương và chấm công chuyên sâu, cùng việc quản lý trọn vẹn vòng đời nhân sự, khối lượng của ĐATN này là **ĐẦY ĐẶN** để làm Đồ án tốt nghiệp hệ Kỹ sư/Cử nhân. Đề tài nặng về Logic Nghiệp vụ (Domain Knowledge) và xử lý dữ liệu chuẩn xác, chắc chắn sẽ được Hội đồng đánh giá cao về tính thực tiễn.
