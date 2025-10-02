# 🎫 Invitación API Documentation

## Descripción General

El **InvitacionController** gestiona los códigos de invitación para el registro de nuevos usuarios en el sistema Isla Lobos. Permite crear, validar, usar y administrar invitaciones con control de expiración.

## 🔐 Autenticación

**Rutas que requieren autenticación:**

- Todas las rutas requieren token JWT válido
- Rutas de administración requieren rol `CONANP`

**Rutas públicas:**

- `POST /api/invitaciones/validar` - Validar código
- `POST /api/invitaciones/:id/usar` - Usar invitación

## 📋 Endpoints Disponibles

### 1. **Obtener Todas las Invitaciones**

**`GET /api/invitaciones`**

Obtiene una lista paginada de todas las invitaciones con filtros opcionales.

#### **Parámetros de Consulta**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `usada` (opcional): Filtrar por estado de uso (true/false)
- `creada_por` (opcional): Filtrar por ID del creador

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Invitaciones obtenidas exitosamente",
  "data": {
    "invitaciones": [
      {
        "id": "uuid",
        "codigo": "INV2025",
        "email": "usuario@ejemplo.com",
        "rol": "PRESTADOR",
        "expira_en": "2025-12-31T23:59:59.000Z",
        "usada": false,
        "creada_por": "uuid-creador",
        "created_at": "2025-09-26T12:00:00.000Z",
        "updated_at": "2025-09-26T12:00:00.000Z",
        "creador": {
          "id": "uuid",
          "nombre": "Admin CONANP",
          "email": "admin@conanp.gob.mx"
        },
        "usuario": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 2. **Obtener Invitación por ID**

**`GET /api/invitaciones/:id`**

Obtiene una invitación específica por su ID.

#### **Parámetros de Ruta**

- `id`: UUID de la invitación

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Invitación obtenida exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "usuario@ejemplo.com",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": false,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      },
      "usuario": null
    }
  }
}
```

### 3. **Crear Invitación**

**`POST /api/invitaciones`**

Crea una nueva invitación con código único.

#### **Cuerpo de la Petición**

```json
{
  "codigo": "INV2025",
  "fecha_expiracion": "2025-12-31T23:59:59.000Z"
}
```

#### **Campos Requeridos**

- `codigo`: Código único de invitación (6-20 caracteres, solo mayúsculas y números)

#### **Campos Opcionales**

- `fecha_expiracion`: Fecha de expiración (ISO 8601, default: 30 días)

#### **Respuesta Exitosa (201)**

```json
{
  "status": "success",
  "message": "Invitación creada exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": false,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      }
    }
  }
}
```

### 4. **Actualizar Invitación**

**`PUT /api/invitaciones/:id`**

Actualiza una invitación existente (solo si no ha sido usada).

#### **Parámetros de Ruta**

- `id`: UUID de la invitación

#### **Cuerpo de la Petición**

```json
{
  "fecha_expiracion": "2025-12-31T23:59:59.000Z"
}
```

#### **Campos Opcionales**

- `fecha_expiracion`: Nueva fecha de expiración (ISO 8601)

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Invitación actualizada exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": false,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      }
    }
  }
}
```

### 5. **Eliminar Invitación**

**`DELETE /api/invitaciones/:id`**

Elimina una invitación (solo si no ha sido usada).

#### **Parámetros de Ruta**

- `id`: UUID de la invitación

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Invitación eliminada exitosamente"
}
```

### 6. **Validar Código**

**`POST /api/invitaciones/validar`**

Valida un código de invitación sin marcarlo como usado.

#### **Cuerpo de la Petición**

```json
{
  "codigo": "INV2025"
}
```

#### **Campos Requeridos**

- `codigo`: Código de invitación a validar

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Código de invitación válido",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "",
      "rol": "PRESTADOR",
      "creada_por": "uuid-creador",
      "expira_en": "2025-12-31T23:59:59.000Z"
    }
  }
}
```

### 7. **Usar Invitación**

**`POST /api/invitaciones/:id/usar`**

Marca una invitación como usada y la asocia a un usuario.

#### **Parámetros de Ruta**

- `id`: UUID de la invitación

#### **Cuerpo de la Petición**

```json
{
  "usuario_id": "uuid-del-usuario"
}
```

#### **Campos Requeridos**

