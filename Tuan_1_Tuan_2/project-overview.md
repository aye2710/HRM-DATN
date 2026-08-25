# PROJECT OVERVIEW

## 1. Document Information — Thông tin tài liệu

---

| Mục (Item) | Nội dung (Content) |
|------------|----------------|
| Project Name — Tên dự án | Hệ thống quản trị nguồn nhân lực (HRM) chuyên sâu cho doanh nghiệp |
| Document — Tài liệu | Project Overview |
| Version — Phiên bản | 2.0 |
| Date — Ngày | 17/08/2026 |
| Author — Người soạn | Lê Hữu Trúc (Cập nhật) |
| Reviewer — Người duyệt | |
| Approver — Người phê duyệt | |

## 2. Project Introduction — Giới thiệu dự án

---

### 2.1. Background — Bối cảnh

Trong bối cảnh chuyển đổi số, quản trị nguồn nhân lực đang là một trong những bài toán sống còn của mọi doanh nghiệp. Tuy nhiên, hiện nay nhiều công ty quy mô vừa và lớn vẫn đang sử dụng các công cụ rời rạc như Excel, Email hoặc các phần mềm độc lập để quản lý nhân sự.

Việc quản lý nhân sự không đồng bộ đang gây khó khăn lớn trong việc lưu trữ dữ liệu, theo dõi chấm công, phê duyệt nghỉ phép và đặc biệt là tính lương. Do đó, doanh nghiệp cần xây dựng một hệ thống HRM tập trung, chuyên sâu nhằm số hóa toàn bộ vòng đời nhân sự.

### 2.2. Business Problem — Vấn đề nghiệp vụ

* **Dữ liệu phân tán** — Quản lý nhân sự trên Excel, không có dữ liệu tập trung.
* **Quy trình thủ công** — Các hoạt động như chấm công, xét duyệt nghỉ phép tốn rất nhiều thời gian.
* **Không có phân quyền** — Ai cũng có thể xem và sửa dữ liệu của người khác trên file.
* **Báo cáo chậm trễ** — Mất nhiều giờ để tổng hợp báo cáo biến động nhân sự.
* **Sai sót khi nhập liệu** — Nhập tay dẫn đến sai sót về ngày công, lương, bảo hiểm.
* **Tính lương phức tạp** — Bài toán tính lương (Payroll) bị phụ thuộc nhiều vào các loại phụ cấp, làm thêm giờ (OT), thuế TNCN lũy tiến, dễ xảy ra sai sót.

### 2.3. Business Opportunity — Cơ hội kinh doanh

* **Tiết kiệm thời gian** — Giảm 70% thời gian xử lý hành chính nhân sự.
* **Tăng hiệu quả quản lý** — Quản lý tập trung toàn bộ dữ liệu nhân sự trên một hệ thống.
* **Chuẩn hóa quy trình** — Áp dụng quy trình chuẩn cho vòng đời nhân viên.
* **Giảm chi phí vận hành** — Cắt giảm chi phí in ấn, lưu trữ hồ sơ giấy tờ.
* **Ra quyết định nhanh** — Báo cáo real-time giúp lãnh đạo đưa ra quyết định kịp thời.
* **Tự động hóa** — Chấm công, tính lương, bảo hiểm, thuế tự động, giảm thiểu tối đa sai sót.

---

## 3. Project Objectives — Mục tiêu dự án

---

| Mã | Mục tiêu |
|-----|----------|
| OBJ-01 | Xây dựng hệ thống HRM chuyên sâu và toàn diện cho doanh nghiệp. |
| OBJ-02 | Quản lý tập trung dữ liệu hồ sơ nhân sự trên một nền tảng duy nhất. |
| OBJ-03 | Tự động hóa quy trình quản lý vòng đời nhân sự (Tuyển dụng đến Nghỉ việc). |
| OBJ-04 | Số hóa và tự động hóa quy trình chấm công, nghỉ phép và tính lương. |
| OBJ-05 | Phân quyền truy cập an toàn theo vai trò (RBAC). |
| OBJ-06 | Hỗ trợ hệ thống báo cáo thống kê nhân sự theo thời gian thực. |

---

## 4. Project Scope — Phạm vi dự án

---

### In Scope — Trong phạm vi

| Module | Mô tả |
|--------|-------|
| Quản lý tổ chức | Sơ đồ tổ chức, Department, Position |
| Quản lý người dùng & Phân quyền | RBAC với các role cốt lõi, 3 portal |
| Tuyển dụng (Recruitment) | Job Requisition, Candidate, Interview, Offer |
| Onboarding | Checklist, tài khoản, thiết bị |
| Quản lý nhân sự (Core HR) | Hồ sơ Employee, Probation, Điều chuyển, Quyết định |
| Chấm công (Attendance) | Check-in/out, ca làm việc, OT, đi muộn về sớm |
| Nghỉ phép (Leave) | Đơn nghỉ, quỹ phép năm, phê duyệt đa cấp |
| Đánh giá (KPI) | Mục tiêu, đánh giá, xếp loại |
| Tính lương (Payroll) | Gross sang Net, phụ cấp, OT, tự động sinh Payslip |
| BHXH & Thuế | Tính bảo hiểm xã hội, thuế TNCN lũy tiến/khấu trừ |
| Tài sản (Asset) | Quản lý thiết bị cấp phát cho nhân viên |
| Giấy tờ (Document) | Upload, phân loại chứng từ, hợp đồng |
| Báo cáo (Reporting) | Dashboard, thống kê nhân sự |

