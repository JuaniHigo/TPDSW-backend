// src/config/mikro-orm.config.ts
import { Options } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

// Importamos las entidades (como hicimos antes)
import { User } from "../entities/User.entity.js";
import { Socio } from "../entities/Socio.entity.js";
import { Club } from "../entities/Club.entity.js";
import { Compra } from "../entities/Compra.entity.js";
import { Estadio } from "../entities/Estadio.entity.js";
import { Evento } from "../entities/Evento.entity.js";
import { Sector } from "../entities/Sector.entity.js";
import { Entrada } from "../entities/Entrada.entity.js";
import { PrecioEventoSector } from "../entities/PrecioEventoSector.entity.js";

// --- INICIO DE CORRECCIÓN ---
// Cargamos las variables del .env
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 3306;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

// Verificamos que las variables vitales existan
if (!dbUser || !dbPassword || !dbName) {
  throw new Error(
    "⛔ Faltan variables de entorno de la base de datos (DB_USER, DB_PASSWORD, DB_NAME). Revisa tu .env"
  );
}

// Construimos la URL de conexión
const dbUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
// --- FIN DE CORRECCIÓN ---

const config: Options<MySqlDriver> = {
  entities: [
    User,
    Socio,
    Club,
    Compra,
    Estadio,
    Evento,
    Sector,
    Entrada,
    PrecioEventoSector,
  ],
  dbName: dbName, // Usamos la variable verificada
  clientUrl: dbUrl, // Usamos la URL construida
  driver: MySqlDriver,
  highlighter: new SqlHighlighter(),
  debug: process.env.NODE_ENV !== "production",
  metadataProvider: TsMorphMetadataProvider,
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
};

export default config;