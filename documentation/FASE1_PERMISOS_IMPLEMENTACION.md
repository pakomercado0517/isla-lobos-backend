# 📋 Fase 1: Estructura Base - Sistema de Permisos

## 🎯 **Objetivo Completado**

Implementar la estructura base para el sistema de gestión de permisos y notificaciones de vencimiento para prestadores de servicios en Isla Lobos.

## ✅ **Cambios Implementados**

### 1. **Modelo User Actualizado** (`src/models/User.ts`)

#### **Nuevos Campos Agregados:**

- `fechaVencimientoPermiso?: Date` - Fecha de vencimiento del permiso
- `estadoPermiso: EstadoPermiso` - Estado actual del permiso
- `diasNotificacion: number` - Días antes del vencimiento para notificar (default: 30)
- `ultimaNotificacion?: Date` - Última fecha de notificación enviada
- `motivoSuspension?: string` - Motivo de suspensión del permiso

#### **Nuevo Enum EstadoPermiso:**

```typescript
export enum EstadoPermiso {
  VIGENTE = "vigente", // Permiso activo y válido
  POR_VENCER = "por_vencer", // Permiso próximo a vencer
  VENCIDO = "vencido", // Permiso expirado
  SUSPENDIDO = "suspendido", // Usuario suspendido por otras razones
}
```

#### **Métodos Útiles Agregados:**

- `isPermisoPorVencer()` - Verifica si el permiso está próximo a vencer
- `isPermisoVencido()` - Verifica si el permiso está vencido
- `getDiasRestantesPermiso()` - Obtiene días restantes del permiso
- `actualizarEstadoPermiso()` - Actualiza automáticamente el estado del permiso

### 2. **Tipos TypeScript Actualizados** (`src/types/index.ts`)

- Agregado `EstadoPermiso` enum
- Actualizada interfaz `User` con nuevos campos de permisos
- Mantenida compatibilidad con tipos existentes

### 3. **Migración de Base de Datos** (`migrations/20241226000001-add-permisos-fields-to-users.js`)

#### **Nuevas Columnas en Tabla `users`:**

```sql
-- Campos de vigencia de permisos
fecha_vencimiento_permiso TIMESTAMP NULL
estado_permiso ENUM('vigente', 'por_vencer', 'vencido', 'suspendido') NOT NULL DEFAULT 'vigente'
dias_notificacion INTEGER NOT NULL DEFAULT 30
ultima_notificacion TIMESTAMP NULL
motivo_suspension TEXT NULL
```

#### **Índices Agregados:**

- `idx_users_estado_permiso` - Para consultas por estado
- `idx_users_fecha_vencimiento_permiso` - Para consultas de vencimiento
- `idx_users_ultima_notificacion` - Para consultas de notificaciones

### 4. **Seeders Actualizados** (`seeders/20241225000001-demo-users.js`)

#### **Datos de Prueba Incluidos:**

- **Admin CONANP**: Sin restricciones de permiso
- **Juan Pérez**: Permiso vigente (vence en 30 días)
- **María González**: Permiso próximo a vencer (15 días)
- **Carlos Rodríguez**: Permiso muy próximo a vencer (7 días)
- **Ana Martínez**: Permiso vencido (hace 5 días) - Usuario inactivo

## 🔧 **Cómo Aplicar los Cambios**

### **Paso 1: Ejecutar Migración**

```bash
# Aplicar la migración
npx sequelize-cli db:migrate

# Verificar que se aplicó correctamente
npx sequelize-cli db:migrate:status
```

### **Paso 2: Limpiar y Re-ejecutar Seeders**

```bash
# Limpiar datos existentes
npm run seed:clean

# Ejecutar seeders con nuevos datos
npm run seed:demo
```

### **Paso 3: Verificar Datos**

```bash
# Verificar que los datos se insertaron correctamente
node scripts/check-data.js
```

## 📊 **Estructura de Datos Resultante**

