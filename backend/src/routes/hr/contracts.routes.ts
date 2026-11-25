import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { getSettingValue } from '../system/setting.routes';

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

    const warnDays = Number(await getSettingValue('CONTRACT_EXPIRY_WARN_DAYS', 30)) || 30;
    const nowMs = Date.now();

    const userRole = (req as any).user?.role?.toUpperCase();
    const userEmpId = (req as any).user?.employeeId;

    const contracts = await prisma.contract.findMany({
      where: userRole === 'EMPLOYEE' && userEmpId ? { employeeId: userEmpId } : undefined,
      include: {
        employee: {
          select: { fullName: true, code: true, highestEducation: true, department: { select: { name: true } }, position: { select: { title: true, level: true } } }
        },
        appendices: {
          orderBy: { effectiveDate: 'desc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    const enriched = contracts.map(c => {
      const daysUntilExpiry = c.endDate ? Math.ceil((new Date(c.endDate).getTime() - nowMs) / (1000 * 60 * 60 * 24)) : null;
      return {
        ...c,
        daysUntilExpiry,
        expiryWarnDays: warnDays,
        isExpiringSoon: c.status === 'ACTIVE' && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= warnDays
      };
    });

    res.json(enriched);
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
    
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ nhân sự để ký hợp đồng.' });
    }

    if (emp.status === 'RESIGNED') {
      return res.status(400).json({ error: 'Không thể tạo hợp đồng mới cho nhân viên đã thôi việc (RESIGNED).' });
    }

    // Nếu Đánh giá KHÔNG ĐẠT thử việc: Chấm dứt thử việc & Chuyển sang thôi việc (Không tạo HĐ mới rác theo chuẩn BLLĐ 2019)
    if (evaluationResult === 'FAILED') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const effDate = endDate ? new Date(endDate) : now;
      const result = await prisma.$transaction(async (tx) => {
        await tx.contract.updateMany({
          where: { employeeId, status: 'ACTIVE' },
          data: { 
            status: 'TERMINATED', 
            endDate: effDate, 
            appendixNote: appendixNote ? String(appendixNote).trim() : 'Không đạt đánh giá thử việc (Điều 27 BLLĐ 2019)' 
          }
        });
        const updatedEmployee = await tx.employee.update({
          where: { id: employeeId },
          data: {
            status: 'RESIGNED',
            resignationDate: effDate,
            resignationReason: appendixNote || (contractType === 'INTERNSHIP' ? 'Không đạt đánh giá thực tập' : 'Không đạt đánh giá thử việc')
          }
        });
        await tx.account.updateMany({
          where: { employeeId },
          data: { isActive: false }
        });
        return { contract: null, employee: updatedEmployee };
      });
      return res.status(200).json(result);
    }

    if (!contractType || !baseSalary || !startDate) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ: Nhân viên, loại hợp đồng, lương cơ bản và ngày bắt đầu.' });
    }

    const start = new Date(startDate);
    let end = endDate ? new Date(endDate) : null;

    if (contractType === 'INDEFINITE') {
      end = null; // Hợp đồng không xác định thời hạn không có endDate
    } else if (end && end < start) {
      return res.status(400).json({ error: 'Ngày kết thúc hợp đồng không thể trước ngày bắt đầu.' });
    }

    // Tuân thủ Khoản 2 Điều 20 Bộ luật Lao động 2019:
    // Tối đa N lần ký Hợp đồng xác định thời hạn (MAX_DEFINITE_CONTRACTS = 2), lần tiếp theo phải là Không xác định thời hạn (INDEFINITE)
    if (contractType === 'OFFICIAL_1Y') {
      const maxDefinite = Number(await getSettingValue('MAX_DEFINITE_CONTRACTS', 2)) || 2;
      const definiteCount = await prisma.contract.count({
        where: {
          employeeId,
          contractType: 'OFFICIAL_1Y',
          status: { in: ['ACTIVE', 'EXPIRED', 'TERMINATED'] }
        }
      });
      if (definiteCount >= maxDefinite) {
        return res.status(400).json({ 
          error: `Theo Khoản 2 Điều 20 Bộ luật Lao động 2019, nhân sự này đã ký đủ ${maxDefinite} lần Hợp đồng xác định thời hạn. Lần ký tiếp theo bắt buộc phải là Hợp đồng không xác định thời hạn (INDEFINITE).` 
        });
      }
    }

    // Tuân thủ Điều 25 Bộ luật Lao động 2019 & Quy chế công ty:
    // Thử việc tối đa 60 ngày (2 tháng) đối với chuyên môn/đại học, 30 ngày đối với trung cấp/công nhân kỹ thuật.
    // Thực tập tối đa 3 tháng (93 ngày).
    if (contractType === 'PROBATION') {
      if (!end) {
        return res.status(400).json({ error: 'Hợp đồng thử việc bắt buộc phải có ngày kết thúc (Điều 25 BLLĐ 2019).' });
      }
      const probUniDays = Number(await getSettingValue('PROBATION_PERIOD_DAYS', 60)) || 60;
      const probColDays = Number(await getSettingValue('PROBATION_PERIOD_COLLEGE', 30)) || 30;
      const edu = (emp.highestEducation || '').toLowerCase();
      const isCollegeOrVocational = edu.includes('cao đẳng') || edu.includes('trung cấp') || edu.includes('sơ cấp');
      const maxProbationDays = isCollegeOrVocational ? probColDays : probUniDays;

      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > maxProbationDays) {
        return res.status(400).json({ 
          error: `Thời gian thử việc vượt quá giới hạn tối đa theo quy định (Tối đa ${maxProbationDays} ngày / 2 tháng, hiện tại: ${diffDays} ngày).` 
        });
      }
    } else if (contractType === 'INTERNSHIP') {
      if (!end) {
        return res.status(400).json({ error: 'Hợp đồng thực tập bắt buộc phải có ngày kết thúc.' });
      }
      const maxInternDays = Number(await getSettingValue('MAX_INTERNSHIP_DAYS', 93)) || 93; // Mặc định 3 tháng
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > maxInternDays) {
        return res.status(400).json({
          error: `Thời gian thực tập vượt quá giới hạn tối đa theo quy định của công ty (Tối đa ${maxInternDays} ngày, hiện tại: ${diffDays} ngày).`
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

      // Xử lý Đồng bộ trạng thái Nhân sự theo giai đoạn (Thực tập 3T -> Thử việc 2T -> Chính thức)
      let updatedEmployee = null;
      if (contractType === 'INTERNSHIP') {
        updatedEmployee = await tx.employee.update({
          where: { id: employeeId },
          data: { status: 'INTERNSHIP', probationEndDate: null }
        });
      } else if (contractType === 'PROBATION') {
        updatedEmployee = await tx.employee.update({
          where: { id: employeeId },
          data: { status: 'PROBATION', probationEndDate: end }
        });
      } else if (evaluationResult === 'PASSED' && (contractType === 'OFFICIAL_1Y' || contractType === 'INDEFINITE')) {
        updatedEmployee = await tx.employee.update({
          where: { id: employeeId },
          data: { status: 'ACTIVE', officialJoinDate: start }
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
