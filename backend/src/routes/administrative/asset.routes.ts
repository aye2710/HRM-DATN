import express, { Request, Response } from 'express';
import { prisma } from '../../db';
import { AssetCategory, AssetStatus, AssignmentStatus } from '@prisma/client';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = express.Router();

// Áp dụng xác thực cho toàn bộ phân hệ Quản lý Tài sản
router.use(authenticateToken);

const itOrHrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'IT_SUPPORT');

// Helper to seed demo assets if empty
const seedDemoAssets = async () => {
  const count = await prisma.asset.count();
  if (count > 0) return;

  const demoAssets = [
    {
      code: 'TS-LAP-001',
      name: 'MacBook Pro 14" M3 Pro 18GB/512GB Space Black',
      category: AssetCategory.LAPTOP,
      serialNumber: 'C02G90XXMD6M',
      price: 49990000,
      purchaseDate: new Date('2025-11-15'),
      supplier: 'FPT Synnex Distribution',
      status: AssetStatus.AVAILABLE,
      condition: 'Mới 100%, nguyên hộp',
      location: 'Kho CNTT - Tủ A1',
      notes: 'Trang bị cho Senior Software Engineer / Tech Lead'
    },
    {
      code: 'TS-LAP-002',
      name: 'Dell XPS 15 9530 i7-13700H 32GB RTX 4060',
      category: AssetCategory.LAPTOP,
      serialNumber: 'DL-XPS-883921',
      price: 42500000,
      purchaseDate: new Date('2025-10-01'),
      supplier: 'Hapro Distribution',
      status: AssetStatus.AVAILABLE,
      condition: 'Hoạt động tốt 99%, có dán màn hình',
      location: 'Kho CNTT - Tủ A1',
      notes: 'Thiết bị đồ họa / kỹ thuật'
    },
    {
      code: 'TS-MON-001',
      name: 'Dell UltraSharp 27" U2724D 2K IPS Black 120Hz',
      category: AssetCategory.MONITOR,
      serialNumber: 'CN-0K793H-74443',
      price: 10490000,
      purchaseDate: new Date('2025-11-20'),
      supplier: 'Hapro Distribution',
      status: AssetStatus.AVAILABLE,
      condition: 'Hoạt động hoàn hảo, không điểm chết',
      location: 'Kho CNTT - Kệ Màn Hình',
      notes: 'Màn hình đồ họa / code'
    }
  ];

  for (const a of demoAssets) {
    await prisma.asset.create({ data: a });
  }
};

