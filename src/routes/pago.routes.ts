import { Router } from "express";
import {
  crearPreferenciaMercadoPago,
  procesarPagoTarjeta,
  recibirConfirmacionPago,
  getEntradasPorCompra,
} from "../controllers/pagos.controller";

import { isAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { pagoSchema } from "../schemas/pago.schema";

const router = Router();

router.post("/crear-preferencia", [isAuth, validate(pagoSchema)], crearPreferenciaMercadoPago);
router.post("/procesar-tarjeta", [isAuth, validate(pagoSchema)], procesarPagoTarjeta);
router.get("/entradas/:idCompra", [isAuth], getEntradasPorCompra);

router.post("/webhook", recibirConfirmacionPago);

export default router;