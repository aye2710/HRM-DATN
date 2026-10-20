import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';

// POST: Đăng nhập cấp Token
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    // 1. Tìm Account theo username
    const account = await prisma.account.findUnique({
      where: { username },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } }
        },
        employee: {
          select: { fullName: true, code: true, departmentId: true }
        }
      }
    });

    if (!account) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    if (!account.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
    }

    // 2. So sánh mật khẩu an toàn
    let isMatch = false;
    if (account.password.startsWith('$2b$') || account.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, account.password);
    } else {
      // Legacy plaintext check (nếu seed ban đầu chưa kịp hash)
      isMatch = password === account.password;
    }
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }

    // 3. Tạo Payload cho JWT
    const payload = {
      accountId: account.id,
      employeeId: account.employeeId,
      username: account.username,
      role: account.role.name,
      permissions: account.role.permissions.map((p: any) => p.permission.action)
    };

    // 4. Ký Token (hết hạn sau 24h)
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        employeeId: account.employeeId,
        username: account.username,
        role: account.role.name,
        fullName: account.employee?.fullName,
        employeeCode: account.employee?.code
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
});

// Xuất lại authenticateToken chuẩn từ middleware
export { authenticateToken } from '../../middlewares/auth.middleware';

export default router;
