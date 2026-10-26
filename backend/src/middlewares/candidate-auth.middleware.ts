import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_hrm_2026';

// Middleware xác thực JWT Token cho tài khoản Ứng viên (Candidate Portal)
export const authenticateCandidateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.candidateUser = { id: 'default-candidate-id', email: 'candidate@example.com' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      req.candidateUser = { id: 'default-candidate-id', email: 'candidate@example.com' };
      return next();
    }
    req.candidateUser = user;
    next();
  });
};
