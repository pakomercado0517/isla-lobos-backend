# Sincronización de Planes con Stripe

Este documento explica cómo sincronizar tus planes de suscripción locales con Stripe.

## Flujo de Sincronización

1. **Crear planes en tu base de datos local** (ya existentes)
2. **Sincronizar con Stripe** usando los endpoints provistos
3. **Usar los `stripe_price_id` para Checkout**

## Endpoints Disponibles

### 1. Sincronizar un Plan Específico

```http
POST /api/subscriptions/plans/:planId/sync
Authorization: Bearer <token>
```

**Respuesta exitosa:**
```json
{
  "status": "success",
  "message": "Plan sincronizado exitosamente con Stripe",
  "data": {
    "plan_id": "uuid-plan",
    "stripe_product_id": "prod_...",
    "stripe_price_id": "price_..."
  }
}
```

### 2. Sincronizar Todos los Planes Activos

```http
POST /api/subscriptions/plans/sync-all
Authorization: Bearer <token>
```

**Respuesta exitosa:**
```json
{
  "status": "success",
  "message": "2 de 2 planes sincronizados exitosamente",
  "data": {
    "synced": 2,
    "total": 2,
    "results": [
      {
        "plan_id": "uuid-1",
        "codigo": "basic_monthly",
        "success": true,
        "stripe_product_id": "prod_...",
        "stripe_price_id": "price_..."
      },
      {
        "plan_id": "uuid-2",
        "codigo": "premium_yearly",
        "success": true,
        "stripe_product_id": "prod_...",
        "stripe_price_id": "price_..."
      }
    ]
  }
}
```

## Ejemplo de Uso con cURL

### Sincronizar un plan específico:

```bash
curl -X POST http://localhost:3001/api/subscriptions/plans/UUID_DEL_PLAN/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Sincronizar todos los planes:

```bash
curl -X POST http://localhost:3001/api/subscriptions/plans/sync-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Qué Sucede Durante la Sincronización

1. **Se crea un Producto en Stripe** con:
   - Nombre del plan
   - Descripción (si existe)
   - Metadata: `plan_id` y `plan_code`

2. **Se crea un Precio Recurrente en Stripe** con:
   - Monto (convertido a centavos automáticamente)
   - Moneda (MXN, USD, etc.)
   - Intervalo (month o year)
   - Metadata: `plan_id` y `plan_code`

3. **Se actualiza el plan local** con:
   - `stripe_product_id`
   - `stripe_price_id`

## Validaciones

- ✅ Solo sincroniza planes que NO tengan `stripe_product_id`
- ✅ Verifica que el plan exista en la base de datos
- ✅ Maneja errores individuales en sincronización masiva
- ✅ Registra logs detallados de cada operación

## Verificar en Stripe Dashboard

Después de sincronizar, puedes verificar en:

1. **Productos**: https://dashboard.stripe.com/test/products
2. **Precios**: Dentro de cada producto

Deberías ver:
- Nombre del producto
- Precio y moneda
- Intervalo de facturación
- Metadata con `plan_id` y `plan_code`

## Ejemplo de Datos en Stripe

**Producto:**
```
Nombre: Plan Básico Mensual
ID: prod_ABC123
Metadata:
  - plan_id: uuid-del-plan-local
  - plan_code: basic_monthly
```

**Precio:**
```
ID: price_XYZ789
Monto: $599.00 MXN / mes
Tipo: Recurrente
Metadata:
  - plan_id: uuid-del-plan-local
  - plan_code: basic_monthly
```

## Troubleshooting

### Error: "El plan ya está sincronizado con Stripe"

**Causa**: El plan ya tiene `stripe_product_id` y `stripe_price_id`.

**Solución**: 
- Si necesitas re-sincronizar, primero limpia los campos en la BD
- O crea un nuevo plan

### Error: "Stripe no está configurado correctamente"

**Causa**: Falta `STRIPE_SECRET_KEY` en `.env`

**Solución**: Configura las variables de entorno según `docs/STRIPE_SETUP.md`

### Error: "No se pudo crear el producto en Stripe"

**Causa**: Problema de conexión o credenciales inválidas

**Solución**:
1. Verifica que `STRIPE_SECRET_KEY` sea válida
2. Verifica conexión a internet
3. Revisa los logs del servidor para más detalles

## Próximos Pasos

Una vez sincronizados los planes:

1. **Implementar Stripe Checkout** usando los `stripe_price_id`
2. **Configurar Webhooks** para actualizar estados de suscripción
3. **Crear portal de cliente** para gestionar suscripciones

## Notas Importantes

- 🔒 Los endpoints requieren autenticación
- 💰 Los precios se convierten automáticamente a centavos
- 🔄 La sincronización es idempotente (no crea duplicados)
- 📝 Todos los eventos se registran en logs
- ⚠️ Solo funciona con planes activos (`activo: true`)
