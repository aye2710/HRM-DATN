import express, { Request, Response } from 'express';
import { prisma } from '../../db';
import { AssetCategory, AssetStatus, AssignmentStatus } from '@prisma/client';

const router = express.Router();

// Helper to seed demo assets if empty
const seedDemoAssets = async () => {
  const count = await prisma.asset.count();
  if (count > 0) return;

  const employees = await prisma.employee.findMany({ take: 5 });
  
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
      status: AssetStatus.ASSIGNED,
      condition: 'Hoạt động tốt 99%, có dán màn hình',
      location: 'Bàn làm việc - Tầng 4',
      notes: 'Bàn giao cho Trưởng phòng Kỹ thuật'
    },
    {
      code: 'TS-LAP-003',
      name: 'Lenovo ThinkPad T14 Gen 4 Ryzen 7 16GB',
      category: AssetCategory.LAPTOP,
      serialNumber: 'PF-4KN892',
      price: 26800000,
      purchaseDate: new Date('2025-12-05'),
      supplier: 'Phong Vũ Computer',
      status: AssetStatus.AVAILABLE,
      condition: 'Mới 100%, kèm sạc 65W Type-C',
      location: 'Kho CNTT - Tủ A2',
      notes: 'Dành cho nhân sự Onboarding mới'
    },
    {
      code: 'TS-MON-001',
      name: 'Dell UltraSharp 27" U2724D 2K IPS Black 120Hz',
      category: AssetCategory.MONITOR,
      serialNumber: 'CN-0K793H-74443',
      price: 10490000,
      purchaseDate: new Date('2025-11-20'),
      supplier: 'Hapro Distribution',
      status: AssetStatus.ASSIGNED,
      condition: 'Hoạt động hoàn hảo, không điểm chết',
      location: 'Bàn làm việc - Tầng 4',
      notes: 'Màn hình đồ họa / code'
    },
    {
      code: 'TS-MON-002',
      name: 'LG 27UP850N-W 27" 4K UHD Type-C 90W HDR400',
      category: AssetCategory.MONITOR,
      serialNumber: '309NTAK7Y211',
      price: 8900000,
      purchaseDate: new Date('2025-12-10'),
      supplier: 'Phúc Anh Smart World',
      status: AssetStatus.AVAILABLE,
      condition: 'Mới 100%',
      location: 'Kho CNTT - Kệ Màn Hình',
      notes: 'Cấp phát cho Developer'
    },
    {
      code: 'TS-CRD-001',
      name: 'Thẻ từ thang máy & Ra vào văn phòng tòa nhà P.402',
      category: AssetCategory.ACCESS_CARD,
      serialNumber: 'RFID-HEX-99812',
      price: 150000,
      purchaseDate: new Date('2026-01-05'),
      supplier: 'Ban Quản Lý Tòa Nhà',
      status: AssetStatus.ASSIGNED,
      condition: 'Nguyên vẹn kèm dây đeo nhận diện',
      location: 'Văn phòng chính',
      notes: 'Thẻ gửi xe + vào cửa tầng 4'
    },
    {
      code: 'TS-PHN-001',
      name: 'Apple iPhone 15 128GB Black (Test Device)',
      category: AssetCategory.PHONE,
      serialNumber: 'FK2910MQL2',
      price: 19500000,
      purchaseDate: new Date('2025-09-12'),
      supplier: 'Viettel Store',
      status: AssetStatus.MAINTENANCE,
      condition: 'Đang bảo hành pin tại Apple Care+',
      location: 'Phòng Lab QA/QC',
      notes: 'Thiết bị test kiểm thử ứng dụng di động'
    }
  ];

  for (const item of demoAssets) {
    const created = await prisma.asset.create({ data: item });

    // If marked ASSIGNED and we have an employee, create assignment record
    if (item.status === AssetStatus.ASSIGNED && employees.length > 0) {
      const emp = employees[item.code === 'TS-LAP-002' ? 0 : (employees.length > 1 ? 1 : 0)];
      await prisma.assetAssignment.create({
        data: {
          assetId: created.id,
          employeeId: emp.id,
          assignedDate: new Date('2026-01-15'),
          status: AssignmentStatus.ACTIVE,
          conditionOnAssign: 'Máy nguyên tem, bàn phím gõ tốt, sạc cáp đầy đủ',
          handoverDocCode: `BB-BG-2026-${Math.floor(100 + Math.random() * 900)}`,
          notes: 'Biên bản bàn giao thiết bị làm việc chính thức theo biểu mẫu BM-01'
        }
      });
    }
  }
};

// GET /api/assets/stats - Thống kê tài sản
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

// GET /api/assets - Danh sách tài sản (kèm tìm kiếm và lọc)
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