### **Tabla `users` Actualizada:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol ENUM('conanp', 'prestador') NOT NULL DEFAULT 'prestador',
  activo BOOLEAN NOT NULL DEFAULT true,

  -- NUEVOS CAMPOS DE PERMISOS
  fecha_vencimiento_permiso TIMESTAMP NULL,
  estado_permiso ENUM('vigente', 'por_vencer', 'vencido', 'suspendido') NOT NULL DEFAULT 'vigente',
  dias_notificacion INTEGER NOT NULL DEFAULT 30,
  ultima_notificacion TIMESTAMP NULL,
  motivo_suspension TEXT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 **Datos de Prueba Disponibles**

### **Usuarios con Diferentes Estados de Permiso:**

1. **Admin CONANP** (`admin@conanp.gob.mx`)

   - Estado: `vigente`
   - Sin fecha de vencimiento (sin restricciones)

2. **Juan Pérez** (`juan.perez@ejemplo.com`)

   - Estado: `vigente`
   - Vence en: 30 días
   - Sin notificaciones previas

3. **María González** (`maria.gonzalez@ejemplo.com`)

   - Estado: `por_vencer`
   - Vence en: 15 días
   - Notificada hace 2 días

4. **Carlos Rodríguez** (`carlos.rodriguez@ejemplo.com`)

   - Estado: `por_vencer`
   - Vence en: 7 días
   - Notificada ayer

5. **Ana Martínez** (`ana.martinez@ejemplo.com`)
   - Estado: `vencido`
   - Vencido hace: 5 días
   - Usuario inactivo
   - Motivo: "Permiso vencido - requiere renovación"

## 🔍 **Consultas Útiles para Pruebas**

### **Verificar Estados de Permiso:**

```sql
-- Usuarios con permisos próximos a vencer
SELECT nombre, email, estado_permiso, fecha_vencimiento_permiso
FROM users
WHERE estado_permiso = 'por_vencer';

-- Usuarios con permisos vencidos
SELECT nombre, email, estado_permiso, fecha_vencimiento_permiso, motivo_suspension
FROM users
WHERE estado_permiso = 'vencido';

-- Usuarios que necesitan notificación
SELECT nombre, email, fecha_vencimiento_permiso, ultima_notificacion
FROM users
WHERE fecha_vencimiento_permiso IS NOT NULL
  AND fecha_vencimiento_permiso <= NOW() + INTERVAL '30 days'
  AND (ultima_notificacion IS NULL OR ultima_notificacion < NOW() - INTERVAL '1 day');
```

## 🚀 **Próximos Pasos (Fases Futuras)**

### **Fase 2: Lógica de Negocio**

- [ ] Implementar `NotificationService`
- [ ] Crear endpoints de gestión de permisos
- [ ] Implementar validaciones de permisos

### **Fase 3: Automatización**

- [ ] Configurar cron jobs para verificación diaria
- [ ] Implementar sistema de notificaciones automáticas
- [ ] Crear logs y auditoría de cambios

### **Fase 4: Dashboard**

- [ ] Endpoints de estadísticas de permisos
- [ ] Reportes de vencimientos
- [ ] Historial de notificaciones

## ⚠️ **Consideraciones Importantes**

1. **Compatibilidad**: Los cambios son retrocompatibles con el sistema existente
2. **Performance**: Se agregaron índices para optimizar consultas frecuentes
3. **Validación**: Los campos tienen validaciones apropiadas (días_notificacion: 1-365)
4. **Flexibilidad**: El sistema permite diferentes configuraciones por usuario
5. **Auditoría**: Se mantiene el historial de notificaciones y cambios

## 🎉 **Resultado Final**

La **Fase 1** está **100% completada** y lista para ser aplicada. El sistema ahora tiene:

- ✅ **Estructura de base de datos** para permisos
- ✅ **Modelo de datos** actualizado con métodos útiles
- ✅ **Tipos TypeScript** actualizados
- ✅ **Datos de prueba** con diferentes escenarios
- ✅ **Migración** lista para aplicar
- ✅ **Documentación** completa

¡El sistema está preparado para las siguientes fases de implementación! 🚀
