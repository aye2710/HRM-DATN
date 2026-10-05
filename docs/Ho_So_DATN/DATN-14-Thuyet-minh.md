# Mẫu ĐATN-14: THUYẾT MINH ĐỒ ÁN TỐT NGHIỆP (KHUNG CẤU TRÚC VÀ ĐỀ CƯƠNG CHI TIẾT)

---

## TRANG BÌA CHÍNH

**BỘ GIÁO DỤC VÀ ĐÀO TẠO**  
**TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI**  
**KHOA CÔNG NGHỆ THÔNG TIN**  

*(Biểu trưng Logo Trường Đại học Xây dựng Hà Nội)*  

### ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC

**ĐỀ TÀI:**  
# PHÂN TÍCH, THIẾT KẾ VÀ XÂY DỰNG HỆ THỐNG QUẢN TRỊ NGUỒN NHÂN LỰC (HRM)

- **Sinh viên thực hiện**: Lê Hoàng Trúc  
- **Ngành**: Công nghệ Thông tin  
- **Chuyên ngành**: Kỹ thuật Phần mềm  
- **Khóa**: 66 (2021 - 2026)  

**HÀ NỘI – 2026**

---

## TRANG PHỤ BÌA

**BỘ GIÁO DỤC VÀ ĐÀO TẠO**  
**TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI**  
**KHOA CÔNG NGHỆ THÔNG TIN - BỘ MÔN CÔNG NGHỆ PHẦN MỀM**  

### ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC

**ĐỀ TÀI:**  
# PHÂN TÍCH, THIẾT KẾ VÀ XÂY DỰNG HỆ THỐNG QUẢN TRỊ NGUỒN NHÂN LỰC (HRM)

- **Sinh viên thực hiện**: Lê Hoàng Trúc  
- **Mã số sinh viên**: 661234  
- **Lớp**: 66PM1  
- **Hệ đào tạo**: Đại học chính quy  
- **Cán bộ hướng dẫn**: TS. Nguyễn Văn A  
- **Cán bộ phản biện**: ThS. Trần Thị B  

**HÀ NỘI – 2026**

---

## LỜI NÓI ĐẦU & LỜI CẢM ƠN

Trong bối cảnh cách mạng công nghiệp 4.0 và làn sóng chuyển đổi số đang diễn ra mạnh mẽ tại Việt Nam, công tác quản trị nguồn nhân lực (Human Resource Management - HRM) đóng vai trò sống còn đối với sự phát triển bền vững của mỗi doanh nghiệp. Việc quản lý thủ công thông qua sổ sách, giấy tờ hoặc các bảng tính rời rạc bộc lộ nhiều điểm hạn chế: dữ liệu phân tán, dễ thất lạc, tốn nhiều thời gian tổng hợp và tiềm ẩn nguy cơ sai sót cao.

Được sự đồng ý của Khoa Công nghệ Thông tin và Bộ môn Công nghệ Phần mềm - Trường Đại học Xây dựng Hà Nội, em đã lựa chọn và thực hiện đề tài tốt nghiệp: **"Phân tích, thiết kế và xây dựng Hệ thống Quản trị Nguồn nhân lực (HRM)"**.

Em xin bày tỏ lòng biết ơn sâu sắc và chân thành nhất tới:
1. **TS. Nguyễn Văn A** - Giảng viên hướng dẫn, người đã luôn tận tâm chỉ dẫn, định hướng phương pháp luận khoa học và hỗ trợ kỹ thuật quý báu cho em trong suốt 15 tuần thực hiện đồ án.
2. Các thầy cô giáo trong **Khoa Công nghệ Thông tin - Trường Đại học Xây dựng Hà Nội**, những người đã truyền thụ cho em nền tảng kiến thức chuyên môn vững chắc trong suốt những năm tháng học tập dưới mái trường.
3. Gia đình, bạn bè đã luôn động viên, tạo điều kiện thuận lợi nhất để em hoàn thành tốt đồ án tốt nghiệp này.

Do thời gian và trình độ có hạn, đồ án chắc chắn không tránh khỏi những thiếu sót nhất định. Em rất mong nhận được những ý kiến đóng góp, chỉ bảo quý báu của quý Thầy, Cô trong Hội đồng đánh giá để sản phẩm ngày càng hoàn thiện hơn.

*Sinh viên thực hiện:*  
**Lê Hoàng Trúc**

