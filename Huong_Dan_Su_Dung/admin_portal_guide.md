# 📖 TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT - CỔNG QUẢN TRỊ (ADMIN / HR PORTAL)

---

## MỞ ĐẦU
Chào mừng Quý khách hàng và Ban quản trị đến với **Hệ thống Quản trị Nhân sự Hiện đại (HRM Enterprise)**. Tài liệu này được biên soạn độc quyền và vô cùng chi tiết nhằm mục đích đào tạo người dùng mới, giải thích rõ ràng ý nghĩa nghiệp vụ của từng tính năng, cách thao tác chính xác nhất và các lưu ý quan trọng trong quá trình vận hành hệ thống.

Hệ thống được thiết kế dựa trên các tiêu chuẩn quản trị nhân sự quốc tế, kết hợp công nghệ tự động hóa luồng công việc (Workflow Automation), giúp tối ưu hóa 100% các thủ tục giấy tờ truyền thống.

---

## CHƯƠNG 1. ĐĂNG NHẬP VÀ KIỂM SOÁT PHIÊN LÀM VIỆC

### 1.1. Khởi động và Đăng nhập
**Ý nghĩa nghiệp vụ:** 
Màn hình đăng nhập là chốt chặn bảo mật đầu tiên. Hệ thống áp dụng cơ chế xác thực JWT (JSON Web Tokens) mã hóa mật khẩu một chiều, đảm bảo không ai có thể can thiệp vào tài khoản của Quản trị viên.

**Các bước thao tác:**
1. Mở trình duyệt web được khuyến nghị (Google Chrome, Microsoft Edge, Safari) và truy cập vào đường dẫn máy chủ hệ thống (Ví dụ: `http://localhost:5173/`).
2. Màn hình "HRM Enterprise" sẽ xuất hiện. Tại đây, bạn cần nhập chính xác:
   - **Tài khoản (Username):** Do bộ phận IT cấp phát (Ví dụ: `admin`).
   - **Mật khẩu (Password):** Gõ chính xác mật khẩu, chú ý không bật CapsLock.
3. Nhấp vào nút **"Đăng nhập hệ thống"**.
4. **Kết quả:** Nếu thành công, một thông báo màu xanh (Toast) sẽ trượt ra ở góc phải màn hình báo hiệu xác thực thành công. Hệ thống tự động phân tích quyền (RBAC) của bạn và đưa bạn vào không gian làm việc của Admin.

### 1.2. Tổng quan Giao diện làm việc (Dashboard)
Giao diện quản trị được chia làm 3 vùng độc lập để tối đa hóa diện tích làm việc:
- **Thanh điều hướng bên trái (Sidebar Menu):** Chứa danh sách toàn bộ các Modules. Bạn có thể mở rộng (Expand) hoặc thu gọn (Collapse) các menu con. Menu được phân cấp rõ ràng từ Tổ chức -> Tuyển dụng -> Nhân sự -> Tiền lương -> Hệ thống.
- **Thanh trạng thái trên cùng (Top Navigation Bar):** Hiển thị Avatar của bạn. Khi nhấp vào Avatar, bạn có thể xem Hồ sơ cá nhân của chính mình hoặc chọn "Đăng xuất" (Logout) để kết thúc phiên làm việc.
- **Khu vực hiển thị trung tâm (Main Workspace):** Nơi mọi biểu đồ, danh sách và Form nhập liệu xuất hiện.

---

## CHƯƠNG 2. PHÂN HỆ QUẢN LÝ TỔ CHỨC (ORGANIZATION MANAGEMENT)

Phân hệ này giải quyết bài toán "Sắp xếp bộ máy doanh nghiệp". Trước khi bạn tuyển ai đó, bạn phải biết họ sẽ ngồi ở phòng nào, làm chức vụ gì. Việc cấu hình đúng ở Chương này sẽ quyết định tính chính xác của các chương sau.

