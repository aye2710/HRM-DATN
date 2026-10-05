# Usecase: UC-KPI-01 - Quản lý Chu kỳ Đánh giá và Gán Mục tiêu KPI (Review Cycles & KPI Goal Setting)

## 1. Giới thiệu chức năng
- **Mục đích**: Cung cấp công cụ chuẩn hóa cho Ban Giám đốc và Phòng Nhân sự để thiết lập các đợt đánh giá hiệu suất định kỳ (Tháng, Quý, Năm), xây dựng Thư viện Tiêu chí Mẫu (KPI Templates) phân theo từng khối phòng ban và cho phép Trưởng bộ phận (Line Manager) giao chỉ tiêu định lượng (Target Goals) xuống từng nhân viên cấp dưới một cách minh bạch.
- **Actor (Tác nhân)**: Chuyên viên Đào tạo & Phát triển (HR / L&D), Trưởng bộ phận (Line Manager), Quản trị hệ thống (Admin).
- **Điều kiện tiên quyết**: Nhân viên đã có hồ sơ hoạt động (`ACTIVE`) trong cơ cấu tổ chức phòng ban.

### Danh mục các chức năng con (Sub-features):
1. **UC-KPI-01-01: Khởi tạo Chu kỳ Đánh giá mới (Create Review Cycle)**: Mở đợt đánh giá toàn công ty (VD: "Đánh giá Hiệu suất Quý 4/2026"), tự động sinh hàng loạt phiếu đánh giá nháp cho toàn thể nhân sự đang làm việc.
2. **UC-KPI-01-02: Tra cứu & Quản lý Danh mục Chu kỳ Đánh giá (View & Track Cycles)**: Theo dõi tiến độ các đợt đánh giá, xem thời hạn nộp điểm (`startDate` đến `endDate`) và trạng thái chu kỳ.
3. **UC-KPI-01-03: Thiết lập Thư viện Mẫu KPI theo Phòng ban (Manage KPI Templates)**: Quản lý ngân hàng chỉ số đo lường hiệu suất tiêu chuẩn (Tên mẫu, Phòng ban áp dụng, Số tiêu chí, Trọng số %) để tái sử dụng nhanh chóng.
4. **UC-KPI-01-04: Gán Chỉ tiêu Mục tiêu KPI cho Nhân viên (Assign KPI Goals)**: Trưởng phòng phân bổ mục tiêu cụ thể kèm con số kỳ vọng (`target`) cho từng nhân sự (VD: "Doanh số 500 triệu", "Đóng 50 tickets hỗ trợ").
5. **UC-KPI-01-05: Cập nhật Kết quả Thực tế & Theo dõi Tiến độ (Update KPI Progress)**: Cập nhật số liệu thực hiện (`achieved`) định kỳ, tự động tính tỷ lệ % hoàn thành mục tiêu.

---

## 2. Dữ liệu nghiệp vụ đầu vào (Input Data & Parameters)

### 2.1. Biểu mẫu Chu kỳ Đánh giá (Review Cycle Data)
| Tên trường | Kiểu dữ liệu | Tính chất | Ý nghĩa nghiệp vụ & Ràng buộc |
|---|---|---|---|
| `Tên chu kỳ đánh giá` (name) | Chuỗi (String) | Bắt buộc | Tiêu đề kỳ đánh giá (VD: "Đánh giá Hiệu suất Quý 4 - 2026"). |
| `Ngày bắt đầu` (startDate) | Ngày (Date) | Bắt buộc | Mốc thời gian mở cổng cho phép chấm điểm (`YYYY-MM-DD`). |
| `Ngày kết thúc` (endDate) | Ngày (Date) | Bắt buộc | Hạn chót cuối cùng để nộp kết quả đánh giá (`YYYY-MM-DD`, $\ge startDate$). |