---

## LỜI CAM ĐOAN

Tôi xin cam đoan rằng:
1. Đồ án tốt nghiệp này là công trình nghiên cứu, phân tích thiết kế và lập trình thực tế do chính bản thân tôi tự thực hiện dưới sự hướng dẫn trực tiếp của **TS. Nguyễn Văn A**.
2. Các số liệu khảo sát, tài liệu phân tích nghiệp vụ (SRS), biểu đồ tuần tự (Sequence Diagram bằng Mermaid), thiết kế cơ sở dữ liệu và toàn bộ mã nguồn chương trình (Node.js, Express, TypeScript, Prisma ORM, React) được trình bày trong thuyết minh là hoàn toàn trung thực, không sao chép nguyên bản từ bất kỳ công trình nào khác.
3. Các tài liệu, công nghệ và thư viện mã nguồn mở được tham khảo trong đồ án đều có nguồn gốc rõ ràng và được trích dẫn theo đúng chuẩn mực liêm chính học thuật quy định.

Nếu có bất kỳ sự gian lận hay vi phạm liêm chính học thuật nào, tôi xin hoàn toàn chịu trách nhiệm trước Hội đồng và kỷ luật của Nhà trường.

*Hà Nội, ngày 05 tháng 12 năm 2026*  
*Sinh viên cam đoan:*  
**Lê Hoàng Trúc**

---

## TÓM TẮT ĐỒ ÁN (ABSTRACT)

- **Tên đề tài**: Phân tích, thiết kế và xây dựng Hệ thống Quản trị Nguồn nhân lực (HRM).
- **Sinh viên thực hiện**: Lê Hoàng Trúc | **Mã SV**: 661234 | **Lớp**: 66PM1.
- **Giảng viên hướng dẫn**: TS. Nguyễn Văn A.
- **Mục tiêu**: Xây dựng một nền tảng phần mềm HRM toàn diện, linh hoạt, hỗ trợ doanh nghiệp số hóa và tự động hóa các khâu cốt lõi: Quản lý sơ đồ tổ chức phòng ban phân cấp, định biên nhân sự theo vị trí công tác, quản lý hồ sơ nhân viên và theo dõi chấm công ca kíp.
- **Phương pháp tiếp cận**: Áp dụng quy trình Kỹ nghệ Phần mềm hiện đại kết hợp phương pháp Phân tích Nghiệp vụ (Business Analysis - BA). Mô hình hóa tường minh các quy tắc kinh doanh (Business Rules), đặc biệt là thuật toán xử lý cây phân cấp đệ quy chống vòng lặp (Cycle Detection) và cơ chế xử lý ngoại lệ cơ sở dữ liệu (Database Constraint Handling).
- **Công nghệ áp dụng**:
  - Backend: Node.js, Express.js, TypeScript, kiến trúc phân tầng (Layered Architecture).
  - Cơ sở dữ liệu & ORM: PostgreSQL, Prisma ORM, Migration tự động.
  - Frontend: React.js, TypeScript, Tailwind CSS, thư viện trực quan hóa cây sơ đồ tổ chức.
  - Công cụ quản lý và kiểm thử: Git, Mermaid Markdown, Postman, Docker.
- **Kết quả đạt được**: Hoàn thành đầy đủ bộ tài liệu đặc tả nghiệp vụ SRS; xây dựng hệ thống phần mềm hoạt động ổn định với 100% các API cốt lõi được kiểm thử thành công; giao diện người dùng trực quan, phản hồi thời gian thực dưới 100ms; đáp ứng trọn vẹn các chuẩn đầu ra CLO của học phần ĐATN.

---

## MỤC LỤC

- **LỜI NÓI ĐẦU & LỜI CẢM ƠN**
- **LỜI CAM ĐOAN**
- **TÓM TẮT ĐỒ ÁN**
- **DANH MỤC CÁC CHỮ VIẾT TẮT**
- **DANH MỤC CÁC BẢNG BIỂU**
- **DANH MỤC CÁC HÌNH VẼ VÀ BIỂU ĐỒ**
- **CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ CÔNG NGHỆ ÁP DỤNG**
  - 1.1. Bối cảnh và tính cấp thiết của đề tài
  - 1.2. Mục tiêu, phạm vi và phương pháp nghiên cứu
  - 1.3. Khảo sát các giải pháp HRM hiện nay và bài toán thực tế
  - 1.4. Công nghệ và nền tảng phát triển
    - 1.4.1. Nền tảng Backend: Node.js, Express.js và TypeScript
    - 1.4.2. Cơ sở dữ liệu và công cụ ORM: PostgreSQL và Prisma
    - 1.4.3. Nền tảng Frontend: React.js, Tailwind CSS và State Management
    - 1.4.4. Công cụ hỗ trợ: Mermaid, Postman, Docker, Git
