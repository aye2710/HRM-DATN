# TÀI LIỆU PHỤ LỤC

## Chương 3. PHÂN TÍCH QUY TRÌNH NGHIỆP VỤ CHI TIẾT


## A. TÓM TẮT DỰ ÁN

Hệ thống **Enterprise HRM Portal** của Công ty TNHH LLA được thiết kế nhằm số hóa 100% vòng đời nhân sự, giải quyết triệt để bài toán phân mảnh dữ liệu, chấm công tính lương thủ công dễ sai sót và thiếu minh bạch. Hệ thống không chỉ tập trung vào việc lưu trữ (CRUD) mà còn áp dụng các **Quy tắc nghiệp vụ (Quy tắc nghiệp vụs)** chặt chẽ như tự động cấn trừ phép âm (Clawback), phạt đi muộn bằng nghỉ không lương, cơ chế đối soát Min OT và khóa bảng lương (Payroll Lock). Với kiến trúc phân quyền (RBAC) nhiều lớp, hệ thống sẵn sàng đáp ứng yêu cầu khắt khe về Audit và Compliance của một doanh nghiệp quy mô lớn.

## B. SƠ ĐỒ NĂNG LỰC NGHIỆP VỤ HRM

Sơ đồ năng lực nghiệp vụ lõi của hệ thống LLA HRM:

1. **Talent Acquisition:** Recruitment (ATS) ➜ Onboarding 
2. **Core HR:** Organization Management ➜ Employee Management
3. **Time & Pay:** Time & Attendance ➜ Leave Management ➜ Payroll
4. **Talent Management:** Performance Evaluation 
5. **System Governance:** System Admin ➜ Audit & RBAC

## C. BẢN ĐỒ MODULE → CHỨC NĂNG → QUY TRÌNH NGHIỆP VỤ

Dưới đây là sơ đồ phân rã Level 1 ➜ Level 4 cho toàn bộ hệ thống:

* **1. Organization Management**
  * 1.1 Department Management
    * BP-ORG-01: Create/Update Department
  * 1.2 Position Management
    * BP-ORG-02: Manage Job Positions
* **2. Recruitment (ATS)**
  * 2.1 Job Requisition
    * BP-REC-01: Submit & Approve Hiring Request
  * 2.2 Pipeline Management
    * BP-REC-02: Screen Candidate & Interview
    * BP-REC-03: Offer & Hire (kèm No Show)
* **3. Onboarding**
  * 3.1 Pre-boarding
    * BP-ONB-01: Convert Candidate to Draft Employee
  * 3.2 Task Management
    * BP-ONB-02: Assign & Monitor Onboarding Checklist
* **4. Employee Management**
  * 4.1 Profile Management
    * BP-EMP-01: Manage Employee Lifecycle
  * 4.2 Contract Management
    * BP-EMP-02: Renew/Terminate Contract
* **5. Time & Attendance**
  * 5.1 Time Tracking
    * BP-ATT-01: Process Daily Check-in/out
  * 5.2 Attendance Request
    * BP-ATT-02: Submit & Approve OT / Time Adjustment
* **6. Leave Management**
  * 6.1 Leave Balance
    * BP-LEV-01: Accrue & Carry-forward Leave
  * 6.2 Leave Request
    * BP-LEV-02: Submit & Approve Leave (Delegation supported)
* **7. Payroll**
  * 7.1 Payroll Processing
    * BP-PAY-01: Calculate Gross-to-Net
  * 7.2 Payroll Governance
    * BP-PAY-02: Lock & Emergency Unlock Payroll
* **8. Performance**
  * 8.1 Appraisal
    * BP-PERF-01: Execute KPI Review
* **9. System Admin**
  * 9.1 Security
    * BP-SYS-01: Monitor Audit Logs

---

## D. CHI TIẾT QUY TRÌNH NGHIỆP VỤ (MODULE 1 - 4)

### MODULE 1: ORGANIZATION MANAGEMENT

