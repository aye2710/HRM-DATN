"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';
// Middleware xác thực JWT Token cho tài khoản nội bộ (Admin, HR, Manager, Employee)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Truy cập bị từ chối: Vui lòng đăng nhập để thực hiện chức năng này.' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
// Middleware kiểm tra Role (Phân quyền theo vai trò)
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
// Middleware kiểm tra Permission hành động cụ thể (RolePermission)
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Truy cập bị từ chối: Chưa xác thực danh tính.' });
        }
        // Role SUPER_ADMIN luôn có toàn quyền bypass
        if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
            return next();
        }
        const userPermissions = req.user.permissions || [];
        const hasAll = requiredPermissions.every(p => userPermissions.includes(p));
        if (!hasAll) {
            return res.status(403).json({
                error: `Thao tác bị từ chối: Thiếu quyền hạn bắt buộc [${requiredPermissions.join(', ')}].`
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
