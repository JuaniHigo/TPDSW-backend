import { MikroORM } from '@mikro-orm/mysql';
import config from './mikro-orm.config';
import { getEnv } from './config/env';
import { createApp } from './app';
async function main() {
  const env = getEnv(),
    orm = await MikroORM.init(config);
  await orm.em.getConnection().execute('SELECT 1');
  const server = createApp(orm, env).listen(env.PORT, () =>
    console.log('Kicket escuchando en ' + env.PORT),
  );
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(() => {
      void orm.close(true).then(() => {
        clearTimeout(timeout);
        process.exit(0);
      });
    });
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}
main().catch(() => {
  console.error(
    'No se pudo iniciar Kicket; verificá configuración y base de datos',
  );
  process.exitCode = 1;
});
