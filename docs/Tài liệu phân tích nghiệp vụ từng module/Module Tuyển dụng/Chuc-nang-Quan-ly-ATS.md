# Usecase: UC-REC-02 - Hệ thống Theo dõi Ứng viên ATS Kanban (Applicant Tracking System)

## 1. Giới thiệu chức năng
- **Mục đích**: Cung cấp giao diện trực quan dạng bảng Kanban tương tác kéo-thả (Drag & Drop) để Chuyên viên Tuyển dụng và Quản lý theo dõi luồng di chuyển của toàn bộ hồ sơ ứng viên qua từng giai đoạn trong phễu tuyển dụng. Đỉnh cao của chức năng là cơ chế **Auto-provisioning**: Tự động chuyển đổi ứng viên trúng tuyển thành Hồ sơ Nhân sự chính thức (Core HR) chỉ bằng 1 thao tác kéo thẻ, loại bỏ hoàn toàn thao tác nhập liệu thủ công dư thừa.
- **Actor (Tác nhân)**: Chuyên viên Tuyển dụng (Recruiter), Trưởng bộ phận phỏng vấn (Interviewer/Manager), Trưởng phòng Nhân sự (HR Manager), Quản trị viên (Admin).
- **Điều kiện tiên quyết**: Người dùng đã đăng nhập và được cấp quyền `MANAGE_RECRUITMENT` hoặc vai trò `ADMIN` / `HR_MANAGER` / `RECRUITER`.

### Danh mục các chức năng con (Sub-features):
1. **UC-REC-02-01: Tiếp nhận & Thêm mới hồ sơ Ứng viên (Source / Add Candidate)**: Thêm ứng viên mới vào hệ thống (thủ công hoặc qua CV nộp).
2. **UC-REC-02-02: Kéo thả chuyển trạng thái ứng viên (Kanban Stage Transition)**: Di chuyển thẻ ứng viên qua các cột trong phễu tuyển dụng chuẩn 5 giai đoạn.
3. **UC-REC-02-03: Đánh dấu Loại hồ sơ ứng viên (Reject Candidate)**: Đưa ứng viên không đạt vào danh sách loại kèm theo lý do cụ thể.
4. **UC-REC-02-04: Tìm kiếm & Lọc hồ sơ ứng viên trên Kanban (Search & Filter ATS)**: Lọc ứng viên theo chiến dịch tuyển dụng, tìm kiếm theo tên hoặc email.
5. **UC-REC-02-05: Chuyển đổi Ứng viên thành Nhân viên (Auto-provision Employee)**: Kéo thẻ vào cột `HIRED`, hệ thống tự động sinh mã nhân viên, tạo hồ sơ nhân sự và hợp đồng thử việc.

---

## 2. Dữ liệu nghiệp vụ đầu vào (Input Data & Parameters)

### 2.1. Biểu mẫu Thông tin Ứng viên (Candidate Form Data)
| Tên trường | Kiểu dữ liệu | Tính chất | Ý nghĩa nghiệp vụ & Ràng buộc |
|---|---|---|---|
| `Họ và tên` (name) | Chuỗi (String) | Bắt buộc | Họ tên đầy đủ của ứng viên (Tối đa 100 ký tự). |
| `Địa chỉ Email` (email) | Chuỗi (String) | Bắt buộc | Email liên hệ cá nhân (Định dạng RFC chuẩn, duy nhất theo từng chiến dịch). |
| `Số điện thoại` (phone) | Chuỗi (String) | Bắt buộc | Số điện thoại liên lạc (10 số, đầu số hợp lệ tại Việt Nam). |
| `Chiến dịch ứng tuyển` (jobPostingId) | UUID / Chuỗi | Bắt buộc | Chiến dịch tuyển dụng đang mở mà ứng viên ứng tuyển vào. |
| `Đường dẫn CV / Hồ sơ` (cvUrl) | Chuỗi / URL | Tùy chọn | Đường link dẫn đến file CV (PDF, DOCX) lưu trữ trên Cloud / Server. |
| `Giai đoạn tuyển dụng` (status) | Enum/String | Mặc định | `SOURCED`, `SCREENING`, `INTERVIEWING`, `OFFERING`, `HIRED`, `REJECTED`. |
| `Ghi chú / Đánh giá sơ bộ` (notes) | Văn bản (Text) | Tùy chọn | Nhận xét ban đầu của HR về kinh nghiệm, bằng cấp và mức độ phù hợp. |