### 2.1. Quản lý Phòng ban (Departments)
**Ý nghĩa:** Xác định các khối, phòng, ban, trung tâm đang hoạt động trong doanh nghiệp.
**Hướng dẫn sử dụng chi tiết:**
- **Bước 1:** Nhấp vào menu **Tổ chức** -> Chọn **Phòng ban**. Bạn sẽ thấy bảng danh sách phòng ban hiện có.
- **Bước 2:** Để thêm một đơn vị mới, nhấp nút màu xanh **"+ Thêm Phòng ban"** ở góc phải.
- **Bước 3:** Bảng điền thông tin (Form) hiện ra. Bạn cần điền:
  - **Mã Phòng ban (Required):** Nhập mã viết liền không dấu, không khoảng trắng. Ví dụ: `SALES`, `FINANCE`. (Lưu ý: Mã này là duy nhất, không được trùng với phòng đã có).
  - **Tên Phòng ban (Required):** Nhập tên hiển thị chính thức. Ví dụ: `Phòng Tài chính - Kế toán`.
  - **Mô tả nhiệm vụ:** Ghi chú chức năng hoạt động của phòng này.
- **Bước 4:** Bấm **"Lưu Phòng ban"**. Thông báo thành công sẽ xuất hiện.

**Xử lý sự cố:** Nếu hệ thống báo lỗi đỏ "Mã phòng ban đã tồn tại", bạn cần sửa lại trường Mã bằng một chuỗi ký tự khác.

### 2.2. Quản lý Vị trí Chức danh (Positions)
**Ý nghĩa:** Khởi tạo danh mục các "Ghế" (Chức vụ) tồn tại trong công ty.
**Hướng dẫn sử dụng chi tiết:**
- **Bước 1:** Nhấp vào **Tổ chức** -> Chọn **Vị trí**.
- **Bước 2:** Nhấp nút **"+ Thêm Vị trí"**.
- **Bước 3:** Điền các thông số:
  - **Mã chức danh:** Ký hiệu viết tắt (VD: `MGR-SALE`).
  - **Tên chức danh:** Chức danh in trên hợp đồng (VD: `Trưởng phòng Kinh doanh`).
  - **Cấp bậc (Level):** Lựa chọn cấp độ năng lực (Intern, Fresher, Junior, Senior, Manager, Director). Cấp bậc này sẽ ảnh hưởng tới dải lương và quyền hạn phê duyệt sau này.
- **Bước 4:** Bấm **"Lưu thông tin"**.

### 2.3. Sơ đồ Tổ chức (Org Chart)
- **Tính năng:** Khi bạn nhấp vào **Tổ chức** -> **Sơ đồ tổ chức**, hệ thống sẽ tự động vẽ ra một biểu đồ cây (Tree Chart) dựa trên dữ liệu phòng ban bạn vừa nhập. Chức năng này giúp Ban Giám Đốc có cái nhìn trực quan về quy mô công ty hiện tại.

---

## CHƯƠNG 3. PHÂN HỆ TUYỂN DỤNG & ATS (APPLICANT TRACKING SYSTEM)

Đây là "trái tim" của khối Tuyển dụng, giúp tự động hóa luồng chảy của CV ứng viên và loại bỏ việc quản lý bằng Excel.

### 3.1. Quản lý Yêu cầu Tuyển dụng (Requisitions)
**Ý nghĩa:** Khi một Trưởng phòng muốn xin thêm nhân sự, họ sẽ tạo Yêu cầu (Request) tại đây. HR sẽ kiểm duyệt và biến nó thành một "Chiến dịch tuyển dụng".
- **Thao tác:** Vào **Tuyển dụng** -> **Yêu cầu tuyển dụng**. Bấm Thêm Yêu cầu, điền Số lượng cần tuyển, Mức lương ngân sách dự kiến, và Hạn chót cần người.

### 3.2. Bảng Theo dõi Ứng viên Thông minh (ATS Kanban)
**Ý nghĩa:** Màn hình trực quan chia làm 6 cột trạng thái. Bạn có thể theo dõi chính xác có bao nhiêu người đang ở vòng Phỏng vấn, bao nhiêu người đã rớt.
- **Truy cập:** Vào **Tuyển dụng** -> **Ứng viên**.
- **Các cột trạng thái (Stages):**
  1. **Nguồn (Sourced):** CV do HR tự tìm kiếm (Headhunt) mang về.
  2. **Ứng tuyển (Applied):** CV do ứng viên tự nộp thông qua trang web Tuyển dụng bên ngoài (Candidate Portal).
  3. **Phỏng vấn (Interview):** Đã lọc CV xong, đang xếp lịch phỏng vấn.
  4. **Đề nghị (Offered):** Đã chốt lương, gửi thư mời nhận việc.
  5. **Nhận việc (Hired):** Ứng viên đồng ý đi làm.
  6. **Từ chối (Rejected):** Không phù hợp.

