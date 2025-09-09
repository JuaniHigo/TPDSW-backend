import "reflect-metadata";
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import { orm, syncSchema } from "./config/mikro-orm.config.js";

// Importación de todas las rutas
import userRoutes from "./routes/user.routes";
import sociosRoutes from "./routes/socios.routes";
import clubesRoutes from "./routes/clubes.routes";
import estadiosRoutes from "./routes/estadios.routes";
import eventosRoutes from "./routes/eventos.routes";
import authRoutes from "./routes/auth.routes";
import tipoEntradaRoutes from "./routes/tipoEntrada.routes";
import sectoresRoutes from "./routes/sectores.routes";
import pagoRoutes from "./routes/pago.routes"; // <-- AÑADIR ESTA LÍNEA
import { RequestContext } from "@mikro-orm/core";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(compression());
app.use(cors());
app.use(express.json());
//el orm se pone despues de los middlewares
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
//y antes de las rutas de negocio
// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/socios", sociosRoutes);
app.use("/api/clubes", clubesRoutes);
app.use("/api/estadios", estadiosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/tipoEntrada", tipoEntradaRoutes);
app.use("/api/sectores", sectoresRoutes);
app.use("/api/pagos", pagoRoutes); // <-- AÑADIR ESTA LÍNEA

await syncSchema(); //never in production

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