### 2.2. Biểu mẫu Chỉ tiêu Mục tiêu KPI (KPI Goal Data)
| Tên trường | Kiểu dữ liệu | Tính chất | Ý nghĩa nghiệp vụ & Ràng buộc |
|---|---|---|---|
| `Nhân viên thực hiện` (employeeId) | UUID / Chuỗi | Bắt buộc | Định danh của nhân sự được giao chỉ tiêu. |
| `Mô tả mục tiêu` (description) | Chuỗi (String) | Bắt buộc | Chi tiết nội dung công việc (VD: "Doanh số hợp đồng phần mềm mới"). |
| `Chỉ tiêu kỳ vọng` (target) | Chuỗi / Số | Bắt buộc | Con số đo lường mục tiêu (VD: "500000000" hoặc "100%"). |
| `Kết quả thực tế đạt được` (achieved) | Chuỗi / Số | Cập nhật dần | Con số nghiệm thu thực tế của nhân viên. Mặc định: "0". |

---

## 3. Quy tắc nghiệp vụ (Business Rules)

| Mã Quy tắc | Tình huống nghiệp vụ | Cách hệ thống xử lý | Thông báo hiển thị |
|---|---|---|---|
| **BR-KPI-01-01** | **Tự động Khởi tạo Phiếu Đánh giá Nháp (Auto-provision Draft Reviews)**: Khởi tạo thành công chu kỳ đánh giá mới (`POST /api/kpi/cycles`). | Backend quét toàn bộ nhân viên có `status = 'ACTIVE'`, tự động tạo sẵn một bản ghi `PerformanceReview` tương ứng cho từng người với `score = 0` và `comments = 'Đang đánh giá...'`. | "Đã mở kỳ đánh giá mới và tự động khởi tạo phiếu đánh giá cho toàn thể nhân sự!" |
| **BR-KPI-01-02** | **Ràng buộc Thời gian Chu kỳ (Cycle Timeline Validation)**: Nhập ngày kết thúc nhỏ hơn hoặc bằng ngày bắt đầu. | Hệ thống chặn lưu và yêu cầu điều chỉnh: `endDate > startDate`. | "Hạn chót kết thúc đánh giá phải sau ngày bắt đầu mở đợt!" |
| **BR-KPI-01-03** | **Khóa Chỉnh sửa Mục tiêu khi Đóng chu kỳ (Goal Immutability)**: Chu kỳ đánh giá đã hết hạn hoặc đóng lại. | Khóa toàn bộ các mục tiêu KPI thuộc chu kỳ ở chế độ chỉ đọc (Read-only) nhằm đảm bảo tính minh bạch, ngăn chặn việc sửa đổi chỉ tiêu sau khi đã có kết quả. | "Chu kỳ đánh giá đã kết thúc, không thể thay đổi mục tiêu KPI!" |
| **BR-KPI-01-04** | **Tính toán Tỷ lệ Hoàn thành Tự động (Progress Metric)**: Cập nhật kết quả `achieved`. | Hệ thống tự động tính tỷ lệ phần trăm: $\text{Tiến độ} = (\text{achieved} / \text{target}) \times 100\%$ và hiển thị thanh tiến độ màu trực quan (Đỏ: $< 50\%$, Vàng: $50 - 79\%$, Xanh: $\ge 80\%$). | "Cập nhật tiến độ hoàn thành mục tiêu thành công!" |
| **BR-KPI-01-05** | **Ràng buộc Xóa mục tiêu KPI**: Người dùng bấm xóa một KPI. | Cho phép xóa khi chưa bước vào giai đoạn chấm điểm chính thức. Nếu đã chấm điểm hoàn tất $\rightarrow$ Chặn xóa để phục vụ thanh tra. | "Không thể xóa mục tiêu KPI đã được sử dụng để chấm điểm hiệu suất!" |

---

## 4. Đặc tả chi tiết các Use Case chức năng con (Sub-Use Cases Specification)

---