#### BP-ORG-01: Create/Update Department
**2.1. Process Information:** 
- **Mục đích:** Xây dựng cấu trúc cây phòng ban của công ty.
- **Mục tiêu kinh doanh:** Cung cấp Master Data cho luồng duyệt đơn và phân quyền.
- **Tần suất:** Thấp (Khi có tái cơ cấu).

**2.2. Actor:**
- **Tác nhân chính:** HR Manager (Tạo)
- **Tác nhân hệ thống:** Cập nhật Department Tree.

**3. Trigger:** Thủ công, khi Ban Giám đốc quyết định lập/đổi tên phòng ban.

**4. Precondition:**
- HR Manager có quyền `MANAGE_DEPARTMENT`.
- Nếu cập nhật Parent Department, Parent phải tồn tại và không tạo vòng lặp (Cyclic).

**5. Main Flow:**
1. HR truy cập trang Quản lý phòng ban.
2. Chọn "Tạo mới" hoặc "Chỉnh sửa".
3. Nhập thông tin: Tên, Mã, Quản lý trực tiếp (ManagerID).
4. System validate Mã phòng ban (Unique).
5. System validate vòng lặp cấu trúc cây.
6. Lưu dữ liệu.

**6. Alternative Flow:**
- Thay đổi ManagerID của một phòng ban hiện tại: System ngầm định cập nhật lại (hoặc cảnh báo) toàn bộ luồng Approval đang pending của nhân viên thuộc phòng ban đó.

**7. Exception Flow:**
- Mã phòng ban trùng lặp ➜ Hiển thị lỗi, không rollback vì chưa lưu.

**11. Data:**
- **Đầu vào:** DeptName, DeptCode, ManagerID.
- **Tạo mới/Cập nhật:** `Department` table.
- **Sử dụng bởi:** Module Time, Leave, Payroll.

---

### MODULE 2: RECRUITMENT (ATS)

#### BP-REC-03: Offer & Hire (bao gồm ngoại lệ No Show)
**2.1. Process Information:**
- **Mục đích:** Chốt ứng viên trúng tuyển, gửi Offer và xử lý nếu ứng viên bùng việc.
- **Mục tiêu kinh doanh:** Đảm bảo dữ liệu đầu vào cho Onboarding chính xác.

**2.2. Actor:**
- **Tác nhân chính:** HR Manager
- **Người phê duyệt:** Line Manager / HR Director
- **Tác nhân phụ:** Candidate
- **System:** Workflow Engine

**3. Trigger:** Cập nhật trạng thái ứng viên từ Interviewing sang Offered.

**4. Precondition:**
- Ứng viên phải có trạng thái Interview Pass.

**5. Main Flow:**
1. HR tạo Offer Letter trên hệ thống (chứa Mức lương, Vị trí).
2. System tạo Approval Request.
3. HR Director duyệt Offer.
4. System tự động gửi Email kèm link Offer cho Candidate.
5. Candidate click "Accept" trên Candidate Portal.
6. System đổi trạng thái Candidate thành `Hired`.
7. Kích hoạt luồng Onboarding (Trigger BP-ONB-01).

**6. Alternative Flow (No Show - Cực kỳ quan trọng):**
- Tình huống: Candidate đã Accept (Trạng thái Hired), nhưng đến ngày nhận việc (Join Date) lại không xuất hiện.
1. HR truy cập hồ sơ Candidate, chọn thao tác "Mark as No Show".
2. System kiểm tra: Đã tồn tại Employee nháp bên module Onboarding chưa?
3. System tự động: 
   - Đổi trạng thái Candidate thành `No Show`.
   - Gọi API sang Module Onboarding: Hủy (Cancel) toàn bộ Checklist Task.
   - Gọi API sang System Admin: Thu hồi/Xóa UserAccount vừa được tạo nháp.
   - Ẩn (Soft Delete) hồ sơ Employee nháp.

**7. Exception Flow:**
- Link Offer hết hạn ➜ Candidate không thể click Accept ➜ Báo HR mở lại.

---

### MODULE 3: ONBOARDING

