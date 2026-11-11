# Contrato HTTP

Prefijo `/api`. JWT mediante `Authorization: Bearer TOKEN`. JSON camelCase, IDs numéricos, fechas ISO 8601 UTC e importes decimales como strings de dos posiciones. Los cuerpos que identifican evento/sector deben enviar números, no strings.

Listados CRUD: `{ data, pagination: { total, page, limit, totalPages } }`. `page` comienza en 1; `limit` por defecto 10, máximo 100. Detalles y creaciones devuelven objetos individuales; eliminaciones devuelven 204.

Errores: `{ code, message, errors? }`. 400 validación, 401 sesión, 403 permisos, 404 recurso, 409 conflicto, 429 límite de intentos y 503 servicio deshabilitado/indisponible. Un error 500 no incluye detalles internos.

## Autenticación y cuenta

| Método / ruta                    | Cuerpo o respuesta                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| POST /auth/register              | dni, nombre, apellido, email, password (8–72 caracteres), fechaNacimiento opcional |
| POST /auth/login                 | email, password → { token, user }                                                  |
| POST /auth/forgot-password       | email → respuesta genérica                                                         |
| POST /auth/reset-password/:token | password                                                                           |
| GET /users/me                    | Usuario real sin contraseña ni tokens de recuperación                              |
| PATCH /users/me                  | nombre, apellido, fechaNacimiento (YYYY-MM-DD o null)                              |
| POST /users/me/password          | currentPassword, password                                                          |
| GET /users/me/entradas           | Array de entradas con datos comerciales y codigoQr                                 |

El JWT dura una hora. Recuperar/cambiar contraseña invalida todas las sesiones anteriores. DNI, email y rol no se editan desde la cuenta personal. Los endpoints administrativos de usuarios requieren admin.

## Catálogo y administración

GET de clubes, estadios, sectores y eventos es público; POST, PUT y DELETE requieren admin. Los detalles usan `/:id`.

- `/clubes`: nombre, logoUrl opcional (URL o null).
- `/estadios`: nombre, calle, numero, ciudad.
- `/sectores`: nombreSector, capacidad, fkIdEstadio en creación. Filtrar GET con `?fkIdEstadio=ID`.
- `/eventos`: fkIdClubLocal, fkIdClubVisitante, fkIdEstadio, fechaHora, torneo, estado, soloPublicoLocal.
- `GET /eventos/:id/sectores`: oferta con idSector, nombreSector, capacidad, precio, disponibles.
- `GET /precios/evento/:idEvento`: precios paginados.
- `POST /precios`: { fkIdEvento, fkIdSector, precio: "1000.00" }; crea o actualiza.
- `DELETE /precios/:idEvento/:idSector`.

Crear eventos como Programado, asignar precios a sectores con capacidad y después cambiar a En Venta. No se permite vender eventos pasados. Los cambios de precio afectan compras nuevas; los tickets anteriores conservan su instantánea. Se rechazan eliminaciones o cambios de relaciones que comprometan compras/entradas.

## Compra

`POST /pagos/crear-preferencia`, autenticado:

- Header `Idempotency-Key`: UUID generado una vez por intento y conservado entre reintentos.
- Cuerpo: `{ eventoId: 1, sectorId: 2, quantity: 3 }`; cantidad entre 1 y 100.
- Respuesta 201: `{ idCompra, preferenceId, checkoutUrl, expiresAt, provider }`.

Una clave reutilizada con otros datos devuelve 409. Si el proveedor produce un timeout ambiguo, la compra conserva cupo hasta vencer y no abre otra preferencia con esa clave.

`GET /pagos/compras/:idCompra`: provider, estado, montoTotal, moneda, expiresAt, quantity e instantánea. Solo propietario.
`GET /pagos/entradas/:idCompra`: array de entradas. Solo propietario.
`POST /pagos/webhook`: notificación de tipo payment, validada con x-signature, x-request-id y data.id. Nunca determina el pago desde parámetros de retorno del navegador.

Estados de compra: pendiente, completada, vencida, cancelada, reembolsoPendiente, reembolsada y revision. La emisión se realiza una sola vez tras verificar el pago. Un cobro adicional se reembolsa sin duplicar entradas.

Nuevos QR: UUID opaco. QR heredados PNG: data URL para mostrar como imagen, sin volver a codificar. No hay endpoint de escaneo/uso único.

## Simulación de pagos

- GET /pagos/configuracion: público; devuelve { mode: "demo" | "mercadopago", purchasesEnabled: boolean }.
- GET /pagos/demo/:idCompra: autenticado; devuelve el DTO de compra y actions, un array de approved, rejected o pending.
- POST /pagos/demo/:idCompra/simular: autenticado; acepta exclusivamente { resultado: "approved" | "rejected" | "pending" } y devuelve el DTO actualizado.

Solo el propietario puede consultar o simular compras demo. Las rutas demo devuelven 404 para otro proveedor, otro propietario o modo deshabilitado. Con compras deshabilitadas, las acciones devuelven 503. Los cambios incompatibles con un estado final devuelven 409; repetir una aprobación terminal devuelve el estado actual sin duplicar efectos.

El webhook oficial devuelve 404 en modo demo. Las notificaciones oficiales no pueden completar compras demo. Los DTO de entradas añaden esDemo; el proveedor de cada compra se conserva al cambiar la configuración global.

## Salud

`GET /health`: proceso activo. `GET /ready`: comprueba conexión MySQL, 503 si no está disponible.