**Hướng dẫn Thao tác "Kéo Thả" Kì Diệu (Drag & Drop):**
- **Di chuyển trạng thái:** Nhấp giữ chuột trái vào thẻ của ứng viên, kéo thả sang cột tiếp theo. Hệ thống sẽ bật lên cửa sổ yêu cầu bạn ghi chú lý do chuyển trạng thái.
- **TÍNH NĂNG TỰ ĐỘNG HÓA (AUTO-PROVISIONING):** Đây là tính năng đắt giá nhất. Khi bạn kéo một ứng viên thả vào cột **"Nhận việc (Hired)"**, hệ thống hiểu rằng người này đã trở thành người của công ty. Ngay lập tức, mã nguồn nền tảng sẽ tự động trích xuất Tên, Email, Số điện thoại từ CV để **Tạo ra một Hồ sơ Nhân sự chính thức mới** bên phân hệ Core HR, đồng thời **Tự động sinh ra một Mã Nhân Viên mới (VD: EMP-128)**. Chuyên viên HR hoàn toàn rảnh tay, không cần phải nhập đi nhập lại dữ liệu!

### 3.3. Phỏng vấn (Interviews) & Gửi Thư Mời (Offers)
- **Phỏng vấn:** Lên lịch ngày giờ, gán người Phỏng vấn (Interviewer) và lưu lại điểm số đánh giá trực tiếp lên hệ thống.
- **Offers:** Điền Mức lương chốt thỏa thuận. Nếu ứng viên bấm "Accept" trên email, trạng thái sẽ đổi sang Hired.

---

## CHƯƠNG 4. PHÂN HỆ QUẢN LÝ NHÂN SỰ LÕI (CORE HR)

Nơi lưu trữ sổ cái nhân sự (Master Data).

### 4.1. Hồ sơ Cá nhân (Employee Profiles)
- Nơi chứa danh bạ công ty. Bạn nhấp vào **Nhân sự** -> **Hồ sơ cá nhân**.
- Danh sách hỗ trợ Thanh tìm kiếm siêu tốc. Bạn gõ tên "Nguyễn Văn" là danh sách sẽ lọc ngay lập tức.
- **Xem chi tiết:** Nhấp vào icon Mắt hoặc Cây bút để cập nhật các thông tin như CCCD, Mã số thuế, Tài khoản ngân hàng.

### 4.2. Hợp đồng Lao động (Contracts)
- Quản lý rủi ro pháp lý. 
- **Cách nhập:** Chọn tên nhân viên, loại hợp đồng (Thử việc 2 tháng, Có thời hạn 12 tháng). Quan trọng nhất là nhập **Mức Lương Cơ Bản**. Con số này sẽ được engine Tiền lương móc nối để tính lương thực nhận.

### 4.3. Quyết định Điều chuyển (Transfers) & Nghỉ việc (Terminations)
- Khi nhân viên A thăng chức từ Nhân viên lên Trưởng phòng, bạn vào màn hình **Điều chuyển**. Tại đây, lịch sử luân chuyển sẽ được lưu giữ trọn đời để phục vụ việc tra cứu.
- Khi có nhân viên xin nghỉ, vào **Nghỉ việc**, tiến hành thủ tục "Thanh lý". Trạng thái của nhân viên sẽ chuyển thành `RESIGNED`. Người này lập tức bị chặn không thể đăng nhập vào hệ thống Employee Portal nữa.

---

## CHƯƠNG 5. CHẤM CÔNG & NGHỈ PHÉP (TIME & ATTENDANCE)

### 5.1. Quản lý Bảng công (Attendance Records)
- Hệ thống lắng nghe các sự kiện Check-in / Check-out từ điện thoại hoặc máy tính của nhân viên để ghi nhận thời gian thực (Real-time).
- Tại màn hình **Chấm công** -> **Bảng công**, HR có thể xem nhân viên A hôm nay đi làm lúc mấy giờ, có bị muộn không. Nếu hệ thống ghi nhận muộn, chữ sẽ hiện màu đỏ (Late).

