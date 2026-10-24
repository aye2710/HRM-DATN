"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePIT = void 0;
const express_1 = require("express");
const db_1 = require("../../db");
const setting_routes_1 = require("../system/setting.routes");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_1 = require("../../utils/audit");
const router = (0, express_1.Router)();
const hrOrAccountant = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'ACCOUNTANT');
const hrManagerOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');
/**
 * Biểu thuế lũy tiến từng phần 7 bậc theo Luật Thuế Thu Nhập Cá Nhân Việt Nam hiện hành
 */
const calculatePIT = (taxableIncome) => {
    if (taxableIncome <= 0)
        return 0;
    if (taxableIncome <= 5000000) {
        return taxableIncome * 0.05;
    }
    else if (taxableIncome <= 10000000) {
        return taxableIncome * 0.10 - 250000;
    }
    else if (taxableIncome <= 18000000) {
        return taxableIncome * 0.15 - 750000;
    }
    else if (taxableIncome <= 32000000) {
        return taxableIncome * 0.20 - 1650000;
    }
    else if (taxableIncome <= 52000000) {
        return taxableIncome * 0.25 - 3250000;
    }
    else if (taxableIncome <= 80000000) {
        return taxableIncome * 0.30 - 5850000;
    }
    else {
        return taxableIncome * 0.35 - 9850000;
    }
};
exports.calculatePIT = calculatePIT;
// 1. GET: Danh sách tất cả các Kỳ lương (Payroll Periods)
router.get('/periods', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const periods = await db_1.prisma.payrollPeriod.findMany({
            include: {
                _count: { select: { payslips: true } },
                payslips: {
                    select: { baseSalary: true, grossSalary: true, netSalary: true, insuranceDeduction: true, taxDeduction: true }
                }
            },
            orderBy: { monthYear: 'desc' }
        });
        const formatted = periods.map(p => {
            const totalBase = p.payslips.reduce((sum, item) => sum + Number(item.baseSalary || 0), 0);
            const totalGross = p.payslips.reduce((sum, item) => sum + Number(item.grossSalary || 0), 0);
            const totalNet = p.payslips.reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
            const [m, y] = p.monthYear.split('-');
            return {
                id: p.id,
                monthYear: p.monthYear,
                month: Number(m),
                year: Number(y),
                name: `Kỳ lương Tháng ${m}/${y}`,
                standardWorkingDays: p.standardWorkingDays,
                employees: p._count.payslips,
                totalBase,
                totalGross,
                totalNet,
                status: p.status
            };
        });
        return res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching payroll periods:', error);
        return res.status(500).json({ error: 'Lỗi khi lấy danh sách kỳ lương' });
    }
});
// 2. POST: Khởi tạo Kỳ lương mới (HR / Kế toán)
router.post('/periods', auth_middleware_1.authenticateToken, hrOrAccountant, async (req, res) => {
    try {
        const { month, year, standardWorkingDays } = req.body;
        if (!month || !year)
            return res.status(400).json({ error: 'Vui lòng chọn Tháng và Năm cho kỳ lương' });
        const monthYear = `${month}-${year}`;
        const existing = await db_1.prisma.payrollPeriod.findUnique({ where: { monthYear } });
        if (existing) {
            return res.status(400).json({ error: `Kỳ lương tháng ${month}/${year} đã tồn tại trong hệ thống!` });
        }
        const defaultStandardDays = await (0, setting_routes_1.getSettingValue)('STANDARD_WORKING_DAYS', 22);
        const newPeriod = await db_1.prisma.payrollPeriod.create({
            data: {
                monthYear,
                standardWorkingDays: standardWorkingDays ? parseInt(standardWorkingDays) : Number(defaultStandardDays),
                status: 'DRAFT'
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'CREATE_PAYROLL_PERIOD',
            tableName: 'PayrollPeriod',
            recordId: newPeriod.id,
            accountId: req.user?.accountId,
            details: `Khởi tạo kỳ lương mới: ${monthYear} (${newPeriod.standardWorkingDays} ngày công chuẩn)`
        });
        return res.status(201).json(newPeriod);
    }
    catch (error) {
        console.error('Error creating payroll period:', error);
        return res.status(500).json({ error: 'Lỗi khi tạo kỳ lương' });
    }
});
// 3. DELETE: Xóa Kỳ lương (chỉ khi đang ở trạng thái DRAFT - HR Manager Only)
router.delete('/periods/:id', auth_middleware_1.authenticateToken, hrManagerOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const period = await db_1.prisma.payrollPeriod.findUnique({ where: { id } });
        if (!period)
            return res.status(404).json({ error: 'Không tìm thấy kỳ lương' });
        if (period.status === 'LOCKED') {
            return res.status(400).json({ error: 'Kỳ lương đã khóa sổ, không thể xóa!' });
        }
        // Xóa chi tiết và phiếu lương trong transaction
        await db_1.prisma.$transaction(async (tx) => {
            const payslips = await tx.payslip.findMany({ where: { payrollPeriodId: id }, select: { id: true } });
            const payslipIds = payslips.map(p => p.id);
            if (payslipIds.length > 0) {
                await tx.payslipDetail.deleteMany({ where: { payslipId: { in: payslipIds } } });
            }
            await tx.payslip.deleteMany({ where: { payrollPeriodId: id } });
            await tx.payrollPeriod.delete({ where: { id } });
        });
        await (0, audit_1.createAuditLog)({
            action: 'DELETE_PAYROLL_PERIOD',
            tableName: 'PayrollPeriod',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Đã xóa kỳ lương nháp: ${period.monthYear}`
        });
        return res.json({ message: 'Xóa kỳ lương thành công' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi xóa kỳ lương' });
    }
});
// 4. GET: Lấy danh sách phiếu lương (Bảo mật thu nhập: Nhân viên chỉ xem lương của chính mình)
router.get('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        const userRole = req.user?.role?.toUpperCase();
        let whereClause = {};
        if (month && year) {
            whereClause.payrollPeriod = {
                monthYear: `${month}-${year}`
            };
        }
        // Chặn rò rỉ thu nhập PII: Nhân viên chỉ được xem phiếu lương của chính mình
        if (userRole === 'EMPLOYEE') {
            whereClause.employeeId = req.user.employeeId;
        }
        const records = await db_1.prisma.payslip.findMany({
            where: whereClause,
            include: {
                employee: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                        status: true,
                        joinDate: true,
                        department: true,
                        position: true,
                        onboardingTasks: true
                    }
                },
                payrollPeriod: true,
                details: true
            },
            orderBy: { employee: { code: 'asc' } }
        });
        // Bổ sung Logic Chế tài SOP-25: Khóa chi trả lương do trễ nộp hồ sơ gốc cứng > 7 ngày
        const formattedRecords = records.map(p => {
            const holdDetail = p.details.find(d => d.type === 'PAYMENT_HOLD');
            const unlockDetail = p.details.find(d => d.type === 'PAYMENT_UNLOCKED');
            let isPaymentLocked = false;
            let paymentLockReason = '';
            if (unlockDetail) {
                isPaymentLocked = false;
                paymentLockReason = unlockDetail.description || 'Đã mở khóa chi trả thủ công';
            }
            else if (holdDetail) {
                isPaymentLocked = true;
                paymentLockReason = holdDetail.description || 'Tạm khóa chi trả theo chỉ đạo Kế toán / HR';
            }
            else {
                const joinDate = p.employee?.joinDate ? new Date(p.employee.joinDate) : null;
                if (joinDate) {
                    const diffDays = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
                    const hasIncompleteDocTasks = p.employee?.onboardingTasks?.some(t => (t.category === 'CONTRACT' || t.taskName?.toLowerCase().includes('hồ sơ') || t.taskName?.toLowerCase().includes('giấy tờ') || t.taskName?.toLowerCase().includes('cccd')) && !t.isCompleted);
                    const isStillOnboarding = p.employee?.status === 'ONBOARDING';
                    if (diffDays > 7 && (hasIncompleteDocTasks || isStillOnboarding)) {
                        isPaymentLocked = true;
                        paymentLockReason = `Chậm nộp hồ sơ gốc quá ${diffDays} ngày (SOP-25: Vượt hạn định 7 ngày)`;
                    }
                }
            }
            return {
                ...p,
                isPaymentLocked,
                paymentLockReason
            };
        });
        return res.json(formattedRecords);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu bảng lương' });
    }
});
// 4b. POST: Khóa / Mở khóa chi trả lương từng nhân sự (SOP-25 - HR & Kế toán)
router.post('/payslip/:id/toggle-payment-hold', auth_middleware_1.authenticateToken, hrOrAccountant, async (req, res) => {
    try {
        const { id } = req.params;
        const { lock, reason } = req.body; // lock: boolean
        const payslip = await db_1.prisma.payslip.findUnique({
            where: { id },
            include: { employee: true, details: true }
        });
        if (!payslip) {
            return res.status(404).json({ error: 'Không tìm thấy phiếu lương' });
        }
        await db_1.prisma.$transaction(async (tx) => {
            // Xóa các trạng thái hold/unlocked cũ
            await tx.payslipDetail.deleteMany({
                where: {
                    payslipId: id,
                    type: { in: ['PAYMENT_HOLD', 'PAYMENT_UNLOCKED'] }
                }
            });
            if (lock) {
                await tx.payslipDetail.create({
                    data: {
                        payslipId: id,
                        type: 'PAYMENT_HOLD',
                        amount: 0,
                        description: reason || 'Tạm khóa chi trả theo quy định SOP-25 (Chậm nộp hồ sơ gốc > 7 ngày)'
                    }
                });
            }
            else {
                await tx.payslipDetail.create({
                    data: {
                        payslipId: id,
                        type: 'PAYMENT_UNLOCKED',
                        amount: 0,
                        description: reason || 'HR đã xác nhận thu đủ hồ sơ gốc bản cứng. Mở khóa thanh toán.'
                    }
                });
            }
        });
        await (0, audit_1.createAuditLog)({
            action: lock ? 'LOCK_PAYSLIP_PAYMENT' : 'UNLOCK_PAYSLIP_PAYMENT',
            tableName: 'Payslip',
            recordId: id,
            accountId: req.user?.accountId,
            details: JSON.stringify({ lock, reason })
        });
        return res.json({
            message: lock ? 'Đã tạm khóa chi trả phiếu lương (SOP-25)' : 'Đã mở khóa chi trả phiếu lương thành công!',
            isPaymentLocked: lock
        });
    }
    catch (error) {
        console.error('Error in toggle-payment-hold:', error);
        return res.status(500).json({ error: error.message || 'Lỗi khi cập nhật trạng thái chi trả' });
    }
});
// 5. GET: Lấy danh sách phiếu lương của 1 nhân viên (Cổng ESS - Chặn IDOR)
router.get('/employee/:employeeId', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        const userRole = req.user?.role?.toUpperCase();
        if (userRole === 'EMPLOYEE' && req.user?.employeeId !== employeeId) {
            return res.status(403).json({ error: 'Bạn không có quyền xem phiếu lương của nhân viên khác.' });
        }
        const records = await db_1.prisma.payslip.findMany({
            where: { employeeId },
            include: {
                employee: {
                    select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
                },
                payrollPeriod: true,
                details: true
            },
            orderBy: { payrollPeriod: { monthYear: 'desc' } }
        });
        return res.json(records);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy phiếu lương cá nhân' });
    }
});
// 5b. GET: Chi tiết 1 phiếu lương theo ID (Chặn IDOR)
router.get('/payslip/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const userRole = req.user?.role?.toUpperCase();
        const payslip = await db_1.prisma.payslip.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        department: true,
                        position: true,
                        relatives: { where: { isDependent: true } }
                    }
                },
                payrollPeriod: true,
                details: true
            }
        });
        if (!payslip)
            return res.status(404).json({ error: 'Không tìm thấy phiếu lương' });
        if (userRole === 'EMPLOYEE' && payslip.employeeId !== req.user?.employeeId) {
            return res.status(403).json({ error: 'Bạn không có quyền xem chi tiết phiếu lương này.' });
        }
        return res.json(payslip);
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy chi tiết phiếu lương' });
    }
});
// 6. POST: Động cơ chạy bảng lương (Enterprise Payroll Engine)
// Tuân thủ 100% Luật BHXH, Luật Thuế TNCN (7 bậc) và Luật Lao Động 2019 (Điều 98 OT, Điều 107)
router.post('/generate', auth_middleware_1.authenticateToken, hrOrAccountant, async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year)
            return res.status(400).json({ error: 'Thiếu thông tin tháng hoặc năm' });
        const monthYearStr = `${month}-${year}`;
        // Lấy hoặc tạo PayrollPeriod
        let period = await db_1.prisma.payrollPeriod.findUnique({
            where: { monthYear: monthYearStr }
        });
        // BR-PAY-01-01: Chặn Re-run sau khi Khóa sổ (Strict Lockout Rule)
        if (period && period.status === 'LOCKED') {
            return res.status(400).json({
                error: `Kỳ lương tháng ${month}/${year} đã được Giám đốc phê duyệt và KHÓA SỔ (LOCKED). Tuyệt đối không thể tính toán lại!`
            });
        }
        // Lấy các tham số nghiệp vụ động từ Database (SystemSetting)
        const dynamicStandardDays = await (0, setting_routes_1.getSettingValue)('STANDARD_WORKING_DAYS', 22);
        const insuranceRatePercent = await (0, setting_routes_1.getSettingValue)('INSURANCE_RATE', 10.5);
        const personalDeduction = await (0, setting_routes_1.getSettingValue)('PERSONAL_DEDUCTION', 11000000);
        const dependentDeductionRate = await (0, setting_routes_1.getSettingValue)('DEPENDENT_DEDUCTION', 4400000);
        const maxInsuranceSalary = await (0, setting_routes_1.getSettingValue)('MAX_INSURANCE_SALARY', 46800000);
        if (!period) {
            period = await db_1.prisma.payrollPeriod.create({
                data: {
                    monthYear: monthYearStr,
                    standardWorkingDays: Number(dynamicStandardDays) || 22,
                    status: 'DRAFT'
                }
            });
        }
        const standardDays = period.standardWorkingDays || Number(dynamicStandardDays) || 22;
        // BR-PAY-01-02: Loại trừ nhân sự thôi việc và chỉ tính lương cho nhân viên có Hợp đồng ACTIVE
        const employees = await db_1.prisma.employee.findMany({
            where: {
                status: { not: 'RESIGNED' },
                contracts: { some: { status: 'ACTIVE' } }
            },
            include: {
                contracts: { where: { status: 'ACTIVE' }, orderBy: { startDate: 'desc' } },
                relatives: { where: { isDependent: true } }
            }
        });
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        // Lấy danh sách ngày lễ trong tháng để tính hệ số OT chuẩn xác theo Điều 98 BLLĐ 2019
        const holidays = await db_1.prisma.holiday.findMany({
            where: { date: { gte: startDate, lte: endDate } }
        });
        const holidayDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));
        let generatedCount = 0;
        for (const emp of employees) {
            const activeContract = emp.contracts[0];
            if (!activeContract)
                continue;
            // 1. Mức lương cơ bản theo hợp đồng lao động
            const baseSalary = Number(activeContract.baseSalary);
            // 2. Chấm công thực tế trong tháng (từ Module Chấm công)
            const attendances = await db_1.prisma.attendance.findMany({
                where: {
                    employeeId: emp.id,
                    date: { gte: startDate, lte: endDate }
                }
            });
            // Tổng ngày công thực tế (làm việc + nghỉ phép có lương PAID)
            const totalWorkingDays = attendances.reduce((sum, att) => sum + Number(att.workingDay || 0), 0);
            // Lương theo ngày công làm việc thực tế
            const baseEarned = (baseSalary / standardDays) * totalWorkingDays;
            // 3. Tính tiền làm thêm giờ (Overtime - Tuân thủ Điều 98 BLLĐ 2019: Ngày thường x1.5, Nghỉ tuần x2.0, Lễ x3.0)
            const approvedOT = await db_1.prisma.oTRequest.findMany({
                where: {
                    employeeId: emp.id,
                    date: { gte: startDate, lte: endDate },
                    status: 'APPROVED'
                }
            });
            const hourlyRate = baseSalary / standardDays / 8;
            let otPay = 0;
            let taxExemptOT = 0;
            let totalOTHours = 0;
            for (const ot of approvedOT) {
                const hours = Number(ot.actualHours || ot.requestHours || 0);
                if (hours <= 0)
                    continue;
                totalOTHours += hours;
                const otDate = new Date(ot.date);
                const dateStr = otDate.toISOString().split('T')[0];
                const dayOfWeek = otDate.getDay();
                let multiplier = 1.5; // Ngày làm việc bình thường (150%)
                if (holidayDates.has(dateStr)) {
                    multiplier = 3.0; // Ngày nghỉ Lễ/Tết (300% theo Điều 98 BLLĐ 2019)
                }
                else if (dayOfWeek === 0 || dayOfWeek === 6) {
                    multiplier = 2.0; // Ngày nghỉ hàng tuần Thứ 7 / Chủ Nhật (200%)
                }
                const payForThisOT = hours * hourlyRate * multiplier;
                otPay += payForThisOT;
                // Theo Luật Thuế TNCN: phần lương làm thêm giờ trả cao hơn tiền lương làm việc bình thường được miễn thuế
                taxExemptOT += hours * hourlyRate * (multiplier - 1.0);
            }
            // Tổng thu nhập trước thuế (Gross)
            const grossSalary = baseEarned + otPay;
            // 4. Trích đóng BHXH, BHYT, BHTN (Tỷ lệ 10.5% theo Luật BHXH hiện hành)
            // Thực tập sinh và Thử việc không trích nộp bảo hiểm bắt buộc (AF-01)
            let insuranceDeduction = 0;
            const isOfficialContract = activeContract.contractType === 'OFFICIAL_1Y' || activeContract.contractType === 'INDEFINITE';
            if (isOfficialContract) {
                const salaryForInsurance = Math.min(baseSalary, Number(maxInsuranceSalary) || 46800000);
                insuranceDeduction = salaryForInsurance * ((Number(insuranceRatePercent) || 10.5) / 100);
            }
            // 5. Giảm trừ gia cảnh: Bản thân (11tr) + Người phụ thuộc (4.4tr/người)
            const numDependents = emp.relatives.length;
            const dependentDeductionTotal = numDependents * (Number(dependentDeductionRate) || 4400000);
            const totalRelief = Number(personalDeduction || 11000000) + dependentDeductionTotal;
            // 6. Thu nhập tính thuế TNCN (Taxable Income)
            const taxableIncome = Math.max(0, (grossSalary - taxExemptOT) - insuranceDeduction - totalRelief);
            // 7. Tính thuế TNCN theo biểu thuế lũy tiến từng phần 7 bậc (BR-PAY-01-04)
            const taxDeduction = (0, exports.calculatePIT)(taxableIncome);
            // 8. Lương thực nhận (Net Salary)
            const netSalary = Math.round(grossSalary - insuranceDeduction - taxDeduction);
            // 9. Lưu bản ghi Payslip và PayslipDetails trong Transaction
            await db_1.prisma.$transaction(async (tx) => {
                const existing = await tx.payslip.findFirst({
                    where: { employeeId: emp.id, payrollPeriodId: period.id }
                });
                let payslipRecord;
                if (existing) {
                    await tx.payslipDetail.deleteMany({ where: { payslipId: existing.id } });
                    payslipRecord = await tx.payslip.update({
                        where: { id: existing.id },
                        data: {
                            baseSalary,
                            actualWorkingDays: totalWorkingDays,
                            grossSalary: Math.round(grossSalary),
                            insuranceDeduction: Math.round(insuranceDeduction),
                            taxDeduction: Math.round(taxDeduction),
                            netSalary
                        }
                    });
                }
                else {
                    payslipRecord = await tx.payslip.create({
                        data: {
                            employeeId: emp.id,
                            payrollPeriodId: period.id,
                            baseSalary,
                            actualWorkingDays: totalWorkingDays,
                            grossSalary: Math.round(grossSalary),
                            insuranceDeduction: Math.round(insuranceDeduction),
                            taxDeduction: Math.round(taxDeduction),
                            netSalary
                        }
                    });
                }
                // Tạo các dòng PayslipDetail để nhân viên xem minh bạch từng khoản
                const detailsToCreate = [
                    { type: 'EARNING', amount: Math.round(baseEarned), description: `Lương theo công thực tế (${totalWorkingDays.toFixed(1)} / ${standardDays} ngày)` },
                    ...(totalOTHours > 0 ? [{ type: 'EARNING', amount: Math.round(otPay), description: `Làm thêm giờ (${totalOTHours.toFixed(1)} giờ OT theo Điều 98 BLLĐ)` }] : []),
                    ...(insuranceDeduction > 0 ? [{ type: 'DEDUCTION', amount: Math.round(insuranceDeduction), description: `Bảo hiểm bắt buộc 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%)` }] : []),
                    { type: 'DEDUCTION', amount: Math.round(taxDeduction), description: `Thuế TNCN lũy tiến (${numDependents} người phụ thuộc)` }
                ];
                for (const d of detailsToCreate) {
                    await tx.payslipDetail.create({
                        data: {
                            payslipId: payslipRecord.id,
                            type: d.type,
                            amount: d.amount,
                            description: d.description
                        }
                    });
                }
            });
            generatedCount++;
        }
        await (0, audit_1.createAuditLog)({
            action: 'GENERATE_PAYROLL',
            tableName: 'PayrollPeriod',
            recordId: period.id,
            accountId: req.user?.accountId,
            details: `Chạy động cơ tính lương Tháng ${month}/${year} cho ${generatedCount} nhân sự theo luật lao động & thuế.`
        });
        return res.json({
            message: `Đã tính toán xong bảng lương tháng ${month}/${year} cho ${generatedCount} nhân sự theo luật thuế và BHXH hiện hành!`,
            period,
            generatedCount
        });
    }
    catch (error) {
        console.error('Error generating payroll:', error);
        return res.status(500).json({ error: error.message || 'Lỗi server khi tính lương' });
    }
});
// 7. GET: Lấy thông tin trạng thái kỳ lương
router.get('/period/info', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year)
            return res.status(400).json({ error: 'Thiếu tháng hoặc năm' });
        const monthYearStr = `${month}-${year}`;
        const period = await db_1.prisma.payrollPeriod.findUnique({
            where: { monthYear: monthYearStr }
        });
        return res.json(period || { monthYear: monthYearStr, status: 'DRAFT', standardWorkingDays: 22 });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi lấy thông tin kỳ lương' });
    }
});
// 8. POST: Khóa hoặc mở khóa kỳ lương (HR Manager / CEO Only)
router.post('/period/toggle-lock', auth_middleware_1.authenticateToken, hrManagerOnly, async (req, res) => {
    try {
        const { month, year, status } = req.body;
        if (!month || !year)
            return res.status(400).json({ error: 'Thiếu tháng hoặc năm' });
        const monthYearStr = `${month}-${year}`;
        const targetStatus = status || 'LOCKED';
        let period = await db_1.prisma.payrollPeriod.findUnique({
            where: { monthYear: monthYearStr }
        });
        if (!period) {
            period = await db_1.prisma.payrollPeriod.create({
                data: {
                    monthYear: monthYearStr,
                    standardWorkingDays: 22,
                    status: targetStatus
                }
            });
        }
        else {
            period = await db_1.prisma.payrollPeriod.update({
                where: { id: period.id },
                data: { status: targetStatus }
            });
        }
        await (0, audit_1.createAuditLog)({
            action: targetStatus === 'LOCKED' ? 'LOCK_PAYROLL' : 'UNLOCK_PAYROLL',
            tableName: 'PayrollPeriod',
            recordId: period.id,
            accountId: req.user?.accountId,
            details: `${targetStatus === 'LOCKED' ? 'Khóa sổ' : 'Mở khóa sổ'} kỳ lương ${monthYearStr}`
        });
        return res.json({
            message: `Đã ${targetStatus === 'LOCKED' ? 'KHÓA SỔ' : 'MỞ KHÓA'} kỳ lương ${month}/${year} thành công`,
            period
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái khóa kỳ lương' });
    }
});
exports.default = router;
