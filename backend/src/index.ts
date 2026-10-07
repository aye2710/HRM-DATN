import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db';
import employeeRoutes from './routes/employee.routes';
import departmentRoutes from './routes/department.routes';
import positionRoutes from './routes/position.routes';
import authRoutes from './routes/auth.routes';
import jobPostingRoutes from './routes/job-posting.routes';
import candidateRoutes from './routes/candidate.routes';
import interviewRoutes from './routes/interview.routes';
import offerRoutes from './routes/offer.routes';
import onboardingRoutes from './routes/onboarding.routes';
import contractRoutes from './routes/contracts.routes';
import leaveRoutes from './routes/leave.routes';
import attendanceRoutes from './routes/attendance.routes';
import payrollRoutes from './routes/payroll.routes';
import kpiRoutes from './routes/kpi.routes';
import holidayRoutes from './routes/holiday.routes';
import decisionRoutes from './routes/decision.routes';
import reportRoutes from './routes/report.routes';
import assetRoutes from './routes/asset.routes';
import settingRoutes from './routes/setting.routes';
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/job-postings', jobPostingRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/leave-config', require('./routes/leave-config.routes').default);

// Dashboard Stats API
app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const totalEmployees = await prisma.employee.count();
    const pendingLeaves = await prisma.leaveRequest.count({
      where: { status: 'PENDING' }
    });
    
    // Simulate payroll fund: Each employee 10M
    const estimatedPayroll = (totalEmployees * 10) + 'M';
    
    res.status(200).json({
      totalEmployees,
      pendingLeaves,
      estimatedPayroll
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] LLA Enterprise HRM Backend is listening on port ${PORT}`);
});
