# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)

## 01. KIỂM SOÁT TÀI LIỆU (DOCUMENT CONTROL)

* **Mã tài liệu (Document ID):** BRD-HRM-2026
* **Tên tài liệu (Document Name):** Yêu cầu Nghiệp vụ Hệ thống Enterprise HRM Portal
* **Tên dự án (Project Name):** LLA Enterprise HRM Portal
* **Phiên bản (Version):** 1.2
* **Trạng thái (Status):** Bản nháp (Draft)
* **Người soạn thảo (Author):** Lead Business Analyst
* **Người thẩm định (Reviewer):** Chủ dự án (Project Sponsor / PO)
* **Người phê duyệt (Approver):** Ban Giám đốc (Công ty TNHH LLA)
* **Ngày tạo (Created Date):** 23-08-2026
* **Ngày cập nhật cuối (Last Updated):** 23-08-2026

| Phiên bản | Ngày | Mô tả thay đổi | Người viết |
| :--- | :--- | :--- | :--- |
| 1.0 | 23-08-2026 | Bản khởi tạo ban đầu. | Senior BA |
| 1.1 | 23-08-2026 | Nâng cấp cấu trúc chuẩn Enterprise (29 phần). Cập nhật Status thành Draft. | Lead BA |
| 1.2 | 23-08-2026 | Sửa KPI (TBD), mở rộng 9 luồng quy trình. Làm rõ State Machine phân hệ Lương. Đẩy các rule chưa xác nhận vào Open Questions. | Lead BA |

---

## 02. TÓM TẮT DỰ ÁN (EXECUTIVE SUMMARY)

* **Bối cảnh (Business Background):** Công ty TNHH LLA đang mở rộng quy mô nhân sự, hệ thống quản lý dữ liệu hiện tại đang bị phân tán qua nhiều công cụ thủ công (Excel, Zalo).
* **Vấn đề (Business Problem):** Quy trình tính lương dễ sai sót do không có cơ chế khóa (Lock) dữ liệu giờ công; khó truy vết các thay đổi nhạy cảm về lương thưởng; mất thời gian để tái ký hợp đồng.
* **Nhu cầu (Business Need):** Cần một nền tảng tập trung (Single source of truth) số hóa toàn bộ vòng đời nhân sự từ khâu tuyển dụng đến tính lương và lưu vết kiểm toán, đảm bảo tính minh bạch.
* **Giải pháp đề xuất (Proposed Solution):** Triển khai hệ thống **Enterprise HRM Portal** bao gồm 3 cổng: Enterprise Portal (cho Admin/HR/Manager), Employee Portal (tự phục vụ) và Candidate Portal.
* **Mục tiêu (Business Objectives):** Tập trung hóa dữ liệu nhân sự, giảm sai sót tính lương, và giảm rủi ro pháp lý liên quan đến hợp đồng.
* **Chỉ số đo lường (Success Metrics):** `[TBD — Business Confirmation]` về tỷ lệ xử lý đúng hạn và tỷ lệ giảm thiểu khiếu nại.

---

## 03. BỐI CẢNH DOANH NGHIỆP (BUSINESS CONTEXT)

Doanh nghiệp LLA vận hành nhiều phòng ban (Sản xuất, Hạ tầng, Nhân sự, v.v.) với nhiều loại hình ca làm việc và chế độ hợp đồng khác nhau. Hiện tại, dữ liệu giờ công phụ thuộc hoàn toàn vào file xuất từ máy quét vân tay vật lý, dẫn đến sự thiếu nhất quán nếu nhân viên quên chấm công và xin bù công qua tin nhắn rải rác.
Việc xây dựng hệ thống mới được thúc đẩy bởi sự tăng trưởng quy mô tổ chức, đòi hỏi Ban Giám đốc phải có công cụ kiểm soát chi phí quỹ lương chính xác và tự động hóa các khâu hành chính của phòng HR (Hội nhập, Quản lý hợp đồng).

---

## 04. MỤC TIÊU VÀ ĐO LƯỜNG THÀNH CÔNG (BUSINESS OBJECTIVES & SUCCESS METRICS)

