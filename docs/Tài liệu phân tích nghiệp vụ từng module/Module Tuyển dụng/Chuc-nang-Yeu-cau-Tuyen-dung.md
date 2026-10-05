# Usecase: UC-REC-01 - Quản lý Yêu cầu Tuyển dụng (Job Requisitions)

## 1. Giới thiệu chức năng
- **Mục đích**: Cung cấp công cụ cho Phòng Nhân sự và Trưởng các bộ phận khởi tạo, quản lý và theo dõi tiến độ các chiến dịch tuyển dụng (Job Requisitions / Postings). Hệ thống đảm bảo mọi yêu cầu tuyển dụng đều gắn liền với định biên nhân sự của Phòng ban và Vị trí (Position) cụ thể, kiểm soát chặt chẽ ngân sách lương và hạn ngạch tuyển dụng (Headcount).
- **Actor (Tác nhân)**: Trưởng bộ phận (Department Head), Chuyên viên Tuyển dụng (Recruiter), Trưởng phòng Nhân sự (HR Manager), Quản trị viên (Admin).
- **Điều kiện tiên quyết**: Người dùng đã đăng nhập và có quyền `MANAGE_RECRUITMENT` hoặc vai trò `ADMIN` / `HR_MANAGER` / `RECRUITER`.

### Danh mục các chức năng con (Sub-features):
1. **UC-REC-01-01: Thêm mới Yêu cầu tuyển dụng**: Tạo chiến dịch tuyển dụng mới liên kết trực tiếp với Phòng ban và Vị trí.
2. **UC-REC-01-02: Chỉnh sửa Yêu cầu tuyển dụng**: Điều chỉnh chỉ tiêu số lượng (Amount), hạn nộp hồ sơ (Deadline), mô tả công việc và mức lương.
3. **UC-REC-01-03: Đóng / Mở lại chiến dịch tuyển dụng**: Đóng chiến dịch khi đủ chỉ tiêu hoặc hết hạn; kích hoạt lại khi có nhu cầu bổ sung.
4. **UC-REC-01-04: Tìm kiếm, Lọc & Giám sát tiến độ lấp đầy (Fill Rate)**: Tra cứu nhanh theo từ khóa, lọc theo phòng ban/trạng thái và hiển thị thanh tiến độ tuyển dụng trực quan.
5. **UC-REC-01-05: Xóa Yêu cầu tuyển dụng (Hard Delete)**: Xóa triệt để các chiến dịch nháp hoặc nhập sai (ràng buộc chưa có ứng viên nộp hồ sơ).

---

## 2. Dữ liệu nghiệp vụ đầu vào (Input Data & Parameters)

### 2.1. Biểu mẫu Yêu cầu tuyển dụng (Job Requisition Form)
| Tên trường | Kiểu dữ liệu | Tính chất | Ý nghĩa nghiệp vụ & Ràng buộc |
|---|---|---|---|
| `Tiêu đề chiến dịch` (title) | Chuỗi (String) | Bắt buộc | Tên hiển thị của vị trí tuyển dụng (VD: `Senior Backend Developer NodeJS`). Tối đa 255 ký tự. |
| `Vị trí công tác` (positionId) | UUID / Chuỗi | Bắt buộc | Vị trí việc làm chuẩn từ Danh mục Vị trí (Module Tổ chức). |
| `Phòng ban` (departmentId) | UUID / Chuỗi | Tự động | Phòng ban trực thuộc vị trí đã chọn (Tự động nạp từ Position, không cho sửa lệch). |
| `Số lượng cần tuyển` (amount) | Số nguyên (Integer) | Bắt buộc | Chỉ tiêu biên chế tuyển dụng cần bổ sung ($\ge 1$, mặc định = 1). |
| `Khung lương dự kiến` (salaryRange) | Chuỗi (String) | Tùy chọn | Dải ngân sách lương (VD: `15 - 25 Triệu` hoặc tự động gợi ý từ dải lương của Vị trí). |
| `Cấp bậc` (level) | Chuỗi (String) | Tùy chọn | Cấp bậc chuyên môn: `Intern`, `Junior`, `Middle`, `Senior`, `Lead`, `Manager`. |
| `Hình thức làm việc` (jobType) | Enum/String | Mặc định | `Full-time`, `Part-time`, `Contract`, `Remote`. Mặc định: `Full-time`. |
| `Hạn chót nộp hồ sơ` (deadline) | Ngày (Date) | Bắt buộc | Ngày kết thúc nhận CV (phải $\ge$ ngày hiện tại). |
| `Mô tả công việc & Yêu cầu` (description) | Văn bản (Text) | Bắt buộc | Chi tiết trách nhiệm công việc, kỹ năng yêu cầu và chế độ đãi ngộ. |
| `Trạng thái` (status) | Enum/String | Mặc định | `DRAFT` (Nháp), `PUBLISHED` (Đang tuyển), `CLOSED` (Đã đóng). |

---

## 3. Quy tắc nghiệp vụ (Business Rules)

