# 📋 **Documentación API - Embarcaciones**

## 🚢 **EmbarcacionController - Gestión de Embarcaciones**

### **Descripción General**

El `EmbarcacionController` maneja todas las operaciones relacionadas con las embarcaciones del sistema Isla Lobos. Incluye CRUD completo, filtros avanzados, estadísticas y gestión de estados.

---

## 🔗 **Endpoints Disponibles**

### **1. Obtener Todas las Embarcaciones**

```http
GET /api/embarcaciones
```

**Descripción**: Obtiene una lista paginada de todas las embarcaciones con filtros opcionales.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | integer | No | Número de página (default: 1) |
| `limit` | integer | No | Elementos por página (default: 10, max: 100) |
| `estado` | string | No | Filtrar por estado: `disponible`, `en_uso`, `mantenimiento` |
| `tipo` | string | No | Filtrar por tipo: `menor`, `mayor` |
| `prestador_id` | UUID | No | Filtrar por prestador específico |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Embarcaciones obtenidas exitosamente",
  "data": {
    "embarcaciones": [
      {
        "id": "b5c54240-b74e-4ff8-9bb5-95804521fbb4",
        "nombre": "Isla Dorada",
        "matricula": "VER-002-DEF",
        "capacidad": 40,
        "tipo": "mayor",
        "estado": "disponible",
        "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "createdAt": "2025-09-26T16:31:48.340Z",
        "updatedAt": "2025-09-26T16:31:48.340Z",
        "prestador": {
          "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
          "nombre": "Juan Pérez",
          "email": "juan.perez@ejemplo.com",
          "telefono": "+52 229 123 4567"
        }
      }
    ],
    "estadisticas": {
      "total": 6,
      "disponibles": 4,
      "en_uso": 1,
      "mantenimiento": 1,
      "menor": 4,
      "mayor": 2
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

---

### **2. Obtener Embarcación por ID**

```http
GET /api/embarcaciones/:id
```

**Descripción**: Obtiene una embarcación específica por su ID.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | UUID | Sí | ID único de la embarcación |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Embarcación obtenida exitosamente",
  "data": {
    "embarcacion": {
      "id": "b5c54240-b74e-4ff8-9bb5-95804521fbb4",
      "nombre": "Isla Dorada",
      "matricula": "VER-002-DEF",
      "capacidad": 40,
      "tipo": "mayor",
      "estado": "disponible",
      "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
      "createdAt": "2025-09-26T16:31:48.340Z",
      "updatedAt": "2025-09-26T16:31:48.340Z",
      "prestador": {
        "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567"
      }
    }
  }
}
```

**Respuesta de Error (404)**:

```json
{
  "status": "error",
  "message": "Embarcación no encontrada",
  "error": "EMBARCACION_NOT_FOUND"
}
```

---

### **3. Crear Nueva Embarcación**

```http
POST /api/embarcaciones
```

**Descripción**: Crea una nueva embarcación en el sistema.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:

```json
{
  "nombre": "Nueva Embarcacion",
  "matricula": "VER-007-ABC",
  "capacidad": 30,
  "tipo": "menor",
  "estado": "disponible",
  "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233"
}
```

**Campos Requeridos**:
| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `nombre` | string | Nombre de la embarcación | 2-100 caracteres, solo letras, números, espacios, guiones |
| `matricula` | string | Matrícula única | 3-20 caracteres, solo mayúsculas, números, guiones |
| `capacidad` | integer | Capacidad de pasajeros | 1-1000 personas |
| `tipo` | string | Tipo de embarcación | `menor` o `mayor` |
| `prestador_id` | UUID | ID del prestador propietario | UUID válido de usuario prestador |

**Campos Opcionales**:
| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `estado` | string | Estado inicial | `disponible` |

**Respuesta Exitosa (201)**:

```json
{
  "status": "success",
  "message": "Embarcación creada exitosamente",
  "data": {
    "embarcacion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "nombre": "Nueva Embarcacion",
      "matricula": "VER-007-ABC",
      "capacidad": 30,
      "tipo": "menor",
      "estado": "disponible",
      "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
      "createdAt": "2025-09-26T17:10:48.238Z",
      "updatedAt": "2025-09-26T17:10:48.238Z",
      "prestador": {
        "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567"
      }
    }
  }
}
```

**Errores de Validación (400)**:

```json
{
  "status": "error",
  "message": "Errores de validación encontrados",
  "error": "VALIDATION_ERROR",
  "data": {
    "errors": [
      {
        "field": "nombre",
        "message": "El nombre es requerido",
        "value": ""
      }
    ]
  }
}
```

**Error de Duplicado (409)**:

```json
{
  "status": "error",
  "message": "Ya existe una embarcación con esa matrícula",
  "error": "EMBARCACION_ALREADY_EXISTS"
}
```

---

### **4. Actualizar Embarcación**

```http
PUT /api/embarcaciones/:id
```

**Descripción**: Actualiza una embarcación existente.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | UUID | Sí | ID único de la embarcación |

**Body** (todos los campos son opcionales):

```json
{
  "nombre": "Embarcacion Actualizada",
  "matricula": "VER-007-XYZ",
  "capacidad": 35,
  "tipo": "mayor",
  "estado": "en_uso",
  "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233"
}
```

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Embarcación actualizada exitosamente",
  "data": {
    "embarcacion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "nombre": "Embarcacion Actualizada",
      "matricula": "VER-007-XYZ",
      "capacidad": 35,
      "tipo": "mayor",
      "estado": "en_uso",
      "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
      "createdAt": "2025-09-26T17:10:48.238Z",
      "updatedAt": "2025-09-26T17:15:30.123Z",
      "prestador": {
        "id": "6352b123-ad6d-4c89-a6d5-de53220f1233",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567"
      }
    }
  }
}
```

