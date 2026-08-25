import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PortalSelection } from './pages/PortalSelection';
import { AppLayout } from './layouts/AppLayout';

// Admin & Internal Portal
import { InternalDashboard } from './pages/internal/Dashboard';
import { EmployeeList } from './pages/internal/EmployeeList';
import { AttendanceMgmt } from './pages/internal/Attendance';
import { LeaveMgmt } from './pages/internal/LeaveMgmt';
import { PayrollMgmt } from './pages/internal/Payroll';
import { RecruitmentATS } from './pages/internal/RecruitmentATS';
import { Performance } from './pages/internal/Performance';
import { SettingsRBAC } from './pages/internal/SettingsRBAC';
import { Departments } from './pages/internal/Departments';
import { Positions } from './pages/internal/Positions';
import { OrgChart } from './pages/internal/OrgChart';
import { OnboardingMgmt } from './pages/internal/OnboardingMgmt';

import { Requisitions } from './pages/internal/Requisitions';
import { Interviews } from './pages/internal/Interviews';
import { Offers } from './pages/internal/Offers';

import { ChecklistMgmt } from './pages/internal/ChecklistMgmt';
import { EquipmentProvision } from './pages/internal/EquipmentProvision';
import { SystemAccounts } from './pages/internal/SystemAccounts';
import { OnboardingProgress } from './pages/internal/OnboardingProgress';

import { EmploymentHistory } from './pages/internal/EmploymentHistory';
import { Contracts } from './pages/internal/Contracts';
import { Transfers } from './pages/internal/Transfers';
import { Terminations } from './pages/internal/Terminations';

import { Shifts } from './pages/internal/Shifts';
import { Adjustments } from './pages/internal/Adjustments';

import { LeaveTypes } from './pages/internal/LeaveTypes';
import { LeavePolicies } from './pages/internal/LeavePolicies';
import { Holidays } from './pages/internal/Holidays';

import { PayrollPeriods } from './pages/internal/PayrollPeriods';

import { ApprovalWorkflows } from './pages/internal/ApprovalWorkflows';
import { Notifications } from './pages/internal/Notifications';
import { AuditLogs } from './pages/internal/AuditLogs';

import { ReportsDashboard } from './pages/internal/ReportsDashboard';
import { KPITemplates } from './pages/internal/KPITemplates';

import { PlaceholderPage } from './components/PlaceholderPage';

// Employee Portal
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { EmployeeLeave } from './pages/employee/Leave';
import { EmployeePayslip } from './pages/employee/Payslip';

// Candidate Portal (Standalone)
import { CandidateLandingPage } from './pages/candidate/LandingPage';

import { LayoutDashboard, Users, Clock, CalendarRange, Briefcase, FileText, Settings, ShieldCheck, Target, Shield, Building, UserPlus, CheckSquare, DollarSign, BarChart2 } from 'lucide-react';

