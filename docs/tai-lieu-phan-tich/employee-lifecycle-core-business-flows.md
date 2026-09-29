# VÒNG ĐỜI NHÂN SỰ & CÁC LUỒNG NGHIỆP VỤ CỐT LÕI

**Dự án:** Hệ thống quản trị nguồn nhân lực (HRM) - Ứng dụng tại Công ty TNHH LLA

---

## 1. Mục đích tài liệu

Tài liệu mô tả các luồng nghiệp vụ trọng tâm của hệ thống HRM. Các luồng này đại diện cho toàn bộ vòng đời nhân viên từ khi ứng tuyển (Candidate) đến khi làm việc chính thức và cuối cùng là nghỉ việc (Resignation).

---

## 2. Employee Lifecycle (Vòng đời nhân viên)

Hệ thống quản lý vòng đời nhân viên theo mô hình chuẩn sau:

```
Candidate (Ứng viên)
  ↓
Interview (Phỏng vấn)
  ↓
Offer (Mời nhận việc)
  ↓
Hired (Đồng ý nhận việc)
  ↓
Onboarding (Tiếp nhận & Cấp phát tài sản)
  ↓
Probation (Thử việc - tạo Employee profile)
  ↓
Probation Evaluation (Đánh giá thử việc)
  ↓
Active Employee (Nhân viên chính thức)
  ↓
Transfer / Promotion (Điều chuyển nội bộ / Thăng tiến)
  ↓
Performance Evaluation (Đánh giá KPI)
  ↓
Payroll Processing (Tính lương hàng tháng)
  ↓
Resignation (Nghỉ việc & Thu hồi tài sản)
  ↓
Inactive (Khóa tài khoản)
```

---

## 3. Core Business Flow 01 — Recruitment To Employee

**Mục tiêu:** Biến ứng viên thành nhân viên mới thông qua quá trình tuyển dụng.

**Actor:** HR & C&B, Manager, Candidate, System

| Bước   | Mô tả                              | Thực hiện    |
| ------ | ----------------------------------- | ------------ |
| 1      | HR & C&B tạo yêu cầu tuyển dụng (Job Requisition) | HR & C&B      |
| 2      | Hệ thống tự động đăng JobPosting lên Candidate Portal | HR & C&B / System |
| 3      | Ứng viên xem tin tuyển dụng trên Candidate Portal | Candidate |
| 4      | Ứng viên đăng ký tài khoản và nộp CV online | Candidate |
| 5      | Hệ thống tự động tạo Candidate Profile và gửi thông báo | System |
| 6      | HR & C&B sàng lọc hồ sơ              | HR & C&B      |
| 7      | HR & C&B lên lịch phỏng vấn          | HR & C&B      |
| 8      | Ứng viên xem lịch phỏng vấn trên Portal | Candidate |
| 9     | Manager thực hiện phỏng vấn và ghi nhận kết quả         | Manager      |
| 10     | HR & C&B tạo Offer Letter                   | HR & C&B      |
| 11     | Manager phê duyệt Offer             | Manager      |
| 12     | Ứng viên xem và phản hồi Offer trên Portal (Chấp nhận) | Candidate |
| 13     | Khởi tạo quy trình Onboarding                 | System       |

**Kết quả:** Ứng viên (Candidate) có trạng thái Hired và chuẩn bị Onboarding.

---

## 4. Core Business Flow 02 — Onboarding Flow

**Mục tiêu:** Tiếp nhận nhân viên mới, tạo hồ sơ Employee chính thức.

**Actor:** HR & C&B, Employee, System

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | HR & C&B tạo hồ sơ Employee nháp từ thông tin Candidate | HR & C&B      |
| 2    | Hệ thống tự động tạo tài khoản User và gửi Email kích hoạt | System       |
| 3    | IT cấp phát thiết bị làm việc (Asset) và email công ty | IT      |
| 4    | Nhân viên ký hợp đồng thử việc | Employee     |
| 5    | Nhân viên hoàn thành các thủ tục Onboarding Checklist | Employee / HR & C&B      |
| 6    | Chuyển trạng thái Employee thành Probation (Thử việc) | System |

