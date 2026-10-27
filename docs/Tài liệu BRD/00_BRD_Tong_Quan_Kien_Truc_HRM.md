# TÀI LIỆU YÊU CẦU NGHIỆP VỤ TỔNG THỂ (MASTER BRD)
## PHÂN HỆ: KIẾN TRÚC NGHIỆP VỤ & TỔNG QUAN HỆ THỐNG LLA HRM
**Mã tài liệu:** `LLA-HRM-BRD-00` | **Phiên bản:** `1.0` | **Đơn vị:** `Công ty TNHH TM Dịch vụ và Công nghệ LLA`

---

## 1. BẢNG GIẢI THÍCH TỪ VIẾT TẮT & THUẬT NGỮ NGHIỆP VỤ

| Thuật ngữ / Từ viết tắt | Tên tiếng Anh đầy đủ | Diễn giải Ý nghĩa Nghiệp vụ cho Cấp Lãnh đạo & Khối Vận hành |
| :--- | :--- | :--- |
| **BRD** | Business Requirements Document | **Tài liệu Yêu cầu Nghiệp vụ**: Văn bản pháp quy kỹ thuật xác lập mục tiêu, luồng xử lý và quy tắc nghiệp vụ phần mềm cần đáp ứng. |
| **HRM / HRIS** | Human Resource Management System | **Hệ thống Quản trị Nguồn Nhân lực Doanh nghiệp**: Nền tảng số hóa toàn bộ vòng đời nhân sự (Employee Lifecycle) từ Tuyển dụng, Hội nhập, Quản lý hồ sơ, Bàn giao tài sản đến Thôi việc. |
| **BOD** | Board of Directors | **Ban Giám đốc**: Cơ quan lãnh đạo cao nhất, phê duyệt định biên nhân sự, chỉ tiêu tuyển dụng và quyết toán các khoản chi trả/khấu trừ thôi việc. |
| **Employee Lifecycle** | Employee Lifecycle Management | **Vòng đời Nhân sự**: Chuỗi các giai đoạn nhân sự trải qua: Tuyển dụng (ATS) → Hội nhập (Onboarding) → Duy trì (Core HR, Hợp đồng, Chấm công, Lương) → Phát triển (KPI) → Chia tay (Offboarding). |
| **BM-01 (BBBG-LLA)** | Handover Protocol Form BM-01 | **Biên bản Bàn giao Tài sản (Dành cho nhân viên mới)**: Chứng từ pháp lý quy định danh mục thiết bị, số lượng, tình trạng linh kiện và cam kết trách nhiệm vật chất. |
| **BM-02** | Asset Recovery Protocol Form BM-02 | **Biên bản Thu hồi & Hoàn trả Trang thiết bị**: Chứng từ đối soát khi nghỉ việc; căn cứ xử lý bồi thường thiệt hại và xác nhận an toàn dữ liệu công vụ. |
| **Quy trình Thôi việc** | Offboarding Protocol | **Quy trình Thôi việc & Bàn giao**: Quy trình bắt buộc hoàn tất các khâu bàn giao trước khi ban hành Quyết định thôi việc và quyết toán lương. |
| **Khóa An ninh 18:00** | Security Revocation at 18:00 | **Khóa Tài khoản Tự động**: Cơ chế tự động khóa tài khoản đăng nhập và cắt mọi phiên truy cập dữ liệu mật đúng 18:00 ngày làm việc cuối cùng. |
| **RBAC** | Role-Based Access Control | **Phân quyền Theo Vai trò**: Kiểm soát quyền truy cập tài liệu và dữ liệu nhạy cảm theo cấp bậc (Admin, HR Manager, IT, Kế toán, Trưởng phòng, Nhân viên). |

---

## 2. TÓM TẮT ĐIỀU HÀNH DÀNH CHO LÃNH ĐẠO & KHỐI VẬN HÀNH

### 2.1 Hệ sinh thái Chuẩn ERP HRM Tiêu chuẩn (Standard HR Core)
Kế thừa các chuẩn mực quốc tế (Workday, BambooHR), giải pháp LLA HRM tổ chức dữ liệu theo nguyên tắc **Lấy Nhân viên làm Trung tâm (Employee-Centric Hub)**:
* Toàn bộ dữ liệu hồ sơ cá nhân, hợp đồng lao động, quá trình công tác, lịch sử cấp phát máy móc, bảng công, phiếu lương và đánh giá hiệu suất đều liên kết chặt chẽ vào mã định danh duy nhất của nhân viên (`Employee Code`).
* Phân chia hệ thống thành các phân hệ nghiệp vụ độc lập theo ranh giới nghiệp vụ (Bounded Contexts) để đảm bảo tính module hóa và dễ mở rộng.

