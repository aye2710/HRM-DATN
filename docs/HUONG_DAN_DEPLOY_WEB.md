# 🌐 HƯỚNG DẪN KÍCH HOẠT DEPLOY LÊN WEB THẬT (1-CLICK VỚI RENDER)

Hệ thống đã được trang bị tệp cấu hình hạ tầng tự động **`render.yaml`** (Infrastructure as Code). Bạn chỉ cần thực hiện 3 bước đơn giản dưới đây để kích hoạt web chạy thật 24/7:

---

### Bước 1: Mở trang Web Render
1. Truy cập vào trang: **[https://dashboard.render.com](https://dashboard.render.com)**.
2. Bấm chọn **"Sign in with GitHub"** (đăng nhập bằng tài khoản GitHub `aye2710` của bạn).

---

### Bước 2: Kích hoạt Blueprint tự động
1. Ở góc trên bên phải màn hình Render Dashboard, bấm nút **"+ New"** ➔ chọn **"Blueprint"** (hoặc truy cập trực tiếp link: **[https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)**).
2. Tìm và chọn repository: **`HRM-DATN`**.
3. Render sẽ tự động đọc file `render.yaml` và nhận diện 3 dịch vụ:
   * 🐘 **hrm-db**: Cơ sở dữ liệu PostgreSQL Cloud miễn phí (Region Singapore).
   * ⚙️ **hrm-backend**: Máy chủ Node.js Express API (tự nạp seed CSDL và cấu hình biến môi trường).
   * ⚡ **hrm-frontend**: Trang web React Vite (tự cấu hình CDN và chống lỗi F5 trang).
4. Bấm nút màu tím: **"Apply"** (hoặc **"Create New Resources"**).

---

### Bước 3: Nhận link Web thật!
* Hệ thống Render sẽ tự động khởi tạo database, build code và deploy trong khoảng 2 - 3 phút.
* Sau khi hoàn tất, Render sẽ cấp ngay 1 đường link trang web HTTPS miễn phí (ví dụ: `https://hrm-frontend-xxxx.onrender.com`).
* Bạn có thể mở link này trên điện thoại hoặc máy tính bất kỳ để truy cập và gửi link cho thầy cô / bạn bè!

---

### 🔑 Thông tin tài khoản đăng nhập trên Web thật:
* **Tài khoản Quản trị (Admin)**: `admin` / Mật khẩu: `123456`
* **Tài khoản Nhân viên (ESS)**: `emp01` / Mật khẩu: `123456`