### 5.2. Quản lý Đơn từ (Leave Requests)
- Thay vì nộp đơn giấy, nhân viên nộp qua cổng riêng.
- Quản trị viên vào **Nghỉ phép** -> **Đơn xin nghỉ**. 
- Tại đây, hệ thống hiển thị bảng danh sách các đơn đang ở trạng thái **Chờ duyệt (Pending)**.
- **Thao tác:** Bấm dấu Xanh (Approve) hoặc Đỏ (Reject). Quyết định này sẽ lập tức trừ vào Quỹ phép năm của nhân viên và đánh dấu "Vắng mặt có phép" vào Bảng công.

---

## CHƯƠNG 6. PHÂN HỆ TIỀN LƯƠNG (PAYROLL)

Đỉnh cao của sự chính xác. Phân hệ này móc nối toàn bộ dữ liệu từ Hợp đồng (Lương cơ bản) và Chấm công (Số ngày làm việc).

### 6.1. Hướng dẫn "Chạy Bảng Lương" Tự động
1. Vào **Lương thưởng** -> **Bảng lương**.
2. Ở ô bộ lọc trên cùng, hãy chọn **Tháng** và **Năm** (Ví dụ: Tháng 9 - 2026).
3. Bấm nút có biểu tượng máy tính cầm tay: **"Chạy Bảng Lương"**.
4. Quá trình tính toán diễn ra trong chớp mắt. Hệ thống sẽ rà soát 100% nhân sự:
   - Dò Lương cơ bản hiện tại của họ.
   - Chia cho chuẩn 22 ngày làm việc để ra Lương ngày.
   - Nhân với Số ngày đi làm thực tế lấy từ Module Chấm công.
   - Tính tổng các khoản phạt (đi muộn).
   - Ra kết quả cuối cùng: **Thực Lãnh (Net Salary)**.

### 6.2. Chốt Lương & Trả Lương
- Dữ liệu vừa tính đang ở trạng thái "Bản nháp" (Draft). HR kiểm tra lại bằng mắt thường.
- Nếu chuẩn xác, HR bấm nút **"Chốt" (Lock)** ở cuối mỗi nhân viên. Khi đã chốt, số liệu bị niêm phong vĩnh viễn, không ai có thể sửa nhằm chống gian lận. Phiếu lương điện tử sẽ được phát hành xuống cổng cá nhân của người lao động.
- Bấm nút **"Xuất Excel"**, hệ thống sẽ tự động tổng hợp ra 1 file CSV. Bạn chỉ cần gửi file này cho Kế toán hoặc import vào hệ thống của Ngân hàng để giải ngân hàng loạt.

---

## CHƯƠNG 7. ĐÁNH GIÁ HIỆU SUẤT KPI (PERFORMANCE MANAGEMENT)

Đánh giá năng lực theo mô hình phân phối chuẩn (Force Ranking Curve) nhằm đảm bảo công bằng.

### 7.1. Tạo Kỳ đánh giá
- Vào **KPI** -> **Giao KPI & Đánh giá**.
- Bấm nút **"Mở Kỳ Đánh giá Mới"**. 
- Hệ thống sẽ yêu cầu bạn đặt tên (VD: `Đánh giá Quý 3`). 
- **Auto-Gen:** Ngay khi xác nhận, hệ thống quét toàn bộ nhân viên đang có trạng thái ACTIVE và tự động rải Phiếu đánh giá nháp cho từng người. Không bỏ sót bất kì nhân viên nào.

### 7.2. Phân loại Curve (Ranking)
- Sau khi có điểm tự đánh giá và điểm quản lý đánh giá, bảng xếp hạng sẽ hiển thị rõ ràng:
  - **Hạng A (Excellent):** Đạt ngưỡng xuất sắc.
  - **Hạng B (Good):** Đạt tiêu chuẩn.
  - **Hạng C (Needs Improvement):** Dưới tiêu chuẩn, cần cảnh báo.
- Dữ liệu này là căn cứ vững chắc để Ban Giám đốc xét duyệt ngân sách Thưởng cuối năm.

---
**LỜI KẾT**
Hệ thống HRM Enterprise là một công cụ mạnh mẽ. Bất kỳ lỗi nào xảy ra trong quá trình sử dụng đều được hệ thống ngăn chặn bởi các cảnh báo đỏ. Hãy tuân thủ đúng luồng (Workflow) từ Khởi tạo Phòng ban -> Tuyển dụng -> Nhập Hợp đồng -> Chấm công -> Tính lương để hệ thống phát huy 100% năng lực tự động hóa. Cảm ơn Quý khách!
