# ĐẶC TẢ MÔ HÌNH DỮ LIỆU (DATA MODEL SPECIFICATION)

**Dự án:** Hệ thống quản trị nguồn nhân lực (HRM) - Ứng dụng tại Công ty TNHH LLA

---

## 1. Mục đích

Tài liệu mô tả:
- Cấu trúc các Data Entity (Thực thể dữ liệu)
- Thuộc tính dữ liệu (Attributes)
- Khóa chính (Primary Key - PK)
- Khóa ngoại (Foreign Key - FK)

Tài liệu là cơ sở xây dựng ERD, Database Schema và RESTful API.

---

## 2. Core Entity Overview (Tổng quan thực thể cốt lõi)

- **Organization Domain:** Department, Position
- **Employee Domain:** Employee, Dependent, UserAccount, EmployeeContract
- **Recruitment Domain:** Candidate, CandidateAccount, JobPosting, JobRequisition, Interview, Offer
- **Onboarding Domain:** OnboardingTask, OnboardingAssignment
- **Attendance & HR Domain:** Shift, ShiftAssignment, Attendance, LeaveRequest, LeaveBalance, KPI, Probation, HRDecision
- **Payroll & Tax Domain:** Payroll, Payslip, AllowanceType, DeductionType, EmployeeAllowance, EmployeeDeduction, SalaryRevision, SocialInsuranceConfig, TaxConfig
- **Asset & Document Domain:** Asset, AssetAssignment, Document
- **System Domain:** AuditLog, Notification

---

## 3. Organization Domain (Tổ chức)

### 3.1 Department (Phòng ban)

| Field               | Type     | Constraint     | Description |
| ------------------- | -------- | -------------- | ----------- |
| DepartmentID        | UUID     | PRIMARY KEY    | Khóa chính |
| DepartmentCode      | VARCHAR  | UNIQUE         | Mã phòng ban |
| DepartmentName      | VARCHAR  |                | Tên phòng ban |
| ManagerID           | UUID     | FOREIGN KEY    | Trưởng phòng (FK tới Employee) |
| Status              | ENUM     | ACTIVE/INACTIVE| Trạng thái |
| CreatedAt           | DATETIME |                | |

### 3.2 Position (Chức vụ)

| Field        | Type     | Constraint     | Description |
| ------------ | -------- | -------------- | ----------- |
| PositionID   | UUID     | PRIMARY KEY    | Khóa chính |
| DepartmentID | UUID     | FOREIGN KEY    | Thuộc phòng ban nào |
| PositionCode | VARCHAR  | UNIQUE         | Mã chức vụ |
| PositionName | VARCHAR  |                | Tên chức vụ (VD: BA Lead) |
| Level        | VARCHAR  |                | Cấp bậc (Intern, Fresher, Junior) |
| Status       | ENUM     | ACTIVE/INACTIVE| |

---

## 4. Employee Domain (Hồ sơ nhân sự)

### 4.1 Employee (Nhân viên)

Đại diện cho một hồ sơ nhân sự toàn diện.

| Field          | Type     | Constraint     | Description |
| -------------- | -------- | -------------- | ----------- |
| EmployeeID     | UUID     | PRIMARY KEY    | Khóa chính |
| EmployeeCode   | VARCHAR  | UNIQUE         | Mã nhân viên |
| FullName       | VARCHAR  |                | Họ và tên |
| DateOfBirth    | DATE     |                | Ngày sinh |
| Gender         | ENUM     | MALE/FEMALE    | Giới tính |
| CCCD           | VARCHAR  | UNIQUE         | Số CMND/CCCD |
| TaxCode        | VARCHAR  |                | Mã số thuế cá nhân |
| PhoneNumber    | VARCHAR  |                | Số điện thoại |
| PersonalEmail  | VARCHAR  |                | Email cá nhân |
| WorkEmail      | VARCHAR  | UNIQUE         | Email công việc |
| ManagerID      | UUID     | FOREIGN KEY    | Quản lý trực tiếp (FK tới EmployeeID) |
| JoinDate       | DATE     |                | Ngày gia nhập |
| ResignDate     | DATE     |                | Ngày nghỉ việc (nếu có) |
| BankAccountNumber | VARCHAR |                | Số tài khoản ngân hàng |
| BankName       | VARCHAR  |                | Tên ngân hàng |
| Status         | ENUM     |                | PROBATION, ACTIVE, TERMINATED |

### 4.2 UserAccount (Tài khoản nội bộ)