// 1. GET /api/assets/stats - Thống kê tài sản kho
router.get('/stats', async (req: Request, res: Response) => {
  try {
    await seedDemoAssets();

    const [total, available, assigned, maintenance, disposed, assets] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      prisma.asset.count({ where: { status: AssetStatus.ASSIGNED } }),
      prisma.asset.count({ where: { status: AssetStatus.MAINTENANCE } }),
      prisma.asset.count({ where: { status: AssetStatus.DISPOSED } }),
      prisma.asset.findMany({ select: { price: true } })
    ]);

    const totalValue = assets.reduce((sum, a) => sum + Number(a.price || 0), 0);

    res.json({
      total,
      available,
      assigned,
      maintenance,
      disposed,
      totalValue
    });
  } catch (error: any) {
    console.error('Error fetching asset stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/assets - Danh sách danh mục tài sản (kèm tìm kiếm và lọc)
router.get('/', async (req: Request, res: Response) => {
  try {
    await seedDemoAssets();

    const { search, category, status } = req.query;

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category as AssetCategory;
    }
    if (status && status !== 'ALL') {
      where.status = status as AssetStatus;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          where: { status: AssignmentStatus.ACTIVE },
          include: {
            employee: {
              select: {
                id: true,
                code: true,
                fullName: true,
                department: { select: { name: true } },
                position: { select: { title: true } }
              }
            }
          },
          take: 1
        }
      }
    });

    res.json(assets);
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/assets/assignments - Danh sách lịch sử bàn giao & thu hồi (Chống IDOR: Nhân viên chỉ xem tài sản của mình)
router.get('/assignments', async (req: any, res: Response): Promise<any> => {
  try {
    const { status } = req.query;
    let employeeId = req.query.employeeId as string;
    const userRole = req.user?.role?.toUpperCase();

    // Chặn IDOR: Nhân viên thường chỉ được xem các lượt bàn giao tài sản của chính mình
    if (userRole === 'EMPLOYEE') {
      employeeId = req.user.employeeId;
    }

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status as AssignmentStatus;
    }
    if (employeeId && typeof employeeId === 'string') {
      where.employeeId = employeeId;
    }

    const assignments = await prisma.assetAssignment.findMany({
      where,
      orderBy: { assignedDate: 'desc' },
      include: {
        asset: true,
        employee: {
          select: {
            id: true,
            code: true,
            fullName: true,
            email: true,
            department: { select: { name: true } },
            position: { select: { title: true } }
          }
        }
      }
    });

    return res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. POST /api/assets - Thêm mới tài sản vào kho (IT/HR Only)
router.post('/', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { code, name, category, serialNumber, price, purchaseDate, supplier, condition, location, notes } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tên thiết bị không được để trống.' });
    }

    // Auto generate code if empty
    let assetCode = code ? String(code).trim().toUpperCase() : null;
    if (!assetCode) {
      const prefix = category ? String(category).slice(0, 3) : 'GEN';
      const count = await prisma.asset.count();
      assetCode = `TS-${prefix}-${String(count + 1).padStart(3, '0')}`;
    }

    const existing = await prisma.asset.findUnique({ where: { code: assetCode } });
    if (existing) {
      return res.status(400).json({ error: `Mã tài sản "${assetCode}" đã tồn tại trong hệ thống.` });
    }

    const asset = await prisma.asset.create({
      data: {
        code: assetCode,
        name: String(name).trim(),
        category: category || AssetCategory.LAPTOP,
        serialNumber: serialNumber ? String(serialNumber).trim() : null,
        price: price !== undefined ? Number(price) : 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        supplier: supplier ? String(supplier).trim() : null,
        condition: condition ? String(condition).trim() : 'Mới 100%',
        location: location ? String(location).trim() : 'Kho CNTT',
        notes: notes ? String(notes).trim() : null,
        status: AssetStatus.AVAILABLE
      }
    });

    await createAuditLog({
      action: 'CREATE_ASSET',
      tableName: 'Asset',
      recordId: asset.id,
      accountId: req.user?.accountId,
      details: `Nhập kho tài sản mới: [${asset.code}] ${asset.name}`
    });

    return res.status(201).json(asset);
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nhập kho tài sản' });
  }
});

// 5. PUT /api/assets/:id - Sửa thông tin tài sản (IT/HR Only)
router.put('/:id', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, category, serialNumber, price, purchaseDate, supplier, status, condition, location, notes } = req.body;

    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy tài sản để cập nhật.' });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(category && { category }),
        ...(serialNumber !== undefined && { serialNumber: serialNumber ? String(serialNumber).trim() : null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(supplier !== undefined && { supplier: supplier ? String(supplier).trim() : null }),
        ...(status && { status }),
        ...(condition !== undefined && { condition: condition ? String(condition).trim() : null }),
        ...(location !== undefined && { location: location ? String(location).trim() : null }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null })
      }
    });

    await createAuditLog({
      action: 'UPDATE_ASSET',
      tableName: 'Asset',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Cập nhật thông tin tài sản [${updated.code}]`
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Error updating asset:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. DELETE /api/assets/:id - Xóa tài sản (IT/HR Only - Chặn xóa nếu đang được bàn giao)
router.delete('/:id', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignments: { where: { status: AssignmentStatus.ACTIVE } } }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy tài sản' });
    }

    if (asset.assignments && asset.assignments.length > 0) {
      return res.status(400).json({ error: 'Tài sản đang được nhân viên sử dụng. Hãy làm thủ tục thu hồi trước khi xóa!' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assetAssignment.deleteMany({ where: { assetId: id } });
      await tx.asset.delete({ where: { id } });
    });

    await createAuditLog({
      action: 'DELETE_ASSET',
      tableName: 'Asset',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Xóa tài sản khỏi danh mục kho: [${asset.code}] ${asset.name}`
    });

    return res.json({ message: 'Xóa tài sản thành công' });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 7. POST /api/assets/assign - Bàn giao tài sản cho nhân sự (Biểu mẫu BM01 - IT/HR Only)