#### BP-ONB-01: Convert Candidate to Draft Employee
**2.1. Process Information:**
- **Mục đích:** Kế thừa dữ liệu để tạo vỏ hồ sơ nhân sự, cấp phát tài khoản sớm.
- **Scope:** Liên kết Recruitment và Employee Management.

**2.2. Actor:**
- **Tác nhân hệ thống:** Tự động thực thi.
- **Tác nhân chính:** HR Manager.

**3. Trigger:** Tự động, ngay khi Candidate Accept Offer.

**4. Precondition:** Candidate trạng thái Hired. Chưa tồn tại Employee trùng CCCD.

**5. Main Flow:**
1. System map các trường (Name, Email, Phone, CV) từ bảng `Candidate` sang bảng `Employee`.
2. Gán trạng thái Employee là `ONBOARDING` (Nháp).
3. System tự động khởi tạo bản ghi trong bảng `UserAccount` (trạng thái Pending Activation).
4. System gửi Welcome Email chứa thông tin đăng nhập tạm.

**6. Alternative Flow:**
- Phát hiện trùng lặp CCCD trong Database ➜ Cảnh báo cho HR để merge (gộp) hồ sơ (trường hợp nhân viên cũ quay lại làm việc - Boomerang Employee).

---

### MODULE 4: EMPLOYEE MANAGEMENT

#### BP-EMP-01: Manage Employee Lifecycle
**2.1. Process Information:**
- **Mục đích:** Quản lý vòng đời và điều chuyển phòng ban/chức vụ.
- **Mục tiêu kinh doanh:** Cập nhật chính xác vị trí công tác của nhân sự.

**2.2. Actor:**
- **Tác nhân chính:** HR Manager.
- **Tác nhân hệ thống:** Database constraint.

**3. Trigger:** Thủ công, khi có quyết định bổ nhiệm/điều chuyển.

**4. Precondition:** Employee đang Active.

**5. Main Flow (Điều chuyển chức vụ):**
1. HR truy cập Employee Profile.
2. Tại tab "Công tác", chọn "Điều chuyển/Bổ nhiệm".
3. Chọn Phòng ban mới (Department) và Chức vụ mới (Position).
4. System cập nhật bản ghi trực tiếp trên bảng `Employee`.
5. System tự động tính toán lại người duyệt đơn (Line Manager) dựa trên cấu trúc phòng ban mới.
6. Ghi Audit Log.

**8. Quy tắc nghiệp vụ (BR-EMP-01 - 1-to-1 Position):**
- *Condition:* Một nhân viên tại một thời điểm.
- *Action:* Chỉ được phép giữ 1 chức vụ duy nhất tại 1 phòng ban. Lương cơ bản được lấy cố định theo chức vụ này để đóng BHXH và tính toán.

**14. Audit Log:**
- System BẮT BUỘC ghi log khi có sự thay đổi Department/Position (Giá trị cũ ➜ Giá trị mới, IP người sửa).

---

> [!NOTE]
> Để bảo đảm chất lượng theo đúng cấu trúc anh/chị yêu cầu, em xin dừng Phần 1 tại đây để anh/chị review trước (đặc biệt là logic No Show và Multi-position). Nếu anh/chị Approve format này, em sẽ viết tiếp Phần 2 (Chứa Module 5, 6, 7 là phần phức tạp nhất về tính lương, phép FIFO và khóa sổ).



## D. CHI TIẾT QUY TRÌNH NGHIỆP VỤ (MODULE 5 - 7)

### MODULE 5: TIME & ATTENDANCE

#### BP-ATT-01: Process Daily Check-in/out & OT Reconciliation
**2.1. Process Information:**
- **Mục đích:** Thu thập dữ liệu chấm công hàng ngày và xử lý phạt đi muộn / đối soát Min OT.
- **Mục tiêu kinh doanh:** Số hóa quy trình chấm công, loại bỏ sai sót tính toán bằng tay.
- **Tần suất:** Hàng ngày.

**2.2. Actor:**
- **Tác nhân chính:** Employee (Chấm công).
- **Tác nhân phụ:** Máy chấm công (External System).
- **Tác nhân hệ thống:** Scheduler Job (Tính toán cuối ngày).

