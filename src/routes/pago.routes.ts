import { Router } from 'express';
import { isAuth } from '../middlewares/auth.middleware';
import {
  crearPreferencia,
  recibirConfirmacionPago,
  getEntradasPorCompra,
  getCompra,
  getConfiguracion,
  getDemo,
  simularDemo,
} from '../controllers/pagos.controller';
const router = Router();
router.get('/configuracion', getConfiguracion);
router.get('/demo/:idCompra', isAuth, getDemo);
router.post('/demo/:idCompra/simular', isAuth, simularDemo);
router.post('/crear-preferencia', isAuth, crearPreferencia);
router.get('/compras/:idCompra', isAuth, getCompra);
router.get('/entradas/:idCompra', isAuth, getEntradasPorCompra);
router.post('/webhook', recibirConfirmacionPago);
export default router;
