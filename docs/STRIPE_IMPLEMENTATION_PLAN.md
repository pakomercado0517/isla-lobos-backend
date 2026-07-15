# Plan de implementacion Stripe (paso a paso)

Este documento recoge la revision punto por punto de la configuracion actual de Stripe y un plan de trabajo incremental para corregir errores, completar faltantes y fortalecer seguridad/operacion.

## Revision punto por punto (estado actual)

### Configuracion y entorno
- `src/config/stripe.ts`
  - Se validan `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY`.
  - `STRIPE_WEBHOOK_SECRET` es opcional, pero el webhook lo requiere para validar firma.
  - Riesgo: documentacion indica que es opcional, pero el runtime falla si falta.

- `docs/STRIPE_SETUP.md`
  - Indica que `STRIPE_WEBHOOK_SECRET` es opcional. Esto contradice el controlador de webhooks y debilita seguridad si se usa sin firma.

### Webhooks
- `src/routes/webhookRoutes.ts`
  - Usa `express.raw({ type: "application/json" })` correctamente para firma.
  - Expone endpoints de prueba en no-produccion.

- `src/controllers/stripeWebhookController.ts`
  - Requiere `STRIPE_WEBHOOK_SECRET` y rechaza la peticion si falta.
  - Maneja eventos: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`.
  - Idempotencia con `WebhookEvent`.
  - Problemas:
    - Uso de `any` en: `handleInvoiceFailed`, `updateSubscriptionFromStripeEvent`, helpers. Viola reglas de tipado del repo.
    - `handleInvoiceFailed` usa `console.*` y no logger; trazabilidad baja.
    - `current_period_end` se lee con `any` y se convierte a Date sin tipado.

### Checkout y activacion local
- `src/controllers/subscriptionController.ts`
  - Crea checkout session con metadata `user_id` y `plan_id`.
  - En `checkout-status` no se valida que la metadata corresponda al usuario autenticado.
  - Se activa suscripcion local si `payment_status === "paid"`.
  - `fecha_fin` se calcula localmente, no usa `current_period_end` de Stripe.
  - Bloquea upgrades/downgrades si existe suscripcion activa.

### Modelos y tipos
- `src/models/UserSubscription.ts`
  - Indice unico por usuario para `ACTIVE` (bien).
  - `fecha_inicio` y `fecha_fin` son timestamp (ok).

- `src/models/WebhookEvent.ts`
  - Idempotencia correcta con `event_id` unico.

- `src/types/index.ts`
  - No hay tipos especificos para payloads de Stripe.
  - Hay `ApiResponse<T = any>` que usa `any` (fuera de la norma del repo).

### Documentacion funcional
- `docs/SAAS_PLANS.md`
  - Indica que no existen webhooks, pero en el repo ya existe controlador de webhooks.
  - Contenido desactualizado respecto al estado actual.

### Pruebas
- `PRUEBAS_SUSCRIPCIONES.md`
  - Casos manuales presentes.
  - No hay tests automatizados.

## Plan de implementacion paso a paso

### Fase 1 — Seguridad y coherencia minima (prioridad alta)
1. **Validar identidad en `checkout-status`**
   - Comparar `session.metadata.user_id` contra usuario autenticado.
   - Rechazar si no coincide.
2. **Hacer obligatorio `STRIPE_WEBHOOK_SECRET` en produccion**
   - Fallar inicio o bloquear webhook si `NODE_ENV=production` y falta secret.
3. **Eliminar `console.*` en webhooks y unificar logging**
   - Usar logger del sistema en `handleInvoiceFailed`.
4. **Remover `any` en Stripe**
   - Crear tipos especificos (interfaces) en `src/types/index.ts` y usarlos en webhook/checkout.

### Fase 2 — Consistencia de fechas y estados (alta)
5. **Alinear `fecha_fin` con Stripe**
   - Usar `current_period_end` o periodos de invoice en activacion inicial.
6. **Completar manejo de `invoice.payment_failed`**
   - Marcar `UNPAID`/`PAST_DUE` segun estado real.
   - Registrar eventos y trazabilidad consistente.
7. **Agregar reconciliacion puntual**
   - Endpoint admin o script para comparar suscripciones locales vs Stripe.

### Fase 3 — Operacion de suscripciones (media)
8. **Endpoint de cancelacion**
   - Cancelar inmediato o al final del periodo (`cancelar_al_final`).
9. **Cambios de plan**
   - Permitir upgrade/downgrade con logica de prorrateo.
10. **Customer Portal**
    - Endpoint para generar sesion de portal.

### Fase 4 — Observabilidad y producto (media)
11. **Notificaciones de eventos criticos**
    - Integrar con WhatsApp/Email para fallos de pago/cancelaciones.
12. **Documentacion actualizada**
    - Corregir `docs/STRIPE_SETUP.md` y `docs/SAAS_PLANS.md`.
13. **Tests automatizados**
    - Unitarios para mapeos de estado y handlers de webhooks.
    - Integracion para checkout + webhook.

### Fase 5 — Endurecimiento y mantenimiento (baja)
14. **Job de reconciliacion periodica**
    - Cron que sincronice estados con Stripe (diario o cada 6h).
15. **Reportes y metricas**
    - Endpoints de ingresos y churn basados en Stripe.

## Checklist de entrega por fase

- Fase 1:
  - [ ] `checkout-status` valida identidad
  - [ ] secret obligatorio en prod
  - [ ] sin `console.*` en Stripe
  - [ ] sin `any` en archivos Stripe

- Fase 2:
  - [ ] `fecha_fin` siempre proviene de Stripe
  - [ ] `invoice.payment_failed` consistente
  - [ ] reconciliacion puntual operativa

- Fase 3:
  - [ ] cancelacion inmediata y al final
  - [ ] upgrades/downgrades
  - [ ] customer portal

- Fase 4:
  - [ ] notificaciones activas
  - [ ] docs actualizadas
  - [ ] tests automatizados

- Fase 5:
  - [ ] cron de reconciliacion
  - [ ] reportes de negocio