| Mã Quy tắc | Tình huống nghiệp vụ | Cách hệ thống xử lý | Thông báo hiển thị |
|---|---|---|---|
| **BR-REC-01-01** | **Ràng buộc toàn vẹn tổ chức**: Tạo yêu cầu tuyển dụng không gắn với Vị trí/Phòng ban. | Bắt buộc chọn `positionId`. Hệ thống tự động truy vấn `departmentId` tương ứng để đảm bảo tính toàn vẹn. | "Vui lòng chọn Vị trí công tác hợp lệ" |
| **BR-REC-01-02** | **Tự động gợi ý ngân sách lương**: Khi HR chọn chức danh vị trí. | Tự động nạp khung lương `minSalary - maxSalary` đã cấu hình ở Module Tổ chức vào ô `salaryRange`. | Tự động điền dữ liệu gợi ý |
| **BR-REC-01-03** | **Kiểm soát hạn nộp hồ sơ**: HR nhập `deadline` trong quá khứ. | Giao diện kiểm tra `deadline >= today()`. Nếu nhỏ hơn $\rightarrow$ Chặn gửi request. | "Hạn chót nộp hồ sơ phải từ ngày hôm nay trở đi" |
| **BR-REC-01-04** | **Tự động đóng chiến dịch khi đủ chỉ tiêu**: Khi số ứng viên đạt trạng thái `HIRED` bằng chỉ tiêu `amount`. | Backend kiểm tra `hiredCount >= amount`. Nếu đủ $\rightarrow$ Tự động đổi `status = 'CLOSED'` và gửi thông báo hoàn thành chiến dịch. | "Chiến dịch tuyển dụng đã hoàn thành đủ chỉ tiêu" |
| **BR-REC-01-05** | **Ràng buộc an toàn khi Xóa (Hard Delete)**: HR bấm xóa chiến dịch đã có ứng viên nộp hồ sơ (`candidates > 0`). | Backend đếm `candidate.count({ where: { jobPostingId } })`. Nếu $> 0 \rightarrow$ Từ chối xóa, trả HTTP 400. Khuyến nghị chuyển sang `CLOSED`. | "Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển!" |
| **BR-REC-01-06** | **Công thức tính tỷ lệ lấp đầy (Fill Rate)**: Hiển thị tiến độ tuyển dụng trên giao diện bảng. | `Fill Rate (%) = Math.round((hiredCount / amount) * 100)`. Hiển thị thanh tiến độ màu xanh/vàng/đỏ tương ứng. | Hiển thị Progress Bar trực quan |
| **BR-REC-01-07** | **Đóng chiến dịch thủ công (Soft Close)**: HR chủ động dừng nhận hồ sơ trước hạn. | Chuyển `status = 'CLOSED'`. Ẩn tin khỏi Cổng tuyển dụng bên ngoài (Public Portal). Ứng viên không thể nộp thêm CV. | "Đã đóng chiến dịch tuyển dụng thành công" |

---

## 4. Đặc tả chi tiết các Use Case chức năng con (Sub-Use Cases Specification)

Mỗi chức năng con trong Quản lý Yêu cầu Tuyển dụng gồm Sơ đồ Use Case phân rã trực quan và Bảng đặc tả 8 mục nghiệp vụ chuẩn hóa:

---

