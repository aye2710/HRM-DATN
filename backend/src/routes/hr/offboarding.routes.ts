import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();
router.use(authenticateToken);

// Phân quyền cho cán bộ nhân sự và quản trị
const hrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'IT_SUPPORT');

// Danh mục các đầu việc bàn giao chuẩn 4 khối (Offboarding Checklist Standards)
export const DEFAULT_OFFBOARDING_TASKS = [
  // Khối 1: Bàn giao chuyên môn & Quản lý trực tiếp
  { taskName: 'Bàn giao tài liệu nghiệp vụ, quy trình và đầu việc đang phụ trách', category: 'OFFBOARDING_WORK' },
  { taskName: 'Chuyển giao mã nguồn, tài khoản dự án và đầu mối khách hàng', category: 'OFFBOARDING_WORK' },
  { taskName: 'Trưởng bộ phận ký biên bản nghiệm thu bàn giao chuyên môn', category: 'OFFBOARDING_WORK' },
  
  // Khối 2: Khối IT Support & Hạ tầng Kỹ thuật (BM-02)
  { taskName: 'Kiểm kê và thu hồi Laptop làm việc & Bộ sạc chính hãng', category: 'OFFBOARDING_IT' },
  { taskName: 'Thu hồi tài khoản Email, M365/Workspace và phần mềm nội bộ', category: 'OFFBOARDING_IT' },
  { taskName: 'Thu hồi quyền truy cập VPN, máy chủ và hạ tầng kỹ thuật', category: 'OFFBOARDING_IT' },
  { taskName: 'Lập & ký Biên bản thu hồi tài sản theo biểu mẫu BM-02', category: 'OFFBOARDING_IT' },

  // Khối 3: Khối Hành chính - Quản trị Văn phòng
  { taskName: 'Thu hồi thẻ từ ra vào tòa nhà, thẻ gửi xe công ty', category: 'OFFBOARDING_ADMIN' },
  { taskName: 'Bàn giao chìa khóa tủ cá nhân & các tài sản hành chính', category: 'OFFBOARDING_ADMIN' },

  // Khối 4: Khối Nhân sự & Kế toán Quyết toán
  { taskName: 'Soạn thảo & Ban hành Quyết định chấm dứt HĐLĐ (trình BGĐ)', category: 'OFFBOARDING_HR' },
  { taskName: 'Chốt ngày công thực tế & quyết toán tiền nghỉ phép năm còn tồn', category: 'OFFBOARDING_HR' },
  { taskName: 'Thanh lý hợp đồng lao động & bàn giao sổ BHXH', category: 'OFFBOARDING_HR' },
  { taskName: 'Khóa an ninh tài khoản hệ thống lúc 18:00 ngày làm việc cuối', category: 'OFFBOARDING_HR' },
];

// 1. GET /api/offboarding/overview: Lấy tổng quan toàn bộ tiến trình nghỉ việc
router.get('/overview', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    // 1.1 Lấy danh sách nhân viên đã nghỉ (RESIGNED)
    const resigned = await prisma.employee.findMany({
      where: { status: 'RESIGNED' },
      include: {
        department: true,
        position: true,
        contracts: { orderBy: { startDate: 'desc' } },
        assetAssignments: {
          include: { asset: true },
          orderBy: { assignedDate: 'desc' }
        },
        decisions: {
          where: { type: 'TERMINATION' },
          orderBy: { createdAt: 'desc' }
        },
        onboardingTasks: {
          where: { category: { startsWith: 'OFFBOARDING_' } }
        }
      },
      orderBy: { resignationDate: 'desc' }
    });

    // 1.2 Lấy danh sách nhân viên ĐANG TRONG TIẾN TRÌNH THÔI VIỆC (IN PROGRESS)
    // Bao gồm nhân viên có ngày nghỉ trong tương lai HOẶC có checklist bàn giao thôi việc HOẶC có quyết định thôi việc đang chờ duyệt
    const inProgress = await prisma.employee.findMany({
      where: {
        status: { not: 'RESIGNED' },
        OR: [
          { resignationDate: { not: null } },
          { onboardingTasks: { some: { category: { startsWith: 'OFFBOARDING_' } } } },
          { decisions: { some: { type: 'TERMINATION' } } }
        ]
      },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, fullName: true, code: true } },
        contracts: { where: { status: 'ACTIVE' } },
        leaveBalances: true,
        assetAssignments: {
          include: { asset: true },
          orderBy: { assignedDate: 'desc' }
        },
        decisions: {
          where: { type: 'TERMINATION' },
          orderBy: { createdAt: 'desc' }
        },
        onboardingTasks: {
          where: { category: { startsWith: 'OFFBOARDING_' } }
        }
      },
      orderBy: { joinDate: 'desc' }
    });

    // 1.3 Thống kê
    const pendingAssetReturns = await prisma.assetAssignment.count({
      where: {
        status: 'ACTIVE',
        employee: {
          OR: [
            { status: 'RESIGNED' },
            { resignationDate: { not: null } }
          ]
        }
      }
    });

    return res.json({
      resigned,
      inProgress,
      stats: {
        resignedCount: resigned.length,
        inProgressCount: inProgress.length,
        pendingAssetReturns
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/offboarding/overview:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy dữ liệu tổng quan thôi việc' });
  }
});

