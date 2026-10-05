# Phân tích nghiệp vụ: Module Tổ chức (Organization)

## 1. Giới thiệu chung
- **Mục đích nghiệp vụ**: Đây là module nền móng của phần mềm HRM. Mục tiêu của nó là số hóa mô hình tổ chức thực tế của doanh nghiệp (Từ Ban Lãnh đạo xuống các Khối / Ban / Phòng / Đội / Nhóm) và thiết lập danh mục các chức danh công việc hợp lệ.
- **Đối tượng sử dụng (Vai trò)**: Ban Lãnh đạo (Xem tổng quan cơ cấu và định biên), Trưởng phòng Nhân sự & Chuyên viên C&B (Thiết lập, tìm kiếm, lọc và phân bổ vị trí), Tất cả nhân viên (Tra cứu sơ đồ công ty và thông tin phòng ban).
- **Phạm vi (In scope)**: Quản lý sơ đồ phòng ban đa cấp, Quản lý danh mục chức danh/ngạch lương, Tìm kiếm & Lọc đa chiều, Cơ chế Khóa/Mở khóa (Soft Lock) đóng băng danh mục, và Trực quan hóa sơ đồ tổ chức dạng cây.
- **Ngoài phạm vi (Out of scope)**: Việc quyết định "Ai sẽ làm chức vụ gì, ở phòng nào" thuộc về phân hệ Hồ sơ Nhân sự (Core HR). Phân hệ Tổ chức cung cấp danh mục dùng chung (Master Data) để các module khác kế thừa.

---

## 2. Các đối tượng nghiệp vụ cốt lõi (Core Entities)

| Đối tượng (Thực thể) | Ý nghĩa nghiệp vụ trong thực tế | Các thông tin quan trọng cần quản lý | Các ràng buộc quản trị cốt lõi |
|---|---|---|---|
| **Phòng ban** (Department) | Một đơn vị tập thể trong công ty (Ví dụ: Khối Kinh Doanh, Phòng IT, Ban Kiểm soát). | - `Mã phòng`: (Bắt buộc, Duy nhất toàn hệ thống)<br>- `Tên phòng`: (Bắt buộc)<br>- `Phòng ban cha`: Xác định cấp trên quản lý trực tiếp.<br>- `Định mức nhân sự`: Số người tối đa được duyệt.<br>- `Trạng thái`: Hoạt động (`ACTIVE`) / Tạm khóa (`INACTIVE`). | - Tạo thành sơ đồ hình cây (Phòng con báo cáo cho Phòng cha).<br>- Chặn tạo vòng lặp đệ quy (không chọn con làm cha).<br>- Cấm xóa cứng nếu phòng đang có nhân sự làm việc. |
| **Vị trí công tác** (Position) | Một ngạch hoặc chức danh công việc cụ thể (Ví dụ: Chuyên viên Tuyển dụng, Trưởng nhóm IT). | - `Mã vị trí`: (Bắt buộc, Duy nhất)<br>- `Tên chức danh`: (Bắt buộc)<br>- `Cấp bậc`: Thực tập sinh, Nhân viên, Quản lý...<br>- `Dải lương`: Mức lương trần (`maxSalary`) và sàn (`minSalary`).<br>- `Trạng thái`: Đang áp dụng / Ngừng áp dụng. | - Một chức danh phải gắn liền với một Phòng ban cụ thể.<br>- Ràng buộc `minSalary <= maxSalary`.<br>- Không được xóa nếu đang có nhân sự đảm nhiệm. |

---

## 3. Ma trận phân rã chức năng chi tiết (Functional Breakdown Matrix)