| Mã số | Mục tiêu (Objective) | Nhu cầu (Business Need) | Thước đo (Metric) | Chỉ tiêu (Target) | Phương pháp đo | Nguồn dữ liệu | Người chịu trách nhiệm |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| OBJ-001 | Tập trung hóa dữ liệu | Tất cả thông tin nhân viên nằm trên 1 hệ thống duy nhất. | Tỷ lệ hồ sơ nhân sự được quản lý trên hệ thống. | `[TBD]` | Đếm số hồ sơ Active | Database | HR Manager |
| OBJ-002 | Tối ưu thời gian tính lương | C&B không phải dò file Excel thủ công. | Thời gian xử lý thủ tục cuối tháng. | `[TBD]` | Đo thời gian chu kỳ | Log hệ thống | C&B Manager |
| OBJ-003 | Giảm thiểu sai sót tính lương | Số hóa quy trình chấm công, bù công và chốt bảng lương. | Tỷ lệ khiếu nại phiếu lương. | `[TBD]` | Số ticket khiếu nại | Helpdesk | C&B Manager |
| OBJ-004 | Giảm rủi ro không tuân thủ | Cảnh báo hết hạn hợp đồng. | Số hợp đồng hết hạn không được xử lý. | `[TBD]` | Báo cáo Hợp đồng | Database | HR Manager |
| OBJ-005 | Quản trị rủi ro & bảo mật | Ghi vết thay đổi dữ liệu nhạy cảm. | Tỷ lệ giao dịch nhạy cảm được log. | `[TBD]` | Báo cáo Audit Log | Database | System Admin |

---

## 05. BÊN LIÊN QUAN VÀ NGƯỜI DÙNG (STAKEHOLDERS & USER GROUPS)

| Mã số | Bên liên quan (User) | Vai trò (Role) | Trách nhiệm (Responsibility) | Mức độ quan tâm | Sức ảnh hưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| STK-01 | Ban Giám đốc | Sponsor / Business Owner | Phê duyệt ngân sách và nghiệm thu dự án. | Cao | Cao |
| STK-02 | System Admin | Quản trị HT | Quản trị phân quyền (RBAC), theo dõi hệ thống. | Trung bình | Cao |
| STK-03 | HR Manager | Quản lý NS | Vận hành vòng đời nhân sự. | Cao | Cao |
| STK-04 | C&B Specialist | Chuyên viên | Chốt công, tính lương, khóa bảng lương. | Cao | Cao |
| STK-05 | Line Manager | Trưởng phòng | Đánh giá KPI, duyệt đơn. | Cao | Trung bình |
| STK-06 | Employee | NV nội bộ | Xem phiếu lương, xin nghỉ phép. | Cao | Thấp |
| STK-07 | Candidate | Ứng viên | Theo dõi quá trình ứng tuyển. | Trung bình | Thấp |
| STK-08 | System Owner | IT Manager | Bảo trì kỹ thuật, vận hành server. | Trung bình | Cao |
| STK-09 | Finance | Tài chính | Nhận dữ liệu lương để chi trả. | Cao | Cao |
| STK-10 | Auditor | Kiểm toán | Truy xuất báo cáo và log kiểm toán. | Trung bình | Cao |

---

## 06. PHẠM VI DỰ ÁN (PROJECT SCOPE)

### 6.1 Trong phạm vi (In Scope)
1. **Organization Management:** Cơ cấu phòng ban, Vị trí.
2. **Recruitment:** Yêu cầu tuyển dụng, Quản lý ứng viên.
3. **Onboarding:** Quy trình tiếp nhận nhân sự mới.
4. **Employee Management:** Hồ sơ, Hợp đồng, Lịch sử công tác.
5. **Time & Attendance:** Quản lý Ca làm việc, Điều chỉnh công, Chấm công.
6. **Leave Management:** Đơn xin nghỉ, Quỹ phép, Chính sách nghỉ.
7. **Payroll:** Bảng lương, Phiếu lương, Chốt kỳ lương.
8. **Performance:** Đánh giá KPI.
9. **System Administration:** Phân quyền, Nhật ký kiểm toán.

