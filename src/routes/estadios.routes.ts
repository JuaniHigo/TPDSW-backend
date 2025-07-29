import { Router } from 'express';
import { isAuth } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';
import {
    getAllEstadios,
    getEstadioById,
    createEstadio,
    updateEstadio,
    deleteEstadio
} from '../controllers/estadios.controller';

const router = Router();

router.get('/', getAllEstadios);
router.get('/:id', getEstadioById);
router.post('/',isAdmin, isAuth, createEstadio);
router.put('/:id',isAdmin, isAuth, updateEstadio);
router.delete('/:id',isAdmin, isAuth, deleteEstadio);

export default router;