**Luồng rẽ nhánh (Exception - No Show):**
Nếu ứng viên không đến nhận việc như đã hẹn:
1. HR chọn trạng thái `No Show` trên Candidate.
2. Hệ thống tự động xóa/ẩn hồ sơ `Employee` nháp.
3. Hủy Onboarding Task và thu hồi quyền đăng nhập (UserAccount).

**Kết quả:** Nhân viên chính thức bắt đầu công việc, hoặc bị hủy quy trình Onboarding nếu No Show.

---

## 5. Core Business Flow 03 — Probation & Evaluation Flow

**Mục tiêu:** Quản lý giai đoạn thử việc và đánh giá trước khi ký hợp đồng chính thức.

**Actor:** HR & C&B, Manager, Employee

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Employee làm việc và chấm công trong thời gian thử việc | Employee |
| 2    | Hệ thống nhắc nhở HR/Manager trước khi hết hạn thử việc (vd: trước 7 ngày) | System |
| 3    | Manager tạo bài đánh giá năng lực thử việc       | Manager      |
| 4    | Ghi nhận kết quả: Pass/Fail/Extend  | Manager      |
| 5a   | **Pass:** HR & C&B làm hợp đồng chính thức, hệ thống chuyển Employee sang Active | HR & C&B / System      |
| 5b   | **Fail:** Khởi tạo quy trình nghỉ việc  | HR & C&B   |

**Kết quả:** Employee trở thành Active hoặc bị chấm dứt hợp đồng.

---

## 6. Core Business Flow 04 — Internal Transfer / Promotion Flow

**Mục tiêu:** Điều chuyển nhân viên giữa các phòng ban hoặc thăng tiến chức vụ.

**Actor:** HR & C&B, Manager

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Khởi tạo yêu cầu điều chuyển/thăng tiến       | Manager / HR & C&B   |
| 2    | Xác định phòng ban mới và chức vụ mới             | HR & C&B   |
| 3    | Phê duyệt yêu cầu              | Manager      |
| 4    | Cập nhật Department/Position cho Employee                 | HR & C&B / System       |
| 5    | Lưu lịch sử thay đổi (Promotion/Transfer History) để làm cơ sở tính lương nếu có đổi mức lương | System       |

**Kết quả:** Nhân viên làm việc tại vị trí mới.

---

## 7. Core Business Flow 05 — Attendance Flow (Chấm công)

**Mục tiêu:** Ghi nhận thời gian làm việc chính xác làm cơ sở tính lương.

**Actor:** Employee, Manager, System

| Bước | Mô tả                                        | Thực hiện  |
| ---- | -------------------------------------------- | ---------- |
| 1    | Nhân viên Check-in trên Employee Portal (hoặc API từ máy chấm công)                           | Employee   |
| 2    | Hệ thống ghi nhận giờ vào                  | System     |
| 3    | Nhân viên Check-out                          | Employee   |
| 4    | Hệ thống so sánh với Ca làm việc (Shift) được phân công | System |
| 5    | Tự động xác định: Normal (đủ giờ), Late (đi muộn), Early Leave (về sớm) | System |
| 6    | Nhân viên gửi đơn xin làm thêm giờ (OT) qua Portal            | Employee   |
| 7    | Manager duyệt đơn OT                 | Manager    |
| 8    | Hệ thống tổng hợp giờ OT hợp lệ vào cuối tháng | System     |

**Kết quả:** Dữ liệu chấm công thô được chuẩn hóa (Attendance Record).

---

## 8. Core Business Flow 06 — Leave Request Flow (Nghỉ phép)

**Mục tiêu:** Quản lý quy trình xin nghỉ và quỹ phép năm.