### 6.2 Ngoài phạm vi (Out of Scope)
* Kế toán tài chính, ERP, Quản trị quan hệ khách hàng (CRM).
* Phân hệ Đào tạo và Phát triển (L&D).
* Tính năng nhận diện khuôn mặt trực tiếp trên ứng dụng.

### 6.3 Ranh giới hệ thống (System Boundary)
* Hệ thống đóng vai trò Master Data cho thông tin nhân sự.
* Hệ thống sẽ tiếp nhận dữ liệu từ các máy chấm công bên ngoài nhưng không chịu trách nhiệm cấu hình phần cứng thiết bị.

### 6.4 Ràng buộc phạm vi (Scope Constraints)
* Việc phát triển chỉ tập trung vào nền tảng Web Application (Web-based).

---

## 07. PHÂN TÍCH HIỆN TRẠNG (AS-IS ANALYSIS)

| Mã Vấn đề | Quy trình hiện tại (Activity) | Nguyên nhân gốc rễ (Root Cause) | Điểm nghẽn (Pain Point) | Rủi ro (Risk) |
| :--- | :--- | :--- | :--- | :--- |
| P-01 | C&B tải dữ liệu từ máy chấm công ra Excel, tổng hợp bù công qua Zalo. | Không có hệ thống tích hợp tập trung. | Tốn nhiều thời gian đối soát thủ công. | Sai sót tính lương, làm thất thoát ngân sách. |
| P-02 | HR rà soát thời hạn hợp đồng bằng sổ sách / Excel. | Phụ thuộc vào trí nhớ con người. | Bỏ sót gia hạn hợp đồng lao động. | Vi phạm pháp luật lao động, rủi ro kiện tụng. |
| P-03 | Quản lý mức lương và thông tin nhạy cảm trên file tĩnh. | File tĩnh không hỗ trợ Audit Log. | Khó biết được ai đã sửa đổi dữ liệu. | Gian lận tài chính nội bộ. |

---

## 08. PHÂN TÍCH MỤC TIÊU (TO-BE ANALYSIS)

| Vấn đề AS-IS | Nguyên nhân | Giải pháp TO-BE (TO-BE Solution) | Lợi ích nghiệp vụ (Business Benefit) | BR Liên quan |
| :--- | :--- | :--- | :--- | :--- |
| P-01 (Chấm công) | Thiếu hệ thống tập trung | Số hóa quy trình nộp đơn, cấn trừ quỹ phép tự động, cung cấp tính năng khóa (Lock) dữ liệu công. | Giảm thời gian xử lý thủ tục cuối tháng. | BR-002, BR-005 |
| P-02 (Quên hợp đồng) | Phụ thuộc trí nhớ | Hệ thống tự động cảnh báo hợp đồng sắp hết hạn. | Giảm rủi ro pháp lý. | BR-003 |
| P-03 (Thiếu Audit) | File tĩnh | Tự động ghi vết (Audit Log) các thay đổi dữ liệu nhạy cảm. | Nâng cao minh bạch và an toàn dữ liệu. | BR-001 |

---

## 09. BẢN ĐỒ QUY TRÌNH NGHIỆP VỤ (BUSINESS PROCESS MAP)

### Cấu trúc phân cấp
```text
Level 0 — Enterprise
    ↓
Level 1 — HR Domain
    ↓
Level 2 — Business Process
```

### Danh mục Quy trình (Level 2) bao phủ Scope
| Mã QT | Tên Quy trình | Mục đích (Purpose) |
| :--- | :--- | :--- |
| BP-01 | Organization Management | Quản lý cơ cấu phòng ban và vị trí chức danh. |
| BP-02 | Recruitment | Đăng tuyển và xử lý phễu ứng viên. |
| BP-03 | Onboarding | Theo dõi tiến độ tiếp nhận nhân sự mới. |
| BP-04 | Employee Management | Quản lý hợp đồng và hồ sơ cá nhân. |
| BP-05 | Time & Attendance | Ghi nhận chấm công và xử lý đơn điều chỉnh giờ. |
| BP-06 | Leave Management | Xử lý đơn nghỉ phép và quỹ phép. |
| BP-07 | Payroll | Tổng hợp công, tính lương và đóng băng dữ liệu kỳ lương. |
| BP-08 | Performance Management | Đánh giá KPI định kỳ `[TBD]`. |
| BP-09 | System Administration | Cấu hình tham số và giám sát Audit Log. |

