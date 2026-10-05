# Usecase: UC-ORG-02 - Quản lý Danh mục Vị trí công tác (Chức danh)

## 1. Giới thiệu chức năng
- **Mục đích**: Cho phép HR định nghĩa bộ khung các ngạch, chức danh công việc trong công ty. Mỗi chức danh sẽ được quy định mức lương trần/sàn và gắn về một phòng ban cụ thể để phân quyền và quản lý.
- **Actor (Tác nhân)**: Trưởng phòng Nhân sự (HR Manager), Quản trị viên hệ thống.
- **Điều kiện tiên quyết**: Khung phòng ban đã được thiết lập.

## 2. Dữ liệu nghiệp vụ đầu vào (Input Data)
| Thông tin | Tính chất | Ý nghĩa nghiệp vụ & Ràng buộc |
|-----------|-----------|-------------------------------|
| `Mã vị trí` (Code) | Bắt buộc | Ký hiệu chuẩn hóa của chức danh (VD: KTT, DEV). **Ràng buộc:** Phải là duy nhất toàn hệ thống. |
| `Tên chức danh` (Title) | Bắt buộc | Tên gọi chính thức trên Hợp đồng Lao động (VD: Kế toán trưởng). |
| `Cấp bậc` (Level) | Bắt buộc | Phân loại thâm niên (Thực tập sinh, Nhân viên, Quản lý...). |
| `Dải lương` (Min-Max) | Tùy chọn | Khung ngân sách lương. Mặc định `0` nếu không điền. |
| `Phòng ban trực thuộc` | Tùy chọn | Chức danh này thuộc biên chế của phòng nào (Map tới bảng Department). |

## 3. Quy tắc nghiệp vụ (Business Rules)
| Mã Quy tắc | Tình huống nghiệp vụ | Cách hệ thống xử lý | Thông báo cho người dùng |
|---|---|---|---|
| BR-ORG-02-01 | **Bảo vệ mã danh mục khi Tạo mới**: HR tạo chức danh nhập mã đã bị sử dụng. | Hệ thống rà soát `findUnique`, phát hiện trùng lặp -> Hủy lưu, trả HTTP 400. | "Mã vị trí đã tồn tại" |
| BR-ORG-02-02 | **Bảo vệ mã danh mục khi Cập nhật**: HR sửa chức danh và đổi mã sang mã đang thuộc về chức danh KHÁC. | Hàm `findFirst(code, id != id)` phát hiện trùng lặp -> Chặn cập nhật, trả HTTP 400. | "Mã vị trí đã tồn tại" |
| BR-ORG-02-03 | **Bảo vệ hợp đồng nhân sự (Xóa)**: HR yêu cầu xóa bỏ chức danh khỏi hệ thống. | Hệ thống đếm nhân sự (`_count.employees`). Nếu > 0 -> Cấm xóa, trả HTTP 400. | "Không thể xóa vị trí đang có nhân viên" |

## 4. Luồng xử lý nghiệp vụ

### 4.1. Luồng Thêm mới Chức danh
1. HR truy cập module Tổ chức, chọn menu "Danh mục Vị trí".
2. HR bấm nút "Thêm Vị trí".
3. Giao diện tự động gọi API `GET /api/departments` để lấy danh sách phòng ban đổ vào Dropdown. Giao diện mở Form.
4. HR điền thông tin (Mã, Tên, Cấp bậc, Khoảng lương, Chọn phòng ban) và ấn "Lưu".
5. Backend rà soát quy tắc trùng mã (BR-ORG-02-01).
6. Nếu hợp lệ, lưu vào DB và trả về 201 Created. Nếu DB lỗi, trả 500.
7. Giao diện đóng Form, tự động gọi API tải lại bảng danh sách.

### 4.2. Luồng Cập nhật (Sửa) Chức danh
1. Trên màn hình danh sách, HR tìm chức danh cần sửa và bấm biểu tượng "Sửa".
2. Giao diện lấy thông tin cũ điền vào Form.
3. HR thay đổi thông tin (VD: đổi Mã `REC_01` thành `HR_REC_01`) và bấm "Lưu".
4. Backend kiểm tra xem mã mới `HR_REC_01` có dính dáng đến chức danh nào KHÁC không (BR-ORG-02-02).
   - Nếu trùng: Trả 400 "Mã vị trí đã tồn tại", bắt HR chọn mã khác.
   - Nếu hợp lệ: Cập nhật CSDL. Trả 200 OK.
5. Giao diện đóng Form, gọi API tải lại bảng danh sách.

### 4.3. Luồng Xóa Chức danh
1. Trên màn hình danh sách, HR bấm biểu tượng "Xóa" tại một chức danh.
2. Màn hình hiện Popup hỏi xác nhận. HR ấn "Đồng ý".
3. Backend quét CSDL kiểm tra xem có nhân sự nào mang chức vụ này không (BR-ORG-02-03).
4. Nếu có người: Trả 400 "Không thể xóa vị trí đang có nhân viên". Giao diện báo lỗi.
5. Nếu không có người: Thực hiện xóa khỏi danh mục vĩnh viễn, trả 200 OK. Giao diện tải lại bảng.

## 5. Kết quả đầu ra
- Danh mục Chức danh (Bảng `Position`) được làm mới (INSERT/UPDATE/DELETE).