### 4.1. UC-REC-01-01: Thêm mới Yêu cầu tuyển dụng (Create Job Requisition)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Manager"]):::actor
    UC(["UC-REC-01-01: Thêm mới Yêu cầu tuyển dụng"]):::main
    UC_Pos(["Nạp vị trí & phòng ban liên kết"]):::sub
    UC_Val(["Kiểm tra bắt buộc & thời hạn"]):::sub
    UC_Auto(["Tự động điền dải lương gợi ý"]):::sub
    UC_Audit(["Ghi nhận vết khởi tạo"]):::sub

    Actor --> UC
    UC -.->|include| UC_Pos
    UC -.->|include| UC_Val
    UC -.->|extend| UC_Auto
    UC -.->|include| UC_Audit
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-01-01`<br/>- **UC Name**: Thêm mới Yêu cầu tuyển dụng (Create Job Requisition)<br/>- **Actor**: Chuyên viên Tuyển dụng, Trưởng phòng chuyên môn, HR Manager<br/>- **Mục tiêu**: Tạo lập chiến dịch tuyển dụng mới có gắn kết chặt chẽ với Vị trí và Phòng ban theo kế hoạch định biên.<br/>- **Mô tả**: Người dùng nhập tiêu đề, chọn vị trí, nhập số lượng cần tuyển, hạn nộp hồ sơ, mô tả công việc và mức lương dự kiến.<br/>- **Priority**: High (Bắt buộc) |
| **2** | **Trigger** | Người dùng nhấn nút **"+ Tạo Yêu cầu mới"** trên thanh công cụ của màn hình Yêu cầu tuyển dụng. |
| **3** | **Pre-condition** | 1. Người dùng đã đăng nhập với vai trò có quyền quản lý tuyển dụng.<br/>2. Đã có ít nhất 01 Phòng ban và 01 Vị trí đang hoạt động (`ACTIVE`) trong Module Tổ chức. |
| **4** | **Post-condition** | 1. Bản ghi chiến dịch mới được lưu vào CSDL với trạng thái `PUBLISHED` (hoặc `DRAFT`).<br/>2. Xuất hiện trên bảng danh sách chiến dịch kèm chỉ số tiến độ `0/Amount (0%)`.<br/>3. Hiển thị trên bảng Kanban ATS và Cổng tuyển dụng ứng viên.<br/>4. Ghi nhận Audit Log hệ thống. |
| **5** | **Main Flow** | 1. Người dùng nhấn nút **"+ Tạo Yêu cầu mới"**.<br/>2. Hệ thống tải danh mục Vị trí & Phòng ban, hiển thị Modal Form *Thêm mới Yêu cầu tuyển dụng*.<br/>3. Người dùng chọn Vị trí công tác (`Position`).<br/>4. Hệ thống tự động nạp Phòng ban trực thuộc và điền dải lương gợi ý (`BR-REC-01-02`).<br/>5. Người dùng nhập Tiêu đề, Số lượng tuyển (`amount`), Hạn nộp hồ sơ (`deadline`), Mô tả công việc.<br/>6. Người dùng chọn trạng thái phát hành (`PUBLISHED`) và nhấn **"Lưu thông tin"**.<br/>7. Giao diện kiểm tra tính hợp lệ dữ liệu (Tiêu đề không rỗng, `amount >= 1`, `deadline >= today`).<br/>8. Gửi request `POST /api/job-postings` kèm payload dữ liệu.<br/>9. Backend kiểm tra quyền, tạo bản ghi trong CSDL và trả về `HTTP 201 Created`.<br/>10. Giao diện đóng Modal, nạp lại danh sách và hiển thị Toast thông báo thành công. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Lưu nháp DRAFT)**: Người dùng chọn trạng thái `DRAFT` $\rightarrow$ Chiến dịch được lưu nhưng chưa hiển thị trên Cổng tuyển dụng ngoài.<br/>- **AF-02 (Hủy nhập)**: Nhấn "Hủy" hoặc icon `X` $\rightarrow$ Đóng modal, không lưu dữ liệu.<br/>- **EF-01 (Thiếu trường bắt buộc)**: Để trống Tiêu đề hoặc Vị trí $\rightarrow$ Báo lỗi *"Vui lòng nhập đủ các trường bắt buộc!"*.<br/>- **EF-02 (Hạn nộp không hợp lệ)**: Chọn `deadline` trong quá khứ $\rightarrow$ Báo lỗi *"Hạn chót nộp hồ sơ phải từ ngày hôm nay trở đi!"*.<br/>- **EF-03 (Lỗi kết nối server)**: Mất mạng hoặc server lỗi 500 $\rightarrow$ Toast báo lỗi *"Không thể kết nối đến máy chủ"*. |
| **7** | **Business Rules & Validation** | - `BR-REC-01-01`: Bắt buộc liên kết với `positionId` và `departmentId`.<br/>- `title`: Chuỗi 1-255 ký tự.<br/>- `amount`: Số nguyên dương $\ge 1$, mặc định = 1.<br/>- `deadline`: Định dạng ngày hợp lệ $\ge$ ngày hiện tại.<br/>- Trạng thái hợp lệ: `DRAFT`, `PUBLISHED`, `CLOSED`. |
| **8** | **Acceptance Criteria** | - **AC-01**: Khi chọn Vị trí, trường Phòng ban và Khung lương phải tự động nạp đúng giá trị tương ứng trong vòng 100ms.<br/>- **AC-02**: Nhập hạn nộp trong quá khứ và bấm Lưu $\rightarrow$ Bị chặn lại và cảnh báo rõ ràng.<br/>- **AC-03**: Nhập đầy đủ thông tin hợp lệ $\rightarrow$ Lưu thành công, đóng form và xuất hiện ngay trên bảng danh sách. |

---

### 4.2. UC-REC-01-02: Chỉnh sửa Yêu cầu tuyển dụng (Update Job Requisition)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Manager"]):::actor
    UC(["UC-REC-01-02: Chỉnh sửa Yêu cầu tuyển dụng"]):::main
    UC_Load(["Nạp thông tin chiến dịch cũ"]):::sub
    UC_Check(["Kiểm tra hạn mức với ứng viên đã tuyển"]):::sub
    UC_Update(["Cập nhật CSDL & đồng bộ ATS"]):::sub

    Actor --> UC
    UC -.->|include| UC_Load
    UC -.->|include| UC_Check
    UC -.->|include| UC_Update
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-01-02`<br/>- **UC Name**: Chỉnh sửa Yêu cầu tuyển dụng (Update Job Requisition)<br/>- **Actor**: Chuyên viên Tuyển dụng, HR Manager<br/>- **Mục tiêu**: Cập nhật thông tin chiến dịch khi có điều chỉnh về số lượng chỉ tiêu, dải lương, gia hạn deadline hoặc thay đổi mô tả công việc.<br/>- **Mô tả**: Người dùng chỉnh sửa các trường thông tin của yêu cầu tuyển dụng hiện có và lưu cập nhật vào CSDL.<br/>- **Priority**: High |
| **2** | **Trigger** | Người dùng nhấn biểu tượng cây bút **"Sửa" (Edit)** tại dòng chiến dịch tuyển dụng tương ứng trong bảng. |
| **3** | **Pre-condition** | 1. Có quyền quản lý tuyển dụng.<br/>2. Chiến dịch tuyển dụng đang tồn tại và chưa bị xóa. |
| **4** | **Post-condition** | 1. Dữ liệu chiến dịch được cập nhật chính xác trong CSDL.<br/>2. Thanh tiến độ lấp đầy (Fill Rate) tính toán lại theo chỉ tiêu mới.<br/>3. Ghi nhận Audit Log: Thời gian, Actor, các trường dữ liệu thay đổi. |
| **5** | **Main Flow** | 1. Người dùng tìm đến dòng chiến dịch cần sửa và bấm nút **"Sửa"**.<br/>2. Hệ thống mở Modal Form *Chỉnh sửa Yêu cầu tuyển dụng*, nạp toàn bộ thông tin hiện tại vào form.<br/>3. Người dùng sửa đổi thông tin (Gia hạn Deadline, tăng chỉ tiêu `amount`, cập nhật mức lương hoặc mô tả).<br/>4. Người dùng bấm nút **"Lưu thay đổi"**.<br/>5. Client kiểm tra ràng buộc: `amount` mới không được nhỏ hơn số ứng viên đã tuyển dụng thành công (`hiredCount`).<br/>6. Giao diện gửi request `PUT /api/job-postings/:id` kèm dữ liệu cập nhật.<br/>7. Backend cập nhật bản ghi trong CSDL và trả về `HTTP 200 OK`.<br/>8. Giao diện đóng Modal, nạp lại danh sách và hiển thị Toast thông báo thành công. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Hủy chỉnh sửa)**: Bấm "Hủy" hoặc click ngoài Modal $\rightarrow$ Hủy bỏ thay đổi, giữ nguyên dữ liệu cũ.<br/>- **EF-01 (Giảm chỉ tiêu nhỏ hơn số đã tuyển)**: Nhập `amount < hiredCount` $\rightarrow$ Báo lỗi *"Chỉ tiêu tuyển dụng không thể nhỏ hơn số ứng viên đã trúng tuyển ([HIRED_COUNT])!"*.<br/>- **EF-02 (Bản ghi không tồn tại)**: Chiến dịch bị xóa bởi người khác $\rightarrow$ Báo lỗi *"Yêu cầu tuyển dụng không tồn tại hoặc đã bị xóa"*. |
| **7** | **Business Rules & Validation** | - `amount`: Phải $\ge$ số lượng ứng viên đã ở trạng thái `HIRED`.<br/>- `deadline`: Cho phép gia hạn về tương lai, cảnh báo nếu chọn ngày đã qua.<br/>- Không cho phép đổi Vị trí làm thay đổi bản chất của chiến dịch nếu đã có ứng viên nộp hồ sơ. |
| **8** | **Acceptance Criteria** | - **AC-01**: Bấm nút Sửa mở form hiển thị đúng 100% dữ liệu hiện tại của chiến dịch.<br/>- **AC-02**: Nhập chỉ tiêu mới nhỏ hơn số người đã trúng tuyển $\rightarrow$ Hệ thống chặn lại và báo lỗi rõ ràng.<br/>- **AC-03**: Cập nhật thành công $\rightarrow$ Giá trị mới lập tức hiển thị trên bảng dữ liệu. |