---

## 10. YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS)

*Mức độ bao phủ: Đảm bảo phủ kín 9 Module trong Scope.*

| Mã YC (BR) | Yêu cầu (Requirement) | Nhu cầu (Business Need) | Giá trị (Business Value) | Ưu tiên | Nguồn | Quy trình (Process) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BR-001 | Ghi vết kiểm toán (Audit Logging) | Tổ chức cần biết ai sửa dữ liệu nhạy cảm. | Chống gian lận tài chính. | MUST | System Owner | BP-09 |
| BR-002 | Khóa dữ liệu công (Data Integrity) | Bảo vệ dữ liệu công không bị sửa đổi sau khi chốt. | Đảm bảo tính chính xác kỳ lương. | MUST | C&B | BP-07 |
| BR-003 | Kiểm soát thời hạn hợp đồng | Công cụ cảnh báo chủ động gia hạn hợp đồng. | Tránh rủi ro pháp lý. | MUST | HR | BP-04 |
| BR-004 | Quản lý trạng thái ứng viên | Nắm bắt nhanh tiến trình ứng tuyển theo luồng (Pipeline). | Tối ưu thời gian tuyển dụng. | SHOULD | HR | BP-02 |
| BR-005 | Số hóa quy trình chấm công | Nhân viên nộp đơn online, tự động cấn trừ quỹ phép. | Giảm thiểu thủ công. | MUST | HR | BP-05, BP-06 |
| BR-ORG-01| Quản lý Cơ cấu tổ chức | Cần hệ thống lưu trữ cây phòng ban. | `[TBD]` | MUST | HR | BP-01 |
| BR-ONB-01| Tiến độ Onboarding | Cần theo dõi tiến độ tiếp nhận nhân viên mới. | `[TBD]` | MUST | HR | BP-03 |
| BR-PERF-01| Đánh giá Performance | `[TBD - Requirement Gap]` | `[TBD]` | `[TBD]`| HR | BP-08 |

---

## 11. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| Mã Quy tắc | Tên Quy tắc (Rule) | Loại (Type) | Áp dụng cho | Nguồn gốc | Ưu tiên | Trạng thái (Status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| BRULE-001 | Cảnh báo Hợp đồng <= 30 ngày | Validation | Hợp đồng lao động | HR Policy | MUST | `[NEED BUSINESS CONFIRMATION]` |
| BRULE-002 | Cấm sửa đổi khi Kỳ lương khóa | Status Transition | Bảng công, Phép | C&B Policy | MUST | Active |
| BRULE-003 | Thâm niên > 5 năm được +1 phép | Eligibility | Quỹ phép | HR Policy | MUST | `[NEED BUSINESS CONFIRMATION]` |
| BRULE-004 | Cấm xóa bản ghi Nhật ký | Permission | Audit Logs | System Policy | MUST | Active |
| BRULE-005 | Xử lý đi muộn/về sớm | Calculation | Chấm công | Pháp luật | MUST | Active (Cộng dồn phút đi muộn quy đổi thành Nghỉ không hưởng lương - Unpaid Leave) |
| BRULE-006 | Luật bảo hiểm & lương cơ bản | Eligibility | Payroll | Pháp luật | MUST | `[NEED BUSINESS CONFIRMATION]` |
| BRULE-007 | Truy thu phép âm (Clawback) | Calculation | Offboarding | C&B Policy | MUST | Active (Khấu trừ vào lương tháng cuối nếu dùng lố phép) |
| BRULE-008 | Tiêu thụ quỹ phép FIFO | Calculation | Quỹ phép | HR Policy | MUST | Active (Ưu tiên trừ phép bảo lưu năm cũ trước) |
| BRULE-009 | Đối soát OT (Min Reconcile) | Calculation | Payroll | C&B Policy | MUST | Active (Giờ OT hợp lệ = Min(Giờ phê duyệt, Giờ thực tế)) |

---

## 12. VAI TRÒ VÀ PHÂN QUYỀN (ROLES & RESPONSIBILITIES)

