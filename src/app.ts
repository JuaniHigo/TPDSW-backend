// --- LÍNEA 1: CARGAR VARIABLES DE ENTORNO ---
import dotenv from "dotenv";
dotenv.config();

// --- LÍNEA 2: ATRAPADORES GLOBALES ---
process.on('uncaughtException', (err, origin) => {
  console.error('!!!!!!!!!! EXCEPCIÓN GLOBAL NO ATRAPADA !!!!!!!!!!!');
  console.error('Origen:', origin);

  if (err instanceof Error) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } else {
    console.error('Error (Objeto Desconocido):', err);
  }
  console.error('!!!!!!!!!! FINAL DE EXCEPCIÓN !!!!!!!!!!!');
  process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('!!!!!!!!!! PROMESA GLOBAL NO ATRAPADA !!!!!!!!!!!');
  console.error('Razón:', reason);

  if (reason instanceof Error) {
    console.error('Error:', reason.message);
    console.error('Stack:', reason.stack);
  } else {
    console.error('Razón (Objeto Desconocido):', reason);
  }
  console.error('!!!!!!!!!! FINAL DE PROMESA !!!!!!!!!!!');
  process.exit(1);
});
// --- FIN ATRAPADORES ---


import "reflect-metadata";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors"; // <-- Importamos cors
import compression from "compression";
import { MikroORM, RequestContext, Options } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql"; 

// --- Configuración de Carga (Plan A / Plan B) ---
let config: Options;
try {
  const loaded = require("../mikro-orm.config");
  config = loaded && loaded.default ? loaded.default : loaded;
  if (!config || !config.driver) {
    throw new Error('Configuración cargada no es válida.');
  }
  console.log('[App] Configuración cargada desde mikro-orm.config.ts');
} catch (err) {
  console.warn('⚠️ [App] No se pudo cargar ../mikro-orm.config.ts. Usando Plan B (fallback).');
  config = {
    driver: MySqlDriver, 
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "dsw",
    password: process.env.DB_PASSWORD || "dsw",
    dbName: process.env.DB_NAME || "kicket_db",
    entities: ["./src/entities"], 
    entitiesTs: ["./src/entities"],
    tsNode: true,
  };
}
// --- Fin Configuración de Carga ---


// --- Importaciones de Rutas ---
import userRoutes from "./routes/user.routes";
import clubesRoutes from "./routes/clubes.routes";
import estadiosRoutes from "./routes/estadios.routes";
import eventosRoutes from "./routes/eventos.routes";
import authRoutes from "./routes/auth.routes";
import sectoresRoutes from "./routes/sectores.routes";
import pagoRoutes from "./routes/pago.routes";
import preciosRoutes from "./routes/precios.routes";


const PORT = process.env.PORT || 3000;
export let orm: MikroORM;

(async () => {
  let app: Application; 

  try {
    console.log("[App] Attempting Express init...");
    app = express(); 
    console.log("[App] Express Initialized.");

    // --- Middlewares Globales ---
    app.use(compression()); // <-- Descomentado
    app.use(express.json()); 

    // --- (ARREGLO CORS) ---
    // El 'app.use(cors())' simple se está colgando (pending).
    // Vamos a ser explícitos y decirle exactamente qué origen permitimos.
    const corsOptions = {
      origin: "http://localhost:5173", // <-- El "Salón" (Frontend)
      optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions)); // <-- Usamos la configuración explícita
    // --- FIN ARREGLO CORS ---

    // Middleware de MikroORM (con tipos)
    app.use((req: Request, res: Response, next: NextFunction) => { // <-- Descomentado
      RequestContext.create(orm.em, next);
    });
    
    console.log("[App] Middlewares configurados.");

    console.log("[App] Attempting MikroORM.init()...");
    orm = await MikroORM.init(config);
    console.log("[App] MikroORM Initialized Successfully!");
    
    console.log("[App] Checking DB connection...");
    await orm.em.getConnection().execute("SELECT 1");
    console.log("[App] DB Connection Successful!");
    
    // --- RUTA DE PRUEBA (PING) ---
    app.get("/api/ping", (req: Request, res: Response) => {
      console.log("¡PING! Recibí la llamada de prueba.");
      res.status(200).json({ message: "¡Pong! El backend responde." });
    });

    // --- Montaje de Rutas de la API ---
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/clubes", clubesRoutes);
    app.use("/api/estadios", estadiosRoutes);
    app.use("/api/eventos", eventosRoutes);
    app.use("/api/sectores", sectoresRoutes);
    app.use("/api/pagos", pagoRoutes);
    app.use("/api/precios", preciosRoutes);
    
    console.log("[App] Todas las rutas han sido montadas.");

    // --- Manejador de 404 ---
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.status(404).json({ message: "Ruta no encontrada." });
    });

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`✅✅✅ Servidor corriendo en ${PORT}.`);
    });

  } catch (error: any) {
    console.error("⛔ ¡Error DURANTE la inicialización de Express/Middlewares! ⛔");
    if (error instanceof Error) {
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Se lanzó un objeto de error desconocido:", error);
    }
    process.exit(1);
  }

})().catch((error) => { // Catch externo
  console.error("⛔ ¡Error fatal INESPERADO al iniciar la aplicación! ⛔");
  if (error instanceof Error) {
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
  } else {
    console.error("Se lanzó un objeto de error desconocido:", error);
  }
  process.exit(1);
});