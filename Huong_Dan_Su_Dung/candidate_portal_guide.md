# 📖 TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT - CỔNG TUYỂN DỤNG (CANDIDATE PORTAL)

---

## MỞ ĐẦU
Chào mừng đến với **Cổng Tuyển dụng Công khai (Public Candidate Portal)**. Đây là một website hoàn toàn độc lập với không gian quản trị nội bộ.

**Ý nghĩa nghiệp vụ:**
Cổng tuyển dụng đóng vai trò như "Mặt tiền" (Showroom) của công ty. Nó được thiết kế với giao diện bắt mắt nhằm nâng cao Hình ảnh Thương hiệu Nhà tuyển dụng (Employer Branding). Tính năng lớn nhất của nó là cho phép ứng viên tự do tìm kiếm việc làm và nộp hồ sơ (CV) một cách dễ dàng, không cần tạo tài khoản rườm rà. Quan trọng nhất, dữ liệu ứng viên nhập vào đây sẽ bay thẳng (Real-time) vào hệ thống nội bộ của Phòng Nhân sự.

---

## CHƯƠNG 1. TÌM KIẾM CƠ HỘI NGHỀ NGHIỆP

Cổng tuyển dụng được thiết kế theo xu hướng tối giản (Minimalism) để ứng viên không bị xao nhãng.

### 1.1. Truy cập Trang Tuyển dụng & Điều hướng Bảo mật
- Ứng viên (hoặc bất kỳ ai trên Internet) đều có thể truy cập trang web này thông qua đường dẫn công khai: `http://localhost:5173/` (hoặc alias `/candidate`).
- **Thanh điều hướng chuyên biệt (Navbar Actions):**
  - **Tra cứu hồ sơ**: Hỗ trợ ứng viên tra cứu tiến độ xét duyệt hồ sơ nhanh chóng qua Email và Mã hồ sơ bảo mật mà không cần đăng nhập.
  - **Đăng nhập Ứng viên**: Dẫn vào trang đăng nhập/đăng ký tài khoản ứng viên độc lập (`http://localhost:5173/candidate/login`), cho phép ứng viên theo dõi các vòng phỏng vấn, nhận và xác nhận Thư mời nhận việc (Offer Letter) và làm khảo sát Pre-onboarding.
  - **Quy chuẩn bảo mật**: Thanh điều hướng tuyệt đối không hiển thị cổng đăng nhập Quản trị nội bộ nhằm loại bỏ nguy cơ thăm dò, dò quét mật khẩu từ bên ngoài mạng.

### 1.2. Công cụ Tìm kiếm Việc làm (Job Search Engine)
Ngay chính giữa trang chủ là khu vực Tìm kiếm:
- Ứng viên gõ các từ khóa (Keywords) liên quan đến chuyên môn của mình vào thanh tìm kiếm. Ví dụ: `Marketing`, `Kế toán`, `ReactJS`.
- Hệ thống sẽ lập tức rà soát toàn bộ các chiến dịch tuyển dụng (Job Postings) đang có trạng thái **Đang mở (OPEN)** và hiển thị kết quả.

### 1.3. Xem danh sách công việc đang tuyển
Bên dưới thanh tìm kiếm là danh sách các cơ hội nghề nghiệp. Mỗi công việc hiển thị dưới dạng một "Thẻ thông tin" (Job Card) bao gồm các thông số tóm tắt:
- **Chức danh:** Tên vị trí (VD: Chuyên viên Phân tích Dữ liệu).
- **Phòng ban:** Trực thuộc khối nào (VD: Phòng IT).
- **Khu vực:** Địa điểm làm việc (VD: Hà Nội).
- **Mức lương:** Khoảng ngân sách dự kiến hoặc "Thỏa thuận".

---

## CHƯƠNG 2. XEM CHI TIẾT VÀ NỘP HỒ SƠ ỨNG TUYỂN

