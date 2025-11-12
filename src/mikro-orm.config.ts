import { defineConfig } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql"; // <-- 1. Importar el Driver

// Importa todas tus entidades (en singular)
import { Usuario } from "../src/entities/Usuario";
import { Club } from "../src/entities/Club";
import { Estadio } from "../src/entities/Estadio";
import { Evento } from "../src/entities/Evento";
import { Sector } from "../src/entities/Sector";
import { PrecioEventoSector } from "../src/entities/PrecioEventoSector";
import { Compra } from "../src/entities/Compra";
import { Entrada } from "../src/entities/Entrada";

// 2. Usar 'defineConfig'
export default defineConfig({
  driver: MySqlDriver, // <-- 3. No más 'type: "mysql"'
  dbName: process.env.DB_NAME || "kicket_db",
  user: process.env.DB_USER || "dsw",
  password: process.env.DB_PASSWORD || "dsw",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  entities: [
    // 4. Registrar todas las entidades
    Usuario,
    Club,
    Estadio,
    Evento,
    Sector,
    PrecioEventoSector,
    Compra,
    Entrada,
  ],
  // Opcional: Esto ayuda a ts-node
  tsNode: true,
});