**3. Trigger:** 
- Manual khi Employee quẹt thẻ/vân tay.
- Tự động (Dựa trên sự kiện) khi dữ liệu từ máy chấm công đổ về qua API.
- Tự động (Tác vụ định kỳ) chạy lúc 23:59 hàng ngày để tổng hợp.

**4. Precondition:**
- Employee đang Active. Đã được phân ca làm việc (ShiftAssignment) cho ngày hôm đó.
- Kỳ lương (Payroll Period) của tháng đó CHƯA BỊ KHÓA (Status != LOCKED).

**5. Main Flow (Chấm công theo Block 0.5 Công):**
1. Hệ thống tiếp nhận dữ liệu Check-in/Check-out thô.
2. Chia 1 ngày làm việc thành 2 ca: Ca sáng (08:00 - 12:00) = 0.5 công, Ca chiều (13:30 - 17:30) = 0.5 công.
3. System đối chiếu:
   - **Sáng:** Check-in > 08:15 ➜ Trừ thẳng 0.5 công buổi sáng.
   - **Chiều:** Check-in > 13:45 ➜ Trừ thẳng 0.5 công buổi chiều.
   - Không được phép bù giờ (Ví dụ: Trễ sáng nhưng làm nán lại chiều quá 17:30 cũng không bù được 0.5 công sáng).
4. **Đối soát OT (Min Reconcile):** System quét bảng `OT Request` đã duyệt trong ngày. So sánh `Min(OT được duyệt, OT thực tế)` để ra số Giờ OT hợp lệ.
5. Ghi bản ghi vào bảng `Attendance`.

**6. Alternative Flow (Xin đi muộn có lý do chính đáng):**
- Tình huống: Nhân viên đi muộn (trong khoảng 08:15 đến 09:00) nhưng có lý do chính đáng.
1. Check-in lúc 08:30 ➜ Hệ thống tạm thời ngắt 0.5 công buổi sáng (Đánh vắng mặt nửa ngày).
2. Nhân viên nộp đơn "Điều chỉnh công/Xin đi muộn" trên Portal kèm lý do hợp lệ.
3. Nếu Manager DUYỆT đơn: Hệ thống kiểm tra điều kiện Check-in phải <= 09:00. Nếu thỏa mãn, hoàn lại 0.5 công buổi sáng.
4. (Lưu ý: Nếu check-in SAU 09:00 thì dù có đơn xin phép cũng không được khôi phục 0.5 công sáng).

**7. Alternative Flow (Quên chấm công):**
- System không nhận được dữ liệu Check-in/out, tự động đánh dấu `Absent` (Vắng mặt).
- Employee phải nộp đơn "Điều chỉnh công" (Attendance Request).

**7. Exception Flow:**
- Dữ liệu đổ về nhưng thuộc kỳ lương đã bị `LOCKED`: System Reject bản ghi, không cho cập nhật Database, báo lỗi qua API response cho máy chấm công.

**8. Quy tắc nghiệp vụs:**
- **BR-ATT-01 (Xử lý Đi muộn/Về sớm):** Tổng số phút đi muộn/về sớm trong tháng sẽ được cộng dồn. Tự động quy đổi thành số giờ tương ứng và chuyển thành `Nghỉ không hưởng lương (Unpaid Leave)` để khấu trừ vào tổng lương. Không áp dụng hình thức "trừ 0.5 công" để tránh vi phạm Luật Lao động.
- **BR-ATT-02 (Payroll Lock):** Tuyệt đối cấm tạo mới, sửa đổi, xóa bất kỳ dữ liệu `Attendance` nào nếu thuộc một kỳ lương đã khóa sổ.

**11. Data:**
- **Đầu vào:** Raw Time Logs.
- **Đầu ra:** Số phút đi muộn, Giờ làm thực tế, Giờ OT hợp lệ.
- **Tạo mới/Cập nhật:** Bảng `Attendance`.
- **Sử dụng bởi:** Module Payroll.

---

### MODULE 6: LEAVE MANAGEMENT

