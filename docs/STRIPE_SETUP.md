# Configuración de Stripe

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Opcional - Solo necesario para webhooks
```

## Obtener las Claves de Stripe

### 1. Crear Cuenta en Stripe

1. Ve a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crea una cuenta o inicia sesión

### 2. Obtener las Claves de API

1. Ve al Dashboard de Stripe
2. Navega a **Developers** → **API keys**
3. Copia las claves:
   - **Publishable key** (pk_test_...) → `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (sk_test_...) → `STRIPE_SECRET_KEY`

⚠️ **IMPORTANTE**: Nunca compartas tu `STRIPE_SECRET_KEY` públicamente ni la incluyas en el código del frontend.

### 3. Configurar Webhook Secret (Opcional)

Solo necesario si vas a recibir eventos de Stripe (pagos completados, suscripciones canceladas, etc.):

1. Ve a **Developers** → **Webhooks**
2. Click en **Add endpoint**
3. URL del endpoint: `https://tu-dominio.com/api/webhooks/stripe`
4. Selecciona los eventos que quieres recibir
5. Copia el **Signing secret** (whsec_...) → `STRIPE_WEBHOOK_SECRET`

## Modo de Prueba vs Producción

### Modo de Prueba (Test Mode)

- Las claves comienzan con `sk_test_` y `pk_test_`
- No se realizan cargos reales
- Usa tarjetas de prueba de Stripe

**Tarjetas de Prueba:**

```
Visa exitosa: 4242 4242 4242 4242
Mastercard exitosa: 5555 5555 5555 4444
Pago rechazado: 4000 0000 0000 0002

Fecha de expiración: Cualquier fecha futura
CVC: Cualquier 3 dígitos
```

### Modo de Producción (Live Mode)

- Las claves comienzan con `sk_live_` y `pk_live_`
- Se realizan cargos reales
- Requiere activación de cuenta en Stripe

## Verificar Configuración

Puedes verificar que Stripe está configurado correctamente ejecutando:

```bash
pnpm dev
```

Si las variables de entorno no están configuradas, verás un error al iniciar el servidor.

## Seguridad

### ✅ Buenas Prácticas

- Mantén `STRIPE_SECRET_KEY` en el backend únicamente
- Usa variables de entorno, nunca hardcodees las claves
- Usa diferentes claves para desarrollo y producción
- Rota las claves periódicamente
- Limita el acceso al Dashboard de Stripe

### ❌ Nunca Hagas Esto

- Compartir `STRIPE_SECRET_KEY` en repositorios públicos
- Incluir claves en el código del frontend
- Usar claves de producción en desarrollo
- Compartir claves por email o chat

## Recursos Adicionales

- [Documentación de Stripe](https://stripe.com/docs)
- [API Reference](https://stripe.com/docs/api)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)
