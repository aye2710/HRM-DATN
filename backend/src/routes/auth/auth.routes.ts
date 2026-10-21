import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { createAuditLog } from '../../utils/audit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';

// 1. POST: Đăng nhập cấp Token
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
          select: { id: true, fullName: true, code: true, departmentId: true, positionId: true }
        }
      }
    });

    if (!account) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    if (!account.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa hoặc bị khóa' });
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

    await createAuditLog({
      action: 'LOGIN_SUCCESS',
      tableName: 'Account',
      recordId: account.id,
      accountId: account.id,
      details: `Đăng nhập thành công vào hệ thống với vai trò ${account.role.name}`
    });

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        accountId: account.id,
        employeeId: account.employeeId,
        username: account.username,
        role: account.role.name,
        fullName: account.employee?.fullName,
        employeeCode: account.employee?.code,
        permissions: payload.permissions
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
});

// 2. GET: Lấy thông tin tài khoản hiện tại (Me / Profile)
router.get('/me', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.user?.accountId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } }
        },
        employee: {
          include: {
            department: true,
            position: true
          }
        }
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
    }

    return res.json({
      accountId: account.id,
      username: account.username,
      role: account.role.name,
      isActive: account.isActive,
      employee: account.employee,
      permissions: account.role.permissions.map(p => p.permission.action)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng hiện tại' });
  }
});

// 3. POST: Đổi mật khẩu tài khoản hiện tại
router.post('/change-password', authenticateToken, async (req: any, res: Response): Promise<any> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
    }

    const account = await prisma.account.findUnique({
      where: { id: req.user?.accountId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    let isMatch = false;
    if (account.password.startsWith('$2b$') || account.password.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(currentPassword, account.password);
    } else {
      isMatch = currentPassword === account.password;
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });

    await createAuditLog({
      action: 'CHANGE_PASSWORD',
      tableName: 'Account',
      recordId: account.id,
      accountId: account.id,
      details: 'Người dùng đã thay đổi mật khẩu tài khoản thành công'
    });

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi khi đổi mật khẩu' });
  }
});

// Xuất lại authenticateToken chuẩn từ middleware
export { authenticateToken } from '../../middlewares/auth.middleware';

export default router;
