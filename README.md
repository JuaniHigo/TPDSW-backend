# Kicket · Backend

API de venta de entradas para fútbol: Express 5, TypeScript, MikroORM 6 y MySQL 8.4.

## Modo demo sin credenciales de pago

Disponible localmente y en presentaciones web. Configurar PAYMENT_MODE=demo y PURCHASES_ENABLED=true usando [.env.demo.example](.env.demo.example), conservando los secretos MySQL/JWT y una base dedicada. No requiere credenciales de Mercado Pago. Ver [guía demo](docs/DEMO.md).

## Desarrollo

Requiere Node 22 y pnpm 10.11.0 (Corepack). No utiliza SQLite.

1. Ejecutar `pnpm install --frozen-lockfile`.
2. Copiar `.env.example` a `.env` y completar MySQL, JWT, Mercado Pago y SMTP. La clave JWT necesita al menos 32 caracteres.
3. Auditar y migrar siguiendo [operación y migraciones](docs/OPERATIONS.md).
4. Ejecutar `pnpm dev` y, en otra terminal, `pnpm worker`.
5. Levantar el frontend en el origen configurado por `FRONTEND_URL`.

Las compras están deshabilitadas por defecto mediante `PURCHASES_ENABLED=false`. Completar las migraciones antes de habilitarlas. En modo Mercado Pago, configurar webhooks y verificar sandbox; para el demo, seguir su guía. Para desarrollo de email, `docker compose up -d mailpit`; visor en http://localhost:8025.

## Comandos

| Comando                 | Resultado                                                            |
| ----------------------- | -------------------------------------------------------------------- |
| `pnpm build`            | Compila servidor, worker, scripts y migraciones                      |
| `pnpm start`            | Ejecuta servidor compilado                                           |
| `pnpm worker:prod`      | Ejecuta reconciliación y reembolsos compilados                       |
| `pnpm audit`            | Auditoría SQL de solo lectura; no modifica datos                     |
| `pnpm migrate`          | Aplica migraciones; requiere respaldo previo                         |
| `pnpm lint`             | Verifica tipos del backend                                           |
| `pnpm test`             | Compila y ejecuta pruebas unitarias                                  |
| `pnpm test:integration` | Compila y prueba HTTP, migraciones y transacciones con MySQL aislado |

El worker revisa pagos cada minuto y reintenta reembolsos con espera creciente, hasta 60 minutos. Los errores se registran con identificadores de compra/pago, sin credenciales ni datos personales.

## Pruebas con MySQL

`docker compose up -d mysql-test` inicia MySQL en 127.0.0.1:3307, con root/test-only. La suite crea y elimina bases con prefijo `kicket_test_`; no usa la conexión de `.env`. Puede indicarse otra instancia **de pruebas** con `MYSQL_TEST_URL=mysql://usuario:password@host:puerto`.

Pruebas de navegador con backend real: colocar el frontend como directorio hermano `TPDSW-frontend`, compilar este repositorio y ejecutar allí `pnpm test:fullstack`. El servidor de pruebas utiliza el proveedor demo definitivo; usa HTTP, ORM y MySQL reales. No se distribuye en `dist`.

La validación automatizada no acredita una transacción real de Mercado Pago. La comprobación sandbox requiere cuentas/credenciales de prueba y una URL HTTPS pública.

Ver [contrato HTTP](docs/API.md) y [puesta en marcha](docs/OPERATIONS.md).
