# MISA HRM – Business Process Map

> **Mục đích:** Tài liệu tham khảo nghiệp vụ HRM theo mô hình MISA AMIS HRM, dùng làm baseline để phân tích và xây dựng hệ thống HRM.
>
> **Lưu ý:** Đây là tài liệu benchmark nghiệp vụ, không phải tài liệu đặc tả chính thức của MISA. Các quy trình cần được đối chiếu thêm với phiên bản sản phẩm và quy định doanh nghiệp thực tế.

---

## 1. Business Process Map tổng thể

```mermaid
flowchart TD

    START([Doanh nghiệp có nhu cầu quản trị nhân sự])

    START --> ORG[1. Quản trị cơ cấu & chính sách nhân sự]

    ORG --> NEED[2. Xác định nhu cầu tuyển dụng]

    NEED --> RECRUIT[3. Tuyển dụng]

    RECRUIT -->|Ứng viên trúng tuyển| ONBOARD[4. Tiếp nhận & Onboarding]

    ONBOARD --> EMP[5. Quản lý hồ sơ & vòng đời nhân sự]

    EMP --> ATTEND[6. Chấm công & quản lý thời gian]

    EMP --> LEAVE[Quản lý nghỉ phép / công tác]

    LEAVE --> ATTEND

    ATTEND --> PAYROLL[7. Tính lương]

    EMP --> PAYROLL

    PAYROLL --> TAX[8. Thuế TNCN & BHXH]

    PAYROLL --> PAYMENT[9. Chi trả lương]

    EMP --> GOAL[10. Quản trị mục tiêu / KPI]

    GOAL --> EVALUATE[11. Đánh giá nhân viên]

    EVALUATE --> REWARD[12. Khen thưởng / kỷ luật / điều chỉnh đãi ngộ]

    REWARD --> EMP
    REWARD --> PAYROLL

    EMP --> TRAIN[13. Đào tạo & phát triển]

    TRAIN --> EVALUATE

    EMP --> PROMOTION[14. Điều chuyển / bổ nhiệm / thăng tiến]

    PROMOTION --> EMP
    PROMOTION --> PAYROLL

    EMP --> OFFBOARD[15. Nghỉ việc / Offboarding]

    OFFBOARD --> FINALPAY[Quyết toán lương & quyền lợi]

    FINALPAY --> CLOSE[Đóng hồ sơ / lưu lịch sử]

    EMP --> REPORT[16. Báo cáo & phân tích nhân sự]
    ATTEND --> REPORT
    PAYROLL --> REPORT
    RECRUIT --> REPORT
    EVALUATE --> REPORT
```

---

# 2. Danh mục Business Process

| ID | Domain | Business Process | Mục tiêu |
|---|---|---|---|
| BP-01 | Organization | Quản trị cơ cấu & chính sách | Thiết lập nền tảng tổ chức và chính sách HR |
| BP-02 | Recruitment | Xác định nhu cầu tuyển dụng | Xác định nhu cầu và kế hoạch tuyển |
| BP-03 | Recruitment | Tuyển dụng | Quản lý toàn bộ vòng đời ứng viên |
| BP-04 | Employee Lifecycle | Tiếp nhận & Onboarding | Chuyển ứng viên thành nhân viên |
| BP-05 | Employee Lifecycle | Quản lý hồ sơ nhân sự | Quản lý thông tin và lịch sử nhân viên |
| BP-06 | Time Management | Chấm công | Ghi nhận và tổng hợp thời gian làm việc |
| BP-07 | Time Management | Nghỉ phép / công tác / OT | Quản lý các đề nghị liên quan thời gian |
| BP-08 | Payroll | Tính lương | Tính và chốt bảng lương |
| BP-09 | Compliance | BHXH & Thuế TNCN | Quản lý nghĩa vụ bảo hiểm và thuế |
| BP-10 | Performance | Quản trị mục tiêu / KPI | Thiết lập và theo dõi mục tiêu |
| BP-11 | Performance | Đánh giá nhân viên | Đánh giá kết quả nhân viên |
| BP-12 | L&D | Đào tạo & phát triển | Quản lý nhu cầu và kết quả đào tạo |
| BP-13 | Reward | Khen thưởng / kỷ luật | Ghi nhận thành tích và vi phạm |
| BP-14 | Career | Điều chuyển / bổ nhiệm / thăng chức | Quản lý thay đổi vị trí nhân sự |
| BP-15 | Offboarding | Nghỉ việc | Hoàn tất thủ tục khi nhân viên nghỉ |
| BP-16 | Analytics | Báo cáo & phân tích | Cung cấp dữ liệu quản trị |