### Out Scope — Ngoài phạm vi

* Hệ thống Multi-Company (Tập đoàn đa công ty)
* Mobile App (Native) — Chỉ hỗ trợ Web responsive
* Trí tuệ nhân tạo (AI) — Tuyển dụng AI, Chatbot
* Tích hợp ERP hoặc máy chấm công vân tay vật lý (chỉ giả lập/nhập API)
* Bảo mật sinh trắc học — Vân tay, khuôn mặt
* Quản lý đào tạo (Training Management)

---

## 5. Stakeholders & User Roles — Các bên liên quan và vai trò người dùng

---

### 5.1. Stakeholders — Các bên liên quan

| Vai trò | Trách nhiệm |
|-------------------|-------------------|
| Sponsor | Đầu tư và bảo trợ dự án |
| Project Manager | Quản lý tiến độ, nguồn lực, rủi ro |
| Business Analyst | Phân tích nghiệp vụ, viết tài liệu yêu cầu |
| Developer | Lập trình Backend & Frontend |
| Tester | Kiểm thử chức năng và phi chức năng |
| End User | Người sử dụng cuối (Admin, HR, Manager, Employee) |

### 5.2. User Roles (Actor) — Vai trò người dùng

| Actor | Cổng | Mô tả |
|-------|------|-------|
| Admin | Internal Portal | Quản trị hệ thống, thiết lập danh mục, phân quyền tài khoản |
| HR & C&B | Internal Portal | Nghiệp vụ tuyển dụng, nhân sự, chấm công, tính lương, BHXH, thuế |
| Manager | Internal Portal | Quản lý phòng ban, duyệt đơn, đánh giá KPI nhân viên cấp dưới |
| Employee | Employee Portal | Self-service: Chấm công, xin nghỉ phép, xem phiếu lương, KPI |
| Candidate | Candidate Portal | Xem tin tuyển dụng, nộp hồ sơ, nhận Offer Letter |

---

## 6. High-Level Business Process — Quy trình nghiệp vụ tổng quan

---

```
┌─────────────────────────────────────────────────────────┐
│                    HỆ THỐNG HRM                          │
│                                                          │
│  Thiết lập ban đầu                                       │
│    Admin → Cấu hình phòng ban, chức vụ, chính sách       │
│                                                          │
│  Vòng đời Nhân sự                                        │
│    Tuyển dụng → Onboarding → Thử việc → Chính thức       │
│      → Điều chuyển → Nghỉ việc                           │
│                                                          │
│  Vận hành (Hàng ngày)                                    │
│    Check-in → Làm việc → Check-out                       │
│    Gửi đơn (OT/Nghỉ phép) → Manager duyệt → Hệ thống ghi │
│                                                          │
│  Đánh giá & Lương (Hàng tháng)                           │
│    Đánh giá KPI → Tổng hợp công → Chạy Payroll Engine    │
│      → Chốt lương → Phát hành Payslip → Báo cáo           │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Functional Overview — Tổng quan chức năng

---

| STT | Module | Mô tả |
|-----|--------|-------|
| 1 | Organization Management | Quản lý sơ đồ tổ chức (Phòng ban, Chức vụ) |
| 2 | User & Role Management | Quản lý tài khoản, RBAC |
| 3 | Recruitment | Tuyển dụng từ Job Req đến Offer |
| 4 | Onboarding | Tiếp nhận nhân sự mới |
| 5 | Employee Management | Quản lý hồ sơ nhân viên, hợp đồng |
| 6 | Attendance | Chấm công, OT, quản lý ca làm việc |
| 7 | Leave Management | Quản lý nghỉ phép và quỹ phép |
| 8 | KPI Management | Giao và đánh giá mục tiêu |
| 9 | Payroll | Động cơ tính lương tự động |
| 10 | Insurance & Tax | Xử lý bảo hiểm và thuế TNCN |
| 11 | Asset & Document | Quản lý tài sản và hồ sơ số hóa |
| 12 | Reporting | Dashboard quản trị |

---

## 8. Assumptions & Constraints — Giả định và ràng buộc

---

### Assumptions — Giả định

* Dữ liệu nhân viên đầu vào đầy đủ (CCCD, ngày sinh, lương cơ bản).
* Ban lãnh đạo cam kết hỗ trợ sử dụng phần mềm.

### Constraints — Ràng buộc

* Hệ thống chỉ chạy trên nền tảng Web.
* Thời gian phát triển giới hạn trong phạm vi Đồ án tốt nghiệp (khoảng 14-15 tuần).
* Hệ thống phải tuân thủ nghiêm ngặt Luật Lao động, chính sách bảo hiểm và thuế hiện hành của Việt Nam.

---

## 9. Risks — Rủi ro dự án

---

| Risk | Impact | Mitigation |
|------|--------|------------|
| Thay đổi yêu cầu nghiệp vụ | Cao | Áp dụng quy trình phát triển linh hoạt, review định kỳ |
| Sai lệch công thức tính lương/thuế | Rất Cao | Test kỹ lưỡng các case tính lương đa dạng trước khi demo |
| Chậm tiến độ lập trình | Cao | Ưu tiên các module Core (HR, Attendance, Payroll) làm trước |
| Bảo mật dữ liệu cá nhân | Cao | Phân quyền RBAC chặt chẽ, sử dụng JWT |

---

## 10. Timeline & 11. Deliverables
*(Giữ nguyên tiến độ theo chuẩn ĐATN như trong bản Đề xuất)*
