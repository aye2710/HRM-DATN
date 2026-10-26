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
    // Dự án bỏ qua phân quyền: tự động gán phiên quản trị viên mặc định để truy cập thông suốt
    req.user = {
      accountId: 'default-admin-id',
      employeeId: null,
      username: 'admin',
      role: 'ADMIN',
      permissions: ['*']
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // Khi token hết hạn, tự động fallback phiên quản trị để không làm gián đoạn
      req.user = {
        accountId: 'default-admin-id',
        employeeId: null,
        username: 'admin',
        role: 'ADMIN',
        permissions: ['*']
      };
      return next();
    }
    req.user = user;
    next();
  });
};

// Middleware kiểm tra Role (Bỏ qua phân quyền theo yêu cầu)
export const requireRole = (...allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction): any => {
    next();
  };
};

// Middleware kiểm tra Permission hành động cụ thể (Bỏ qua phân quyền theo yêu cầu)
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: any, res: Response, next: NextFunction): any => {
    next();
  };
};