// 2. GET /api/offboarding/:employeeId/detail: Lấy chi tiết tiến độ bàn giao của 1 nhân viên
router.get('/:employeeId/detail', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const employeeId = req.params.employeeId as string;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, fullName: true, code: true, position: { select: { title: true } } } },
        contracts: { orderBy: { startDate: 'desc' }, include: { appendices: true } },
        leaveBalances: true,
        assetAssignments: {
          include: { asset: true },
          orderBy: { assignedDate: 'desc' }
        },
        decisions: {
          where: { type: 'TERMINATION' },
          orderBy: { createdAt: 'desc' }
        },
        onboardingTasks: {
          where: { category: { startsWith: 'OFFBOARDING_' } }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân viên' });
    }

    // Tính toán số ngày phép năm còn tồn và giá trị quy đổi
    const currentYear = new Date().getFullYear();
    const currentLeaveBalance = (employee as any).leaveBalances?.find((b: any) => b.year === currentYear) || (employee as any).leaveBalances?.[0];
    const remainingLeaveDays = currentLeaveBalance ? Number(currentLeaveBalance.remainingDays || 0) : 0;
    
    // Mức lương cơ sở hợp đồng để tính 1 ngày công
    const activeContract = (employee as any).contracts?.find((c: any) => c.status === 'ACTIVE') || (employee as any).contracts?.[0];
    const baseSalary = activeContract?.baseSalary ? Number(activeContract.baseSalary) : 0;
    const standardWorkDays = 26; // Chuẩn 26 ngày công
    const estimatedLeavePay = remainingLeaveDays > 0 ? Math.round((baseSalary / standardWorkDays) * remainingLeaveDays) : 0;

    return res.json({
      employee,
      activeContract,
      settlement: {
        remainingLeaveDays,
        baseSalary,
        estimatedLeavePay,
        standardWorkDays
      },
      defaultTasks: DEFAULT_OFFBOARDING_TASKS
    });
  } catch (error: any) {
    console.error('Error in GET /api/offboarding/:employeeId/detail:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy chi tiết bàn giao thôi việc' });
  }
});

// 3. POST /api/offboarding/initiate: Khởi tạo tiến trình thôi việc cho 1 nhân viên đang làm việc
router.post('/initiate', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, resignationDate, resignationReason, note } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Vui lòng chọn nhân viên' });
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }

    const targetDate = resignationDate ? new Date(resignationDate) : new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật ngày dự kiến nghỉ và lý do trên Employee
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          resignationDate: targetDate,
          resignationReason: resignationReason || 'Thỏa thuận chấm dứt HĐLĐ'
        }
      });

      // 2. Tự động sinh bộ checklist 4 khối nếu chưa có
      for (const t of DEFAULT_OFFBOARDING_TASKS) {
        const existing = await tx.onboardingTask.findFirst({
          where: { employeeId, taskName: t.taskName, category: t.category }
        });
        if (!existing) {
          await tx.onboardingTask.create({
            data: {
              employeeId,
              taskName: t.taskName,
              category: t.category,
              isCompleted: false
            }
          });
        }
      }
    });

    await createAuditLog({
      action: 'INITIATE_OFFBOARDING',
      tableName: 'Employee',
      recordId: employeeId,
      accountId: req.user?.accountId,
      details: `Khởi tạo quy trình thôi việc & bàn giao cho [${employee.fullName}] (${employee.code}) - Ngày dự kiến: ${targetDate.toLocaleDateString('vi-VN')}`
    });

    return res.json({ message: 'Khởi tạo tiến trình thôi việc thành công! Hệ thống đã nạp bộ checklist bàn giao 4 giai đoạn.' });
  } catch (error: any) {
    console.error('Error in POST /api/offboarding/initiate:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi khởi tạo thôi việc' });
  }
});

// 4. POST /api/offboarding/task/toggle: Check / Uncheck một đầu việc trong checklist
router.post('/task/toggle', hrOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId, taskName, category, isCompleted } = req.body;

    let task = await prisma.onboardingTask.findFirst({
      where: { employeeId, taskName, category }
    });

    if (task) {
      task = await prisma.onboardingTask.update({
        where: { id: task.id },
        data: { isCompleted: Boolean(isCompleted) }
      });
    } else {
      task = await prisma.onboardingTask.create({
        data: {
          employeeId,
          taskName,
          category,
          isCompleted: Boolean(isCompleted)
        }
      });
    }

    return res.json(task);
  } catch (error: any) {
    console.error('Error in POST /api/offboarding/task/toggle:', error);
    return res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái đầu việc' });
  }
});