### 2.2. Các giai đoạn trong Phễu Tuyển dụng (Kanban Pipeline Stages)
| Giai đoạn (Stage) | Tên tiếng Việt | Mục đích nghiệp vụ |
|---|---|---|
| `SOURCED` | Nguồn CV / Mới nộp | Tiếp nhận hồ sơ mới từ các kênh (Website, LinkedIn, giới thiệu). |
| `SCREENING` | Sàng lọc sơ bộ | HR liên hệ kiểm tra thông tin, phỏng vấn nhanh qua điện thoại (Phone screen). |
| `INTERVIEWING` | Phỏng vấn chuyên môn | Phỏng vấn trực tiếp hoặc online cùng Trưởng bộ phận chuyên môn. |
| `OFFERING` | Đề nghị nhận việc | Gửi thư mời nhận việc (Job Offer), đàm phán lương thưởng và ngày bắt đầu. |
| `HIRED` | Đã nhận việc | Ứng viên đồng ý đi làm, kích hoạt chuyển đổi sang Hồ sơ Nhân viên (Core HR). |
| `REJECTED` | Từ chối / Loại | Ứng viên không đạt yêu cầu ở bất kỳ vòng nào (Kèm lý do). |

---

## 3. Quy tắc nghiệp vụ (Business Rules)

| Mã Quy tắc | Tình huống nghiệp vụ | Cách hệ thống xử lý | Thông báo hiển thị |
|---|---|---|---|
| **BR-REC-02-01** | **Ràng buộc luồng chuyển trạng thái (Strict Pipeline)**: Kéo lùi thẻ ứng viên từ vòng sau về vòng trước (VD: Từ `INTERVIEWING` lùi về `SOURCED`). | Chặn thao tác kéo lùi. Chỉ cho phép tiến về phía trước theo thứ tự hoặc chuyển sang `REJECTED`. | "Không được phép di chuyển hồ sơ lùi lại giai đoạn trước" |
| **BR-REC-02-02** | **Kích hoạt tự động tạo Nhân viên (Auto-provisioning)**: Thẻ ứng viên được kéo vào cột `HIRED`. | Mở Modal xác nhận. Khi HR bấm đồng ý $\rightarrow$ Chạy ngầm Transaction DB: Tạo bản ghi `Employee` mới, gán `departmentId`, `positionId` từ Job, tạo `Contract` thử việc, gán `status = 'ONBOARDING'`. | "Hệ thống đã tự động tạo Hồ sơ Nhân sự cho ứng viên [TÊN]" |
| **BR-REC-02-03** | **Bắt buộc lý do khi Loại ứng viên**: HR chuyển ứng viên sang trạng thái `REJECTED`. | Mở Popup bắt buộc chọn Lý do loại (Chuyên môn không đạt, Mức lương không thỏa thuận được, Không phản hồi...). | "Vui lòng nhập lý do từ chối ứng viên" |
| **BR-REC-02-04** | **Tự động đóng chiến dịch khi đủ quân số**: Ứng viên cuối cùng chuyển sang `HIRED` làm số người trúng tuyển đạt chỉ tiêu chiến dịch. | Kiểm tra `hiredCount >= job.amount` $\rightarrow$ Tự động chuyển chiến dịch tương ứng sang trạng thái `CLOSED`. | "Chiến dịch đã đủ chỉ tiêu và tự động đóng tuyển dụng" |
| **BR-REC-02-05** | **Ràng buộc xóa ứng viên**: HR bấm xóa một hồ sơ ứng viên khỏi hệ thống. | Chỉ cho phép xóa khi ứng viên đang ở trạng thái `SOURCED` hoặc `REJECTED`. Ứng viên đã có lịch phỏng vấn hoặc Offer phải hủy các liên kết trước. | "Không thể xóa hồ sơ ứng viên đang trong quá trình đánh giá" |

---

## 4. Đặc tả chi tiết các Use Case chức năng con (Sub-Use Cases Specification)

---