| Chức năng (Function) | Admin | HR | C&B | Manager | Employee |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hồ sơ nhân sự (Profiles)** | View | Create/Update | View | View (Đội nhóm) | View (Bản thân) |
| **Tiền lương (Payroll)** | Unlock khẩn cấp | None | Create/Lock | None | View (Bản thân) |
| **Chấm công (Attendance)** | View | View | View | Approve | Submit |
| **Hợp đồng (Contracts)** | View | Create/Update | View | None | View (Bản thân) |
| **Nhật ký (Audit Log)** | View | None | None | None | None |
| **Phân quyền (RBAC)** | Configure | None | None | None | None |

*(Lưu ý: Quyền Unlock Payroll khẩn cấp chỉ cấp cho Admin và bắt buộc ghi log vào hệ thống).*

---

## 13. QUY TRÌNH PHÊ DUYỆT (WORKFLOW & APPROVAL)

### 13.1. Phê duyệt Đơn điều chỉnh công
* **Trigger:** Nhân viên gửi đơn (Trạng thái: PENDING).
* **Validation:** Hệ thống kiểm tra BRULE-002 (Kỳ lương chưa khóa).
* **Approver:** Line Manager của phòng ban.
* **Approve:** Hệ thống cập nhật bảng công ➜ Trạng thái: APPROVED ➜ Gửi Notification.
* **Reject:** Hệ thống giữ nguyên trạng thái cũ ➜ Trạng thái: REJECTED (kèm lý do).

### 13.2. Quy trình Khóa Kỳ Lương (Payroll State Definition)
Vòng đời trạng thái Bảng lương (Cần xác nhận từ Business):
```text
Draft ➜ Processing ➜ Locked ➜ Completed
```
* **Draft:** Dữ liệu tính toán nháp, cho phép sửa đổi thủ công.
* **Processing:** Hệ thống đang chạy tổng hợp.
* **Locked:** Chốt dữ liệu (do C&B thực hiện). Kích hoạt BRULE-002 (Chặn Attendance và Leave thay đổi). Nếu có sự cố khẩn cấp, chỉ Admin có quyền **Unlock** (đưa về Processing) và phải ghi log.
* **Completed:** Trạng thái khi tiền đã được chi trả (Do Kế toán/Tài chính hoặc C&B xác nhận chi).

---

## 14. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

*(Các FR đã được viết lại dưới dạng System Behavior, không UI-centric)*

| Mã CN (FR) | Khả năng của hệ thống (System Capability) | Yêu cầu gốc (BR) |
| :--- | :--- | :--- |
| FR-001 | Hệ thống phải cho phép C&B thay đổi trạng thái kỳ lương thành `Locked` (Khóa). | BR-002 |
| FR-002 | Hệ thống phải ngăn chặn mọi yêu cầu nộp đơn/sửa đổi giờ công nếu ngày đó thuộc một kỳ lương đã bị `Locked`. | BR-002 |
| FR-003 | Hệ thống phải tự động ghi nhận log (Timestamp, IP, User, Field, OldValue, NewValue) khi dữ liệu Lương, Hợp đồng bị cập nhật/xóa. | BR-001 |
| FR-004 | Hệ thống phải cảnh báo người dùng khi hợp đồng lao động có thời hạn còn lại <= 30 ngày. | BR-003 |
| FR-005 | Hệ thống phải cho phép HR quản lý và cập nhật trạng thái ứng viên theo dạng luồng quy trình tuyển dụng (Pipeline). | BR-004 |

---

## 15. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

| Nhóm | Mô tả yêu cầu (Description) | Mục tiêu (Target) |
| :--- | :--- | :--- |
| **Performance** | Thời gian phản hồi API khi tải danh sách Bảng lương 10,000 nhân sự. | `[TBD]` giây |
| **Security** | Không cung cấp API Endpoint (REST) thực thi lệnh DELETE trên bảng AuditLogs. Bắt buộc đăng nhập (Authentication). | `[TBD]` |
| **Availability**| Mức độ sẵn sàng của hệ thống (Uptime) trong giờ hành chính. | `[TBD]` % |
| **Usability** | Giao diện phải tương thích đa thiết bị (Responsive). | `[TBD]` |
| **Privacy** | Mã hóa các trường dữ liệu nhạy cảm (Lương, CCCD). | `[TBD]` |
| **Backup** | Chu kỳ sao lưu dữ liệu (RPO / RTO). | `[TBD]` |

