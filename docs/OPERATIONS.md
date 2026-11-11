# Migraciones y puesta en marcha

## Datos existentes

No ejecutar schema:update ni recrear la base compartida. MySQL realiza commits implícitos de DDL; un respaldo probado es obligatorio antes de migrar.

1. Deshabilitar compras y detener temporalmente servidor/worker que escriban sobre la base.
2. Respaldar con las herramientas MySQL habituales y verificar restauración en una base separada.
3. Ejecutar `pnpm audit > audit-report.json` contra la copia. El script abre una transacción READ ONLY, informa esquema, conteos, historial, compras pendientes, precios y QR inválidos. El informe contiene datos operativos: no versionarlo.
4. Si existen precios en la columna heredada incorrecta, crear un mapeo JSON revisado, por ejemplo `{ "7:3": 12 }`: la fila con viejo identificador 7 y sector 3 corresponde al evento 12. La migración **no deduce** esa asociación.
5. Indicar `PRICE_EVENT_MAP_FILE` con la ruta al JSON. Todas las filas deben estar mapeadas, sin duplicados y con sectores del estadio correcto.
6. Ejecutar `pnpm migrate` en la copia. Comprobar conteos, relaciones, precios, compras y QR; repetir el procedimiento sobre la base real únicamente después de validar y respaldar.
7. Compilar y desplegar backend y frontend coordinadamente.

La migración histórica se conserva. La correctiva añade sesiones, reserva, instantáneas y registro de pagos/reembolsos. Los precios se transforman mediante una columna auxiliar para evitar colisiones entre IDs. Los cambios parciales de DDL admiten reejecución; si un paso falla, mantener fuera de servicio y revisar antes de continuar.

Compras históricas pendientes sin detalle suficiente pasan a revision. No generan entradas automáticamente. Si llegan pagos para esas compras, quedan registrados para resolución manual. Los QR dañados se reportan y se conservan. No se invalidan ni sustituyen entradas históricas silenciosamente.

No existe rollback destructivo automático: restaurar el respaldo verificado si fuera necesario.

## Demo y proveedores

Para presentar el TP sin credenciales de pago, seguir [modo demo](DEMO.md). El modo demo también admite NODE_ENV=production cuando PAYMENT_MODE=demo está configurado explícitamente. Los datos de demostración deben usar una base dedicada. El worker separa proveedores por el metodoPago persistido.

## Mercado Pago y reservas

Configurar credenciales sandbox, cuenta receptora, entorno y secreto del webhook. Registrar notificaciones payment en Mercado Pago y publicar una URL HTTPS. El servidor utiliza preferencias/pagos del SDK, sin migrar a Orders.

La reserva dura 15 minutos o hasta el comienzo del evento, lo que ocurra primero. Los pagos observados después de ese plazo se reembolsan. No habilitar medios offline. Los cupos vencen por fecha aun con el worker detenido.

Mantener `pnpm worker:prod` como proceso supervisado junto al servidor. El reinicio retoma trabajo persistido en MySQL; no depende de una cola en memoria. El reembolso usa una clave de idempotencia estable por pago.

Antes de habilitar `PURCHASES_ENABLED=true`, comprobar en sandbox: pago aprobado, rechazado, notificación repetida, retorno previo al webhook, pago tardío y reembolso. Verificar SMTP y recuperación de contraseña en el entorno de destino.

## Supervisión

- Sondar /health y /ready.
- Alertar sobre PAYMENT_RECONCILIATION_FAILED, REFUND_RETRY, SMTP_RESET_DELIVERY_FAILED y WORKER_CYCLE_FAILED.
- Supervisar compras en revision, reembolsoPendiente y preferencias en unknown; la tabla pago guarda intentos y próxima fecha de reintento.
- Verificar que el worker esté activo y que no se acumulen reembolsos pendientes.

Los reembolsos generales de eventos ya vendidos, el control de ingreso y los asientos numerados requieren otro alcance.

## Primer administrador

Después de migrar una base vacía, definir ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_DNI como variables de entorno temporales y ejecutar pnpm create-admin. ADMIN_NOMBRE y ADMIN_APELLIDO son opcionales. El script crea una cuenta nueva y no eleva ni sobrescribe cuentas existentes; no imprime la contraseña. Retirar esas variables después de ejecutarlo.
