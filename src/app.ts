import "reflect-metadata";
<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import { Database } from "./config/database"; // <-- Importamos la clase

// Importación de todas las rutas
import userRoutes from "./routes/user.routes";
import sociosRoutes from "./routes/socios.routes";
import clubesRoutes from "./routes/clubes.routes";
import estadiosRoutes from "./routes/estadios.routes";
import eventosRoutes from "./routes/eventos.routes";
import authRoutes from "./routes/auth.routes";
import tipoEntradaRoutes from "./routes/tipoEntrada.routes";
import sectoresRoutes from "./routes/sectores.routes";
import pagoRoutes from "./routes/pago.routes";

dotenv.config();

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
})();