| Field        | Type     | Constraint     |
| ------------ | -------- | -------------- |
| UserID       | UUID     | PRIMARY KEY    |
| EmployeeID   | UUID     | FOREIGN KEY    |
| Username     | VARCHAR  | UNIQUE         |
| PasswordHash | VARCHAR  |                |
| Role         | ENUM     | ADMIN, HR, MANAGER, EMPLOYEE |
| Status       | ENUM     | ACTIVE/LOCKED  |
| LastLogin    | DATETIME |                |

### 4.3 Dependent (Người phụ thuộc)

| Field          | Type     | Constraint     |
| -------------- | -------- | -------------- |
| DependentID    | UUID     | PRIMARY KEY    |
| EmployeeID     | UUID     | FOREIGN KEY    |
| FullName       | VARCHAR  |                |
| Relationship   | VARCHAR  | Con, Bố mẹ...  |
| DateOfBirth    | DATE     |                |
| TaxCode        | VARCHAR  |                |
| IsDeductible   | BOOLEAN  | Đang được tính giảm trừ hay không |

### 4.4 EmployeeContract (Hợp đồng lao động)

| Field          | Type     | Constraint     |
| -------------- | -------- | -------------- |
| ContractID     | UUID     | PRIMARY KEY    |
| EmployeeID     | UUID     | FOREIGN KEY    |
| ContractNo     | VARCHAR  | UNIQUE         |
| ContractType   | ENUM     | THU_VIEC, 1_NAM, KHONG_THOI_HAN |
| StartDate      | DATE     |                |
| EndDate        | DATE     |                |
| BasicSalary    | DECIMAL  | Lương cơ bản ghi trên hợp đồng |
| Status         | ENUM     | DRAFT, ACTIVE, EXPIRED |

### 4.5 EmployeePositions (Quản lý chức vụ & Kiêm nhiệm)

| Field        | Type     | Constraint     | Description |
| ------------ | -------- | -------------- | ----------- |
| ID           | UUID     | PRIMARY KEY    | |
| EmployeeID   | UUID     | FOREIGN KEY    | |
| DepartmentID | UUID     | FOREIGN KEY    | |
| PositionID   | UUID     | FOREIGN KEY    | |
| IsPrimary    | BOOLEAN  |                | Đánh dấu chức vụ chính để tính lương |
| Status       | ENUM     | ACTIVE/INACTIVE| |

### 4.6 Delegations (Ủy quyền duyệt đơn)

| Field        | Type     | Constraint     | Description |
| ------------ | -------- | -------------- | ----------- |
| DelegationID | UUID     | PRIMARY KEY    | |
| DelegatorID  | UUID     | FOREIGN KEY    | Người ủy quyền |
| DelegateeID  | UUID     | FOREIGN KEY    | Người được ủy quyền |
| StartDate    | DATE     |                | |
| EndDate      | DATE     |                | |
| Status       | ENUM     | ACTIVE/REVOKED | |

---

## 5. Recruitment Domain (Tuyển dụng)

### 5.1 JobRequisition (Yêu cầu tuyển dụng)

| Field             | Type     | Constraint     |
| ----------------- | -------- | -------------- |
| RequisitionID     | UUID     | PRIMARY KEY    |
| DepartmentID      | UUID     | FOREIGN KEY    |
| PositionID        | UUID     | FOREIGN KEY    |
| RequestedQuantity | INT      | Số lượng cần tuyển |
| ApprovedBy        | UUID     | FK -> Employee (Manager) |
| Status            | ENUM     | PENDING, APPROVED, REJECTED |

### 5.2 JobPosting (Tin đăng tuyển)

| Field             | Type     | Constraint     |
| ----------------- | -------- | -------------- |
| JobPostingID      | UUID     | PRIMARY KEY    |
| RequisitionID     | UUID     | FOREIGN KEY    |
| Title             | VARCHAR  |                |
| Description       | TEXT     |                |
| ClosingDate       | DATE     |                |
| Status            | ENUM     | DRAFT, PUBLISHED, CLOSED |

### 5.3 Candidate (Ứng viên)

| Field       | Type     | Constraint     |
| ----------- | -------- | -------------- |
| CandidateID | UUID     | PRIMARY KEY    |
| FullName    | VARCHAR  |                |
| Email       | VARCHAR  | UNIQUE         |
| PhoneNumber | VARCHAR  |                |
| CVFileUrl   | VARCHAR  |                |
| Status      | ENUM     | NEW, INTERVIEWING, OFFERED, HIRED, REJECTED |

### 5.4 CandidateAccount (Tài khoản cổng ứng viên)

