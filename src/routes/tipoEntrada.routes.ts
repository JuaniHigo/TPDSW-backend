import { Router } from 'express';
import {
  getTipoEntradas,
  getTipoEntradaByID,
  createTipoEntrada,
  updateTipoEntrada,
  deleteTipoEntrada
} from '../controllers/tipoEntrada.controller';

const router = Router();


router.get('/', getTipoEntradas);


router.get('/:id', getTipoEntradaByID);


router.post('/', createTipoEntrada);


router.put('/:id', updateTipoEntrada);


router.delete('/:id', deleteTipoEntrada);

export default router;