---

### 4.3. UC-REC-01-03: Đóng / Mở lại chiến dịch tuyển dụng (Toggle Status Published / Closed)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Manager"]):::actor
    UC(["UC-REC-01-03: Đóng / Mở lại chiến dịch"]):::main
    UC_Check(["Kiểm tra trạng thái hiện tại"]):::sub
    UC_Toggle(["Đổi trạng thái PUBLISHED <-> CLOSED"]):::sub
    UC_Portal(["Ẩn / Hiện trên Cổng tuyển dụng"]):::sub
    UC_Audit(["Ghi nhận vết đóng/mở chiến dịch"]):::sub

    Actor --> UC
    UC -.->|include| UC_Check
    UC -.->|include| UC_Toggle
    UC -.->|include| UC_Portal
    UC -.->|include| UC_Audit
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-01-03`<br/>- **UC Name**: Đóng / Mở lại chiến dịch tuyển dụng (Toggle Status Published / Closed)<br/>- **Actor**: Chuyên viên Tuyển dụng, HR Manager<br/>- **Mục tiêu**: Đóng mềm chiến dịch tuyển dụng khi đủ chỉ tiêu, hết ngân sách hoặc tạm ngưng nhận hồ sơ mà không làm mất dữ liệu ứng viên đã ứng tuyển.<br/>- **Mô tả**: Chuyển đổi trạng thái chiến dịch giữa `PUBLISHED` và `CLOSED` chỉ với một thao tác bấm.<br/>- **Priority**: High (Quản trị vận hành) |
| **2** | **Trigger** | Người dùng nhấn nút biểu tượng **Khóa / Đóng chiến dịch** (hoặc nút "Đóng tuyển dụng") tại cột Thao tác của dòng tương ứng. |
| **3** | **Pre-condition** | 1. Có quyền quản lý tuyển dụng.<br/>2. Chiến dịch đang ở trạng thái `PUBLISHED` (để đóng) hoặc `CLOSED` (để mở lại). |
| **4** | **Post-condition** | 1. Trạng thái chiến dịch trong CSDL đổi thành `CLOSED` (khi Đóng) hoặc `PUBLISHED` (khi Mở lại).<br/>2. Badge trạng thái đổi màu (Xanh lá: Đang tuyển; Xám/Đỏ: Đã đóng).<br/>3. Chiến dịch bị đóng sẽ tự động ẩn khỏi Cổng nộp CV ngoài của ứng viên.<br/>4. Ghi nhận Audit Log hệ thống. |
| **5** | **Main Flow** | 1. Người dùng xác định chiến dịch cần thay đổi trạng thái.<br/>2. Người dùng nhấn nút biểu tượng **Đóng / Mở lại chiến dịch**.<br/>3. Hệ thống hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn đóng/mở lại chiến dịch tuyển dụng này?"*.<br/>4. Người dùng bấm **"Xác nhận"**.<br/>5. Hệ thống xác định trạng thái mới: `PUBLISHED` $\rightarrow$ `CLOSED` (hoặc ngược lại).<br/>6. Giao diện gửi request `PUT /api/job-postings/:id` với `{ status: newStatus }`.<br/>7. Backend cập nhật trạng thái trong CSDL và trả về `HTTP 200 OK`.<br/>8. Giao diện cập nhật ngay Badge trạng thái trên dòng đó và hiển thị Toast thông báo thành công. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Mở lại chiến dịch)**: Chiến dịch đang `CLOSED`, HR mở lại để tuyển bổ sung $\rightarrow$ Đổi thành `PUBLISHED`, tự động mở lại trên Cổng tuyển dụng.<br/>- **AF-02 (Tự động đóng do đủ người)**: Khi ứng viên cuối cùng được tuyển dụng thành công đạt đủ chỉ tiêu `amount`, hệ thống tự động kích hoạt luồng đóng này mà không cần HR bấm tay (`BR-REC-01-04`).<br/>- **EF-01 (Lỗi kết nối)**: Mất kết nối server $\rightarrow$ Toast báo lỗi, giữ nguyên trạng thái cũ. |
| **7** | **Business Rules & Validation** | - `BR-REC-01-04`: Tự động đóng chiến dịch khi `hiredCount >= amount`.<br/>- `BR-REC-01-07`: Khi đóng chiến dịch, toàn bộ hồ sơ ứng viên cũ vẫn được lưu trữ nguyên vẹn để phục vụ tra cứu lịch sử.<br/>- `status`: Nhận giá trị Enum: `'PUBLISHED'` hoặc `'CLOSED'`. |
| **8** | **Acceptance Criteria** | - **AC-01**: Bấm Đóng chiến dịch $\rightarrow$ Trạng thái chuyển sang `CLOSED`, Badge đổi màu xám/đỏ.<br/>- **AC-02**: Chiến dịch `CLOSED` không xuất hiện trên Cổng nộp hồ sơ của ứng viên bên ngoài.<br/>- **AC-03**: Mở lại chiến dịch thành công $\rightarrow$ Badge đổi màu xanh lá và tiếp tục nhận hồ sơ bình thường. |

---

### 4.4. UC-REC-01-04: Tìm kiếm, Lọc & Giám sát tiến độ lấp đầy (Search, Filter & Fill Rate)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Manager"]):::actor
    UC(["UC-REC-01-04: Tìm kiếm, Lọc & Giám sát"]):::main
    UC_Search(["Tìm kiếm theo Tiêu đề / Vị trí"]):::sub
    UC_FilterDept(["Lọc theo Phòng ban phụ trách"]):::sub
    UC_FilterStatus(["Lọc theo Trạng thái chiến dịch"]):::sub
    UC_Progress(["Tính toán tỷ lệ lấp đầy Fill Rate"]):::sub

    Actor --> UC
    UC -.->|extend| UC_Search
    UC -.->|extend| UC_FilterDept
    UC -.->|extend| UC_FilterStatus
    UC -.->|include| UC_Progress
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-01-04`<br/>- **UC Name**: Tìm kiếm, Lọc & Giám sát tiến độ lấp đầy (Search, Filter & Fill Rate)<br/>- **Actor**: Toàn bộ người dùng có quyền xem tuyển dụng (HR, Quản lý, Giám đốc, Admin)<br/>- **Mục tiêu**: Hỗ trợ tra cứu nhanh các chiến dịch tuyển dụng và giám sát tỷ lệ lấp đầy nhân sự theo thời gian thực.<br/>- **Mô tả**: Tìm kiếm không phân biệt hoa thường theo tiêu đề, lọc kết hợp theo phòng ban và trạng thái, hiển thị thanh tiến độ lấp đầy (`Fill Rate`).<br/>- **Priority**: High |
| **2** | **Trigger** | Người dùng gõ từ khóa vào ô tìm kiếm, chọn Dropdown phòng ban hoặc chọn Dropdown trạng thái. |
| **3** | **Pre-condition** | 1. Đang ở màn hình Yêu cầu tuyển dụng.<br/>2. Dữ liệu danh sách chiến dịch đã được tải về Client. |
| **4** | **Post-condition** | 1. Bảng dữ liệu hiển thị đúng danh sách chiến dịch thỏa mãn đồng thời các tiêu chí lọc.<br/>2. Thanh tiến độ lấp đầy hiển thị chính xác tỷ lệ phần trăm `%` và số lượng `hired / amount`.<br/>3. Hiển thị tổng số chiến dịch tìm thấy. |
| **5** | **Main Flow** | 1. Người dùng nhập từ khóa tìm kiếm (ví dụ: `"ReactJS"`).<br/>2. Người dùng chọn lọc theo Phòng ban (ví dụ: `"Phòng Công nghệ"`).<br/>3. Người dùng chọn lọc theo Trạng thái (ví dụ: `"Đang tuyển"`).<br/>4. Hệ thống áp dụng thuật toán lọc kết hợp đa tiêu chí (AND Logic):<br/>`matchSearch = title.toLowerCase().includes(term) || position.toLowerCase().includes(term)`<br/>`matchDept = (filterDept === '' || departmentId === filterDept)`<br/>`matchStatus = (filterStatus === '' || status === filterStatus)`<br/>`filteredJobs = jobPostings.filter(matchSearch && matchDept && matchStatus)`.<br/>5. Với mỗi chiến dịch, hệ thống tính toán:<br/>`hiredCount = candidates.filter(c => c.status === 'HIRED').length`<br/>`fillRate = Math.round((hiredCount / amount) * 100)`.<br/>6. Kết xuất bảng dữ liệu và thanh tiến độ trong vòng < 16ms. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Xóa bộ lọc)**: Người dùng bấm "Xóa bộ lọc" $\rightarrow$ Hiển thị lại toàn bộ danh sách chiến dịch.<br/>- **EF-01 (Không tìm thấy kết quả)**: Không có chiến dịch nào khớp điều kiện $\rightarrow$ Hiển thị Empty State: *"Không tìm thấy yêu cầu tuyển dụng nào phù hợp"* kèm icon tìm kiếm rỗng. |
| **7** | **Business Rules & Validation** | - `BR-REC-01-06`: Công thức tỷ lệ lấp đầy = `(hiredCount / amount) * 100%`.<br/>- Tìm kiếm không phân biệt chữ hoa, chữ thường (Case-insensitive).<br/>- Thanh tiến độ: Hiển thị màu xanh lá khi đạt 100%, màu xanh dương khi đang tuyển (> 0%), màu xám khi 0%. |
| **8** | **Acceptance Criteria** | - **AC-01**: Nhập `"java"`, bảng hiển thị ngay các chiến dịch có tiêu đề hoặc chức danh chứa `"Java"`, `"java"` tức thì.<br/>- **AC-02**: Khi một ứng viên chuyển sang `HIRED`, thanh tiến độ của chiến dịch tương ứng phải tự động nhảy số.<br/>- **AC-03**: Khi lọc không có kết quả, bảng hiển thị thông báo rỗng thân thiện, không bị vỡ bố cục. |