| Field        | Type     | Constraint     |
| ------------ | -------- | -------------- |
| CandidateID  | UUID     | PK, FK         |
| PasswordHash | VARCHAR  |                |

### 5.5 Interview (Phỏng vấn)

| Field             | Type     | Constraint     |
| ----------------- | -------- | -------------- |
| InterviewID       | UUID     | PRIMARY KEY    |
| CandidateID       | UUID     | FOREIGN KEY    |
| RequisitionID     | UUID     | FOREIGN KEY    |
| InterviewerID     | UUID     | FK -> Employee |
| InterviewDate     | DATETIME |                |
| Result            | ENUM     | PASS, FAIL, PENDING |
| Notes             | TEXT     |                |

### 5.6 Offer (Mời nhận việc)

| Field          | Type     | Constraint     |
| -------------- | -------- | -------------- |
| OfferID        | UUID     | PRIMARY KEY    |
| CandidateID    | UUID     | FOREIGN KEY    |
| BasicSalary    | DECIMAL  | Lương đề xuất  |
| OfferDate      | DATE     |                |
| ExpireDate     | DATE     |                |
| Status         | ENUM     | SENT, ACCEPTED, DECLINED |

---

## 6. Attendance & Leave Domain (Chấm công & Phép)

### 6.1 Shift (Ca làm việc gốc)

| Field     | Type     | Constraint     |
| --------- | -------- | -------------- |
| ShiftID   | UUID     | PRIMARY KEY    |
| ShiftCode | VARCHAR  | UNIQUE         |
| StartTime | TIME     | VD: 08:00:00   |
| EndTime   | TIME     | VD: 17:30:00   |
| BreakTime | TIME     | VD: 01:30:00   |

### 6.2 ShiftAssignment (Phân ca nhân viên)

| Field        | Type     | Constraint     |
| ------------ | -------- | -------------- |
| AssignmentID | UUID     | PRIMARY KEY    |
| EmployeeID   | UUID     | FOREIGN KEY    |
| ShiftID      | UUID     | FOREIGN KEY    |
| WorkDate     | DATE     | Ngày áp dụng   |

### 6.3 Attendance (Bản ghi chấm công)

| Field            | Type     | Constraint     |
| ---------------- | -------- | -------------- |
| AttendanceID     | UUID     | PRIMARY KEY    |
| EmployeeID       | UUID     | FOREIGN KEY    |
| Date             | DATE     | Ngày chấm công |
| CheckInTime      | DATETIME |                |
| CheckOutTime     | DATETIME |                |
| ActualWorkHours  | DECIMAL  | Số giờ làm thực tế |
| LateMinutes      | INT      | Số phút đi muộn |
| OTHours          | DECIMAL  | Số giờ làm thêm |
| Status           | ENUM     | NORMAL, LATE, ABSENT |

### 6.4 LeaveRequest (Đơn xin nghỉ phép)

| Field        | Type     | Constraint     |
| ------------ | -------- | -------------- |
| LeaveID      | UUID     | PRIMARY KEY    |
| EmployeeID   | UUID     | FOREIGN KEY    |
| LeaveType    | ENUM     | ANNUAL, SICK, UNPAID |
| StartDate    | DATE     |                |
| EndDate      | DATE     |                |
| Status       | ENUM     | PENDING, APPROVED, REJECTED |
| ApprovedBy   | UUID     | FK -> Employee (Manager) |

### 6.5 LeaveBalance (Quỹ phép năm)

| Field          | Type     | Constraint     |
| -------------- | -------- | -------------- |
| LeaveBalanceID | UUID     | PRIMARY KEY    |
| EmployeeID     | UUID     | FOREIGN KEY    |
| Year           | INT      | VD: 2026       |
| TotalDays      | DECIMAL  | Tổng ngày được cấp (VD: 12) |
| UsedDays       | DECIMAL  | Số ngày đã nghỉ |
| RemainingDays  | DECIMAL  | Số ngày còn lại |

---

## 7. Payroll Domain (Tiền lương)

### 7.1 Payroll (Bảng lương tháng)

