# Sistema de planes SaaS — Documentación técnica

Documento breve que describe el flujo de suscripción, la relación con Stripe y las limitaciones actuales del sistema de suscripciones en el backend.

## Resumen
Breve guía técnica sobre cómo funciona el flujo de suscripción en el backend, qué datos se sincronizan con Stripe y qué limitaciones operativas y de seguridad existen actualmente.

## Flujo de suscripción

1. Crear sesión de Checkout
   - Cliente autenticado solicita suscribirse a un `plan_id` vía `POST /api/subscriptions`.
   - Backend valida usuario y plan, crea/obtiene `stripeCustomerId` usando el servicio Stripe y actualiza `users.stripe_customer_id` si es necesario.
   - Backend invoca `StripeService.createCheckoutSession` con `priceId`, `customerId`, `successUrl` y `cancelUrl` y añade metadata: `user_id`, `plan_id` y (opcional) `local_subscription_id`.
   - Respuesta al frontend: `sessionId` y `checkout_url`.

2. Pago y activación local
   - Usuario completa el pago en Stripe mediante la `checkout_url`.
   - El frontend consulta `GET /api/subscriptions/checkout-status/:sessionId`.
   - Backend obtiene la sesión con `StripeService.getCheckoutSession(sessionId)`.
   - Si `session.payment_status === "paid"` y existe `session.metadata`, se ejecuta `activateSubscriptionFromSession`:
     - Se leen `user_id`, `plan_id`, `local_subscription_id` y `subscription` (ID de Stripe) desde la sesión.
     - Se busca o crea/actualiza un registro en `user_subscriptions` con `estado = ACTIVE`, `stripe_subscription_id`, `fecha_inicio`, `fecha_fin` (calculada localmente según `plan.intervalo`) y `cancelar_al_final = false`.
   - Respuesta al cliente incluye estado de la sesión y `subscription_id` (Stripe).

3. Gestión y sincronización de planes
   - Endpoints existentes:
     - `POST /api/subscriptions/plans/:planId/sync` — sincroniza un plan individual con Stripe.
     - `POST /api/subscriptions/plans/sync-all` — sincroniza todos los planes activos sin `stripe_product_id`.
   - Campos relevantes en `SubscriptionPlan`: `stripe_product_id`, `stripe_price_id`, `precio`, `intervalo`.

## Relación con Stripe

- Operaciones realizadas contra Stripe desde el backend:
  - Crear/obtener Customer (guardar `users.stripe_customer_id`).
  - Crear Product / Price al sincronizar un `SubscriptionPlan`.
  - Crear Checkout Session para pagos iniciales, con metadata que liga sesión a usuario y plan.
  - Consultar Checkout Session on-demand para confirmar pago y activar suscripción local.

- Identificadores persistidos en la base de datos:
  - `users.stripe_customer_id`
  - `subscription_plans.stripe_product_id`, `stripe_price_id`
  - `user_subscriptions.stripe_subscription_id`

- Configuración esperada:
  - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (requeridos)
  - `STRIPE_WEBHOOK_SECRET` (definido en configuración pero tratado actualmente como opcional)

- Nota importante: actualmente NO existe un handler de webhook para procesar eventos de Stripe (por ejemplo, `invoice.payment_failed`, `customer.subscription.deleted`, `invoice.paid`). La sincronización se hace únicamente por consulta directa de sesiones y acciones del frontend.

## Limitaciones actuales

1. Ausencia de webhooks (sincronización pasiva)
   - No hay endpoint ni lógica que procese eventos entrantes de Stripe.
   - Impacto: cancelaciones, reembolsos y fallos de renovación iniciados en Stripe no se reflejan en el sistema local.

2. Validación insuficiente en `checkout-status`
   - El endpoint que confirma la sesión no valida que el `user_id` en la metadata coincida con el usuario autenticado que realiza la petición.
   - Riesgo: un atacante con un `sessionId` válido podría consultar/activar la sesión de otro usuario.

3. Dependencia del frontend para activar suscripciones
   - La activación local depende de que el frontend invoque `GET /checkout-status/:sessionId` tras el pago.
   - Si el frontend no llama, la suscripción puede no activarse aunque Stripe haya cobrado.

4. `cancelar_al_final` y estado `CANCELED` no operativos
   - El modelo contiene `cancelar_al_final` y el enum incluye `CANCELED`, pero no se encontró lógica que permita marcar o procesar cancelaciones desde la API.

5. Desajuste de fechas y periodos
   - `fecha_fin` se calcula localmente (mes/año) sin reconciliar con `current_period_end` de Stripe.
   - Esto puede producir divergencias en límites de acceso y ventanas de renovación.

6. Cambios de plan (upgrades/downgrades) bloqueados
   - Si hay una suscripción `ACTIVE` local, la creación de una nueva sesión devuelve error obligando a cancelar primero.

7. Manejo de fallos de cobro y retries inexistente
   - No hay reacción automática a eventos como `invoice.payment_failed` o `invoice.paid`.
   - Usuarios en `past_due` o `unpaid` no son detectados automáticamente.

8. Webhook secret no exigido
   - `STRIPE_WEBHOOK_SECRET` existe en configuración pero no se exige; implementar webhooks sin validación estricta es peligroso.

## Recomendaciones (resumen rápido)

- Implementar un endpoint de webhooks y exigir `STRIPE_WEBHOOK_SECRET` para validar la firma.
- Validar que `user_id` en metadata coincida con el usuario autenticado en `checkout-status` antes de activar localmente.
- Añadir endpoints explícitos para cancelar ahora y cancelar al final del periodo, y exponer la acción desde el frontend.
- Reconciliar `fecha_fin` con `current_period_end` de Stripe al procesar eventos y mediante reconciliaciones periódicas.
- Documentar y automatizar el manejo de `invoice.payment_failed`, `invoice.paid`, `customer.subscription.updated` y `customer.subscription.deleted`.

---

Documento generado y guardado en `DOCS/SAAS_PLANS.md`.
