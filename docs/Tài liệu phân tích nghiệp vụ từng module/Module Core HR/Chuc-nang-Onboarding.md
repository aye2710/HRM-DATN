# Đặc tả chức năng: Quy trình Hội nhập (Onboarding Tasks)

## 1. Giới thiệu chức năng
Quy trình giúp phối hợp giữa các phòng ban (IT, Admin, HR) để chuẩn bị các điều kiện cần thiết (Máy tính, Email, Đồng phục) trước khi nhân viên mới bắt đầu ngày làm việc đầu tiên.

## 2. Các quy tắc nghiệp vụ cốt lõi
- **Auto-Generate:** Các nhiệm vụ (Tasks) được tự động sinh ra dựa trên Role/Position của nhân viên mới thay vì HR phải nhập tay từng cái.
- **Track Progress:** Đảm bảo tất cả các Task phải chuyển sang trạng thái `isCompleted = true` trước ngày Join Date của nhân viên.

## 3. Sơ đồ luồng chi tiết (Sequence Diagrams)

### 3.1. Luồng Tự động sinh Task Onboarding
Được trigger sau khi Ứng viên nhận việc (Auto-provisioning từ Module Tuyển dụng).

```mermaid
sequenceDiagram
    autonumber
    participant ModuleATS as Module Tuyển dụng
    participant BE as Backend API (Core HR)
    participant DB as Cơ sở dữ liệu

    ModuleATS->>BE: Webhook / Internal Call (Ứng viên A vừa Accept Offer)
    
    rect rgb(240, 248, 255)
        note right of BE: Tạo Employee & Onboarding Tasks
        BE->>DB: 1. Tạo Employee (Trạng thái ONBOARDING)
        BE->>DB: 2. Tự động sinh 3 Tasks: <br>- IT: Cấp Email <br>- Admin: Chuẩn bị thẻ từ <br>- HR: Chuẩn bị hợp đồng
        DB-->>BE: OK
    end
```

### 3.2. Luồng IT/Admin cập nhật trạng thái Task
```mermaid
sequenceDiagram
    autonumber
    actor IT as Nhân viên IT
    participant FE as Giao diện (Onboarding.jsx)
    participant BE as Backend API
    participant DB as Cơ sở dữ liệu

    IT->>FE: Xem danh sách Task Onboarding của phòng IT
    IT->>FE: Đánh dấu Task "Cấp Email cho Nhân viên A" -> Hoàn thành
    FE->>BE: PUT /api/onboarding-tasks/:id (isCompleted = true)
    
    BE->>DB: UPDATE OnboardingTask
    DB-->>BE: OK
    BE-->>FE: Cập nhật UI
```