### 2.2 Nhu cầu & Mong muốn May đo Đặc thù của Doanh nghiệp LLA
Khác với các phần mềm đóng gói đại trà, thực tế vận hành tại Công ty LLA đòi hỏi sự kết nối chặt chẽ giữa Chuyên môn Nhân sự, Quản trị Thiết bị CNTT và Kế toán Quyết toán:
1. **Liên kết Chặt chẽ Tuyển dụng - Onboarding - Bàn giao Tài sản**:
   * Khi ứng viên ký Offer trúng tuyển, hệ thống tự động sinh hồ sơ chờ nhận việc và tạo ngay đầu việc cấp phát trọn bộ thiết bị làm việc theo combo mẫu (`BBBG-LLA`).
2. **Quy trình Thôi việc & Bàn giao với Chốt chặn Cứng 2 Chiều (Hard Gate)**:
   * Chặn tuyệt đối việc duyệt quyết toán thôi việc hoặc đóng hồ sơ nhân sự nếu nhân viên chưa bàn giao đủ 100% tài sản hoặc chưa hoàn thành checklist bàn giao công việc.
3. **Tuân thủ Tuyệt đối Pháp luật Lao động Việt Nam**:
   * Xử lý bồi thường thiệt hại vật chất theo **Điều 129 BLLĐ 2019**, ràng buộc giới hạn khấu trừ lương không quá 30% theo **Điều 102**, thanh quyết toán trong vòng 14 ngày theo **Điều 48**, và bảo vệ dữ liệu cá nhân theo **Nghị định 13/2023/NĐ-CP**.

### 2.3 Ma trận Đối chiếu 3 Chiều: Chuẩn Quốc tế vs. Chuẩn ERP vs. May đo LLA
| Tiêu chí | Chuẩn Quốc tế (Workday/BambooHR) | Chuẩn ERP HRM Đóng gói | May đo Thực tế Doanh nghiệp LLA (LLA Edition) |
| :--- | :--- | :--- | :--- |
| **Cấp phát Thiết bị** | Bàn giao đơn chiếc qua ticket IT Helpdesk. | Quản lý danh sách tài sản chung trong kho. | **Bàn giao theo Combo Onboarding (Bộ PC + 2 Màn hình + Arm + Phím chuột + Email)**; in chuẩn mẫu **BBBG-LLA**. |
| **Giao diện Tài sản** | Tab gộp chung trong phần quản lý tài nguyên. | Màn hình danh mục kèm nhiều thẻ card thống kê. | **Tách 2 trang độc lập**: Kho thiết bị (`/inventory`) và Bàn giao thu hồi (`/assignments`); **Bỏ hoàn toàn các thẻ card rườm rà**. |
| **Thu hồi & Bồi thường** | Tích chọn checklist chung khi nhân viên rời công ty. | Chuyển trạng thái máy tính về Available. | **Ghi nhận trách nhiệm bồi thường vật chất (Điều 129 BLLĐ)** + Check an toàn dữ liệu **(NĐ 13/2023)**; In biên bản **BM-02** ký 3 bên. |
| **Quyết toán Thôi việc** | Khảo sát nghỉ việc và đóng tài khoản người dùng. | HR bấm thôi việc mà không đối soát tài sản. | **Chốt chặn cứng bàn giao**: Thu hồi xong 100% tài sản mới mở khóa nút duyệt quyết toán chi trả lương cuối cùng. |
| **Thu hồi Phiên làm việc** | Thu hồi thủ công bởi quản trị viên mạng. | Khóa tài khoản khi chuyển trạng thái Inactive. | **Tự động kích hoạt Khóa An ninh đúng 18:00** ngày làm việc cuối cùng đã duyệt của nhân viên. |

---

## 3. MỤC TIÊU NGHIỆP VỤ CỤ THỂ
* **Mục tiêu Vận hành**: Giảm 85% thời gian lập giấy tờ thủ công, xóa bỏ hoàn toàn tình trạng thất thoát thiết bị khi nhân sự thôi việc, và tự động hóa 100% quy trình cấp phát Onboarding.
* **Mục tiêu Pháp lý**: Đảm bảo 100% quyết định nhân sự, hợp đồng lao động, biên bản bàn giao tài sản và quyết toán thôi việc đều có chứng từ hợp lệ, sẵn sàng phục vụ thanh tra lao động và kiểm toán tài chính.
* **Mục tiêu Kỹ thuật**: Hệ thống web hiện đại, tải dữ liệu < 1.0 giây, bảo mật thông tin lương và thông tin cá nhân theo tiêu chuẩn phân quyền RBAC.

