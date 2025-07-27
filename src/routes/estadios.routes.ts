import { Router } from 'express';
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
router.post('/', createEstadio);
router.put('/:id', updateEstadio);
router.delete('/:id', deleteEstadio);

export default router;