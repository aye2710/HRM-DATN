# 📖 TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT - CỔNG NHÂN VIÊN (EMPLOYEE PORTAL)

---

## MỞ ĐẦU
Chào mừng bạn đến với **Cổng Thông tin Tự phục vụ Dành cho Nhân viên (Employee Self-Service Portal - ESS)** thuộc Nền tảng Quản trị Nhân sự Hiện đại (HRM Enterprise). 

**Ý nghĩa của hệ thống:**
Trước đây, mọi thủ tục từ việc xin nghỉ phép, nộp giấy tờ ốm đau, tra cứu hợp đồng, theo dõi KPI đến việc thắc mắc về tiền lương, bạn đều phải nhắn tin riêng cho Quản lý hoặc điền các mẫu đơn giấy (hard-copy) nộp cho phòng Nhân sự. Quá trình này tốn rất nhiều thời gian và dễ bị thất lạc. 
Sự ra đời của Cổng Nhân viên ESS sẽ giúp bạn số hóa (digitalize) toàn bộ 100% các nhu cầu cá nhân. Bạn có thể tự chủ động tương tác với công ty một cách minh bạch, an toàn và nhanh chóng nhất.

Hệ thống cung cấp đầy đủ **5 phân hệ tự phục vụ cốt lõi**:
1. **Tổng quan & Chấm công (Dashboard & Timekeeping Kiosk)**: Điểm danh vào/ra, đồng hồ thời gian thực, cảnh báo thời gian ân hạn và lịch sử chấm công 5 ngày gần nhất.
2. **Hồ sơ Cá nhân (My Profile)**: Tra cứu lý lịch, công việc & phòng ban, chi tiết hợp đồng lao động và thông tin tài khoản lương, thuế, bảo hiểm.
3. **Quản lý Nghỉ phép (Leave Self-Service)**: Theo dõi quỹ phép năm trực quan với thanh tiến độ %, tạo đơn nghỉ tự động tính ngày và theo dõi duyệt.
4. **Phiếu lương Điện tử (Payslip Breakdown)**: Bảng kê chi tiết thu nhập Gross to Net, các khoản trích nộp bảo hiểm, thuế PIT và chức năng in phiếu lương A4 tiêu chuẩn.
5. **Mục tiêu KPI (Performance & KPI)**: Theo dõi chỉ tiêu KPI theo quý, phân bổ trọng số %, cập nhật tiến độ công việc và tự chấm điểm đánh giá.

---

## CHƯƠNG 1. BẢO MẬT VÀ ĐĂNG NHẬP

### 1.1. Cách truy cập vào hệ thống
- Mở trình duyệt web của bạn và gõ đường dẫn trang đăng nhập nội bộ của công ty:
  - Đường dẫn chuẩn: `http://localhost:5173/login` (hoặc `http://localhost:5173/admin`).
  - *Lưu ý*: Đường dẫn trang chủ `http://localhost:5173/` là Cổng Tuyển dụng Ứng viên công khai của công ty. Để đăng nhập làm việc nội bộ, nhân viên luôn sử dụng đường dẫn `/login`.

### 1.2. Thao tác Đăng nhập
Mỗi nhân viên khi ký hợp đồng chính thức sẽ được phòng Nhân sự (HR) hoặc phòng Công nghệ (IT) cấp phát một bộ Tài khoản nội bộ.
1. Nhập tên tài khoản (Thường là mã nhân viên hoặc username được cấp. Ví dụ: `emp01`, `nv_lan`).
2. Nhập mật khẩu.
3. Bấm **"Đăng nhập hệ thống"**.
4. **Cơ chế Router Guard phân quyền:** Khi bạn đăng nhập thành công, hệ thống nhận diện vai trò `EMPLOYEE` của bạn, cấp token JWT bảo mật và tự động điều hướng bạn vào Cổng Nhân viên (`/employee/dashboard`). Hệ thống ngăn chặn việc tài khoản nhân viên truy cập trái phép vào các trang quản trị của Admin/HR.

---

## CHƯƠNG 2. BÁO DANH CHẤM CÔNG (DASHBOARD & TIMEKEEPING KIOSK)

Ngay sau khi đăng nhập, màn hình đầu tiên bạn thấy chính là **Tổng quan & Báo danh (Dashboard)** tại đường dẫn `/employee/dashboard`. Đây là nơi bạn thực hiện nghiệp vụ quan trọng nhất mỗi ngày: Chấm công.