### 4.1. UC-KPI-01-01: Khởi tạo Chu kỳ Đánh giá mới (Create Review Cycle)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / L&D"]):::actor
    UC(["UC-KPI-01-01: Khởi tạo Chu kỳ Đánh giá"]):::main
    UC_InputDate(["Nhập Tên đợt, Ngày bắt đầu, Ngày kết thúc"]):::sub
    UC_AutoDraft(["Tự động tạo PerformanceReview cho toàn bộ NV ACTIVE"]):::sub

    Actor --> UC
    UC -.->|include| UC_InputDate
    UC -.->|include| UC_AutoDraft
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-KPI-01-01`<br/>- **UC Name**: Khởi tạo Chu kỳ Đánh giá mới (Create Review Cycle)<br/>- **Actor**: Chuyên viên L&D/HR Admin, Giám đốc Nhân sự<br/>- **Mục tiêu**: Kích hoạt đợt đánh giá định kỳ trên toàn doanh nghiệp và tự động chuẩn bị phiếu đánh giá sẵn sàng cho quản lý vào chấm điểm.<br/>- **Mô tả**: Người dùng nhập tên đợt, ngày mở cổng và hạn chót nộp điểm. Hệ thống lưu chu kỳ và chạy tiến trình sinh tự động hàng loạt phiếu đánh giá nháp cho toàn bộ nhân sự đang hoạt động.<br/>- **Priority**: High (Bắt buộc) |
| **2** | **Trigger** | Người dùng bấm nút **"+ Tạo kỳ đánh giá"** trên màn hình Đánh giá Hiệu suất (`/internal/performance`). |
| **3** | **Pre-condition** | Người dùng có quyền quản trị hiệu suất (`MANAGE_PERFORMANCE`, `ADMIN`). |
| **4** | **Post-condition** | 1. Bản ghi `ReviewCycle` mới được lưu vào CSDL.<br/>2. Toàn bộ nhân viên có `status = 'ACTIVE'` đều có bản ghi `PerformanceReview` nháp liên kết với chu kỳ này.<br/>3. Chu kỳ hiển thị trên danh sách đợt đánh giá hiện hành. |
| **5** | **Main Flow** | 1. Người dùng bấm **"+ Tạo kỳ đánh giá"**.<br/>2. Hệ thống mở Modal Form, nhập Tên chu kỳ (VD: "Đánh giá Quý 4 - 2026"), Ngày bắt đầu (`2026-10-01`), Hạn chót nộp (`2026-10-31`).<br/>3. Người dùng bấm **"Kích hoạt kỳ đánh giá"**.<br/>4. Giao diện kiểm tra `startDate < endDate`.<br/>5. Hệ thống gửi request `POST /api/kpi/cycles` kèm payload.<br/>6. Backend tạo bản ghi `ReviewCycle`.<br/>7. Backend quét danh sách `Employee` (`where status = 'ACTIVE'`) và tạo tự động `PerformanceReview` cho từng người (BR-KPI-01-01).<br/>8. Backend trả về `HTTP 200 OK`. Giao diện báo Toast: *"Đã mở kỳ đánh giá mới và khởi tạo dữ liệu cho nhân sự!"*. |
| **6** | **Alternative / Exception Flow** | - **EF-01 (Ngày kết thúc sớm hơn ngày bắt đầu)**: Nhập sai ngày $\rightarrow$ Báo lỗi *"Hạn chót kết thúc đánh giá phải sau ngày bắt đầu mở đợt!"* (BR-KPI-01-02). |
| **7** | **Business Rules & Validation** | - Tự động sinh phiếu đánh giá hàng loạt giúp giảm 100% thao tác khởi tạo thủ công từng nhân viên (BR-KPI-01-01). |
| **8** | **Acceptance Criteria** | - **AC-01**: Khởi tạo chu kỳ thành công toàn bộ nhân viên active đều xuất hiện trên bảng danh sách đánh giá.<br/>- **AC-02**: Nhập ngày kết thúc trước ngày bắt đầu bị chặn và báo lỗi rõ ràng. |

---

### 4.2. UC-KPI-01-02: Tra cứu & Quản lý Danh mục Chu kỳ Đánh giá (View & Track Cycles)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Toàn thể Quản lý / HR"]):::actor
    UC(["UC-KPI-01-02: Tra cứu Chu kỳ Đánh giá"]):::main
    UC_LoadCycles(["Tải danh sách các đợt đánh giá"]):::sub
    UC_CheckDeadline(["Hiển thị hạn chót & Đếm ngược ngày"]):::sub

    Actor --> UC
    UC -.->|include| UC_LoadCycles
    UC -.->|extend| UC_CheckDeadline
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-KPI-01-02`<br/>- **UC Name**: Tra cứu & Quản lý Danh mục Chu kỳ Đánh giá (View & Track Cycles)<br/>- **Actor**: Toàn bộ Quản lý bộ phận, HR Admin, Ban Giám đốc<br/>- **Mục tiêu**: Giúp người quản lý nắm bắt thời gian mở đợt và hạn chót nộp điểm để chủ động hoàn thành đánh giá cho nhân viên.<br/>- **Mô tả**: Hiển thị danh sách các đợt đánh giá đã và đang diễn ra kèm thời gian hiệu lực và tình trạng còn hạn hay đã hết hạn.<br/>- **Priority**: Medium |
| **2** | **Trigger** | Người dùng xem danh mục chu kỳ tại trang Quản lý Đánh giá. |
| **3** | **Pre-condition** | Người dùng đã đăng nhập vào hệ thống. |
| **4** | **Post-condition** | Danh sách chu kỳ đánh giá hiển thị chi tiết và trực quan. |
| **5** | **Main Flow** | 1. Người dùng mở trang Đánh giá Hiệu suất.<br/>2. Hệ thống tải danh sách các `ReviewCycle`.<br/>3. Hiển thị thông tin: Tên đợt, Ngày mở, Hạn chót kết thúc, Số lượng nhân sự tham gia.<br/>4. Hiển thị badge trạng thái: Xanh lá *"Đang diễn ra"* (nếu `today <= endDate`), hoặc Xám *"Đã kết thúc"* (nếu `today > endDate`). |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Chưa có đợt đánh giá nào)**: Hiển thị thông báo *"Chưa có chu kỳ đánh giá nào được mở"*. |
| **7** | **Business Rules & Validation** | - Tự động đối chiếu ngày máy chủ để gắn nhãn trạng thái chính xác. |
| **8** | **Acceptance Criteria** | - **AC-01**: Hiển thị đúng hạn chót và trạng thái của từng kỳ đánh giá. |

