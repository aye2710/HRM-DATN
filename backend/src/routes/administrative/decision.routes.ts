import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

// Áp dụng xác thực danh tính cho toàn bộ phân hệ Quyết định Nhân sự
router.use(authenticateToken);

const hrManagerOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');

// 1. GET: Danh sách Quyết định Nhân sự (Chống IDOR: Nhân viên chỉ xem quyết định của bản thân)
router.get('/', async (req: any, res: Response): Promise<any> => {
  try {
    const { type, status } = req.query;
    let employeeId = req.query.employeeId as string;
    const userRole = req.user?.role?.toUpperCase();

    // Chặn IDOR: Nhân viên thông thường chỉ được xem các quyết định áp dụng cho chính mình
    if (userRole === 'EMPLOYEE') {
      employeeId = req.user.employeeId;
    }
    
    let whereClause: any = {};
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (employeeId) whereClause.employeeId = employeeId;

    const decisions = await prisma.decision.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        },
        newDepartment: { select: { id: true, name: true } },
        newPosition: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(decisions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách quyết định nhân sự' });
  }
});

// 2. GET: Chi tiết 1 Quyết định (Chống IDOR)
router.get('/:id', async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userRole = req.user?.role?.toUpperCase();

    const decision = await prisma.decision.findUnique({
      where: { id },
      include: {
        employee: {
          include: { department: true, position: true, contracts: { where: { status: 'ACTIVE' } } }
        },
        newDepartment: true,
        newPosition: true
      }
    });

    if (!decision) return res.status(404).json({ error: 'Không tìm thấy quyết định' });

    // Chặn IDOR: Nhân viên chỉ xem được quyết định của chính mình
    if (userRole === 'EMPLOYEE' && decision.employeeId !== req.user?.employeeId) {
      return res.status(403).json({ error: 'Bạn không có quyền xem thông tin quyết định này.' });
    }

    return res.json(decision);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin quyết định' });
  }
});