### 2.1. Thao tác Check-in (Vào ca làm việc)
**Ý nghĩa:** Báo cáo cho hệ thống biết bạn đã có mặt tại văn phòng, bắt đầu tính giờ làm việc trong ngày.
- **Bước 1:** Khi vừa đến công ty, đăng nhập vào cổng nhân viên.
- **Bước 2:** Tại khu vực **"Kiosk Báo danh Điểm danh"**, quan sát đồng hồ kỹ thuật số hiển thị giờ, phút, giây thời gian thực.
- **Bước 3:** Nhấp vào nút màu xanh **"Check-in Vào ca"**. Hệ thống sẽ ghi nhận chính xác thời điểm bạn có mặt và lưu vào cơ sở dữ liệu.
- **Thời gian ân hạn (Grace Period):** Hệ thống có khung giờ ân hạn 15 phút đầu giờ. Nếu bạn check-in sau thời gian ân hạn, hệ thống sẽ tự động gán nhãn "Đi muộn" (Late).
- *Lưu ý:* Sau khi bấm Check-in thành công, nút Check-in sẽ tự động chuyển sang trạng thái đã ghi nhận (hoặc vô hiệu hóa) để ngăn ngừa bấm trùng.

### 2.2. Thao tác Check-out (Kết thúc ca làm việc)
**Ý nghĩa:** Xác nhận thời gian kết thúc công việc để hệ thống tính tổng số giờ công thực tế trong ngày.
- **Bước 1:** Trước khi ra về, truy cập vào màn hình Dashboard.
- **Bước 2:** Nhấp vào nút màu cam/tím **"Check-out Ra về"**.
- Hệ thống tự động tính toán tổng số giờ làm việc thực tế của bạn trong ngày.

### 2.3. Lịch sử chấm công 5 ngày gần nhất & Thẻ chỉ số cá nhân
Ngay bên dưới Kiosk điểm danh, hệ thống cung cấp các thẻ tóm tắt và bảng lịch sử:
- **Lịch ca làm việc hôm nay:** Hiển thị khung giờ ca quy định (ví dụ: 08:30 - 17:30).
- **Lịch sử 5 ngày gần nhất:** Bảng theo dõi giờ Check-in, giờ Check-out, số giờ làm và trạng thái đi làm (Đúng giờ, Đi muộn, Vắng mặt) của từng ngày.
- **Các chỉ số tổng hợp tháng:** Số ngày công tích lũy, số lần đi muộn và số ngày phép năm khả dụng.

---

## CHƯƠNG 3. HỒ SƠ CÁ NHÂN & HỢP ĐỒNG LAO ĐỘNG (MY PROFILE)

Để tra cứu toàn bộ lý lịch nhân sự và thông tin việc làm của bạn, nhấp vào mục **"Hồ sơ cá nhân"** trên thanh menu (đường dẫn `/employee/profile`). Màn hình được bố trí theo dạng Thẻ định danh chuyên nghiệp và hệ thống 4 tab nội dung:

### 3.1. Thẻ định danh tổng quan (Hero Identity Card)
Phần đầu màn hình hiển thị:
- Ảnh đại diện (Avatar), Họ và tên đầy đủ, Mã nhân viên (Employee Code).
- Chức danh chuyên môn, Phòng ban trực thuộc và Badge trạng thái làm việc (Chính thức / Thử việc).
- Email công vụ và Số điện thoại liên hệ chính thức.

### 3.2. Bốn tab thông tin chi tiết:
1. **Tab 1 - Thông tin Cá nhân (Personal Info)**:
   - Ngày tháng năm sinh, Giới tính, Tình trạng hôn nhân.
   - Số CMND/CCCD, Ngày cấp, Nơi cấp.
   - Địa chỉ thường trú và Nơi ở hiện tại.
2. **Tab 2 - Thông tin Công việc (Job & Position)**:
   - Ngày bắt đầu làm việc (Join Date), Thâm niên công tác.
   - Loại hình nhân sự (Toàn thời gian / Bán thời gian).
   - Người quản lý trực tiếp (Direct Manager) phê duyệt đơn từ.
