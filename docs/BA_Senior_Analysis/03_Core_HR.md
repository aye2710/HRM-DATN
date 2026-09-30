# PHÂN TÍCH NGHIỆP VỤ: MODULE QUẢN LÝ NHÂN SỰ (CORE HR)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Trái tim của hệ thống HRM. Nơi lưu trữ Single Source of Truth (Nguồn dữ liệu thật duy nhất) về toàn bộ hồ sơ nhân viên, hợp đồng và quá trình hội nhập.
- **Giá trị mang lại:** Xóa bỏ hồ sơ giấy, tự động hóa nhắc nhở hết hạn hợp đồng, chuyên nghiệp hóa ngày đi làm đầu tiên của nhân viên.
- **Phạm vi (In-scope):** Quản lý Employee Profile, Quản lý Hợp đồng (Contracts), Quy trình Onboarding.
- **Phạm vi (Out-of-scope):** Chấm công và Tính lương (Sẽ tách riêng).
- **Các bên liên quan (Stakeholders):** C&B (Chuyên viên Lương thưởng), HR Admin, Nhân viên (Employee), IT/Admin (Cấp phát thiết bị).

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| HR-01 | Hồ sơ Nhân sự | Quản lý thông tin cá nhân, CCCD, chức danh, phòng ban. | HR Admin | Must have |
| HR-02 | Quản lý Hợp đồng | Tạo mới, gia hạn, chấm dứt hợp đồng lao động. | C&B | Must have |
| HR-03 | Onboarding Tasks | Giao task cho IT (cấp mail), Admin (cấp máy) khi có người mới. | HR Admin | Should have |

---

## 3. Quy trình nghiệp vụ
**Luồng chính Onboarding & Ký Hợp đồng:**
1. (Auto từ Module Tuyển dụng) Dữ liệu Employee được sinh ra, trạng thái `ONBOARDING`.
2. Hệ thống tự động sinh các `OnboardingTask` dựa trên Template (Ví dụ: IT tạo email, Admin phát đồng phục).
3. Đến ngày nhận việc (Join Date), HR chuyển trạng thái Employee thành `PROBATION` (Thử việc).
4. C&B tạo Hợp đồng Thử việc, import mức lương từ JobOffer sang.
5. Hết 2 tháng thử việc, C&B tạo Hợp đồng Chính thức -> Chuyển status Employee thành `ACTIVE`.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-HR-01 | Unique CCCD | Hệ thống chặn tạo Employee nếu CCCD trùng lặp. (Có thể bypass nếu nhập thiếu lúc Onboarding). | Ràng buộc HT | |
| BR-HR-02 | Thời hạn Thử việc | Hợp đồng thử việc không được quá 60 ngày (với vị trí cần chuyên môn) hoặc 6 ngày (lao động phổ thông). | Pháp luật | Khoản 1 Điều 27 BLLĐ 2019 |
| BR-HR-03 | Cảnh báo hết hạn | Trước 15 ngày hết hạn hợp đồng, tự động gửi Alert/Email cho C&B. | Chính sách | |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: Employee**
- `ONBOARDING`: Chờ nhận việc, đang hoàn tất thủ tục.
- `INTERNSHIP`: Thực tập sinh.
- `PROBATION`: Đang thử việc.
- `ACTIVE`: Nhân viên chính thức.
- `RESIGNED`: Đã nghỉ việc (Cấm xóa vật lý).

**Thực thể: Contract**
- `ACTIVE`: Đang hiệu lực.
- `EXPIRED`: Đã hết hạn.
- `TERMINATED`: Thanh lý trước hạn.

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Employee** | id, code, fullName, cccd, status, joinDate, departmentId, positionId | PK, String, String, String, Enum, Date, FK, FK | 1-n Contract, 1-1 Account | `cccd` có thể null lúc đầu |
| **Contract** | id, employeeId, contractType, baseSalary, startDate, endDate, status | PK, FK, Enum, Decimal, Date, Date, Enum | n-1 Employee | Type: INTERNSHIP, PROBATION, DEFINITE_1Y, INDEFINITE |
| **OnboardingTask**| id, employeeId, taskName, category, isCompleted | PK, FK, String, String, Boolean | n-1 Employee | Category: EQUIPMENT, ACCOUNT, TRAINING |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **C&B**, tôi muốn **Hệ thống cảnh báo Hợp đồng sắp hết hạn**, để **kịp thời chuẩn bị ký Hợp đồng mới**.
- *AC1:* Vào Dashboard, thấy Widget "10 Hợp đồng sắp hết hạn trong 30 ngày tới".
- *AC2:* Hệ thống cấm tạo 2 Hợp đồng cùng có trạng thái `ACTIVE` cho 1 Nhân viên tại cùng một thời điểm.

---

## 8. Phân quyền & bảo mật
- **Nhân viên (Self-service):** Chỉ xem thông tin của chính mình (Che mức lương nếu có người khác nhòm ngó).
- **C&B / HR Admin:** Có quyền tạo/Sửa Hợp đồng.
- *Dữ liệu nhạy cảm:* `baseSalary`, `cccd` (PII) cần được bảo mật, mã hóa tại DB.

---

## 9. Tích hợp & phụ thuộc
- Liên kết 1-1 với bảng `Account` (Cấp quyền Login vào app).
- Nguồn cấp dữ liệu cho toàn bộ các module Chấm công, Tính lương (Không có Employee thì không làm được gì).

---

## 10. Yêu cầu phi chức năng
- **Bảo mật PII:** Dữ liệu Căn cước công dân cần tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (ẩn vài số giữa khi hiển thị).

---

## 11. Edge cases & rủi ro
1. *Nghỉ việc rồi quay lại làm (Re-hire):* Dùng mã Employee cũ hay cấp mã mới? (Khuyến nghị: Kích hoạt lại mã cũ, tạo Contract mới).
2. *Nhân viên thay đổi CCCD sang Gắn chip:* Gây lỗi Unique Duplicate. Cần hỗ trợ update thông tin.
3. *Kết thúc thử việc nhưng không ký hợp đồng tiếp theo:* Hệ thống cảnh báo "Nhân viên làm việc chui".

---

## 12. Câu hỏi cần làm rõ
1. Có áp dụng ký Hợp đồng điện tử (eContract) không? *(Giả định: Out-of-scope trong giai đoạn này, chỉ lưu thông tin metadata)*.