// GET /api/assets/assignments - Danh sách lịch sử bàn giao & thu hồi
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const { status, employeeId } = req.query;
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

    res.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets - Thêm mới tài sản vào kho
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, name, category, serialNumber, price, purchaseDate, supplier, condition, location, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên thiết bị không được để trống' });
    }

    // Auto generate code if empty
    let assetCode = code;
    if (!assetCode) {
      const prefix = category ? String(category).slice(0, 3) : 'GEN';
      const count = await prisma.asset.count();
      assetCode = `TS-${prefix}-${String(count + 1).padStart(3, '0')}`;
    }

    const asset = await prisma.asset.create({
      data: {
        code: assetCode,
        name,
        category: category || AssetCategory.LAPTOP,
        serialNumber: serialNumber || null,
        price: price ? Number(price) : 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        supplier: supplier || null,
        condition: condition || 'Mới 100%',
        location: location || 'Kho CNTT',
        notes: notes || null,
        status: AssetStatus.AVAILABLE
      }
    });

    res.status(201).json(asset);
  } catch (error: any) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assets/:id - Sửa thông tin tài sản
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, category, serialNumber, price, purchaseDate, supplier, status, condition, location, notes } = req.body;

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(price !== undefined && { price: Number(price) }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(supplier !== undefined && { supplier }),
        ...(status && { status }),
        ...(condition !== undefined && { condition }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes })
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assets/:id - Xóa tài sản
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { assignments: { where: { status: AssignmentStatus.ACTIVE } } }
    }) as any;

    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy tài sản' });
    }

    if (asset.assignments && asset.assignments.length > 0) {
      return res.status(400).json({ error: 'Tài sản đang được nhân viên sử dụng. Hãy làm thủ tục thu hồi trước khi xóa!' });
    }

    await prisma.asset.delete({ where: { id } });
    res.json({ message: 'Xóa tài sản thành công' });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets/assign - Bàn giao tài sản cho nhân sự (Biểu mẫu BM01)
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { assetId, employeeId, assignedDate, conditionOnAssign, handoverDocCode, notes } = req.body;

    if (!assetId || !employeeId) {
      return res.status(400).json({ error: 'Vui lòng chọn tài sản và nhân viên nhận bàn giao' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Tài sản không tồn tại' });

    if (asset.status === AssetStatus.ASSIGNED) {
      return res.status(400).json({ error: 'Tài sản này đang được bàn giao cho người khác' });
    }

    const docCode = handoverDocCode || `BB-BG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId,
        employeeId,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        conditionOnAssign: conditionOnAssign || 'Thiết bị hoạt động bình thường, đầy đủ phụ kiện',
        handoverDocCode: docCode,
        notes: notes || null,
        status: AssignmentStatus.ACTIVE
      },
      include: {
        asset: true,
        employee: {
          select: { id: true, code: true, fullName: true, department: { select: { name: true } } }
        }
      }
    });

    // Cập nhật trạng thái tài sản thành ASSIGNED
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.ASSIGNED }
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error assigning asset:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets/assignments/:id/return - Thu hồi / Hoàn trả tài sản
router.post('/assignments/:id/return', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { returnedDate, conditionOnReturn, notes, nextAssetStatus } = req.body;

    const assignment = await prisma.assetAssignment.findUnique({
      where: { id },
      include: { asset: true }
    }) as any;

    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu bàn giao' });
    }

    if (assignment.status === AssignmentStatus.RETURNED) {
      return res.status(400).json({ error: 'Tài sản này đã được thu hồi trước đó' });
    }

    // Cập nhật Assignment thành RETURNED
    const updatedAssignment = await prisma.assetAssignment.update({
      where: { id },
      data: {
        returnedDate: returnedDate ? new Date(returnedDate) : new Date(),
        conditionOnReturn: conditionOnReturn || 'Thiết bị hoàn trả nguyên vẹn',
        notes: notes ? `${assignment.notes ? assignment.notes + ' | ' : ''}Thu hồi: ${notes}` : assignment.notes,
        status: AssignmentStatus.RETURNED
      }
    });

    // Cập nhật trạng thái Asset thành AVAILABLE hoặc MAINTENANCE tùy tình trạng
    const targetStatus = nextAssetStatus || AssetStatus.AVAILABLE;
    await prisma.asset.update({
      where: { id: assignment.assetId },
      data: {
        status: targetStatus,
        condition: conditionOnReturn || assignment.asset?.condition
      }
    });

    res.json({ message: 'Thu hồi tài sản thành công', assignment: updatedAssignment });
  } catch (error: any) {
    console.error('Error returning asset:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
