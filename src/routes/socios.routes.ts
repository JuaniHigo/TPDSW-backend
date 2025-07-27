import { Router } from 'express';
// Importamos las funciones del controlador de socios
import { 
    createSocio, 
    getAllSocios, 
    getSocioById, 
    updateSocio, 
    deleteSocio 
} from '../controllers/socios.controller';

const router = Router();

// --- Definición de Rutas para Socios ---

// Crear un nuevo socio
router.post('/', createSocio);

// Obtener todos los socios
router.get('/', getAllSocios);

// Obtener, actualizar y eliminar un socio específico
// Se usan los dos campos de la clave primaria compuesta (fk_id_usuario, fk_id_club)
router.get('/:id_usuario/:id_club', getSocioById);
router.put('/:id_usuario/:id_club', updateSocio);
router.delete('/:id_usuario/:id_club', deleteSocio);

export default router;