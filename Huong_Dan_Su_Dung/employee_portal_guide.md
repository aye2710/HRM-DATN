# 📖 TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT - CỔNG NHÂN VIÊN (EMPLOYEE PORTAL)

---

## MỞ ĐẦU
Chào mừng bạn đến với **Cổng Thông tin Dành cho Nhân viên (Employee Self-Service Portal)** thuộc Hệ thống HRM Enterprise. 

**Ý nghĩa của hệ thống:**
Trước đây, mọi thủ tục từ việc xin nghỉ phép, nộp giấy tờ ốm đau, đến việc thắc mắc về tiền lương, bạn đều phải nhắn tin riêng cho Quản lý hoặc điền các mẫu đơn giấy (hard-copy) nộp cho phòng Nhân sự. Quá trình này tốn rất nhiều thời gian và dễ bị thất lạc. 
Sự ra đời của Cổng Nhân viên sẽ giúp bạn số hóa (digitalize) toàn bộ 100% các nhu cầu cá nhân. Bạn có thể tự chủ động tương tác với công ty một cách minh bạch, an toàn và nhanh chóng nhất.

---

## CHƯƠNG 1. BẢO MẬT VÀ ĐĂNG NHẬP

### 1.1. Cách truy cập vào hệ thống
- Mở trình duyệt web của bạn và gõ đường dẫn trang chủ nội bộ của công ty (Ví dụ: `http://localhost:5173/`).
- Tại trung tâm màn hình, bạn sẽ thấy ô "Đăng nhập vào Hệ thống Quản trị".

### 1.2. Thao tác Đăng nhập
Mỗi nhân viên khi ký hợp đồng chính thức sẽ được phòng Nhân sự (HR) hoặc phòng Công nghệ (IT) cấp phát một bộ Tài khoản.
1. Nhập tên tài khoản (Thường là mã nhân viên. Ví dụ: `emp01`).
2. Nhập mật khẩu.
3. Bấm **"Đăng nhập hệ thống"**.
4. **Cơ chế nhận diện:** Hệ thống sở hữu trí tuệ nhân tạo nhận diện phân quyền. Khi bạn đăng nhập, nó biết bạn là "Nhân viên bình thường", do đó nó sẽ không cho bạn nhìn thấy dữ liệu lương của người khác, mà sẽ đưa bạn thẳng vào không gian làm việc riêng tư (Employee Portal) của riêng bạn.

---

## CHƯƠNG 2. BẢO DANH CHẤM CÔNG (DASHBOARD & TIMEKEEPING)

Ngay sau khi đăng nhập, màn hình đầu tiên bạn thấy chính là **Tổng quan (Dashboard)**. Đây cũng là nơi bạn thực hiện nghiệp vụ quan trọng nhất mỗi ngày: Chấm công.

### 2.1. Thao tác Check-in (Vào ca làm)
**Ý nghĩa:** Báo cáo cho hệ thống biết bạn đã có mặt tại văn phòng, bắt đầu tính lương cho ngày hôm nay.
- **Bước 1:** Khi vừa đến công ty, hãy đăng nhập ngay vào hệ thống.
- **Bước 2:** Nhìn lên góc phải màn hình Dashboard, bạn sẽ thấy nút màu xanh **"Check-in"**.
- **Bước 3:** Nhấp vào nút đó. Hệ thống sẽ ghi nhận chính xác tới từng giây thời điểm hiện tại và lưu vào cơ sở dữ liệu. 
- *Lưu ý:* Nếu bạn check-in trễ hơn giờ quy định, hệ thống sẽ tự động gán nhãn "Late" (Đi muộn) và báo cáo về cho quản lý. Nút "Check-in" sau khi bấm sẽ mờ đi để chống bấm trùng.

### 2.2. Thao tác Check-out (Kết thúc ca làm)
**Ý nghĩa:** Xác nhận thời gian kết thúc công việc để hệ thống đóng sổ ngày công.
- **Bước 1:** Trước khi ra về, đăng nhập lại vào hệ thống.
- **Bước 2:** Bấm nút màu cam **"Check-out"**.
- Hệ thống ghi nhận và tính toán ra bạn đã làm việc tổng cộng bao nhiêu giờ trong ngày hôm nay.

### 2.3. Các chỉ số cá nhân
Ngay bên dưới phần chấm công, hệ thống cung cấp các Thẻ thông tin (Cards) sinh động để bạn tự theo dõi hiệu suất của mình mà không cần hỏi HR:
- **Số ngày đi làm trong tháng:** Hiển thị số công bạn đã tích lũy được.
- **Đi muộn / Về sớm:** Thống kê số lần vi phạm kỷ luật thời gian.
- **Quỹ phép năm:** Số ngày nghỉ có hưởng lương còn lại của bạn trong năm.