---

# 3. BP-01 – Quản trị cơ cấu & chính sách

## 3.1 Process Flow

```mermaid
flowchart LR

A[Doanh nghiệp] --> B[Thiết lập cơ cấu tổ chức]

B --> B1[Công ty]
B --> B2[Chi nhánh]
B --> B3[Đơn vị]
B --> B4[Phòng ban]
B --> B5[Vị trí]
B --> B6[Chức danh]

B --> C[Thiết lập chính sách]

C --> C1[Chính sách công]
C --> C2[Chính sách nghỉ]
C --> C3[Chính sách lương]
C --> C4[Phụ cấp]
C --> C5[Thưởng]
C --> C6[BHXH]
C --> C7[Thuế]
C --> C8[Đánh giá]

B --> D[Phân quyền]
C --> D

D --> E[HR / Manager / Employee]
```

## 3.2 Input

- Cơ cấu tổ chức
- Danh sách phòng ban
- Chức danh
- Vị trí
- Chính sách nhân sự

## 3.3 Output

- Organization
- Department
- Position
- Job Title
- HR Policy
- Permission

---

# 4. BP-02 – Xác định nhu cầu tuyển dụng

```mermaid
flowchart TD

A[Phòng ban phát sinh nhu cầu]
--> B[Đề xuất tuyển dụng]

B --> C{Phê duyệt?}

C -- Không --> B
C -- Có --> D[Lập kế hoạch tuyển dụng]

D --> E[Xác định vị trí cần tuyển]
E --> F[Xác định số lượng]
F --> G[Xác định yêu cầu]
G --> H[Xác định ngân sách]
H --> I[Tạo yêu cầu tuyển dụng]
```

### Actor

- Hiring Manager
- HR
- Approver

### Input

- Vị trí cần tuyển
- Số lượng
- Yêu cầu tuyển dụng
- Thời gian
- Ngân sách

### Output

- Recruitment Request
- Recruitment Plan

---

# 5. BP-03 – Tuyển dụng

```mermaid
flowchart TD

A[Đề xuất tuyển dụng]
--> B[Phê duyệt]

B --> C[Lập kế hoạch tuyển dụng]

C --> D[Tạo tin tuyển dụng]

D --> E[Đăng tuyển]

E --> F[Thu nhận CV / Ứng viên]

F --> G[Sàng lọc hồ sơ]

G --> H{Đạt yêu cầu?}

H -- Không --> I[Từ chối]
H -- Có --> J[Mời phỏng vấn / thi tuyển]

J --> K[Đánh giá ứng viên]

K --> L{Đạt?}

L -- Không --> I
L -- Có --> M[Đề xuất tiếp nhận]

M --> N{Phê duyệt?}

N -- Không --> M
N -- Có --> O[Gửi Offer]

O --> P{Ứng viên đồng ý?}

P -- Không --> I
P -- Có --> Q[Tiếp nhận nhân viên]
```

### Actor

| Actor | Vai trò |
|---|---|
| HR | Quản lý tuyển dụng |
| Hiring Manager | Đề xuất nhu cầu |
| Interviewer | Đánh giá ứng viên |
| Candidate | Ứng tuyển |
| Approver | Phê duyệt |

### Output

- Candidate
- Interview Result
- Evaluation Result
- Offer
- Recruitment Result

---

# 6. BP-04 – Tiếp nhận & Onboarding