## 6. Sơ đồ tuần tự (Sequence Diagram)

### 6.1. Sơ đồ: Thêm mới Vị trí
```mermaid
sequenceDiagram
    actor HR as Chuyên viên HR
    participant FE as Giao diện Phần mềm
    participant API as Cổng Xử lý (API)
    participant BE as Khối Nghiệp vụ (Backend)
    participant DB as Cơ sở dữ liệu (Database)

    HR->>FE: Bấm nút "Thêm Vị trí"
    FE->>API: GET /api/departments (Lấy danh sách phòng ban)
    API->>BE: ...
    BE->>DB: Truy vấn danh sách phòng ban
    DB-->>BE: Kết quả
    BE-->>API: JSON Danh sách
    API-->>FE: 200 OK
    FE-->>HR: Hiển thị Form nhập liệu (Có sẵn list dropdown phòng ban)
    
    HR->>FE: Nhập thông tin & Bấm Lưu
    FE->>API: POST /api/positions
    API->>BE: Chuyển dữ liệu xử lý
    
    BE->>DB: Kiểm tra mã vị trí (findUnique code)
    DB-->>BE: Kết quả kiểm tra
    
    alt Nếu mã đã tồn tại (Vi phạm BR-ORG-02-01)
        BE-->>API: Phản hồi lỗi
        API-->>FE: 400 Bad Request
        FE-->>HR: Giữ nguyên Form, thông báo "Mã vị trí đã tồn tại"
    else Nếu mã hợp lệ
        BE->>DB: Tạo bản ghi (create Position)
        alt Lỗi hệ thống
            DB-->>BE: Exception
            BE-->>API: Bắt lỗi
            API-->>FE: 500 Internal Server Error
            FE-->>HR: Thông báo lỗi từ máy chủ
        else Ghi thành công
            DB-->>BE: Bản ghi đã tạo
            BE-->>API: 201 Created
            API-->>FE: JSON kết quả
            FE->>API: GET /api/positions (Tải lại bảng)
            API-->>FE: 200 OK
            FE-->>HR: Đóng form, báo thành công, hiện bảng mới
        end
    end
```

### 6.2. Sơ đồ: Cập nhật (Sửa) Vị trí
```mermaid
sequenceDiagram
    actor HR as Chuyên viên HR
    participant FE as Giao diện Phần mềm
    participant API as Cổng Xử lý (API)
    participant BE as Khối Nghiệp vụ (Backend)
    participant DB as Cơ sở dữ liệu (Database)

    HR->>FE: Bấm nút "Sửa" tại Vị trí ID = 1
    FE-->>HR: Hiển thị Form với dữ liệu cũ
    
    HR->>FE: Đổi Mã vị trí thành X & Bấm Lưu
    FE->>API: PUT /api/positions/1
    API->>BE: Bắt đầu xử lý
    
    BE->>DB: Quét tìm mã X ở bản ghi khác (id != 1)
    DB-->>BE: Kết quả tìm kiếm
    
    alt Có người dùng mã X (Vi phạm BR-ORG-02-02)
        BE-->>API: Phản hồi lỗi
        API-->>FE: 400 Bad Request
        FE-->>HR: Giữ form, thông báo "Mã vị trí đã tồn tại"
    else Mã hợp lệ
        BE->>DB: Cập nhật bản ghi Position
        DB-->>BE: Hoàn tất
        BE-->>API: 200 OK
        API-->>FE: JSON cập nhật
        FE->>API: GET /api/positions (Tải lại bảng)
        API-->>FE: 200 OK
        FE-->>HR: Đóng form, tải lại danh sách, báo thành công
    end
```

### 6.3. Sơ đồ: Xóa Vị trí
```mermaid
sequenceDiagram
    actor HR as Chuyên viên HR
    participant FE as Giao diện Phần mềm
    participant API as Cổng Xử lý (API)
    participant BE as Khối Nghiệp vụ (Backend)
    participant DB as Cơ sở dữ liệu (Database)

    HR->>FE: Bấm biểu tượng "Xóa"
    FE-->>HR: Hiển thị Popup xác nhận
    
    HR->>FE: Bấm "Đồng ý"
    FE->>API: DELETE /api/positions/:id
    API->>BE: Xử lý nghiệp vụ
    BE->>DB: Đếm số Employee có positionId = ID
    DB-->>BE: Kết quả = N
    
    alt N > 0 (Vi phạm BR-ORG-02-03)
        BE-->>API: Phản hồi lỗi
        API-->>FE: 400 Bad Request
        FE-->>HR: Đóng popup, hiển thị "Không thể xóa vị trí đang có nhân viên"
    else N = 0 (Hợp lệ)
        BE->>DB: Xóa bản ghi
        alt Lỗi hệ thống
            DB-->>BE: Exception
            BE-->>API: Bắt lỗi
            API-->>FE: 500 Internal Server Error
            FE-->>HR: Thông báo "Lỗi khi xóa"
        else Xóa thành công
            DB-->>BE: Xóa hoàn tất
            BE-->>API: 200 OK
            API-->>FE: Thành công
            FE->>API: GET /api/positions (Tải lại bảng)
            API-->>FE: 200 OK
            FE-->>HR: Cập nhật danh sách, báo "Xóa thành công"
        end
    end
```
