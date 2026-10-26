import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Áp dụng xác thực cho toàn bộ phân hệ Quản lý Hợp đồng lao động
router.use(authenticateToken);
const cbOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'CB_SPECIALIST', 'HR_STAFF');

// GET: Lấy danh sách Hợp đồng
router.get('/', async (req: Request, res: Response) => {
  try {
    // Tự động chuyển các hợp đồng đã hết hạn (endDate < hiện tại) sang EXPIRED
    await prisma.contract.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    const contracts = await prisma.contract.findMany({
      include: {
        employee: {
          select: { fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
        },
        appendices: {
          orderBy: { effectiveDate: 'desc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách hợp đồng' });
  }
});

// POST: Tạo Hợp đồng mới (CB/HR Only + Ràng buộc BLLĐ 2019)
router.post('/', cbOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      employeeId, contractNumber, contractType, baseSalary, allowance, insuranceSalary, paymentMethod,
      startDate, endDate, signBy, signDate, workLocation, appendixNote, evaluationResult, fileUrl 
    } = req.body;
    
    if (!employeeId || !contractType || !baseSalary || !startDate) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ: Nhân viên, loại hợp đồng, lương cơ bản và ngày bắt đầu.' });
    }

    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân sự để ký hợp đồng.' });
    }

    if (emp.status === 'RESIGNED') {
      return res.status(400).json({ error: 'Không thể tạo hợp đồng mới cho nhân viên đã thôi việc (RESIGNED).' });
    }

    const start = new Date(startDate);
    let end = endDate ? new Date(endDate) : null;

    if (contractType === 'INDEFINITE') {
      end = null; // Hợp đồng không xác định thời hạn không có endDate
    } else if (end && end < start) {
      return res.status(400).json({ error: 'Ngày kết thúc hợp đồng không thể trước ngày bắt đầu.' });
    }

    // Tuân thủ Khoản 2 Điều 20 Bộ luật Lao động 2019:
    // Tối đa 02 lần ký Hợp đồng xác định thời hạn (OFFICIAL_1Y), lần tiếp theo phải là Không xác định thời hạn (INDEFINITE)
    if (contractType === 'OFFICIAL_1Y') {
      const definiteCount = await prisma.contract.count({
        where: {
          employeeId,
          contractType: 'OFFICIAL_1Y',
          status: { in: ['ACTIVE', 'EXPIRED'] }
        }
      });
      if (definiteCount >= 2) {
        return res.status(400).json({ 
          error: `Theo Khoản 2 Điều 20 Bộ luật Lao động 2019, nhân sự này đã ký đủ 02 lần Hợp đồng xác định thời hạn. Lần ký tiếp theo bắt buộc phải là Hợp đồng không xác định thời hạn (INDEFINITE).` 
        });
      }
    }

    // Tuân thủ Điều 25 Bộ luật Lao động 2019: Thời hạn thử việc tối đa không quá 180 ngày
    if (contractType === 'PROBATION') {
      if (!end) {
        return res.status(400).json({ error: 'Hợp đồng thử việc bắt buộc phải có ngày kết thúc (Điều 25 BLLĐ 2019).' });
      }
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 180) {
        return res.status(400).json({ 
          error: `Thời gian thử việc không được vượt quá 180 ngày theo Điều 25 Bộ luật Lao động 2019 (Hiện tại: ${diffDays} ngày).` 
        });
      }
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const contractStart = new Date(startDate);
    contractStart.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      // Quy tắc BR-CHR-02-01 (Tính độc quyền hiệu lực):
      if (contractStart <= now) {
        await tx.contract.updateMany({
          where: {
            employeeId,
            status: 'ACTIVE'
          },
          data: {
            status: 'EXPIRED'
          }
        });
      }

      // Tạo hợp đồng mới
      const newContract = await tx.contract.create({
        data: {
          employeeId,
          contractNumber: contractNumber ? String(contractNumber).trim() : `HĐLĐ-${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}/LLA`,
          contractType,
          baseSalary: Number(baseSalary),
          allowance: allowance !== undefined ? Number(allowance) : 0,
          insuranceSalary: insuranceSalary !== undefined && insuranceSalary !== '' ? Number(insuranceSalary) : Number(baseSalary),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          startDate: start,
          endDate: end,
          signBy: signBy ? String(signBy).trim() : 'Ban Giám Đốc',
          signDate: signDate ? new Date(signDate) : new Date(),
          workLocation: workLocation ? String(workLocation).trim() : (emp.workLocation || 'Trụ sở chính'),
          appendixNote: appendixNote ? String(appendixNote).trim() : null,
          fileUrl: fileUrl || null,
          status: 'ACTIVE'
        }
      });

      // Xử lý Đánh giá Thử việc: Cập nhật Trạng thái Nhân viên
      let updatedEmployee = null;
      if (evaluationResult === 'PASSED') {
        if (contractType === 'OFFICIAL_1Y' || contractType === 'INDEFINITE') {
          updatedEmployee = await tx.employee.update({
            where: { id: employeeId },
            data: { status: 'ACTIVE', officialJoinDate: start }
          });
        }
      } else if (evaluationResult === 'FAILED') {
        updatedEmployee = await tx.employee.update({
          where: { id: employeeId },
          data: { status: 'RESIGNED', resignationDate: end || now, resignationReason: 'Không đạt đánh giá thử việc' }
        });
      }

      return { contract: newContract, employee: updatedEmployee };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create Contract Error:", error);
    return res.status(500).json({ error: 'Lỗi khi tạo hợp đồng mới' });
  }
});

// PATCH: Cập nhật thông tin / tải ảnh hợp đồng đã ký (CB/HR Only)
router.patch('/:id', cbOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { 
      fileUrl, status, contractType, contractNumber, baseSalary, allowance, insuranceSalary, 
      paymentMethod, startDate, endDate, signBy, signDate, workLocation, appendixNote 
    } = req.body;
    
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...(fileUrl !== undefined && { fileUrl }),
        ...(status !== undefined && { status }),
        ...(contractType !== undefined && { contractType }),
        ...(contractNumber !== undefined && { contractNumber: contractNumber ? String(contractNumber).trim() : null }),
        ...(baseSalary !== undefined && { baseSalary: Number(baseSalary) }),
        ...(allowance !== undefined && { allowance: Number(allowance) }),
        ...(insuranceSalary !== undefined && { insuranceSalary: insuranceSalary ? Number(insuranceSalary) : null }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(signBy !== undefined && { signBy: signBy ? String(signBy).trim() : null }),
        ...(signDate !== undefined && { signDate: signDate ? new Date(signDate) : null }),
        ...(workLocation !== undefined && { workLocation: workLocation ? String(workLocation).trim() : null }),
        ...(appendixNote !== undefined && { appendixNote: appendixNote ? String(appendixNote).trim() : null })
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Update Contract Error:", error);
    return res.status(500).json({ error: 'Lỗi khi cập nhật hợp đồng' });
  }
});

// DELETE: Xóa Hợp đồng (CB/HR Only)
router.delete('/:id', cbOnly, async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.contract.delete({ where: { id } });
    return res.json({ message: 'Xóa hợp đồng thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi xóa hợp đồng' });
  }
});

export default router;
