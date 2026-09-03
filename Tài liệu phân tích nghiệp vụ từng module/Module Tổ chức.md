# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ - MODULE TỔ CHỨC (ORGANIZATION MODULE)

## 1. Giới thiệu chung
**Module Tổ chức** đóng vai trò là "xương sống" của toàn bộ hệ thống Phần mềm Quản trị Nhân sự (HRM). Module này cung cấp công cụ để thiết lập và số hóa cấu trúc phân bổ nguồn nhân lực của doanh nghiệp, từ Sơ đồ phòng ban dạng cây (Hierarchy) cho đến Khung chức danh, cấp bậc và khung lương chuẩn mực.

**Đối tượng sử dụng chính:**
- Ban Giám đốc (C-Level): Nhìn bao quát bức tranh nhân sự toàn công ty.
- Quản lý Nhân sự (HR Manager): Trực tiếp thao tác, setup cơ cấu, phòng ban, vị trí để chuẩn bị cho công tác Tuyển dụng và Quản lý hồ sơ.

## 2. Cấu trúc dữ liệu chính
Module Tổ chức xoay quanh hai thực thể (Entities) cốt lõi:
1. **Phòng ban (Department):** Đại diện cho các Đơn vị / Khối / Phòng / Tổ / Nhóm trong công ty.
2. **Vị trí / Chức danh (Position):** Đại diện cho các Chức danh nghề nghiệp cụ thể và cấp bậc chuyên môn tương ứng trong từng phòng ban.

---

## 3. Phân tích Nghiệp vụ: Quản lý Phòng ban (Department)

### 3.1. Mục đích
Cho phép doanh nghiệp thiết lập cấu trúc tổ chức dưới dạng **Cây phân cấp (Tree Hierarchy)**. Thể hiện rõ mối quan hệ Cha - Con (Khối -> Phòng -> Tổ -> Nhóm).

### 3.2. Các thông tin quản lý
- **Mã phòng ban (Code):** Viết tắt, duy nhất (VD: MKT, DEV, HT). Dùng để làm tiền tố tạo mã nhân viên hoặc dễ tra cứu.
- **Tên phòng ban (Name):** Tên đầy đủ hiển thị.
- **Người đại diện:** Thông tin người đứng đầu đơn vị đó (Không bắt buộc là chức danh Trưởng phòng, có thể là Giám đốc Khối, Tổ trưởng...).
- **Phòng ban trực thuộc (Parent ID):** Xác định phòng ban cấp trên của phòng ban này. Nếu để trống, phòng ban đó thuộc cấp cao nhất (Ngang hàng Công ty gốc).
- **Trạng thái:** Hoạt động / Ngưng hoạt động.

### 3.3. Quy tắc nghiệp vụ (Business Rules) cốt lõi
1. **Thiết kế sơ đồ hình cây linh hoạt:** Hệ thống cho phép lồng ghép không giới hạn số lượng các cấp phòng ban (N-levels deep).
2. **Thống kê số lượng nhân sự thông minh (Đệ quy):**
   - **Số lượng trực tiếp:** Là những nhân viên được gán trực tiếp vào phòng ban đó (Ví dụ: Trưởng phòng, Thư ký phòng).
   - **Tổng nhân sự toàn nhánh:** Trên Sơ đồ tổ chức, hệ thống tự động cộng dồn số lượng nhân viên của phòng ban hiện tại VÀ toàn bộ các phòng ban con/cháu bên dưới nhánh đó. Điều này giúp Ban giám đốc nhìn ra ngay "Khối Sản xuất đang có tổng cộng bao nhiêu con người" mà không cần phải tự cộng tay từng Tổ phát triển, Tổ kiểm thử.
3. **Logic Xóa phòng ban:**
   - Khi xóa một phòng ban, hệ thống sẽ cảnh báo. Nếu trong phòng ban đang có nhân viên hoặc có phòng ban con trực thuộc, hệ thống sẽ yêu cầu tháo gỡ liên kết trước khi cho phép xóa (đảm bảo tính toàn vẹn dữ liệu).

---

## 4. Phân tích Nghiệp vụ: Quản lý Vị trí & Chức danh (Position)

### 4.1. Mục đích
Tách biệt hoàn toàn khái niệm **"Bộ phận làm việc" (Department)** và **"Chức danh công việc" (Position)**. Một phòng ban có thể có nhiều chức danh khác nhau, và một chức danh có thể được phân cấp bậc chi tiết.

### 4.2. Các thông tin quản lý
- **Mã vị trí & Tên chức danh:** VD: DEV_FE_1 (Lập trình viên Frontend).
- **Phòng ban trực thuộc:** Xác định Vị trí này thuộc biên chế của Phòng ban nào. (Nếu để trống, đây là vị trí dùng chung toàn công ty).
- **Cấp bậc (Level):** Phân hạng mức độ thâm niên/chuyên môn.
- **Khung lương (Min/Max Salary):** Căn cứ để HR offer lương khi tuyển dụng hoặc làm trần giới hạn khi tăng lương định kỳ.

### 4.3. Quy tắc nghiệp vụ (Business Rules) cốt lõi
1. **Phân cấp Level chuyên sâu:** 
   - Thay vì tạo 1 chức danh "Lập trình viên Frontend" chung chung, hệ thống khuyến khích tạo thành một lộ trình nghề nghiệp (Career Path) chuẩn mực: *Thực tập sinh -> Fresher -> Junior -> Middle -> Senior*.
   - Đối với cấp Quản lý, cấp bậc thường là *Manager, Director hoặc C-Level*.
2. **Liên kết với Module Khác:**
   - Khi một Hồ sơ nhân viên (Employee) mới được tạo, bắt buộc phải chỉ định Nhân viên đó ngồi vào ghế (Position) nào trong công ty.
   - Position là nền tảng để tạo Yêu cầu tuyển dụng (Job Posting) sau này.

## 5. Tổng kết Lợi ích của Module Tổ chức
- Xóa bỏ việc quản lý cơ cấu bằng Excel thủ công.
- Tự động hóa hoàn toàn việc báo cáo số lượng Headcount theo từng nhánh phòng ban.
- Cung cấp một Sơ đồ tổ chức trực quan (Org Chart) tự động vẽ dựa trên dữ liệu thật theo thời gian thực.
- Thiết lập bộ khung Vị trí - Chức danh chuẩn mực làm tiền đề để tính lương, đánh giá KPI và lộ trình thăng tiến sau này.