---

## 16. YÊU CẦU DỮ LIỆU (DATA REQUIREMENTS - CONCEPTUAL)

**Business Entity Catalogue:**

| Thực thể (Entity) | Mục đích (Purpose) | Thuộc tính chính (Key Attributes) | Ràng buộc (Validation) | Vòng đời (Retention) |
| :--- | :--- | :--- | :--- | :--- |
| Organization | Quản lý phòng ban | OrgID, Name, ParentID | ParentID hợp lệ | Vĩnh viễn |
| Employee | Hồ sơ cá nhân | EmpID, Name, DoB, CCCD | EmpID duy nhất | Vĩnh viễn |
| Employment Contract| Lưu thời hạn, lương | ContractID, EmpID, StartDate, EndDate | EndDate > StartDate | Lưu hồ sơ |
| Leave Balance | Quỹ phép cá nhân | EmpID, Year, Total, Used | Không âm | Lưu theo năm |
| Payroll Period | Quản lý kỳ lương | PeriodID, MonthYear, State | State ∈ {Draft...} | 10 năm theo luật |
| Audit Log | Vết bảo mật | LogID, UserID, Action, Timestamp | Không cho phép xóa | `[TBD]` tháng |

---

## 17. YÊU CẦU TÍCH HỢP (INTEGRATION REQUIREMENTS)

| Mã (ID) | Hệ thống / Dịch vụ | Mục đích | Chiều (Direction) | Trạng thái (Status) |
| :--- | :--- | :--- | :--- | :--- |
| INT-01 | Máy chấm công | Lấy dữ liệu IN/OUT (vân tay) | Inbound | `[NEED CONFIRMATION]` |
| INT-02 | SSO / Identity | Đăng nhập tập trung | - | `[TBD]` |
| INT-03 | Email / Notification | Gửi thư thông báo cho nhân sự | Outbound | `[TBD]` |
| INT-04 | Kế toán / Tài chính | Chuyển file lương để chi trả | Outbound | `[TBD]` |

---

## 18. YÊU CẦU BÁO CÁO (REPORTING REQUIREMENTS)

| Mã Báo cáo | Tên Báo cáo | Mục đích | Người dùng | Dữ liệu (Data Source) |
| :--- | :--- | :--- | :--- | :--- |
| RPT-001 | Báo cáo Tổng quỹ lương | Theo dõi chi phí lương theo phòng ban. | Board, C&B | Payroll, Department |
| RPT-002 | Tỷ lệ lấp đầy định biên | Theo dõi tiến độ tuyển dụng. | Board, HR | Employee, ATS |

---

## 19. YÊU CẦU THÔNG BÁO (NOTIFICATION REQUIREMENTS)

| Mã | Sự kiện (Event Trigger) | Người nhận (Recipient) | Kênh (Channel) | Thời điểm |
| :--- | :--- | :--- | :--- | :--- |
| NOTI-01 | Đơn nghỉ phép gửi đi | Line Manager | In-app | Ngay lập tức |
| NOTI-02 | Hợp đồng sắp hết hạn | HR Manager | In-app, Email | Định kỳ `[TBD]` |

---

## 20. GIẢ ĐỊNH (ASSUMPTIONS)

| Mã số | Giả định (Assumption) | Mức độ ảnh hưởng (Impact) | Chủ sở hữu (Owner) |
| :--- | :--- | :--- | :--- |
| ASM-001 | Thuế TNCN tính theo biểu thuế lũy tiến cơ bản. | Nếu sai sẽ phải lập trình lại logic tính lương. | C&B |

---

## 21. RÀNG BUỘC (CONSTRAINTS)

