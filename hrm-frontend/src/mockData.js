export const employees = [
  { id: 'EMP-001', name: 'Nguyễn Văn A', position: 'Senior Software Engineer', department: 'Delivery', status: 'Active', joinDate: '2023-01-15', avatar: 'A' },
  { id: 'EMP-002', name: 'Trần Thị B', position: 'HR Manager', department: 'Human Resources', status: 'Active', joinDate: '2022-05-10', avatar: 'B' },
  { id: 'EMP-003', name: 'Lê Văn C', position: 'QA Engineer', department: 'Delivery', status: 'Probation', joinDate: '2026-07-20', avatar: 'C' },
  { id: 'EMP-004', name: 'Phạm Thị D', position: 'DevOps Engineer', department: 'Infra', status: 'Maternity Leave', joinDate: '2021-11-01', avatar: 'D' },
  { id: 'EMP-005', name: 'Hoàng Văn E', position: 'Business Analyst', department: 'Delivery', status: 'Active', joinDate: '2024-02-15', avatar: 'E' },
];

export const leaveRequests = [
  { id: 'LR-101', empName: 'Phạm Thị D', type: 'Maternity Leave', startDate: '2026-08-01', endDate: '2027-02-01', status: 'Approved', reason: 'Nghỉ thai sản 6 tháng', days: 180 },
  { id: 'LR-102', empName: 'Nguyễn Văn A', type: 'Annual Leave', startDate: '2026-08-25', endDate: '2026-08-26', status: 'Pending', reason: 'Về quê', days: 2 },
  { id: 'LR-103', empName: 'Lê Văn C', type: 'Unpaid Leave', startDate: '2026-09-01', endDate: '2026-09-02', status: 'Rejected', reason: 'Nghỉ cá nhân', days: 2 },
];

export const jobPostings = [
  { id: 'JOB-001', title: 'Senior React Developer', department: 'Delivery', location: 'Hà Nội', type: 'Full-time', postedAt: '2026-08-10', salary: 'Up to $2000', headcount: '2/5' },
  { id: 'JOB-002', title: 'QA Automation Engineer', department: 'Delivery', location: 'Hà Nội', type: 'Full-time', postedAt: '2026-08-15', salary: 'Up to $1500', headcount: '0/2' },
  { id: 'JOB-003', title: 'HR Manager', department: 'Human Resources', location: 'Đà Nẵng', type: 'Full-time', postedAt: '2026-08-18', salary: '$1200 - $1800', headcount: '0/1' },
  { id: 'JOB-004', title: 'Golang Backend Developer', department: 'Delivery', location: 'Hồ Chí Minh', type: 'Full-time', postedAt: '2026-08-20', salary: 'Up to $2500', headcount: '1/3' },
  { id: 'JOB-005', title: 'System Administrator (DevOps)', department: 'Infra', location: 'Hà Nội', type: 'Full-time', postedAt: '2026-08-21', salary: 'Up to $2200', headcount: '0/2' },
];

export const attendanceToday = {
  checkIn: '08:40',
  checkOut: null,
  status: 'On Time (Grace Period)',
  shift: '08:30 - 17:30',
  isLate: false
};

export const payrollData = {
  month: '07/2026',
  baseSalary: 25000000,
  allowance: 2000000,
  kpiBonus: 1500000,
  gross: 28500000,
  insurance: 2992500, // ~10.5%
  tax: 1500000,
  net: 24007500
};

// Theo luật mới: Đi muộn 16-30p trừ 0.5 công. Grace period 15p (8:30->8:45)
export const attendanceList = [
  { empId: 'EMP-001', name: 'Nguyễn Văn A', date: '2026-08-17', checkIn: '08:40', checkOut: '17:35', status: 'Đúng giờ (Ân hạn)', deduction: 0, shift: 'Hành chính' },
  { empId: 'EMP-002', name: 'Trần Thị B', date: '2026-08-17', checkIn: '08:48', checkOut: '17:30', status: 'Đi muộn', deduction: 0.5, shift: 'Hành chính' },
  { empId: 'EMP-003', name: 'Lê Văn C', date: '2026-08-17', checkIn: '09:05', checkOut: '17:30', status: 'Đi muộn', deduction: 1.0, shift: 'Hành chính' },
  { empId: 'EMP-005', name: 'Hoàng Văn E', date: '2026-08-17', checkIn: '22:00', checkOut: '06:00', status: 'Ca Đêm', deduction: 0, shift: 'Ca Đêm (Phụ cấp 30%)' },
];

