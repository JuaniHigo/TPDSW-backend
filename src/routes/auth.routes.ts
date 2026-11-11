import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
const router = Router();
const limit = (max: number) =>
  rateLimit({
    windowMs: 15 * 60000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Intentá más tarde',
    },
  });
router.post('/register', limit(10), register);
router.post('/login', limit(20), login);
router.post('/forgot-password', limit(5), forgotPassword);
router.post('/reset-password/:token', limit(10), resetPassword);
export default router;