Khi ứng viên cảm thấy một vị trí phù hợp, họ sẽ nhấp chuột vào Thẻ Công việc đó để vào trang chi tiết.

### 2.1. Đọc Mô tả Công việc (Job Description - JD)
Trang chi tiết sẽ trình bày toàn bộ các thông tin do Bộ phận Nhân sự biên soạn từ Hệ thống Quản trị:
- **Mô tả công việc (What you will do):** Các đầu việc thực tế phải làm hàng ngày.
- **Yêu cầu kinh nghiệm (What we need):** Bằng cấp, năm kinh nghiệm, kỹ năng cứng/mềm.
- **Quyền lợi (Benefits):** Bảo hiểm, thưởng lễ tết, du lịch hằng năm.

### 2.2. Thao tác Ứng tuyển (Apply Flow)
Quy trình ứng tuyển được thiết kế cực kỳ tinh gọn, giúp ứng viên có thể nộp đơn trên cả điện thoại di động chỉ trong 30 giây.

**Bước 1: Mở Form ứng tuyển**
- Nhấp chuột vào nút **"Ứng tuyển ngay" (Apply Now)** ở cuối trang hoặc góc trên cùng.
- Một hộp thoại (Modal) nộp đơn sẽ xuất hiện đè lên màn hình hiện tại.

**Bước 2: Điền thông tin trích xuất**
- Ứng viên điền các trường thông tin cơ bản:
  - **Họ và tên (Bắt buộc):** Tên thật để xưng hô.
  - **Số điện thoại (Bắt buộc):** Để bộ phận tuyển dụng gọi điện phỏng vấn.
  - **Email (Bắt buộc):** Để hệ thống gửi email xác nhận và Thư mời (Offer Letter) sau này.
  - **Đường dẫn CV (Link CV):** Dán link Google Drive chứa file CV cá nhân (Lưu ý phải mở quyền truy cập Public). Hoặc sử dụng nút Tải lên (Upload) nếu có sẵn file PDF trong máy tính.

**Bước 3: Xác nhận nộp đơn**
- Bấm nút **"Xác nhận Nộp hồ sơ"**.
- Hệ thống sẽ hiển thị một thông báo màu xanh (Toast Notification) báo hiệu: *"Gửi hồ sơ ứng tuyển thành công. Chúng tôi sẽ sớm liên hệ lại với bạn!"*.

---

## CHƯƠNG 3. ĐIỀU GÌ XẢY RA SAU KHI NỘP ĐƠN? (HẬU TRƯỜNG)

Ứng viên sau khi nộp đơn có thể tắt trình duyệt. Nhưng điều kì diệu thực sự diễn ra ở hậu trường:

1. **Dữ liệu bay vào Hệ thống ATS:** Gần như ngay lập tức, dữ liệu vừa nhập (Tên, Email, CV) được đẩy qua API và mã hóa bảo mật, bay thẳng vào máy chủ cơ sở dữ liệu của công ty.
2. **Xuất hiện trên Bảng Quản trị:** Tên của ứng viên này sẽ lập tức xuất hiện dưới dạng một "Thẻ Ứng Viên" nằm ở cột đầu tiên **"Ứng tuyển" (Applied)** trong bảng theo dõi kéo - thả Kanban của bộ phận Nhân sự (Cổng Admin Portal).
3. **Chống thất lạc CV:** Nhờ cơ chế liên thông tự động này, HR không cần phải tải CV từ hòm thư Email về, không cần lập bảng Excel theo dõi, qua đó giảm 100% tỷ lệ sót hồ sơ ứng viên xuất sắc. Các vòng tiếp theo như Phỏng vấn và Nhận việc sẽ được HR tiếp quản hoàn toàn trên hệ thống nội bộ.

---
*Với Cổng Tuyển dụng này, công ty không chỉ thu hút nhân tài hiệu quả hơn mà còn thể hiện được tính chuyên nghiệp, chuyển đổi số toàn diện trong mắt thị trường lao động.*
