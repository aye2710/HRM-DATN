import { Router } from 'express';
import { prisma } from '../../db';
import { authenticateToken, requireRole } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();

const hrOrgOnly = requireRole('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER');

// Áp dụng bảo mật xác thực cho danh mục vị trí chức danh
router.use(authenticateToken);

// Get all positions
router.get('/', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: {
        department: {
          select: { name: true }
        }
      },
      orderBy: { title: 'asc' }
    });
    res.json(positions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create position
router.post('/', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { code, title, description, level, minSalary, maxSalary, departmentId, status } = req.body;
    
    // Check code existence
    const existingCode = await prisma.position.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ error: 'Mã vị trí đã tồn tại' });
    }

    const newPosition = await prisma.position.create({
      data: {
        code,
        title,
        description: description || '',
        level,
        minSalary: minSalary || 0,
        maxSalary: maxSalary || 0,
        departmentId: departmentId || null,
        status: status || 'ACTIVE'
      }
    });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    await createAuditLog({
      action: 'CREATE_POSITION',
      tableName: 'Position',
      recordId: newPosition.id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details: `Khởi tạo vị trí chức danh mới: "${newPosition.title}" (Mã: ${newPosition.code}, Cấp bậc: ${newPosition.level}, Dải lương: ${newPosition.minSalary} - ${newPosition.maxSalary})`
    });

    return res.status(201).json(newPosition);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Helper: Sinh mã vị trí chức danh thông minh phía server nếu người dùng để trống
const generateServerPositionCode = (title: string, deptCode: string, existingCodes: Set<string>): string => {
  if (!title || !title.trim()) return 'POS';
  const clean = title.trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const roleMap = [
    { regex: /front\s*end|frontend|\bfe\b/i, code: 'FE' },
    { regex: /back\s*end|backend|\bbe\b/i, code: 'BE' },
    { regex: /full\s*stack|fullstack|\bfs\b/i, code: 'FS' },
    { regex: /mobile|android|ios|flutter|react\s*native/i, code: 'MOB' },
    { regex: /devops|cloud|sre|ha\s*tang/i, code: 'DEVOPS' },
    { regex: /tester|kiem\s*thu|\bqa\b|\bqc\b/i, code: 'QA' },
    { regex: /data\s*engineer|data\s*analyst|ky\s*su\s*du\s*lieu/i, code: 'DATA' },
    { regex: /ui\s*\/\s*ux|uiux|designer|thiet\s*ke/i, code: 'UIUX' },
    { regex: /product\s*manager|product\s*owner|\bpm\b|\bpo\b/i, code: 'PM' },
    { regex: /business\s*analyst|phan\s*tich\s*nghiep\s*vu|\bba\b/i, code: 'BA' },
    { regex: /tuyen\s*dung|recruiter|recruitment/i, code: 'REC' },
    { regex: /c&b|tien\s*luong|dai\s*ngo|compensation/i, code: 'CNB' },
    { regex: /nhan\s*su\s*tong\s*hop|hr\s*generalist|hrbp/i, code: 'HRBP' },
    { regex: /ke\s*toan\s*thue|thue/i, code: 'TAX' },
    { regex: /ke\s*toan\s*tong\s*hop/i, code: 'KTTH' },
    { regex: /ke\s*toan/i, code: 'KT' },
    { regex: /thu\s*quy|treasury/i, code: 'TREAS' },
    { regex: /kinh\s*doanh|ban\s*hang|sales/i, code: 'SALES' },
    { regex: /marketing|truyen\s*thong|mkt/i, code: 'MKT' },
    { regex: /cham\s*soc\s*khach\s*hang|cskh|support/i, code: 'CSKH' },
    { regex: /phap\s*che|legal/i, code: 'LEGAL' },
    { regex: /hanh\s*chinh|admin/i, code: 'ADMIN' },
    { regex: /giam\s*doc|director/i, code: 'DIR' },
    { regex: /truong\s*phong|lead/i, code: 'LEAD' }
  ];

  let roleCode = '';
  for (const item of roleMap) {
    if (item.regex.test(clean)) {
      roleCode = item.code;
      break;
    }
  }

  if (!roleCode) {
    const words = clean.split(/[\s\-_/]+/).filter(w => !['nhan', 'vien', 'chuyen', 'to', 'truong', 'pho', 'can', 'bo', 'chuc', 'danh', 'vi', 'tri'].includes(w));
    const targetWords = words.length > 0 ? words : clean.split(/[\s\-_/]+/);
    roleCode = targetWords.map(w => w[0]?.toUpperCase()).join('').slice(0, 5);
  }

  const prefix = (deptCode || '').trim().toUpperCase();
  let baseCode = roleCode;
  if (prefix) {
    baseCode = (roleCode === prefix || roleCode.startsWith(`${prefix}-`)) ? roleCode : `${prefix}-${roleCode}`;
  }

  let finalCode = baseCode || 'POS';
  let counter = 2;
  while (existingCodes.has(finalCode.toUpperCase())) {
    finalCode = `${baseCode}_${counter}`;
    counter++;
  }
  return finalCode;
};