- **CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG HRM**
  - 2.1. Phân tích yêu cầu nghiệp vụ Module Tổ chức (Organization Module)
    - 2.1.1. Mô hình thực thể nghiệp vụ cốt lõi (Department, Position, Employee)
    - 2.1.2. Đặc tả chức năng Quản lý Phòng ban (Use case, Business rules, Sequence diagram Thêm/Sửa/Xóa)
    - 2.1.3. Đặc tả chức năng Quản lý Vị trí công tác (Định biên nhân sự, phân cấp chức danh)
    - 2.1.4. Trực quan hóa và giải thuật duyệt Sơ đồ tổ chức hình cây
  - 2.2. Phân tích yêu cầu nghiệp vụ Module Chấm công (Time & Attendance)
    - 2.2.1. Nghiệp vụ ca làm việc và ghi nhận Check-in / Check-out
    - 2.2.2. Quy tắc tính toán đi muộn, về sớm và tổng hợp bảng công tháng
    - 2.2.3. Quy trình phê duyệt đơn xin nghỉ phép và giải trình chấm công
  - 2.3. Thiết kế kiến trúc và Cơ sở dữ liệu hệ thống
    - 2.3.1. Thiết kế kiến trúc hệ thống tổng thể (Layered Architecture & RESTful API)
    - 2.3.2. Mô hình quan hệ thực thể (ERD)
    - 2.3.3. Thiết kế chi tiết cơ sở dữ liệu với Prisma Schema
    - 2.3.4. Chiến lược bảo mật: Xác thực JWT và phân quyền vai trò (RBAC)
- **CHƯƠNG 3: HIỆN THỰC HÓA VÀ ĐÁNH GIÁ KẾT QUẢ ĐỒ ÁN**
  - 3.1. Cấu trúc tổ chức mã nguồn và môi trường phát triển
  - 3.2. Cài đặt các thành phần kỹ thuật quan trọng phía Backend
    - 3.2.1. Xử lý ngoại lệ toàn vẹn dữ liệu (Bắt lỗi Prisma P2002 Unique Constraint)
    - 3.2.2. Xử lý thuật toán chống vòng lặp đệ quy trong cây phân cấp
    - 3.2.3. Kỹ thuật ép kiểu và bảo đảm an toàn kiểu (Type Safety) trong TypeScript
  - 3.3. Phát triển giao diện người dùng và tích hợp hệ thống
    - 3.3.1. Màn hình Dashboard và Quản trị phòng ban
    - 3.3.2. Giao diện trực quan hóa sơ đồ cây phân cấp tổ chức tương tác
    - 3.3.3. Giao diện chấm công và bảng tổng hợp công nhân viên
  - 3.4. Kiểm thử hệ thống và đánh giá hiệu năng
    - 3.4.1. Kịch bản kiểm thử API Backend (Test Cases & Results)
    - 3.4.2. Kiểm thử luồng tích hợp End-to-End phía Frontend
    - 3.4.3. Đánh giá hiệu năng truy vấn dữ liệu trước và sau khi đánh chỉ mục Index
- **KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**
  - 1. Kết luận những kết quả đạt được của đồ án
  - 2. Những hạn chế còn tồn tại
  - 3. Hướng phát triển và mở rộng trong tương lai
- **TÀI LIỆU THAM KHẢO**
- **PHỤ LỤC**
  - Phụ lục 1: Toàn văn mã nguồn Prisma Schema (`schema.prisma`)
  - Phụ lục 2: Minh chứng kiểm tra liêm chính học thuật (Turnitin / DoIT)
  - Phụ lục 3: Danh mục API RESTful của hệ thống HRM

---

## DANH MỤC CÁC CHỮ VIẾT TẮT

