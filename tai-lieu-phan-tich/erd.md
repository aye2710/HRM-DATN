# ENTITY RELATIONSHIP DIAGRAM (ERD)

**Dự án:** Hệ thống quản trị nguồn nhân lực (HRM) - Ứng dụng tại Công ty TNHH LLA

---

## 1. Mục đích

Tài liệu mô tả:
- Các thực thể dữ liệu (Entities)
- Quan hệ giữa các thực thể (Relationships)
- Cardinality (Bản số)
- Khóa chính (PK) & Khóa ngoại (FK) cơ bản

ERD là cơ sở cho:
- Database Design (Thiết kế CSDL)
- API Design
- Class Diagram
- Logic xử lý nghiệp vụ

---

## 2. Core Design Principle (Nguyên tắc thiết kế cốt lõi)

Nguyên tắc thiết kế hệ thống xoay quanh một thực thể trung tâm duy nhất:
```
[ EMPLOYEE ]
```
Toàn bộ nghiệp vụ (Chấm công, Nghỉ phép, Đánh giá, Tính lương) đều liên kết trực tiếp với thực thể `Employee`. Mô hình này tối ưu hóa hiệu suất truy vấn cho 1 công ty công nghệ độc lập.

---

## 3. Organization Domain (Cơ cấu tổ chức)

### Department – Position
**Relationship:**
```
Department (1) ─────────< Position (N)
```
**Meaning:**
- Một phòng ban có nhiều chức danh/vị trí công việc.
- Mỗi chức danh chỉ thuộc về một phòng ban duy nhất.

---

## 4. Employee Domain (Hồ sơ nhân sự)

### Department – Employee
```
Department (1) ─────────< Employee (N)
```

### Position – Employee
```
Position (1) ─────────< Employee (N)
```

### Employee – UserAccount
**Relationship:**
```
Employee (1) ───────── UserAccount (1)
```
**Meaning:** Một nhân sự chỉ có một tài khoản đăng nhập nội bộ (Internal Portal).

### Employee – Dependent
**Relationship:**
```
Employee (1) ─────────< Dependent (N)
```
**Meaning:** Một nhân sự có thể đăng ký nhiều người phụ thuộc để tính giảm trừ gia cảnh thuế TNCN.

### Employee – Contract
**Relationship:**
```
Employee (1) ─────────< Contract (N)
```
**Meaning:** Một nhân sự có nhiều bản hợp đồng lao động theo thời gian (Thử việc, 1 năm, Không xác định thời hạn).

---

## 5. Recruitment Domain (Tuyển dụng)

### Candidate – CandidateAccount
**Relationship:**
```
Candidate (1) ───────── CandidateAccount (1)
```
**Meaning:** Mỗi ứng viên có 1 tài khoản trên Candidate Portal.

### Position – JobRequisition
```
Position (1) ─────────< JobRequisition (N)
```
**Meaning:** Yêu cầu tuyển dụng phải gắn với một Position cụ thể.

### JobRequisition – JobPosting
```
JobRequisition (1) ───────── JobPosting (1)
```

### Candidate – Interview
```
Candidate (1) ─────────< Interview (N)
```

### JobRequisition – Interview
```
JobRequisition (1) ─────────< Interview (N)
```

### Candidate – Offer
```
Candidate (1) ─────────< Offer (N)
```

---

## 6. Core HR & Operations Domain (Vận hành nhân sự)

### Employee – Attendance (Chấm công)
```
Employee (1) ─────────< Attendance (N)
```
**Meaning:** Một nhân sự có nhiều bản ghi chấm công (log hàng ngày).

### Employee – ShiftAssignment (Ca làm việc)
```
Employee (1) ─────────< ShiftAssignment (N)
```

### Employee – LeaveRequest (Đơn nghỉ phép)
```
Employee (1) ─────────< LeaveRequest (N)
```

### Employee – LeaveBalance (Quỹ phép)
```
Employee (1) ─────────< LeaveBalance (N)
```
**Meaning:** Một nhân sự có quỹ phép năm được cấp theo từng năm.

### Employee – OnboardingAssignment
```
Employee (1) ─────────< OnboardingAssignment (N)
```

### Employee – KPI
```
Employee (1) ─────────< KPI (N)
```
**Meaning:** Nhân viên được giao nhiều mục tiêu KPI theo các kỳ.

### Manager (Employee) – KPI (self-referencing)
```
Employee (Manager) (1) ─────────< KPI (N)
```
**Meaning:** Quản lý trực tiếp là người chấm điểm KPI.