### 4.1. UC-REC-02-01: Tiếp nhận & Thêm mới hồ sơ Ứng viên (Source / Add Candidate)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Recruiter"]):::actor
    UC(["UC-REC-02-01: Thêm mới hồ sơ Ứng viên"]):::main
    UC_Job(["Chọn chiến dịch tuyển dụng mở"]):::sub
    UC_Val(["Kiểm tra hợp lệ Email & SĐT"]):::sub
    UC_Stage(["Khởi tạo trạng thái SOURCED"]):::sub

    Actor --> UC
    UC -.->|include| UC_Job
    UC -.->|include| UC_Val
    UC -.->|include| UC_Stage
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-02-01`<br/>- **UC Name**: Tiếp nhận & Thêm mới hồ sơ Ứng viên (Source / Add Candidate)<br/>- **Actor**: Chuyên viên Tuyển dụng (Recruiter), Quản lý Nhân sự<br/>- **Mục tiêu**: Đưa thông tin ứng viên mới vào hệ thống quản lý phễu tuyển dụng để bắt đầu quy trình đánh giá.<br/>- **Mô tả**: Người dùng nhập thông tin cá nhân của ứng viên (Tên, Email, SĐT, Link CV) và chỉ định chiến dịch tuyển dụng tương ứng.<br/>- **Priority**: High (Bắt buộc) |
| **2** | **Trigger** | Người dùng nhấn nút **"+ Thêm ứng viên"** trên thanh công cụ của màn hình Quản lý Tuyển dụng (ATS). |
| **3** | **Pre-condition** | 1. Có quyền quản lý tuyển dụng.<br/>2. Đang có ít nhất 01 chiến dịch tuyển dụng ở trạng thái `PUBLISHED`. |
| **4** | **Post-condition** | 1. Bản ghi ứng viên mới được thêm vào CSDL với trạng thái `SOURCED`.<br/>2. Thẻ ứng viên xuất hiện ngay ở cột đầu tiên (`SOURCED`) trên bảng Kanban.<br/>3. Ghi nhận Audit Log hệ thống. |
| **5** | **Main Flow** | 1. Người dùng nhấn nút **"+ Thêm ứng viên"**.<br/>2. Hệ thống hiển thị Modal Form *Thêm mới Ứng viên*, nạp danh sách các chiến dịch tuyển dụng đang mở.<br/>3. Người dùng chọn Chiến dịch ứng tuyển (`Job Posting`).<br/>4. Người dùng nhập: Họ và tên, Email, Số điện thoại, Link CV và Ghi chú.<br/>5. Người dùng nhấn nút **"Lưu hồ sơ"**.<br/>6. Giao diện kiểm tra định dạng email và số điện thoại.<br/>7. Gửi request `POST /api/candidates` kèm payload dữ liệu.<br/>8. Backend tạo bản ghi với `status = 'SOURCED'`, trả về `HTTP 201 Created`.<br/>9. Giao diện đóng Modal, nạp lại danh sách và hiển thị thẻ mới trên cột SOURCED. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Ứng viên tự ứng tuyển)**: Ứng viên nộp CV qua Cổng tuyển dụng công khai $\rightarrow$ Hệ thống tự động gọi API này tạo bản ghi `SOURCED` mà không cần HR nhập tay.<br/>- **EF-01 (Sai định dạng Email / SĐT)**: Nhập email không hợp lệ hoặc SĐT không đủ 10 số $\rightarrow$ Báo lỗi *"Email hoặc Số điện thoại không đúng định dạng!"*.<br/>- **EF-02 (Chiến dịch đã đóng)**: Chiến dịch được chọn vừa bị đóng bởi người khác $\rightarrow$ Báo lỗi *"Chiến dịch tuyển dụng đã đóng, không thể tiếp nhận thêm hồ sơ!"*. |
| **7** | **Business Rules & Validation** | - `name`: Bắt buộc, chuỗi 1-100 ký tự.<br/>- `email`: Bắt buộc, định dạng email chuẩn.<br/>- `phone`: Bắt buộc, 10 chữ số hợp lệ.<br/>- `jobPostingId`: Bắt buộc, phải là ID của chiến dịch đang `PUBLISHED`.<br/>- Trạng thái khởi tạo luôn là `SOURCED`. |
| **8** | **Acceptance Criteria** | - **AC-01**: Bấm "+ Thêm ứng viên" hiển thị đúng danh sách chiến dịch đang mở.<br/>- **AC-02**: Nhập sai định dạng email hoặc SĐT $\rightarrow$ Hệ thống chặn lại và báo lỗi chi tiết.<br/>- **AC-03**: Thêm thành công $\rightarrow$ Thẻ ứng viên xuất hiện ngay lập tức ở cột SOURCED trên bảng Kanban. |

---

### 4.2. UC-REC-02-02: Kéo thả chuyển trạng thái ứng viên (Kanban Stage Transition)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Recruiter"]):::actor
    UC(["UC-REC-02-02: Kéo thả chuyển trạng thái"]):::main
    UC_Rule(["Kiểm tra quy tắc thứ tự luồng phễu"]):::sub
    UC_Confirm(["Modal xác nhận chuyển giai đoạn"]):::sub
    UC_Sync(["Đồng bộ CSDL & thông báo"]):::sub

    Actor --> UC
    UC -.->|include| UC_Rule
    UC -.->|include| UC_Confirm
    UC -.->|include| UC_Sync
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-02-02`<br/>- **UC Name**: Kéo thả chuyển trạng thái ứng viên (Kanban Stage Transition)<br/>- **Actor**: Chuyên viên Tuyển dụng, Quản lý Nhân sự<br/>- **Mục tiêu**: Cập nhật tiến độ của ứng viên qua từng vòng đánh giá (Sàng lọc, Phỏng vấn, Đề nghị nhận việc) một cách trực quan, nhanh chóng.<br/>- **Mô tả**: Người dùng kéo thẻ ứng viên từ cột hiện tại và thả sang cột tiếp theo trên bảng Kanban.<br/>- **Priority**: High (Tính năng cốt lõi) |
| **2** | **Trigger** | Người dùng thực hiện thao tác kéo (Drag) thẻ ứng viên và thả (Drop) vào một cột trạng thái khác. |
| **3** | **Pre-condition** | 1. Có quyền quản lý tuyển dụng.<br/>2. Thẻ ứng viên đang hiển thị trên bảng Kanban. |
| **4** | **Post-condition** | 1. Trạng thái ứng viên trong CSDL được cập nhật theo cột mới.<br/>2. Thẻ ứng viên chuyển sang nằm ở vị trí mới trên giao diện.<br/>3. Ghi nhận Audit Log: Thời gian, Actor, chuyển đổi trạng thái cũ $\rightarrow$ mới. |
| **5** | **Main Flow** | 1. Người dùng kéo thẻ ứng viên từ cột hiện tại (ví dụ: `SOURCED`) sang cột tiếp theo (ví dụ: `SCREENING`).<br/>2. Hệ thống kiểm tra quy tắc thứ tự luồng phễu (`BR-REC-02-01`).<br/>3. Hệ thống hiển thị hộp thoại xác nhận: *"Xác nhận chuyển ứng viên [TÊN] sang giai đoạn [TÊN VÒNG]?"*.<br/>4. Người dùng bấm **"Xác nhận"**.<br/>5. Giao diện gửi request `PUT /api/candidates/:id` với `{ status: newStatus }`.<br/>6. Backend cập nhật trường `status` trong CSDL và trả về `HTTP 200 OK`.<br/>7. Giao diện cập nhật vị trí thẻ trên cột mới và hiển thị Toast thông báo: *"Chuyển giai đoạn ứng viên thành công"*. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Kéo sang HIRED)**: Nếu kéo vào cột `HIRED` $\rightarrow$ Tự động chuyển tiếp sang luồng `UC-REC-02-05` (Auto-provisioning Employee).<br/>- **EF-01 (Vi phạm thứ tự luồng phễu)**: Người dùng cố tình kéo lùi thẻ về cột trước $\rightarrow$ Hệ thống trả thẻ về vị trí cũ và cảnh báo: *"Không được phép chuyển hồ sơ lùi lại vòng trước!"*.<br/>- **EF-02 (Lỗi kết nối server)**: Mất kết nối server $\rightarrow$ Trả thẻ về cột ban đầu và báo lỗi *"Không thể cập nhật trạng thái. Vui lòng thử lại sau"*. |
| **7** | **Business Rules & Validation** | - `BR-REC-02-01`: Thứ tự hợp lệ: `SOURCED` $\rightarrow$ `SCREENING` $\rightarrow$ `INTERVIEWING` $\rightarrow$ `OFFERING` $\rightarrow$ `HIRED`. Không được nhảy cóc hoặc kéo lùi.<br/>- Trạng thái chỉ được phép nhận các giá trị Enum hợp lệ. |
| **8** | **Acceptance Criteria** | - **AC-01**: Kéo thả mượt mà, phản hồi giao diện tức thì (< 16ms).<br/>- **AC-02**: Kéo lùi thẻ về vòng trước $\rightarrow$ Hệ thống tự động chặn và đưa thẻ về vị trí ban đầu.<br/>- **AC-03**: Xác nhận chuyển vòng $\rightarrow$ CSDL cập nhật chính xác và Toast thông báo hiển thị. |

