import { Router } from 'express';
import {
    getAllSectores,
    getSectorById,
    createSector,
    updateSector,
    deleteSector
} from '../controllers/sectores.controller';

const router = Router();

/**
 * @route GET /sectores
 * @desc Obtener todos los sectores (con paginación opcional)
 * @query page, limit
 */
router.get('/', getAllSectores);

/**
 * @route GET /sectores/:id_sector/:fk_id_estadio
 * @desc Obtener un sector por ID compuesto
 */
router.get('/:id_sector/:fk_id_estadio', getSectorById);

/**
 * @route POST /sectores
 * @desc Crear un nuevo sector
 */
router.post('/', createSector);

/**
 * @route PUT /sectores/:id_sector/:fk_id_estadio
 * @desc Actualizar un sector existente
 */
router.put('/:id_sector/:fk_id_estadio', updateSector);

/**
 * @route DELETE /sectores/:id_sector/:fk_id_estadio
 * @desc Eliminar un sector
 */
router.delete('/:id_sector/:fk_id_estadio', deleteSector);

export default router;