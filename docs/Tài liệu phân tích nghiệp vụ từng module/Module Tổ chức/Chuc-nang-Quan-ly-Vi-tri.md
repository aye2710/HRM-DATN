# Đặc tả chức năng: Quản lý Vị trí / Chức danh (Position Management)

## 1. Giới thiệu chức năng
Chức năng cho phép doanh nghiệp định nghĩa Khung chức danh và vị trí công việc. Một phòng ban có thể có nhiều vị trí khác nhau, và mỗi vị trí có thể có một cấp bậc (Level) và Khung lương chuẩn (Min/Max Salary).

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Mã vị trí (Code):** Phải là duy nhất để tránh nhầm lẫn khi tạo hợp đồng hoặc tuyển dụng.
- **Phòng ban trực thuộc:** Một vị trí có thể gán cứng vào một phòng ban (Ví dụ: Trưởng phòng Marketing thì bắt buộc thuộc phòng Marketing), hoặc để trống (dùng chung cho toàn công ty).
- **Ràng buộc Xóa:** Không thể xóa một vị trí nếu đang có bất kỳ nhân viên nào giữ chức vụ này.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xem danh sách Vị trí
Hệ thống lấy toàn bộ Vị trí và kết nối (JOIN) với bảng Phòng ban để lấy Tên phòng ban hiển thị ra giao diện.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Positions.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Truy cập trang "Vị trí & Chức danh"
    FE->>BE: GET /api/positions
    
    rect rgb(240, 248, 255)
        note right of BE: Truy vấn & JOIN dữ liệu
        BE->>DB: SELECT Positions JOIN Department (để lấy name)
        DB-->>BE: Danh sách Vị trí kèm Tên phòng ban
    end
    
    BE-->>FE: HTTP 200 OK (Mảng dữ liệu)
    FE->>HR: Hiển thị bảng danh sách Vị trí
```

### 3.2. Luồng Thêm mới Vị trí
Đảm bảo mã vị trí không bị trùng lặp.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm "Thêm Vị trí", điền Form (Mã, Tên, Cấp bậc...)
    HR->>FE: Bấm "Lưu thông tin"
    
    FE->>BE: POST /api/positions (Payload: code, title, level,...)
    
    rect rgb(240, 248, 255)
        note right of BE: Validate Dữ liệu
        BE->>DB: SELECT * FROM Position WHERE code = {code}
        DB-->>BE: Kết quả truy vấn
    end
    
    alt Trùng Mã Vị trí
        BE-->>FE: HTTP 400 (Lỗi: Mã vị trí đã tồn tại)
        FE->>HR: Hiển thị cảnh báo lỗi nhập liệu
    else Mã hợp lệ
        BE->>DB: INSERT INTO Position (code, title, level, minSalary, maxSalary, departmentId)
        DB-->>BE: Trả về đối tượng Position vừa tạo
        BE-->>FE: HTTP 201 Created
        FE->>HR: Đóng Form, tải lại danh sách Vị trí
    end
```

### 3.3. Luồng Cập nhật Vị trí
Khi cập nhật, nếu người dùng đổi Mã vị trí, hệ thống phải kiểm tra xem mã mới có bị trùng với vị trí khác hay không.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Đổi thông tin vị trí và bấm "Cập nhật"
    FE->>BE: PUT /api/positions/{id}
    
    rect rgb(240, 248, 255)
        note right of BE: Validate Mã (nếu có đổi mã)
        BE->>DB: SELECT * FROM Position WHERE code = {code} AND id != {id}
        DB-->>BE: Kết quả
    end
    
    alt Mã mới bị trùng
        BE-->>FE: HTTP 400 (Lỗi: Mã vị trí đã tồn tại)
        FE->>HR: Báo lỗi trên Form
    else Hợp lệ
        BE->>DB: UPDATE Position SET title=..., level=... WHERE id={id}
        DB-->>BE: Cập nhật thành công
        BE-->>FE: HTTP 200 OK
        FE->>HR: Đóng Form, tải lại danh sách
    end
```

### 3.4. Luồng Xóa Vị trí
Bảo vệ dữ liệu không bị xóa nhầm nếu đang có nhân sự sử dụng.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm nút "Xóa" tại một Vị trí
    FE->>HR: Hiển thị Modal Cảnh báo
    HR->>FE: Xác nhận "Xóa"
    
    FE->>BE: DELETE /api/positions/{id}
    
    rect rgb(240, 248, 255)
        note right of BE: Kiểm tra toàn vẹn
        BE->>DB: SELECT COUNT(*) FROM Employee WHERE positionId = {id}
        DB-->>BE: số lượng (employeeCount)
    end
    
    alt employeeCount > 0
        BE-->>FE: HTTP 400 (Không thể xóa vị trí đang có nhân viên)
        FE->>HR: Hiển thị thông báo Lỗi
    else employeeCount == 0
        BE->>DB: DELETE FROM Position WHERE id = {id}
        DB-->>BE: Xóa thành công
        BE-->>FE: HTTP 200 OK
        FE->>HR: Đóng Modal, tải lại danh sách
    end
```
