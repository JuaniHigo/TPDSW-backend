import { Router } from 'express';
import {
    getAllEventos,
    getEventoById,
    createEvento,
    updateEvento,
    deleteEvento
} from '../controllers/eventos.controller';

const router = Router();

router.get('/', getAllEventos);
router.get('/:id', getEventoById);
router.post('/', createEvento);
router.put('/:id', updateEvento);
router.delete('/:id', deleteEvento);

export default router;