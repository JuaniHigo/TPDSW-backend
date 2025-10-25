// src/config/database.ts
import { MikroORM, RequestContext } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import config from "./mikro-orm.config.js";

export class Database {
  private static orm: MikroORM<MySqlDriver>;

  static async connect(): Promise<MikroORM<MySqlDriver>> {
    if (this.orm) {
      // Evita reconectar si ya está conectado
      return this.orm;
    }
    try {
      console.log("Intentando conectar a la base de datos...");
      this.orm = await MikroORM.init<MySqlDriver>(config);
      console.log("✅ Base de datos conectada (MikroORM)");

      // Sincronizar esquema (SOLO PARA DESARROLLO)
      if (process.env.NODE_ENV !== "production") {
        const generator = this.orm.getSchemaGenerator();
        console.log("Actualizando esquema...");
        await generator.updateSchema();
        console.log("✅ Esquema sincronizado");
      }

      return this.orm;
    } catch (error: any) {
      // <-- Captura cualquier tipo de error
      // Esto nos mostrará el mensaje de error REAL
      console.error("⛔ ¡Error al inicializar la Base de Datos! ⛔");
      console.error("Mensaje:", error.message);
      console.error("Config usada:", {
        // Muestra parte de la config para depurar
        dbName: config.dbName,
        clientUrl:
          config.clientUrl?.substring(0, config.clientUrl.indexOf("@") + 1) +
          "***", // Oculta pass
        debug: config.debug,
      });
      console.error("Stack:", error.stack);
      process.exit(1); // Detiene la app si la BD no conecta
    }
  }

  static getORM(): MikroORM<MySqlDriver> {
    if (!this.orm) {
      throw new Error(
        "ORM no inicializado, llama a Database.connect() primero"
      );
    }
    return this.orm;
  }

  static getEM() {
    return this.getORM().em.fork();
  }

  static middleware() {
    return (req: any, res: any, next: any) => {
      // Asegúrate de que ORM esté inicializado antes de crear el contexto
      if (!this.orm) {
        return next(new Error("ORM no inicializado para RequestContext"));
      }
      RequestContext.create(this.orm.em, next);
    };
  }

  static async close(): Promise<void> {
    if (this.orm) {
      await this.orm.close();
      console.log("Conexion a la base de datos cerrada");
    }
  }
}
