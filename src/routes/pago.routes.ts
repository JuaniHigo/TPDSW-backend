import { Router } from 'express';
import { crearPreferenciaMercadoPago, recibirConfirmacionPago, getEntradasPorCompra, procesarPagoTarjeta } from '../controllers/pagos.controller';
import { isAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/crear-preferencia-mp', isAuth, crearPreferenciaMercadoPago);
router.post('/procesar-tarjeta', isAuth, procesarPagoTarjeta); // <-- NUEVA RUTA
router.post('/webhook-mp', recibirConfirmacionPago);
router.get('/compras/:id_compra/entradas', isAuth, getEntradasPorCompra);

export default router;