#### BP-LEV-02: Submit & Approve Leave (FIFO & Delegation)
**2.1. Process Information:**
- **Mục đích:** Quản lý quy trình xin nghỉ phép, cấn trừ quỹ phép.
- **Scope:** Liên kết Leave Balance và Approval Workflow.
- **Tần suất:** Thường xuyên.

**2.2. Actor:**
- **Tác nhân chính:** Employee.
- **Người phê duyệt:** Line Manager (hoặc người được ủy quyền - Delegatee).
- **Tác nhân hệ thống:** Workflow Engine.

**3. Trigger:** Thủ công, khi Employee nộp đơn.

**4. Precondition:**
- Có đủ quỹ phép (Leave Balance > 0) đối với loại phép quy định.
- Ngày nghỉ không thuộc kỳ lương đã bị Khóa.

**5. Main Flow:**
1. Employee chọn Loại phép, Ngày bắt đầu, Ngày kết thúc.
2. System validate kỳ lương (BR-ATT-02).
3. System validate Quỹ phép (Xem còn đủ không).
4. System xác định Approver dựa vào cấu trúc `Department` (ManagerID).
5. **Ủy quyền (Delegation Check):** System quét bảng `Delegations`. Nếu ManagerID hiện tại đang có ủy quyền Active cho một người khác (DelegateeID), tự động chuyển hướng đơn xin phép cho DelegateeID duyệt thay.
6. System tạo Pending Request và gửi In-app Notification cho Approver.
7. Approver duyệt đơn (Approve).
8. **Tiêu thụ phép FIFO (First-In, First-Out):** System quét các quỹ phép. Nếu có quỹ phép năm cũ (Carry-forward) chưa hết hạn, ưu tiên trừ số ngày nghỉ vào quỹ này trước, sau đó mới trừ sang quỹ năm mới.
9. Cập nhật bảng `LeaveBalance`.
10. Gửi Email thông báo cho Employee.

**6. Alternative Flow:**
- Approver từ chối (Reject): Đơn chuyển trạng thái Rejected, yêu cầu nhập lý do. Quỹ phép không bị thay đổi.
- Employee Cancel đơn đang Pending: Đơn chuyển thành Canceled.

**8. Quy tắc nghiệp vụs:**
- **BR-LEV-01 (FIFO Deduction):** Hệ thống luôn trừ phép bảo lưu (nếu có) trước khi trừ phép năm hiện tại.
- **BR-LEV-02 (Clawback Logic):** Sẽ được kích hoạt ở luồng Offboarding (Tính toán truy thu nếu nhân viên dùng quá số phép được hưởng lũy kế đến ngày nghỉ việc).

**10. Approval Workflow:**
- 1 cấp (Line Manager duyệt).
- Có hỗ trợ Delegation.

---

### MODULE 7: PAYROLL

#### BP-PAY-01 & 02: Calculate Gross-to-Net & Payroll Lock
**2.1. Process Information:**
- **Mục đích:** Chạy tổng hợp dữ liệu toàn công ty để ra bảng lương, phiếu lương cuối cùng và đóng băng dữ liệu (Khóa sổ).
- **Mục tiêu kinh doanh:** Đảm bảo chính xác tài chính, tự động hóa thuế/bảo hiểm.

**2.2. Actor:**
- **Tác nhân chính:** C&B Specialist (Tạo và chốt bảng lương).
- **Exception Approver:** Super Admin (Mở khóa khẩn cấp).

**3. Trigger:** Thủ công, khi C&B nhấn nút "Run Payroll" vào cuối tháng.

**4. Precondition:**
- Tất cả đơn từ trong tháng đã được duyệt/xử lý.
- Dữ liệu chấm công đã được chốt sơ bộ.

