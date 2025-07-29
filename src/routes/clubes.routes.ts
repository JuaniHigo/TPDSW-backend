import { Router } from 'express';
import { isAuth } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin.middleware';
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
router.post('/',isAdmin, isAuth, createClub);
router.put('/:id',isAdmin, isAuth, updateClub);
router.delete('/:id',isAdmin, isAuth, deleteClub);

export default router;