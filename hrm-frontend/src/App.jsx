import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PortalSelection } from './pages/PortalSelection';
import { AppLayout } from './layouts/AppLayout';

// Admin & Internal Portal
import { InternalDashboard } from './pages/internal/Dashboard';
import { EmployeeList } from './pages/internal/employees/EmployeeList';
import { EmployeeDetail } from './pages/internal/employees/EmployeeDetail';
import { AttendanceMgmt } from './pages/internal/attendance/Attendance';
import { LeaveMgmt } from './pages/internal/leave/LeaveMgmt';
import { PayrollMgmt } from './pages/internal/payroll/Payroll';
import { RecruitmentATS } from './pages/internal/recruitment/RecruitmentATS';
import { Performance } from './pages/internal/performance/Performance';
import { KPIAssignments } from './pages/internal/performance/KPIAssignments';
import { Departments } from './pages/internal/organization/Departments';
import { Positions } from './pages/internal/organization/Positions';
import { OrgChart } from './pages/internal/organization/OrgChart';
import { OnboardingMgmt } from './pages/internal/onboarding/OnboardingMgmt';
import { PreOnboardingHub } from './pages/internal/onboarding/PreOnboardingHub';

import { Requisitions } from './pages/internal/recruitment/Requisitions';
import { Interviews } from './pages/internal/recruitment/Interviews';
import { Offers } from './pages/internal/recruitment/Offers';

import { Decisions } from './pages/internal/employees/Decisions';
import { DecisionCreate } from './pages/internal/employees/DecisionCreate';
import { DecisionDetail } from './pages/internal/employees/DecisionDetail';
import { Contracts } from './pages/internal/employees/Contracts';
import { ContractDetail } from './pages/internal/employees/ContractDetail';
import { Transfers } from './pages/internal/employees/Transfers';
import { TransferDetail } from './pages/internal/employees/TransferDetail';

import { Shifts } from './pages/internal/attendance/Shifts';
import { Adjustments } from './pages/internal/attendance/Adjustments';

import { LeaveTypes } from './pages/internal/leave/LeaveTypes';
import { LeavePolicies } from './pages/internal/leave/LeavePolicies';
import { Holidays } from './pages/internal/leave/Holidays';

import { PayrollPeriods } from './pages/internal/payroll/PayrollPeriods';
import { AuditLogs } from './pages/internal/system/AuditLogs';
import { SystemParameters } from './pages/internal/system/SystemParameters';

import { ReportsDashboard } from './pages/internal/reports/ReportsDashboard';
import { KPITemplates } from './pages/internal/performance/KPITemplates';
import { AssetInventory } from './pages/internal/assets/AssetInventory';
import { AssetAssignments } from './pages/internal/assets/AssetAssignments';
import { OffboardingChecklist } from './pages/internal/offboarding/OffboardingChecklist';
import { OffboardingInitiate } from './pages/internal/offboarding/OffboardingInitiate';
import { OffboardingHistory } from './pages/internal/offboarding/OffboardingHistory';

import { PlaceholderPage } from './components/PlaceholderPage';

// Employee Portal
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { EmployeeProfile } from './pages/employee/Profile';
import { EmployeeLeave } from './pages/employee/Leave';
import { EmployeePayslip } from './pages/employee/Payslip';
import { EmployeeKPI } from './pages/employee/KPI';
import { EmployeeLogin } from './pages/employee/EmployeeLogin';

// Candidate Portal (Standalone)
import { CandidateLandingPage } from './pages/candidate/LandingPage';
import { CandidateAuthPage } from './pages/candidate/CandidateAuthPage';

