import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

// 1. GET: Danh sách Quyết định Nhân sự
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { type, status, employeeId } = req.query;
    
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

// 2. GET: Chi tiết 1 Quyết định
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
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
    return res.json(decision);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin quyết định' });
  }
});

// 3. POST: Khởi tạo Quyết định Nhân sự mới
router.post('/', async (req: Request, res: Response): Promise<any> => {
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
      signBy
    } = req.body;

    if (!title || !type || !employeeId) {
      return res.status(400).json({ error: 'Vui lòng điền đủ Tiêu đề, Loại quyết định và Nhân sự áp dụng' });
    }

    // Tự sinh số quyết định nếu không nhập (VD: QD-2026/001)
    let finalDecNumber = decisionNumber;
    if (!finalDecNumber) {
      const year = new Date().getFullYear();
      const count = await prisma.decision.count();
      finalDecNumber = `QĐ-${year}/${String(count + 1).padStart(3, '0')}`;
    }

    // Lấy thông tin hiện tại của nhân sự để lưu snapshot
    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { contracts: { where: { status: 'ACTIVE' } } }
    });

    if (!emp) return res.status(404).json({ error: 'Nhân sự không tồn tại' });

    const currentSalary = emp.contracts[0]?.baseSalary || 0;
    const currentDeptId = emp.departmentId || null;
    const currentPosId = emp.positionId || null;

    const newDecision = await prisma.decision.create({
      data: {
        decisionNumber: finalDecNumber,
        title,
        type,
        employeeId,
        oldSalary: oldSalary !== undefined ? oldSalary : currentSalary,
        newSalary: newSalary !== undefined ? newSalary : null,
        oldDepartmentId: oldDepartmentId || currentDeptId,
        newDepartmentId: newDepartmentId || null,
        oldPositionId: oldPositionId || currentPosId,
        newPositionId: newPositionId || null,
        reason: reason || '',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        status: 'PENDING',
        signBy: signBy || 'Ban Giám Đốc'
      }
    });

    return res.status(201).json(newDecision);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Số quyết định đã tồn tại, vui lòng chọn số khác!' });
    }
    return res.status(500).json({ error: 'Lỗi khi tạo quyết định nhân sự' });
  }
});

// 4. PUT: Phê duyệt & Ban hành Quyết định (Tự động cập nhật Hồ sơ & Hợp đồng/Lương)
router.put('/:id/approve', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { signBy } = req.body;

    const decision = await prisma.decision.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!decision) return res.status(404).json({ error: 'Không tìm thấy quyết định' });
    if (decision.status === 'APPROVED') {
      return res.status(400).json({ error: 'Quyết định này đã được phê duyệt và ban hành trước đó!' });
    }

    // Tiến hành cập nhật trạng thái Decision
    const updatedDecision = await prisma.decision.update({
      where: { id },
      data: {
        status: 'APPROVED',
        signDate: new Date(),
        signBy: signBy || decision.signBy || 'Ban Giám Đốc'
      }
    });

    const empId = decision.employeeId;
    const effDate = decision.effectiveDate || new Date();

    // Áp dụng biến động nghiệp vụ theo loại quyết định:
    // A. ĐIỀU CHỈNH LƯƠNG
    if (decision.type === 'SALARY_ADJUSTMENT' && decision.newSalary) {
      // 1. Cập nhật hợp đồng đang có hiệu lực
      const activeContract = await prisma.contract.findFirst({
        where: { employeeId: empId, status: 'ACTIVE' }
      });
      if (activeContract) {
        await prisma.contract.update({
          where: { id: activeContract.id },
          data: { baseSalary: decision.newSalary }
        });
      }

      // 2. Ghi nhật ký biến động công tác
      await prisma.employmentHistory.create({
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
    if (decision.type === 'PROMOTION' && decision.newPositionId) {
      await prisma.employee.update({
        where: { id: empId },
        data: { positionId: decision.newPositionId }
      });

      await prisma.employmentHistory.create({
        data: {
          employeeId: empId,
          departmentId: decision.newDepartmentId || decision.oldDepartmentId || undefined,
          positionId: decision.newPositionId,
          changeReason: `Bổ nhiệm chức vụ mới theo ${decision.decisionNumber}`,
          effectiveDate: effDate
        }
      });
    }

    // C. ĐIỀU CHUYỂN PHÒNG BAN
    if (decision.type === 'TRANSFER' && decision.newDepartmentId) {
      await prisma.employee.update({
        where: { id: empId },
        data: {
          departmentId: decision.newDepartmentId,
          positionId: decision.newPositionId || undefined
        }
      });

      await prisma.employmentHistory.create({
        data: {
          employeeId: empId,
          departmentId: decision.newDepartmentId,
          positionId: decision.newPositionId || decision.oldPositionId || undefined,
          changeReason: `Điều chuyển đơn vị công tác theo ${decision.decisionNumber}`,
          effectiveDate: effDate
        }
      });
    }

    // D. THÔI VIỆC / CHẤM DỨT HỢP ĐỒNG
    if (decision.type === 'TERMINATION') {
      await prisma.employee.update({
        where: { id: empId },
        data: { status: 'RESIGNED' }
      });

      // Chấm dứt hợp đồng lao động
      await prisma.contract.updateMany({
        where: { employeeId: empId, status: 'ACTIVE' },
        data: { status: 'TERMINATED', endDate: effDate }
      });

      await prisma.employmentHistory.create({
        data: {
          employeeId: empId,
          changeReason: `Thôi việc theo quyết định ${decision.decisionNumber}`,
          effectiveDate: effDate
        }
      });
    }

    // E. KHEN THƯỞNG / KỶ LUẬT
    if (decision.type === 'REWARD' || decision.type === 'DISCIPLINE') {
      await prisma.employmentHistory.create({
        data: {
          employeeId: empId,
          changeReason: `${decision.type === 'REWARD' ? 'Khen thưởng' : 'Kỷ luật'}: ${decision.title} (${decision.decisionNumber})`,
          effectiveDate: effDate
        }
      });
    }

    return res.json({
      message: `Đã phê duyệt và ban hành quyết định ${decision.decisionNumber} thành công! Hồ sơ nhân sự và bảng lương đã được tự động đồng bộ.`,
      decision: updatedDecision
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi khi phê duyệt quyết định' });
  }
});

// 5. PUT: Từ chối / Hủy quyết định
router.put('/:id/reject', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const updated = await prisma.decision.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reason: reason ? `[TỪ CHỐI]: ${reason}` : undefined
      }
    });

    return res.json({ message: 'Đã từ chối quyết định', decision: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi từ chối quyết định' });
  }
});

// 6. DELETE: Xóa quyết định nháp
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const dec = await prisma.decision.findUnique({ where: { id } });
    if (!dec) return res.status(404).json({ error: 'Không tìm thấy quyết định' });
    if (dec.status === 'APPROVED') {
      return res.status(400).json({ error: 'Không thể xóa quyết định đã được ban hành!' });
    }

    await prisma.decision.delete({ where: { id } });
    return res.json({ message: 'Đã xóa quyết định thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa quyết định' });
  }
});

export default router;