// 3. POST: Khởi tạo Quyết định Nhân sự mới (HR Manager / Admin Only)
router.post('/', hrManagerOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const {
      decisionNumber,
      title,
      type,
      employeeId,
      oldSalary,
      newSalary,
      oldDepartmentId,
      newDepartmentId,
      oldPositionId,
      newPositionId,
      reason,
      effectiveDate,
      signBy,
      fileUrl,
      rewardAmount,
      disciplineForm,
      disciplineDuration,
      status
    } = req.body;

    if (!title?.trim() || !type || !employeeId) {
      return res.status(400).json({ error: 'Vui lòng điền đủ Tiêu đề, Loại quyết định và Nhân sự áp dụng' });
    }

    // Tự sinh số quyết định tự động (VD: QĐ-2026/001/LLA)
    const year = new Date().getFullYear();
    let finalDecNumber = decisionNumber ? String(decisionNumber).trim().toUpperCase() : null;
    
    // Nếu không nhập hoặc số gửi lên đã tồn tại, tự sinh số thứ tự tiếp theo
    if (!finalDecNumber || (await prisma.decision.findUnique({ where: { decisionNumber: finalDecNumber } }))) {
      const count = await prisma.decision.count();
      let seq = count + 1;
      let candidate = `QĐ-${year}/${String(seq).padStart(3, '0')}/LLA`;
      while (await prisma.decision.findUnique({ where: { decisionNumber: candidate } })) {
        seq++;
        candidate = `QĐ-${year}/${String(seq).padStart(3, '0')}/LLA`;
      }
      finalDecNumber = candidate;
    }

    // Lấy thông tin hiện tại của nhân sự để lưu snapshot
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { contracts: { where: { status: 'ACTIVE' } } }
    });

    if (!emp) return res.status(404).json({ error: 'Nhân sự không tồn tại' });
    if (emp.status === 'RESIGNED') {
      return res.status(400).json({ error: 'Không thể ban hành quyết định mới cho nhân sự đã thôi việc (RESIGNED)!' });
    }

    const currentSalary = emp.contracts[0]?.baseSalary || 0;
    const currentDeptId = emp.departmentId || null;
    const currentPosId = emp.positionId || null;

    const newDecision = await prisma.decision.create({
      data: {
        decisionNumber: finalDecNumber,
        title: String(title).trim(),
        type,
        employeeId,
        oldSalary: oldSalary !== undefined ? oldSalary : currentSalary,
        newSalary: newSalary !== undefined && newSalary !== '' ? newSalary : null,
        oldDepartmentId: oldDepartmentId || currentDeptId,
        newDepartmentId: newDepartmentId || null,
        oldPositionId: oldPositionId || currentPosId,
        newPositionId: newPositionId || null,
        reason: reason ? String(reason).trim() : '',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        status: status === 'DRAFT' ? 'DRAFT' : 'PENDING',
        signBy: signBy ? String(signBy).trim() : 'Ban Giám Đốc',
        fileUrl: fileUrl || null,
        rewardAmount: rewardAmount ? parseFloat(String(rewardAmount)) : null,
        disciplineForm: disciplineForm || null,
        disciplineDuration: disciplineDuration || null
      }
    });

    // Nếu là Quyết định Thôi việc / Chấm dứt HĐ: Tự động đồng bộ sang phân hệ Thôi việc & Bàn giao
    if (type === 'TERMINATION') {
      const eff = effectiveDate ? new Date(effectiveDate) : new Date();
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          resignationDate: eff,
          resignationReason: reason ? String(reason).trim() : title
        }
      });

      const existingTasks = await prisma.onboardingTask.count({
        where: {
          employeeId,
          category: { in: ['OFFBOARDING_WORK', 'OFFBOARDING_IT', 'OFFBOARDING_ADMIN', 'OFFBOARDING_HR'] }
        }
      });

      if (existingTasks === 0) {
        const DEFAULT_OFFBOARDING = [
          { taskName: 'Bàn giao tài liệu nghiệp vụ, quy trình và đầu việc đang phụ trách', category: 'OFFBOARDING_WORK' },
          { taskName: 'Chuyển giao mã nguồn, tài khoản dự án và đầu mối khách hàng', category: 'OFFBOARDING_WORK' },
          { taskName: 'Trưởng bộ phận ký biên bản nghiệm thu bàn giao chuyên môn', category: 'OFFBOARDING_WORK' },
          { taskName: 'Kiểm kê và thu hồi Laptop làm việc & Bộ sạc chính hãng', category: 'OFFBOARDING_IT' },
          { taskName: 'Thu hồi tài khoản Email, M365/Workspace và phần mềm nội bộ', category: 'OFFBOARDING_IT' },
          { taskName: 'Thu hồi quyền truy cập VPN, máy chủ và hạ tầng kỹ thuật', category: 'OFFBOARDING_IT' },
          { taskName: 'Lập & ký Biên bản thu hồi tài sản theo biểu mẫu BM-02', category: 'OFFBOARDING_IT' },
          { taskName: 'Thu hồi thẻ từ ra vào tòa nhà, thẻ gửi xe công ty', category: 'OFFBOARDING_ADMIN' },
          { taskName: 'Bàn giao chìa khóa tủ cá nhân & các tài sản hành chính', category: 'OFFBOARDING_ADMIN' },
          { taskName: 'Soạn thảo & Ban hành Quyết định chấm dứt HĐLĐ (trình BGĐ)', category: 'OFFBOARDING_HR' },
          { taskName: 'Chốt ngày công thực tế & quyết toán tiền nghỉ phép năm còn tồn', category: 'OFFBOARDING_HR' },
          { taskName: 'Thanh lý hợp đồng lao động & bàn giao sổ BHXH', category: 'OFFBOARDING_HR' },
          { taskName: 'Khóa an ninh tài khoản hệ thống vào cuối ngày làm việc cuối cùng', category: 'OFFBOARDING_HR' }
        ];

        await prisma.onboardingTask.createMany({
          data: DEFAULT_OFFBOARDING.map((t) => ({
            employeeId,
            taskName: t.taskName,
            category: t.category,
            isCompleted: false
          }))
        });
      }
    }

    await createAuditLog({
      action: 'CREATE_DECISION',
      tableName: 'Decision',
      recordId: newDecision.id,
      accountId: req.user?.accountId,
      details: `Khởi tạo quyết định nhân sự: [${newDecision.decisionNumber}] ${newDecision.title} cho nhân sự ${emp.fullName}`
    });

    return res.status(201).json(newDecision);
  } catch (error: any) {
    console.error('ERROR IN POST /api/decisions:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Số quyết định đã tồn tại, vui lòng chọn số khác!' });
    }
    return res.status(500).json({ error: error.message || 'Lỗi khi tạo quyết định nhân sự' });
  }
});