// POST: Nạp hàng loạt chức danh / vị trí từ file Excel
router.post('/bulk-import', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { positions } = req.body;
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ error: 'Danh sách vị trí chức danh không hợp lệ hoặc rỗng.' });
    }

    const currentPositions = await prisma.position.findMany({
      select: { id: true, code: true, title: true, departmentId: true }
    });

    const currentDepts = await prisma.department.findMany({
      select: { id: true, code: true, name: true }
    });

    const existingCodes = new Set(currentPositions.map(p => (p.code || '').toUpperCase()).filter(Boolean));
    const deptMapByName = new Map<string, { id: string; code: string }>();
    const deptMapByCode = new Map<string, { id: string; code: string }>();

    currentDepts.forEach(d => {
      deptMapByName.set(d.name.trim().toLowerCase(), { id: d.id, code: d.code });
      deptMapByCode.set(d.code.trim().toUpperCase(), { id: d.id, code: d.code });
    });

    const results = {
      total: positions.length,
      successCount: 0,
      skippedCount: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < positions.length; i++) {
      const item = positions[i];
      const title = String(item.title || '').trim();

      if (!title) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1}: Tên chức danh / vị trí không được để trống.`);
        continue;
      }

      // Xác định phòng ban
      let deptId: string | null = null;
      let deptCode = '';

      if (item.departmentName) {
        const dName = String(item.departmentName).trim().toLowerCase();
        const found = deptMapByName.get(dName);
        if (found) {
          deptId = found.id;
          deptCode = found.code;
        }
      }
      if (!deptId && item.departmentCode) {
        const dCode = String(item.departmentCode).trim().toUpperCase();
        const found = deptMapByCode.get(dCode);
        if (found) {
          deptId = found.id;
          deptCode = found.code;
        }
      }

      // Kiểm tra trùng lặp chức danh trong cùng 1 phòng ban
      const isDuplicateTitle = currentPositions.some(p => 
        p.title.trim().toLowerCase() === title.toLowerCase() && 
        p.departmentId === deptId
      );
      if (isDuplicateTitle) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1}: Chức danh "${title}" đã tồn tại trong phòng ban tương ứng.`);
        continue;
      }

      // Mã vị trí
      let code = item.code ? String(item.code).trim().toUpperCase() : '';
      if (!code) {
        code = generateServerPositionCode(title, deptCode, existingCodes);
      }

      if (existingCodes.has(code)) {
        let counter = 2;
        let altCode = `${code}_${counter}`;
        while (existingCodes.has(altCode)) {
          counter++;
          altCode = `${code}_${counter}`;
        }
        code = altCode;
      }

      const level = item.level ? String(item.level).trim() : 'Staff';
      const minSalary = Number(String(item.minSalary || '0').replace(/[^0-9]/g, '')) || 0;
      const maxSalary = Number(String(item.maxSalary || '0').replace(/[^0-9]/g, '')) || 0;
      const status = item.status && String(item.status).toUpperCase().includes('KHÓA') ? 'INACTIVE' : 'ACTIVE';
      const description = item.description ? String(item.description).trim() : '';

      try {
        const newPos = await prisma.position.create({
          data: {
            code,
            title,
            description,
            level,
            minSalary,
            maxSalary,
            departmentId: deptId,
            status
          }
        });

        existingCodes.add(code);
        currentPositions.push({ id: newPos.id, code: newPos.code, title: newPos.title, departmentId: newPos.departmentId });
        results.successCount++;
      } catch (err: any) {
        results.skippedCount++;
        results.errors.push(`Dòng ${i + 1} (${title}): ${err.message || 'Lỗi khi lưu vị trí'}`);
      }
    }

    if (results.successCount > 0) {
      await createAuditLog({
        action: 'CREATE_POSITION_BATCH',
        tableName: 'Position',
        recordId: 'BATCH_IMPORT',
        accountId: (req as any).user?.accountId || 'ADMIN',
        details: `Nhập thành công ${results.successCount}/${results.total} vị trí chức danh từ file Excel.`
      });
    }

    return res.status(200).json({
      message: `Đã nạp thành công ${results.successCount}/${results.total} vị trí chức danh vào hệ thống.`,
      ...results
    });
  } catch (error: any) {
    console.error('Error in bulk import positions:', error);
    return res.status(500).json({ error: error.message || 'Lỗi khi nhập hàng loạt vị trí chức danh' });
  }
});

