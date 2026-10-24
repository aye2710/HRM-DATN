"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../../db");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_1 = require("../../utils/audit");
const router = express_1.default.Router();
// Áp dụng xác thực cho toàn bộ phân hệ Quản lý Tài sản
router.use(auth_middleware_1.authenticateToken);
const itOrHrOnly = (0, auth_middleware_1.requireRole)('ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'IT_SUPPORT');
// Helper to seed demo assets if empty
const seedDemoAssets = async () => {
    const count = await db_1.prisma.asset.count();
    if (count > 0)
        return;
    const demoAssets = [
        {
            code: 'TS-LAP-001',
            name: 'MacBook Pro 14" M3 Pro 18GB/512GB Space Black',
            category: client_1.AssetCategory.LAPTOP,
            serialNumber: 'C02G90XXMD6M',
            price: 49990000,
            purchaseDate: new Date('2025-11-15'),
            supplier: 'FPT Synnex Distribution',
            status: client_1.AssetStatus.AVAILABLE,
            condition: 'Mới 100%, nguyên hộp',
            location: 'Kho CNTT - Tủ A1',
            notes: 'Trang bị cho Senior Software Engineer / Tech Lead'
        },
        {
            code: 'TS-LAP-002',
            name: 'Dell XPS 15 9530 i7-13700H 32GB RTX 4060',
            category: client_1.AssetCategory.LAPTOP,
            serialNumber: 'DL-XPS-883921',
            price: 42500000,
            purchaseDate: new Date('2025-10-01'),
            supplier: 'Hapro Distribution',
            status: client_1.AssetStatus.AVAILABLE,
            condition: 'Hoạt động tốt 99%, có dán màn hình',
            location: 'Kho CNTT - Tủ A1',
            notes: 'Thiết bị đồ họa / kỹ thuật'
        },
        {
            code: 'TS-MON-001',
            name: 'Dell UltraSharp 27" U2724D 2K IPS Black 120Hz',
            category: client_1.AssetCategory.MONITOR,
            serialNumber: 'CN-0K793H-74443',
            price: 10490000,
            purchaseDate: new Date('2025-11-20'),
            supplier: 'Hapro Distribution',
            status: client_1.AssetStatus.AVAILABLE,
            condition: 'Hoạt động hoàn hảo, không điểm chết',
            location: 'Kho CNTT - Kệ Màn Hình',
            notes: 'Màn hình đồ họa / code'
        }
    ];
    for (const a of demoAssets) {
        await db_1.prisma.asset.create({ data: a });
    }
};
// 1. GET /api/assets/stats - Thống kê tài sản kho
router.get('/stats', async (req, res) => {
    try {
        await seedDemoAssets();
        const [total, available, assigned, maintenance, disposed, assets] = await Promise.all([
            db_1.prisma.asset.count(),
            db_1.prisma.asset.count({ where: { status: client_1.AssetStatus.AVAILABLE } }),
            db_1.prisma.asset.count({ where: { status: client_1.AssetStatus.ASSIGNED } }),
            db_1.prisma.asset.count({ where: { status: client_1.AssetStatus.MAINTENANCE } }),
            db_1.prisma.asset.count({ where: { status: client_1.AssetStatus.DISPOSED } }),
            db_1.prisma.asset.findMany({ select: { price: true } })
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
    }
    catch (error) {
        console.error('Error fetching asset stats:', error);
        res.status(500).json({ error: error.message });
    }
});
// 2. GET /api/assets - Danh sách danh mục tài sản (kèm tìm kiếm và lọc)
router.get('/', async (req, res) => {
    try {
        await seedDemoAssets();
        const { search, category, status } = req.query;
        const where = {};
        if (category && category !== 'ALL') {
            where.category = category;
        }
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (search && typeof search === 'string') {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { location: { contains: search, mode: 'insensitive' } }
            ];
        }
        const assets = await db_1.prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                assignments: {
                    where: { status: client_1.AssignmentStatus.ACTIVE },
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
    }
    catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: error.message });
    }
});
// 3. GET /api/assets/assignments - Danh sách lịch sử bàn giao & thu hồi (Chống IDOR: Nhân viên chỉ xem tài sản của mình)
router.get('/assignments', async (req, res) => {
    try {
        const { status } = req.query;
        let employeeId = req.query.employeeId;
        const userRole = req.user?.role?.toUpperCase();
        // Chặn IDOR: Nhân viên thường chỉ được xem các lượt bàn giao tài sản của chính mình
        if (userRole === 'EMPLOYEE') {
            employeeId = req.user.employeeId;
        }
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (employeeId && typeof employeeId === 'string') {
            where.employeeId = employeeId;
        }
        const assignments = await db_1.prisma.assetAssignment.findMany({
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
    }
    catch (error) {
        console.error('Error fetching assignments:', error);
        return res.status(500).json({ error: error.message });
    }
});
// 4. POST /api/assets - Thêm mới tài sản vào kho (IT/HR Only)
router.post('/', itOrHrOnly, async (req, res) => {
    try {
        const { code, name, category, serialNumber, price, purchaseDate, supplier, condition, location, notes } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: 'Tên thiết bị không được để trống.' });
        }
        // Auto generate code if empty
        let assetCode = code ? String(code).trim().toUpperCase() : null;
        if (!assetCode) {
            const prefix = category ? String(category).slice(0, 3) : 'GEN';
            const count = await db_1.prisma.asset.count();
            assetCode = `TS-${prefix}-${String(count + 1).padStart(3, '0')}`;
        }
        const existing = await db_1.prisma.asset.findUnique({ where: { code: assetCode } });
        if (existing) {
            return res.status(400).json({ error: `Mã tài sản "${assetCode}" đã tồn tại trong hệ thống.` });
        }
        const asset = await db_1.prisma.asset.create({
            data: {
                code: assetCode,
                name: String(name).trim(),
                category: category || client_1.AssetCategory.LAPTOP,
                serialNumber: serialNumber ? String(serialNumber).trim() : null,
                price: price !== undefined ? Number(price) : 0,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                supplier: supplier ? String(supplier).trim() : null,
                condition: condition ? String(condition).trim() : 'Mới 100%',
                location: location ? String(location).trim() : 'Kho CNTT',
                notes: notes ? String(notes).trim() : null,
                status: client_1.AssetStatus.AVAILABLE
            }
        });
        await (0, audit_1.createAuditLog)({
            action: 'CREATE_ASSET',
            tableName: 'Asset',
            recordId: asset.id,
            accountId: req.user?.accountId,
            details: `Nhập kho tài sản mới: [${asset.code}] ${asset.name}`
        });
        return res.status(201).json(asset);
    }
    catch (error) {
        console.error('Error creating asset:', error);
        return res.status(500).json({ error: error.message || 'Lỗi khi nhập kho tài sản' });
    }
});
// 5. PUT /api/assets/:id - Sửa thông tin tài sản (IT/HR Only)
router.put('/:id', itOrHrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { name, category, serialNumber, price, purchaseDate, supplier, status, condition, location, notes } = req.body;
        const existing = await db_1.prisma.asset.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Không tìm thấy tài sản để cập nhật.' });
        }
        const updated = await db_1.prisma.asset.update({
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
        await (0, audit_1.createAuditLog)({
            action: 'UPDATE_ASSET',
            tableName: 'Asset',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Cập nhật thông tin tài sản [${updated.code}]`
        });
        return res.json(updated);
    }
    catch (error) {
        console.error('Error updating asset:', error);
        return res.status(500).json({ error: error.message });
    }
});
// 6. DELETE /api/assets/:id - Xóa tài sản (IT/HR Only - Chặn xóa nếu đang được bàn giao)
router.delete('/:id', itOrHrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const asset = await db_1.prisma.asset.findUnique({
            where: { id },
            include: { assignments: { where: { status: client_1.AssignmentStatus.ACTIVE } } }
        });
        if (!asset) {
            return res.status(404).json({ error: 'Không tìm thấy tài sản' });
        }
        if (asset.assignments && asset.assignments.length > 0) {
            return res.status(400).json({ error: 'Tài sản đang được nhân viên sử dụng. Hãy làm thủ tục thu hồi trước khi xóa!' });
        }
        await db_1.prisma.$transaction(async (tx) => {
            await tx.assetAssignment.deleteMany({ where: { assetId: id } });
            await tx.asset.delete({ where: { id } });
        });
        await (0, audit_1.createAuditLog)({
            action: 'DELETE_ASSET',
            tableName: 'Asset',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Xóa tài sản khỏi danh mục kho: [${asset.code}] ${asset.name}`
        });
        return res.json({ message: 'Xóa tài sản thành công' });
    }
    catch (error) {
        console.error('Error deleting asset:', error);
        return res.status(500).json({ error: error.message });
    }
});
// 7. POST /api/assets/assign - Bàn giao tài sản cho nhân sự (Biểu mẫu BM01 - IT/HR Only)
router.post('/assign', itOrHrOnly, async (req, res) => {
    try {
        const { assetId, employeeId, assignedDate, conditionOnAssign, handoverDocCode, notes } = req.body;
        if (!assetId || !employeeId) {
            return res.status(400).json({ error: 'Vui lòng chọn tài sản và nhân viên nhận bàn giao' });
        }
        // Kiểm tra nhân viên còn đang làm việc
        const emp = await db_1.prisma.employee.findUnique({ where: { id: employeeId } });
        if (!emp) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin nhân viên nhận bàn giao' });
        }
        if (emp.status === 'RESIGNED') {
            return res.status(400).json({ error: 'Không thể bàn giao tài sản cho nhân sự đã thôi việc (RESIGNED)!' });
        }
        const docCode = handoverDocCode || `BB-BG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const assignment = await db_1.prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findUnique({ where: { id: assetId } });
            if (!asset)
                throw new Error('Tài sản không tồn tại');
            if (asset.status === client_1.AssetStatus.ASSIGNED) {
                throw new Error('Tài sản này đang được bàn giao cho nhân sự khác');
            }
            if (asset.status === client_1.AssetStatus.MAINTENANCE || asset.status === client_1.AssetStatus.DISPOSED) {
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
                    status: client_1.AssignmentStatus.ACTIVE
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
                data: { status: client_1.AssetStatus.ASSIGNED }
            });
            return newAssignment;
        });
        await (0, audit_1.createAuditLog)({
            action: 'ASSIGN_ASSET',
            tableName: 'AssetAssignment',
            recordId: assignment.id,
            accountId: req.user?.accountId,
            details: `Bàn giao tài sản [${assignment.asset.name} - ${assignment.asset.code}] cho nhân viên [${assignment.employee.fullName}] theo biên bản ${docCode}`
        });
        return res.status(201).json(assignment);
    }
    catch (error) {
        console.error('Error assigning asset:', error);
        return res.status(400).json({ error: error.message || 'Lỗi khi bàn giao tài sản' });
    }
});
// 8. POST /api/assets/assignments/:id/return - Thu hồi / Hoàn trả tài sản (Biểu mẫu BM02 - IT/HR Only)
router.post('/assignments/:id/return', itOrHrOnly, async (req, res) => {
    try {
        const id = req.params.id;
        const { returnedDate, conditionOnReturn, notes, nextAssetStatus } = req.body;
        const result = await db_1.prisma.$transaction(async (tx) => {
            const assignment = await tx.assetAssignment.findUnique({
                where: { id },
                include: { asset: true, employee: { select: { fullName: true } } }
            });
            if (!assignment) {
                throw new Error('Không tìm thấy phiếu bàn giao');
            }
            if (assignment.status === client_1.AssignmentStatus.RETURNED) {
                throw new Error('Tài sản này đã được thu hồi trước đó');
            }
            const updatedAssignment = await tx.assetAssignment.update({
                where: { id },
                data: {
                    returnedDate: returnedDate ? new Date(returnedDate) : new Date(),
                    conditionOnReturn: conditionOnReturn || 'Thiết bị hoàn trả nguyên vẹn',
                    notes: notes ? `${assignment.notes ? assignment.notes + ' | ' : ''}Thu hồi: ${notes}` : assignment.notes,
                    status: client_1.AssignmentStatus.RETURNED
                }
            });
            const targetStatus = nextAssetStatus || client_1.AssetStatus.AVAILABLE;
            await tx.asset.update({
                where: { id: assignment.assetId },
                data: {
                    status: targetStatus,
                    condition: conditionOnReturn || assignment.asset?.condition
                }
            });
            return { updatedAssignment, assetName: assignment.asset.name, employeeName: assignment.employee.fullName };
        });
        await (0, audit_1.createAuditLog)({
            action: 'RETURN_ASSET',
            tableName: 'AssetAssignment',
            recordId: id,
            accountId: req.user?.accountId,
            details: `Thu hồi tài sản [${result.assetName}] từ nhân viên [${result.employeeName}]`
        });
        return res.json({ message: 'Thu hồi tài sản thành công', assignment: result.updatedAssignment });
    }
    catch (error) {
        console.error('Error returning asset:', error);
        return res.status(400).json({ error: error.message || 'Lỗi khi thu hồi tài sản' });
    }
});
exports.default = router;