---

### 4.3. UC-REC-02-03: Đánh dấu Loại hồ sơ ứng viên (Reject Candidate)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Recruiter"]):::actor
    UC(["UC-REC-02-03: Đánh dấu Loại hồ sơ"]):::main
    UC_Modal(["Mở Modal nhập lý do loại"]):::sub
    UC_Reason(["Bắt buộc chọn lý do chuẩn"]):::sub
    UC_Archive(["Lưu trữ dữ liệu & gửi thư từ chối"]):::sub

    Actor --> UC
    UC -.->|include| UC_Modal
    UC -.->|include| UC_Reason
    UC -.->|extend| UC_Archive
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-02-03`<br/>- **UC Name**: Đánh dấu Loại hồ sơ ứng viên (Reject Candidate)<br/>- **Actor**: Chuyên viên Tuyển dụng, Quản lý Nhân sự<br/>- **Mục tiêu**: Loại bỏ ứng viên không phù hợp khỏi phễu tuyển dụng đang chạy và ghi nhận lý do để phục vụ báo cáo chất lượng tuyển dụng.<br/>- **Mô tả**: Người dùng bấm nút "Từ chối / Loại" tại thẻ ứng viên, chọn lý do loại và chuyển trạng thái sang `REJECTED`.<br/>- **Priority**: High |
| **2** | **Trigger** | Người dùng nhấn nút **"Từ chối" (Reject)** trên thẻ ứng viên hoặc kéo thẻ vào vùng Loại hồ sơ. |
| **3** | **Pre-condition** | 1. Có quyền quản lý tuyển dụng.<br/>2. Ứng viên chưa ở trạng thái `HIRED`. |
| **4** | **Post-condition** | 1. Trạng thái ứng viên đổi thành `REJECTED` trong CSDL kèm lý do loại.<br/>2. Thẻ ứng viên biến mất khỏi phễu Kanban đang hoạt động (chuyển vào danh sách lưu trữ Đã loại).<br/>3. Ghi nhận Audit Log hệ thống. |
| **5** | **Main Flow** | 1. Người dùng nhấn nút **"Từ chối / Loại"** tại thẻ ứng viên cần loại.<br/>2. Hệ thống hiển thị Modal *Xác nhận Từ chối Ứng viên*.<br/>3. Người dùng chọn Lý do loại từ danh mục (Không đủ kinh nghiệm, Mức lương kỳ vọng quá cao, Không đạt bài test, Không phản hồi...).<br/>4. Người dùng nhập thêm ghi chú chi tiết (tùy chọn) và bấm **"Xác nhận loại"**.<br/>5. Giao diện gửi request `PUT /api/candidates/:id` với `{ status: 'REJECTED', rejectReason: reason }`.<br/>6. Backend cập nhật bản ghi trong CSDL và trả về `HTTP 200 OK`.<br/>7. Giao diện loại bỏ thẻ ứng viên khỏi bảng Kanban và hiển thị Toast thông báo: *"Đã chuyển ứng viên vào danh sách từ chối"*. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Hủy thao tác)**: Nhấn "Hủy" $\rightarrow$ Đóng modal, giữ nguyên trạng thái ứng viên.<br/>- **EF-01 (Chưa chọn lý do)**: Bấm lưu khi chưa chọn lý do $\rightarrow$ Cảnh báo: *"Vui lòng chọn lý do từ chối ứng viên!"* (`BR-REC-02-03`). |
| **7** | **Business Rules & Validation** | - `BR-REC-02-03`: Bắt buộc phải có lý do loại khi chuyển sang `REJECTED`.<br/>- Ứng viên bị loại không được phép xóa vật lý (Hard Delete) để phục vụ tra cứu lịch sử khi ứng viên nộp lại trong tương lai. |
| **8** | **Acceptance Criteria** | - **AC-01**: Bấm Từ chối phải hiển thị Modal chọn lý do rõ ràng.<br/>- **AC-02**: Bỏ trống lý do và bấm xác nhận $\rightarrow$ Hệ thống chặn lại và báo lỗi.<br/>- **AC-03**: Xác nhận thành công $\rightarrow$ Thẻ ứng viên biến mất khỏi cột Kanban và CSDL cập nhật trạng thái `REJECTED`. |

---

### 4.4. UC-REC-02-04: Tìm kiếm & Lọc hồ sơ ứng viên trên Kanban (Search & Filter ATS)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Recruiter"]):::actor
    UC(["UC-REC-02-04: Tìm kiếm & Lọc trên ATS"]):::main
    UC_FilterJob(["Lọc theo Chiến dịch tuyển dụng"]):::sub
    UC_SearchName(["Tìm kiếm theo Tên / Email / SĐT"]):::sub
    UC_Count(["Đếm số lượng thẻ trên từng cột"]):::sub

    Actor --> UC
    UC -.->|extend| UC_FilterJob
    UC -.->|extend| UC_SearchName
    UC -.->|include| UC_Count
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-02-04`<br/>- **UC Name**: Tìm kiếm & Lọc hồ sơ ứng viên trên Kanban (Search & Filter ATS)<br/>- **Actor**: Toàn bộ người dùng có quyền xem tuyển dụng (HR, Quản lý, Admin)<br/>- **Mục tiêu**: Tra cứu nhanh hồ sơ ứng viên và lọc bảng Kanban theo từng chiến dịch tuyển dụng cụ thể để làm việc tập trung.<br/>- **Mô tả**: Lọc danh sách theo Dropdown chiến dịch tuyển dụng, tìm kiếm tức thì theo tên hoặc email của ứng viên.<br/>- **Priority**: High |
| **2** | **Trigger** | Người dùng chọn một chiến dịch trong Dropdown hoặc gõ từ khóa vào ô tìm kiếm trên thanh công cụ ATS. |
| **3** | **Pre-condition** | 1. Đang ở màn hình Quản lý Tuyển dụng (ATS Kanban).<br/>2. Dữ liệu ứng viên đã được tải về Client. |
| **4** | **Post-condition** | 1. Bảng Kanban chỉ hiển thị các thẻ ứng viên khớp với chiến dịch và từ khóa tìm kiếm.<br/>2. Tiêu đề các cột Kanban cập nhật số lượng thẻ tương ứng (ví dụ: `PHỎNG VẤN (3)`). |
| **5** | **Main Flow** | 1. Người dùng chọn chiến dịch trong Dropdown `Chọn chiến dịch tuyển dụng` (ví dụ: `"Senior ReactJS"`).<br/>2. Người dùng nhập tên ứng viên vào ô `Tìm ứng viên...` (ví dụ: `"Nguyễn Văn A"`).<br/>3. Hệ thống áp dụng lọc kết hợp:<br/>`matchJob = (selectedJob === '' || jobPostingId === selectedJob)`<br/>`matchKeyword = name.toLowerCase().includes(term) || email.toLowerCase().includes(term)`<br/>`filteredCandidates = candidates.filter(matchJob && matchKeyword)`.<br/>4. Phân chia danh sách vào 5 mảng tương ứng với 5 cột trạng thái.<br/>5. Cập nhật Badge đếm số lượng trên đỉnh mỗi cột.<br/>6. Kết xuất lại bảng Kanban trong vòng < 16ms. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Xem tất cả chiến dịch)**: Chọn "Tất cả chiến dịch" $\rightarrow$ Hiển thị toàn bộ ứng viên đang có trong hệ thống.<br/>- **AF-02 (Cột rỗng)**: Cột nào không có ứng viên phù hợp $\rightarrow$ Hiển thị ô trống mờ thân thiện (Empty column). |
| **7** | **Business Rules & Validation** | - Tìm kiếm không phân biệt hoa thường (Case-insensitive).<br/>- Không reload lại trang khi lọc (Client-side filtering tức thì). |
| **8** | **Acceptance Criteria** | - **AC-01**: Chọn chiến dịch A $\rightarrow$ Toàn bộ thẻ thuộc chiến dịch khác biến mất ngay lập tức.<br/>- **AC-02**: Nhập từ khóa tên $\rightarrow$ Thẻ hiển thị lọc đúng theo tên trong thời gian thực.<br/>- **AC-03**: Số lượng đếm trên đầu mỗi cột luôn bằng đúng số thẻ hiển thị bên dưới. |