// 4. PUT: Phê duyệt & Ban hành Quyết định (HR Manager / Admin Only)
// Tự động kiểm tra thu hồi tài sản khi thôi việc, đồng bộ Hồ sơ, Hợp đồng & Lịch sử
router.put('/:id/approve', hrManagerOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { signBy } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.decision.findUnique({
        where: { id },
        include: { employee: true }
      });

      if (!decision) throw new Error('Không tìm thấy quyết định');
      if (decision.status === 'APPROVED') {
        throw new Error('Quyết định này đã được phê duyệt và ban hành trước đó!');
      }

      const empId = decision.employeeId;
      const effDate = decision.effectiveDate || new Date();

      const updatedDecision = await tx.decision.update({
        where: { id },
        data: {
          status: 'APPROVED',
          signDate: new Date(),
          signBy: signBy || decision.signBy || 'Ban Giám Đốc'
        }
      });

      // Áp dụng biến động nghiệp vụ theo loại quyết định:
      // A. ĐIỀU CHỈNH LƯƠNG
      if (decision.type === 'SALARY_ADJUSTMENT' && decision.newSalary) {
        const activeContract = await tx.contract.findFirst({
          where: { employeeId: empId, status: 'ACTIVE' }
        });
        if (activeContract) {
          // Lưu vết bằng Phụ lục hợp đồng (Contract Appendix) thay vì ghi đè mất dấu
          const appendixCount = await tx.contractAppendix.count({ where: { contractId: activeContract.id } });
          const year = new Date().getFullYear();
          const appNumber = `PLHĐ-${year}/${String(appendixCount + 1).padStart(2, '0')}/${activeContract.contractNumber ? activeContract.contractNumber.split('/')[0] : 'LLA'}`;

          await tx.contractAppendix.create({
            data: {
              appendixNumber: appNumber,
              contractId: activeContract.id,
              decisionId: decision.id,
              title: `Phụ lục điều chỉnh mức lương theo ${decision.decisionNumber}`,
              changeType: 'SALARY_ADJUSTMENT',
              oldSalary: decision.oldSalary || activeContract.baseSalary,
              newSalary: decision.newSalary,
              effectiveDate: effDate,
              content: `Căn cứ Quyết định số ${decision.decisionNumber}, hai bên thống nhất điều chỉnh mức lương cơ bản từ ${Number(decision.oldSalary || activeContract.baseSalary).toLocaleString('vi-VN')} VNĐ lên ${Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ/tháng kể từ ngày ${effDate.toLocaleDateString('vi-VN')}.`
            }
          });

          await tx.contract.update({
            where: { id: activeContract.id },
            data: { baseSalary: decision.newSalary }
          });
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            departmentId: decision.oldDepartmentId || undefined,
            positionId: decision.oldPositionId || undefined,
            changeReason: `Điều chỉnh lương theo ${decision.decisionNumber}: ${Number(decision.oldSalary || 0).toLocaleString()} ➔ ${Number(decision.newSalary).toLocaleString()} VNĐ`,
            salary: decision.newSalary,
            effectiveDate: effDate
          }
        });
      }

      // B. BỔ NHIỆM / THĂNG CHỨC
      if (decision.type === 'PROMOTION' && (decision.newPositionId || decision.newSalary)) {
        const empUpdate: any = {};
        if (decision.newPositionId) empUpdate.positionId = decision.newPositionId;
        if (decision.newDepartmentId) empUpdate.departmentId = decision.newDepartmentId;
        if (decision.newSalary) empUpdate.salary = decision.newSalary;

        await tx.employee.update({
          where: { id: empId },
          data: empUpdate
        });

        // Nếu có hợp đồng ACTIVE -> Tự động sinh Phụ lục HĐLĐ ghi nhận chức danh mới & lương mới
        const activeContract = await tx.contract.findFirst({
          where: { employeeId: empId, status: 'ACTIVE' }
        });
        if (activeContract) {
          const appendixCount = await tx.contractAppendix.count({ where: { contractId: activeContract.id } });
          const year = new Date().getFullYear();
          const appNumber = `PLHĐ-${year}/${String(appendixCount + 1).padStart(2, '0')}/${activeContract.contractNumber ? activeContract.contractNumber.split('/')[0] : 'LLA'}`;

          let posTitle = '';
          if (decision.newPositionId) {
            const p = await tx.position.findUnique({ where: { id: decision.newPositionId } });
            posTitle = p?.title || '';
          }

          const changes = [];
          if (posTitle) changes.push(`chức danh bổ nhiệm mới: ${posTitle}`);
          if (decision.newSalary) changes.push(`mức lương mới: ${Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ/tháng (mức cũ: ${Number(decision.oldSalary || activeContract.baseSalary).toLocaleString('vi-VN')} VNĐ)`);

          await tx.contractAppendix.create({
            data: {
              appendixNumber: appNumber,
              contractId: activeContract.id,
              decisionId: decision.id,
              title: `Phụ lục bổ nhiệm chức vụ theo ${decision.decisionNumber}`,
              changeType: decision.newSalary ? 'SALARY_ADJUSTMENT' : 'POSITION_CHANGE',
              oldSalary: decision.oldSalary || activeContract.baseSalary,
              newSalary: decision.newSalary || activeContract.baseSalary,
              effectiveDate: effDate,
              content: `Căn cứ Quyết định bổ nhiệm số ${decision.decisionNumber}, hai bên thống nhất áp dụng ${changes.join(', ')} kể từ ngày ${effDate.toLocaleDateString('vi-VN')}.`
            }
          });

          if (decision.newSalary) {
            await tx.contract.update({
              where: { id: activeContract.id },
              data: { baseSalary: decision.newSalary }
            });
          }
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            departmentId: decision.newDepartmentId || decision.oldDepartmentId || undefined,
            positionId: decision.newPositionId || decision.oldPositionId || undefined,
            changeReason: `Bổ nhiệm chức vụ theo ${decision.decisionNumber}${decision.newSalary ? ` (Lương mới: ${Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ)` : ''}`,
            salary: decision.newSalary || undefined,
            effectiveDate: effDate
          }
        });
      }

      // C. ĐIỀU CHUYỂN CÔNG TÁC / VỊ TRÍ CHUYÊN MÔN (BA ➔ DEV, Chuyển phòng ban...)
      if (decision.type === 'TRANSFER' && (decision.newDepartmentId || decision.newPositionId || decision.newSalary)) {
        const empUpdate: any = {};
        if (decision.newDepartmentId) empUpdate.departmentId = decision.newDepartmentId;
        if (decision.newPositionId) empUpdate.positionId = decision.newPositionId;
        if (decision.newSalary) empUpdate.salary = decision.newSalary;

        await tx.employee.update({
          where: { id: empId },
          data: empUpdate
        });

        // Tự động sinh Phụ lục Hợp đồng nếu có HĐ ACTIVE
        const activeContract = await tx.contract.findFirst({
          where: { employeeId: empId, status: 'ACTIVE' }
        });
        if (activeContract) {
          const appendixCount = await tx.contractAppendix.count({ where: { contractId: activeContract.id } });
          const year = new Date().getFullYear();
          const appNumber = `PLHĐ-${year}/${String(appendixCount + 1).padStart(2, '0')}/${activeContract.contractNumber ? activeContract.contractNumber.split('/')[0] : 'LLA'}`;

          let posTitle = '';
          if (decision.newPositionId) {
            const p = await tx.position.findUnique({ where: { id: decision.newPositionId } });
            posTitle = p?.title || '';
          }
          let deptName = '';
          if (decision.newDepartmentId) {
            const d = await tx.department.findUnique({ where: { id: decision.newDepartmentId } });
            deptName = d?.name || '';
          }

          const changes = [];
          if (posTitle) changes.push(`vị trí chức danh mới: ${posTitle}`);
          if (deptName) changes.push(`đơn vị tiếp nhận mới: ${deptName}`);
          if (decision.newSalary) changes.push(`mức lương mới: ${Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ/tháng (mức cũ: ${Number(decision.oldSalary || activeContract.baseSalary).toLocaleString('vi-VN')} VNĐ)`);

          await tx.contractAppendix.create({
            data: {
              appendixNumber: appNumber,
              contractId: activeContract.id,
              decisionId: decision.id,
              title: `Phụ lục điều chuyển vị trí & công tác theo ${decision.decisionNumber}`,
              changeType: decision.newSalary ? 'SALARY_ADJUSTMENT' : 'POSITION_CHANGE',
              oldSalary: decision.oldSalary || activeContract.baseSalary,
              newSalary: decision.newSalary || activeContract.baseSalary,
              effectiveDate: effDate,
              content: `Căn cứ Quyết định điều chuyển số ${decision.decisionNumber}, hai bên thống nhất điều chuyển và áp dụng ${changes.join(', ')} kể từ ngày ${effDate.toLocaleDateString('vi-VN')}.`
            }
          });

          if (decision.newSalary) {
            await tx.contract.update({
              where: { id: activeContract.id },
              data: { baseSalary: decision.newSalary }
            });
          }
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            departmentId: decision.newDepartmentId || decision.oldDepartmentId || undefined,
            positionId: decision.newPositionId || decision.oldPositionId || undefined,
            changeReason: `Điều chuyển công tác / vị trí theo ${decision.decisionNumber}${decision.newSalary ? ` (Lương mới: ${Number(decision.newSalary).toLocaleString('vi-VN')} VNĐ)` : ''}`,
            salary: decision.newSalary || undefined,
            effectiveDate: effDate
          }
        });
      }

      // D. THÔI VIỆC / CHẤM DỨT HỢP ĐỒNG (Kích hoạt quy trình bàn giao thôi việc)
      if (decision.type === 'TERMINATION') {
        // Cập nhật ngày nghỉ và lý do, nhưng VẪN GIỮ trạng thái ACTIVE để nhân sự bàn giao
        await tx.employee.update({
          where: { id: empId },
          data: {
            resignationDate: effDate,
            resignationReason: decision.reason || decision.title
          }
        });

        // Tự động nạp bộ checklist 4 giai đoạn nếu chưa có
        const existingTasks = await tx.onboardingTask.count({
          where: {
            employeeId: empId,
            category: { in: ['OFFBOARDING_WORK', 'OFFBOARDING_IT', 'OFFBOARDING_ADMIN', 'OFFBOARDING_HR'] }
          }
        });

        if (existingTasks === 0) {
          const DEFAULT_OFFBOARDING = [
            { taskName: 'Bàn giao tài liệu nghiệp vụ, quy trình và đầu việc đang phụ trách', category: 'OFFBOARDING_WORK' },
            { taskName: 'Chuyển giao mã nguồn, tài khoản dự án và đầu mối khách hàng', category: 'OFFBOARDING_WORK' },
            { taskName: 'Trưởng bộ phận ký biên bản nghiệm thu bàn giao chuyên môn', category: 'OFFBOARDING_WORK' },
            { taskName: 'Kiểm kê và thu hồi Laptop làm việc & Bộ sạc chính hãng', category: 'OFFBOARDING_IT' },
            { taskName: 'Thu hồi tài khoản Email, M365/Workspace và phần mềm nội bộ', category: 'OFFBOARDING_IT' },
            { taskName: 'Thu hồi quyền truy cập VPN, máy chủ và hạ tầng kỹ thuật', category: 'OFFBOARDING_IT' },
            { taskName: 'Lập & ký Biên bản thu hồi tài sản theo biểu mẫu BM-02', category: 'OFFBOARDING_IT' },
            { taskName: 'Thu hồi thẻ từ ra vào tòa nhà, thẻ gửi xe công ty', category: 'OFFBOARDING_ADMIN' },
            { taskName: 'Bàn giao chìa khóa tủ cá nhân & các tài sản hành chính', category: 'OFFBOARDING_ADMIN' },
            { taskName: 'Soạn thảo & Ban hành Quyết định chấm dứt HĐLĐ (trình BGĐ)', category: 'OFFBOARDING_HR' },
            { taskName: 'Chốt ngày công thực tế & quyết toán tiền nghỉ phép năm còn tồn', category: 'OFFBOARDING_HR' },
            { taskName: 'Thanh lý hợp đồng lao động & bàn giao sổ BHXH', category: 'OFFBOARDING_HR' },
            { taskName: 'Khóa an ninh tài khoản hệ thống vào cuối ngày làm việc cuối cùng', category: 'OFFBOARDING_HR' }
          ];

          await tx.onboardingTask.createMany({
            data: DEFAULT_OFFBOARDING.map((t) => ({
              employeeId: empId,
              taskName: t.taskName,
              category: t.category,
              isCompleted: false
            }))
          });
        }

        // Tự động đánh dấu đầu việc "Soạn thảo & Ban hành Quyết định chấm dứt HĐLĐ (trình BGĐ)" thành HOÀN THÀNH
        const decTask = await tx.onboardingTask.findFirst({
          where: {
            employeeId: empId,
            taskName: 'Soạn thảo & Ban hành Quyết định chấm dứt HĐLĐ (trình BGĐ)'
          }
        });
        if (decTask) {
          await tx.onboardingTask.update({
            where: { id: decTask.id },
            data: { isCompleted: true }
          });
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            changeReason: `Ban hành Quyết định thôi việc ${decision.decisionNumber} (Đang tiến hành quy trình bàn giao thôi việc)`,
            effectiveDate: effDate
          }
        });
      }

      // E. KHEN THƯỞNG
      if (decision.type === 'REWARD') {
        const rewardText = decision.rewardAmount 
          ? `Khen thưởng: ${decision.title} (${decision.decisionNumber}) - Mức thưởng: ${Number(decision.rewardAmount).toLocaleString('vi-VN')} VNĐ`
          : `Khen thưởng: ${decision.title} (${decision.decisionNumber})`;
        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            changeReason: rewardText,
            effectiveDate: effDate
          }
        });
      }

      // F. KỶ LUẬT
      if (decision.type === 'DISCIPLINE') {
        const discText = `Kỷ luật: [${decision.disciplineForm || 'Khiển trách'}] ${decision.title} (${decision.decisionNumber})${decision.disciplineDuration ? ` - Thời hạn: ${decision.disciplineDuration}` : ''}`;
        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            changeReason: discText,
            effectiveDate: effDate
          }
        });
      }

      return { updatedDecision, decNumber: decision.decisionNumber, decType: decision.type, empName: decision.employee?.fullName };
    });

    await createAuditLog({
      action: 'APPROVE_DECISION',
      tableName: 'Decision',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Phê duyệt và ban hành quyết định [${result.decNumber} - ${result.decType}] cho nhân sự ${result.empName}`
    });

    return res.json({
      message: `Đã phê duyệt và ban hành quyết định ${result.decNumber} thành công! Hồ sơ nhân sự, hợp đồng và tài khoản đã được tự động đồng bộ.`,
      decision: result.updatedDecision
    });
  } catch (error: any) {
    console.error('Error approving decision:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi phê duyệt quyết định' });
  }
});

// 5. PUT: Từ chối / Hủy quyết định (HR Manager / Admin Only)
router.put('/:id/reject', hrManagerOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const existing = await prisma.decision.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy quyết định' });
    }
    if (existing.status === 'APPROVED') {
      return res.status(400).json({ error: 'Không thể từ chối quyết định đã được phê duyệt và ban hành!' });
    }

    const updated = await prisma.decision.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reason: reason ? `[TỪ CHỐI]: ${reason}` : undefined
      }
    });

    await createAuditLog({
      action: 'REJECT_DECISION',
      tableName: 'Decision',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Từ chối quyết định ${existing.decisionNumber}. Lý do: ${reason || 'Không'}`
    });

    return res.json({ message: 'Đã từ chối quyết định', decision: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi từ chối quyết định' });
  }
});

