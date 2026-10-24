"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCandidateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';
// Middleware xác thực JWT Token cho tài khoản Ứng viên (Candidate Portal)
const authenticateCandidateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện chức năng này.' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
        }
        req.candidateUser = user;
        next();
    });
};
exports.authenticateCandidateToken = authenticateCandidateToken;
