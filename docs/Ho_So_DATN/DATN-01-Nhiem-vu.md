# Mẫu ĐATN-01: NHIỆM VỤ ĐỒ ÁN TỐT NGHIỆP

**TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI**  
**KHOA: CÔNG NGHỆ THÔNG TIN**  
**BỘ MÔN: CÔNG NGHỆ PHẦN MỀM**  

---

- **Họ và tên sinh viên**: Lê Hoàng Trúc  
- **Mã SV**: 661234  
- **Lớp**: 66PM1  
- **Khóa**: 66 (2021 - 2026)  
- **Ngành/Chuyên ngành**: Công nghệ Thông tin / Kỹ thuật Phần mềm  
- **Hệ đào tạo**: Đại học chính quy  
- **Tên đề tài ĐATN**: Phân tích, thiết kế và xây dựng Hệ thống Quản trị Nguồn nhân lực (HRM)  
- **Khoa**: Công nghệ Thông tin  
- **Nhóm chuyên môn**: Công nghệ Phần mềm  
- **GV hướng dẫn**: TS. Nguyễn Văn A  
- **Thời gian thực hiện**: 15/08/2026 - 30/11/2026 (15 tuần)  
- **Đợt ĐATN**: 2026-1  

---

### 1. Mục tiêu và yêu cầu của ĐATN:
- **Mục tiêu**: Phân tích, thiết kế và xây dựng thành công Hệ thống Quản trị Nguồn nhân lực (HRM) hoàn chỉnh, giúp doanh nghiệp số hóa quy trình quản lý nhân sự. Hệ thống đáp ứng các nghiệp vụ cốt lõi: Quản lý cơ cấu tổ chức (phòng ban, vị trí công tác, sơ đồ cây phân cấp), Quản lý hồ sơ nhân viên, và Chấm công - ca làm việc.
- **Yêu cầu**: 
  - Đảm bảo tính toàn vẹn và đúng đắn của các quy tắc nghiệp vụ (Business Rules), đặc biệt là logic quan hệ đệ quy (phòng ban cha - con), tránh tạo vòng lặp trong cây tổ chức.
  - Xây dựng Backend chuẩn RESTful API bằng Node.js (TypeScript) kết hợp ORM Prisma và cơ sở dữ liệu quan hệ.
  - Giao diện người dùng (Frontend) trực quan, hiện đại, hỗ trợ hiển thị biểu đồ cây tổ chức và tương tác mượt mà.
  - Đầy đủ tài liệu phân tích nghiệp vụ (SRS, Use case, Sequence diagram bóc tách luồng Thêm/Sửa/Xóa và mã lỗi) theo chuẩn kỹ nghệ phần mềm.

### 2. Phạm vi, nội dung công việc và sản phẩm cần nộp:
- **Phạm vi, nội dung công việc**: 
  - Khảo sát bài toán quản trị nhân sự thực tế tại doanh nghiệp vừa và nhỏ.
  - Đặc tả yêu cầu phần mềm chi tiết cho Module Tổ chức (Organization) và Module Chấm công (Time & Attendance).
  - Thiết kế kiến trúc phần mềm, mô hình cơ sở dữ liệu quan hệ (ERD, Prisma Schema).
  - Lập trình và kiểm thử Backend API (Node.js/Express/TypeScript).
  - Xây dựng giao diện Frontend (React/TypeScript/Tailwind CSS).
  - Tích hợp, kiểm thử chức năng và đóng gói triển khai.
- **Sản phẩm cần nộp**: 
  - 01 Quyển báo cáo thuyết minh ĐATN (theo Mẫu ĐATN-14, file PDF và bản in đóng bìa cứng).
  - Bộ mã nguồn toàn diện (Source code Backend & Frontend) đính kèm tập lệnh khởi chạy Docker/Prisma migrations.
  - Bộ tài liệu đặc tả nghiệp vụ phần mềm (SRS Markdown) đầy đủ sơ đồ tuần tự (Sequence Diagram).
  - Slide báo cáo thuyết trình bảo vệ trước Hội đồng.

### 3. Dữ liệu đầu vào, giả thiết, phần mềm/công cụ sử dụng:
- **Phần mềm/Công cụ**: Visual Studio Code, Node.js v20+, TypeScript, Prisma ORM, PostgreSQL, React, Mermaid CLI, Postman.
- **Dữ liệu đầu vào**: Quy chế tổ chức doanh nghiệp, cơ cấu phòng ban mẫu, quy định ca kíp và bảng chấm công thực tế.

### 4. Kế hoạch/mốc tiến độ dự kiến:
| STT | Kế hoạch (Khối lượng/sản phẩm dự kiến) | Thời gian (Mốc) | Ghi chú |
|---|---|---|---|
| 1 | Khảo sát bài toán, hoàn thiện đặc tả BA Module Tổ chức (Phòng ban, Vị trí, Sơ đồ cây) | Tuần 1 - Tuần 3 (15/08 - 05/09/2026) | Hoàn thành SRS Module 1 |
| 2 | Thiết kế CSDL (Prisma schema), đặc tả Module Chấm công và chuẩn bị đánh giá M1 | Tuần 4 - Tuần 5 (06/09 - 19/09/2026) | **Đánh giá Mốc M1 (15/09/2026)** |
| 3 | Lập trình Backend API cho Module Tổ chức, xử lý Unique Constraint và quan hệ đệ quy | Tuần 6 - Tuần 8 (20/09 - 10/10/2026) | Backend RESTful API |
| 4 | Lập trình API Chấm công, xử lý ngoại lệ, ép kiểu TypeScript và kiểm thử Postman | Tuần 9 - Tuần 10 (11/10 - 24/10/2026) | **Đánh giá Mốc M2 (25/10/2026)** |
| 5 | Phát triển giao diện Frontend, tích hợp API, kiểm thử tích hợp toàn diện | Tuần 11 - Tuần 13 (25/10 - 14/11/2026) | Hệ thống hoạt động hoàn chỉnh |
| 6 | Viết báo cáo Thuyết minh (Mẫu 14), kiểm tra liêm chính học thuật, nộp hồ sơ và bảo vệ | Tuần 14 - Tuần 15 (15/11 - 05/12/2026) | **Bảo vệ Mốc M3 (05/12/2026)** |

---

*Hà Nội, ngày 15 tháng 08 năm 2026*

| Sinh viên thực hiện | Giảng viên hướng dẫn | Trưởng Bộ môn duyệt |
|:---:|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| **Lê Hoàng Trúc** | **TS. Nguyễn Văn A** | **TS. Lê Văn D** |
