# Modo demo de Kicket

El modo demo permite demostrar compras con usuarios, reservas, pagos y entradas persistidos en MySQL, sin credenciales ni conexiones a Mercado Pago. Puede utilizarse tanto localmente como en un despliegue web del TP.

## Preparación

1. Usar una base MySQL dedicada para la presentación. Las compras demo consumen cupo y generan registros reales en esa base.
2. Conservar las credenciales MySQL y JWT existentes. Tomar los ajustes no sensibles de `.env.demo.example` y configurar `DB_NAME` con la base demo elegida. No copiar placeholders sobre secretos válidos.
3. Aplicar las migraciones existentes siguiendo [operación](OPERATIONS.md). Este cambio no añade migraciones ni crea, vacía o cambia bases automáticamente.
4. Configurar `PAYMENT_MODE=demo`, `PURCHASES_ENABLED=true` y `FRONTEND_URL` con el origen del frontend.
5. Mantener las variables SMTP. Para recuperación local sin credenciales de correo, usar Mailpit en localhost:1025 (`docker compose up -d mailpit`, visor http://localhost:8025). El servicio de pagos demo no necesita que Mailpit esté iniciado.
6. Ejecutar `pnpm dev`, `pnpm worker` y el frontend con `pnpm dev`. En despliegue: compilar y ejecutar `pnpm start` y `pnpm worker:prod`; configurar la URL pública del frontend y su `VITE_API_URL`.

El demo funciona sin definir variables de Mercado Pago; las credenciales existentes pueden conservarse. El modo predeterminado sigue siendo mercadopago: elegir demo es una activación explícita. `PURCHASES_ENABLED=false` bloquea nuevas compras y acciones de simulación.

## Recorrido

Seleccionar un evento En Venta, sector y cantidad. Iniciar sesión y elegir **Continuar al pago demo**. La compra reserva cupo durante 15 minutos o hasta el inicio del evento.

La pantalla **Simulador de pago** muestra el importe calculado por el servidor y ofrece:

- **Aprobar pago:** emite las entradas si la reserva está vigente.
- **Rechazar pago:** muestra el rechazo y conserva la reserva hasta su vencimiento.
- **Dejar pendiente:** permite continuar la demostración después.

Desde la confirmación pendiente o rechazada, **Volver al pago demo** permite elegir otro resultado. Una compra completada o reembolsada es de solo lectura. Repetir una aprobación no crea otro pago ni más entradas.

Una aprobación después del vencimiento o cancelación genera un reembolso simulado, sin emitir entradas. El worker lo finaliza en su próximo ciclo, aproximadamente cada minuto. La pantalla de confirmación consulta el estado cada tres segundos durante hasta dos minutos; después permite actualizarlo manualmente.

Todos los pasos de pago muestran **Pago simulado, sin cobros reales**. Las entradas se identifican como **Entrada demo · sin validez para ingreso**. No se solicitan datos de tarjeta.

## Separación entre proveedores

La compra guarda su proveedor en metodoPago; cambiar PAYMENT_MODE no reescribe compras anteriores. Los identificadores demo comienzan con demo- y nunca se envían a Mercado Pago.

En modo demo, el worker no consulta ni modifica compras de Mercado Pago. En modo mercadopago, continúa venciendo reservas y completando reembolsos demo locales, pero las rutas de simulación quedan deshabilitadas. La consulta de compras y entradas históricas sigue disponible para su propietario.

Para volver a la integración oficial, configurar PAYMENT_MODE=mercadopago, completar las credenciales oficiales y reiniciar servidor y worker. Las validaciones de firma, importe, entorno y cuenta receptora se mantienen.

## Pruebas

`pnpm test` y `pnpm test:integration` cubren configuración, estados, propiedad, idempotencia, concurrencia, vencimiento y aislamiento de proveedores. Las pruebas de demo no tienen credenciales de Mercado Pago y fallan si se intenta una petición externa.

En el frontend, `pnpm test:fullstack` recorre pendiente, rechazo y aprobación mediante la implementación demo definitiva, con backend y MySQL aislados reales. El servidor auxiliar solo prepara el entorno y limpia su base temporal; no reemplaza el proveedor de pagos.

No incluye datos precargados, reinicio masivo de compras, escaneo de entradas ni una réplica visual del checkout oficial.