import { LayoutDashboard, Users, Clock, CalendarRange, FileText, ShieldCheck, Target, Building, UserPlus, CheckSquare, DollarSign, BarChart2, Laptop, User, UserMinus } from 'lucide-react';

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
      { to: '/internal/onboarding/pre-onboarding', label: 'Tiếp nhận Ứng viên' },
      { to: '/internal/onboarding/checklist', label: 'Tiến độ Checklist' },
    ]
  },
  {
    to: '/internal/employees', label: 'Nhân sự', icon: <Users size={20} />,
    children: [
      { to: '/internal/employees/profiles', label: 'Hồ sơ cá nhân' },
      { to: '/internal/employees/decisions', label: 'Quyết định nhân sự' },
      { to: '/internal/employees/contracts', label: 'Hợp đồng lao động' },
      { to: '/internal/employees/transfers', label: 'Điều chuyển' },
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
      { to: '/internal/performance/reviews', label: 'Chấm điểm' },
    ]
  },
  {
    to: '/internal/payroll', label: 'Lương thưởng', icon: <DollarSign size={20} />,
    children: [
      { to: '/internal/payroll/periods', label: 'Kỳ lương' },
      { to: '/internal/payroll/payslips', label: 'Bảng lương' },
    ]
  },
  {
    to: '/internal/assets', label: 'Tài sản & Thiết bị', icon: <Laptop size={20} />,
    children: [
      { to: '/internal/assets/inventory', label: 'Kho thiết bị' },
      { to: '/internal/assets/assignments', label: 'Bàn giao & Thu hồi' },
    ]
  },
  {
    to: '/internal/offboarding', label: 'Thôi việc & Bàn giao', icon: <UserMinus size={20} />,
    children: [
      { to: '/internal/offboarding/checklist', label: 'Tiến độ Bàn giao (Checklist)' },
      { to: '/internal/offboarding/initiate', label: 'Khởi tạo Thôi việc' },
      { to: '/internal/offboarding/history', label: 'Sổ Lịch sử Thôi việc' },
    ]
  },
  { to: '/internal/reports', label: 'Báo cáo', icon: <BarChart2 size={20} /> },
  {
    to: '/internal/system', label: 'Hệ thống', icon: <ShieldCheck size={20} />,
    children: [
      { to: '/internal/system/parameters', label: 'Tham số nghiệp vụ' },
      { to: '/internal/system/audit', label: 'Nhật ký hệ thống' },
    ]
  }
];

const employeeLinks = [
  { to: '/employee/dashboard', label: 'Tổng quan & Chấm công', icon: <LayoutDashboard size={20} /> },
  { to: '/employee/profile', label: 'Hồ sơ cá nhân', icon: <User size={20} /> },
  { to: '/employee/leave', label: 'Quản lý nghỉ phép', icon: <CalendarRange size={20} /> },
  { to: '/employee/payslip', label: 'Phiếu lương điện tử', icon: <FileText size={20} /> },
  { to: '/employee/kpi', label: 'Mục tiêu & Đánh giá KPI', icon: <Target size={20} /> },
];