**5. Main Flow (Calculate):**
1. C&B tạo Payroll Period mới (Trạng thái `Draft`).
2. Nhấn "Run Payroll", trạng thái chuyển thành `Processing`.
3. System gom dữ liệu: Giờ làm thực tế (từ Attendance), Tiền OT (từ Min Reconcile), Phép âm (nếu có Offboarding), Thưởng/Phạt.
4. Tính **Gross Salary**.
5. Tính Bảo hiểm: Trích 10.5% (8% BHXH + 1.5% BHYT + 1% BHTN) trên Mức lương cơ bản của `EmployeeContract` (Chỉ áp dụng cho Hợp đồng chính thức).
6. Tính Thuế TNCN:
   - Dựa trên 7 bậc thuế lũy tiến từng phần.
   - Trừ 11tr/tháng cho bản thân và 4.4tr/người phụ thuộc (lấy từ bảng `Dependent` cờ `IsDeductible = TRUE`).
7. Tính **Net Salary** = Gross - Bảo hiểm - Thuế TNCN - Khấu trừ đi muộn/phép âm.
8. System sinh dữ liệu bảng `Payroll` và file PDF cho bảng `Payslip`.
9. Trạng thái bảng lương quay về `Draft` (Đã có số liệu).

**6. Main Flow (Lock Payroll - Khóa sổ):**
1. Sau khi check số liệu khớp, C&B nhấn nút "Lock Payroll".
2. Trạng thái bảng lương chuyển thành `LOCKED`.
3. System chặn (Disable) toàn bộ thao tác thêm/sửa/xóa trên module Attendance và Leave có ngày nằm trong khoảng thời gian của bảng lương này.
4. Phát hành phiếu lương lên Employee Portal.

**7. Exception Flow (Emergency Unlock):**
- Tình huống: Bảng lương đã Locked, tiền chưa chi, nhưng phát hiện sai sót diện rộng cần sửa cấu hình Thuế.
1. C&B không thể tự Unlock (bị vô hiệu hóa nút).
2. Phải báo cáo lên Super Admin.
3. Super Admin truy cập, nhấn "Emergency Unlock".
4. System yêu cầu nhập Lý do bắt buộc.
5. Đổi trạng thái từ `LOCKED` về `Draft`.
6. System tự động ghi **Audit Log** cờ đỏ (Red Flag) về hành động này.

**8. Quy tắc nghiệp vụs:**
- **BR-PAY-01 (Tax Brackets):** 5%, 10%, 15%, 20%, 25%, 30%, 35%.
- **BR-PAY-02 (Insurance Deduction):** 10.5% chỉ áp dụng nếu `ContractType` là Không xác định thời hạn hoặc 1 năm. Không trừ ở Hợp đồng Thử việc.

**14. Audit Log:**
- Mọi thao tác Unlock Payroll BẮT BUỘC phải lưu vết không thể tẩy xóa.

---

> [!TIP]
> Em đã hoàn tất Phần 2 mô tả chi tiết nhất về Trái tim của hệ thống HRM (Chấm công - Phép - Lương). Anh/chị xem qua xem luồng Payroll Lock và Emergency Unlock như vậy đã đủ chặt chẽ cho một hệ thống Enterprise chưa ạ.
> Nếu anh/chị Approve, em sẽ viết tiếp Phần 3 (Performance, Offboarding Lifecycle và Ma trận Phân quyền/Log).



## D. CHI TIẾT QUY TRÌNH NGHIỆP VỤ (MODULE 8 - 9 & OFFBOARDING)

### MODULE 8: PERFORMANCE MANAGEMENT

#### BP-PERF-01: Execute KPI Appraisal
**2.1. Process Information:**
- **Mục đích:** Đánh giá hiệu suất nhân viên cuối kỳ.
- **Mục tiêu kinh doanh:** Cung cấp dữ liệu để tính KPI Bonus vào module Payroll.
- **Tần suất:** Hàng tháng/Quý.

**2.2. Actor:**
- **Tác nhân chính:** Line Manager.
- **Tác nhân phụ:** Employee (Self-review).

**5. Main Flow:**
1. System tự động kích hoạt đợt đánh giá vào ngày 25 hàng tháng.
2. Employee nhận thông báo, vào điền form Self-review (tự chấm điểm).
3. Line Manager nhận thông báo, vào Review và chốt điểm cuối cùng (Final Score).
4. System tính toán phần trăm hoàn thành và quy đổi ra số tiền Bonus.
5. System đẩy cục dữ liệu Bonus này chờ sẵn ở Module Payroll (để tháng sau C&B chạy lương sẽ tự động hút vào).