router.post('/assign', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { assetId, employeeId, assignedDate, conditionOnAssign, handoverDocCode, notes } = req.body;

    if (!assetId || !employeeId) {
      return res.status(400).json({ error: 'Vui lòng chọn tài sản và nhân viên nhận bàn giao' });
    }

    // Kiểm tra nhân viên còn đang làm việc
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin nhân viên nhận bàn giao' });
    }
    if (emp.status === 'RESIGNED') {
      return res.status(400).json({ error: 'Không thể bàn giao tài sản cho nhân sự đã thôi việc (RESIGNED)!' });
    }

    const docCode = handoverDocCode || `BB-BG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const assignment = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error('Tài sản không tồn tại');

      if (asset.status === AssetStatus.ASSIGNED) {
        throw new Error('Tài sản này đang được bàn giao cho nhân sự khác');
      }

      if (asset.status === AssetStatus.MAINTENANCE || asset.status === AssetStatus.DISPOSED) {
        throw new Error('Tài sản đang bảo trì hoặc đã thanh lý, không thể bàn giao');
      }

      const newAssignment = await tx.assetAssignment.create({
        data: {
          assetId,
          employeeId,
          assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
          conditionOnAssign: conditionOnAssign || 'Thiết bị hoạt động bình thường, đầy đủ phụ kiện',
          handoverDocCode: docCode,
          notes: notes ? String(notes).trim() : null,
          status: AssignmentStatus.ACTIVE
        },
        include: {
          asset: true,
          employee: {
            select: { id: true, code: true, fullName: true, department: { select: { name: true } } }
          }
        }
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.ASSIGNED }
      });

      return newAssignment;
    });

    await createAuditLog({
      action: 'ASSIGN_ASSET',
      tableName: 'AssetAssignment',
      recordId: assignment.id,
      accountId: req.user?.accountId,
      details: `Bàn giao tài sản [${assignment.asset.name} - ${assignment.asset.code}] cho nhân viên [${assignment.employee.fullName}] theo biên bản ${docCode}`
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error assigning asset:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi bàn giao tài sản' });
  }
});

// 8. POST /api/assets/assignments/:id/return - Thu hồi / Hoàn trả tài sản (Biểu mẫu BM02 - IT/HR Only)
router.post('/assignments/:id/return', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { returnedDate, conditionOnReturn, notes, nextAssetStatus } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({
        where: { id },
        include: { asset: true, employee: { select: { fullName: true } } }
      });

      if (!assignment) {
        throw new Error('Không tìm thấy phiếu bàn giao');
      }

      if (assignment.status === AssignmentStatus.RETURNED) {
        throw new Error('Tài sản này đã được thu hồi trước đó');
      }

      const updatedAssignment = await tx.assetAssignment.update({
        where: { id },
        data: {
          returnedDate: returnedDate ? new Date(returnedDate) : new Date(),
          conditionOnReturn: conditionOnReturn || 'Thiết bị hoàn trả nguyên vẹn',
          notes: notes ? `${assignment.notes ? assignment.notes + ' | ' : ''}Thu hồi: ${notes}` : assignment.notes,
          status: AssignmentStatus.RETURNED
        }
      });

      const targetStatus = nextAssetStatus || AssetStatus.AVAILABLE;
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: {
          status: targetStatus,
          condition: conditionOnReturn || assignment.asset?.condition
        }
      });

      return { updatedAssignment, assetName: assignment.asset.name, employeeName: assignment.employee.fullName };
    });

    await createAuditLog({
      action: 'RETURN_ASSET',
      tableName: 'AssetAssignment',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Thu hồi tài sản [${result.assetName}] từ nhân viên [${result.employeeName}]`
    });

    return res.json({ message: 'Thu hồi tài sản thành công', assignment: result.updatedAssignment });
  } catch (error: any) {
    console.error('Error returning asset:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi thu hồi tài sản' });
  }
});

export default router;
