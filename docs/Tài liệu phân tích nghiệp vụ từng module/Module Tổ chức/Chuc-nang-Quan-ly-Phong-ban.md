# Đặc tả chức năng: Quản lý Phòng ban (Department Management)

## 1. Giới thiệu chức năng
Chức năng cho phép người dùng (thường là Quản lý nhân sự - HR Manager) thiết lập, cập nhật và xóa bỏ các phòng ban trong cơ cấu tổ chức của doanh nghiệp. Hệ thống hỗ trợ mô hình phòng ban đa cấp (Cây cha - con).

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Toàn vẹn dữ liệu (Logic Xóa):** Không được phép xóa một phòng ban nếu phòng ban đó đang có nhân sự trực thuộc hoặc có phòng ban con bên trong nó.
- **Mã phòng ban (Code):** Phải là duy nhất trên toàn hệ thống.
- **Tính toán Headcount:** Hệ thống sẽ tự động tổng hợp số lượng nhân sự trực thuộc (dựa vào việc đếm số nhân viên thuộc phòng ban đó).

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Xem danh sách Phòng ban
Hiển thị toàn bộ phòng ban kèm theo số lượng nhân viên hiện tại của mỗi phòng.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện (Departments.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Truy cập trang "Phòng ban"
    FE->>BE: GET /api/departments
    
    rect rgb(240, 248, 255)
        note right of BE: Lấy danh sách & Đếm nhân sự
        BE->>DB: SELECT Departments JOIN COUNT(Employees)
        DB-->>BE: Danh sách phòng ban kèm _count.employees
    end
    
    BE-->>FE: HTTP 200 OK (Mảng dữ liệu phòng ban)
    FE->>FE: Lọc dữ liệu theo từ khóa tìm kiếm (nếu có)
    FE->>HR: Hiển thị bảng danh sách & Số lượng tổng
```

### 3.2. Luồng Thêm mới Phòng ban
Cho phép khai báo phòng ban độc lập hoặc phòng ban con (chọn Parent ID).

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm "Thêm Phòng ban", điền Form
    HR->>FE: Bấm "Lưu thông tin"
    
    FE->>BE: POST /api/departments (code, name, parentId...)
    
    rect rgb(240, 248, 255)
        note right of BE: Validate Dữ liệu
        BE->>DB: SELECT * FROM Department WHERE code = {code}
        DB-->>BE: Kết quả truy vấn
    end
    
    alt Trùng Mã phòng ban
        BE-->>FE: HTTP 400 (Lỗi: Mã phòng ban đã tồn tại)
        FE->>HR: Báo lỗi trên màn hình
    else Mã hợp lệ
        BE->>DB: INSERT INTO Department
        DB-->>BE: Trả về Object vừa tạo
        BE-->>FE: HTTP 201 Created
        FE->>HR: Đóng form, tải lại danh sách
    end
```

### 3.3. Luồng Cập nhật / Đổi trạng thái Phòng ban
Dùng cho cả thao tác sửa thông tin (Tên, Mã, Người đại diện) và Khóa/Mở khóa hoạt động.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Thay đổi thông tin hoặc bấm "Khóa/Mở khóa"
    FE->>BE: PUT /api/departments/{id} (Gửi dữ liệu mới)
    
    BE->>DB: UPDATE Department SET name=..., status=... WHERE id={id}
    DB-->>BE: Cập nhật thành công
    
    BE-->>FE: HTTP 200 OK
    FE->>HR: Cập nhật lại giao diện hiển thị
```

### 3.4. Luồng Xóa Phòng ban
Ràng buộc tính toàn vẹn dữ liệu trước khi xóa vĩnh viễn.

```mermaid
sequenceDiagram
    autonumber
    actor HR as Quản lý Nhân sự
    participant FE as Giao diện
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    HR->>FE: Bấm nút "Xóa" tại một phòng ban
    FE->>HR: Hiển thị Modal Cảnh báo "Xác nhận xóa?"
    HR->>FE: Bấm "Xóa vĩnh viễn"
    
    FE->>BE: DELETE /api/departments/{id}
    
    rect rgb(240, 248, 255)
        note right of BE: Kiểm tra toàn vẹn
        BE->>DB: COUNT Employee WHERE departmentId = {id}
        DB-->>BE: employeeCount
    end
    
    alt employeeCount > 0
        BE-->>FE: HTTP 400 (Lỗi: Không thể xóa PB có nhân viên)
        FE->>HR: Hiển thị thông báo Lỗi (Alert)
    else employeeCount == 0
        BE->>DB: DELETE FROM Department WHERE id = {id}
        DB-->>BE: Xóa thành công
        BE-->>FE: HTTP 200 OK
        FE->>HR: Đóng Modal, tải lại danh sách
    end
```