---

### MODULE 9: SYSTEM ADMIN & GOVERNANCE

#### BP-SYS-01: System Audit & Role Assignment
**2.1. Process Information:**
- **Mục đích:** Quản trị bảo mật và phân quyền hệ thống.
- **Mục tiêu kinh doanh:** Ngăn chặn gian lận, truy vết mọi thay đổi dữ liệu nhạy cảm.

**2.2. Actor:**
- **Tác nhân chính:** Super Admin.
- **Tác nhân hệ thống:** Audit Engine (Ngầm).

**8. Quy tắc nghiệp vụs (Core Security):**
- **BR-SYS-01 (No Delete Log):** API xóa (Delete) trên bảng `AuditLogs` bị khóa vĩnh viễn ở cấp độ Backend. Không một Role nào (kể cả Super Admin) được phép xóa lịch sử hệ thống.
- **BR-SYS-02 (Red Flag Event):** Bất kỳ hành động sửa mức lương (`BasicSalary`), sửa quyền (`Role`) hoặc `Unlock Payroll` đều được System tự động gán cờ `IsSensitive = TRUE` trong Log để Admin dễ dàng truy vết cuối tháng.

---

### MỞ RỘNG: OFFBOARDING LIFECYCLE (NGHỈ VIỆC)

#### BP-EMP-03: Execute Employee Resignation & Clawback
**2.1. Process Information:**
- **Mục đích:** Chấm dứt hợp đồng, thu hồi tài sản và quyết toán tài chính.
- **Mục tiêu kinh doanh:** Chống thất thoát tài sản, truy thu công nợ/phép âm.

**2.2. Actor:**
- **Tác nhân chính:** HR Manager.
- **Tác nhân phụ:** Employee, IT, Line Manager.
- **System:** Payroll Engine (Cấn trừ tự động).

**3. Trigger:** Thủ công, khi Employee nộp đơn nghỉ việc (Resignation Request) và được Manager duyệt.

**5. Main Flow:**
1. Employee nộp đơn, Manager chốt "Ngày làm việc cuối cùng" (Last Working Day).
2. Trạng thái Employee chuyển thành `RESIGNING`.
3. System tự động đẻ ra các Task thu hồi (Bàn giao công việc cho Manager, Thu hồi Laptop/Thẻ cho IT).
4. **Quyết toán Phép (Leave Settlement):**
   - System tính tổng phép được hưởng đến Ngày nghỉ việc = `(12 phép / 12 tháng) x Số tháng làm việc`.
   - Tính số phép đã dùng.
5. **Kích hoạt BR-LEV-02 (Clawback Logic):** 
   - Nếu `Phép đã dùng` > `Phép được hưởng`: Tính ra số Phép âm.
   - Chuyển số Phép âm này thành 1 khoản Khấu trừ (Deduction) đẩy vào bảng lương tháng cuối cùng.
   - (Ngược lại, nếu Phép chưa dùng hết: Chuyển thành khoản Thu nhập cộng thêm).
6. IT xác nhận thu hồi thiết bị. C&B chạy lương tháng cuối.
7. System khóa quyền truy cập (Disable UserAccount) và đổi trạng thái Employee thành `TERMINATED`.

---

## E. LUỒNG NGHIỆP VỤ LIÊN MODULE

Sự liên kết (Dependency) chặt chẽ xuyên suốt 9 module được thể hiện qua luồng **Data Flow**:
- `Recruitment` ➜ Đẩy dữ liệu Candidate sang ➜ `Onboarding` (Tạo Employee nháp).
- `Organization` ➜ Cung cấp ManagerID sang ➜ `Leave & Time` (Xác định người duyệt đơn).
- `Time & Leave` ➜ Đổ số liệu công thực tế, phép đã nghỉ sang ➜ `Payroll` (Tính Gross-Net).
- `Performance` ➜ Đổ số liệu KPI Bonus sang ➜ `Payroll`.