---

### 4.5. UC-REC-01-05: Xóa Yêu cầu tuyển dụng (Hard Delete Job Requisition)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Manager"]):::actor
    UC(["UC-REC-01-05: Xóa Yêu cầu tuyển dụng"]):::main
    UC_Confirm(["Hộp thoại xác nhận nguy hiểm"]):::sub
    UC_CheckCand(["Kiểm tra số lượng ứng viên ứng tuyển"]):::sub
    UC_Delete(["Xóa vĩnh viễn khỏi CSDL"]):::sub

    Actor --> UC
    UC -.->|include| UC_Confirm
    UC -.->|include| UC_CheckCand
    UC -.->|include| UC_Delete
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-01-05`<br/>- **UC Name**: Xóa Yêu cầu tuyển dụng (Hard Delete Job Requisition)<br/>- **Actor**: Quản trị viên hệ thống (Admin), HR Manager có thẩm quyền cao nhất<br/>- **Mục tiêu**: Xóa bỏ hoàn toàn khỏi CSDL các chiến dịch tuyển dụng nhập sai hoặc chiến dịch nháp không có ràng buộc dữ liệu.<br/>- **Mô tả**: Kiểm tra nghiêm ngặt điều kiện an toàn (chưa có bất kỳ ứng viên nào nộp hồ sơ) trước khi cho phép xóa vĩnh viễn.<br/>- **Priority**: Medium (Kiểm soát chặt) |
| **2** | **Trigger** | Người dùng nhấn biểu tượng **Thùng rác (Delete)** tại cột Thao tác của dòng chiến dịch cần xóa. |
| **3** | **Pre-condition** | 1. Có quyền `MANAGE_RECRUITMENT` và vai trò `ADMIN` hoặc `HR_MANAGER`.<br/>2. Chiến dịch muốn xóa đang hiển thị trong danh sách. |
| **4** | **Post-condition** | 1. Bản ghi chiến dịch bị xóa hoàn toàn khỏi cơ sở dữ liệu (`DELETE FROM job_postings`).<br/>2. Dòng dữ liệu biến mất khỏi giao diện.<br/>3. Ghi nhận Audit Log: Thời gian, Actor, bản ghi đã xóa để phục vụ thanh tra. |
| **5** | **Main Flow** | 1. Người dùng nhấn nút biểu tượng **Thùng rác** tại dòng chiến dịch cần xóa.<br/>2. Hệ thống hiển thị Modal hộp thoại xác nhận: *"Bạn có chắc chắn muốn xóa chiến dịch tuyển dụng [TIÊU ĐỀ]? Thao tác này không thể hoàn tác!"*.<br/>3. Người dùng nhấn nút **"Xác nhận xóa"**.<br/>4. Giao diện gửi request `DELETE /api/job-postings/:id`.<br/>5. Backend kiểm tra số lượng ứng viên nộp hồ sơ vào chiến dịch (`BR-REC-01-05`). Số lượng = 0.<br/>6. Backend thực hiện lệnh xóa bản ghi khỏi CSDL và trả về `HTTP 200 OK`.<br/>7. Giao diện đóng hộp thoại xác nhận, tự động nạp lại danh sách và hiển thị Toast thông báo: *"Đã xóa tin tuyển dụng thành công"*. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Hủy bỏ lệnh xóa)**: Tại bước 2, nhấn "Hủy" hoặc click ngoài hộp thoại $\rightarrow$ Đóng hộp thoại, không thực hiện xóa, dữ liệu giữ nguyên.<br/>- **EF-01 (Chặn xóa do đã có ứng viên ứng tuyển)**: Tại bước 5, nếu `candidateCount > 0` $\rightarrow$ Backend từ chối với lỗi `HTTP 400 Bad Request`, giao diện cảnh báo lỗi nghiêm trọng: *"Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển! Vui lòng sử dụng chức năng Đóng chiến dịch."*.<br/>- **EF-02 (Không đủ quyền hạn)**: Tài khoản không có quyền quản trị $\rightarrow$ Trả về `HTTP 403 Forbidden`, cảnh báo: *"Bạn không có quyền thực hiện thao tác xóa chiến dịch tuyển dụng"*. |
| **7** | **Business Rules & Validation** | - `BR-REC-01-05`: Tuyệt đối không cho phép xóa vật lý (Hard Delete) chiến dịch đã có ít nhất 01 hồ sơ ứng viên liên kết trong CSDL để bảo vệ tính toàn vẹn dữ liệu tuyển dụng.<br/>- Khuyến nghị sử dụng `UC-REC-01-03` (Đóng chiến dịch) thay cho Xóa vật lý. |
| **8** | **Acceptance Criteria** | - **AC-01**: Khi bấm nút Xóa, bắt buộc phải xuất hiện Modal xác nhận để phòng ngừa click nhầm.<br/>- **AC-02**: Thử xóa chiến dịch đã có ứng viên nộp CV $\rightarrow$ Bắt buộc hệ thống phải chặn lại, hiện thông báo từ chối rõ ràng và dữ liệu không bị xóa.<br/>- **AC-03**: Xóa chiến dịch rỗng hợp lệ $\rightarrow$ Dòng dữ liệu biến mất ngay lập tức và CSDL cập nhật thành công. |

---

## 5. Sơ đồ tuần tự nghiệp vụ (Sequence Diagrams)

### 5.1. Sơ đồ: Thêm mới Yêu cầu tuyển dụng
```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Requisitions.jsx)
    participant API as Cổng Xử lý (API Gateway)
    participant BE as Khối Nghiệp vụ (Backend)
    participant DB as Cơ sở dữ liệu (PostgreSQL)

    HR->>FE: Bấm nút "+ Tạo Yêu cầu mới"
    FE->>API: GET /api/departments & GET /api/positions
    API->>BE: Truy vấn danh mục hợp lệ
    BE->>DB: findMany({ where: { status: 'ACTIVE' } })
    DB-->>BE: Danh sách Phòng ban & Vị trí
    BE-->>API: 200 OK
    API-->>FE: Hiển thị Modal Form thêm mới
    
    HR->>FE: Chọn Vị trí (Position)
    FE->>FE: Tự động nạp DepartmentId và SalaryRange tương ứng
    HR->>FE: Nhập Tiêu đề, Số lượng, Hạn nộp, Mô tả và bấm "Lưu thông tin"
    FE->>FE: Validate dữ liệu (Mã, Tên, Deadline >= today)
    
    FE->>API: POST /api/job-postings (Payload)
    API->>BE: Kiểm tra phân quyền & Ràng buộc BR-REC-01-01
    BE->>DB: jobPosting.create(...)
    DB-->>BE: Bản ghi chiến dịch mới
    BE-->>API: 201 Created
    API-->>FE: 201 Created (Data)
    FE->>API: GET /api/job-postings (làm mới bảng)
    API-->>FE: Danh sách mới nhất
    FE-->>HR: Đóng Modal, hiển thị Toast thành công và cập nhật bảng