const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to={allowedRole === 'EMPLOYEE' ? '/employee/login' : '/admin'} replace />;
  }

  // Nếu tài khoản nhân viên cố vào trang Quản trị Admin, đưa về trang đăng nhập Quản trị Admin
  if (allowedRole === 'ADMIN' && role === 'EMPLOYEE') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* 1. Cổng Tuyển Dụng & Đăng Nhập Ứng Viên */}
          <Route path="/" element={<CandidateLandingPage />} />
          <Route path="/candidate" element={<Navigate to="/" replace />} />
          <Route path="/candidate/login" element={<CandidateAuthPage defaultTab="login" />} />
          <Route path="/candidate/register" element={<CandidateAuthPage defaultTab="register" />} />
          
          {/* 2. Cổng Quản Trị Doanh Nghiệp (Admin Portal) */}
          <Route path="/admin" element={<PortalSelection />} />
          <Route path="/admin/login" element={<PortalSelection />} />
          <Route path="/login" element={<PortalSelection />} />

          {/* 3. Cổng Nhân Sự / Cán Bộ Nhân Viên (Employee Portal - Tách riêng biệt) */}
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/auth/login" element={<EmployeeLogin />} />
          <Route path="/auth" element={<EmployeeLogin />} />
          <Route path="/employee-login" element={<EmployeeLogin />} />
          
          {/* Admin / Internal Portal */}
          <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
            <Route path="/internal" element={<AppLayout portalName="Enterprise Portal" navLinks={internalLinks} />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<InternalDashboard />} />
              
              <Route path="organization/departments" element={<Departments />} />
              <Route path="organization/positions" element={<Positions />} />
              <Route path="organization/chart" element={<OrgChart />} />
              
              <Route path="recruitment/requisitions" element={<Requisitions />} />
              <Route path="recruitment/candidates" element={<RecruitmentATS />} />
              <Route path="recruitment/interviews" element={<Interviews />} />
              <Route path="recruitment/offers" element={<Offers />} />

              <Route path="onboarding" element={<Navigate to="onboarding/checklist" replace />} />
              <Route path="onboarding/pre-onboarding" element={<PreOnboardingHub />} />
              <Route path="onboarding/checklist" element={<OnboardingMgmt />} />
              <Route path="onboarding/newbies" element={<Navigate to="/internal/onboarding/checklist" replace />} />
              <Route path="onboarding/compliance" element={<Navigate to="/internal/onboarding/checklist" replace />} />
              <Route path="onboarding/contracts" element={<Contracts />} />

              <Route path="offboarding" element={<Navigate to="checklist" replace />} />
              <Route path="offboarding/checklist" element={<OffboardingChecklist />} />
              <Route path="offboarding/initiate" element={<OffboardingInitiate />} />
              <Route path="offboarding/history" element={<OffboardingHistory />} />

              <Route path="employees/profiles" element={<EmployeeList />} />
              <Route path="employees/profiles/:id" element={<EmployeeDetail />} />
              <Route path="employees/decisions" element={<Decisions />} />
              <Route path="employees/decisions/create" element={<DecisionCreate />} />
              <Route path="employees/decisions/:id" element={<DecisionDetail />} />
              <Route path="employees/jobs" element={<Navigate to="/internal/employees/decisions" replace />} />
              <Route path="employees/contracts" element={<Contracts />} />
              <Route path="employees/contracts/:id" element={<ContractDetail />} />
              <Route path="employees/transfers" element={<Transfers />} />
              <Route path="employees/transfers/:id" element={<TransferDetail />} />
              <Route path="employees/terminations" element={<Navigate to="/internal/offboarding/checklist" replace />} />

              <Route path="attendance/shifts" element={<Shifts />} />
              <Route path="attendance/records" element={<AttendanceMgmt />} />
              <Route path="attendance/adjustments" element={<Adjustments />} />

              <Route path="leave/requests" element={<LeaveMgmt />} />
              <Route path="leave/types" element={<LeaveTypes />} />
              <Route path="leave/policies" element={<LeavePolicies />} />
              <Route path="leave/holidays" element={<Holidays />} />

              <Route path="performance/templates" element={<KPITemplates />} />
              <Route path="performance/assignments" element={<KPIAssignments />} />
              <Route path="performance/reviews" element={<Performance />} />

              <Route path="payroll" element={<Navigate to="payroll/periods" replace />} />
              <Route path="payroll/periods" element={<PayrollPeriods />} />
              <Route path="payroll/payslips" element={<PayrollMgmt />} />

              <Route path="assets" element={<Navigate to="/internal/assets/inventory" replace />} />
              <Route path="assets/inventory" element={<AssetInventory />} />
              <Route path="assets/assignments" element={<AssetAssignments />} />
              <Route path="reports" element={<ReportsDashboard />} />

              <Route path="system" element={<Navigate to="system/parameters" replace />} />
              <Route path="system/parameters" element={<SystemParameters />} />
              <Route path="system/audit" element={<AuditLogs />} />
              
              <Route path="*" element={<PlaceholderPage title="404" description="Không tìm thấy module này" />} />
            </Route>
          </Route>

          {/* Employee Portal */}
          <Route element={<ProtectedRoute allowedRole="EMPLOYEE" />}>
            <Route path="/employee" element={<AppLayout portalName="EMPLOYEE SELF-SERVICE" navLinks={employeeLinks} />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="leave" element={<EmployeeLeave />} />
              <Route path="payslip" element={<EmployeePayslip />} />
              <Route path="kpi" element={<EmployeeKPI />} />
            </Route>
          </Route>

          {/* Fallback 404 về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