---

### **5. Eliminar Embarcación**

```http
DELETE /api/embarcaciones/:id
```

**Descripción**: Elimina una embarcación del sistema.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | UUID | Sí | ID único de la embarcación |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Embarcación eliminada exitosamente"
}
```

**Error de Embarcación en Uso (400)**:

```json
{
  "status": "error",
  "message": "No se puede eliminar una embarcación que está en uso",
  "error": "EMBARCACION_IN_USE"
}
```

---

### **6. Obtener Mis Embarcaciones**

```http
GET /api/embarcaciones/mis-embarcaciones
```

**Descripción**: Obtiene las embarcaciones del prestador autenticado.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | integer | No | Número de página (default: 1) |
| `limit` | integer | No | Elementos por página (default: 10, max: 100) |
| `estado` | string | No | Filtrar por estado |
| `tipo` | string | No | Filtrar por tipo |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Mis embarcaciones obtenidas exitosamente",
  "data": {
    "embarcaciones": [...],
    "estadisticas": {
      "total": 3,
      "disponibles": 2,
      "en_uso": 1,
      "mantenimiento": 0,
      "menor": 2,
      "mayor": 1
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### **7. Obtener Estadísticas de Embarcaciones**

```http
GET /api/embarcaciones/estadisticas
```

**Descripción**: Obtiene estadísticas generales de embarcaciones (solo CONANP).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `prestador_id` | UUID | No | Filtrar estadísticas por prestador |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "total_embarcaciones": 7,
      "por_estado": {
        "disponible": 5,
        "en_uso": 1,
        "mantenimiento": 1
      },
      "por_tipo": {
        "menor": 5,
        "mayor": 2
      },
      "capacidad_total": 245
    }
  }
}
```

---

## 🔐 **Permisos y Roles**

### **Acceso por Rol**:

- **CONANP**: Acceso completo a todas las operaciones
- **PRESTADOR**:
  - ✅ Ver todas las embarcaciones
  - ✅ Ver sus propias embarcaciones (`/mis-embarcaciones`)
  - ✅ Crear embarcaciones
  - ✅ Actualizar sus embarcaciones
  - ✅ Eliminar sus embarcaciones
  - ❌ Ver estadísticas generales

### **Autenticación Requerida**:

Todos los endpoints requieren autenticación JWT válida.

---

## 📊 **Estados de Embarcación**

| Estado          | Descripción                         |
| --------------- | ----------------------------------- |
| `disponible`    | Embarcación disponible para salidas |
| `en_uso`        | Embarcación actualmente en uso      |
| `mantenimiento` | Embarcación en mantenimiento        |

## 🚢 **Tipos de Embarcación**

| Tipo    | Descripción                             |
| ------- | --------------------------------------- |
| `menor` | Embarcación menor (hasta 30 pasajeros)  |
| `mayor` | Embarcación mayor (más de 30 pasajeros) |

---

## ⚠️ **Códigos de Error Comunes**

| Código | Error                        | Descripción                             |
| ------ | ---------------------------- | --------------------------------------- |
| `400`  | `VALIDATION_ERROR`           | Errores de validación en los datos      |
| `400`  | `INVALID_USER_ROLE`          | Usuario no es un prestador válido       |
| `400`  | `EMBARCACION_IN_USE`         | No se puede eliminar embarcación en uso |
| `401`  | `UNAUTHORIZED`               | Token de autenticación inválido         |
| `403`  | `FORBIDDEN`                  | Sin permisos para la operación          |
| `404`  | `EMBARCACION_NOT_FOUND`      | Embarcación no encontrada               |
| `404`  | `PRESTADOR_NOT_FOUND`        | Prestador no encontrado                 |
| `409`  | `EMBARCACION_ALREADY_EXISTS` | Matrícula duplicada                     |
| `500`  | `INTERNAL_SERVER_ERROR`      | Error interno del servidor              |

---

## 🧪 **Ejemplos de Uso**

### **Crear Embarcación para Prestador**:

```bash
curl -X POST http://localhost:3001/api/embarcaciones \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mar Azul II",
    "matricula": "VER-008-ABC",
    "capacidad": 25,
    "tipo": "menor",
    "prestador_id": "6352b123-ad6d-4c89-a6d5-de53220f1233"
  }'
```

### **Filtrar Embarcaciones por Estado**:

```bash
curl "http://localhost:3001/api/embarcaciones?estado=disponible&tipo=mayor" \
  -H "Authorization: Bearer <token>"
```

### **Obtener Estadísticas**:

```bash
curl "http://localhost:3001/api/embarcaciones/estadisticas" \
  -H "Authorization: Bearer <token>"
```

---

## 📝 **Notas Importantes**

1. **Matrícula Única**: Cada embarcación debe tener una matrícula única en el sistema.
2. **Validación de Prestador**: Solo usuarios con rol `prestador` pueden ser asignados como propietarios.
3. **Eliminación Segura**: No se pueden eliminar embarcaciones que están en uso.
4. **Filtros Avanzados**: Todos los endpoints de listado soportan filtros múltiples.
5. **Paginación**: Todos los endpoints de listado incluyen paginación automática.
6. **Relaciones**: Las embarcaciones incluyen información del prestador en las respuestas.

---

## 🔄 **Próximas Mejoras**

- [ ] Campo `activo` para soft delete
- [ ] Historial de cambios de estado
- [ ] Notificaciones de mantenimiento
- [ ] Integración con sistema de salidas
- [ ] Reportes de utilización