export const candidates = [
  { id: 'CD-001', name: 'Phạm Tuấn Anh', appliedFor: 'Senior React Developer', appliedAt: '2026-08-20', status: 'Interviewing', experience: '4 years', matchScore: 92 },
  { id: 'CD-002', name: 'Nguyễn Thị Mai', appliedFor: 'QA Automation Engineer', appliedAt: '2026-08-21', status: 'Screening', experience: '2 years', matchScore: 78 },
  { id: 'CD-003', name: 'Lê Hoàng Phong', appliedFor: 'Golang Backend Developer', appliedAt: '2026-08-19', status: 'Offered', experience: '5 years', matchScore: 95 },
  { id: 'CD-004', name: 'Trần Đức Đạt', appliedFor: 'Senior React Developer', appliedAt: '2026-08-22', status: 'Screening', experience: '3 years', matchScore: 85 },
];

export const kpiEvaluations = [
  { empId: 'EMP-001', name: 'Nguyễn Văn A', department: 'Delivery', quarter: 'Q2/2026', selfScore: 95, managerScore: 92, finalGrade: 'A', note: 'Top performer' },
  { empId: 'EMP-002', name: 'Trần Thị B', department: 'Human Resources', quarter: 'Q2/2026', selfScore: 85, managerScore: 82, finalGrade: 'B', note: 'Hoàn thành tốt' },
  { empId: 'EMP-003', name: 'Lê Văn C', department: 'Delivery', quarter: 'Q2/2026', selfScore: 70, managerScore: 65, finalGrade: 'C', note: 'Cần cải thiện chất lượng code' },
  { empId: 'EMP-005', name: 'Hoàng Văn E', department: 'Delivery', quarter: 'Q2/2026', selfScore: 88, managerScore: 85, finalGrade: 'B', note: 'Kỹ năng phân tích tốt' },
];

export const systemRoles = [
  { id: 'ROLE_ADMIN', name: 'Super Admin', description: 'Toàn quyền kiểm soát hệ thống (System Configuration, Access Management, Data Override)', usersCount: 2, status: 'Active' },
  { id: 'ROLE_HR', name: 'HR Manager', description: 'Quản lý toàn bộ vòng đời nhân sự (Tuyển dụng, Hồ sơ, Chấm công, Tiền lương)', usersCount: 3, status: 'Active' },
  { id: 'ROLE_MANAGER', name: 'Department Manager', description: 'Phê duyệt nghỉ phép, đánh giá KPI nhân sự trong phòng ban', usersCount: 8, status: 'Active' },
  { id: 'ROLE_EMPLOYEE', name: 'Employee', description: 'Truy cập cổng Employee (Self-Service), xem phiếu lương, xin nghỉ', usersCount: 150, status: 'Active' },
];

// Công thức Gross to Net: Net = Gross - BHXH (10.5%) - Thuế TNCN - Phạt
export const payrollList = [
  { 
    empId: 'EMP-001', name: 'Nguyễn Văn A', department: 'Delivery', 
    baseSalary: 30000000, allowance: 2000000, bonus: 1500000, 
    gross: 33500000, 
    insurance: 3150000, // 10.5% của 30tr
    tax: 2200000,       // Giả lập biểu thuế lũy tiến
    penalty: 0,
    net: 28150000, 
    status: 'Locked' 
  },
  { 
    empId: 'EMP-002', name: 'Trần Thị B', department: 'Human Resources', 
    baseSalary: 28000000, allowance: 1000000, bonus: 0,
    gross: 29000000, 
    insurance: 2940000, 
    tax: 1500000, 
    penalty: 500000,    // Trừ 1 công đi muộn
    net: 24060000, 
    status: 'Draft' 
  },
  { 
    empId: 'EMP-003', name: 'Lê Văn C', department: 'Delivery', 
    baseSalary: 15000000, allowance: 1000000, bonus: 0,
    gross: 16000000, 
    insurance: 0,       // Thử việc không đóng BHXH
    tax: 1600000,       // Thử việc trừ phẳng 10%
    penalty: 0,
    net: 14400000, 
    status: 'Draft',
    isProbation: true
  },
];