```mermaid
flowchart TD

A[Ứng viên trúng tuyển]
--> B[Thu thập thông tin]

B --> C[Kiểm tra hồ sơ]

C --> D[Tạo hồ sơ nhân viên]

D --> E[Khai báo thông tin công việc]

E --> E1[Đơn vị]
E --> E2[Phòng ban]
E --> E3[Chức danh]
E --> E4[Vị trí]
E --> E5[Quản lý trực tiếp]

D --> F[Ký hợp đồng]

F --> G[Thiết lập thông tin lương]

G --> H[Thiết lập chấm công]

H --> I[Thiết lập quyền truy cập]

I --> J[Onboarding]

J --> K[Nhân viên hoạt động]
```

### Key Data

- Employee Profile
- Employment Information
- Contract
- Salary
- Department
- Position
- Manager
- Attendance Configuration
- User Account

---

# 7. BP-05 – Quản lý hồ sơ & vòng đời nhân sự

```mermaid
flowchart TD

A[Hồ sơ nhân viên]

A --> B[Thông tin cá nhân]
A --> C[Thông tin công việc]
A --> D[Hợp đồng]
A --> E[Thông tin lương]
A --> F[BHXH]
A --> G[Thuế]
A --> H[Quá trình công tác]

H --> I[Thử việc]
I --> J[Chính thức]

J --> K{Có thay đổi?}

K --> L[Điều chuyển]
K --> M[Bổ nhiệm]
K --> N[Miễn nhiệm]
K --> O[Thăng chức]
K --> P[Điều chỉnh lương]
K --> Q[Khen thưởng]
K --> R[Kỷ luật]

L --> H
M --> H
N --> H
O --> H
P --> H
Q --> H
R --> H
```

### Nguyên tắc

Mọi thay đổi quan trọng của nhân viên nên tạo **lịch sử biến động**, thay vì ghi đè dữ liệu cũ.

---

# 8. BP-06 – Chấm công

```mermaid
flowchart TD

A[Thiết lập chấm công]

A --> B[Quy định chấm công]
A --> C[Ca làm việc]
A --> D[Lịch làm việc]
A --> E[Quy định nghỉ]
A --> F[Quy định làm thêm]

B --> G[Ghi nhận dữ liệu công]
C --> G
D --> G

G --> H[Máy chấm công]
G --> I[GPS]
G --> J[Nhận diện khuôn mặt]
G --> K[Web / Mobile]

H --> L[Tổng hợp dữ liệu]
I --> L
J --> L
K --> L

L --> M[Đối soát công]

M --> N[Đi muộn / về sớm]
M --> O[Nghỉ]
M --> P[OT]
M --> Q[Thiếu công]
M --> R[Công tác]

N --> S[Bảng chấm công]
O --> S
P --> S
Q --> S
R --> S

S --> T[Nhân viên xác nhận]
T --> U[Quản lý / HR duyệt]

U --> V[Chốt công]

V --> W[Chuyển tính lương]
```

### Input

- Dữ liệu chấm công
- Ca làm
- Lịch làm
- Đơn nghỉ
- Đơn OT
- Công tác

### Output

- Attendance Record
- Timesheet
- Overtime
- Leave Data
- Payroll Input

---

# 9. BP-07 – Nghỉ phép / Công tác / OT

```mermaid
flowchart TD

A[Nhân viên]
--> B[Tạo đề nghị]

B --> C{Loại đề nghị}

C --> D[Nghỉ phép]
C --> E[Nghỉ không hưởng lương]
C --> F[Đi công tác]
C --> G[OT]

D --> H[Kiểm tra số dư phép]
H --> I[Quản lý phê duyệt]

E --> I
F --> I
G --> I

I --> J{Được duyệt?}

J -- Không --> K[Trả lại]
J -- Có --> L[Cập nhật chấm công]

L --> M[Cập nhật dữ liệu tính lương]
```

### Business Rules cần xác định

- Ai được tạo đề nghị?
- Ai phê duyệt?
- Có cần phê duyệt nhiều cấp không?
- Kiểm tra số dư phép ở thời điểm nào?
- Có cho phép âm phép không?
- OT cần điều kiện gì?
- OT có giới hạn theo ngày/tháng không?
- Đơn đã duyệt có được sửa/hủy không?

