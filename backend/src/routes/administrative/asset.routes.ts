import express, { Request, Response } from 'express';
import { prisma } from '../../db';
import { AssetCategory, AssetStatus, AssignmentStatus } from '@prisma/client';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = express.Router();

// Áp dụng xác thực cho toàn bộ phân hệ Quản lý Tài sản
router.use(authenticateToken);

const itOrHrOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'IT_SUPPORT');

// Helper to seed standard LLA Enterprise warehouse (20 PC, 40 Monitor, 20 Arm, 20 Keyboard/Mouse)
const seedDemoAssets = async () => {
  // 0. Xóa sạch mọi tài sản demo/khác không thuộc 4 dòng sản phẩm chuẩn của công ty LLA
  try {
    const nonStandard = await prisma.asset.findMany({
      where: {
        NOT: {
          OR: [
            { code: { startsWith: 'TS-PC-' } },
            { code: { startsWith: 'TS-MON-' } },
            { code: { startsWith: 'TS-ARM-' } },
            { code: { startsWith: 'TS-KB-' } }
          ]
        }
      },
      select: { id: true }
    });

    if (nonStandard.length > 0) {
      const ids = nonStandard.map(a => a.id);
      await prisma.assetAssignment.deleteMany({ where: { assetId: { in: ids } } });
      await prisma.asset.deleteMany({ where: { id: { in: ids } } });
      console.log(`[ASSET CLEANUP] Đã xóa ${nonStandard.length} tài sản cũ ngoài danh mục chuẩn LLA.`);
    }
  } catch (err) {
    console.error('[ASSET CLEANUP ERROR]', err);
  }

  const pcCount = await prisma.asset.count({ where: { code: { startsWith: 'TS-PC-' } } });
  if (pcCount >= 20) return;

  const toCreate: any[] = [];

  // 1. 20 Bộ PC Xeon E5-2680v4 (TS-PC-001 đến TS-PC-020)
  for (let i = 1; i <= 20; i++) {
    const num = String(i).padStart(3, '0');
    toCreate.push({
      code: `TS-PC-${num}`,
      name: `Bộ máy tính Xeon E5-2680v4 (Main X99, RAM 32GB ECC, SSD 500GB, VGA M4000 8GB)`,
      category: AssetCategory.DESKTOP,
      serialNumber: `LLA-PC-2026-${num}`,
      price: 14500000,
      purchaseDate: new Date('2026-05-01'),
      supplier: 'Công ty TNHH TM Dịch vụ và Công nghệ LLA',
      status: AssetStatus.AVAILABLE,
      condition: i <= 5 ? 'Mới 100%' : '2ND hoạt động tốt',
      location: `Kho CNTT - Kệ PC (Vị trí ${i})`,
      notes: 'Mainboard X99H DDR4, CPU Xeon E5-2680v4, Tản AM404, RAM 32GB ECC, SSD 500GB, HDD 500GB, VGA M4000 8GB, Nguồn 700W, Case Xeon'
    });
  }

  // 2. 40 Màn hình E-Dra 27" (TS-MON-001 đến TS-MON-040)
  for (let i = 1; i <= 40; i++) {
    const num = String(i).padStart(3, '0');
    toCreate.push({
      code: `TS-MON-${num}`,
      name: `Màn hình E-Dra 27" (IPS - FHD - 120Hz)`,
      category: AssetCategory.MONITOR,
      serialNumber: `EDRA-27-SN26${num}`,
      price: 3200000,
      purchaseDate: new Date('2026-05-01'),
      supplier: 'Mai Hoàng Distribution',
      status: AssetStatus.AVAILABLE,
      condition: 'Mới 100%, không điểm chết',
      location: `Kho CNTT - Kệ Màn hình (Khay ${Math.ceil(i / 10)})`,
      notes: 'Kèm dây nguồn và cáp DisplayPort chính hãng'
    });
  }

  // 3. 20 Giá đỡ 2 màn hình North Bayou F160 (TS-ARM-001 đến TS-ARM-020)
  for (let i = 1; i <= 20; i++) {
    const num = String(i).padStart(3, '0');
    toCreate.push({
      code: `TS-ARM-${num}`,
      name: `Giá đỡ 2 màn hình North Bayou F160`,
      category: AssetCategory.OFFICE_EQUIPMENT,
      serialNumber: `NB-F160-26${num}`,
      price: 750000,
      purchaseDate: new Date('2026-05-01'),
      supplier: 'North Bayou Official',
      status: AssetStatus.AVAILABLE,
      condition: 'Mới 100%',
      location: 'Kho CNTT - Tủ Phụ kiện Arm',
      notes: 'Nguyên hộp đầy đủ ốc vít kẹp bàn'
    });
  }

  // 4. 20 Bộ Bàn phím chuột + lót EDRA (TS-KB-001 đến TS-KB-020)
  for (let i = 1; i <= 20; i++) {
    const num = String(i).padStart(3, '0');
    toCreate.push({
      code: `TS-KB-${num}`,
      name: `Bàn phím chuột + lót EDRA`,
      category: AssetCategory.OFFICE_EQUIPMENT,
      serialNumber: `EDRA-KB-26${num}`,
      price: 450000,
      purchaseDate: new Date('2026-05-01'),
      supplier: 'E-Dra Việt Nam',
      status: AssetStatus.AVAILABLE,
      condition: 'Mới 100%',
      location: 'Kho CNTT - Tủ Phụ kiện Phím Chuột',
      notes: 'Phím cơ + chuột quang + pad full size'
    });
  }

  for (const item of toCreate) {
    const exist = await prisma.asset.findUnique({ where: { code: item.code } });
    if (!exist) {
      await prisma.asset.create({ data: item });
    }
  }
};

