// src/routes/user.routes.ts

import { Router } from 'express';
// Aún no existen, pero ya los vamos a importar para el siguiente paso
import { 
    createUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser 
} from '../controllers/user.controller';

const router = Router();

// Vinculamos las rutas a las funciones que crearemos en el controlador
router.post('/', createUser);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;