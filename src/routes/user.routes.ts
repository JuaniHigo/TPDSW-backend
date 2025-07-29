// src/routes/user.routes.ts

import { Router } from 'express';
// Aún no existen, pero ya los vamos a importar para el siguiente paso
import { 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
} from '../controllers/user.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', isAuth, getAllUsers);
router.get('/:id',isAuth, getUserById);
router.put('/:id',isAuth, updateUser);
router.delete('/:id', isAuth, deleteUser);

export default router;