---

### 4.3. UC-KPI-01-03: Thiết lập Thư viện Mẫu KPI theo Phòng ban (Manage KPI Templates)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / L&D"]):::actor
    UC(["UC-KPI-01-03: Quản lý Thư viện Mẫu KPI"]):::main
    UC_CreateTpl(["Tạo mẫu KPI: Tên, Phòng ban, Số tiêu chí, Trọng số"]):::sub
    UC_DeleteTpl(["Xóa mẫu KPI cũ"]):::sub

    Actor --> UC
    UC -.->|include| UC_CreateTpl
    UC -.->|extend| UC_DeleteTpl
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-KPI-01-03`<br/>- **UC Name**: Thiết lập Thư viện Mẫu KPI theo Phòng ban (Manage KPI Templates)<br/>- **Actor**: Chuyên viên L&D, Trưởng phòng Nhân sự<br/>- **Mục tiêu**: Chuẩn hóa bộ tiêu chí đánh giá cho từng vị trí và phòng ban, giúp Trưởng phòng không phải gõ lại tiêu chí thủ công mỗi kỳ.<br/>- **Mô tả**: Quản lý danh mục các mẫu KPI (`KPITemplate`): Tên mẫu (VD: "KPI Khối Kinh doanh", "KPI Kỹ thuật phần mềm"), Phòng ban áp dụng, Số tiêu chí con, Trọng số % và Trạng thái áp dụng (`Active`).<br/>- **Priority**: Medium |
| **2** | **Trigger** | Người dùng truy cập tab **"Mẫu KPI"** (`/internal/performance/templates`). |
| **3** | **Pre-condition** | Người dùng có quyền quản trị hiệu suất. |
| **4** | **Post-condition** | Mẫu KPI mới được lưu vào thư viện dùng chung cho toàn bộ phòng ban. |
| **5** | **Main Flow** | 1. Người dùng mở tab Mẫu KPI.<br/>2. Bấm nút **"+ Thêm mẫu KPI"**.<br/>3. Nhập: Tên mẫu, Chọn Phòng ban áp dụng, Số tiêu chí (VD: 5), Trọng số % (VD: "30% Doanh số, 70% Khách hàng").<br/>4. Bấm nút **"Lưu mẫu KPI"**.<br/>5. Giao diện gửi request `POST /api/kpi/templates` kèm payload.<br/>6. Backend tạo bản ghi và trả về `HTTP 201 Created`.<br/>7. Giao diện hiển thị Toast: *"Tạo mẫu KPI thành công!"*, nạp lại danh sách. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Xóa mẫu KPI)**: Bấm icon Thùng rác $\rightarrow$ Gửi request `DELETE /api/kpi/templates/:id` $\rightarrow$ Xóa bản ghi thành công khỏi CSDL. |
| **7** | **Business Rules & Validation** | - Mẫu KPI có thể tái sử dụng cho nhiều đợt đánh giá khác nhau. |
| **8** | **Acceptance Criteria** | - **AC-01**: Thêm mới và xóa mẫu KPI phản hồi nhanh chóng, lưu đúng phòng ban áp dụng. |

---

### 4.4. UC-KPI-01-04: Gán Chỉ tiêu Mục tiêu KPI cho Nhân viên (Assign KPI Goals)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Trưởng phòng / Line Manager"]):::actor
    UC(["UC-KPI-01-04: Gán Mục tiêu KPI cho Nhân viên"]):::main
    UC_SelectEmp(["Chọn Nhân viên thụ hưởng"]):::sub
    UC_InputTarget(["Nhập Nội dung mục tiêu & Chỉ tiêu kỳ vọng"]):::sub

    Actor --> UC
    UC -.->|include| UC_SelectEmp
    UC -.->|include| UC_InputTarget
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-KPI-01-04`<br/>- **UC Name**: Gán Chỉ tiêu Mục tiêu KPI cho Nhân viên (Assign KPI Goals)<br/>- **Actor**: Trưởng bộ phận (Line Manager), Quản lý trực tiếp<br/>- **Mục tiêu**: Phân bổ mục tiêu công việc cụ thể cho từng nhân viên dưới quyền vào đầu chu kỳ đánh giá.<br/>- **Mô tả**: Người dùng chọn nhân viên, nhập mô tả công việc cần đạt và gán con số chỉ tiêu (`target`). Hệ thống khởi tạo bản ghi mục tiêu KPI với kết quả ban đầu là 0.<br/>- **Priority**: High (Bắt buộc) |
| **2** | **Trigger** | Người dùng bấm nút **"+ Gán KPI mới"** trên trang Gán mục tiêu KPI (`KPIAssignments.jsx`). |
| **3** | **Pre-condition** | Chu kỳ đánh giá đang trong thời gian hiệu lực (chưa đóng). |
| **4** | **Post-condition** | Bản ghi `KPI` mới được tạo gắn với `employeeId`, hiển thị trên trang cá nhân của nhân viên. |
| **5** | **Main Flow** | 1. Trưởng phòng mở trang Gán KPI.<br/>2. Bấm nút **"+ Gán KPI mới"**.<br/>3. Chọn Nhân viên trong bộ phận từ dropdown.<br/>4. Nhập Mô tả mục tiêu: "Hoàn thành 03 tính năng lớn cho Module Tiền lương".<br/>5. Nhập Chỉ tiêu kỳ vọng: "3".<br/>6. Bấm **"Giao chỉ tiêu"**.<br/>7. Giao diện gửi request `POST /api/kpi/kpi` kèm `{ employeeId, description, target }`.<br/>8. Backend tạo bản ghi và trả về `HTTP 201 Created`.<br/>9. Giao diện báo Toast: *"Gán mục tiêu KPI thành công!"*, nạp lại danh sách. |
| **6** | **Alternative / Exception Flow** | - **EF-01 (Bỏ trống mô tả hoặc chỉ tiêu)**: Báo lỗi *"Vui lòng nhập đầy đủ mô tả mục tiêu và chỉ tiêu kỳ vọng!"*. |
| **7** | **Business Rules & Validation** | - Nhân viên có thể được giao nhiều mục tiêu KPI trong cùng một chu kỳ. |
| **8** | **Acceptance Criteria** | - **AC-01**: Gán KPI thành công xuất hiện ngay trên danh sách mục tiêu của nhân viên tương ứng. |