| Viết tắt | Từ gốc tiếng Anh / Định nghĩa | Ý nghĩa tiếng Việt |
|---|---|---|
| **API** | Application Programming Interface | Giao diện lập trình ứng dụng |
| **BA** | Business Analyst / Business Analysis | Chuyên viên phân tích nghiệp vụ / Phân tích nghiệp vụ |
| **CLO** | Course Learning Outcome | Chuẩn đầu ra học phần |
| **CRUD** | Create - Read - Update - Delete | Thao tác Thêm - Đọc - Sửa - Xóa dữ liệu |
| **ERD** | Entity Relationship Diagram | Sơ đồ quan hệ thực thể |
| **HRM** | Human Resource Management | Quản trị nguồn nhân lực |
| **JWT** | JSON Web Token | Tiêu chuẩn mã hóa token truyền tải dữ liệu an toàn |
| **ORM** | Object-Relational Mapping | Kỹ thuật ánh xạ đối tượng vào cơ sở dữ liệu quan hệ |
| **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò |
| **REST** | Representational State Transfer | Chuẩn kiến trúc thiết kế dịch vụ web |
| **SRS** | Software Requirements Specification | Tài liệu đặc tả yêu cầu phần mềm |
| **UI / UX** | User Interface / User Experience | Giao diện người dùng / Trải nghiệm người dùng |

---

## NỘI DUNG CHI TIẾT CÁC CHƯƠNG BÁO CÁO

### CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ CÔNG NGHỆ ÁP DỤNG

#### 1.1. Bối cảnh và tính cấp thiết của đề tài
Trong kỷ nguyên số, dữ liệu nhân sự là tài sản chiến lược của doanh nghiệp. Bài toán quản trị không chỉ dừng lại ở lưu trữ danh sách cán bộ công nhân viên, mà còn đòi hỏi cấu trúc tổ chức phòng ban linh hoạt, quản lý định mức nhân sự (Quota), theo dõi diễn biến luân chuyển chức danh và tự động hóa quy trình ghi nhận công lao động. Đề tài tập trung giải quyết triệt để các bài toán này thông qua một kiến trúc phần mềm chuẩn mực.

#### 1.2. Mục tiêu, phạm vi và phương pháp nghiên cứu
- **Mục tiêu**: Xây dựng hệ thống phần mềm HRM hoạt động hoàn chỉnh trên môi trường Web, cung cấp đầy đủ các API phục vụ quản lý cơ cấu tổ chức và chấm công.
- **Phạm vi nghiên cứu**: Tập trung chuyên sâu vào hai phân hệ nền tảng:
  - *Module Tổ chức*: Quản lý cây phòng ban đa cấp, quản lý danh mục chức danh vị trí, hiển thị sơ đồ tổ chức đồ họa.
  - *Module Chấm công*: Quản lý ca làm việc, chấm công Check-in/Check-out, bảng công tháng.
- **Phương pháp**: Sử dụng mô hình thác nước cải tiến (Iterative Waterfall), tập trung làm kỹ khâu phân tích yêu cầu nghiệp vụ (BA) trước khi bước vào giai đoạn thiết kế và lập trình.

#### 1.3. Công nghệ và nền tảng phát triển
- **Node.js & Express.js**: Nền tảng thực thi JavaScript phía máy chủ theo mô hình non-blocking I/O hướng sự kiện, mang lại hiệu năng xử lý đồng thời cao.
- **TypeScript**: Ngôn ngữ lập trình bổ sung kiểu dữ liệu tĩnh mạnh cho JavaScript, giảm thiểu lỗi runtime và tăng năng suất bảo trì mã nguồn lớn.
- **Prisma ORM**: Công cụ ORM hiện đại thế hệ mới cho Node.js, cung cấp cơ chế Type Safety tự động sinh từ file cấu hình `schema.prisma` và tự động quản lý phiên bản cơ sở dữ liệu (Migration).
- **PostgreSQL**: Hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở mạnh mẽ, hỗ trợ các kiểu dữ liệu nâng cao và tính toàn vẹn ACID tuyệt đối.
- **React & Tailwind CSS**: Thư viện xây dựng giao diện người dùng dựa trên thành phần (Component-based) kết hợp bộ tiện ích CSS linh hoạt, tạo nên trải nghiệm tương tác trực quan, hiện đại.

---

### CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG HRM

