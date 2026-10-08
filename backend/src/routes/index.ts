import { Router } from 'express';

// 1. Phân hệ Xác thực (Auth)
import authRoutes from './auth/auth.routes';
import candidateAuthRoutes from './auth/candidate-auth.routes';

// 2. Phân hệ Tuyển dụng & Đãi ngộ (Recruitment)
import jobPostingRoutes from './recruitment/job-posting.routes';
import candidateRoutes from './recruitment/candidate.routes';
import interviewRoutes from './recruitment/interview.routes';
import offerRoutes from './recruitment/offer.routes';

// 3. Phân hệ Hồ sơ Nhân sự & Tổ chức (Core HR)
import employeeRoutes from './hr/employee.routes';
import departmentRoutes from './hr/department.routes';
import positionRoutes from './hr/position.routes';
import contractRoutes from './hr/contracts.routes';
import onboardingRoutes from './hr/onboarding.routes';

// 4. Phân hệ Ca kíp, Chấm công & Nghỉ phép (Time & Attendance)
import attendanceRoutes from './attendance/attendance.routes';
import leaveRoutes from './attendance/leave.routes';
import leaveConfigRoutes from './attendance/leave-config.routes';
import holidayRoutes from './attendance/holiday.routes';

// 5. Phân hệ Tiền lương & Đánh giá Hiệu suất (Compensation & Performance)
import payrollRoutes from './payroll-kpi/payroll.routes';
import kpiRoutes from './payroll-kpi/kpi.routes';

// 6. Phân hệ Hành chính, Tài sản & Quyết định (Administrative)
import assetRoutes from './administrative/asset.routes';
import decisionRoutes from './administrative/decision.routes';

// 7. Phân hệ Báo cáo & Cấu hình Hệ thống (System & Analytics)
import settingRoutes from './system/setting.routes';
import reportRoutes from './system/report.routes';
import dashboardRoutes from './system/dashboard.routes';

const apiRouter = Router();

// [Domain 1: Auth]
apiRouter.use('/auth', authRoutes);
apiRouter.use('/candidate-auth', candidateAuthRoutes);

// [Domain 2: Recruitment]
apiRouter.use('/job-postings', jobPostingRoutes);
apiRouter.use('/candidates', candidateRoutes);
apiRouter.use('/interviews', interviewRoutes);
apiRouter.use('/offers', offerRoutes);

// [Domain 3: Core HR]
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/positions', positionRoutes);
apiRouter.use('/contracts', contractRoutes);
apiRouter.use('/onboarding', onboardingRoutes);

// [Domain 4: Time & Attendance]
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leaves', leaveRoutes);
apiRouter.use('/leave-config', leaveConfigRoutes);
apiRouter.use('/holidays', holidayRoutes);

// [Domain 5: Payroll & KPI]
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/kpi', kpiRoutes);

// [Domain 6: Administrative]
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/decisions', decisionRoutes);

// [Domain 7: System & Dashboard]
apiRouter.use('/settings', settingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

export default apiRouter;