---

### 4.5. UC-REC-02-05: Chuyển đổi Ứng viên thành Nhân viên (Auto-provision Employee)

#### Sơ đồ Use Case:
```mermaid
flowchart LR
    classDef actor fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef main fill:#7c3aed,stroke:#c084fc,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef sub fill:#334155,stroke:#94a3b8,stroke-width:1.5px,color:#ffffff,stroke-dasharray: 4 4;

    Actor(["👤 Chuyên viên HR / Manager"]):::actor
    UC(["UC-REC-02-05: Chuyển đổi thành Nhân viên"]):::main
    UC_Confirm(["Hộp thoại xác nhận tuyển dụng"]):::sub
    UC_Emp(["Tự động sinh mã & tạo hồ sơ Employee"]):::sub
    UC_Contract(["Tự động tạo Hợp đồng thử việc"]):::sub
    UC_CloseJob(["Kiểm tra tự động đóng chiến dịch"]):::sub

    Actor --> UC
    UC -.->|include| UC_Confirm
    UC -.->|include| UC_Emp
    UC -.->|include| UC_Contract
    UC -.->|extend| UC_CloseJob
```

#### Bảng đặc tả nghiệp vụ:

| STT | Hạng mục | Nội dung chi tiết |
|:---:|---|---|
| **1** | **Thông tin chung** | - **UC ID**: `UC-REC-02-05`<br/>- **UC Name**: Chuyển đổi Ứng viên thành Nhân viên (Auto-provision Employee)<br/>- **Actor**: Trưởng phòng Nhân sự (HR Manager), Recruiter có thẩm quyền<br/>- **Mục tiêu**: Tự động hóa hoàn toàn việc tạo mới Hồ sơ Nhân viên (Module Core HR) và Hợp đồng thử việc khi ứng viên trúng tuyển, triệt tiêu 100% việc nhập liệu thủ công lặp lại.<br/>- **Mô tả**: Khi kéo ứng viên sang cột `HIRED`, hệ thống chạy một Transaction CSDL tự động ánh xạ thông tin sang bảng Nhân viên và bảng Hợp đồng.<br/>- **Priority**: High (Tính năng tinh hoa Enterprise) |
| **2** | **Trigger** | Người dùng kéo thẻ ứng viên từ cột `OFFERING` và thả vào cột `HIRED`. |
| **3** | **Pre-condition** | 1. Có quyền quản lý tuyển dụng và nhân sự.<br/>2. Ứng viên đang ở trạng thái `OFFERING` (Đã có thỏa thuận nhận việc). |
| **4** | **Post-condition** | 1. Trạng thái ứng viên đổi thành `HIRED`.<br/>2. Bản ghi `Employee` mới được tạo tại Module Hồ sơ với trạng thái `ONBOARDING`.<br/>3. Bản ghi `Contract` thử việc mới được tạo liên kết với nhân viên đó.<br/>4. Tự động đóng chiến dịch nếu đã đủ số lượng tuyển (`BR-REC-02-04`).<br/>5. Ghi nhận Audit Log chuyển đổi dữ liệu. |
| **5** | **Main Flow** | 1. Người dùng kéo thẻ ứng viên thả vào cột **HIRED**.<br/>2. Hệ thống hiển thị Modal xác nhận: *"Xác nhận tuyển dụng ứng viên [TÊN]? Hệ thống sẽ tự động tạo Hồ sơ Nhân sự và Hợp đồng thử việc."*.<br/>3. Người dùng nhấn nút **"Xác nhận & Tạo Hồ sơ"**.<br/>4. Giao diện gửi request `PUT /api/candidates/:id/hire`.<br/>5. Backend mở một Database Transaction (`$transaction`):<br/>- Bước 5.1: Cập nhật Candidate `status = 'HIRED'`.<br/>- Bước 5.2: Tự động sinh mã nhân viên mới (`EMPxxxx`).<br/>- Bước 5.3: Tạo bản ghi `Employee` với thông tin lấy từ Candidate và Vị trí/Phòng ban lấy từ Job.<br/>- Bước 5.4: Tạo bản ghi `Contract` loại `PROBATION` (Thử việc).<br/>- Bước 5.5: Đếm số lượng đã tuyển, nếu `hiredCount >= job.amount` $\rightarrow$ Đổi Job sang `CLOSED`.<br/>6. Backend commit Transaction và trả về `HTTP 200 OK` kèm thông tin nhân viên mới.<br/>7. Giao diện đưa thẻ vào cột HIRED và hiển thị Toast thông báo thành công: *"Tuyển dụng thành công! Đã tạo hồ sơ cho nhân viên [MÃ NV]"*. |
| **6** | **Alternative / Exception Flow** | - **AF-01 (Hủy bỏ)**: Người dùng bấm "Hủy" $\rightarrow$ Thẻ trả về cột OFFERING, không sinh dữ liệu nhân sự.<br/>- **EF-01 (Lỗi Transaction)**: Lỗi CSDL trong quá trình tạo Employee $\rightarrow$ Backend Rollback toàn bộ Transaction, giữ nguyên trạng thái ứng viên và hiển thị cảnh báo lỗi: *"Có lỗi xảy ra trong quá trình tạo hồ sơ nhân viên. Dữ liệu đã được hoàn tác!"*. |
| **7** | **Business Rules & Validation** | - `BR-REC-02-02`: Đảm bảo tính nguyên tố (Atomic) qua Database Transaction: Nếu lỗi tạo Employee thì không đổi trạng thái Candidate.<br/>- `BR-REC-02-04`: Tự động đóng chiến dịch khi đủ chỉ tiêu tuyển dụng.<br/>- Trạng thái khởi tạo của nhân viên mới luôn là `ONBOARDING`. |
| **8** | **Acceptance Criteria** | - **AC-01**: Kéo thẻ vào cột HIRED bắt buộc phải hiển thị Modal xác nhận có ghi rõ hành động tự động tạo hồ sơ.<br/>- **AC-02**: Bấm xác nhận $\rightarrow$ Hồ sơ nhân viên mới lập tức xuất hiện bên màn hình Danh sách Nhân viên (Core HR) mà không cần F5.<br/>- **AC-03**: Nếu chiến dịch đã đủ quân số $\rightarrow$ Tự động chuyển chiến dịch sang trạng thái `CLOSED`. |