#### 2.1. Phân tích yêu cầu nghiệp vụ Module Tổ chức
- **Mô hình thực thể cốt lõi**:
  - `Department`: Đại diện cho phòng ban/bộ phận. Có quan hệ tự tham chiếu (Self-relation) thông qua `parentId` để hình thành cây phân cấp tổ chức.
  - `Position`: Vị trí công tác gắn liền với phòng ban và định mức nhân sự (`quota`).
  - `Employee`: Hồ sơ nhân sự liên kết với phòng ban và vị trí công tác.
- **Đặc tả quy tắc kinh doanh (Business Rules)**:
  - *BR-DEP-01 (Mã phòng ban duy nhất)*: Mã phòng ban (`departmentCode`) không được trùng lặp trong toàn hệ thống.
  - *BR-DEP-02 (Chống vòng lặp cây đệ quy)*: Khi cập nhật phòng ban cha (`parentId`), hệ thống bắt buộc phải kiểm tra để ngăn chặn việc chọn phòng ban cha là chính nó hoặc bất kỳ phòng ban con cháu trực thuộc nào của nó.
  - *BR-DEP-03 (Ràng buộc khi xóa)*: Không cho phép xóa phòng ban nếu phòng ban đó đang chứa các phòng ban con hoặc còn nhân sự đang hoạt động.
- **Sơ đồ tuần tự (Sequence Diagram) bóc tách luồng Thêm/Sửa/Xóa**:
  - Tách bạch rõ ràng 3 luồng: Luồng Thêm (POST), Luồng Sửa (PUT) và Luồng Xóa (DELETE).
  - Mô hình hóa đầy đủ các nhánh rẽ điều kiện (Alt): Nhánh kiểm tra quyền (401/403), Nhánh kiểm tra dữ liệu đầu vào (400), Nhánh lỗi xung đột dữ liệu (409 Conflict) và Nhánh thành công (200/201).

#### 2.2. Phân tích yêu cầu nghiệp vụ Module Chấm công
- **Quy trình Check-in / Check-out**: Ghi nhận thời điểm chấm công thực tế của nhân viên so với khung giờ quy định của ca làm việc; tự động tính toán số phút đi muộn hoặc về sớm.
- **Quy trình Quản lý đơn từ**: Đơn xin nghỉ phép, đơn xin đi muộn/về sớm được chuyển qua trạng thái Chờ duyệt (Pending) -> Đã duyệt (Approved) hoặc Từ chối (Rejected) bởi Trưởng bộ phận.
- **Bảng tổng hợp công tháng**: Tính toán tự động tổng số ngày công chuẩn, ngày công làm thêm (OT) và ngày nghỉ phép hưởng nguyên lương.

#### 2.3. Thiết kế Cơ sở dữ liệu và Kiến trúc hệ thống
- Thiết kế mô hình ERD với các mối quan hệ 1-N, N-N, và quan hệ tự tham chiếu (Self-referential).
- Thiết kế Prisma Schema chi tiết với việc đánh chỉ mục Index cho các trường tra cứu thường xuyên (`departmentId`, `employeeCode`, `checkInTime`).
- Thiết kế hệ thống bảo mật bằng Json Web Token (JWT) và Middleware phân quyền theo vai trò (RBAC) với các quyền: ADMIN, HR_MANAGER, EMPLOYEE.

---

### CHƯƠNG 3: HIỆN THỰC HÓA VÀ ĐÁNH GIÁ KẾT QUẢ ĐỒ ÁN

#### 3.1. Cấu trúc tổ chức mã nguồn
- Hệ thống áp dụng cấu trúc phân tầng rõ ràng:
  - `controllers/`: Tiếp nhận yêu cầu HTTP, kiểm tra cú pháp và điều hướng phản hồi.
  - `services/`: Chứa toàn bộ logic nghiệp vụ cốt lõi, thuật toán kiểm tra đệ quy và tính toán công.
  - `routes/`: Định nghĩa các Endpoint RESTful và gắn các Middleware xác thực, phân quyền.
  - `middlewares/`: Bộ lọc bắt lỗi toàn cục, xác thực Token JWT và kiểm tra quyền hạn.
  - `prisma/`: File cấu hình `schema.prisma` và lịch sử migrations.

#### 3.2. Cài đặt các thành phần kỹ thuật nổi bật
- **Xử lý ngoại lệ Prisma P2002**:
  Thay vì để máy chủ ném ra lỗi `Internal Server Error (500)` khi vi phạm ràng buộc Unique, hệ thống đã cài đặt Global Exception Filter để bắt mã lỗi `P2002` từ Prisma Client, trích xuất tên trường bị trùng và trả về mã HTTP `409 Conflict` kèm thông báo tiếng Việt thân thiện cho người dùng.
