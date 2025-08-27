import { MikroORM } from "@mikro-orm/core";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";

export const orm = await MikroORM.init({
  entities: ["./dist/shared/db/entities/**/*.js"],
  entitiesTs: ["./src/shared/db/entities/**/*.ts"],
  dbName: "Kicket_db",
  type: "mysql",
  clientUrl: "mysql://root:password@localhost:3306/kicket",
  highlighter: new SqlHighlighter(),
  debug: true,
  schemaGenerator: {
    //never in production
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
});

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator();
  /*
    await generator.dropSchema(); //never in production
    await generator.createSchema(); //never in production
    */
  await generator.updateSchema();
};