---

## 5. Sơ đồ tuần tự nghiệp vụ (Sequence Diagrams)

### 5.1. Sơ đồ: Kéo thả chuyển trạng thái ứng viên trên Kanban
```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Tuyển dụng
    participant FE as Giao diện (RecruitmentATS.jsx)
    participant API as Cổng Xử lý (API Gateway)
    participant BE as Khối Nghiệp vụ (Backend)
    participant DB as Cơ sở dữ liệu (PostgreSQL)

    HR->>FE: Kéo thẻ ứng viên từ SCREENING sang INTERVIEWING
    FE->>FE: Kiểm tra tính hợp lệ luồng (BR-REC-02-01)
    FE-->>HR: Mở Modal xác nhận chuyển giai đoạn
    HR->>FE: Bấm "Xác nhận"
    
    FE->>API: PUT /api/candidates/:id (Payload: { status: 'INTERVIEWING' })
    API->>BE: Chuyển dữ liệu cập nhật
    BE->>DB: candidate.update({ where: { id }, data: { status: 'INTERVIEWING' } })
    DB-->>BE: Kết quả cập nhật
    BE-->>API: 200 OK
    API-->>FE: 200 OK
    FE->>FE: Cập nhật vị trí thẻ sang cột INTERVIEWING
    FE-->>HR: Hiển thị Toast thông báo thành công
```