---

## CHƯƠNG 3. GỬI ĐƠN XIN NGHỈ PHÉP (LEAVE REQUESTS)

Phân hệ này giúp bạn gửi đơn xin vắng mặt tới cấp trên chỉ bằng vài cú click chuột. Mọi đơn từ đều được lưu lại làm bằng chứng điện tử.

### 3.1. Hướng dẫn tạo Đơn xin nghỉ
1. Trên thanh menu bên trái, nhấp chuột vào mục **"Xin nghỉ phép"**.
2. Nhấp vào nút có dấu cộng **"Tạo đơn nghỉ phép"**.
3. Một biểu mẫu (Form) xuất hiện, bạn cần cung cấp đầy đủ thông tin:
   - **Loại nghỉ phép:** Bấm mũi tên xổ xuống và chọn (Ví dụ: *Nghỉ phép năm, Nghỉ ốm, Nghỉ thai sản, Nghỉ không lương*). Mỗi loại đều có quy định trừ lương khác nhau.
   - **Từ ngày & Đến ngày:** Sử dụng biểu tượng tờ lịch để chọn chính xác khoảng thời gian bạn muốn vắng mặt.
   - **Lý do (Bắt buộc):** Trình bày ngắn gọn lý do xin nghỉ. Ví dụ: *"Gia đình có việc đột xuất"*.
4. Bấm nút **"Gửi yêu cầu"**.

### 3.2. Theo dõi kết quả phê duyệt
- Sau khi gửi, đơn của bạn sẽ xuất hiện ở bảng bên dưới màn hình với trạng thái màu vàng: **"Đang chờ duyệt" (Pending)**. Quản lý trực tiếp của bạn sẽ nhận được thông báo về lá đơn này.
- **Nếu Quản lý Đồng ý:** Trạng thái đơn đổi thành màu xanh lá **"Đã duyệt" (Approved)**. Chúc mừng, bạn được phép nghỉ và hệ thống đã tự động ghi chú vào bảng công.
- **Nếu Quản lý Từ chối:** Trạng thái đơn đổi thành màu đỏ **"Từ chối" (Rejected)**. Bạn sẽ phải đi làm bình thường.

---

## CHƯƠNG 4. TRA CỨU PHIẾU LƯƠNG (PAYSLIPS)

Đây là tính năng được yêu thích nhất. Bạn có thể xem chi tiết từng đồng lương của mình minh bạch và rõ ràng.

### 4.1. Cách tra cứu lương hàng tháng
1. Từ menu bên trái, chọn **"Phiếu lương"**.
2. Phía trên cùng có công cụ Bộ lọc thời gian. Bạn chọn **Tháng** và **Năm** tương ứng (Ví dụ: Chọn Tháng 9 - Năm 2026).
3. Thông tin phiếu lương sẽ hiển thị chi tiết (Breakdown) thành các nhóm:
   - **Nhóm Thu nhập:** Tiền lương cơ bản, Tiền thưởng (nếu có), Phụ cấp.
   - **Nhóm Dữ liệu công:** Tổng số ngày công thực tế hệ thống đếm được từ các lần bạn check-in/check-out.
   - **Nhóm Khấu trừ:** Các khoản tiền bị trừ như Tiền phạt đi muộn, Bảo hiểm Xã hội (BHXH), Thuế Thu nhập Cá nhân (PIT).
   - **Thực Lãnh (Net Salary):** Con số to, in đậm ở góc màn hình. Đây chính xác là số tiền công ty sẽ chuyển khoản vào tài khoản ngân hàng của bạn.

### 4.2. Bảo mật thông tin lương
- Thông tin trên phiếu lương là **TUYỆT MẬT (Confidential)**.
- Hệ thống đã thiết kế tường lửa bảo mật, bạn chỉ có thể truy vấn và xem dữ liệu của chính ID tài khoản của bạn. Ngay cả khi bạn biết mã nhân viên của đồng nghiệp, bạn cũng không có quyền xem lương của họ.
- Tuyệt đối không chia sẻ mật khẩu đăng nhập cổng Employee Portal cho bất kỳ ai.

---
*Cảm ơn bạn đã đọc kỹ hướng dẫn. Chúc bạn có một trải nghiệm làm việc số hóa tuyệt vời cùng công ty!*