| Nhóm chức năng | Mã Use Case | Tên nghiệp vụ con | Mục đích & Mô tả chi tiết | Tác nhân chính |
|---|---|---|---|---|
| **1. Quản lý Phòng ban** | UC-ORG-01-01 | Thêm mới phòng ban | Khởi tạo đơn vị mới, thiết lập vị trí trong cây phân cấp và chỉ tiêu định mức tuyển dụng. | HR Manager, Admin |
| | UC-ORG-01-02 | Chỉnh sửa phòng ban | Đổi tên, thay đổi trưởng phòng, điều chỉnh định biên quota, chuyển đổi phòng ban cha. | HR Manager, Admin |
| | **UC-ORG-01-03** | **Khóa / Mở khóa phòng ban** | **Đóng băng hoạt động (Soft Lock) phòng ban tạm ngưng hoặc giải thể mềm mà không làm mất lịch sử nhân sự.** | HR Manager, Admin |
| | **UC-ORG-01-04** | **Tìm kiếm & Lọc phòng ban** | **Tìm kiếm real-time theo Mã/Tên phòng ban, Lọc theo trạng thái Hoạt động / Tạm khóa, Phân trang 10 dòng/trang.** | HR Staff, HR Manager |
| | UC-ORG-01-05 | Xóa phòng ban (Hard Delete) | Xóa triệt để phòng ban rỗng (kiểm tra an toàn: số nhân viên = 0 và không có phòng con). | HR Manager, Admin |
| | UC-ORG-01-06 | Giám sát định biên nhân sự | Thống kê số lượng nhân viên thực tế đang ngồi ở từng phòng so với Quota được duyệt, tính tỷ lệ lấp đầy. | Ban Lãnh đạo, HR |
| **2. Quản lý Vị trí công tác** | UC-ORG-02-01 | Thêm mới vị trí | Thiết lập chức danh mới, quy định cấp bậc nghề nghiệp và phân bổ về phòng ban trực thuộc. | HR Manager, Admin |
| | UC-ORG-02-02 | Chỉnh sửa vị trí | Cập nhật tên chức danh, điều chỉnh cấp bậc thâm niên, sửa đổi bản mô tả công việc (JD). | HR Manager, Admin |
| | **UC-ORG-02-03** | **Khóa / Mở khóa vị trí** | **Tạm dừng tuyển dụng chức danh (chuyển sang `INACTIVE`), ẩn khỏi form Onboarding nhân viên mới.** | HR Manager, Admin |
| | **UC-ORG-02-04** | **Tìm kiếm & Lọc vị trí đa chiều** | **Tìm theo tên/mã chức danh, Lọc kết hợp theo Phòng ban và theo Cấp bậc (Staff, Lead, Manager, Director).** | HR Staff, C&B |
| | UC-ORG-02-05 | Kiểm soát dải lương (Salary Band) | Ràng buộc mức lương sàn không vượt quá mức lương trần (`minSalary <= maxSalary`) để kiểm soát ngân sách. | C&B, HR Manager |
| | UC-ORG-02-06 | Xóa vị trí an toàn | Xóa chức danh khi chưa từng có nhân viên nào được bổ nhiệm (`employeeCount = 0`). | HR Manager, Admin |
| **3. Trực quan hóa Sơ đồ** | UC-ORG-03-01 | Xem cây phân cấp tổ chức | Hiển thị toàn cảnh cơ cấu công ty dạng đồ thị cây (Tree Chart) tương tác trực quan. | Toàn bộ nhân viên |
| | UC-ORG-03-02 | Thu gọn / Mở rộng nhánh cây | Cho phép bấm vào các nút phòng ban để phóng to, thu nhỏ các nhánh phòng ban con trực thuộc. | Toàn bộ nhân viên |
| | UC-ORG-03-03 | Xem thẻ chi tiết nhân sự trên Node | Click vào từng Node phòng ban để xem danh sách nhân sự hiện tại, chức vụ và trưởng bộ phận. | Ban Lãnh đạo, HR |

---

## 4. Quy tắc nghiệp vụ cốt lõi toàn module

1. **Nguyên tắc "Cấu trúc cây linh hoạt & Chống vòng lặp"**:
   - Doanh nghiệp có thể liên tục tái cấu trúc (sáp nhập, chia tách). Hệ thống cho phép cập nhật `parentId` bất cứ lúc nào.
   - Bắt buộc kiểm tra chuỗi phả hệ: Cấm tuyệt đối chọn phòng ban con hoặc chính nó làm phòng ban cha để tránh tạo vòng lặp vô tận (Infinite Loop).
2. **Nguyên tắc "Khóa nghiệp vụ thay vì xóa cứng"**:
   - Trong môi trường doanh nghiệp thực tế, các danh mục phòng ban và chức danh mang tính lịch sử pháp lý (gắn liền với bảng lương, hợp đồng lao động cũ, hồ sơ bảo hiểm).
   - Khi phòng ban hoặc chức danh không còn sử dụng, nghiệp vụ chuẩn là **Khóa (Chuyển trạng thái `INACTIVE`)** thay vì Xóa cứng.
3. **Nguyên tắc "Bảo vệ an toàn dữ liệu nhân sự"**:
   - Nếu thực hiện xóa cứng (Hard Delete), hệ thống kích hoạt cơ chế phòng vệ nghiêm ngặt: Kiểm tra số lượng nhân sự liên kết (`employee.count`). Nếu lớn hơn 0, hệ thống từ chối xóa và yêu cầu HR phải điều chuyển nhân sự trước.

---

## 5. Tương tác với các phân hệ (Module) khác

- **Với Module Tuyển dụng (Recruitment & ATS)**:
  - Vị trí và Phòng ban bị **Khóa (`INACTIVE`)** sẽ tự động bị loại khỏi danh mục đăng tin tuyển dụng (Job Posting).
  - Định mức nhân sự (`quota`) được dùng để kiểm tra tự động xem phòng ban có được phép đề xuất tuyển thêm người hay không.
- **Với Module Hồ sơ Nhân viên (Core HR)**:
  - Cung cấp danh mục các phòng ban và vị trí đang **Hoạt động (`ACTIVE`)** để chọn khi tiếp nhận nhân viên mới (Onboarding) hoặc điều chuyển công tác.
- **Với Module Tiền lương (Payroll)**:
  - Dải lương (Min - Max) của Vị trí công tác được sử dụng để kiểm soát khung lương thỏa thuận khi tạo Hợp đồng lao động, cảnh báo vượt trần quỹ lương.
