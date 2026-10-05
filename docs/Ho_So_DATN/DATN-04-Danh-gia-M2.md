# Mẫu ĐATN-04: PHIẾU ĐÁNH GIÁ MỐC M2

**TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI**  
**KHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN CÔNG NGHỆ PHẦN MỀM**  

---

- **Họ và tên SV**: Lê Hoàng Trúc  
- **Mã SV**: 661234  
- **Lớp**: 66PM1  
- **Tên đề tài**: Phân tích, thiết kế và xây dựng Hệ thống Quản trị Nguồn nhân lực (HRM)  
- **GVHD**: TS. Nguyễn Văn A  
- **Người phản biện**: ThS. Trần Thị B  
- **Ngày đánh giá**: 25/10/2026  
- **Hình thức**: Trực tiếp  

---

### I. Bảng đánh giá theo CLO (mốc M2)
| CLO | Nội dung/tiêu chí đánh giá | Mức đánh giá (0-4) | Nhận xét minh chứng |
|---|---|---|---|
| **CLO2** | Triển khai lập trình và áp dụng công nghệ mới. | 3 (Sufficient) | Đã lập trình hoàn chỉnh các API quản lý phòng ban, vị trí công tác và chấm công. Xử lý triệt để các lỗi ngoại lệ cơ sở dữ liệu (đặc biệt là Prisma P2002 Unique Constraint được chuyển đổi thành mã HTTP 409 Conflict). Source code Node.js/Express viết bằng TypeScript chạy ổn định, cấu trúc thư mục phân tầng rõ ràng. |
| **CLO6** | Tự học, tự chủ giải quyết vấn đề. | 4 (Exemplary) | Sinh viên thể hiện tinh thần chủ động cao, tự tìm hiểu và khắc phục nhanh các lỗi Type Mismatch trong TypeScript (`kpi.routes.ts`), xử lý ép kiểu (Type Casting) hợp lý để hệ thống biên dịch và vận hành thông suốt. |

- **Kết luận mốc**: [x] Đạt  [ ] Chưa đạt  [ ] Đạt nhưng yêu cầu chỉnh sửa  
- **Điểm mốc (tham khảo)**: **8.8 / 10**  

### II. Ghi chú/yêu cầu chỉnh sửa bắt buộc (nếu có)
- Tối ưu hóa hiệu năng của các câu truy vấn cơ sở dữ liệu `findMany` khi kết nối nhiều quan hệ (Include/Join), bổ sung Index cho các trường thường xuyên tìm kiếm và lọc dữ liệu.
- Tiếp tục hoàn thiện phần giao diện người dùng (Frontend) và tiến hành tích hợp hệ thống toàn diện.

---

*Hà Nội, ngày 25 tháng 10 năm 2026*

| Giảng viên hướng dẫn | Cán bộ phản biện |
|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| **TS. Nguyễn Văn A** | **ThS. Trần Thị B** |
