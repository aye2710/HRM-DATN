"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// 1. Phân hệ Xác thực (Auth)
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const candidate_auth_routes_1 = __importDefault(require("./auth/candidate-auth.routes"));
// 2. Phân hệ Tuyển dụng & Đãi ngộ (Recruitment)
const job_posting_routes_1 = __importDefault(require("./recruitment/job-posting.routes"));
const candidate_routes_1 = __importDefault(require("./recruitment/candidate.routes"));
const interview_routes_1 = __importDefault(require("./recruitment/interview.routes"));
const offer_routes_1 = __importDefault(require("./recruitment/offer.routes"));
// 3. Phân hệ Hồ sơ Nhân sự & Tổ chức (Core HR)
const employee_routes_1 = __importDefault(require("./hr/employee.routes"));
const department_routes_1 = __importDefault(require("./hr/department.routes"));
const position_routes_1 = __importDefault(require("./hr/position.routes"));
const contracts_routes_1 = __importDefault(require("./hr/contracts.routes"));
const onboarding_routes_1 = __importDefault(require("./hr/onboarding.routes"));
// 4. Phân hệ Ca kíp, Chấm công & Nghỉ phép (Time & Attendance)
const attendance_routes_1 = __importDefault(require("./attendance/attendance.routes"));
const leave_routes_1 = __importDefault(require("./attendance/leave.routes"));
const leave_config_routes_1 = __importDefault(require("./attendance/leave-config.routes"));
const holiday_routes_1 = __importDefault(require("./attendance/holiday.routes"));
const ot_routes_1 = __importDefault(require("./attendance/ot.routes"));
// 5. Phân hệ Tiền lương & Đánh giá Hiệu suất (Compensation & Performance)
const payroll_routes_1 = __importDefault(require("./payroll-kpi/payroll.routes"));
const kpi_routes_1 = __importDefault(require("./payroll-kpi/kpi.routes"));
// 6. Phân hệ Hành chính, Tài sản & Quyết định (Administrative)
const asset_routes_1 = __importDefault(require("./administrative/asset.routes"));
const decision_routes_1 = __importDefault(require("./administrative/decision.routes"));
// 7. Phân hệ Báo cáo & Cấu hình Hệ thống (System & Analytics)
const setting_routes_1 = __importDefault(require("./system/setting.routes"));
const report_routes_1 = __importDefault(require("./system/report.routes"));
const dashboard_routes_1 = __importDefault(require("./system/dashboard.routes"));
const apiRouter = (0, express_1.Router)();
// [Domain 1: Auth]
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/candidate-auth', candidate_auth_routes_1.default);
// [Domain 2: Recruitment]
apiRouter.use('/job-postings', job_posting_routes_1.default);
apiRouter.use('/candidates', candidate_routes_1.default);
apiRouter.use('/interviews', interview_routes_1.default);
apiRouter.use('/offers', offer_routes_1.default);
// [Domain 3: Core HR]
apiRouter.use('/employees', employee_routes_1.default);
apiRouter.use('/departments', department_routes_1.default);
apiRouter.use('/positions', position_routes_1.default);
apiRouter.use('/contracts', contracts_routes_1.default);
apiRouter.use('/onboarding', onboarding_routes_1.default);
// [Domain 4: Time & Attendance]
apiRouter.use('/attendance', attendance_routes_1.default);
apiRouter.use('/leaves', leave_routes_1.default);
apiRouter.use('/leave-config', leave_config_routes_1.default);
apiRouter.use('/holidays', holiday_routes_1.default);
apiRouter.use('/ot', ot_routes_1.default);
// [Domain 5: Payroll & KPI]
apiRouter.use('/payroll', payroll_routes_1.default);
apiRouter.use('/kpi', kpi_routes_1.default);
// [Domain 6: Administrative]
apiRouter.use('/assets', asset_routes_1.default);
apiRouter.use('/decisions', decision_routes_1.default);
// [Domain 7: System & Dashboard]
apiRouter.use('/settings', setting_routes_1.default);
apiRouter.use('/reports', report_routes_1.default);
apiRouter.use('/dashboard', dashboard_routes_1.default);
exports.default = apiRouter;
