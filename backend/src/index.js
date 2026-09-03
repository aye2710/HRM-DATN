"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const position_routes_1 = __importDefault(require("./routes/position.routes"));
const job_posting_routes_1 = __importDefault(require("./routes/job-posting.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
const interview_routes_1 = __importDefault(require("./routes/interview.routes"));
const offer_routes_1 = __importDefault(require("./routes/offer.routes"));
const onboarding_routes_1 = __importDefault(require("./routes/onboarding.routes"));
const contracts_routes_1 = __importDefault(require("./routes/contracts.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use('/api/employees', employee_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/positions', position_routes_1.default);
app.use('/api/job-postings', job_posting_routes_1.default);
app.use('/api/candidates', candidate_routes_1.default);
app.use('/api/interviews', interview_routes_1.default);
app.use('/api/offers', offer_routes_1.default);
app.use('/api/onboarding', onboarding_routes_1.default);
app.use('/api/contracts', contracts_routes_1.default);
// Dashboard Stats API
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const totalEmployees = await db_1.prisma.employee.count();
        const pendingLeaves = await db_1.prisma.leaveRequest.count({
            where: { status: 'PENDING' }
        });
        // Simulate payroll fund: Each employee 10M
        const estimatedPayroll = (totalEmployees * 10) + 'M';
        res.status(200).json({
            totalEmployees,
            pendingLeaves,
            estimatedPayroll
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Start Server
app.listen(PORT, () => {
    console.log(`[SERVER] LLA Enterprise HRM Backend is listening on port ${PORT}`);
});