| Mã số | Loại Ràng buộc | Mô tả (Description) | Mức độ ảnh hưởng |
| :--- | :--- | :--- | :--- |
| CON-001 | Legal | Hệ thống phải hỗ trợ cấu hình/tính toán các khoản bảo hiểm, thuế theo quy định pháp luật hiện hành (Tỷ lệ `[CONFIGURABLE]`). | Thay đổi luật sẽ phải cập nhật tỷ lệ cấu hình. |
| CON-002 | Technical | Không xây dựng Ứng dụng điện thoại gốc (Native Mobile App). | Nhân viên phải thao tác qua trình duyệt điện thoại. |

---

## 22. RỦI RO VÀ PHỤ THUỘC (RISKS & DEPENDENCIES)

### Rủi ro (Risks)
| Mã Rủi ro | Mô tả Rủi ro (Description) | Khả năng | Ảnh hưởng | Biện pháp giảm thiểu (Mitigation) |
| :--- | :--- | :--- | :--- | :--- |
| RISK-01 | Khóa nhầm kỳ lương dẫn đến nhân viên không thể nộp đơn. | Trung bình | Cao | Thêm thông báo xác nhận trước khi Khóa. Đưa tính năng Mở Khóa cho Admin xử lý. |

### Phụ thuộc (Dependencies)
| Mã số | Phụ thuộc (Dependency) | Người chịu trách nhiệm | Mức độ ảnh hưởng |
| :--- | :--- | :--- | :--- |
| DEP-01 | Quyết định luật tính thuế TNCN chính thức từ bộ phận Tài chính. | Tài chính / Board | Cản trở việc hoàn thiện module Tiền lương. |

---

## 23. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

### AC-001: Khóa bảng lương (FR-001 & FR-002)
* **Happy Path (Positive Scenario):**
  * `Given` Kỳ lương tháng 07/2026 đang ở trạng thái `Draft`.
  * `When` C&B thực hiện chức năng Khóa bảng lương.
  * `Then` Trạng thái kỳ lương đổi thành `Locked`.
  * `And` Tất cả chức năng gửi đơn điều chỉnh công thuộc tháng 07 bị vô hiệu hóa.
* **Negative Scenario (Chặn sửa lỗi API):**
  * `Given` Kỳ lương tháng 07 đã bị `Locked`.
  * `And` Người dùng cố tình gọi trực tiếp API để sửa giờ công ngày 15/07.
  * `When` API được gửi tới máy chủ.
  * `Then` Hệ thống từ chối cập nhật và trả về thông báo lỗi "Kỳ lương đã khóa".

### AC-002: Lưu vết kiểm toán (FR-003)
* **Happy Path:**
  * `Given` Admin thay đổi Lương của Nhân viên B từ 10tr lên 12tr.
  * `When` Lưu dữ liệu thành công.
  * `Then` Hệ thống ngầm sinh ra bản ghi Audit Log chứa Giá trị cũ = 10tr, Giá trị mới = 12tr, IP.
* **Negative Scenario (Xóa Log):**
  * `Given` Admin truy cập bảng AuditLog.
  * `When` Admin cố gắng thực thi thao tác Xóa (Delete).
  * `Then` Hệ thống ngăn chặn và từ chối cấp quyền thao tác.

---

## 24. MA TRẬN THEO DÕI YÊU CẦU (TRACEABILITY MATRIX)

| Mục tiêu (OBJ) | Yêu cầu (BR) | Quy tắc (BRULE) | Chức năng (FR) | Kịch bản (UC) | Nghiệm thu (AC) | Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| OBJ-003 | BR-002 | BRULE-002 | FR-001, FR-002 | UC-001 | AC-001 | `[TBD]` |
| OBJ-005 | BR-001 | BRULE-004 | FR-003 | `[TBD]` | AC-002 | `[TBD]` |
| OBJ-004 | BR-003 | BRULE-001 | FR-004 | `[TBD]` | `[TBD]` | `[TBD]` |
| OBJ-002 | BR-005 | BRULE-005 | `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` |

**Missing Acceptance Criteria (Orphan FRs):**
* FR-004 (Cảnh báo hợp đồng) chưa có AC.
* FR-005 (Quản lý trạng thái ứng viên) chưa có AC.

---

## 25. BẢNG THUẬT NGỮ (GLOSSARY)