3. **Tab 3 - Hợp đồng Lao động (Contract Info)**:
   - Số hợp đồng, Loại hợp đồng (Có thời hạn / Không xác định thời hạn).
   - Ngày ký hiệu lực và Ngày hết hạn hợp đồng.
   - Mức lương đóng bảo hiểm và chế độ đãi ngộ cơ bản theo hợp đồng.
4. **Tab 4 - Thuế & Bảo hiểm (Tax & Insurance)**:
   - Mã số thuế thu nhập cá nhân (Personal Tax Code).
   - Mã số sổ Bảo hiểm Xã hội (Social Insurance Code).
   - Thông tin tài khoản ngân hàng nhận lương: Số tài khoản, Tên chủ tài khoản, Tên Ngân hàng và Chi nhánh.

---

## CHƯƠNG 4. QUẢN LÝ NGHỈ PHÉP (LEAVE SELF-SERVICE)

Phân hệ này giúp bạn gửi đơn xin vắng mặt tới cấp trên chỉ bằng vài cú nhấp chuột tại đường dẫn `/employee/leave`. Mọi đơn từ đều được lưu lại làm chứng từ điện tử minh bạch.

### 4.1. Thẻ đo lường Quỹ phép năm trực quan
Phía trên cùng hiển thị trạng thái quỹ phép cá nhân:
- **Tổng quỹ phép được cấp trong năm:** (Ví dụ: 12 ngày phép tiêu chuẩn).
- **Số ngày phép đã sử dụng:** Thể hiện rõ số ngày bạn đã nghỉ.
- **Số ngày phép còn lại:** Số ngày bạn có quyền nộp đơn nghỉ hưởng nguyên lương.
- **Thanh đo lường tiến độ % (Visual Progress Bar):** Thanh tiến độ đổi màu cảnh báo trực quan theo tỷ lệ sử dụng quỹ phép.

### 4.2. Hướng dẫn tạo Đơn xin nghỉ phép
1. Nhấp vào nút **"+ Tạo đơn nghỉ phép"**.
2. Hộp thoại (Modal) thông minh xuất hiện, bạn cần điền các thông tin:
   - **Loại nghỉ phép:** Lựa chọn loại phép (*Nghỉ phép năm, Nghỉ ốm đau, Nghỉ việc riêng có lương, Nghỉ thai sản, Nghỉ không hưởng lương*).
   - **Từ ngày & Đến ngày:** Chọn ngày bắt đầu và kết thúc vắng mặt.
   - **Tự động tính số ngày:** Hệ thống tự động tính toán tổng số ngày nghỉ dự kiến, giúp bạn không cần nhẩm đếm thủ công.
   - **Lý do nghỉ (Bắt buộc):** Trình bày ngắn gọn lý do xin nghỉ để cấp trên nắm rõ thông tin.
3. Bấm **"Gửi đơn duyệt"**. Hệ thống kiểm tra số dư phép khả dụng: nếu hợp lệ, đơn sẽ được ghi nhận ngay lập tức.

### 4.3. Theo dõi kết quả phê duyệt và Bộ lọc đơn
- Bảng lịch sử cho phép bạn lọc đơn theo trạng thái: **Tất cả**, **Chờ duyệt (Pending)**, **Đã duyệt (Approved)**, **Từ chối (Rejected)**.
- **Nếu Quản lý Đồng ý:** Trạng thái chuyển sang màu xanh lá cây `Đã duyệt`. Hệ thống tự động trừ vào số ngày phép khả dụng và đồng bộ sang bảng chấm công.
- **Nếu Quản lý Từ chối:** Trạng thái chuyển sang màu đỏ kèm lý do từ chối để bạn nắm thông tin.

---

## CHƯƠNG 5. TRA CỨU PHIẾU LƯƠNG ĐIỆN TỬ (PAYSLIP SELF-SERVICE)

Màn hình Phiếu lương tại `/employee/payslip` cho phép bạn kiểm tra chi tiết và minh bạch từng khoản thu nhập hàng tháng.

