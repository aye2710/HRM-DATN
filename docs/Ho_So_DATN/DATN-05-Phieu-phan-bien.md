# Mẫu ĐATN-05: PHIẾU PHẢN BIỆN ĐỒ ÁN TỐT NGHIỆP

**TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI**  
**KHOA CÔNG NGHỆ THÔNG TIN**  

---

- **Họ và tên SV**: Lê Hoàng Trúc  
- **Mã SV**: 661234  
- **Lớp**: 66PM1  
- **Tên đề tài**: Phân tích, thiết kế và xây dựng Hệ thống Quản trị Nguồn nhân lực (HRM)  
- **Người phản biện**: ThS. Trần Thị B  
- **Đơn vị**: Bộ môn Hệ thống Thông tin - Khoa CNTT, Trường ĐH Xây dựng Hà Nội  
- **Ngày phản biện**: 30/11/2026  

---

### I. Nhận xét chung
Đề tài có tính thời sự và ứng dụng thực tiễn cao, giải quyết bài toán quản trị nguồn nhân lực cốt lõi cho các tổ chức, doanh nghiệp trong quá trình chuyển đổi số. Sinh viên nắm vững kiến thức chuyên ngành, làm chủ các công nghệ Backend hiện đại (Node.js, Express, TypeScript, Prisma ORM, PostgreSQL) kết hợp Frontend React.

Đặc biệt, sinh viên thể hiện năng lực phân tích nghiệp vụ (Business Analysis) rất nổi bật: tài liệu đặc tả bóc tách chi tiết từng luồng sự kiện (Thêm, Sửa, Xóa phòng ban/vị trí), mô hình hóa quy tắc nghiệp vụ chặt chẽ (chặn tạo vòng lặp cây cha-con, kiểm tra trùng mã bản ghi) và minh họa bằng biểu đồ tuần tự (Sequence Diagram) chi tiết tới từng mã phản hồi HTTP.

### II. Đánh giá theo CLO
| CLO | Nội dung/tiêu chí đánh giá | Mức đánh giá (0-4) | Nhận xét minh chứng |
|---|---|---|---|
| **CLO1** | Năng lực phân tích bài toán và thiết kế | 4 (Exemplary) | Hồ sơ phân tích nghiệp vụ (SRS) được viết bằng thuật ngữ BA chuyên nghiệp, mạch lạc. Sơ đồ dữ liệu thực thể liên kết (ERD) và Prisma Schema thiết kế tối ưu, có chỉ mục index và quan hệ khóa ngoại toàn vẹn. |
| **CLO2** | Năng lực lập trình và triển khai | 3 (Sufficient) | Các API được thiết kế chuẩn mực RESTful. Xử lý tốt các ngoại lệ dữ liệu, kiểm soát luồng đệ quy cây phòng ban hiệu quả. Giao diện trực quan, demo mượt mà. |
| **CLO7** | Ứng dụng công nghệ số và công cụ | 4 (Exemplary) | Áp dụng thành thạo Prisma ORM trong quản trị dữ liệu, sử dụng Mermaid Markdown để trực quan hóa biểu đồ và quản lý tài liệu minh chứng nhất quán theo chuẩn Git. |

### III. Kiến nghị của người phản biện
- **Đánh giá điều kiện bảo vệ**: [x] Đồng ý cho bảo vệ   [ ] Đề nghị chỉnh sửa trước bảo vệ   [ ] Chưa đủ điều kiện bảo vệ  
- **Điểm phản biện đề nghị**: **8.6 / 10**  

**Các yêu cầu chỉnh sửa và câu hỏi dành cho sinh viên khi bảo vệ:**
1. Rà soát chuẩn hóa định dạng văn bản trong quyển Thuyết minh theo đúng khung cấu trúc Mẫu ĐATN-14 trước khi nộp lưu chiểu.
2. Trình bày rõ phương án xử lý hiệu năng khi cây cơ cấu tổ chức có quy mô lớn (hàng trăm phòng ban và hàng nghìn nhân sự).

---

*Hà Nội, ngày 30 tháng 11 năm 2026*

| Cán bộ phản biện |
|:---:|
| *(Ký và ghi rõ họ tên)* |
| **ThS. Trần Thị B** |
