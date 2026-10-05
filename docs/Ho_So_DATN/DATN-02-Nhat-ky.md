# Mẫu ĐATN-02: NHẬT KÝ THỰC HIỆN ĐATN

- **Họ và tên SV**: Lê Hoàng Trúc  
- **Mã SV**: 661234  
- **Lớp**: 66PM1  
- **Tên đề tài**: Phân tích, thiết kế và xây dựng Hệ thống Quản trị Nguồn nhân lực (HRM)  
- **GVHD**: TS. Nguyễn Văn A  
- **Thời gian thực hiện**: 15/08/2026 - 30/11/2026 (15 tuần)  

---

| Loại công việc | Thời gian | Nhiệm vụ được giao | Kết quả thực hiện | Kiến thức/kỹ năng áp dụng | Các vấn đề cần bổ sung/chỉnh sửa | Tự đánh giá & rút kinh nghiệm |
|---|---|---|---|---|---|---|
| **Tuần 1: Khởi động & Khảo sát nghiệp vụ Module Tổ chức** |
| Làm việc độc lập | 15 giờ | Tìm hiểu quy trình quản lý cơ cấu tổ chức của doanh nghiệp thực tế. Lên khung tài liệu phân tích nghiệp vụ cho Module Tổ chức. | Viết xong tài liệu `Module Tổ chức.md` mô tả các thực thể cốt lõi (Phòng ban, Vị trí công tác, Nhân viên). | Kỹ năng phân tích nghiệp vụ (BA), phân tích quan hệ tổ chức dạng cây phân cấp. | Cần bổ sung danh mục [CẦN XÁC NHẬN] cho các quy định kinh doanh chưa rõ ràng. | Cần chuyển đổi góc nhìn từ thuần kỹ thuật sang góc nhìn bài toán nghiệp vụ của người làm HR. |
| **Tuần 2: Đặc tả Use Case Quản lý Phòng ban & Vị trí** |
| Làm việc độc lập | 20 giờ | Viết tài liệu đặc tả chi tiết (SRS) cho tính năng Thêm, Sửa, Xóa phòng ban và vị trí công tác. | Hoàn thành `Chuc-nang-Quan-ly-Phong-ban.md` và `Chuc-nang-Quan-ly-Vi-tri.md` với các bảng quy tắc kinh doanh. | Soạn thảo SRS theo chuẩn IEEE 830, mô hình hóa quy tắc kiểm tra trùng mã và ràng buộc toàn vẹn. | Cần bóc tách rõ ràng luồng Thêm và Sửa thành các mục riêng biệt để dễ theo dõi nghiệp vụ. | Luồng sửa phòng ban phức tạp hơn luồng thêm do phải kiểm tra chống tạo vòng lặp cây. |
| **Tuần 3: Trực quan hóa Sơ đồ Tổ chức & Vẽ Sequence Diagram** |
| Làm việc độc lập | 18 giờ | Thiết kế sơ đồ tuần tự (Sequence Diagram) chi tiết cho từng nghiệp vụ; xây dựng thuật toán hiển thị cây tổ chức. | Hoàn thành `Chuc-nang-Xem-So-do-To-chuc.md`; bổ sung Mermaid Sequence Diagram có phân nhánh luồng ngoại lệ (Alt/Opt). | Kỹ năng vẽ biểu đồ Mermaid Markdown, thuật toán chuyển đổi mảng phẳng (Flat array) sang cấu trúc cây lồng nhau (Tree). | Bổ sung quy tắc tính định mức nhân sự (Quota) và tỷ lệ lấp đầy trên từng nút phòng ban. | Sử dụng Mermaid trong tài liệu Markdown giúp quản lý phiên bản qua Git rất thuận tiện. |
| **Tuần 4: Thiết kế CSDL & Khởi tạo dự án Backend** |
| Làm việc độc lập | 20 giờ | Thiết kế mô hình ERD, định nghĩa Prisma Schema cho Module Tổ chức; cấu hình dự án Node.js/Express với TypeScript. | Tạo thành công `schema.prisma`, chạy migration tạo bảng PostgreSQL; thiết lập cấu trúc thư mục Controller-Service-Repository. | Thiết kế CSDL quan hệ, Prisma ORM, kiến trúc phần mềm phân tầng (Layered Architecture). | Chú ý cấu hình `onDelete` phù hợp (Restrict/SetNull) đối với quan hệ phòng ban cha - con. | Prisma Client tự động sinh kiểu dữ liệu giúp hạn chế lỗi runtime trong TypeScript. |
| **Tuần 5: Đánh giá mốc M1 & Hoàn thiện pha Phân tích Thiết kế** |
| Làm việc với GVHD | 12 giờ | Báo cáo tiến độ phân tích và thiết kế hệ thống tại mốc M1 trước Giảng viên hướng dẫn. | Mốc M1 được đánh giá Đạt (8.5/10 điểm); tiếp thu góp ý về bổ sung cơ chế kiểm soát quyền truy cập API. | Thuyết trình kỹ thuật, giải trình giải pháp kiến trúc và sơ đồ thực thể liên kết. | Bổ sung Middleware xác thực Token và phân quyền vai trò (Role-Based Access Control) vào tài liệu thiết kế. | Cần chuẩn bị kỹ lưỡng các kịch bản kiểm thử giả định trước khi bước vào giai đoạn code. |
| **Tuần 6: Khảo sát & Phân tích nghiệp vụ Module Chấm công** |
| Làm việc độc lập | 16 giờ | Khảo sát bài toán chấm công doanh nghiệp: phân ca làm việc, quy định đi muộn/về sớm, tính công nhật và bảng tổng hợp. | Viết tài liệu đặc tả chức năng Check-in / Check-out, đơn xin nghỉ phép và quy tắc tính công tháng. | Phân tích nghiệp vụ chấm công, thiết kế máy trạng thái hữu hạn (State Machine) cho đơn nghỉ phép. | Cần làm rõ quy định làm tròn phút đi muộn và công thức tính làm thêm giờ (OT). | Nghiệp vụ chấm công liên quan chặt chẽ đến hồ sơ nhân sự và phân ca làm việc. |
| **Tuần 7: Lập trình Backend API Module Tổ chức** |
| Làm việc độc lập | 22 giờ | Hiện thực hóa các API CRUD Phòng ban, Vị trí công tác, lấy danh sách cây phân cấp. | Xây dựng hoàn chỉnh các Endpoint RESTful (`/api/departments`, `/api/positions`) có validation dữ liệu đầu vào. | Lập trình Node.js/TypeScript, viết câu truy vấn đệ quy Prisma, sử dụng class-validator/Zod. | Cần xử lý thuật toán kiểm tra vòng lặp cây: cấm chọn phòng ban cha là chính nó hoặc phòng ban con của nó. | Viết hàm đệ quy kiểm tra cây phân cấp trên server giúp đảm bảo dữ liệu luôn hợp lệ. |
| **Tuần 8: Xử lý ngoại lệ Backend & Sửa lỗi Type Mismatch** |
| Làm việc nhóm / GVHD | 18 giờ | Xử lý lỗi Prisma Unique Constraint (bắt mã lỗi P2002 trả về 409 Conflict thay vì 500); xử lý type mismatch trong TypeScript. | Cấu hình Global Exception Filter bắt mã P2002; sửa lỗi gán kiểu tại `kpi.routes.ts` bằng ép kiểu dữ liệu chuẩn xác. | Kỹ năng debug TypeScript, Exception Handling trong Express, tối ưu mã nguồn. | Cần hạn chế tối đa việc dùng kiểu `any`, chuyển sang dùng Type Assertion và Custom Interface chặt chẽ. | Việc chuẩn hóa mã lỗi HTTP giúp phía Frontend hiển thị thông báo thân thiện cho người dùng. |
| **Tuần 9: Lập trình Backend API Module Chấm công & Tích hợp JWT** |
| Làm việc độc lập | 20 giờ | Viết API ghi nhận lượt chấm công, sinh dữ liệu bảng công tự động; cài đặt JWT Authentication & RBAC Middleware. | Hoàn thành API Check-in/Check-out, API phê duyệt đơn nghỉ, hoàn thành Middleware kiểm tra quyền theo vai trò. | Bảo mật web, mã hóa JWT, RBAC Middleware, tối ưu hóa câu lệnh truy vấn ngày giờ. | Cần xử lý múi giờ UTC+7 của Việt Nam đồng nhất giữa Frontend, Backend và Database. | Lưu trữ ngày giờ dưới dạng UTC trong CSDL để tránh sai lệch thời gian chấm công. |
| **Tuần 10: Đánh giá mốc M2 & Kiểm thử API** |
| Làm việc với GVHD/Phản biện | 14 giờ | Báo cáo tiến độ lập trình mốc M2; trình diễn gọi API bằng Postman collection và Swagger UI. | Mốc M2 được đánh giá Đạt (8.8/10 điểm); hoàn thành hơn 85% khối lượng lập trình cốt lõi Backend. | Kỹ năng kiểm thử API, xây dựng tài liệu Swagger/OpenAPI, giải trình mã nguồn. | Tối ưu hóa hiệu năng truy vấn `findMany` khi kết nối nhiều bảng dữ liệu quan hệ. | Được đánh giá cao về khả năng tự chủ debug và xử lý biệt lệ dữ liệu. |
| **Tuần 11: Xây dựng Giao diện Frontend (React/Vite)** |
| Làm việc độc lập | 24 giờ | Xây dựng giao diện Web App: Dashboard thống kê, Trang quản lý phòng ban, Giao diện vẽ cây sơ đồ tổ chức tương tác. | Hoàn thành các màn hình UI chính, tích hợp thư viện vẽ biểu đồ phân cấp cây nhân sự trực quan. | Lập trình Frontend React, Tailwind CSS, Quản lý State (Zustand/React Query), Component-driven UI. | Điều chỉnh giao diện tương thích tốt trên các kích thước màn hình máy tính khác nhau. | Giao diện đẹp, chuyên nghiệp giúp trải nghiệm quản trị nhân sự thuận tiện và rõ ràng hơn. |
| **Tuần 12: Tích hợp Hệ thống Frontend - Backend & E2E Testing** |
| Làm việc độc lập | 22 giờ | Ghép nối toàn bộ API Backend với UI Frontend; viết kịch bản kiểm thử End-to-End từ giao diện người dùng. | Hoàn thành tích hợp luồng nghiệp vụ: từ tạo phòng ban, bổ nhiệm nhân viên đến ghi nhận chấm công. | Kỹ năng tích hợp hệ thống, Axios client interceptors, E2E testing, sửa lỗi CORS và Token Refresh. | Xử lý triệt để các thông báo lỗi hiển thị trên giao diện (Toast message) khi gặp lỗi trùng mã hoặc cấm thao tác. | Kiểm thử kỹ càng các trường hợp biên giúp phát hiện sớm nhiều lỗi logic tiềm ẩn. |
| **Tuần 13: Tối ưu hóa hiệu năng & Bảo mật hệ thống** |
| Làm việc độc lập | 16 giờ | Tối ưu hóa Database Indexing cho các trường tìm kiếm thường xuyên; kiểm tra bảo mật OWASP Top 10 và tối ưu bundle. | Tốc độ tải dữ liệu cây tổ chức và bảng công giảm từ 450ms xuống dưới 90ms; hệ thống hoạt động ổn định. | Database Indexing trong PostgreSQL, Web Security (CORS, Helmet, Rate Limiter), Code Splitting Vite. | Thêm chỉ mục Index cho `departmentId`, `employeeCode`, `checkInTime` trong Prisma schema. | Đánh chỉ mục hợp lý cải thiện rõ rệt tốc độ phản hồi của API khi bảng có nhiều bản ghi. |
| **Tuần 14: Viết quyển Thuyết minh ĐATN & Kiểm tra Liêm chính** |
| Làm việc độc lập | 25 giờ | Soạn thảo toàn văn quyển Báo cáo Thuyết minh tốt nghiệp theo Mẫu ĐATN-14; kiểm tra tỷ lệ trùng lặp văn bản. | Hoàn thành bản thảo Thuyết minh gồm 3 chương đầy đủ biểu đồ; kết quả kiểm tra đạo văn đạt 9.2% (dưới ngưỡng 15%). | Soạn thảo văn bản khoa học, kỹ năng trích dẫn tài liệu tham khảo theo chuẩn IEEE, công cụ kiểm tra đạo văn. | Cần căn chỉnh lề, phông chữ Times New Roman 13pt và đánh số thứ tự bảng biểu, hình vẽ đồng bộ. | Viết báo cáo khoa học đòi hỏi tính chính xác, trung thực và tính logic cao trong từng nhận định. |
| **Tuần 15: Hoàn thiện Hồ sơ ĐATN & Bảo vệ trước Hội đồng (M3)** |
| Làm việc với HĐ / GVHD | 15 giờ | Hoàn tất đầy đủ 14 biểu mẫu hồ sơ ĐATN; đóng gói mã nguồn; chuẩn bị Slide và trình bày bảo vệ trước Hội đồng. | Bảo vệ thành công Đồ án tốt nghiệp trước Hội đồng ĐATN-03; đạt điểm học phần 7.8 (Điểm B+). | Kỹ năng thuyết trình trước hội đồng chuyên môn, kỹ năng demo sản phẩm phần mềm trực tiếp. | Tiếp thu các định hướng mở rộng hệ thống (nhận diện khuôn mặt AI khi chấm công, tích hợp cổng tiền lương). | Kết thúc học phần xuất sắc, nắm vững toàn diện quy trình kỹ nghệ phần mềm từ phân tích đến triển khai. |

---

*Hà Nội, ngày 05 tháng 12 năm 2026*

| Sinh viên thực hiện | Giảng viên hướng dẫn xác nhận |
|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| **Lê Hoàng Trúc** | **TS. Nguyễn Văn A** |