const internalLinks = [
  { to: '/internal/dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
  {
    to: '/internal/organization', label: 'Tổ chức', icon: <Building size={20} />,
    children: [
      { to: '/internal/organization/departments', label: 'Phòng ban' },
      { to: '/internal/organization/positions', label: 'Vị trí' },
      { to: '/internal/organization/chart', label: 'Sơ đồ tổ chức' },
    ]
  },
  {
    to: '/internal/recruitment', label: 'Tuyển dụng', icon: <UserPlus size={20} />,
    children: [
      { to: '/internal/recruitment/requisitions', label: 'Yêu cầu tuyển dụng' },
      { to: '/internal/recruitment/candidates', label: 'Ứng viên' },
      { to: '/internal/recruitment/interviews', label: 'Phỏng vấn' },
      { to: '/internal/recruitment/offers', label: 'Quản lý Offer' },
    ]
  },
  {
    to: '/internal/onboarding', label: 'Hội nhập', icon: <CheckSquare size={20} />,
    children: [
      { to: '/internal/onboarding/newbies', label: 'Nhân viên mới' },
      { to: '/internal/onboarding/checklist', label: 'Checklist' },
      { to: '/internal/onboarding/equipment', label: 'Cấp phát thiết bị' },
      { to: '/internal/onboarding/accounts', label: 'Tài khoản hệ thống' },
      { to: '/internal/onboarding/contracts', label: 'Ký hợp đồng' },
      { to: '/internal/onboarding/progress', label: 'Tiến độ hội nhập' },
    ]
  },
  {
    to: '/internal/employees', label: 'Nhân sự', icon: <Users size={20} />,
    children: [
      { to: '/internal/employees/profiles', label: 'Hồ sơ cá nhân' },
      { to: '/internal/employees/jobs', label: 'Quản lý việc làm' },
      { to: '/internal/employees/contracts', label: 'Hợp đồng lao động' },
      { to: '/internal/employees/transfers', label: 'Điều chuyển' },
      { to: '/internal/employees/terminations', label: 'Nghỉ việc' },
    ]
  },
  {
    to: '/internal/attendance', label: 'Chấm công', icon: <Clock size={20} />,
    children: [
      { to: '/internal/attendance/shifts', label: 'Ca làm việc' },
      { to: '/internal/attendance/records', label: 'Bảng công' },
      { to: '/internal/attendance/adjustments', label: 'Điều chỉnh công' },
    ]
  },
  {
    to: '/internal/leave', label: 'Nghỉ phép', icon: <CalendarRange size={20} />,
    children: [
      { to: '/internal/leave/requests', label: 'Đơn xin nghỉ' },
      { to: '/internal/leave/types', label: 'Loại nghỉ' },
      { to: '/internal/leave/policies', label: 'Chính sách' },
      { to: '/internal/leave/holidays', label: 'Lịch nghỉ lễ' },
    ]
  },
  {
    to: '/internal/performance', label: 'KPI', icon: <Target size={20} />,
    children: [
      { to: '/internal/performance/templates', label: 'Mẫu KPI' },
      { to: '/internal/performance/assignments', label: 'Giao KPI' },
    ]
  },
  {
    to: '/internal/payroll', label: 'Lương thưởng', icon: <DollarSign size={20} />,
    children: [
      { to: '/internal/payroll/periods', label: 'Kỳ lương' },
      { to: '/internal/payroll/payslips', label: 'Bảng lương' },
    ]
  },
  { to: '/internal/reports', label: 'Báo cáo', icon: <BarChart2 size={20} /> },
  {
    to: '/internal/system', label: 'Hệ thống', icon: <ShieldCheck size={20} />,
    children: [
      { to: '/internal/system/workflows', label: 'Trung tâm phê duyệt' },
      { to: '/internal/system/notifications', label: 'Thông báo' },
      { to: '/internal/system/audit', label: 'Nhật ký kiểm toán' },
      { to: '/internal/system/rbac', label: 'Phân quyền (RBAC)' },
    ]
  }
];

const employeeLinks = [
  { to: '/employee/dashboard', label: 'Tổng quan & Chấm công', icon: <LayoutDashboard size={20} /> },
  { to: '/employee/leave', label: 'Xin nghỉ phép', icon: <CalendarRange size={20} /> },
  { to: '/employee/payslip', label: 'Phiếu lương', icon: <FileText size={20} /> },
];

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PortalSelection />} />
        
        {/* Admin / Internal Portal */}
        <Route path="/internal" element={<AppLayout portalName="Enterprise Portal" navLinks={internalLinks} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InternalDashboard />} />
          
          {/* Organization */}
          <Route path="organization/departments" element={<Departments />} />
          <Route path="organization/positions" element={<Positions />} />
          <Route path="organization/chart" element={<OrgChart />} />
          
          {/* Recruitment */}
          <Route path="recruitment/requisitions" element={<Requisitions />} />
          <Route path="recruitment/candidates" element={<RecruitmentATS />} />
          <Route path="recruitment/interviews" element={<Interviews />} />
          <Route path="recruitment/offers" element={<Offers />} />

          {/* Onboarding */}
          <Route path="onboarding/newbies" element={<OnboardingMgmt />} />
          <Route path="onboarding/checklist" element={<ChecklistMgmt />} />
          <Route path="onboarding/equipment" element={<EquipmentProvision />} />
          <Route path="onboarding/accounts" element={<SystemAccounts />} />
          <Route path="onboarding/contracts" element={<Contracts />} /> {/* Reuse Contracts from Employees */}
          <Route path="onboarding/progress" element={<OnboardingProgress />} />

          {/* Employees */}
          <Route path="employees/profiles" element={<EmployeeList />} />
          <Route path="employees/jobs" element={<EmploymentHistory />} />
          <Route path="employees/contracts" element={<Contracts />} />
          <Route path="employees/transfers" element={<Transfers />} />
          <Route path="employees/terminations" element={<Terminations />} />

          {/* Attendance */}
          <Route path="attendance/shifts" element={<Shifts />} />
          <Route path="attendance/records" element={<AttendanceMgmt />} />
          <Route path="attendance/adjustments" element={<Adjustments />} />

          {/* Leave */}
          <Route path="leave/requests" element={<LeaveMgmt />} />
          <Route path="leave/types" element={<LeaveTypes />} />
          <Route path="leave/policies" element={<LeavePolicies />} />
          <Route path="leave/holidays" element={<Holidays />} />

          {/* Performance */}
          <Route path="performance/templates" element={<KPITemplates />} />
          <Route path="performance/assignments" element={<Performance />} />

          {/* Payroll */}
          <Route path="payroll/periods" element={<PayrollPeriods />} />
          <Route path="payroll/payslips" element={<PayrollMgmt />} />

          {/* Reports */}
          <Route path="reports" element={<ReportsDashboard />} />

          {/* System */}
          <Route path="system/workflows" element={<ApprovalWorkflows />} />
          <Route path="system/notifications" element={<Notifications />} />
          <Route path="system/audit" element={<AuditLogs />} />
          <Route path="system/rbac" element={<SettingsRBAC />} />
          
          <Route path="*" element={<PlaceholderPage title="404" description="Không tìm thấy module này" />} />
        </Route>

        {/* Employee Portal */}
        <Route path="/employee" element={<AppLayout portalName="EMPLOYEE SELF-SERVICE" navLinks={employeeLinks} />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="leave" element={<EmployeeLeave />} />
          <Route path="payslip" element={<EmployeePayslip />} />
        </Route>

        {/* Candidate Portal */}
        <Route path="/candidate" element={<CandidateLandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
