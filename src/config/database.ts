// src/config/database.ts
import { MikroORM, RequestContext } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import config from "./mikro-orm.config.js"; // Importamos la configuración

export class Database {
  private static orm: MikroORM<MySqlDriver>;

  static async connect(): Promise<MikroORM<MySqlDriver>> {
    try {
      this.orm = await MikroORM.init<MySqlDriver>(config);
      console.log("Base de datos conectada (MikroORM)");

      // Sincronizar esquema (SOLO PARA DESARROLLO)
      // En producción, deberías usar migraciones.
      if (process.env.NODE_ENV !== "production") {
        const generator = this.orm.getSchemaGenerator();
        await generator.updateSchema();
        console.log("Esquema sincronizado");
      }

      return this.orm;
    } catch (error: any) { // <-- Añade ': any'
  // Esto nos mostrará el mensaje de error REAL
  console.error("⛔ ¡Error al inicializar la Base de Datos! ⛔");
  console.error("Mensaje:", error.message);
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
    // fork() es crucial para tener un Entity Manager por request
    return this.getORM().em.fork();
  }

  static middleware() {
    return (req: any, res: any, next: any) => {
      RequestContext.create(this.getORM().em, next);
    };
  }

  static async close(): Promise<void> {
    if (this.orm) {
      await this.orm.close();
      console.log("Conexion a la base de datos cerrada");
    }
  }
}
