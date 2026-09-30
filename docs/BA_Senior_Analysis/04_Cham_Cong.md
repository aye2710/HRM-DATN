# PHÂN TÍCH NGHIỆP VỤ: MODULE CHẤM CÔNG (TIME & ATTENDANCE)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Ghi nhận giờ làm việc thực tế của nhân viên. Tự động đối soát giờ Check-in/out với Ca làm việc (Shift) để tính toán Ngày công chuẩn (Working Days).
- **Giá trị mang lại:** Loại bỏ sai sót khi chấm công thủ công (bằng Excel). Giảm thiểu phàn nàn của nhân viên về số ngày công cuối tháng.
- **Phạm vi (In-scope):** Quản lý Ca làm việc (Shifts), Khai báo Ngày nghỉ Lễ (Holidays), Quản lý dữ liệu Ra/Vào (Check-in/Check-out).
- **Các bên liên quan (Stakeholders):** Nhân viên (Thực hiện chấm công), Quản lý (Duyệt/Xác nhận công lỗi), HR/C&B (Tổng hợp công cuối tháng).

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| TA-01 | Quản lý Ca làm việc | Định nghĩa giờ bắt đầu/kết thúc (Ví dụ: Ca Hành chính 08:00 - 17:30). | HR Admin | Must have |
| TA-02 | Ghi nhận Chấm công | Tính năng bấm Check-in / Check-out (Web hoặc App). | Employee | Must have |
| TA-03 | Báo cáo Chấm công | Xem lịch sử giờ vào/ra, cảnh báo Đi muộn/Về sớm. | All | Must have |
| TA-04 | Khai báo Ngày Lễ | Setup lịch nghỉ Quốc gia (Tết, 30/4, 2/9). | HR Admin | Should have |

---

## 3. Quy trình nghiệp vụ
**Luồng chấm công hàng ngày:**
1. Nhân viên truy cập hệ thống lúc đến Công ty -> Bấm nút Check-in.
2. (Hệ thống) Lưu Timestamp, so sánh với Giờ bắt đầu của Ca (Shift) -> Đánh dấu trạng thái NORMAL hoặc LATE (Đi muộn).
3. Chiều về, Nhân viên bấm Check-out.
4. (Hệ thống) Tính toán tổng số giờ (Khấu trừ giờ nghỉ trưa). Nếu đủ 8 tiếng -> Ghi nhận 1 Ngày công (1 Working Day). Nếu làm 4 tiếng -> 0.5 Ngày công.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-TA-01 | Giờ làm việc tiêu chuẩn | 1 ngày công (Working Day) = Đủ 8 giờ làm việc. | Pháp luật | Khoản 1 Điều 105 BLLĐ 2019 |
| BR-TA-02 | Giới hạn Check-in | Nhân viên chỉ được Check-in cho ngày hiện tại (Today). Cấm Check-in lùi (Backdate). | Ràng buộc HT | Chống gian lận |
| BR-TA-03 | Quên Check-out | Nếu qua 23:59 mà chỉ có Check-in, không có Check-out -> Đánh dấu là Lỗi công (Invalid). Bắt buộc phải làm Đơn giải trình (Giải trình chấm công). | Chính sách CT | |
| BR-TA-04 | Tính công ngày Lễ | Nếu ngày chấm công rơi vào bảng `Holiday`, nhân viên được tính nguyên 1 ngày công dù không đi làm. | Pháp luật | Khoản 1 Điều 112 BLLĐ 2019 |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: Attendance (Bảng chấm công ngày)**
- `NORMAL`: Vào đúng giờ, ra đúng giờ, đủ công.
- `LATE`: Check-in trễ hơn giờ quy định.
- `EARLY_LEAVE`: Check-out sớm hơn giờ quy định.
- `ABSENT`: Không có dữ liệu Check-in/out (Nghỉ không phép).
- `ERROR`: Quên check-in hoặc quên check-out (Cần giải trình).

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Shift** | id, name, startTime, endTime, breakTime | PK, String, Time, Time, Int(Phút) | 1-n Employee | VD: "Hành chính", "08:00", "17:30", "90" |
| **Holiday** | id, date, name | PK, Date, String | | Setup đầu năm |
| **Attendance** | id, employeeId, date, checkIn, checkOut, workingDay, status | PK, FK, Date, DateTime, DateTime, Decimal, Enum | n-1 Employee | workingDay = 1.0, 0.5 hoặc 0 |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **Nhân viên**, tôi muốn **bấm Check-in trên Web**, để **hệ thống ghi nhận tôi đã đi làm**.
- *AC1:* Mở màn hình Dashboard, bấm nút Check-in thành công. Hệ thống lưu giờ hiện tại.
- *AC2:* Bấm Check-in lần 2 trong cùng 1 ngày -> Hệ thống báo lỗi "Bạn đã Check-in rồi".

**US-02:** Là **Hệ thống**, tôi muốn **Tự động chạy Job chốt công lúc 23:59 mỗi ngày**, để **đánh dấu những ai Nghỉ làm (Absent)**.
- *AC1:* Quét toàn bộ Employee (Active), ai chưa có record Attendance trong ngày -> Tự động sinh ra 1 record `status = ABSENT`, `workingDay = 0`.

---

## 8. Phân quyền & bảo mật
- **Nhân viên:** Chỉ có quyền Create Check-in/out và Xem của chính mình. (Cấm tuyệt đối quyền Edit/Update).
- **HR Admin:** Có quyền Edit (Sửa giờ thủ công) nếu có sự đồng ý của Quản lý, nhưng bắt buộc lưu vết Audit Log "HR A sửa giờ của NV B".

---

## 9. Tích hợp & phụ thuộc
- **Input:** Tích hợp Máy chấm công vân tay/FaceID (Nếu công ty dùng máy ngoài, phải mở API Endpoint để máy đẩy dữ liệu POST /api/attendance/webhook). Dạng đồ án: Có thể giả lập bằng nút bấm trên Web.
- **Output:** Đẩy tổng số WorkingDay sang Module Tiền Lương (Payroll).

---

## 10. Yêu cầu phi chức năng
- **Bảo mật chống gian lận (Anti-fraud):** Nút Check-in trên Web cần lấy địa chỉ IP. Nếu IP ngoài dải IP của Công ty -> Cảnh báo hoặc Không cho Check-in (Tùy cấu hình).
- **Độ chính xác:** Timestamp phải đồng bộ theo Server Time, không phụ thuộc vào giờ hiển thị trên máy tính cá nhân của nhân viên (Tránh việc nhân viên chỉnh đồng hồ Windows lùi lại để Check-in).

---

## 11. Edge cases & rủi ro
1. *Làm ca đêm xuyên ngày:* Vào làm lúc 22:00 ngày hôm nay, ra về lúc 06:00 sáng hôm sau. **Xử lý:** Attendance record thuộc về Ngày bắt đầu Ca làm việc.
2. *Rớt mạng khi bấm Check-in:* Client báo lỗi, nhân viên bị tính muộn. **Xử lý:** Lưu Log offline trên LocalStorage, tự đồng bộ khi có mạng kèm timestamp cũ (Cần thận trọng gian lận).
3. *Đi công tác (Business Trip):* Không thể chấm công vân tay. Cần tạo form "Xin Đi công tác", tự động gen 1 ngày công (workingDay = 1.0).

---

## 12. Câu hỏi cần làm rõ
1. Dự án này sẽ hỗ trợ chấm công qua API giả lập máy vân tay, hay chấm công trực tiếp bằng cách ấn nút trên Giao diện Web? *(Giả định: Chấm công bằng Nút bấm Web để dễ demo).*