// 5. POST /api/offboarding/asset/quick-return: Xác nhận thu hồi tài sản trực tiếp trong màn hình bàn giao
router.post('/asset/quick-return', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { assignmentId, conditionOnReturn, notes } = req.body;

    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: assignmentId },
      include: { asset: true, employee: true }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu bàn giao tài sản' });
    }

    if (assignment.status === 'RETURNED') {
      return res.status(400).json({ error: 'Tài sản này đã được thu hồi trước đó' });
    }

    await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'RETURNED',
          returnedDate: new Date(),
          conditionOnReturn: conditionOnReturn || 'Đã thu hồi đủ, tình trạng bình thường (BM-02)',
          notes: notes ? `${assignment.notes ? assignment.notes + ' | ' : ''}Thu hồi: ${notes}` : assignment.notes
        }
      }),
      prisma.asset.update({
        where: { id: assignment.assetId },
        data: {
          status: 'AVAILABLE',
          condition: conditionOnReturn || assignment.asset.condition
        }
      })
    ]);

    await createAuditLog({
      action: 'OFFBOARDING_ASSET_RETURN',
      tableName: 'AssetAssignment',
      recordId: assignmentId,
      accountId: req.user?.accountId,
      details: `Thu hồi thiết bị [${assignment.asset.name}] (${assignment.asset.code}) từ nhân sự [${assignment.employee?.fullName}] trong tiến trình thôi việc`
    });

    return res.json({ message: `Đã thu hồi tài sản ${assignment.asset.name} (${assignment.asset.code}) thành công!` });
  } catch (error: any) {
    console.error('Error in POST /api/offboarding/asset/quick-return:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi thu hồi tài sản' });
  }
});

// 6. POST /api/offboarding/finalize: Hoàn tất thôi việc chính thức (Kiểm tra an toàn bàn giao)
router.post('/finalize', hrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, effectiveDate, terminationReason } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Thiếu mã nhân viên cần thôi việc' });
    }

    // 1. Kiểm tra ràng buộc tài sản (Bắt buộc phải thu hồi 100%)
    const activeAssets = await prisma.assetAssignment.count({
      where: { employeeId, status: 'ACTIVE' }
    });
    if (activeAssets > 0) {
      return res.status(400).json({
        error: `Không thể hoàn tất thủ tục thôi việc! Nhân viên đang nắm giữ ${activeAssets} tài sản/thiết bị chưa hoàn trả. Vui lòng xác nhận thu hồi đủ theo biên bản BM-02 trước.`
      });
    }

    const effDate = effectiveDate ? new Date(effectiveDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const currentEmp = await tx.employee.findUnique({ where: { id: employeeId } });
      if (!currentEmp) throw new Error('Không tìm thấy nhân viên');

      // Đổi status sang RESIGNED
      const updatedEmp = await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: 'RESIGNED',
          departmentId: null,
          positionId: null,
          resignationDate: effDate,
          resignationReason: terminationReason || currentEmp.resignationReason || 'Nghỉ việc theo quy trình thôi việc & bàn giao'
        }
      });

      // Đóng các hợp đồng ACTIVE sang TERMINATED
      await tx.contract.updateMany({
        where: { employeeId, status: 'ACTIVE' },
        data: {
          status: 'TERMINATED',
          endDate: effDate
        }
      });

      // Khóa tài khoản an ninh
      await tx.account.updateMany({
        where: { employeeId },
        data: { isActive: false }
      });

      // Ghi lịch sử công tác
      await tx.employmentHistory.create({
        data: {
          employeeId,
          departmentId: currentEmp.departmentId,
          positionId: currentEmp.positionId,
          changeReason: terminationReason || 'Thôi việc & Hoàn tất thủ tục bàn giao',
          effectiveDate: effDate
        }
      });

      return updatedEmp;
    });

    await createAuditLog({
      action: 'OFFBOARDING_FINALIZE',
      tableName: 'Employee',
      recordId: employeeId,
      accountId: req.user?.accountId,
      details: `Hoàn tất thủ tục thôi việc & Khóa an ninh cho [${result.fullName}] (${result.code})`
    });

    return res.json({
      message: 'Hoàn tất thủ tục thôi việc thành công! Trạng thái hồ sơ đã chuyển sang RESIGNED và tài khoản đã được khóa an ninh theo quy định.',
      employee: result
    });
  } catch (error: any) {
    console.error('Error in POST /api/offboarding/finalize:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi hoàn tất thôi việc' });
  }
});

export default router;
