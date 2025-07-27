import { Router } from 'express';
import {
    getAllClubes,
    getClubById,
    createClub,
    updateClub,
    deleteClub
} from '../controllers/clubes.controller';

const router = Router();

router.get('/', getAllClubes);
router.get('/:id', getClubById);
router.post('/', createClub);
router.put('/:id', updateClub);
router.delete('/:id', deleteClub);

export default router;