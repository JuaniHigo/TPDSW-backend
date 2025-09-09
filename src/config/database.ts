import { MikroORM, RequestContext } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import config from "./mikro-orm.config";

export class Database {
  private static orm: MikroORM<MySqlDriver>;

  static async connect(): Promise<MikroORM<MySqlDriver>> {
    try {
      this.orm = await MikroORM.init<MySqlDriver>(config);
      console.log("Base de datos conectada");
      return this.orm;
    } catch (error) {
      console.error("Error de conexion a la base de datos", error);
      throw error;
    }
  }

  static getORM(): MikroORM<MySqlDriver> {
    if (!this.orm) {
      throw new Error(
        "ORM no inicializado, llama a DATABASE.connect() primero"
      );
    }
    return this.orm;
  }

  static getEM() {
    return this.getORM().em;
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