---

# 10. BP-08 – Tính lương

```mermaid
flowchart TD

A[Thiết lập chính sách lương]
--> B[Thành phần lương]

B --> C[Công thức tính lương]

C --> D[Chốt dữ liệu chấm công]

D --> E[Nhận bảng công]

E --> F[Dữ liệu nhân sự]

F --> G[Dữ liệu thưởng / phạt]

G --> H[Dữ liệu phụ cấp]

H --> I[Dữ liệu khấu trừ]

I --> J[BHXH]

J --> K[Thuế TNCN]

K --> L[Lập bảng lương]

L --> M[Tính lương]

M --> N[Kiểm tra]

N --> O{Sai?}

O -- Có --> P[Điều chỉnh dữ liệu]
P --> M

O -- Không --> Q[Phê duyệt bảng lương]

Q --> R{Được duyệt?}

R -- Không --> P
R -- Có --> S[Chốt bảng lương]

S --> T[Chi trả lương]

T --> U[Ghi nhận lịch sử trả lương]
```

### Payroll Input

- Employee
- Salary
- Attendance
- Leave
- OT
- Allowance
- Bonus
- Penalty
- Insurance
- PIT
- Deduction

### Payroll Output

- Payroll Sheet
- Payslip
- Net Salary
- Payment Data
- Payroll History

---

# 11. BP-09 – BHXH & Thuế TNCN

```mermaid
flowchart TD

A[Thông tin nhân viên]
--> B[Thông tin hợp đồng]

B --> C[Thông tin BHXH]
B --> D[Thông tin thuế]

C --> E[Biến động BHXH]

E --> F[Tăng lao động]
E --> G[Giảm lao động]
E --> H[Điều chỉnh]

F --> I[Kê khai BHXH]
G --> I
H --> I

D --> J[Tính thuế TNCN]

J --> K[Kê khai / quyết toán]

I --> L[Báo cáo]
K --> L
```

---

# 12. BP-10 – Quản trị mục tiêu / KPI

```mermaid
flowchart TD

A[Chiến lược công ty]
--> B[Mục tiêu công ty]

B --> C[Mục tiêu phòng ban]

C --> D[Mục tiêu cá nhân]

D --> E[Thiết lập KPI / chỉ tiêu]

E --> F[Theo dõi tiến độ]

F --> G[Cập nhật kết quả]

G --> H[Đánh giá]

H --> I[Kết quả KPI]
```

---

# 13. BP-11 – Đánh giá nhân viên

```mermaid
flowchart TD

A[Xác định kỳ đánh giá]
--> B[Thiết lập tiêu chí]

B --> C[Thiết lập đối tượng]

C --> D[Giao mục tiêu / KPI]

D --> E[Nhân viên tự đánh giá]

E --> F[Quản lý đánh giá]

F --> G[Đánh giá nhiều cấp / hội đồng]

G --> H[Tổng hợp kết quả]

H --> I[Phê duyệt]

I --> J[Kết quả đánh giá]

J --> K[Điều chỉnh lương]
J --> L[Thưởng]
J --> M[Đào tạo]
J --> N[Thăng chức]
```

---

# 14. BP-12 – Đào tạo & phát triển

```mermaid
flowchart TD

A[Phát hiện nhu cầu đào tạo]
--> B[Đề xuất đào tạo]

B --> C[Phê duyệt]

C --> D[Lập kế hoạch]

D --> E[Chọn khóa đào tạo]

E --> F[Đăng ký học viên]

F --> G[Tổ chức đào tạo]

G --> H[Điểm danh]

H --> I[Đánh giá sau đào tạo]

I --> J[Cập nhật kết quả]

J --> K[Theo dõi hiệu quả]
```

---

# 15. BP-13 – Khen thưởng / Kỷ luật