| Thuật ngữ | Định nghĩa | Ý nghĩa Tiếng Việt |
| :--- | :--- | :--- |
| ATS | Applicant Tracking System | Hệ thống theo dõi ứng viên |
| Onboarding | Quá trình tiếp nhận nhân sự | Hội nhập nhân sự |
| Audit Log | Bản ghi lưu vết lịch sử | Nhật ký hệ thống kiểm toán |
| C&B | Compensation & Benefits | Chuyên trách lương thưởng |

---

## 26. CÂU HỎI MỞ (OPEN QUESTIONS)

| Mã CH | Câu hỏi cần xác nhận (Question) | Yêu cầu liên quan | Mức độ | Trách nhiệm | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| OQ-01 | Mục tiêu tỷ lệ giảm sai sót (OBJ-003) và tiết kiệm thời gian (OBJ-002) cụ thể là bao nhiêu? | Business Objectives | Cao | Business Owner | Mở |
| OQ-02 | Các trạng thái chính thức của Payroll là gì? State nào được chỉnh sửa, state nào chặn Attendance, ai được Unlock? | Payroll Lifecycle | Rất cao| C&B Manager | Đã chốt (Admin Unlock) |
| OQ-03 | Luật lao động và BHXH, thuế TNCN sẽ áp dụng theo văn bản quy phạm nào? Tỷ lệ đóng BHXH hiện tại cấu hình ra sao? | BRULE-006 | Cao | C&B Manager | Mở |
| OQ-04 | Thiết bị chấm công hiện tại hỗ trợ tích hợp qua hình thức nào (API, Database, CSV, Excel)? | INT-01 | Cao | IT / Admin | Mở |
| OQ-05 | Có luật cảnh báo hợp đồng <= 30 ngày và +1 phép khi đủ 5 năm thâm niên không? | BRULE-001, BRULE-003| Trung bình| HR Manager | Mở |
| OQ-06 | Nếu nhân viên đi muộn 16-30p có bị trừ 0.5 công không? (BRULE-005) | BRULE-005 | Trung bình| HR Manager | Đã chốt (Unpaid Leave) |

---

## 27. MÂU THUẪN YÊU CẦU (REQUIREMENT CONFLICTS)

* Hiện tại chưa phát hiện mâu thuẫn (Conflict) trực tiếp giữa các yêu cầu. Tuy nhiên, nếu OQ-02 xác nhận rằng C&B có quyền tự Mở khóa (Unlock) bảng lương không thông qua Admin thì sẽ sinh ra rủi ro mâu thuẫn với BR-002 (Bảo vệ tính toàn vẹn do chính C&B làm hỏng số liệu). Cần chốt OQ-02 sớm.

---

## 28. KIỂM TRA CHẤT LƯỢNG CUỐI CÙNG (FINAL QUALITY GATE)

| Vùng chất lượng (Quality Area) | Trạng thái | Remaining Gap (Khoảng trống) |
| :--- | :--- | :--- |
| Objective & KPIs | TBD | Đang chờ Business Owner điền thông số. |
| Scope ➜ BR Coverage | TBD | Còn một số module chưa có FR/BR cụ thể (Org, Performance). |
| Legal Rules & BHXH | NEED CONFIRMATION | Đang chờ C&B xác nhận nguồn luật và tỷ lệ BHXH. |
| Payroll State Machine | NEED CONFIRMATION | Đang chờ giải đáp các câu hỏi từ OQ-02. |
| Traceability | GOOD | Đã làm rõ và sửa lại logic map của Traceability Matrix. |

---

## 29. PHỤ LỤC (APPENDIX)

**Chuẩn hóa Vòng đời Nhân viên (Employee Lifecycle):**
```mermaid
flowchart LR
    Candidate --> Recruitment
    Recruitment --> Offer
    Offer --> Onboarding
    Onboarding --> Probation
    Probation --> Employment
    Employment --> Leave/Transfer/Promotion
    Leave/Transfer/Promotion --> Offboarding
    Offboarding --> Terminated
```
*(Tài liệu này là Bản Nháp - Draft. Những khu vực đánh dấu `[TBD]` và `[NEED BUSINESS CONFIRMATION]` đang chờ được xác nhận từ Business Owner trước khi thành Baseline chính thức).*
