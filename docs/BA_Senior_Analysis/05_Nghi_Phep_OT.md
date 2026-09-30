# PHÂN TÍCH NGHIỆP VỤ: MODULE NGHỈ PHÉP & LÀM THÊM (LEAVE & OVERTIME)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Quản lý số ngày phép tồn đọng (Leave Balance) của nhân viên và quy trình phê duyệt các loại Đơn xin nghỉ, Đơn xin làm thêm giờ (OT).
- **Giá trị mang lại:** Minh bạch quỹ phép cho nhân viên, tính toán chính xác số giờ OT để làm cơ sở trả lương (x1.5, x2.0).
- **Phạm vi (In-scope):** Quản lý Quỹ phép năm, Đơn xin nghỉ phép (Có lương/Không lương), Đơn xin OT, Quy trình phê duyệt đa cấp.
- **Các bên liên quan (Stakeholders):** Nhân viên (Người tạo đơn), Line Manager (Người duyệt đơn), HR/C&B (Kiểm soát quỹ phép).

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| LO-01 | Quản lý Quỹ phép (Leave Balance) | Theo dõi số ngày phép được cấp, đã dùng, còn lại theo năm. | HR, Employee | Must have |
| LO-02 | Đơn xin Nghỉ phép (Leave Request) | Nhân viên xin nghỉ (Paid/Unpaid). Chờ Manager duyệt. | Employee | Must have |
| LO-03 | Đơn xin Làm thêm (OT Request) | Khai báo số giờ làm thêm sau giờ hành chính. | Employee | Must have |
| LO-04 | Phê duyệt Đơn (Approval) | Quản lý hoặc HR phê duyệt các đơn từ cấp dưới gửi lên. | Line Manager | Must have |

---

## 3. Quy trình nghiệp vụ
**Luồng xin nghỉ phép (Paid Leave):**
1. Nhân viên kiểm tra quỹ phép trên Dashboard (Còn >= 1 ngày).
2. Tạo Đơn xin nghỉ phép, chọn từ ngày A đến ngày B, nhập lý do.
3. Hệ thống trừ tạm thời (Lock) số ngày phép tương ứng, gửi Noti cho Manager.
4. Manager xem xét:
   - Nếu Duyệt (Approve): Hệ thống cập nhật bảng chấm công (Attendance) các ngày đó thành `ON_LEAVE`. Trừ chính thức quỹ phép.
   - Nếu Từ chối (Reject): Hệ thống trả lại (Unlock) số ngày phép về quỹ. Báo Noti cho Nhân viên.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-LO-01 | Cấp phép năm tiêu chuẩn | Người lao động làm đủ 12 tháng được nghỉ 12 ngày phép có lương. | Pháp luật | Điều 113 BLLĐ 2019 |
| BR-LO-02 | Chặn số phép âm | Nếu tổng số ngày xin nghỉ (Paid) > số ngày phép còn lại (Balance) -> Không cho submit đơn. Bắt buộc chuyển sang Nghỉ không lương (Unpaid). | Ràng buộc HT | |
| BR-LO-03 | Giới hạn giờ OT | Không được làm thêm quá 50% số giờ làm việc bình thường trong 1 ngày, và không quá 40 giờ/tháng. | Pháp luật | Khoản 2 Điều 107 BLLĐ 2019 |
| BR-LO-04 | Check-in ngày nghỉ phép | Nhân viên có Đơn xin nghỉ đã duyệt thì ngày đó không cần bấm Check-in. Hệ thống không ghi lỗi ABSENT. | Logic HT | |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: Request (Leave & OT)**
- `PENDING`: Mới tạo, chờ duyệt.
- `APPROVED`: Đã được duyệt (Có hiệu lực).
- `REJECTED`: Bị từ chối.
- `CANCELLED`: Nhân viên tự hủy đơn trước khi Quản lý duyệt.

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **LeaveBalance** | id, employeeId, year, totalDays, usedDays | PK, FK, Int, Decimal, Decimal | n-1 Employee | Tự tạo record mới mỗi đầu năm |
| **LeaveRequest** | id, employeeId, leaveType, startDate, endDate, reason, status, approverId | PK, FK, Enum, Date, Date, Text, Enum, FK | n-1 Employee | Type: PAID, UNPAID |
| **OTRequest** | id, employeeId, date, requestHours, actualHours, status, reason | PK, FK, Date, Decimal, Decimal, Enum, Text | n-1 Employee | `actualHours` để HR sửa nếu làm ít hơn xin |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **Nhân viên**, tôi muốn **Hệ thống chặn tôi gửi đơn OT nếu vượt quá 40h/tháng**, để **công ty không vi phạm Luật Lao động**.
- *AC1:* Nhân viên đã có tổng 38h OT trong tháng. Tạo form xin thêm 3h OT. Bấm Submit. Hệ thống báo lỗi HTTP 400: "Vượt giới hạn 40 giờ OT mỗi tháng theo BLLĐ".

---

## 8. Phân quyền & bảo mật
- **Line Manager:** Chỉ nhìn thấy và được quyền duyệt đơn của nhân viên thuộc cùng phòng ban (Department) với mình.
- **HR Admin:** Được quyền xem toàn bộ đơn của công ty. Có quyền "Force Approve" (Duyệt ép) trong trường hợp Manager vắng mặt.

---

## 9. Tích hợp & phụ thuộc
- **Giao cắt Module Chấm công:** Khi Đơn xin nghỉ (Paid) được duyệt, nó phải ghi đè lên bảng `Attendance` để bù lại 1 ngày công (workingDay = 1.0).
- **Giao cắt Module Tiền lương:** Dữ liệu số giờ `OTRequest.actualHours` đã duyệt sẽ được cộng vào phiếu lương nhân với hệ số.

---

## 10. Yêu cầu phi chức năng
- Phải hỗ trợ gửi thông báo (Real-time Notification hoặc Email) ngay lập tức cho Manager khi có đơn mới.

---

## 11. Edge cases & rủi ro
1. *Xin phép đè lên Ngày lễ:* Nghỉ từ T2 đến T6, trong đó T4 là ngày Lễ. **Xử lý:** Logic hệ thống phải loại bỏ T4 khi trừ phép (Chỉ trừ 4 ngày Balance thay vì 5).
2. *Nghỉ nửa ngày (Half-day):* Hệ thống cần support xin nghỉ buổi Sáng/Chiều (workingDay trừ 0.5 thay vì 1.0).
3. *Đã duyệt nghỉ phép nhưng nhân viên lại đi làm:* Mâu thuẫn giữa Attendance có Check-in và LeaveRequest = APPROVED. **Xử lý:** Ưu tiên dữ liệu Attendance, nhưng yêu cầu Manager Cancel đơn phép cũ để hoàn lại ngày phép cho NV.

---

## 12. Câu hỏi cần làm rõ
- Hệ số lương OT (Ngày thường, Cuối tuần, Ngày lễ) sẽ được Hardcode trong hệ thống hay cho phép HR tự cấu hình? *(Đề xuất: Lưu cấu hình hệ số trong bảng SystemSettings để linh hoạt).*