// Update position
router.put('/:id', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { code, title, description, level, minSalary, maxSalary, departmentId, status } = req.body;

    const existingPos = await prisma.position.findUnique({ where: { id } });
    if (!existingPos) {
      return res.status(404).json({ error: 'Không tìm thấy vị trí chức danh' });
    }

    // Check code if changed
    if (code) {
        const existingCode = await prisma.position.findFirst({
            where: { code, id: { not: id } }
        });
        if (existingCode) {
            return res.status(400).json({ error: 'Mã vị trí đã tồn tại' });
        }
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: {
        code,
        title,
        description,
        level,
        minSalary,
        maxSalary,
        departmentId: departmentId || null,
        status
      }
    });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    let action = 'UPDATE_POSITION';
    let details = `Cập nhật vị trí chức danh: "${updatedPosition.title}" (${updatedPosition.code}).`;

    if (status && status !== existingPos.status) {
      if (status === 'INACTIVE') {
        action = 'LOCK_POSITION';
        details = `Khóa / Đóng băng vị trí chức danh: "${updatedPosition.title}" (Mã: ${updatedPosition.code}). Trạng thái sang INACTIVE.`;
      } else {
        action = 'UNLOCK_POSITION';
        details = `Mở khóa / Kích hoạt lại vị trí chức danh: "${updatedPosition.title}" (Mã: ${updatedPosition.code}). Trạng thái sang ACTIVE.`;
      }
    } else {
      const changes: string[] = [];
      if (title && title !== existingPos.title) changes.push(`Chức danh: "${existingPos.title}" -> "${title}"`);
      if (code && code !== existingPos.code) changes.push(`Mã: "${existingPos.code}" -> "${code}"`);
      if (level && level !== existingPos.level) changes.push(`Cấp bậc: ${existingPos.level} -> ${level}`);
      if (minSalary !== undefined && minSalary !== existingPos.minSalary) changes.push(`Lương sàn: ${existingPos.minSalary} -> ${minSalary}`);
      if (maxSalary !== undefined && maxSalary !== existingPos.maxSalary) changes.push(`Lương trần: ${existingPos.maxSalary} -> ${maxSalary}`);
      if (changes.length > 0) details += ` Các mục thay đổi: ${changes.join(', ')}.`;
    }

    await createAuditLog({
      action,
      tableName: 'Position',
      recordId: updatedPosition.id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details
    });

    return res.json(updatedPosition);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete position
router.delete('/:id', hrOrgOnly, async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    // Check if position has employees
    const pos = await prisma.position.findUnique({
        where: { id },
        include: { _count: { select: { employees: true } } }
    });
    
    if (!pos) {
      return res.status(404).json({ error: 'Không tìm thấy vị trí' });
    }

    if (pos._count.employees > 0) {
        return res.status(400).json({ error: 'Không thể xóa vị trí đang có nhân viên' });
    }

    await prisma.position.delete({ where: { id } });

    // Ghi nhận nhật ký kiểm toán (Audit Trail)
    await createAuditLog({
      action: 'DELETE_POSITION',
      tableName: 'Position',
      recordId: id,
      accountId: (req as any).user?.accountId || 'ADMIN',
      details: `Xóa vị trí chức danh: "${pos.title}" (Mã: ${pos.code})`
    });

    return res.json({ message: 'Đã xóa vị trí' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