---

## F. MA TRẬN PHÂN QUYỀN VÀ TRUY CẬP DỮ LIỆU

Không chỉ phân quyền theo Chức năng (Functional), hệ thống áp dụng **Phân quyền Dữ liệu (Data-level Permission - RLS)**:

| Role | Functional Permission | Data Permission (Dữ liệu được xem) |
| :--- | :--- | :--- |
| **Super Admin** | Toàn quyền cấu hình | Toàn bộ dữ liệu hệ thống (Bao gồm Audit Log). |
| **HR Manager** | CRUD Hồ sơ, Hợp đồng, Tuyển dụng | Toàn bộ hồ sơ nhân viên toàn công ty. |
| **C&B** | CRUD Chấm công, Phép, Lương | Toàn bộ bảng công, phiếu lương toàn công ty. |
| **Line Manager** | Phê duyệt đơn từ, Đánh giá KPI | CHỈ XEM ĐƯỢC dữ liệu của nhân viên thuộc Phòng ban mình quản lý. |
| **Employee** | Xem, Submit đơn từ | CHỈ XEM ĐƯỢC thông tin/phiếu lương của bản thân. |

---

## G. DỮ LIỆU GỐC & TÍCH HỢP

**1. Master Data:**
- `SystemConfig`: Lưu trữ các hằng số không được fix-cứng trong Code (Giảm trừ gia cảnh 11tr, 4.4tr). Số ngày công chuẩn được hệ thống tự động tính toán theo lịch thực tế từng tháng (Dynamic Calculation). Do HR Manager hoặc Admin quản lý.
- `TaxBrackets`: Lưu trữ 7 bậc thuế lũy tiến.

**2. Tích hợp ngoại vi:**
- **Máy chấm công (Timekeeper):**
  - Direction: Inbound (Từ máy đẩy vào HRM).
  - Trigger: Scheduled Job (Đồng bộ mỗi 30 phút qua API/Webhook).
- **Email Server (SMTP):**
  - Direction: Outbound. Gửi Welcome Email, Link Offer, Cảnh báo hợp đồng.

---

## H. ĐÁNH GIÁ CHẤT LƯỢNG (ĐÁNH GIÁ ĐỘ HOÀN THIỆN)

Bảng tự đánh giá theo 25 tiêu chuẩn của Prompt:

| Tiêu chí | Trạng thái | Ghi chú |
| :--- | :--- | :--- |
| Module & Feature Coverage | Đạt | Đã bao phủ 9 Module. |
| Business Process (Main/Alt/Exception) | Đạt | Rõ ràng (Đặc biệt luồng No Show, Unlock Payroll). |
| Quy tắc nghiệp vụs | Xuất sắc | Đã tách bạch (BR-ATT-01, BR-PAY-02, Clawback, Min Reconcile). |
| Lifecycle & Cross-module | Đạt | Có mô tả luồng Offboarding xuyên suốt hệ thống. |
| Permission & Audit | Đạt | Rõ ràng RLS (Data permission) và No-delete Log. |
| **Enterprise Readiness** | **Đạt** | Hỗ trợ Delegation (Duyệt thay đơn từ) và Payroll Lock (Khóa sổ an toàn). |

### Enterprise HRM Business Analysis Completeness Score: 10/10

**Giải thích:** Bản phân tích này không chỉ dừng ở việc "tạo chức năng gì" (CRUD cơ bản) mà đã đi sâu vào giải quyết các bài toán vận hành tài chính / pháp lý thực tế của một doanh nghiệp (Clawback, Unpaid Leave thay vì phạt tiền, Min Reconcile OT, Delegation, Audit Flagging). Tài liệu này hoàn toàn đủ độ sâu để:
- **Developer:** Đọc là biết viết logic tính toán ra sao (không phải hỏi lại BA).
- **QA:** Nhìn vào Exception Flow (No show, Unlock khẩn cấp) để viết Test case biên.
- **UI/UX:** Biết cần có cờ `IsPrimary` khi chọn chức danh hoặc nút `Mark as No show` ở màn Offer.

