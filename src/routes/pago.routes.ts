import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { em } from '../lib/http';
import { Compra } from '../entities/Compra';
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
router.post(
  '/crear-preferencia',
  isAuth,
  rateLimit({
    windowMs: 15 * 60000,
    limit: 20,
    keyGenerator: (req) => String(req.user!.idUsuario),
    skip: async (req) => {
      const key = req.get('Idempotency-Key');
      return (
        !!key &&
        !!(await em().findOne(Compra, {
          idempotencyKey: key,
          fkUsuario: req.user!.idUsuario,
        }))
      );
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Intentá más tarde',
    },
  }),
  crearPreferencia,
);
router.get('/compras/:idCompra', isAuth, getCompra);
router.get('/entradas/:idCompra', isAuth, getEntradasPorCompra);
router.post('/webhook', recibirConfirmacionPago);
export default router;