```

### 5.2. Sơ đồ: Chuyển đổi trạng thái Đóng / Mở lại chiến dịch
```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant API as Cổng Xử lý
    participant BE as Khối Nghiệp vụ
    participant DB as Cơ sở dữ liệu

    HR->>FE: Nhấn nút Đóng / Mở lại chiến dịch
    FE-->>HR: Hiển thị Modal xác nhận hành động
    HR->>FE: Bấm "Xác nhận"
    FE->>API: PUT /api/job-postings/:id (status: newStatus)
    API->>BE: Thực hiện cập nhật trạng thái
    BE->>DB: jobPosting.update({ where: { id }, data: { status: newStatus } })
    DB-->>BE: Kết quả cập nhật
    BE-->>API: 200 OK
    API-->>FE: 200 OK
    FE-->>HR: Cập nhật Badge trạng thái (Xanh/Đỏ) và hiện thông báo
```

### 5.3. Sơ đồ: Xóa an toàn Yêu cầu tuyển dụng
```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant API as Cổng Xử lý
    participant BE as Khối Nghiệp vụ
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm nút Xóa chiến dịch
    FE-->>HR: Hiển thị Modal cảnh báo xác nhận xóa
    HR->>FE: Bấm "Xác nhận xóa"
    FE->>API: DELETE /api/job-postings/:id
    API->>BE: Kiểm tra ràng buộc toàn vẹn dữ liệu
    BE->>DB: candidate.count({ where: { jobPostingId: id } })
    DB-->>BE: Số lượng ứng viên hiện tại = N
    alt N > 0 (Vi phạm BR-REC-01-05)
        BE-->>API: Lỗi ràng buộc ứng viên
        API-->>FE: 400 Bad Request
        FE-->>HR: Đóng modal, báo lỗi "Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển!"
    else N = 0 (Chiến dịch rỗng)
        BE->>DB: jobPosting.delete({ where: { id } })
        DB-->>BE: Xóa thành công khỏi CSDL
        BE-->>API: 200 OK
        API-->>FE: 200 OK
        FE-->>HR: Thông báo xóa thành công và loại bỏ dòng khỏi bảng
    end