### 5.2. Sơ đồ: Tuyển dụng & Tự động tạo Hồ sơ Nhân sự (Auto-provisioning Transaction)
```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Tuyển dụng
    participant FE as Giao diện Kanban
    participant API as Cổng Xử lý
    participant BE as Khối Nghiệp vụ
    participant DB as Cơ sở dữ liệu (PostgreSQL)

    HR->>FE: Kéo thẻ ứng viên vào cột HIRED
    FE-->>HR: Hiển thị Modal "Chuyển ứng viên thành Nhân viên chính thức?"
    HR->>FE: Bấm "Xác nhận & Tạo Hồ sơ"
    
    FE->>API: PUT /api/candidates/:id/hire
    API->>BE: Bắt đầu xử lý Transaction
    
    rect rgb(240, 248, 255)
        note over BE, DB: Bắt đầu Database Transaction
        BE->>DB: 1. candidate.update({ status: 'HIRED' })
        BE->>DB: 2. employee.create({ code, fullName, departmentId, positionId, status: 'ONBOARDING' })
        BE->>DB: 3. contract.create({ contractType: 'PROBATION', status: 'ACTIVE' })
        BE->>DB: 4. Kiểm tra hiredCount >= job.amount -> jobPosting.update({ status: 'CLOSED' })
        DB-->>BE: Transaction thành công (Commit)
    end
    
    BE-->>API: 200 OK (Thông tin Employee & Contract mới)
    API-->>FE: 200 OK
    FE->>FE: Đưa thẻ vào cột HIRED & Cập nhật số lượng
    FE-->>HR: Toast thông báo "Tuyển dụng thành công! Đã tạo mã nhân viên mới"
```

