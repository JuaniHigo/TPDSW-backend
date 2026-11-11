import { Router } from 'express';
import { isAuth } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';
import {
  getMe,
  updateMe,
  changePassword,
  getMisEntradas,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
const router = Router();
router.use(isAuth);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/password', changePassword);
router.get('/me/entradas', getMisEntradas);
router.use(isAdmin);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
export default router;