---

### 4.5. UC-KPI-01-05: Cập nhật Kết quả Thực tế & Theo dõi Tiến độ (Update KPI Progress)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Nhân viên / Quản lý"]):::actor
    UC(["UC-KPI-01-05: Cập nhật Tiến độ KPI"]):::main
    UC_InputAchieved(["Nhập số liệu nghiệm thu achieved"]):::sub
    UC_CalcPercent(["Tự động tính % Hoàn thành & Đổi màu tiến độ"]):::sub

    Actor --> UC
    UC -.->|include| UC_InputAchieved
    UC -.->|include| UC_CalcPercent
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-KPI-01-05`<br/>- **UC Name**: Cập nhật Kết quả Thực tế & Theo dõi Tiến độ (Update KPI Progress)<br/>- **Actor**: Toàn bộ nhân viên, Quản lý trực tiếp<br/>- **Mục tiêu**: Ghi nhận số liệu công việc hoàn thành thực tế định kỳ (hàng tuần, hàng tháng) để đo lường tiến độ trước khi bước vào kỳ chấm điểm chính thức.<br/>- **Mô tả**: Người dùng cập nhật trường `achieved` trên mục tiêu KPI. Hệ thống tự động tính tỷ lệ phần trăm hoàn thành và đổi màu thanh tiến độ trực quan.<br/>- **Priority**: High |
| **2** | **Trigger** | Người dùng bấm icon chiếc bút **(Cập nhật)** tại dòng mục tiêu KPI trên bảng. |
| **3** | **Pre-condition** | Bản ghi KPI tồn tại và chu kỳ đánh giá chưa bị đóng (BR-KPI-01-03). |
| **4** | **Post-condition** | Giá trị `achieved` được cập nhật trong CSDL, thanh tiến độ phần trăm nhảy số ngay lập tức. |
| **5** | **Main Flow** | 1. Người dùng bấm Sửa tại dòng KPI cần cập nhật.<br/>2. Nhập số liệu thực tế đạt được: VD chỉ tiêu là `500`, thực tế đạt `450`.<br/>3. Bấm **"Lưu tiến độ"**.<br/>4. Giao diện gửi request `PUT /api/kpi/kpi/:id` với `{ achieved, description, target }`.<br/>5. Backend cập nhật bản ghi và trả về `HTTP 200 OK`.<br/>6. Giao diện tính toán: `450 / 500 = 90%` $\rightarrow$ Thanh tiến độ chuyển sang màu xanh lá (`>= 80%`).<br/>7. Báo Toast: *"Cập nhật tiến độ KPI thành công!"*. |
| **6** | **Alternative / Exception Flow** | - **EF-01 (Chu kỳ đã đóng)**: Báo lỗi *"Chu kỳ đánh giá đã kết thúc, không thể thay đổi mục tiêu KPI!"* (BR-KPI-01-03). |
| **7** | **Business Rules & Validation** | - Tiến độ có thể vượt quá 100% nếu nhân viên hoàn thành vượt mức chỉ tiêu. |
| **8** | **Acceptance Criteria** | - **AC-01**: Cập nhật thành công con số thực tế được lưu lại chính xác.<br/>- **AC-02**: Thanh tiến độ hiển thị đúng màu theo ngưỡng hoàn thành. |

---

## 5. Sơ đồ tuần tự nghiệp vụ (Sequence Diagrams)

### 5.1. Luồng Mở Kỳ Đánh giá & Sinh Phiếu Nháp Hàng loạt (UC-KPI-01-01)
```mermaid
sequenceDiagram
    autonumber
    actor HR as Chuyên viên HR / L&D
    participant FE as Giao diện (Performance.jsx)
    participant BE as Backend API (/api/kpi/cycles)
    participant DB as Cơ sở dữ liệu (PostgreSQL)

    HR->>FE: Bấm "+ Tạo kỳ đánh giá"
    FE->>HR: Hiển thị Modal nhập liệu (Tên đợt, Ngày bắt đầu, Hạn chót)
    HR->>FE: Nhập "Đánh giá Quý 4 - 2026", 01/10/2026 đến 31/10/2026
    HR->>FE: Bấm "Kích hoạt kỳ đánh giá"
    
    FE->>BE: POST /api/kpi/cycles { name, startDate, endDate }
    
    rect rgb(240, 248, 255)
        Note over BE, DB: Mở Transaction tạo chu kỳ & sinh phiếu
        BE->>DB: 1. INSERT INTO ReviewCycle (name, startDate, endDate)
        DB-->>BE: Bản ghi ReviewCycle mới (cycleId)
        
        BE->>DB: 2. SELECT id FROM Employee WHERE status = 'ACTIVE'
        DB-->>BE: Danh sách nhân viên active (VD: 45 nhân sự)
        
        loop Với từng nhân viên active
            BE->>DB: INSERT INTO PerformanceReview (employeeId, reviewCycleId=cycleId, score=0, comments='Đang đánh giá...')
        end
        Note over BE, DB: Khởi tạo dữ liệu hàng loạt thành công!
    end
    
    BE-->>FE: HTTP 200 OK { message: 'Đã mở kỳ đánh giá mới và khởi tạo dữ liệu cho nhân sự', cycle }
    FE->>FE: Nạp lại bảng danh sách đánh giá
    FE->>HR: Hiển thị Toast "Mở kỳ đánh giá thành công!"
