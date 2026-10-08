# Usecase: UC-ESS-05 - Mục tiêu & Đánh giá Hiệu suất KPI (My Performance & KPI Self-Service)

## 1. Giới thiệu chức năng
- **Mục đích**: Cung cấp cho nhân viên công cụ theo dõi các chỉ tiêu công việc (KPI) được giao trong từng chu kỳ (Quý/Năm), nắm bắt trọng số % của từng mục tiêu, giám sát tiến độ thực hiện và chủ động thực hiện tự đánh giá kết quả (Self-assessment) trước khi Quản lý trực tiếp chấm điểm chính thức.
- **Actor (Tác nhân)**: Nhân viên (Employee) - Đã đăng nhập vào hệ thống với vai trò `EMPLOYEE`.
- **Điều kiện tiên quyết**: Quản lý bộ phận hoặc Quản trị viên HR đã thiết lập và gán bảng chỉ tiêu KPI cho nhân viên.

### Danh mục các chức năng con (Sub-features):
1. **UC-ESS-05-01: Xem Danh mục Mục tiêu & Trọng số KPI theo Chu kỳ**: Chọn chu kỳ đánh giá (Quý 1, Quý 2, Quý 3...), xem tiêu đề mục tiêu, chỉ tiêu đo lường và tỷ trọng % đóng góp vào tổng điểm.
2. **UC-ESS-05-02: Giám sát Tiến độ Hoàn thành & Điểm Tự đánh giá**: Xem thanh tiến độ % hoàn thành, điểm tự chấm (thang điểm 10) và điểm tổng kết có trọng số (Weighted Score).

---

## 2. Dữ liệu nghiệp vụ (Data Structure & Parameters)

| Tên trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `quarter` | String | Chu kỳ đánh giá (VD: `Q3-2026`) |
| `title` | String | Tên mục tiêu công việc (VD: "Tối ưu hóa hiệu năng hệ thống") |
| `target` | String | Tiêu chí đo lường cụ thể (VD: "Giảm độ trễ API < 200ms") |
| `weight` | Number | Trọng số phần trăm (Tổng các trọng số = 100%) |
| `progress` | Number (0 - 100) | Tiến độ hoàn thành thực tế tính theo % |
| `selfScore` | Number (0 - 10) | Điểm số nhân viên tự chấm |
| `comment` | String | Ghi chú minh chứng kết quả đạt được |

---

## 3. Quy tắc nghiệp vụ (Business Rules)

| Mã Quy tắc | Tình huống nghiệp vụ | Cách hệ thống xử lý |
|---|---|---|
| **BR-KPI-01** | **Tổng trọng số 100% (Full Weight Conservation)** | Tổng trọng số của tất cả các chỉ tiêu trong một chu kỳ bắt buộc phải bằng đúng 100%. |
| **BR-KPI-02** | **Công thức Điểm Tổng kết (Weighted Score Formula)** | $\text{Tổng điểm} = \sum (\text{Điểm tự chấm}_i \times \text{Trọng số}_i / 100)$. Thang điểm chuẩn 10.0. |
| **BR-KPI-03** | **Xếp loại Hiệu suất Tự động (Performance Grade Mapping)** | Điểm $\ge 9.0$: Loại A (Xuất sắc); $8.0 - 8.9$: Loại B (Tốt/Đạt); $7.0 - 7.9$: Loại C (Cần cải thiện); $< 7.0$: Loại D. |

---

## 4. Bảng đặc tả chi tiết Use Case

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-ESS-05`<br/>- **UC Name**: Mục tiêu & Đánh giá Hiệu suất (My KPI & Performance)<br/>- **Actor**: Nhân viên (Employee)<br/>- **Priority**: High |
| **2** | **Trigger** | Nhân viên nhấp vào mục **"Mục tiêu & Đánh giá KPI"** trên menu bên trái. |
| **3** | **Pre-condition** | Nhân viên đã đăng nhập vào Cổng ESS (`/employee`). |
| **4** | **Post-condition** | Giao diện hiển thị tổng điểm có trọng số, tiến độ trung bình và danh sách các thẻ chỉ tiêu chi tiết. |
| **5** | **Main Flow** | 1. Hệ thống điều hướng đến `/employee/kpi`.<br/>2. Hiển thị Dropdown chọn chu kỳ: Quý 3/2026, Quý 2/2026...<br/>3. Hiển thị 2 Thẻ tổng quan nổi bật: Thẻ Điểm tự đánh giá tổng kết (kèm xếp loại) và Thẻ Tiến độ hoàn thành trung bình.<br/>4. Trình bày danh sách các mục tiêu: Mỗi mục tiêu có Badge mã số, Badge trọng số %, thanh tiến độ đổi màu theo % hoàn thành, điểm tự chấm và phần ghi chú kết quả.<br/>5. Dữ liệu được tính toán tự động đảm bảo tính minh bạch, công bằng. |
| **6** | **Acceptance Criteria** | - Nhân viên theo dõi được trực quan toàn bộ các chỉ tiêu được giao.<br/>- Tiến độ $\ge 90\%$ tự động đổi sang màu xanh thành công. |
