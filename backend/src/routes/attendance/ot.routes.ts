import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

// 1. Lấy danh sách đăng ký làm thêm giờ (HR / Quản lý)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const month = req.query.month as string; // YYYY-MM
    const employeeId = req.query.employeeId as string;
    const status = req.query.status as string;

    const where: any = {};
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.oTRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, fullName: true, code: true, department: { select: { name: true } } }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(requests);
  } catch (error: any) {
    console.error('Error fetching OT requests:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách làm thêm giờ' });
  }
});

// 2. Lấy danh sách OT của cá nhân (Cổng ESS)
router.get('/employee/:employeeId', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const month = req.query.month as string;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(year, m - 1, 1);
      endDate = new Date(year, m, 0, 23, 59, 59);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const requests = await prisma.oTRequest.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' }
    });

    let totalRequestedHours = 0;
    let totalApprovedHours = 0;

    for (const r of requests) {
      totalRequestedHours += Number(r.requestHours || 0);
      if (r.status === 'APPROVED') {
        totalApprovedHours += Number(r.actualHours || r.requestHours || 0);
      }
    }

    res.json({
      requests,
      summary: {
        month: month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        totalRequestedHours,
        totalApprovedHours
      }
    });
  } catch (error: any) {
    console.error('Error fetching employee OT:', error);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử làm thêm giờ cá nhân' });
  }
});

// 3. Đăng ký làm thêm giờ (Tuân thủ Điều 107 Bộ luật Lao động 2019)
router.post('/', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { employeeId, date, requestHours, reason } = req.body;
    const empId = employeeId || req.user?.employeeId;

    if (!empId || !date || !requestHours) {
      return res.status(400).json({ error: 'Vui lòng điền đủ thông tin ngày làm và số giờ OT.' });
    }

    const hours = Number(requestHours);
    if (isNaN(hours) || hours <= 0) {
      return res.status(400).json({ error: 'Số giờ làm thêm phải lớn hơn 0.' });
    }

    // Điều 107 Khoản 2 Điểm b BLLĐ 2019: Số giờ làm thêm không quá 4 giờ/ngày
    if (hours > 4) {
      return res.status(400).json({
        error: 'Quy định Pháp luật Lao động (Điều 107 BLLĐ 2019): Số giờ làm thêm không được vượt quá 4 giờ trong 01 ngày.'
      });
    }

    const otDate = new Date(date);
    otDate.setHours(0, 0, 0, 0);

    // Kiểm tra giới hạn tháng (không quá 40 giờ/tháng)
    const monthStart = new Date(otDate.getFullYear(), otDate.getMonth(), 1);
    const monthEnd = new Date(otDate.getFullYear(), otDate.getMonth() + 1, 0, 23, 59, 59);

    const existingMonthOT = await prisma.oTRequest.findMany({
      where: {
        employeeId: empId,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    const monthAccumulatedHours = existingMonthOT.reduce(
      (sum, r) => sum + Number(r.status === 'APPROVED' ? (r.actualHours || r.requestHours) : r.requestHours),
      0
    );

    if (monthAccumulatedHours + hours > 40) {
      return res.status(400).json({
        error: `Vượt quá giới hạn làm thêm tháng theo quy định (Điều 107 BLLĐ 2019): Bạn đã đăng ký ${monthAccumulatedHours}h trong tháng này. Tổng số giờ làm thêm không được vượt quá 40 giờ/tháng.`
      });
    }

    const newRequest = await prisma.oTRequest.create({
      data: {
        employeeId: empId,
        date: otDate,
        requestHours: hours as any,
        actualHours: 0 as any,
        reason: reason || null,
        status: 'PENDING'
      }
    });

    await createAuditLog({
      action: 'SUBMIT_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: newRequest.id,
      accountId: req.user?.accountId,
      details: `Đăng ký làm thêm ${hours}h ngày ${date}. Lý do: ${reason || 'Không'}`
    });

    res.status(201).json({
      message: 'Đăng ký làm thêm giờ thành công, đang chờ Quản lý phê duyệt.',
      request: newRequest
    });
  } catch (error: any) {
    console.error('Error creating OT request:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi gửi yêu cầu làm thêm giờ' });
  }
});

// 4. Phê duyệt / Từ chối đơn làm thêm giờ
router.put('/:id/status', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, actualHours } = req.body; // APPROVED | REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ.' });
    }

    const request = await prisma.oTRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy đơn làm thêm giờ.' });
    }

    const confirmedActualHours = status === 'APPROVED'
      ? (actualHours !== undefined ? Number(actualHours) : Number(request.requestHours))
      : 0;

    const updated = await prisma.oTRequest.update({
      where: { id },
      data: {
        status,
        actualHours: confirmedActualHours as any
      }
    });

    await createAuditLog({
      action: status === 'APPROVED' ? 'APPROVE_OT_REQUEST' : 'REJECT_OT_REQUEST',
      tableName: 'OTRequest',
      recordId: id,
      accountId: req.user?.accountId,
      details: `${status === 'APPROVED' ? `Phê duyệt OT (${confirmedActualHours} giờ)` : 'Từ chối đơn OT'} #${id}`
    });

    res.json({
      message: `Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn làm thêm giờ.`,
      request: updated
    });
  } catch (error: any) {
    console.error('Error updating OT status:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi cập nhật trạng thái OT' });
  }
});

// 5. Hủy đơn làm thêm giờ (Nếu còn ở trạng thái PENDING)
router.delete('/:id', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const request = await prisma.oTRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy đơn làm thêm giờ.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn đang chờ duyệt (PENDING).' });
    }

    await prisma.oTRequest.delete({ where: { id } });
    res.json({ message: 'Đã hủy đơn làm thêm giờ thành công.' });
  } catch (error: any) {
    console.error('Error deleting OT request:', error);
    res.status(500).json({ error: 'Lỗi khi hủy đơn OT' });
  }
});

export default router;