- `usuario_id`: UUID del usuario que usará la invitación

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Invitación marcada como usada exitosamente",
  "data": {
    "invitacion": {
      "id": "uuid",
      "codigo": "INV2025",
      "email": "uuid-del-usuario",
      "rol": "PRESTADOR",
      "expira_en": "2025-12-31T23:59:59.000Z",
      "usada": true,
      "creada_por": "uuid-creador",
      "creador": {
        "id": "uuid",
        "nombre": "Admin CONANP",
        "email": "admin@conanp.gob.mx"
      },
      "usuario": {
        "id": "uuid",
        "nombre": "Usuario Nuevo",
        "email": "usuario@ejemplo.com"
      }
    }
  }
}
```

### 8. **Estadísticas de Invitaciones**

**`GET /api/invitaciones/estadisticas`**

Obtiene estadísticas generales sobre las invitaciones.

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Estadísticas de invitaciones obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "generales": {
        "total": 50,
        "usadas": 15,
        "disponibles": 30,
        "expiradas": 5,
        "porcentaje_usadas": 30
      },
      "este_mes": {
        "creadas": 25,
        "usadas": 10
      },
      "top_creadores": [
        {
          "creador": {
            "id": "uuid",
            "nombre": "Admin CONANP",
            "email": "admin@conanp.gob.mx"
          },
          "total_creadas": 25
        }
      ]
    }
  }
}
```

## 🚨 Códigos de Error

### **400 Bad Request**

```json
{
  "status": "error",
  "message": "El código de invitación ya existe",
  "error": "INVITACION_CODE_EXISTS"
}
```

```json
{
  "status": "error",
  "message": "No se puede actualizar una invitación ya utilizada",
  "error": "INVITACION_ALREADY_USED"
}
```

```json
{
  "status": "error",
  "message": "El código de invitación ya ha sido utilizado",
  "error": "INVITATION_ALREADY_USED"
}
```

```json
{
  "status": "error",
  "message": "El código de invitación ha expirado",
  "error": "INVITATION_EXPIRED"
}
```

### **401 Unauthorized**

```json
{
  "status": "error",
  "message": "Token no válido o expirado",
  "error": "UNAUTHORIZED"
}
```

### **403 Forbidden**

```json
{
  "status": "error",
  "message": "Acceso denegado. Se requiere rol CONANP",
  "error": "FORBIDDEN"
}
```

### **404 Not Found**

```json
{
  "status": "error",
  "message": "Invitación no encontrada",
  "error": "INVITACION_NOT_FOUND"
}
```

```json
{
  "status": "error",
  "message": "Código de invitación no válido",
  "error": "INVALID_INVITATION_CODE"
}
```

### **500 Internal Server Error**

```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## 📝 Validaciones

### **Código de Invitación**

- **Longitud**: 6-20 caracteres
- **Formato**: Solo letras mayúsculas y números
- **Unicidad**: Debe ser único en el sistema
- **Ejemplo válido**: `INV2025`, `ABC123`, `TEST001`

### **Fecha de Expiración**

- **Formato**: ISO 8601
- **Validación**: Debe ser una fecha futura
- **Default**: 30 días desde la creación

### **UUIDs**

- **Formato**: UUID v4 válido
- **Validación**: Debe existir en la base de datos

## 🔧 Notas Técnicas

- **Códigos únicos**: El sistema valida que no existan códigos duplicados
- **Expiración automática**: Las invitaciones expiran según la fecha configurada
- **Uso único**: Una vez usada, la invitación no puede ser reutilizada
- **Auditoría**: Se registra quién creó y usó cada invitación
- **Zona horaria**: Todas las fechas están en `America/Mexico_City`

## 🚀 Casos de Uso

### **Para Administradores CONANP**

1. **Crear invitaciones**: Generar códigos para nuevos prestadores
2. **Monitorear uso**: Ver qué invitaciones han sido utilizadas
3. **Gestionar expiración**: Actualizar fechas de vencimiento
4. **Estadísticas**: Analizar patrones de uso de invitaciones

### **Para Usuarios (Público)**

1. **Validar código**: Verificar si un código es válido antes del registro
2. **Usar invitación**: Marcar como usada durante el proceso de registro
3. **Verificar expiración**: Confirmar que la invitación no ha expirado

### **Flujo de Registro**

1. **CONANP** crea invitación con código único
2. **Prestador** recibe el código por email/WhatsApp
3. **Prestador** valida el código antes de registrarse
4. **Sistema** marca la invitación como usada durante el registro
5. **CONANP** puede monitorear el uso en estadísticas

