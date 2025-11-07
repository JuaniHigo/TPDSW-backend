import { defineConfig } from "@mikro-orm/mysql";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { EntityGenerator } from "@mikro-orm/entity-generator";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  dbName: process.env.DB_NAME || "kicket_db",
  user: process.env.DB_USER || "dsw",
  password: process.env.DB_PASSWORD || "dsw",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,

  entities: ["./dist/entities"],
  entitiesTs: ["./src/entities"],
  metadataProvider: TsMorphMetadataProvider,

  highlighter: new SqlHighlighter(),
  debug: true,

  extensions: [EntityGenerator],

  entityGenerator: {
    path: "./src/entities",
    save: true,
  },
});