```

---

## 6. Kịch bản kiểm thử & Nghiệm thu (Test Scenarios)

### Kịch bản 1: Tự động điền dữ liệu khi chọn chức danh
- **Given**: Hệ thống có vị trí `Frontend Developer` thuộc phòng `Phòng Công nghệ`, mức lương `15 - 25 Triệu`.
- **When**: HR mở Modal tạo mới và chọn vị trí `Frontend Developer`.
- **Then**: Trường Phòng ban tự động hiển thị `Phòng Công nghệ` và trường Khung lương tự động gợi ý `15 - 25 Triệu`.

### Kịch bản 2: Chặn xóa tin tuyển dụng đã có ứng viên nộp hồ sơ
- **Given**: Chiến dịch `Senior NodeJS` đang có 3 ứng viên nộp CV.
- **When**: HR bấm nút Xóa và bấm Xác nhận.
- **Then**: Hệ thống từ chối xóa, hiển thị cảnh báo: *"Không thể xóa tin tuyển dụng đang có ứng viên ứng tuyển!"*. Bản ghi giữ nguyên vẹn.

### Kịch bản 3: Tự động đóng chiến dịch khi tuyển đủ người
- **Given**: Chiến dịch `Kế toán viên` có chỉ tiêu `amount = 2`. Đã tuyển được 1 người (`hiredCount = 1`).
- **When**: Ứng viên thứ 2 được HR kéo thẻ sang trạng thái `HIRED`.
- **Then**: Backend tự động chuyển trạng thái của chiến dịch `Kế toán viên` sang `CLOSED`. Badge trên bảng đổi sang màu xám/đỏ.
