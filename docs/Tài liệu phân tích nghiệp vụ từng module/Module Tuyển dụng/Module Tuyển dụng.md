# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE TUYỂN DỤNG (RECRUITMENT & ATS)

## 1. Giới thiệu chung
**Module Tuyển dụng** đóng vai trò là "Phễu lọc" đầu vào của toàn bộ doanh nghiệp. Nó kết nối chặt chẽ với **Module Tổ chức** (để biết phòng ban nào đang thiếu người ở vị trí nào) và cung cấp dữ liệu đầu ra cho **Module Hồ sơ Nhân sự (Core HR)** (khi ứng viên trúng tuyển và đi làm).

**Đối tượng sử dụng chính:**
- Trưởng phòng / Trưởng bộ phận: Người đề xuất nhu cầu tuyển dụng và tham gia phỏng vấn chuyên môn.
- Chuyên viên Tuyển dụng (Recruiter / HR): Người vận hành chính, săn tìm CV, theo dõi trạng thái ứng viên và điều phối lịch phỏng vấn.

---

## 2. Cấu trúc dữ liệu chính
Module này được tái cấu trúc dựa trên quy chuẩn của các hệ thống HRM Enterprise, bao gồm 4 thực thể cốt lõi:
1. **Yêu cầu tuyển dụng (Job Requisition):** Đơn xin cấp nhân sự từ các phòng ban, là cơ sở để đăng tin tuyển dụng.
2. **Ứng viên (Candidate):** Hồ sơ người xin việc.
3. **Vòng Phỏng vấn (Interview Round):** Lịch hẹn và kết quả đánh giá ứng viên.
4. **Đề nghị nhận việc (Job Offer):** Bản thỏa thuận lương thưởng và ngày nhận việc chốt với ứng viên.

---

## 3. Phân tích Nghiệp vụ: Quản lý Yêu cầu Tuyển dụng (Job Requisitions)

### 3.1. Mục đích
Thay vì "đăng tin tuyển dụng" một cách bừa bãi, mọi chiến dịch tuyển dụng phải xuất phát từ một **Yêu cầu tuyển dụng (Requisition)** có chủ đích, gắn liền với định biên nhân sự của Phòng ban và Vị trí (Position) cụ thể.

### 3.2. Các thông tin quản lý
- Tiêu đề chiến dịch.
- Phòng ban & Vị trí áp dụng (Liên kết chặt chẽ với Module Tổ chức).
- Số lượng cần tuyển (Headcount).
- Cấp bậc (Level) & Ngân sách lương (Salary Range).
- Trạng thái: DRAFT (Nháp) -> PUBLISHED (Phát hành) -> CLOSED (Đóng).

### 3.3. Quy tắc nghiệp vụ (Business Rules) chuẩn Senior BA
- **Nguyên tắc Toàn vẹn Dữ liệu:** Không cho phép tạo Job rác chỉ có Tiêu đề. Bắt buộc mỗi chiến dịch tuyển dụng phải tham chiếu đến một `PositionId` và `DepartmentId`. Điều này giúp hệ thống tự động đo lường tỷ lệ lấp đầy (Fill Rate) của từng phòng ban.
- **Auto-fetch dữ liệu:** Khi chọn Vị trí (VD: Lập trình viên ReactJS), hệ thống phải tự động điền Phòng ban tương ứng (Khối Công nghệ) và Ngân sách lương chuẩn của vị trí đó.

---

## 4. Phân tích Nghiệp vụ: Hệ thống Theo dõi Ứng viên (ATS Kanban Board)

### 4.1. Mục đích
Cung cấp màn hình tương tác trực quan (Kéo - Thả) tương tự Trello để chuyên viên nhân sự di chuyển hồ sơ ứng viên đi qua từng vòng trong phễu tuyển dụng.

### 4.2. Quy tắc nghiệp vụ (Business Rules) chuẩn Senior BA
Trong các hệ thống nghiệp vụ sơ sài, ứng viên nộp CV xong thường bị đẩy ngay vào vòng Phỏng vấn. Tại dự án này, luồng Kanban được thiết kế chuẩn mực với **5 Vòng (Stages)** bắt buộc:

1. **SOURCED (Nguồn CV / Mới nộp):** Nơi tiếp nhận mọi CV đổ về.
2. **SCREENING (Sàng lọc):** Bắt buộc phải có bước này. HR sẽ gọi điện (Phone screen) hoặc làm bài Test kỹ năng để loại các CV rác trước khi lôi Manager vào phỏng vấn.
3. **INTERVIEWING (Phỏng vấn):** Có thể gồm nhiều vòng (HR, Technical, Culture Fit).
4. **OFFERING (Thương lượng):** Ứng viên pass phỏng vấn sẽ được gửi Offer. Giai đoạn này chờ ứng viên phản hồi (Đồng ý/Từ chối).
5. **HIRED (Đã nhận việc):** Ứng viên chính thức chốt ngày đi làm.

*Lưu ý:* Trạng thái **REJECTED (Loại)** có thể xảy ra ở bất kỳ vòng nào và yêu cầu nhập lý do loại để phân tích nguồn dữ liệu sau này.

---

## 5. Phân tích Nghiệp vụ: Chuyển đổi Dữ liệu (Candidate to Employee Conversion)

### 5.1. Mục đích
Giải quyết điểm nghẽn (Bottleneck) lớn nhất của các hệ thống HRM nghiệp dư: Sự đứt gãy dữ liệu giữa Tuyển dụng và Quản lý nhân sự.

### 5.2. Quy tắc nghiệp vụ (Business Rules) cốt lõi
- **Không bao giờ nhập lại dữ liệu:** Khi một Ứng viên được kéo thẻ sang trạng thái **HIRED (Nhận việc)**, hệ thống KHÔNG chỉ dừng lại ở việc đổi màu thẻ.
- **Trigger Tự động (Auto-provisioning):** Hệ thống phải hiển thị một hộp thoại xác nhận. Khi xác nhận, Backend sẽ thực hiện 1 transaction:
  1. Tạo tự động một bản ghi `Employee` (Nhân viên mới) tại Module Core HR.
  2. Map toàn bộ Tên, Số điện thoại, Email, CV từ `Candidate` sang `Employee`.
  3. Map `Department` và `Position` từ `JobRequisition` sang `Employee`.
  4. Gán trạng thái của Nhân viên mới là `ONBOARDING` (Chờ hội nhập).
  
Nhờ luồng này, HR không cần phải gõ lại thông tin ứng viên bằng tay thêm một lần nào nữa!

---

## 6. Phân tích Nghiệp vụ: Đánh giá Phỏng vấn (Interviews)
- Khi ứng viên ở cột INTERVIEWING, HR có thể lên lịch nhiều vòng phỏng vấn.
- Hệ thống gửi Email/Thông báo cho Người phỏng vấn (Interviewer).
- Khi phỏng vấn kết thúc, Interviewer bắt buộc phải truy cập hệ thống để nhập **Điểm số (Score)** và **Nhận xét (Feedback)**. Báo cáo này là cơ sở duy nhất để Giám đốc duyệt gửi Job Offer.

---

## 7. Tổng kết
Module Tuyển dụng được tái cấu trúc không chỉ là một bảng lưu CV, mà là một cỗ máy tự động: Kiểm soát chặt ngân sách định biên (Requisitions) -> Lọc phễu chuẩn xác (ATS Kanban) -> Tự động hóa tạo Hồ sơ Nhân viên (Core HR Integration) giúp loại bỏ 100% các tác vụ nhập liệu thủ công dư thừa.