---

## 4. BẢN ĐỒ PHÂN RÃ HỆ THỐNG (DANH MỤC CÁC TÀI LIỆU BRD THÀNH PHẦN)

Toàn bộ hệ thống LLA Enterprise HRM được phân rã thành **9 tài liệu BRD chuyên biệt**, tương ứng với 9 phân hệ chức năng độc lập trong thư mục tài liệu:

| STT | Mã Tài liệu | Tên Phân Hệ & Tài liệu BRD | Phạm vi Chức năng & Nghiệp vụ Trọng tâm |
| :---: | :--- | :--- | :--- |
| **1** | `LLA-HRM-BRD-01` | **Cơ Cấu Tổ Chức & Sơ Đồ Doanh Nghiệp** | Phòng ban hình cây, Vị trí chức danh, Sơ đồ tổ chức trực quan, Quản lý định biên. |
| **2** | `LLA-HRM-BRD-02` | **Tuyển Dụng & Quản Lý Phễu Ứng Viên (ATS)** | Yêu cầu tuyển dụng, Hồ sơ ứng viên, Lịch phỏng vấn, Đánh giá, Quản lý phát hành Offer. |
| **3** | `LLA-HRM-BRD-03` | **Hội Nhập Nhân Sự Mới (Onboarding Lifecycle)** | Pre-onboarding, Checklist nhận việc 4 mốc, Mentor, Cấp tài khoản công vụ & Thiết bị. |
| **4** | `LLA-HRM-BRD-04** | **Hồ Sơ Nhân Sự, Quyết Định & Hợp Đồng Lao Động** | Hồ sơ 360°, Hợp đồng lao động chuẩn BLLĐ 2019, Quyết định điều chuyển, Bổ nhiệm, Khen thưởng. |
| **5** | `LLA-HRM-BRD-05` | **Quản Lý & Bàn Giao Tài Sản Thiết Bị Làm Việc** | Kho thiết bị, Serialized Assets, Bàn giao combo BBBG-LLA, Thu hồi BM-02, Bồi thường Đ129 BLLĐ. |
| **6** | `LLA-HRM-BRD-06` | **Quy Trình Thôi Việc, Bàn Giao & Quyết Toán** | Quy trình thôi việc, Checklist công việc & tài sản, Khóa an ninh tài khoản, Quyết toán Điều 48. |
| **7** | `LLA-HRM-BRD-07` | **Quản Lý Ca Kíp, Chấm Công & Nghỉ Phép** | Ca làm việc, Check-in/out, Bảng công tháng, Đơn giải trình, Quỹ phép năm, Nghỉ lễ, Làm thêm giờ OT. |
| **8** | `LLA-HRM-BRD-08` | **Đánh Giá Hiệu Suất (KPI) & Tiền Lương (Payroll)** | Mẫu tiêu chí KPI, Giao KPI, Chấm điểm, Kỳ lương, Công thức lương tự động, Thuế TNCN, Bảo hiểm, Phiếu lương. |
| **9** | `LLA-HRM-BRD-09` | **Báo Cáo Phân Tích & Quản Trị Hệ Thống (RBAC & Settings)** | Dashboard phân tích nhân sự, Tham số động, Phân quyền nhóm RBAC, Trung tâm phê duyệt, Audit Log. |

---

## 5. RÀNG BUỘC KIẾN TRÚC TOÀN HỆ THỐNG
1. **Kiểm toán Bất biến (Immutable Audit Trail)**: Tất cả các giao dịch tuyển dụng, hợp đồng, cấp phát tài sản, điều chỉnh công và quyết toán thôi việc đều được ghi vết tự động vào bảng `AuditLog` kèm Account ID, thời gian và địa chỉ IP.
2. **Quyền riêng tư Dữ liệu Lương (Payroll Confidentiality)**: Dữ liệu lương và phiếu lương chỉ người lao động sở hữu tài khoản và Ban Giám đốc/Kế toán trưởng mới có quyền truy cập.
3. **Chống Xóa Cứng Dữ liệu (Soft-delete Architecture)**: Không cho phép xóa vật lý (hard delete) các bản ghi nhân sự, tài sản hay hợp đồng đã phát sinh quan hệ công việc nhằm bảo vệ tính toàn vẹn dữ liệu kế toán và kiểm toán.
