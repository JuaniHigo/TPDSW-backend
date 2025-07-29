import { Router } from 'express';
import { isAuth } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';
import {
    getAllEventos,
    getEventoById,
    createEvento,
    updateEvento,
    deleteEvento
} from '../controllers/eventos.controller';

const router = Router();

router.get('/', isAuth, getAllEventos);
router.get('/:id', isAuth, getEventoById);
router.post('/', isAuth, isAdmin, createEvento);
router.put('/:id', isAuth,updateEvento);
router.delete('/:id',isAuth, deleteEvento);

export default router;