```

---

## 6. Ma trận kịch bản kiểm thử (Test Scenarios & Acceptance Matrix)

| Mã kịch bản | Use Case liên quan | Điều kiện kiểm thử | Các bước thực hiện | Kết quả mong đợi (Expected Outcome) | Đánh giá |
|---|---|---|---|---|:---:|
| **TC-KPI-01-01** | UC-KPI-01-01 | Khởi tạo chu kỳ hợp lệ | Nhập tên đợt, ngày 01/10 đến 31/10 $\rightarrow$ Bấm Kích hoạt | Tạo chu kỳ thành công, tự sinh phiếu đánh giá nháp cho toàn bộ nhân viên active. | **Pass** |
| **TC-KPI-01-02** | UC-KPI-01-01 | Ngày kết thúc không hợp lệ | Nhập ngày kết thúc sớm hơn ngày bắt đầu $\rightarrow$ Bấm Kích hoạt | Báo lỗi *"Hạn chót kết thúc đánh giá phải sau ngày bắt đầu mở đợt!"*. | **Pass** |
| **TC-KPI-01-03** | UC-KPI-01-03 | Tạo mẫu KPI mới | Nhập mẫu KPI Phòng Kinh doanh, 5 tiêu chí, trọng số 100% | Lưu thành công, mẫu xuất hiện trên danh mục thư viện KPI. | **Pass** |
| **TC-KPI-01-04** | UC-KPI-01-04 | Gán KPI cho nhân viên | Chọn nhân viên, nhập mô tả và chỉ tiêu target = 100 $\rightarrow$ Bấm Lưu | Bản ghi KPI được tạo thành công, `achieved` mặc định là 0. | **Pass** |
| **TC-KPI-01-05** | UC-KPI-01-05 | Cập nhật tiến độ | Nhập `achieved = 90` trên `target = 100` $\rightarrow$ Bấm Lưu | Cập nhật thành công, thanh tiến độ đạt 90% đổi sang màu xanh lá. | **Pass** |
