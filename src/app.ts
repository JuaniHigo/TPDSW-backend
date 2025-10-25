import "reflect-metadata";
// --- LÍNEA 1: EL ATRAPADOR GLOBAL DEBE ESTAR AQUÍ ---
process.on("uncaughtException", (err, origin) => {
  console.error("!!!!!!!!!! EXCEPCIÓN GLOBAL NO ATRAPADA !!!!!!!!!!!");
  console.error("Origen:", origin);

  if (err instanceof Error) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
  } else {
    // Esto imprimirá el [Object: null prototype]
    console.error("Error (Objeto Desconocido):", err);
  }
  console.error("!!!!!!!!!! FINAL DE EXCEPCIÓN !!!!!!!!!!!");
  process.exit(1); // Detiene la app
});
// --- FIN DEL ATRAPADOR ---

// Ahora, el resto de tu app...
import "reflect-metadata";
import express, { Application } from "express";

import cors from "cors";
import compression from "compression";
import { Database } from "./config/database.js"; // <-- Importamos la clase

// Importación de todas las rutas
import userRoutes from "./routes/user.routes.js";
import sociosRoutes from "./routes/socios.routes.js";
import clubesRoutes from "./routes/clubes.routes.js";
import estadiosRoutes from "./routes/estadios.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import tipoEntradaRoutes from "./routes/tipoEntrada.routes.js";
import sectoresRoutes from "./routes/sectores.routes.js";
import pagoRoutes from "./routes/pago.routes.js";

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(compression());
app.use(cors());
app.use(express.json());

// Conectar a la base de datos ANTES de las rutas
(async () => {
  await Database.connect(); // <-- Conectamos usando la clase

  // Middleware de MikroORM
  app.use(Database.middleware()); // <-- Usamos el middleware de la clase

  // Rutas
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/socios", sociosRoutes);
  app.use("/api/clubes", clubesRoutes);
  app.use("/api/estadios", estadiosRoutes);
  app.use("/api/eventos", eventosRoutes);
  app.use("/api/tipoEntrada", tipoEntradaRoutes);
  app.use("/api/sectores", sectoresRoutes);
  app.use("/api/pagos", pagoRoutes);

  // Iniciar el servidor
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
})().catch((error) => {
  // Capturamos cualquier error fatal durante el inicio
  console.error("⛔ ¡Error fatal al iniciar la aplicación! ⛔");

  if (error instanceof Error) {
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
  } else {
    console.error("Se lanzó un objeto de error desconocido:", error);
  }

  process.exit(1); // Detiene la aplicación
});
