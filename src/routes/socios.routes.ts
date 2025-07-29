import { Router } from 'express';
// Importamos las funciones del controlador de socios
import { isAuth } from '../middlewares/auth.middleware';
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
router.post('/',isAuth, createSocio);

// Obtener todos los socios
router.get('/', isAuth, getAllSocios);

// Obtener, actualizar y eliminar un socio específico
// Se usan los dos campos de la clave primaria compuesta (fk_id_usuario, fk_id_club)
router.get('/:id_usuario/:id_club', isAuth, getSocioById);
router.put('/:id_usuario/:id_club', isAuth, updateSocio);
router.delete('/:id_usuario/:id_club',isAuth, deleteSocio);

export default router;