```mermaid
flowchart TD

A[Phát sinh sự kiện]
--> B[Đề xuất]

B --> C{Loại}

C --> D[Khen thưởng]
C --> E[Kỷ luật]

D --> F[Phê duyệt]
E --> F

F --> G[Quyết định]

G --> H[Cập nhật hồ sơ nhân viên]

H --> I{Có ảnh hưởng lương?}

I -- Có --> J[Đẩy dữ liệu sang tiền lương]
I -- Không --> K[Kết thúc]
```

---

# 16. BP-14 – Điều chuyển / Bổ nhiệm / Thăng chức

```mermaid
flowchart TD

A[Phát sinh nhu cầu]
--> B[Đề xuất thay đổi]

B --> C[Phê duyệt]

C --> D{Loại thay đổi}

D --> E[Điều chuyển]
D --> F[Bổ nhiệm]
D --> G[Miễn nhiệm]
D --> H[Thăng chức]
D --> I[Điều chỉnh lương]

E --> J[Cập nhật hồ sơ]
F --> J
G --> J
H --> J
I --> J

J --> K[Cập nhật lịch sử]

K --> L[Cập nhật chấm công]
K --> M[Cập nhật tiền lương]
K --> N[Cập nhật báo cáo]
```

---

# 17. BP-15 – Nghỉ việc / Offboarding

```mermaid
flowchart TD

A[Nhân viên có nhu cầu nghỉ]
--> B[Đề xuất nghỉ việc]

B --> C[Quản lý phê duyệt]

C --> D[HR xác nhận]

D --> E[Quyết định nghỉ việc]

E --> F[Bàn giao công việc]

F --> G[Bàn giao tài sản]

G --> H[Chốt ngày công]

H --> I[Chốt lương]

I --> J[Quyết toán quyền lợi]

J --> K[Chốt BHXH / Thuế]

K --> L[Khóa tài khoản]

L --> M[Cập nhật trạng thái nhân viên]

M --> N[Lưu lịch sử]
```

### Các vấn đề cần xử lý

- Ngày nghỉ chính thức
- Thời gian báo trước
- Bàn giao công việc
- Bàn giao tài sản
- Công còn thiếu
- Phép còn dư
- Lương chưa thanh toán
- Thưởng/phạt
- BHXH
- Thuế
- Khóa tài khoản
- Thu hồi quyền truy cập

---

# 18. BP-16 – Báo cáo & HR Analytics

```mermaid
flowchart TD

A[Tuyển dụng] --> R[HR Analytics]
B[Nhân sự] --> R
C[Chấm công] --> R
D[Tiền lương] --> R
E[Đánh giá] --> R
F[Đào tạo] --> R
G[BHXH / Thuế] --> R

R --> R1[Headcount]
R --> R2[Biến động nhân sự]
R --> R3[Turnover]
R --> R4[Chi phí nhân sự]
R --> R5[Chi phí tuyển dụng]
R --> R6[Chấm công]
R --> R7[Tiền lương]
R --> R8[Hiệu suất]
R --> R9[Đào tạo]
R --> R10[KPI]
```

---

# 19. End-to-End Integration Map

Đây là phần quan trọng nhất khi benchmark MISA HRM.

```mermaid
flowchart LR

RECRUIT[TUYỂN DỤNG]
-->|Ứng viên trúng tuyển| EMP[THÔNG TIN NHÂN SỰ]

EMP
-->|Thông tin nhân viên| ATTEND[CHẤM CÔNG]

EMP
-->|Thông tin lương| PAYROLL[TIỀN LƯƠNG]

ATTEND
-->|Bảng công đã chốt| PAYROLL

EMP
-->|Thưởng / phạt| PAYROLL

EMP
-->|BHXH / Thuế| TAX[BHXH / THUẾ]

EMP
--> GOAL[MỤC TIÊU]

GOAL
--> EVAL[ĐÁNH GIÁ]

EVAL
-->|Kết quả| EMP

EVAL
-->|Thưởng / tăng lương| PAYROLL

TRAIN[ĐÀO TẠO]
--> EVAL

EMP
--> TRAIN

EMP
--> REPORT[BÁO CÁO]

ATTEND
--> REPORT

PAYROLL
--> REPORT

RECRUIT
--> REPORT

EVAL
--> REPORT
```

