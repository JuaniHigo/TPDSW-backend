import { Router } from "express";
import {
  crearPreferenciaMercadoPago,
  procesarPagoTarjeta,
  recibirConfirmacionPago,
  getEntradasPorCompra,
} from "../controllers/pagos.controller";

// Importamos SOLO 'isAuth', porque un USER puede comprar
import { isAuth } from "../middlewares/auth.middleware";

const router = Router();

// --- Rutas de Usuario (necesita estar logueado) ---
router.post(
  "/crear-preferencia",
  [isAuth],
  crearPreferenciaMercadoPago
);
router.post("/procesar-tarjeta", [isAuth], procesarPagoTarjeta);
router.get("/entradas/:id_compra", [isAuth], getEntradasPorCompra);

// --- Ruta Pública (para el Webhook de Mercado Pago) ---
router.post("/webhook", recibirConfirmacionPago);

export default router;