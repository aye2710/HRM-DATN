import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    accountId: string;
    employeeId: string | null;
    username: string;
    role: string;
    permissions: string[];
  };
}

// Middleware xác thực JWT Token cho tài khoản nội bộ (Admin, HR, Manager, Employee)
export const authenticateToken = (req: any, res: Response, next: NextFunction): any => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Truy cập bị từ chối: Vui lòng đăng nhập để thực hiện chức năng này.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
    }
    req.user = user;
    next();
  });
};

// Middleware kiểm tra Role (Phân quyền theo vai trò)
export const requireRole = (...allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: 'Truy cập bị từ chối: Chưa xác thực danh tính.' });
    }

    const userRole = req.user.role?.toUpperCase();
    const isAllowed = allowedRoles.some(r => r.toUpperCase() === userRole);

    if (!isAllowed) {
      return res.status(403).json({ 
        error: `Bạn không có quyền thực hiện thao tác này. Yêu cầu một trong các quyền: [${allowedRoles.join(', ')}].` 
      });
    }

    next();
  };
};

// Middleware kiểm tra Permission hành động cụ thể (RolePermission)
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: any, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: 'Truy cập bị từ chối: Chưa xác thực danh tính.' });
    }

    // Role SUPER_ADMIN luôn có toàn quyền bypass
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      return next();
    }

    const userPermissions: string[] = req.user.permissions || [];
    const hasAll = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({ 
        error: `Thao tác bị từ chối: Thiếu quyền hạn bắt buộc [${requiredPermissions.join(', ')}].` 
      });
    }

    next();
  };
};