---

# 20. Các domain chính

| Domain | Module | Core Process |
|---|---|---|
| A | Workforce Planning | Organization, Position, Job |
| B | Talent Acquisition | Requisition → Candidate → Interview → Offer |
| C | Employee Lifecycle | Onboarding → Employee → Contract → Transfer → Promotion → Offboarding |
| D | Time Management | Shift → Attendance → Leave → OT → Timesheet |
| E | Payroll | Payroll Input → Calculation → Approval → Payment |
| F | Performance | Goal → KPI → Evaluation → Result |
| G | Learning & Development | Training Need → Course → Attendance → Result |
| H | Reward & Compliance | Reward → Insurance → PIT → Benefits |

---

# 21. Core Master Data

HRM cần xác định rõ các nhóm master data sau:

| Nhóm | Dữ liệu |
|---|---|
| Organization | Company, Branch, Department, Unit |
| Job | Job, Position, Job Title |
| Employee | Employee Profile |
| Contract | Contract Type, Contract |
| Salary | Salary Grade, Salary Component |
| Attendance | Shift, Work Schedule |
| Leave | Leave Type, Leave Policy |
| Payroll | Payroll Component, Formula |
| Performance | Goal, KPI, Evaluation Criteria |
| Training | Course, Training Type |
| Reward | Reward Type, Discipline Type |
| Compliance | Insurance, Tax |
| Security | Role, Permission, Approval Matrix |

---

# 22. Các luồng dữ liệu quan trọng

## 22.1 Recruitment → Employee

```text
Recruitment
    ↓
Candidate
    ↓
Interview
    ↓
Evaluation
    ↓
Offer
    ↓
Accepted
    ↓
Employee
```

## 22.2 Employee → Attendance → Payroll

```text
Employee
    ↓
Work Schedule
    ↓
Attendance
    ↓
Timesheet
    ↓
Approved Timesheet
    ↓
Payroll
```

## 22.3 Performance → Reward → Payroll

```text
Goal
    ↓
KPI
    ↓
Evaluation
    ↓
Evaluation Result
    ↓
Bonus / Salary Adjustment
    ↓
Payroll
```

## 22.4 Employee → Offboarding

```text
Employee
    ↓
Resignation Request
    ↓
Approval
    ↓
Handover
    ↓
Attendance Closing
    ↓
Payroll Closing
    ↓
Benefits Settlement
    ↓
Account Deactivation
    ↓
Employee Inactive
```

---

# 23. Approval Matrix – cần nghiên cứu sâu

Khi phân tích MISA HRM, cần xác định approval cho từng nghiệp vụ:

| Process | Người tạo | Người duyệt | Có thể nhiều cấp? |
|---|---|---|---|
| Recruitment Request | Manager | HR / Director | Có |
| Leave Request | Employee | Manager | Có |
| OT Request | Employee | Manager | Có |
| Business Trip | Employee | Manager | Có |
| Payroll | HR | Manager / Director | Có |
| Salary Adjustment | HR / Manager | Director | Có |
| Promotion | Manager / HR | Director | Có |
| Transfer | Manager / HR | Director | Có |
| Training | HR | Manager | Có |
| Evaluation | Employee / Manager | Manager / HR | Có |
| Resignation | Employee | Manager / HR | Có |
| Reward | Manager / HR | Director | Có |
| Discipline | Manager / HR | Director | Có |

---

# 24. Business Rule cần bóc khi làm BA

Business Process Map chỉ mô tả **WHAT/HOW** ở mức tổng quan. Khi chuyển thành BRD/SRS cần bóc tiếp:

### Recruitment

- Điều kiện tạo yêu cầu tuyển dụng
- Hạn mức tuyển dụng
- Quy trình phê duyệt
- Điều kiện ứng viên đạt
- Điều kiện gửi Offer
- Điều kiện chuyển Candidate → Employee

### Employee

