# PHÂN TÍCH NGHIỆP VỤ: MODULE TỔ CHỨC (ORGANIZATION)

## 1. Tổng quan module
- **Mục tiêu nghiệp vụ:** Thiết lập khung xương (Backbone) cho toàn bộ hệ thống HRM. Quản lý sơ đồ tổ chức (Org Chart) và định biên nhân sự theo Phòng ban, Chức danh.
- **Giá trị mang lại:** Giúp Ban Lãnh Đạo nhìn thấy bức tranh toàn cảnh về phân bổ nguồn nhân lực, chi phí nhân sự dự kiến theo cấu trúc công ty.
- **Phạm vi (In-scope):** Quản lý Cây phòng ban (Department), Quản lý Chức danh/Vị trí công việc (Position).
- **Phạm vi (Out-of-scope):** Phân ca làm việc chi tiết cho từng phòng ban (thuộc module Chấm công).
- **Các bên liên quan (Stakeholders):**
  - *HR Manager / Admin:* Setup cấu trúc ban đầu, thêm/sửa/xóa phòng ban.
  - *C-Level (Giám đốc):* Xem báo cáo Headcount, Org Chart.

---

## 2. Phân rã chức năng
| Mã | Tên chức năng | Mô tả | Actor | Độ ưu tiên |
| :--- | :--- | :--- | :--- | :---: |
| ORG-01 | Quản lý Sơ đồ Phòng ban | Tạo phòng ban dạng cây phân cấp (Cha - Con). | HR Manager | Must have |
| ORG-02 | Quản lý Vị trí (Position) | Định nghĩa chức danh và khung lương chuẩn. | HR Manager | Must have |
| ORG-03 | Xem Sơ đồ tổ chức (Org Chart) | Hiển thị sơ đồ hình cây trực quan. | All Users | Should have |

---

## 3. Quy trình nghiệp vụ
**Luồng thiết lập cơ cấu mới:**
1. HR Manager tạo mới Phòng ban cấp cao nhất (Khối/Directorate).
2. Tùy biến tạo thêm các Phòng ban con (Phòng/Tổ/Nhóm) trực thuộc.
3. HR Manager định nghĩa các Vị trí công việc (Position) áp dụng chung hoặc áp dụng riêng cho từng phòng ban.
4. (Hệ thống tự động) Khi có nhân viên mới được thêm vào (Từ Core HR), tự động cập nhật số lượng (Headcount) lên sơ đồ.

---

## 4. Quy tắc nghiệp vụ (Business Rules)
| Mã | Điều kiện | Hành động | Loại | Căn cứ |
| :--- | :--- | :--- | :--- | :--- |
| BR-ORG-01 | Xóa phòng ban | KHÔNG được phép xóa nếu `employeeCount > 0` hoặc có Phòng ban con. Yêu cầu chuyển (Transfer) nhân sự trước. | Ràng buộc HT | Data Integrity |
| BR-ORG-02 | Mã phòng ban (Code) | Phải là duy nhất (Unique), viết hoa, không dấu (VD: MKT, IT, SALE). | Ràng buộc HT | Chuẩn hóa mã |
| BR-ORG-03 | Đệ quy đếm nhân sự | Tổng nhân sự 1 phòng ban (Parent) = Số lượng nhân sự trực tiếp + Số nhân sự của tất cả phòng ban con (Children). | Logic HT | |

---

## 5. Vòng đời trạng thái (State Machine)
**Thực thể: Department & Position**
- `ACTIVE`: Đang hoạt động, được phép gán nhân viên vào.
- `INACTIVE`: Bị khóa, không thể tuyển thêm người hay gán nhân viên mới, nhưng vẫn giữ liệu lịch sử cũ.

---

## 6. Mô hình dữ liệu mức nghiệp vụ
| Thực thể | Thuộc tính chính | Kiểu dữ liệu | Quan hệ | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Department** | id, code, name, parentId, managerId, quota, status | PK, String, String, FK, FK, Int, Enum | 1-n (self), 1-n Employee | `parentId` = null là cấp cao nhất |
| **Position** | id, code, title, level, minSalary, maxSalary, departmentId, status | PK, String, String, String, Decimal, Decimal, FK, Enum | 1-n Employee | Khung lương để validate Job Offer |

---

## 7. User Stories & Acceptance Criteria
**US-01:** Là **HR Manager**, tôi muốn **Hệ thống chặn việc xóa Phòng ban đang có người**, để **tránh mất dữ liệu nhân viên mồ côi**.
- *AC1:* Bấm xóa phòng "Kế toán" (đang có 3 NV). Hệ thống quăng lỗi HTTP 400: "Không thể xóa phòng ban đang có nhân sự".
- *AC2:* Bấm xóa phòng "Nháp" (0 NV, 0 Phòng con). Hệ thống xóa thành công.

---

## 8. Phân quyền & bảo mật
- **Admin / HR Manager:** CRUD (Tạo/Đọc/Sửa/Xóa) toàn bộ phòng ban.
- **Nhân viên (Employee):** Chỉ được Xem (Read-only) sơ đồ tổ chức (Che giấu khung lương Position).
- *Audit Log:* Phải ghi nhận ai là người tạo/đổi tên/xóa phòng ban.

---

## 9. Tích hợp & phụ thuộc
- **Input:** -
- **Output:** Cấp nguồn dữ liệu (Dropdown List) cho Module Core HR (Khi tạo Employee) và Module Tuyển dụng (Khi tạo Job Posting).

---

## 10. Yêu cầu phi chức năng
- **Hiệu năng:** API tính Headcount đệ quy phải được Cache (Redis) hoặc dùng Materialized View nếu số lượng phòng ban lên tới >1000, tránh treo DB khi render Org Chart.

---

## 11. Edge cases & rủi ro
1. *Tạo vòng lặp vô tận (Circular Reference):* A là cha của B, sửa B thành cha của A -> Hệ thống crash. **Xử lý:** Chặn set `parentId` trỏ vào chính nó hoặc con cháu của nó.
2. *Trưởng phòng bị đuổi việc/Nghỉ việc:* Trường `managerId` trỏ vào người không còn tồn tại. **Xử lý:** Ràng buộc `managerId` chỉ nhận Employee có status = ACTIVE.
3. *Vị trí dùng chung toàn công ty:* (VD: HRBP). **Xử lý:** Cho phép `departmentId` trong bảng Position có thể Null.

---

## 12. Câu hỏi cần làm rõ
1. Sơ đồ tổ chức có áp dụng mô hình Ma trận (Matrix) không, hay chỉ Hình cây thuần túy (Tree)? *(Đề xuất: Dùng Tree thuần túy cho giai đoạn Đồ án).*