**Actor:** Employee, Manager, System

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Nhân viên tạo đơn nghỉ phép trên Portal (chọn loại: Phép năm, ốm, thai sản...)        | Employee     |
| 2    | Hệ thống kiểm tra quỹ phép năm còn lại của nhân viên. Cảnh báo nếu vượt quá.                  | System     |
| 3    | Manager nhận thông báo và xem xét đơn               | Manager      |
| 4    | Manager phê duyệt hoặc từ chối             | Manager      |
| 5    | Nếu phê duyệt, hệ thống cập nhật tự động trừ quỹ phép năm (Leave Balance)            | System       |
| 6    | Cập nhật dữ liệu vào bảng chấm công tháng            | System       |

**Kết quả:** Đơn nghỉ phép được xử lý và ghi nhận trừ công.

---

## 9. Core Business Flow 07 — KPI Evaluation Flow

**Mục tiêu:** Đánh giá hiệu suất nhân viên định kỳ (tháng/quý).

**Actor:** Manager, Employee, System

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Manager tạo bảng mục tiêu (KPI Assignment) đầu kỳ           | Manager      |
| 2    | Nhân viên cập nhật kết quả/tiến độ thực hiện         | Employee     |
| 3    | Cuối kỳ, nhân viên submit tự đánh giá (Self-review)               | Employee       |
| 4    | Manager thực hiện chấm điểm KPI cuối cùng               | Manager      |
| 5    | Hệ thống tính tổng điểm KPI theo trọng số                      | System       |
| 6    | Lưu kết quả để sử dụng cho module tính lương (KPI Bonus)               | System       |

**Kết quả:** Điểm KPI cá nhân được ghi nhận.

---

## 10. Core Business Flow 08 — Payroll Processing Flow (Tính lương)

**Mục tiêu:** Tự động hóa quá trình tính lương phức tạp, xuất phiếu lương.

**Actor:** HR & C&B, System

| Bước | Mô tả                                    | Thực hiện       |
| ---- | ---------------------------------------- | --------------- |
| 1    | HR & C&B tạo Kỳ tính lương (Payroll Period)                             | HR & C&B |
| 2    | Hệ thống thu thập dữ liệu tự động: Attendance, Leave, OT, KPI | System          |
| 3    | Tính Lương cơ bản dựa trên ngày công thực tế (Actual Working Days)                        | System          |
| 4    | Tính Phụ cấp cố định và không cố định (theo Salary Component)        | System          |
| 5    | Tính Tiền OT và Thưởng KPI                           | System          |
| 6    | **Tính Tổng thu nhập (Gross Salary)** = Base + Allowance + OT + Bonus | System |
| 7    | Tính phần trăm đóng BHXH, BHYT, BHTN (8% + 1.5% + 1%) của NLĐ | System        |
| 8    | Tính Thuế TNCN (Dựa trên Thu nhập chịu thuế = Gross - BHXH - Giảm trừ gia cảnh) theo biểu thuế lũy tiến từng phần | System          |
| 9   | Tính các khoản Khấu trừ khác (Phạt đi muộn, tạm ứng)       | System          |
| 10   | **Tính Net Salary** = Gross - BHXH - Thuế TNCN - Khấu trừ | System |
| 11   | Lưu bảng lương, phát hành Phiếu lương điện tử (Payslip) lên Employee Portal                              | System          |
| 12   | Chốt bảng lương (Locked), không cho chỉnh sửa nữa                          | HR & C&B |

**Kết quả:** Nhân viên nhận được Payslip trực quan. Doanh nghiệp có báo cáo chi phí lương.

---

## 11. Core Business Flow 09 — Employee Resignation Flow (Nghỉ việc)

**Mục tiêu:** Quản lý quy trình nghỉ việc minh bạch và quyết toán lương cuối, đảm bảo không thất thoát tài sản và hoàn tất nghĩa vụ tài chính.