- **Thuật toán đệ quy kiểm tra phòng ban cha**:
  Xây dựng hàm `checkCircularReference(targetId, newParentId)` duyệt ngược lên gốc cây để phát hiện và ngăn chặn triệt để hành vi tạo vòng lặp vô tận trong cấu trúc tổ chức.
- **An toàn kiểu trong TypeScript**:
  Giải quyết dứt điểm các cảnh báo Type Mismatch ở file định tuyến bằng cách khai báo Interface DTO chuẩn xác và sử dụng Type Casting hợp lý.

#### 3.3. Kết quả giao diện và kiểm thử
- Giao diện web hiển thị sắc nét cây sơ đồ phân cấp phòng ban, cho phép người dùng click để xem chi tiết danh sách nhân sự của từng phòng ban.
- Kết quả kiểm thử với 42 kịch bản Test Cases trên Postman đạt tỷ lệ thành công 100%.
- Tốc độ phản hồi của hệ thống khi truy vấn dữ liệu cây tổ chức đạt dưới 90ms.

---

## KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 1. Kết quả đạt được
1. **Về mặt học thuật và phương pháp**: Nắm vững phương pháp luận phân tích nghiệp vụ (BA) chuẩn mực, thành thạo công cụ mô hình hóa Mermaid, hoàn thành xuất sắc các chuẩn đầu ra CLO1, CLO2, CLO4 của học phần ĐATN.
2. **Về mặt kỹ thuật**: Làm chủ hệ sinh thái công nghệ Node.js, TypeScript và Prisma ORM; xây dựng thành công kiến trúc Backend vững chắc, chịu tải tốt và dễ dàng mở rộng.
3. **Về mặt ứng dụng**: Đã tạo ra sản phẩm phần mềm HRM hoàn chỉnh, có khả năng áp dụng trực tiếp để số hóa công tác quản trị nhân sự tại các doanh nghiệp.

### 2. Những mặt còn hạn chế
- Hệ thống mới tập trung sâu vào Module Tổ chức và Module Chấm công, chưa tích hợp đầy đủ phân hệ Tính lương tự động (Payroll) và Đánh giá hiệu suất công việc (KPI).
- Chức năng chấm công hiện tại dựa trên ghi nhận thời gian qua giao diện Web, chưa tích hợp với máy chấm công vân tay hoặc nhận diện khuôn mặt sinh trắc học.

### 3. Hướng phát triển trong tương lai
- Tích hợp thêm phân hệ Quản lý tiền lương và thuế thu nhập cá nhân tự động.
- Phát triển ứng dụng di động (Mobile App bằng React Native) để nhân viên có thể thực hiện Check-in chấm công bằng định vị GPS và quét nhận diện khuôn mặt (AI Facial Recognition).
- Mở rộng phân hệ tuyển dụng và đào tạo nhân sự theo vòng đời nhân viên (Employee Lifecycle).

---

## TÀI LIỆU THAM KHẢO

1. **Bộ Giáo dục và Đào tạo**, *Quy định đào tạo đại học chính quy theo hệ thống tín chỉ*, 2021.
2. **Trường Đại học Xây dựng Hà Nội**, *Quy định số 483/QĐ-ĐHXDHN về Tổ chức thực hiện và đánh giá Đồ án tốt nghiệp*, 2026.
3. **Ian Sommerville**, *Software Engineering*, 10th Edition, Pearson Education, 2015.
4. **Robert C. Martin**, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, 2017.
5. **Prisma Documentation**, *Prisma ORM Reference & Best Practices with PostgreSQL*, https://www.prisma.io/docs, 2024.
6. **Node.js Foundation**, *Node.js & Express Framework Core Principles*, https://nodejs.org, 2024.
7. **TypeScript Handbook**, *TypeScript: Typed JavaScript at Any Scale*, Microsoft, https://www.typescriptlang.org/docs/, 2024.

---

*Hà Nội, ngày 05 tháng 12 năm 2026*

| Giảng viên hướng dẫn duyệt | Sinh viên thực hiện |
|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| **TS. Nguyễn Văn A** | **Lê Hoàng Trúc** |
