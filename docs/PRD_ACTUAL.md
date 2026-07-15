PRD - Isla Lobos Backend (Estado actual)

1. Resumen
   Sistema backend para controlar acceso y operacion turistica en Isla de Lobos
   (Tuxpan, Ver), con roles administrativos y prestadores, gestion de embarcaciones,
   salidas, brazaletes, clima, notificaciones y suscripciones con Stripe.

2. Objetivos del producto

- Digitalizar el control de accesos y operacion turistica.
- Gestionar usuarios, permisos y estados de cuenta por rol.
- Administrar embarcaciones, salidas y capacidad disponible.
- Controlar inventario, venta y uso de brazaletes.
- Proveer reportes, estadisticas y alertas operativas.
- Integrar suscripciones recurrentes con Stripe.

3. Alcance actual (modulos)
   3.1 Autenticacion y usuarios

- Registro, login, refresh y recuperacion de contrasena.
- Roles: CONANP (admin) y PRESTADOR.
- Activar/desactivar usuarios, gestionar permisos y expiraciones.

  3.2 Embarcaciones

- CRUD completo de embarcaciones.
- Estados: disponible, en_uso, mantenimiento.
- Relacion con prestador propietario.

  3.3 Bloques y salidas

- Bloques horarios dinamicos por fecha.
- Registro de salidas por bloque (Isla de Lobos).
- Registro de salidas por hora (Arrecifes).
- Estados de salidas y liberacion automatica de embarcaciones.

  3.4 Brazaletes

- Inventario y lotes de brazaletes.
- Venta a prestadores.
- Asignacion de brazaletes a salidas.
- Registro de uso y estadisticas.

  3.5 Clima

- Registro y consulta de condiciones meteorologicas.
- Sincronizacion con SMN-CONAGUA.
- Alertas y estado del puerto.

  3.6 Notificaciones

- WhatsApp (Twilio): individual, masivo, alertas.
- Email (SMTP): individual, masivo, alertas.

  3.7 Suscripciones (Stripe)

- Planes de suscripcion con precios recurrentes.
- Checkout Session para pagos.
- Webhooks para mantener estado local.
- Sincronizacion de planes con Stripe.

4. Usuarios y roles
   4.1 Roles

- CONANP (Admin): control completo del sistema.
- PRESTADOR: operacion diaria de salidas y embarcaciones.

  4.2 Objetivos por rol

- Admin: supervision, control, reportes, alertas y operacion general.
- Prestador: registrar salidas, administrar embarcaciones y brazaletes.

5. Historias de usuario, journeys y criterios de aceptacion

5.1 Autenticacion y usuarios
Historias

- Como usuario quiero iniciar sesion para acceder a mis funciones.
- Como admin quiero crear usuarios prestadores para operar el sistema.
- Como admin quiero activar o desactivar usuarios segun su permiso.

Journey

1. Login -> 2) Validacion de JWT -> 3) Acceso a modulos segun rol.

Criterios

- Login devuelve token y datos del usuario.
- Refresh genera un nuevo token valido.
- Usuario inactivo no puede autenticarse.
- Recuperacion de contrasena usa token temporal con expiracion.

  5.2 Embarcaciones
  Historias

- Como prestador quiero registrar mis embarcaciones.
- Como admin quiero ver embarcaciones y su estado.

Journey

1. Registrar embarcacion -> 2) Estado inicial disponible.

Criterios

- CRUD completo de embarcaciones.
- No se permite operar embarcacion en mantenimiento.
- Al crear salida, embarcacion pasa a en_uso.

  5.3 Bloques y salidas
  Historias

- Como prestador quiero consultar bloques por fecha.
- Como prestador quiero registrar una salida en un bloque disponible.
- Como admin quiero cerrar o abrir bloques por clima o capitania.

Journeys

- Isla de Lobos: consultar bloques -> seleccionar bloque -> registrar salida.
- Arrecifes: seleccionar destino -> indicar hora -> registrar salida.

Criterios

- Bloques se crean automaticamente si no existen para la fecha.
- No se permite crear salidas en bloques llenos.
- Embarcacion se libera al completar o cancelar salida.
- No se permiten fechas pasadas ni mas de 7 dias a futuro.

  5.4 Brazaletes
  Historias

- Como admin quiero crear lotes de brazaletes.
- Como admin quiero vender brazaletes a prestadores.
- Como prestador quiero asignar brazaletes a una salida.
- Como prestador quiero registrar uso de brazaletes.

Journey

1. Admin crea lote -> 2) Vende a prestador -> 3) Prestador asigna a salida
   -> 4) Brazaletes se marcan como utilizados al completar salida.

Criterios

- Lotes generan brazaletes con codigos validos.
- La venta reduce inventario disponible.
- No se asignan mas brazaletes que disponibles.
- El uso solo aplica a salidas asignadas.

  5.5 Clima
  Historias

- Como admin quiero registrar condiciones meteorologicas.
- Como admin quiero sincronizar datos con SMN-CONAGUA.
- Como prestador quiero ver la condicion actual.

Journey

1. Admin sincroniza datos -> 2) Sistema guarda condiciones
   -> 3) Se actualiza estado del puerto.

Criterios

- Condicion actual siempre disponible.
- Sincronizacion crea o actualiza registros.
- Alertas se generan cuando hay condiciones criticas.

  5.6 Notificaciones
  Historias

- Como admin quiero enviar alertas masivas por WhatsApp.
- Como admin quiero enviar alertas por email.

Journey

1. Admin dispara notificacion -> 2) Sistema envia -> 3) Se reporta estado.

Criterios

- Solo se envia a usuarios con telefono o email valido.
- Respuesta incluye resumen de enviados/fallidos.
- Endpoint de prueba solo en entorno dev.

  5.7 Suscripciones (Stripe)
  Historias

- Como usuario quiero suscribirme a un plan.
- Como admin quiero sincronizar planes con Stripe.
- Como sistema quiero mantener el estado local via webhooks.

Journey

1. Usuario elige plan -> 2) Checkout Stripe -> 3) Webhook confirma
   -> 4) Suscripcion activa.

Criterios

- Checkout crea sesion valida y URL.
- Webhook actualiza estado local de suscripcion.
- Suscripcion local refleja el estado de Stripe.

6. Reglas clave y validaciones

- Fechas sin hora deben manejarse como string "YYYY-MM-DD".
- Validaciones estrictas de capacidad y disponibilidad.
- Estados consistentes entre salidas y embarcaciones.
- Webhooks idempotentes.

7. Integraciones externas

- Stripe: suscripciones y webhooks.
- Twilio WhatsApp: notificaciones.
- SMTP Nodemailer: emails.
- SMN-CONAGUA: clima.
- Cloudinary: avatares.

8. Requerimientos no funcionales

- Seguridad JWT en endpoints privados.
- Logs de auditoria y errores.
- Resiliencia en integraciones externas.
- Consistencia de fechas sin timezone.

9. KPIs y metricas (actuales)

- Usuarios activos/inactivos por rol.
- Ocupacion de bloques.
- Salidas por estado.
- Inventario y uso de brazaletes.
- Alertas meteorologicas emitidas.