**Actor:** Employee, HR & C&B, Manager, System

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Nhân viên nộp đơn xin nghỉ việc qua Portal (kèm thông tin ngày làm việc cuối cùng mong muốn) | Employee     |
| 2    | Manager duyệt đơn, thống nhất ngày nghỉ chính thức và xác nhận thời gian báo trước | Manager      |
| 3    | Bàn giao công việc cho người kế nhiệm | Employee / Manager |
| 4    | Bàn giao và thu hồi toàn bộ tài sản cấp phát | Employee / HR & C&B |
| 5    | Chốt dữ liệu chấm công của tháng cuối cùng | System / HR & C&B |
| 6    | Chốt dữ liệu lương, quy đổi phép năm còn dư thành tiền cộng vào kỳ lương cuối | System       |
| 7    | Quyết toán các quyền lợi khác, thực hiện báo giảm BHXH và chốt thuế TNCN | HR & C&B     |
| 8    | Chi trả lương kỳ cuối cho nhân viên | HR & C&B / System |
| 9    | Khóa tài khoản đăng nhập, chuyển trạng thái Employee thành Inactive | System       |

**Kết quả:** Hoàn tất quy trình Offboarding chuẩn mực.

---

## 12. Core Business Flow 10 — Reward & Discipline Flow (Khen thưởng / Kỷ luật)

**Mục tiêu:** Ghi nhận các thành tích hoặc vi phạm của nhân viên để làm cơ sở tính thưởng hoặc khấu trừ trong kỳ lương.

**Actor:** Manager, HR & C&B, System

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Phát sinh sự kiện khen thưởng (hoàn thành xuất sắc) hoặc kỷ luật (vi phạm nội quy) | Manager / HR |
| 2    | Đề xuất hình thức và số tiền thưởng/phạt | Manager      |
| 3    | Giám đốc/Phòng HR phê duyệt quyết định | HR & C&B     |
| 4    | Hệ thống ghi nhận quyết định vào hồ sơ nhân viên | System       |
| 5    | Hệ thống tự động đẩy dữ liệu số tiền thưởng/phạt vào bảng tính lương (Payroll) của kỳ tương ứng | System       |

**Kết quả:** Quyết định thưởng/phạt được lưu trữ và tự động liên kết vào quá trình tính lương.

---

## 13. Core Business Flow 11 — Delegation Flow (Ủy quyền duyệt đơn)

**Mục tiêu:** Cho phép Trưởng phòng (Manager) ủy quyền duyệt đơn cho cấp phó hoặc người khác khi vắng mặt.

**Actor:** Manager (Delegator), Manager (Delegatee), System

| Bước | Mô tả                              | Thực hiện    |
| ---- | ---------------------------------- | ------------ |
| 1    | Trưởng phòng A tạo yêu cầu Ủy quyền, chọn Người được ủy quyền B và khoảng thời gian vắng mặt | Manager A |
| 2    | Hệ thống ghi nhận Delegation record | System |
| 3    | Trong khoảng thời gian ủy quyền, mọi Đơn từ (Nghỉ phép, OT) gửi đến A sẽ được tự động BCC (đồng gửi) hoặc chuyển hướng cho B | System |
| 4    | B thực hiện phê duyệt/từ chối thay cho A (Audit Log ghi nhận B duyệt thay A) | Manager B |
| 5    | Hết hạn ủy quyền, hệ thống tự động Revoke (Thu hồi) quyền duyệt thay của B | System |

**Kết quả:** Quy trình phê duyệt không bị gián đoạn.

---

## 14. Tổng kết

Các luồng nghiệp vụ trên thể hiện **chiều sâu chuyên môn** của hệ thống, bao quát toàn bộ mọi khía cạnh hành chính và tài chính liên quan đến một nhân sự trong công ty LLA. Đây là nền tảng để xây dựng Use Case, thiết kế cơ sở dữ liệu và triển khai API logic phức tạp (như động cơ tính lương tự động).