// 6. DELETE: Xóa quyết định nháp (HR Manager / Admin Only - Chặn xóa quyết định đã ban hành)
router.delete('/:id', hrManagerOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const dec = await prisma.decision.findUnique({ where: { id } });
    if (!dec) return res.status(404).json({ error: 'Không tìm thấy quyết định' });
    if (dec.status === 'APPROVED') {
      return res.status(400).json({ error: 'Không thể xóa quyết định đã được ban hành!' });
    }

    await prisma.decision.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE_DECISION',
      tableName: 'Decision',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa quyết định ${dec.decisionNumber}`
    });

    return res.json({ message: 'Đã xóa quyết định thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa quyết định' });
  }
});

// 7. PUT: Thu hồi / Hủy bỏ Quyết định đã ban hành (Rollback hoàn tác nghiệp vụ)
router.put('/:id/revoke', hrManagerOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { revokeReason } = req.body;

    if (!revokeReason?.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp lý do thu hồi / hủy bỏ quyết định!' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const decision = await tx.decision.findUnique({
        where: { id },
        include: { employee: true }
      });

      if (!decision) throw new Error('Không tìm thấy quyết định');
      if (decision.status !== 'APPROVED') {
        throw new Error('Chỉ có thể thu hồi quyết định đã được Ban hành (APPROVED)!');
      }

      const empId = decision.employeeId;
      const now = new Date();

      // Hoàn tác nghiệp vụ tương ứng theo loại quyết định:
      // A. Hoàn tác Điều chỉnh lương -> Trả lại mức lương cũ
      if (decision.type === 'SALARY_ADJUSTMENT' && decision.oldSalary) {
        const activeContract = await tx.contract.findFirst({
          where: { employeeId: empId, status: 'ACTIVE' }
        });
        if (activeContract) {
          await tx.contractAppendix.deleteMany({
            where: { decisionId: decision.id }
          });
          await tx.contract.update({
            where: { id: activeContract.id },
            data: { baseSalary: decision.oldSalary }
          });
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            changeReason: `[THU HỒI QĐ ${decision.decisionNumber}] Khôi phục lương cũ: ${Number(decision.oldSalary).toLocaleString('vi-VN')} VNĐ. Lý do: ${revokeReason}`,
            salary: decision.oldSalary,
            effectiveDate: now
          }
        });
      }

      // B. Hoàn tác Bổ nhiệm chức vụ -> Trả lại chức vụ cũ & lương cũ (nếu có)
      if (decision.type === 'PROMOTION') {
        const empRollback: any = {};
        if (decision.oldPositionId) empRollback.positionId = decision.oldPositionId;
        if (decision.oldDepartmentId) empRollback.departmentId = decision.oldDepartmentId;
        if (decision.oldSalary) empRollback.salary = decision.oldSalary;

        if (Object.keys(empRollback).length > 0) {
          await tx.employee.update({
            where: { id: empId },
            data: empRollback
          });
        }

        // Xóa Phụ lục HĐ liên kết với quyết định này & hoàn tác lương HĐ
        await tx.contractAppendix.deleteMany({
          where: { decisionId: decision.id }
        });
        if (decision.oldSalary) {
          const activeContract = await tx.contract.findFirst({
            where: { employeeId: empId, status: 'ACTIVE' }
          });
          if (activeContract) {
            await tx.contract.update({
              where: { id: activeContract.id },
              data: { baseSalary: decision.oldSalary }
            });
          }
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            positionId: decision.oldPositionId || undefined,
            departmentId: decision.oldDepartmentId || undefined,
            changeReason: `[THU HỒI QĐ ${decision.decisionNumber}] Hủy quyết định bổ nhiệm, khôi phục thông tin cũ. Lý do: ${revokeReason}`,
            salary: decision.oldSalary || undefined,
            effectiveDate: now
          }
        });
      }

      // C. Hoàn tác Điều chuyển công tác / vị trí -> Trả lại phòng ban, chức vụ & lương cũ
      if (decision.type === 'TRANSFER') {
        const empRollback: any = {};
        if (decision.oldDepartmentId) empRollback.departmentId = decision.oldDepartmentId;
        if (decision.oldPositionId) empRollback.positionId = decision.oldPositionId;
        if (decision.oldSalary) empRollback.salary = decision.oldSalary;

        if (Object.keys(empRollback).length > 0) {
          await tx.employee.update({
            where: { id: empId },
            data: empRollback
          });
        }

        // Xóa Phụ lục HĐ liên kết với quyết định này & hoàn tác lương HĐ
        await tx.contractAppendix.deleteMany({
          where: { decisionId: decision.id }
        });
        if (decision.oldSalary) {
          const activeContract = await tx.contract.findFirst({
            where: { employeeId: empId, status: 'ACTIVE' }
          });
          if (activeContract) {
            await tx.contract.update({
              where: { id: activeContract.id },
              data: { baseSalary: decision.oldSalary }
            });
          }
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            departmentId: decision.oldDepartmentId || undefined,
            positionId: decision.oldPositionId || undefined,
            changeReason: `[THU HỒI QĐ ${decision.decisionNumber}] Hủy quyết định điều chuyển, khôi phục đơn vị & vị trí cũ. Lý do: ${revokeReason}`,
            salary: decision.oldSalary || undefined,
            effectiveDate: now
          }
        });
      }

      // D. Hoàn tác Thôi việc -> Khôi phục trạng thái ACTIVE, mở khóa tài khoản và hợp đồng
      if (decision.type === 'TERMINATION') {
        await tx.employee.update({
          where: { id: empId },
          data: { status: 'ACTIVE' }
        });

        await tx.account.updateMany({
          where: { employeeId: empId },
          data: { isActive: true }
        });

        const latestContract = await tx.contract.findFirst({
          where: { employeeId: empId },
          orderBy: { createdAt: 'desc' }
        });
        if (latestContract) {
          await tx.contract.update({
            where: { id: latestContract.id },
            data: { status: 'ACTIVE', endDate: null }
          });
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            changeReason: `[THU HỒI QĐ ${decision.decisionNumber}] Hủy quyết định thôi việc, khôi phục trạng thái làm việc (ACTIVE). Lý do: ${revokeReason}`,
            effectiveDate: now
          }
        });
      }

      // E. Khen thưởng / Kỷ luật
      if (decision.type === 'REWARD' || decision.type === 'DISCIPLINE') {
        await tx.employmentHistory.create({
          data: {
            employeeId: empId,
            changeReason: `[THU HỒI QĐ ${decision.decisionNumber}] Hủy quyết định ${decision.type === 'REWARD' ? 'khen thưởng' : 'kỷ luật'}. Lý do: ${revokeReason}`,
            effectiveDate: now
          }
        });
      }

      // Cập nhật trạng thái quyết định thành CANCELLED (Đã thu hồi)
      const updatedDecision = await tx.decision.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          revokeReason: String(revokeReason).trim(),
          revokedAt: now
        }
      });

      return { updatedDecision, decNumber: decision.decisionNumber, empName: decision.employee?.fullName };
    });

    await createAuditLog({
      action: 'REVOKE_DECISION',
      tableName: 'Decision',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Thu hồi quyết định [${result.decNumber}] của nhân sự ${result.empName}. Lý do: ${revokeReason}`
    });

    return res.json({
      message: `Đã thu hồi quyết định ${result.decNumber} thành công! Dữ liệu hồ sơ và hợp đồng đã được hoàn tác về trạng thái ban đầu.`,
      decision: result.updatedDecision
    });
  } catch (error: any) {
    console.error('Error revoking decision:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi thu hồi quyết định' });
  }
});

export default router;
