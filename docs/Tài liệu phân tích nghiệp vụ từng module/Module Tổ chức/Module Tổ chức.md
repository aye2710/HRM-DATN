# Phân tích nghiệp vụ: Module Tổ chức (Organization)

## 1. Giới thiệu chung
- **Mục đích nghiệp vụ**: Đây là module nền móng của phần mềm HRM. Mục tiêu của nó là số hóa mô hình tổ chức thực tế của doanh nghiệp (Từ Ban Lãnh đạo xuống các Phòng/Ban/Nhóm) và thiết lập danh mục các chức danh công việc hợp lệ.
- **Đối tượng sử dụng (Vai trò)**: Ban Lãnh đạo (Xem tổng quan), Trưởng phòng Nhân sự (Thiết lập và cấu hình cơ cấu), Tất cả nhân viên (Xem sơ đồ công ty).
- **Phạm vi (In scope)**: Quản lý sơ đồ phòng ban đa cấp, Quản lý danh mục chức danh/ngạch lương, và Trực quan hóa sơ đồ tổ chức.
- **Ngoài phạm vi (Out of scope)**: Việc quyết định "Ai sẽ làm chức vụ gì, ở phòng nào" thuộc về phân hệ Hồ sơ Nhân sự (Core HR). Phân hệ Tổ chức chỉ cung cấp danh mục (Master Data) để chọn.

## 2. Các đối tượng nghiệp vụ cốt lõi (Core Entities)

| Đối tượng (Thực thể) | Ý nghĩa nghiệp vụ trong thực tế | Các thông tin quan trọng cần quản lý | Các ràng buộc quản trị |
|----------|---------------------------------|--------------------------------------|------------------------|
| **Phòng ban** (Department) | Một đơn vị tập thể trong công ty (Ví dụ: Khối Kinh Doanh, Phòng IT). | - `Mã phòng`: (Bắt buộc, Duy nhất)<br>- `Tên phòng`: (Bắt buộc)<br>- `Phòng ban cha`: Dùng để xác định cấp trên quản lý trực tiếp.<br>- `Định mức nhân sự`: Số người tối đa được phép tuyển. | - Tạo thành một sơ đồ hình cây (Phòng con báo cáo cho Phòng cha).<br>- Không được phép xóa nếu trong phòng đang có người làm việc. |
| **Vị trí công tác** (Position) | Một ngạch hoặc chức danh công việc cụ thể (Ví dụ: Chuyên viên Tuyển dụng, Trưởng nhóm IT). | - `Mã vị trí`: (Bắt buộc, Duy nhất)<br>- `Tên chức danh`: (Bắt buộc)<br>- `Cấp bậc`: Thực tập sinh, Nhân viên, Quản lý...<br>- `Dải lương`: Mức lương trần và sàn để kiểm soát chi phí. | - Một chức danh phải gắn liền với một Phòng ban cụ thể.<br>- Không được xóa chức danh nếu đang có nhân sự giữ chức danh này. |

## 3. Danh sách chức năng con

| Mã | Tên chức năng | Mô tả ngắn | Actor | Link tới file chi tiết |
|---|---|---|---|---|
| UC-ORG-01 | Quản lý Danh mục Phòng ban | Khởi tạo, cập nhật tên, sửa định mức tuyển dụng và tổ chức lại cấp bậc của các phòng ban. | Admin, HR | [Chuc-nang-Quan-ly-Phong-ban.md](./Chuc-nang-Quan-ly-Phong-ban.md) |
| UC-ORG-02 | Quản lý Vị trí công tác | Khởi tạo chức danh mới, quy định mức lương và phân bổ chức danh đó về các phòng ban. | Admin, HR | [Chuc-nang-Quan-ly-Vi-tri.md](./Chuc-nang-Quan-ly-Vi-tri.md) |
| UC-ORG-03 | Xem Sơ đồ Tổ chức | Bức tranh toàn cảnh về cơ cấu công ty dạng sơ đồ cây, giúp nhân sự hiểu rõ bộ máy vận hành. | Tất cả | [Chuc-nang-Xem-So-do-To-chuc.md](./Chuc-nang-Xem-So-do-To-chuc.md) |

## 4. Quy tắc chung toàn module
- **Nguyên tắc "Cấu trúc cây linh hoạt"**: Doanh nghiệp có thể liên tục tái cơ cấu (Ví dụ: Sáp nhập phòng A vào phòng B). Hệ thống cho phép cập nhật "Phòng ban cha" bất kỳ lúc nào để phản ánh ngay lập tức thay đổi cơ cấu.
- **Nguyên tắc "Bảo vệ an toàn dữ liệu nhân sự"**: Các danh mục phòng ban và chức danh mang tính lịch sử. Dù công ty bỏ một chức danh, hệ thống cấm xóa cứng chức danh đó nếu vẫn còn Hợp đồng hoặc Nhân sự đang liên kết tới. (Buộc HR phải điều chuyển nhân sự sang chức danh khác trước khi xóa).

## 5. Tương tác với các phân hệ (Module) khác
- **Với Module Hồ sơ Nhân viên (Core HR)**: Cung cấp danh sách (Dropdown) Phòng ban và Chức danh để nhân sự chọn khi làm thủ tục Onboarding nhân viên mới.
- **Với Module Tuyển dụng (ATS)**: ATS sử dụng thông số "Định mức nhân sự" (Quota) của Phòng ban để biết khi nào phòng đó được phép đăng tin tuyển dụng.
- **Với Module Tiền lương (Payroll)**: Dải lương (Min-Max) quy định tại Chức danh dùng để rà soát xem mức lương thỏa thuận của nhân sự có bị vượt khung ngân sách hay không.

## 6. Danh sách [CẦN XÁC NHẬN] từ phía Nghiệp vụ
- [CẦN XÁC NHẬN 1]: Hiện tại khi thay đổi thông tin Phòng ban, hệ thống không tự động nhắc nhở việc mã Phòng ban bị trùng (Chỉ báo lỗi kỹ thuật). Nghiệp vụ có cần yêu cầu hiển thị cảnh báo đỏ trực tiếp trên màn hình ngay khi HR gõ mã trùng không?
- [CẦN XÁC NHẬN 2]: Chức danh "Trưởng phòng" (Manager) hiện tại đang được nhập bằng tay (Text) trong thông tin Phòng ban. Nghiệp vụ có muốn liên kết chặt chẽ chọn đích danh 1 Nhân viên cụ thể làm Trưởng phòng để sau này phân quyền duyệt phép không?