// Tự động làm sạch & nạp kho chuẩn LLA khi khởi động
seedDemoAssets()
  .then(() => console.log('[ASSET SEED] Kho tài sản LLA đã làm sạch, chỉ giữ đúng 4 dòng thiết bị chuẩn.'))
  .catch((err) => console.error('[ASSET SEED ERROR]', err));

// 1. GET /api/assets/stats - Thống kê tài sản kho
router.get('/stats', async (req: Request, res: Response) => {
  try {
    await seedDemoAssets();

    const [total, available, assigned, maintenance, disposed, lost, assets] = await Promise.all([
      prisma.asset.count({ where: { isDeleted: false } }),
      prisma.asset.count({ where: { status: AssetStatus.AVAILABLE, isDeleted: false } }),
      prisma.asset.count({ where: { status: AssetStatus.ASSIGNED, isDeleted: false } }),
      prisma.asset.count({ where: { status: AssetStatus.MAINTENANCE, isDeleted: false } }),
      prisma.asset.count({ where: { status: AssetStatus.DISPOSED, isDeleted: false } }),
      prisma.asset.count({ where: { status: ('LOST' as any), isDeleted: false } }),
      prisma.asset.findMany({ where: { isDeleted: false }, select: { price: true } })
    ]);

    const totalValue = assets.reduce((sum, a) => sum + Number(a.price || 0), 0);

    res.json({
      total,
      available,
      assigned,
      maintenance,
      disposed,
      lost,
      totalValue
    });
  } catch (error: any) {
    console.error('Error fetching asset stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 1.5 GET /api/assets/products - Danh mục sản phẩm tổng hợp (mỗi sản phẩm 1 mã + cột theo dõi số lượng + danh sách 20 mã bên trong và ma trận người giữ)
router.get('/products', async (req: Request, res: Response): Promise<any> => {
  try {
    await seedDemoAssets();

    const assets = await prisma.asset.findMany({
      where: { isDeleted: false },
      orderBy: { code: 'asc' },
      include: {
        assignments: {
          where: { status: AssignmentStatus.ACTIVE },
          include: {
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
          },
          take: 1
        }
      }
    });

    // Lấy các biên bản combo đang ACTIVE để fallback map người giữ cho các thiết bị phụ nếu cần
    const activeCombos = await prisma.assetAssignment.findMany({
      where: { status: AssignmentStatus.ACTIVE, itemsJson: { not: null } },
      include: {
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

    const groupsMap = new Map<string, any>();

    for (const a of assets) {
      let productCode = '';
      let productName = a.name;

      if (a.code.startsWith('TS-PC-')) {
        productCode = 'SP-PC-XEON';
        productName = 'Bộ máy tính Xeon E5-2680v4 (Main X99, RAM 32GB ECC, SSD 500GB, VGA M4000 8GB)';
      } else if (a.code.startsWith('TS-MON-')) {
        productCode = 'SP-MON-EDRA27';
        productName = 'Màn hình E-Dra 27" (IPS - FHD - 120Hz)';
      } else if (a.code.startsWith('TS-ARM-')) {
        productCode = 'SP-ARM-F160';
        productName = 'Giá đỡ 2 màn hình North Bayou F160';
      } else if (a.code.startsWith('TS-KB-')) {
        productCode = 'SP-KB-EDRA';
        productName = 'Bàn phím chuột + lót EDRA';
      } else {
        const match = a.code?.match(/^(TS-[A-Z0-9]+)-/);
        const prefix = match ? match[1].replace('TS-', '') : (a.category || 'GEN');
        productCode = `SP-${prefix}`;
        productName = a.name;
      }

      if (!groupsMap.has(productCode)) {
        groupsMap.set(productCode, {
          productCode,
          name: productName,
          category: a.category,
          price: Number(a.price || 0),
          supplier: a.supplier,
          location: a.location,
          notes: a.notes,
          totalQuantity: 0,
          availableQuantity: 0,
          assignedQuantity: 0,
          maintenanceQuantity: 0,
          disposedQuantity: 0,
          lostQuantity: 0,
          units: []
        });
      }

      const grp = groupsMap.get(productCode);
      grp.totalQuantity += 1;
      if (a.status === 'AVAILABLE') grp.availableQuantity += 1;
      else if (a.status === 'ASSIGNED') grp.assignedQuantity += 1;
      else if (a.status === 'MAINTENANCE') grp.maintenanceQuantity += 1;
      else if (a.status === 'DISPOSED') grp.disposedQuantity += 1;
      else if (a.status === 'LOST') grp.lostQuantity += 1;

      // Tìm thông tin người giữ: ưu tiên assignment trực tiếp, fallback qua combo
      let holder = a.assignments && a.assignments[0] ? {
        id: a.assignments[0].id,
        assignedDate: a.assignments[0].assignedDate,
        handoverDocCode: a.assignments[0].handoverDocCode,
        conditionOnAssign: a.assignments[0].conditionOnAssign,
        employee: a.assignments[0].employee
      } : null;

      if (!holder && a.status === 'ASSIGNED') {
        for (const cb of activeCombos) {
          try {
            const parsed = JSON.parse(cb.itemsJson || '[]');
            const found = parsed.some((it: any) => it.assetId === a.id || (Array.isArray(it.assetIds) && it.assetIds.includes(a.id)) || (it.serial && (it.serial.includes(a.code) || (a.serialNumber && it.serial.includes(a.serialNumber)))));
            if (found) {
              holder = {
                id: cb.id,
                assignedDate: cb.assignedDate,
                handoverDocCode: cb.handoverDocCode,
                conditionOnAssign: cb.conditionOnAssign,
                employee: cb.employee
              };
              break;
            }
          } catch (e) {}
        }
      }

      grp.units.push({
        id: a.id,
        code: a.code,
        name: a.name,
        category: a.category,
        serialNumber: a.serialNumber,
        status: a.status,
        condition: a.condition,
        location: a.location,
        price: a.price,
        purchaseDate: a.purchaseDate,
        supplier: a.supplier,
        notes: a.notes,
        assignment: holder
      });
    }

    return res.json(Array.from(groupsMap.values()));
  } catch (error: any) {
    console.error('Error fetching grouped products:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/assets - Danh sách danh mục tài sản (kèm tìm kiếm và lọc)
router.get('/', async (req: Request, res: Response) => {
  try {
    await seedDemoAssets();

    const { search, category, status } = req.query;

    const where: any = { isDeleted: false };
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

    // Fallback: nếu thiết bị ASSIGNED nhưng chưa có assignment trực tiếp (do cấp qua combo)
    const activeCombos = await prisma.assetAssignment.findMany({
      where: { status: AssignmentStatus.ACTIVE, itemsJson: { not: null } },
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
      }
    });

    for (const a of assets) {
      if ((!a.assignments || a.assignments.length === 0) && a.status === 'ASSIGNED') {
        for (const cb of activeCombos) {
          try {
            const parsed = JSON.parse(cb.itemsJson || '[]');
            const found = parsed.some((it: any) => it.assetId === a.id || (Array.isArray(it.assetIds) && it.assetIds.includes(a.id)) || (it.serial && (it.serial.includes(a.code) || (a.serialNumber && it.serial.includes(a.serialNumber)))));
            if (found) {
              (a as any).assignments = [{
                id: cb.id,
                assignedDate: cb.assignedDate,
                handoverDocCode: cb.handoverDocCode,
                conditionOnAssign: cb.conditionOnAssign,
                employee: cb.employee
              }];
              break;
            }
          } catch (e) {}
        }
      }
    }

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

// 4. POST /api/assets - Thêm mới tài sản vào kho (IT/HR Only - Hỗ trợ cả nhập đơn lẻ và nhập theo lô)
router.post('/', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { code, name, category, serialNumber, price, purchaseDate, supplier, condition, location, notes, quantity } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tên thiết bị không được để trống.' });
    }

    const qty = Math.max(1, Math.min(Number(quantity) || 1, 100));

    // Auto generate base code if empty
    let assetCode = code ? String(code).trim().toUpperCase() : null;
    if (!assetCode) {
      let prefix = 'GEN';
      if (category === AssetCategory.DESKTOP) prefix = 'PC';
      else if (category === AssetCategory.MONITOR) prefix = 'MN';
      else if (category === AssetCategory.LAPTOP) prefix = 'LAP';
      else if (category === AssetCategory.OFFICE_EQUIPMENT) prefix = 'EQ';

      const existingAssets = await prisma.asset.findMany({
        where: { code: { startsWith: `TS-${prefix}-` } },
        select: { code: true }
      });
      let maxNum = 0;
      for (const a of existingAssets) {
        const m = a.code.match(new RegExp(`TS-${prefix}-(\\d+)`, 'i'));
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      assetCode = `TS-${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
    }

    if (qty === 1) {
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
    } else {
      // Nhập theo lô (Bulk Import)
      const match = assetCode.match(/^(.*?)(\d+)$/);
      const prefixPart = match ? match[1] : `${assetCode}-`;
      const startNum = match ? parseInt(match[2], 10) : 1;
      const padLen = match ? match[2].length : 3;

      const itemsToCreate = [];
      const codesToCheck = [];

      for (let i = 0; i < qty; i++) {
        const curCode = `${prefixPart}${String(startNum + i).padStart(padLen, '0')}`;
        codesToCheck.push(curCode);
        itemsToCreate.push({
          code: curCode,
          name: String(name).trim(),
          category: category || AssetCategory.LAPTOP,
          serialNumber: serialNumber ? `${String(serialNumber).trim()}-${i + 1}` : null,
          price: price !== undefined ? Number(price) : 0,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          supplier: supplier ? String(supplier).trim() : null,
          condition: condition ? String(condition).trim() : 'Mới 100%',
          location: location ? String(location).trim() : 'Kho CNTT',
          notes: notes ? String(notes).trim() : null,
          status: AssetStatus.AVAILABLE
        });
      }

      const dupes = await prisma.asset.findMany({
        where: { code: { in: codesToCheck } },
        select: { code: true }
      });

      if (dupes.length > 0) {
        return res.status(400).json({ 
          error: `Trùng lặp mã: Các mã [${dupes.map(d => d.code).join(', ')}] đã tồn tại trong hệ thống. Vui lòng chọn số bắt đầu khác.` 
        });
      }

      await prisma.$transaction(
        itemsToCreate.map(item => prisma.asset.create({ data: item }))
      );

      await createAuditLog({
        action: 'CREATE_ASSET_BATCH',
        tableName: 'Asset',
        recordId: 'BATCH',
        accountId: req.user?.accountId,
        details: `Nhập kho theo lô ${qty} tài sản: [${codesToCheck[0]} -> ${codesToCheck[codesToCheck.length - 1]}] ${name}`
      });

      return res.status(201).json({ 
        message: `Đã nhập kho thành công lô ${qty} thiết bị từ [${codesToCheck[0]}] đến [${codesToCheck[codesToCheck.length - 1]}]`,
        count: qty,
        firstCode: codesToCheck[0],
        lastCode: codesToCheck[codesToCheck.length - 1]
      });
    }
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nhập kho tài sản' });
  }
});

// 2.0 POST /api/assets/bulk-import - Nhập lô thiết bị từ Excel (Hỗ trợ số lượng và tự sinh mã tăng dần)
router.post('/bulk-import', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { assets } = req.body;
    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: 'Danh sách thiết bị không hợp lệ hoặc rỗng.' });
    }

    const existingAssets = await prisma.asset.findMany({
      where: { isDeleted: false },
      select: { code: true, serialNumber: true }
    });

    const existingCodes = new Set(existingAssets.map(a => a.code?.toUpperCase()));
    const existingSerials = new Set(existingAssets.map(a => a.serialNumber?.toUpperCase()).filter(Boolean));

    const results = {
      totalRows: assets.length,
      successCount: 0,
      skippedCount: 0,
      errors: [] as string[]
    };

    // Helper: Tìm số lớn nhất hiện tại của một tiền tố mã (VD: "TS-PC-")
    const getNextNumberForPrefix = (prefix: string): number => {
      let maxNum = 0;
      for (const c of existingCodes) {
        if (c.startsWith(prefix)) {
          const m = c.substring(prefix.length).match(/^(\d+)/);
          if (m) {
            const val = parseInt(m[1], 10);
            if (val > maxNum) maxNum = val;
          }
        }
      }
      return maxNum + 1;
    };

    for (let i = 0; i < assets.length; i++) {
      const item = assets[i];
      const name = String(item.name || '').trim();

      if (!name) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1}: Tên thiết bị không được để trống.`);
        continue;
      }

      const qty = Math.max(1, Math.min(Number(item.quantity) || 1, 500));

      // Xác định danh mục dựa theo tên hoặc category
      let cat: AssetCategory = AssetCategory.OFFICE_EQUIPMENT;
      const combinedDesc = `${item.category || ''} ${name}`.toUpperCase();
      if (combinedDesc.includes('PC') || combinedDesc.includes('DESKTOP') || combinedDesc.includes('MÁY TÍNH')) {
        cat = AssetCategory.DESKTOP;
      } else if (combinedDesc.includes('MONITOR') || combinedDesc.includes('MÀN HÌNH')) {
        cat = AssetCategory.MONITOR;
      } else if (combinedDesc.includes('LAPTOP')) {
        cat = AssetCategory.LAPTOP;
      }

      // Xử lý tiền tố và số bắt đầu cho mã thiết bị
      let rawCode = String(item.code || '').trim().toUpperCase();
      let prefixPart = '';
      let startNum = 1;
      let padLen = 3;

      if (rawCode) {
        const match = rawCode.match(/^(.*?)(\d+)$/);
        if (match) {
          prefixPart = match[1];
          startNum = parseInt(match[2], 10);
          padLen = match[2].length;
        } else {
          prefixPart = `${rawCode}-`;
          startNum = 1;
          padLen = 3;
        }
      } else {
        // Tự động sinh mã thông minh theo chủng loại
        let defaultPrefix = 'TS-TB-';
        if (cat === AssetCategory.DESKTOP) defaultPrefix = 'TS-PC-';
        else if (cat === AssetCategory.MONITOR) defaultPrefix = 'TS-MON-';
        else if (cat === AssetCategory.LAPTOP) defaultPrefix = 'TS-LAP-';
        else defaultPrefix = 'TS-EQ-';

        prefixPart = defaultPrefix;
        startNum = getNextNumberForPrefix(defaultPrefix);
        padLen = 3;
      }

      const price = Number(String(item.price || '0').replace(/[^0-9]/g, '')) || 0;
      let purchaseDate = item.purchaseDate ? new Date(item.purchaseDate) : new Date();
      if (isNaN(purchaseDate.getTime())) purchaseDate = new Date();

      const supplier = item.supplier ? String(item.supplier).trim() : 'Chưa có thông tin';
      const condition = item.condition ? String(item.condition).trim() : 'Mới 100%';
      const location = item.location ? String(item.location).trim() : 'Kho thiết bị';
      const notes = item.notes ? String(item.notes).trim() : null;
      const baseSerial = item.serialNumber ? String(item.serialNumber).trim() : null;

      // Sinh danh sách các cá thể thiết bị tương ứng với số lượng (quantity)
      let lineSuccess = 0;
      for (let q = 0; q < qty; q++) {
        let curCode = `${prefixPart}${String(startNum + q).padStart(padLen, '0')}`;
        
        // Nếu mã đã tồn tại, tự động tăng tiếp cho đến khi tìm được mã trống
        while (existingCodes.has(curCode)) {
          startNum++;
          curCode = `${prefixPart}${String(startNum + q).padStart(padLen, '0')}`;
        }

        // Serial cá thể (nếu có)
        let curSerial: string | null = null;
        if (baseSerial) {
          curSerial = qty === 1 ? baseSerial : `${baseSerial}-${String(q + 1).padStart(2, '0')}`;
          if (existingSerials.has(curSerial.toUpperCase())) {
            curSerial = `${curSerial}-${Date.now().toString().slice(-4)}`;
          }
        }

        try {
          await prisma.asset.create({
            data: {
              code: curCode,
              name,
              category: cat,
              serialNumber: curSerial,
              price,
              purchaseDate,
              supplier,
              condition,
              location,
              notes,
              status: AssetStatus.AVAILABLE
            }
          });

          existingCodes.add(curCode.toUpperCase());
          if (curSerial) existingSerials.add(curSerial.toUpperCase());
          lineSuccess++;
          results.successCount++;
        } catch (err: any) {
          results.errors.push(`Dòng ${i + 1} (${curCode}): ${err.message || 'Lỗi lưu thiết bị'}`);
        }
      }

      if (lineSuccess === 0) {
        results.skippedCount++;
      }
    }

    return res.status(200).json({
      message: `Đã nạp thành công ${results.successCount} thiết bị vào kho từ ${results.totalRows} dòng Excel.`,
      ...results
    });
  } catch (error: any) {
    console.error('Error in bulk import assets:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nhập kho hàng loạt thiết bị' });
  }
});

// 4.5. PUT /api/assets/products/:productCode - Sửa thông tin dòng sản phẩm từ bảng chính bên ngoài (IT/HR Only)
router.put('/products/:productCode', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { productCode } = req.params;
    const { name, price, notes, assetIds } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Tên thiết bị không được để trống.' });
    }

    const updateData: any = {
      name: String(name).trim()
    };
    if (price !== undefined && price !== '') {
      updateData.price = Number(price);
    }
    if (notes !== undefined) {
      updateData.notes = notes ? String(notes).trim() : null;
    }

    let whereClause: any = { isDeleted: false };
    if (Array.isArray(assetIds) && assetIds.length > 0) {
      whereClause.id = { in: assetIds };
    } else {
      let prefix = '';
      if (productCode === 'SP-PC-XEON') prefix = 'TS-PC-';
      else if (productCode === 'SP-MON-EDRA27') prefix = 'TS-MON-';
      else if (productCode === 'SP-ARM-F160') prefix = 'TS-ARM-';
      else if (productCode === 'SP-KB-EDRA') prefix = 'TS-KB-';
      else {
        const raw = productCode.replace('SP-', '');
        prefix = `TS-${raw}-`;
      }
      whereClause.code = { startsWith: prefix };
    }

    const result = await prisma.asset.updateMany({
      where: whereClause,
      data: updateData
    });

    await createAuditLog({
      action: 'UPDATE_ASSET_PRODUCT',
      tableName: 'Asset',
      recordId: productCode,
      accountId: req.user?.accountId,
      details: `Cập nhật thông tin dòng sản phẩm [${productCode}] (${updateData.name}) cho ${result.count} thiết bị`
    });

    return res.json({ 
      message: `Đã cập nhật thông tin dòng sản phẩm cho ${result.count} thiết bị.`,
      count: result.count
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi cập nhật dòng sản phẩm' });
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

// 6. DELETE /api/assets/:id - Xóa mềm tài sản / Chuyển sang thanh lý (IT/HR Only - Chặn xóa nếu đang được bàn giao)
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

    // Xóa mềm: Chuyển cờ isDeleted = true và status = DISPOSED (Thanh lý) để bảo toàn 100% lịch sử kiểm toán
    await prisma.asset.update({
      where: { id },
      data: {
        isDeleted: true,
        status: AssetStatus.DISPOSED
      }
    });

    await createAuditLog({
      action: 'SOFT_DELETE_ASSET',
      tableName: 'Asset',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Chuyển tài sản sang trạng thái Thanh lý (Xóa mềm): [${asset.code}] ${asset.name}`
    });

    return res.json({ message: 'Đã chuyển tài sản sang trạng thái thanh lý và lưu trữ lịch sử thành công.' });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 7. POST /api/assets/assign - Bàn giao tài sản cho nhân sự (Biểu mẫu BM01 / BBBG-LLA cho nhân viên mới Onboard)
router.post('/assign', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { 
      assetId, 
      employeeId, 
      assignedDate, 
      conditionOnAssign, 
      handoverDocCode, 
      notes,
      items,
      handoverPerson,
      handoverPersonRole
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Vui lòng chọn nhân viên nhận bàn giao' });
    }

    if (!assetId && (!Array.isArray(items) || items.length === 0)) {
      return res.status(400).json({ error: 'Vui lòng chọn tài sản hoặc nhập danh sách thiết bị bàn giao' });
    }

    // Kiểm tra nhân viên còn đang làm việc
    const emp = await prisma.employee.findUnique({ 
      where: { id: employeeId },
      include: {
        department: { select: { name: true } },
        position: { select: { title: true } }
      }
    });
    if (!emp) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin nhân viên nhận bàn giao' });
    }
    if (emp.status === 'RESIGNED') {
      return res.status(400).json({ error: 'Không thể bàn giao tài sản cho nhân sự đã thôi việc (RESIGNED)!' });
    }

    const docCode = handoverDocCode || `${Math.floor(1000 + Math.random() * 9000)}/2026/BBBG-LLA`;
    const serializedItems = Array.isArray(items) && items.length > 0 ? JSON.stringify(items) : null;

    const assignment = await prisma.$transaction(async (tx) => {
      let linkedAsset = null;
      if (assetId) {
        linkedAsset = await tx.asset.findUnique({ where: { id: assetId } });
        if (!linkedAsset) throw new Error('Tài sản không tồn tại');

        if (linkedAsset.status === AssetStatus.ASSIGNED) {
          throw new Error('Tài sản này đang được bàn giao cho nhân sự khác');
        }

        if (linkedAsset.status === AssetStatus.MAINTENANCE || linkedAsset.status === AssetStatus.DISPOSED || (linkedAsset.status as string) === 'LOST') {
          throw new Error('Tài sản đang bảo trì, đã thanh lý hoặc báo mất, không thể bàn giao');
        }

        await tx.asset.update({
          where: { id: assetId },
          data: { status: AssetStatus.ASSIGNED }
        });
      }

      // Nếu trong items có các assetId cụ thể từ kho, cập nhật tất cả sang ASSIGNED và tạo AssetAssignment
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.assetId && item.assetId !== assetId) {
            await tx.asset.update({
              where: { id: item.assetId },
              data: { status: AssetStatus.ASSIGNED }
            }).catch(() => {});

            await tx.assetAssignment.create({
              data: {
                assetId: item.assetId,
                employeeId,
                assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
                conditionOnAssign: item.condition || conditionOnAssign || 'Mới 100%',
                handoverDocCode: docCode,
                notes: `Bàn giao kèm bộ Combo Onboarding (Biên bản ${docCode})`,
                status: AssignmentStatus.ACTIVE,
                handoverPerson: handoverPerson ? String(handoverPerson).trim() : 'Đỗ Thị Nguyệt',
                handoverPersonRole: handoverPersonRole ? String(handoverPersonRole).trim() : 'Hành chính - Kế toán'
              }
            }).catch(() => {});
          }
          if (Array.isArray(item.assetIds)) {
            for (const subId of item.assetIds) {
              if (subId && subId !== assetId) {
                await tx.asset.update({
                  where: { id: subId },
                  data: { status: AssetStatus.ASSIGNED }
                }).catch(() => {});

                await tx.assetAssignment.create({
                  data: {
                    assetId: subId,
                    employeeId,
                    assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
                    conditionOnAssign: item.condition || conditionOnAssign || 'Mới 100%',
                    handoverDocCode: docCode,
                    notes: `Bàn giao kèm bộ Combo Onboarding (Biên bản ${docCode})`,
                    status: AssignmentStatus.ACTIVE,
                    handoverPerson: handoverPerson ? String(handoverPerson).trim() : 'Đỗ Thị Nguyệt',
                    handoverPersonRole: handoverPersonRole ? String(handoverPersonRole).trim() : 'Hành chính - Kế toán'
                  }
                }).catch(() => {});
              }
            }
          }
        }
      }

      const newAssignment = await tx.assetAssignment.create({
        data: {
          assetId: assetId || null,
          employeeId,
          assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
          conditionOnAssign: conditionOnAssign || 'Thiết bị hoạt động bình thường, đầy đủ phụ kiện',
          handoverDocCode: docCode,
          notes: notes ? String(notes).trim() : null,
          status: AssignmentStatus.ACTIVE,
          itemsJson: serializedItems,
          handoverPerson: handoverPerson ? String(handoverPerson).trim() : 'Đỗ Thị Nguyệt',
          handoverPersonRole: handoverPersonRole ? String(handoverPersonRole).trim() : 'Hành chính - Kế toán'
        },
        include: {
          asset: true,
          employee: {
            select: { 
              id: true, 
              code: true, 
              fullName: true, 
              department: { select: { name: true } },
              position: { select: { title: true } }
            }
          }
        }
      });

      return newAssignment;
    });

    await createAuditLog({
      action: 'ASSIGN_ASSET',
      tableName: 'AssetAssignment',
      recordId: assignment.id,
      accountId: req.user?.accountId,
      details: `Lập Biên bản bàn giao tài sản [${docCode}] cho nhân viên [${assignment.employee.fullName}]`
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Error assigning asset:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi bàn giao tài sản' });
  }
});

// 7.5 POST /api/assets/assignments/batch-return - Thu hồi trọn bộ thiết bị theo nhân viên (Biểu mẫu BM-02, IT/HR Only)
router.post('/assignments/batch-return', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const { 
      employeeId, 
      assetIds, 
      returnedDate, 
      conditionOnReturn, 
      notes, 
      compensationAmount,
      compensationReason,
      handoverPerson,
      handoverPersonRole
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Vui lòng chọn nhân viên cần thu hồi tài sản.' });
    }

    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, fullName: true, code: true, department: { select: { name: true } }, position: { select: { title: true } } }
    });
    if (!emp) return res.status(404).json({ error: 'Không tìm thấy nhân viên.' });

    let whereAsset: any = { status: AssetStatus.ASSIGNED, isDeleted: false };
    if (Array.isArray(assetIds) && assetIds.length > 0) {
      whereAsset.id = { in: assetIds };
    }

    const assignedAssets = await prisma.asset.findMany({
      where: whereAsset,
      include: {
        assignments: {
          where: { employeeId, status: AssignmentStatus.ACTIVE },
          take: 1
        }
      }
    });

    const activeAssetsForEmp = assignedAssets.filter(a => a.assignments && a.assignments.length > 0);
    if (activeAssetsForEmp.length === 0) {
      return res.status(400).json({ error: 'Nhân viên này hiện không giữ tài sản nào đang hoạt động để thu hồi.' });
    }

    const retDate = returnedDate ? new Date(returnedDate) : new Date();
    const cond = conditionOnReturn || 'Thiết bị hoàn trả đầy đủ phụ kiện, hoạt động bình thường';
    const targetAssetIds = activeAssetsForEmp.map(a => a.id);
    const docCode = `${Math.floor(1000 + Math.random() * 9000)}/2026/BBTH-LLA`;

    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật các tài sản về AVAILABLE
      await tx.asset.updateMany({
        where: { id: { in: targetAssetIds } },
        data: {
          status: AssetStatus.AVAILABLE,
          condition: cond
        }
      });

      // 2. Cập nhật các Assignment cũ về RETURNED
      await tx.assetAssignment.updateMany({
        where: {
          assetId: { in: targetAssetIds },
          employeeId,
          status: AssignmentStatus.ACTIVE
        },
        data: {
          status: AssignmentStatus.RETURNED,
          returnedDate: retDate,
          conditionOnReturn: cond,
          notes: notes ? `Thu hồi trọn bộ: ${notes}` : 'Thu hồi trọn bộ'
        }
      });
    });

    await createAuditLog({
      action: 'RETURN_ASSET_BATCH',
      tableName: 'AssetAssignment',
      recordId: docCode,
      accountId: req.user?.accountId,
      details: `Thu hồi trọn bộ ${targetAssetIds.length} thiết bị từ nhân viên [${emp.fullName}] (Biên bản ${docCode})`
    });

    const bm02Data = {
      handoverDocCode: docCode,
      returnedDate: retDate,
      employee: emp,
      conditionOnReturn: cond,
      notes,
      handoverPerson: handoverPerson || 'Đỗ Thị Nguyệt',
      handoverPersonRole: handoverPersonRole || 'Hành chính - Kế toán',
      items: activeAssetsForEmp.map(a => ({
        name: a.name,
        code: a.code,
        serial: a.serialNumber || a.code,
        quantity: 1,
        condition: cond
      })),
      compensationAmount: compensationAmount || 0,
      compensationReason: compensationReason || null
    };

    return res.json({
      message: `Đã thu hồi thành công ${targetAssetIds.length} thiết bị về kho.`,
      bm02Data
    });
  } catch (error: any) {
    console.error('Error in batch return:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi thu hồi thiết bị' });
  }
});

// 8. POST /api/assets/assignments/:id/return - Thu hồi / Hoàn trả tài sản (Biểu mẫu BM02 - IT/HR Only, có xử lý bồi thường và an toàn dữ liệu)
router.post('/assignments/:id/return', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { 
      returnedDate, 
      conditionOnReturn, 
      notes, 
      nextAssetStatus,
      compensationAmount,
      compensationReason,
      securityWiped,
      dataWipeNotes
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.assetAssignment.findUnique({
        where: { id },
        include: { asset: true, employee: { select: { fullName: true } } }
      });

      if (!assignment) {
        throw new Error('Không tìm thấy phiếu bàn giao');
      }

      if (assignment.status === AssignmentStatus.RETURNED || (assignment.status as string) === 'LOST') {
        throw new Error('Tài sản này đã được thu hồi hoặc báo mất trước đó');
      }

      const targetAssignmentStatus = nextAssetStatus === 'LOST' 
        ? ('LOST' as any) 
        : (conditionOnReturn && conditionOnReturn.toLowerCase().includes('hỏng') ? AssignmentStatus.DAMAGED : AssignmentStatus.RETURNED);

      const updatedAssignment = await tx.assetAssignment.update({
        where: { id },
        data: {
          returnedDate: returnedDate ? new Date(returnedDate) : new Date(),
          conditionOnReturn: conditionOnReturn || 'Thiết bị hoàn trả nguyên vẹn',
          compensationAmount: compensationAmount ? Number(compensationAmount) : 0,
          compensationReason: compensationReason ? String(compensationReason).trim() : null,
          securityWiped: securityWiped !== undefined ? Boolean(securityWiped) : true,
          dataWipeNotes: dataWipeNotes ? String(dataWipeNotes).trim() : null,
          notes: notes ? `${assignment.notes ? assignment.notes + ' | ' : ''}Thu hồi: ${notes}` : assignment.notes,
          status: targetAssignmentStatus
        }
      });

      const targetStatus = nextAssetStatus || AssetStatus.AVAILABLE;
      if (assignment.assetId) {
        await tx.asset.update({
          where: { id: assignment.assetId },
          data: {
            status: targetStatus as any,
            condition: conditionOnReturn || assignment.asset?.condition
          }
        });
      }

      // Trả lại toàn bộ các thiết bị con đã bàn giao theo combo về lại kho
      if (assignment.itemsJson) {
        try {
          const parsedItems = JSON.parse(assignment.itemsJson);
          if (Array.isArray(parsedItems)) {
            for (const it of parsedItems) {
              if (it.assetId && it.assetId !== assignment.assetId) {
                await tx.asset.update({
                  where: { id: it.assetId },
                  data: {
                    status: targetStatus as any,
                    condition: conditionOnReturn || it.condition
                  }
                }).catch(() => {});

                await tx.assetAssignment.updateMany({
                  where: { assetId: it.assetId, status: AssignmentStatus.ACTIVE },
                  data: {
                    returnedDate: returnedDate ? new Date(returnedDate) : new Date(),
                    status: targetAssignmentStatus,
                    conditionOnReturn: conditionOnReturn || 'Thu hồi theo combo BBBG-LLA'
                  }
                }).catch(() => {});
              }
              if (Array.isArray(it.assetIds)) {
                for (const subId of it.assetIds) {
                  if (subId && subId !== assignment.assetId) {
                    await tx.asset.update({
                      where: { id: subId },
                      data: {
                        status: targetStatus as any,
                        condition: conditionOnReturn || it.condition
                      }
                    }).catch(() => {});

                    await tx.assetAssignment.updateMany({
                      where: { assetId: subId, status: AssignmentStatus.ACTIVE },
                      data: {
                        returnedDate: returnedDate ? new Date(returnedDate) : new Date(),
                        status: targetAssignmentStatus,
                        conditionOnReturn: conditionOnReturn || 'Thu hồi theo combo BBBG-LLA'
                      }
                    }).catch(() => {});
                  }
                }
              }
            }
          }
        } catch (e) {}
      }

      return { 
        updatedAssignment, 
        assetName: assignment.asset?.name || 'Tài sản', 
        employeeName: assignment.employee.fullName,
        compensation: compensationAmount ? Number(compensationAmount) : 0
      };
    });

    await createAuditLog({
      action: 'RETURN_ASSET',
      tableName: 'AssetAssignment',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Thu hồi tài sản [${result.assetName}] từ nhân viên [${result.employeeName}]${result.compensation > 0 ? ` (Bồi thường: ${result.compensation.toLocaleString('vi-VN')} đ)` : ''}`
    });

    return res.json({ message: 'Thu hồi tài sản thành công', assignment: result.updatedAssignment });
  } catch (error: any) {
    console.error('Error returning asset:', error);
    return res.status(400).json({ error: error.message || 'Lỗi khi thu hồi tài sản' });
  }
});

// 9. POST /api/assets/:id/maintenance-complete - Hoàn tất bảo trì 1-chạm (Đưa thiết bị về kho AVAILABLE)
router.post('/:id/maintenance-complete', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { condition, maintenanceCost, notes } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy tài sản.' });
    }

    if (asset.status !== AssetStatus.MAINTENANCE) {
      return res.status(400).json({ error: 'Chỉ có thể hoàn tất bảo trì cho thiết bị đang ở trạng thái MAINTENANCE.' });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.AVAILABLE,
        condition: condition || 'Đã bảo trì / sửa chữa hoàn tất, hoạt động tốt 100%',
        notes: notes 
          ? `${asset.notes ? asset.notes + ' | ' : ''}Bảo trì (${new Date().toLocaleDateString('vi-VN')}): ${notes}${maintenanceCost ? ` - Chi phí: ${Number(maintenanceCost).toLocaleString('vi-VN')} đ` : ''}` 
          : (maintenanceCost ? `${asset.notes ? asset.notes + ' | ' : ''}Chi phí bảo trì: ${Number(maintenanceCost).toLocaleString('vi-VN')} đ` : asset.notes)
      }
    });

    await createAuditLog({
      action: 'MAINTENANCE_COMPLETE',
      tableName: 'Asset',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Hoàn tất bảo trì tài sản [${asset.code}] ${asset.name}. Đã chuyển về kho AVAILABLE.`
    });

    return res.json({ message: 'Hoàn tất bảo trì và đã đưa thiết bị về kho.', asset: updated });
  } catch (error: any) {
    console.error('Error completing maintenance:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 10. POST /api/assets/:id/maintenance - Báo hỏng / Chuyển 1 cá thể thiết bị sang bảo trì (từ ma trận sản phẩm)
router.post('/:id/maintenance', itOrHrOnly, async (req: any, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { issueDescription, condition } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ error: 'Không tìm thấy tài sản.' });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.MAINTENANCE,
        condition: condition || 'Cần sửa chữa / bảo hành',
        notes: issueDescription 
          ? `${asset.notes ? asset.notes + ' | ' : ''}Báo hỏng (${new Date().toLocaleDateString('vi-VN')}): ${issueDescription}` 
          : asset.notes
      }
    });

    await prisma.assetAssignment.updateMany({
      where: { assetId: id, status: AssignmentStatus.ACTIVE },
      data: {
        status: AssignmentStatus.DAMAGED,
        conditionOnReturn: condition || issueDescription || 'Báo hỏng trong quá trình sử dụng',
        returnedDate: new Date()
      }
    });

    await createAuditLog({
      action: 'SEND_TO_MAINTENANCE',
      tableName: 'Asset',
      recordId: id,
      accountId: req.user?.accountId,
      details: `Chuyển thiết bị [${asset.code}] sang trạng thái bảo trì/sửa chữa: ${issueDescription || 'Báo hỏng'}`
    });

    return res.json({ message: 'Đã chuyển thiết bị sang trạng thái bảo trì thành công.', asset: updated });
  } catch (error: any) {
    console.error('Error sending asset to maintenance:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