---

## 7. Payroll & Tax Domain (Tiền lương & Thuế)

### Employee – Payroll (Bảng lương)
```
Employee (1) ─────────< Payroll (N)
```
**Meaning:** Một nhân sự có nhiều bản ghi tính lương theo các tháng.

### Payroll – Payslip (Phiếu lương)
```
Payroll (1) ───────── Payslip (1)
```

### Employee – SalaryRevision (Lịch sử lương)
```
Employee (1) ─────────< SalaryRevision (N)
```
**Meaning:** Lưu lại lịch sử thay đổi mức lương cơ bản của nhân sự.

### Employee – Allowance (Phụ cấp)
```
Employee (1) ─────────< EmployeeAllowance (N)
```

### Employee – Deduction (Khấu trừ)
```
Employee (1) ─────────< EmployeeDeduction (N)
```

---

## 8. Asset & Document Domain (Tài sản & Tài liệu)

### Asset – AssetAssignment
```
Asset (1) ─────────< AssetAssignment (N)
```

### Employee – AssetAssignment
```
Employee (1) ─────────< AssetAssignment (N)
```
**Meaning:** Hệ thống ghi nhận lịch sử cấp phát tài sản cho nhân sự.

### Employee – Document
```
Employee (1) ─────────< Document (N)
```

---

## 9. Manager Relationship (Quản lý trực tiếp)

### Employee – Employee (self-referencing)
**Relationship:**
```
Employee (Manager) (1) ─────────< Employee (Staff) (N)
```
**Meaning:** Một Manager quản lý nhiều nhân sự cấp dưới. Điều này được thực hiện thông qua trường `ManagerID` (Khóa ngoại trỏ đến `EmployeeID`) trong bảng Employee.

---

## 10. Logical ERD Summary (Sơ đồ Logic)

```
Department
  │
  └── 1:N ── Position
               │
               ├── 1:N ── JobRequisition ── 1:1 ── JobPosting
               │
               └── 1:N ── EMPLOYEE (Center Entity)
                              │
                              ├── 1:1 ── UserAccount
                              ├── 1:N ── Contract
                              ├── 1:N ── Dependent
                              ├── 1:N ── Attendance
                              ├── 1:N ── LeaveRequest
                              ├── 1:N ── KPI
                              ├── 1:N ── Payroll ── 1:1 ── Payslip
                              ├── 1:N ── AssetAssignment
                              └── (ManagerID) ── 1:N ── EMPLOYEE (Self)
```

---

## 11. Cardinality Summary

| Relationship                    | Cardinality |
| ------------------------------- | ----------- |
| Department → Position           | 1:N         |
| Department → Employee           | 1:N         |
| Position → Employee             | 1:N         |
| Position → JobRequisition       | 1:N         |
| JobRequisition → JobPosting     | 1:1         |
| JobRequisition → Interview      | 1:N         |
| Candidate → CandidateAccount    | 1:1         |
| Candidate → Interview           | 1:N         |
| Candidate → Offer               | 1:N         |
| Employee → UserAccount          | 1:1         |
| Employee → Dependent            | 1:N         |
| Employee → Contract             | 1:N         |
| Employee → ShiftAssignment      | 1:N         |
| Employee → Attendance           | 1:N         |
| Employee → LeaveRequest         | 1:N         |
| Employee → LeaveBalance         | 1:N         |
| Employee → OnboardingAssignment | 1:N         |
| Employee → KPI                  | 1:N         |
| Employee (Manager) → KPI        | 1:N         |
| Employee → Payroll              | 1:N         |
| Payroll → Payslip               | 1:1         |
| Employee → SalaryRevision       | 1:N         |
| Employee → EmployeeAllowance    | 1:N         |
| Employee → EmployeeDeduction    | 1:N         |
| Employee → AssetAssignment      | 1:N         |
| Asset → AssetAssignment         | 1:N         |
| Employee → Document             | 1:N         |
| Employee → Employee (Manager)   | 1:N         |

---

## 12. Kết luận

Mô hình ERD đã được tinh gọn và tập trung hoàn toàn vào thực thể **EMPLOYEE**, giúp việc truy vấn dữ liệu chấm công, tính lương và phân quyền (dựa trên Department và ManagerID) trở nên trực tiếp và đạt hiệu suất cao nhất cho bài toán HRM chuyên sâu của Công ty TNHH LLA.