| Field            | Type     | Constraint     |
| ---------------- | -------- | -------------- |
| PayrollID        | UUID     | PRIMARY KEY    |
| EmployeeID       | UUID     | FOREIGN KEY    |
| PeriodMonth      | INT      | VD: 8          |
| PeriodYear       | INT      | VD: 2026       |
| StandardWorkDays | DECIMAL  | Công chuẩn (VD: 22) |
| ActualWorkDays   | DECIMAL  | Công thực tế (VD: 20.5) |
| BaseSalary       | DECIMAL  | Lương cơ bản   |
| AllowanceAmount  | DECIMAL  | Tổng phụ cấp   |
| OTBolnus         | DECIMAL  | Tiền OT        |
| GrossSalary      | DECIMAL  | Tổng thu nhập  |
| InsuranceDeduct  | DECIMAL  | Khấu trừ BHXH (10.5%) |
| TaxDeduct        | DECIMAL  | Khấu trừ thuế TNCN |
| NetSalary        | DECIMAL  | Thực lĩnh      |
| Status           | ENUM     | DRAFT, LOCKED, PAID |

### 7.2 Payslip (Phiếu lương điện tử)

| Field         | Type     | Constraint     |
| ------------- | -------- | -------------- |
| PayslipID     | UUID     | PRIMARY KEY    |
| PayrollID     | UUID     | FOREIGN KEY    |
| PDFFileUrl    | VARCHAR  | Link tải file PDF |
| CreatedAt     | DATETIME |                |

### 7.3 SalaryRevision (Lịch sử đổi lương)

| Field              | Type     | Constraint     |
| ------------------ | -------- | -------------- |
| RevisionID         | UUID     | PRIMARY KEY    |
| EmployeeID         | UUID     | FOREIGN KEY    |
| OldBaseSalary      | DECIMAL  |                |
| NewBaseSalary      | DECIMAL  |                |
| EffectiveDate      | DATE     | Ngày bắt đầu áp dụng |

### 7.4 RewardDiscipline (Khen thưởng / Kỷ luật)

| Field              | Type     | Constraint     |
| ------------------ | -------- | -------------- |
| RecordID           | UUID     | PRIMARY KEY    |
| EmployeeID         | UUID     | FOREIGN KEY    |
| RecordType         | ENUM     | REWARD, DISCIPLINE |
| Reason             | VARCHAR  | Lý do thưởng/phạt |
| Amount             | DECIMAL  | Số tiền        |
| TargetPayrollMonth | INT      | Tháng áp dụng vào lương |
| TargetPayrollYear  | INT      | Năm áp dụng vào lương |
| Status             | ENUM     | PENDING, APPROVED, APPLIED |

---

## 8. Asset & Document Domain (Tài sản & Tài liệu)

### 8.1 Asset (Tài sản IT / Thiết bị)

| Field          | Type     | Constraint     | Description |
| -------------- | -------- | -------------- | ----------- |
| AssetID        | UUID     | PRIMARY KEY    | Khóa chính |
| AssetCode      | VARCHAR  | UNIQUE         | Mã tài sản |
| AssetName      | VARCHAR  |                | VD: Macbook Pro 16, Test Device iPhone 15 |
| AssetType      | ENUM     | LAPTOP, MONITOR, TEST_DEVICE, LICENSE | Loại tài sản |
| Status         | ENUM     | AVAILABLE, IN_USE, BROKEN | Trạng thái |

### 8.2 AssetAssignment (Cấp phát tài sản)

| Field            | Type     | Constraint     |
| ---------------- | -------- | -------------- |
| AssignmentID     | UUID     | PRIMARY KEY    |
| AssetID          | UUID     | FOREIGN KEY    |
| EmployeeID       | UUID     | FOREIGN KEY    |
| AssignedDate     | DATE     | Ngày cấp phát  |
| ReturnedDate     | DATE     | Ngày thu hồi   |

### 8.3 Document (Hồ sơ số hóa)

| Field          | Type     | Constraint     |
| -------------- | -------- | -------------- |
| DocumentID     | UUID     | PRIMARY KEY    |
| EmployeeID     | UUID     | FOREIGN KEY    |
| DocType        | VARCHAR  | VD: CCCD_MatTruoc, BangCap |
| FileUrl        | VARCHAR  |                |

---

## 9. System Domain (Hệ thống)

### 9.1 AuditLog (Lịch sử thao tác)

| Field       | Type     | Constraint     |
| ----------- | -------- | -------------- |
| LogID       | UUID     | PRIMARY KEY    |
| UserID      | UUID     | Người thao tác |
| Action      | VARCHAR  | CREATE, UPDATE, DELETE |
| TableName   | VARCHAR  | Bảng bị tác động |
| RecordID    | UUID     | ID của record   |
| OldValues   | JSON     | Dữ liệu cũ     |
| NewValues   | JSON     | Dữ liệu mới    |
| CreatedAt   | DATETIME |                |
