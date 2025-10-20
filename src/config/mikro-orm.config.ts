// src/config/mikro-orm.config.ts
import { Options } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import * as entities from "../entities"; // Importamos todas las entidades

const config: Options<MySqlDriver> = {
  entities: Object.values(entities), // Usamos las entidades importadas
  dbName: process.env.DB_NAME || "hc4gmo",
  clientUrl: process.env.DB_URL || "mysql://dsw:dsw@localhost:3306/hc4gmo",
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