---

## 6. Kịch bản kiểm thử & Nghiệm thu (Test Scenarios)

### Kịch bản 1: Kéo thả tuần tự qua các vòng phễu tuyển dụng
- **Given**: Ứng viên `Trần Thị B` đang ở cột `SCREENING`.
- **When**: HR kéo thẻ của ứng viên này sang cột `INTERVIEWING` và bấm xác nhận.
- **Then**: Thẻ chuyển sang cột `INTERVIEWING`, CSDL cập nhật `status = 'INTERVIEWING'`.

### Kịch bản 2: Ngăn chặn kéo lùi thẻ về vòng trước
- **Given**: Ứng viên đang ở cột `OFFERING`.
- **When**: HR kéo thẻ lùi về cột `SOURCED`.
- **Then**: Hệ thống từ chối chuyển, đưa thẻ về vị trí cũ và hiển thị cảnh báo: *"Không được phép di chuyển hồ sơ lùi lại giai đoạn trước"*.

### Kịch bản 3: Tự động tạo Nhân viên khi chuyển sang HIRED
- **Given**: Ứng viên `Lê Văn C` ứng tuyển vị trí `Backend Developer` phòng `Công nghệ`.
- **When**: HR kéo thẻ của ứng viên này vào cột `HIRED` và bấm "Xác nhận & Tạo Hồ sơ".
- **Then**: Hệ thống tạo thành công bản ghi `Employee` mới mang tên `Lê Văn C`, đúng phòng Công nghệ và vị trí Backend Developer, trạng thái là `ONBOARDING`. Hợp đồng thử việc tự động được kích hoạt.
