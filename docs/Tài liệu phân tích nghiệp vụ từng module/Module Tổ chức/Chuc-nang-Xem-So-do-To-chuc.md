# Đặc tả chức năng: Sơ đồ Tổ chức (Org Chart)

## 1. Giới thiệu chức năng
Cung cấp một góc nhìn trực quan hóa toàn bộ cơ cấu bộ máy của công ty dưới dạng Sơ đồ cây (Tree Diagram). Chức năng này đặc biệt hữu ích cho C-Level (Ban giám đốc) để theo dõi nhanh tình hình nhân sự của các khối.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Thuật toán Đệ quy (Recursive Calculation):** Hệ thống không chỉ đếm số nhân viên gán trực tiếp vào phòng ban đó, mà tự động chạy đệ quy cộng dồn số lượng nhân sự của TẤT CẢ các phòng ban con, cháu trực thuộc nhánh đó.
- **Tự động cấu trúc cây:** Dữ liệu trả về từ DB là mảng phẳng (Flat Array). Hệ thống (tại Backend hoặc Frontend) sẽ dựa vào thuộc tính `parentId` để lồng ghép chúng thành cấu trúc Tree.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Lấy dữ liệu và Chuyển đổi Cấu trúc (Build Tree)
Mô tả quá trình Frontend yêu cầu dữ liệu và sử dụng thuật toán để cấu trúc lại mảng phẳng thành cây.

```mermaid
sequenceDiagram
    autonumber
    actor BOD as Ban Giám Đốc (C-Level)
    participant FE as Giao diện (OrgChart.jsx)
    participant Logic as Client Logic (Hàm buildTree)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    BOD->>FE: Truy cập trang "Sơ đồ tổ chức"
    FE->>BE: GET /api/departments
    
    BE->>DB: Lấy danh sách toàn bộ Department kèm Số lượng (employeeCount)
    DB-->>BE: Flat Array (Danh sách mảng phẳng)
    BE-->>FE: HTTP 200 OK (Danh sách mảng phẳng)
    
    rect rgb(255, 250, 240)
        note right of Logic: Biến đổi Flat Array -> Tree
        FE->>Logic: Gọi hàm buildTree(flatList)
        Logic-->>Logic: Tạo Map lưu trữ theo id
        Logic-->>Logic: Lặp mảng, nhét các node con vào thuộc tính 'children' của node cha
        Logic-->>FE: Trả về cấu trúc cây (Mảng các Root Nodes)
    end
```

### 3.2. Luồng Đệ quy Hiển thị & Tính toán Headcount
Mô tả cách một `OrgNode` tự động render và cộng dồn số lượng nhân sự từ các nhánh con.

```mermaid
sequenceDiagram
    autonumber
    participant FE as Giao diện (OrgChart.jsx)
    participant Node as Thành phần OrgNode

    FE->>Node: Render(rootNode)
    
    rect rgb(240, 255, 240)
        note right of Node: Hàm calculateTotalEmployees(node)
        Node->>Node: Lấy số lượng NV trực thuộc của node hiện tại
        
        loop Cho mỗi phòng ban con (child in node.children)
            Node->>Node: Đệ quy gọi calculateTotalEmployees(child)
            Node->>Node: Cộng dồn kết quả vào Tổng
        end
    end
    
    Node->>Node: Render UI Thẻ phòng ban (Hiện Tổng nhân sự nhánh)
    
    opt Nếu có phòng ban con
        Node->>Node: Vẽ đường kẻ nối (Vạch nối cha-con)
        loop Cho mỗi child
            Node->>Node: Gọi đệ quy Render(child)
        end
    end
    
    Node-->>FE: Trả về giao diện cây hoàn chỉnh
    FE->>BOD: Hiển thị Sơ đồ Tổ chức dạng Cây lên màn hình
```
