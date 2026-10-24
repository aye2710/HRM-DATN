"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../db");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// ==========================================
// 1. PUBLIC ENDPOINTS (Cổng Tuyển Dụng Ứng Viên)
// ==========================================
// GET: Tra cứu trạng thái hồ sơ theo email và mã bảo mật (BR-CAN-08)
router.get('/track', async (req, res) => {
    try {
        const email = req.query.email?.trim().toLowerCase();
        const code = req.query.code?.trim();
        // Bắt buộc cả 2 yếu tố xác thực theo chuẩn BR-CAN-08
        if (!email || !code) {
            return res.status(400).json({
                error: 'Vui lòng cung cấp cả Địa chỉ Email và Mã hồ sơ bảo mật (hoặc SĐT đã đăng ký) để tra cứu.'
            });
        }
        const cleanCode = code.replace(/^(LLA-|APP-)/i, '').trim();
        const applications = await db_1.prisma.candidate.findMany({
            where: {
                email: { equals: email, mode: 'insensitive' },
                OR: [
                    { id: { startsWith: cleanCode, mode: 'insensitive' } },
                    { phone: { equals: code } }
                ]
            },
            include: {
                jobPosting: {
                    select: {
                        title: true,
                        department: { select: { name: true } }
                    }
                },
                interviews: {
                    select: { scheduledAt: true, roundName: true, status: true, location: true },
                    orderBy: { scheduledAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (applications.length === 0) {
            return res.status(404).json({
                error: 'Không tìm thấy hồ sơ nào khớp với Email và Mã xác thực bạn đã cung cấp.'
            });
        }
        const safeData = applications.map(app => ({
            id: `LLA-${app.id.substring(0, 8).toUpperCase()}`,
            jobTitle: app.jobPosting?.title || 'Không rõ',
            department: app.jobPosting?.department?.name || '',
            status: app.status,
            appliedAt: app.createdAt || null,
            latestInterview: app.interviews.length > 0 ? {
                roundName: app.interviews[0].roundName,
                scheduledAt: app.interviews[0].scheduledAt,
                status: app.interviews[0].status
            } : null
        }));
        return res.json(safeData);
    }
    catch (error) {
        console.error('Error tracking candidate:', error);
        return res.status(500).json({ error: 'Lỗi máy chủ khi tra cứu hồ sơ.' });
    }
});
// POST: Nộp hồ sơ Ứng viên mới trực tuyến (UC-CAN-03-01 & BR-CAN-03, BR-CAN-04)
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, cvUrl, jobPostingId } = req.body;
        // 1. Validate Input cơ bản
        if (!name?.trim() || !email?.trim() || !jobPostingId?.trim()) {
            return res.status(400).json({ error: 'Họ tên, email và vị trí tuyển dụng không được để trống.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({ error: 'Định dạng email không hợp lệ.' });
        }
        // 2. BR-CAN-01: Kiểm tra vị trí tuyển dụng có đang mở (PUBLISHED) không
        const job = await db_1.prisma.jobPosting.findUnique({
            where: { id: jobPostingId.trim() },
            select: { id: true, status: true, title: true }
        });
        if (!job || job.status !== 'PUBLISHED') {
            return res.status(400).json({ error: 'Vị trí tuyển dụng này hiện không mở tiếp nhận hồ sơ.' });
        }
        // 3. BR-CAN-04: Kiểm tra chống nộp trùng lặp (Cùng email cho cùng 1 job)
        const existing = await db_1.prisma.candidate.findFirst({
            where: {
                email: cleanEmail,
                jobPostingId: job.id
            }
        });
        if (existing) {
            return res.status(409).json({
                error: 'Email của bạn đã nộp hồ sơ cho vị trí này rồi! Vui lòng theo dõi trong mục "Hồ sơ của tôi".'
            });
        }
        // 4. BR-CAN-03: Cố định status = 'APPLIED' (Triệt tiêu Mass Assignment)
        const newCandidate = await db_1.prisma.candidate.create({
            data: {
                name: name.trim(),
                email: cleanEmail,
                phone: phone ? phone.trim() : null,
                cvUrl: cvUrl ? cvUrl.trim() : null,
                jobPostingId: job.id,
                status: 'APPLIED'
            },
            include: {
                jobPosting: { select: { title: true } }
            }
        });
        const trackingCode = `LLA-APP-${newCandidate.id.substring(0, 6).toUpperCase()}`;
        return res.status(201).json({
            ...newCandidate,
            trackingCode,
            message: 'Nộp hồ sơ ứng tuyển thành công!'
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Email của bạn đã nộp hồ sơ cho vị trí này rồi! Vui lòng theo dõi trong mục "Hồ sơ của tôi".'
            });
        }
        console.error("Lỗi khi thêm ứng viên:", error);
        return res.status(500).json({ error: 'Lỗi khi thêm ứng viên' });
    }
});
// ==========================================
// ==========================================
// 2. INTERNAL HR & ATS MANAGEMENT ENDPOINTS (Bắt buộc Token + Role)
// ==========================================
router.use(auth_middleware_1.authenticateToken);
router.use((0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'RECRUITER'));
// GET: Lấy danh sách Ứng viên (cho ATS Kanban)
router.get('/', async (req, res) => {
    try {
        const candidates = await db_1.prisma.candidate.findMany({
            include: {
                jobPosting: {
                    include: {
                        department: true,
                        position: true
                    }
                },
                offer: true,
                preOnboarding: true,
                interviews: {
                    include: { feedbacks: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(candidates);
    }
    catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng viên' });
    }
});
// Bảng kiểm tra chuyển trạng thái hợp lệ trong phễu tuyển dụng (BR-REC-02-01)
const validTransitions = {
    SOURCED: ['SCREENING', 'REJECTED'],
    APPLIED: ['SCREENING', 'SOURCED', 'REJECTED'],
    SCREENING: ['INTERVIEWING', 'REJECTED'],
    INTERVIEWING: ['OFFERING', 'REJECTED'],
    OFFERING: ['HIRED', 'REJECTED'],
    HIRED: [], // Tuyệt đối không cho phép kéo lùi khi đã tuyển dụng
    REJECTED: ['SOURCED', 'APPLIED', 'SCREENING'] // Cho phép kích hoạt lại hồ sơ
};
// PUT: Cập nhật Ứng viên (chuyển trạng thái kéo thả Kanban hoặc sửa thông tin)
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, phone, cvUrl, jobPostingId, status } = req.body;
        // Tìm ứng viên hiện tại
        const candidate = await db_1.prisma.candidate.findUnique({
            where: { id },
            include: {
                jobPosting: { include: { department: true, position: true } },
                offer: true,
                preOnboarding: true
            }
        });
        if (!candidate) {
            return res.status(404).json({ error: 'Không tìm thấy hồ sơ ứng viên.' });
        }
        // 1. Kiểm tra quy tắc chuyển trạng thái (BR-REC-02-01 Strict Pipeline)
        if (status && status !== candidate.status) {
            if (candidate.status === 'HIRED') {
                return res.status(400).json({
                    error: 'Ứng viên đã được tiếp nhận chính thức (HIRED), không thể thay đổi trạng thái hoặc lùi quy trình!'
                });
            }
            const allowedNext = validTransitions[candidate.status] || [];
            if (!allowedNext.includes(status)) {
                return res.status(400).json({
                    error: `Quy trình tuyển dụng không hợp lệ: Không thể di chuyển hồ sơ từ [${candidate.status}] sang [${status}]. Chỉ được phép chuyển tiếp vòng sau hoặc Đánh dấu từ chối (REJECTED).`
                });
            }
        }
        // 2. Xử lý trường hợp chuyển sang HIRED (Auto-provisioning Employee & Contract)
        if (status === 'HIRED') {
            const result = await db_1.prisma.$transaction(async (tx) => {
                // Cập nhật trạng thái ứng viên
                const updatedCandidate = await tx.candidate.update({
                    where: { id },
                    data: { status: 'HIRED' },
                    include: { jobPosting: true }
                });
                // Kiểm tra xem đã có Employee tương ứng chưa
                let existingEmp = await tx.employee.findFirst({
                    where: {
                        OR: [
                            { email: candidate.email },
                            ...(candidate.preOnboarding?.cccd ? [{ cccd: candidate.preOnboarding.cccd }] : [])
                        ]
                    }
                });
                if (!existingEmp) {
                    // Sinh mã nhân viên chuẩn NV0001
                    const count = await tx.employee.count();
                    let nextNum = count + 1;
                    let candidateCode = `NV${String(nextNum).padStart(4, '0')}`;
                    while (await tx.employee.findUnique({ where: { code: candidateCode } })) {
                        nextNum++;
                        candidateCode = `NV${String(nextNum).padStart(4, '0')}`;
                    }
                    const po = candidate.preOnboarding;
                    const offer = candidate.offer;
                    const baseSalary = offer ? Number(offer.baseSalary) : 10000000;
                    const contractStartDate = offer?.startDate || new Date();
                    // Kế thừa toàn bộ dữ liệu Pre-Onboarding do ứng viên tự khai
                    const newEmployee = await tx.employee.create({
                        data: {
                            code: candidateCode,
                            fullName: updatedCandidate.name,
                            email: candidate.email,
                            phone: candidate.phone,
                            cccd: po?.cccd || null,
                            gender: po?.gender || null,
                            dateOfBirth: po?.dateOfBirth ? new Date(po.dateOfBirth) : null,
                            address: po?.address || null,
                            nationality: po?.nationality || 'Việt Nam',
                            maritalStatus: po?.maritalStatus || null,
                            taxCode: po?.taxCode || null,
                            bankName: po?.bankName || null,
                            bankAccount: po?.bankAccount || null,
                            socialInsurance: po?.socialInsurance || null,
                            healthInsurance: po?.healthInsurance || null,
                            emergencyContactName: po?.emergencyContactName || null,
                            emergencyContactPhone: po?.emergencyContactPhone || null,
                            emergencyContactRelation: po?.emergencyContactRelation || null,
                            status: 'ONBOARDING',
                            joinDate: contractStartDate,
                            departmentId: candidate.jobPosting?.departmentId || null,
                            positionId: candidate.jobPosting?.positionId || null
                        }
                    });
                    // Tạo Hợp đồng lao động đầu tiên
                    await tx.contract.create({
                        data: {
                            employeeId: newEmployee.id,
                            contractType: offer?.contractType || 'PROBATION',
                            baseSalary: baseSalary,
                            startDate: contractStartDate,
                            status: 'ACTIVE'
                        }
                    });
                    // Tạo Lịch sử công tác ban đầu (EmploymentHistory)
                    await tx.employmentHistory.create({
                        data: {
                            employeeId: newEmployee.id,
                            departmentId: candidate.jobPosting?.departmentId || null,
                            positionId: candidate.jobPosting?.positionId || null,
                            changeReason: 'Tuyển mới (New Hire - Auto Provisioned)',
                            salary: baseSalary,
                            effectiveDate: contractStartDate
                        }
                    });
                }
                // Cập nhật JobOffer thành ACCEPTED nếu có
                if (candidate.offer && candidate.offer.status !== 'ACCEPTED') {
                    await tx.jobOffer.update({
                        where: { id: candidate.offer.id },
                        data: { status: 'ACCEPTED', respondedAt: new Date() }
                    });
                }
                // Auto-close JobPosting nếu đủ quân số
                if (candidate.jobPostingId && candidate.jobPosting) {
                    const job = candidate.jobPosting;
                    if (job.status === 'PUBLISHED') {
                        const hiredCount = await tx.candidate.count({
                            where: { jobPostingId: job.id, status: 'HIRED' }
                        });
                        if (hiredCount >= job.amount) {
                            await tx.jobPosting.update({
                                where: { id: job.id },
                                data: { status: 'CLOSED' }
                            });
                        }
                    }
                }
                return updatedCandidate;
            });
            return res.json(result);
        }
        // 3. Các trường hợp cập nhật thông thường khác
        const updatedCandidate = await db_1.prisma.candidate.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                email: email !== undefined ? email.toLowerCase().trim() : undefined,
                phone: phone !== undefined ? phone : undefined,
                cvUrl: cvUrl !== undefined ? cvUrl : undefined,
                jobPostingId: jobPostingId !== undefined ? jobPostingId : undefined,
                status: status !== undefined ? status : undefined
            }
        });
        return res.json(updatedCandidate);
    }
    catch (error) {
        console.error("Lỗi cập nhật ứng viên:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Mã nhân viên, CCCD hoặc email đã tồn tại trong hệ thống.' });
        }
        return res.status(500).json({ error: error.message || 'Lỗi khi cập nhật ứng viên.' });
    }
});
// DELETE: Xóa Ứng viên (Ràng buộc BR-REC-02-05)
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const candidate = await db_1.prisma.candidate.findUnique({
            where: { id },
            include: {
                interviews: { include: { feedbacks: true } },
                offer: true,
                preOnboarding: true
            }
        });
        if (!candidate) {
            return res.status(404).json({ error: 'Không tìm thấy hồ sơ ứng viên để xóa.' });
        }
        // BR-REC-02-05: Chặn xóa ứng viên đang đánh giá hoặc đã tuyển
        if (['SCREENING', 'INTERVIEWING', 'OFFERING', 'HIRED'].includes(candidate.status)) {
            return res.status(400).json({
                error: `Không thể xóa hồ sơ ứng viên đang ở giai đoạn [${candidate.status}]! Chỉ được phép xóa ứng viên ở trạng thái Nguồn mới (SOURCED/APPLIED) hoặc Đã từ chối (REJECTED).`
            });
        }
        // Xóa an toàn trong Transaction để tránh lỗi khóa ngoại Foreign Key (P2003)
        await db_1.prisma.$transaction(async (tx) => {
            // 1. Xóa các đánh giá phỏng vấn
            for (const inv of candidate.interviews) {
                await tx.candidateFeedback.deleteMany({ where: { interviewRoundId: inv.id } });
            }
            // 2. Xóa các vòng phỏng vấn
            await tx.interviewRound.deleteMany({ where: { candidateId: id } });
            // 3. Xóa JobOffer nếu có
            await tx.jobOffer.deleteMany({ where: { candidateId: id } });
            // 4. Xóa PreOnboarding nếu có
            await tx.preOnboardingProfile.deleteMany({ where: { candidateId: id } });
            // 5. Xóa Candidate
            await tx.candidate.delete({ where: { id } });
        });
        return res.json({ message: 'Xóa hồ sơ ứng viên thành công.' });
    }
    catch (error) {
        console.error("Lỗi khi xóa ứng viên:", error);
        return res.status(500).json({ error: 'Lỗi khi xóa ứng viên.' });
    }
});
exports.default = router;
