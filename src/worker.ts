import { MikroORM } from '@mikro-orm/mysql';
import config from './mikro-orm.config';
import { getEnv } from './config/env';
import { reconcile } from './services/checkout';
async function main() {
  getEnv();
  const orm = await MikroORM.init(config);
  let stop = false;
  const abort = new AbortController();
  const close = () => {
    stop = true;
    abort.abort();
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
  try {
    while (!stop) {
      try {
        await reconcile(orm.em.fork());
      } catch {
        console.error('WORKER_CYCLE_FAILED');
      }
      if (!stop)
        await new Promise<void>((resolve) => {
          const t = setTimeout(done, 60000);
          function done() {
            clearTimeout(t);
            abort.signal.removeEventListener('abort', done);
            resolve();
          }
          abort.signal.addEventListener('abort', done, { once: true });
        });
    }
  } finally {
    await orm.close(true);
  }
}
main().catch(() => {
  console.error('No se pudo iniciar el worker');
  process.exitCode = 1;
});