- Mã nhân viên
- Trạng thái nhân viên
- Ngày hiệu lực
- Lịch sử thay đổi
- Điều kiện sửa/xóa hồ sơ

### Attendance

- Quy định đi muộn
- Về sớm
- Thiếu công
- OT
- Ca qua ngày
- Ca đêm
- Ngày lễ
- Ngày nghỉ
- Cách làm tròn thời gian

### Leave

- Số ngày phép
- Loại phép
- Số dư phép
- Điều kiện đăng ký
- Phê duyệt
- Hủy đơn
- Chuyển phép

### Payroll

- Công thức lương
- Gross / Net
- Allowance
- Bonus
- Deduction
- OT
- Insurance
- PIT
- Làm tròn
- Kỳ lương
- Chốt lương
- Recalculate

### Performance

- Kỳ đánh giá
- Tiêu chí
- KPI
- Trọng số
- Người đánh giá
- Điểm đánh giá
- Xếp loại
- Điều chỉnh lương/thưởng

### Offboarding

- Ngày nghỉ
- Notice period
- Bàn giao
- Chốt công
- Chốt lương
- Phép còn dư
- BHXH
- Khóa tài khoản

---

# 25. BA Breakdown – từ Process Map → Jira

Có thể chuyển Business Process thành cấu trúc Jira:

```text
EPIC: HRM – Recruitment

    STORY: Recruitment Request
        TASK: Define recruitment request fields
        TASK: Define approval flow
        TASK: Define recruitment business rules

    STORY: Candidate Management
        TASK: Candidate profile
        TASK: Candidate pipeline
        TASK: Candidate status

    STORY: Interview
        TASK: Interview scheduling
        TASK: Interview evaluation

    STORY: Offer
        TASK: Offer creation
        TASK: Offer approval
        TASK: Candidate acceptance

    STORY: Candidate → Employee
        TASK: Employee conversion
        TASK: Data mapping
        TASK: Validation
```

Tương tự:

```text
EPIC: HRM – Employee
EPIC: HRM – Attendance
EPIC: HRM – Leave
EPIC: HRM – Payroll
EPIC: HRM – Performance
EPIC: HRM – Training
EPIC: HRM – Reward & Discipline
EPIC: HRM – Insurance & Tax
EPIC: HRM – Offboarding
EPIC: HRM – Reporting
```

---

# 26. Cấu trúc tài liệu BA nên làm tiếp

Sau Business Process Map này, nên phát triển thành:

```text
01. Business Process Map
        ↓
02. Business Process Catalog
        ↓
03. Actor & Role Matrix
        ↓
04. Approval Matrix
        ↓
05. Business Rules
        ↓
06. Use Case
        ↓
07. Data Model / ERD
        ↓
08. API / Integration Requirement
        ↓
09. User Story
        ↓
10. Acceptance Criteria
        ↓
11. Test Scenario
        ↓
12. UAT Test Case
```

## 26.1 Công thức BA

```text
Business Process
        ↓
Sub-process
        ↓
Use Case
        ↓
Business Rule
        ↓
User Story
        ↓
Acceptance Criteria
        ↓
Test Scenario
```

---

# 27. Kết luận

Mô hình HRM nên được nhìn theo **Employee Lifecycle**, thay vì chia module một cách độc lập:

```text
WORKFORCE PLANNING
        ↓
RECRUITMENT
        ↓
ONBOARDING
        ↓
EMPLOYEE MANAGEMENT
        ↓
ATTENDANCE / LEAVE
        ↓
PAYROLL
        ↓
PERFORMANCE
        ↓
TRAINING / DEVELOPMENT
        ↓
REWARD / CAREER
        ↓
OFFBOARDING
```

Trong đó **Employee Master Data** là trung tâm, còn:

```text
Recruitment
     ↓
Employee
 ↙   ↓   ↘
Attendance  Performance  Training
     ↓        ↓
   Payroll ← Reward
     ↓
  Reports
```

là các luồng liên thông cốt lõi cần đặc biệt quan tâm khi thiết kế HRM.