### 5.1. Cách tra cứu lương hàng tháng
1. Từ menu bên trái, chọn **"Phiếu lương"**.
2. Sử dụng thanh chọn kỳ lương hoặc danh sách các kỳ thanh toán để chọn tháng cần tra cứu (Ví dụ: Tháng 09/2026).
3. Hệ thống hiển thị mẫu Phiếu lương chuẩn doanh nghiệp với đầy đủ các khối dữ liệu:
   - **Khối Thu nhập (Earnings / Gross):** Lương cơ bản theo hợp đồng, lương ngày công thực tế, phụ cấp ăn trưa/đi lại, tiền làm thêm giờ (OT), thưởng hiệu suất.
   - **Khối Dữ liệu công làm việc:** Số ngày công tiêu chuẩn của tháng, số ngày công thực tế đi làm, số ngày nghỉ phép có lương.
   - **Khối Khấu trừ bắt buộc (Deductions):** Bảo hiểm Xã hội (8%), Bảo hiểm Y tế (1.5%), Bảo hiểm Thất nghiệp (1%), Thuế Thu nhập Cá nhân (PIT), các khoản giảm trừ người phụ thuộc.
   - **Thực Lãnh (Net Pay):** Con số nổi bật nhất tại trung tâm phiếu lương - số tiền chính xác chuyển khoản về tài khoản ngân hàng cá nhân của bạn.

### 5.2. Chức năng In Phiếu lương (Print to A4 / Save PDF)
- Nhấp vào nút **"In phiếu lương"** ở góc trên màn hình.
- Trình duyệt sẽ mở hộp thoại in định dạng văn bản A4 chuẩn doanh nghiệp sạch đẹp, tự động ẩn thanh điều hướng và nút bấm, sẵn sàng để in giấy hoặc lưu thành file PDF làm chứng minh thu nhập cá nhân.

---

## CHƯƠNG 6. MỤC TIÊU & ĐÁNH GIÁ HIỆU SUẤT KPI (MY PERFORMANCE & KPI)

Phân hệ KPI tại `/employee/kpi` là nơi nhân viên đồng hành cùng mục tiêu phát triển của công ty, tự đo lường kết quả công việc theo từng quý.

### 6.1. Theo dõi Danh sách Mục tiêu Quý
- Chọn chu kỳ đánh giá (Ví dụ: Quý 3/2026, Quý 4/2026).
- Danh sách các mục tiêu KPI được hiển thị rõ ràng với:
  - **Tên mục tiêu & Mô tả chỉ số đo lường (KPI Target)**.
  - **Trọng số (% Weight)**: Tỷ trọng đóng góp của từng chỉ tiêu vào tổng điểm hiệu suất (Tổng trọng số luôn đạt 100%).
  - **Mục tiêu định lượng vs Thực tế đạt được**: Chỉ số cần đạt và số liệu hiện tại.
  - **Thanh tiến độ % hoàn thành**: Hiển thị mức độ hoàn thành trực quan.

### 6.2. Cập nhật Tiến độ & Tự đánh giá Hiệu suất (Self-Assessment)
- Nhân viên chủ động cập nhật kết quả tiến độ thực tế đạt được định kỳ.
- Vào cuối chu kỳ đánh giá, bạn thực hiện **Tự chấm điểm đánh giá (Self-score)** và ghi chú các thành tựu hoặc khó khăn gặp phải.
- Điểm tự đánh giá là cơ sở quan trọng để Quản lý trực tiếp đối thoại hiệu suất (Performance Review) và quyết định mức xếp loại, thưởng cuối quý/năm.

---

## CHƯƠNG 7. BẢO MẬT & NGUYÊN TẮC AN TOÀN DỮ LIỆU
1. **Tuyệt mật thông tin:** Dữ liệu hồ sơ, phiếu lương và đánh giá KPI là thông tin riêng tư. Hệ thống áp dụng tường lửa cách ly dữ liệu cá nhân (Data Isolation), nhân viên tuyệt đối không thể truy cập dữ liệu của đồng nghiệp.
2. **Bảo mật tài khoản:** Không chia sẻ mật khẩu đăng nhập cổng ESS cho bất kỳ ai. Khi rời khỏi máy tính làm việc, hãy sử dụng tính năng **Đăng xuất** để đóng phiên an toàn.
3. **Hỗ trợ khi có sự cố:** Nếu phát hiện sai sót về ngày công, mức đóng bảo hiểm hoặc tiền lương, hãy liên hệ ngay với phòng Nhân sự (HR/C&B) để được hỗ trợ đối soát kịp thời.

---
*Tài liệu được cập nhật đồng bộ 100% cùng phiên bản phát hành LLA HRM Enterprise Platform.*
