# 🌤️ **Documentación API - Clima**

## 🌤️ **ClimaController - Gestión de Condiciones Meteorológicas**

### **Descripción General**

El `ClimaController` maneja todas las operaciones relacionadas con las condiciones meteorológicas del sistema Isla Lobos. Incluye CRUD completo, predicciones, alertas automáticas y estadísticas meteorológicas.

---

## 🔗 **Endpoints Disponibles**

### **1. Obtener Todas las Condiciones Meteorológicas**

```http
GET /api/clima
```

**Descripción**: Obtiene una lista paginada de todas las condiciones meteorológicas con filtros opcionales.

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
| `fecha_inicio` | string | No | Fecha de inicio (YYYY-MM-DD) |
| `fecha_fin` | string | No | Fecha de fin (YYYY-MM-DD) |
| `estado_puerto` | string | No | Estado del puerto: `abierto`, `restricciones`, `cerrado`, `emergencia` |
| `fuente` | string | No | Fuente de los datos (ej: CONAGUA, NOAA) |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Condiciones meteorológicas obtenidas exitosamente",
  "data": {
    "condiciones": [
      {
        "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
        "fecha_hora": "2025-09-26T16:31:53.994Z",
        "oleaje": 1.2,
        "viento_velocidad": 15.5,
        "viento_direccion": "NE",
        "visibilidad": "Buena",
        "estado_puerto": "abierto",
        "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
        "fuente": "CONAGUA",
        "createdAt": "2025-09-26T16:31:53.994Z",
        "updatedAt": "2025-09-26T16:31:53.994Z"
      }
    ],
    "condicion_actual": {
      "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.2,
      "viento_velocidad": 15.5,
      "viento_direccion": "NE",
      "visibilidad": "Buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
      "fuente": "CONAGUA"
    },
    "estadisticas": {
      "total": 4,
      "abierto": 2,
      "restricciones": 1,
      "cerrado": 1,
      "emergencia": 0
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1
    }
  }
}
```

---

### **2. Obtener Condición Meteorológica por ID**

```http
GET /api/clima/:id
```

**Descripción**: Obtiene una condición meteorológica específica por su ID.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | UUID | Sí | ID único de la condición meteorológica |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Condición meteorológica obtenida exitosamente",
  "data": {
    "condicion": {
      "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.2,
      "viento_velocidad": 15.5,
      "viento_direccion": "NE",
      "visibilidad": "Buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
      "fuente": "CONAGUA",
      "createdAt": "2025-09-26T16:31:53.994Z",
      "updatedAt": "2025-09-26T16:31:53.994Z"
    }
  }
}
```

---

### **3. Crear Nueva Condición Meteorológica**

```http
POST /api/clima
```

**Descripción**: Crea una nueva condición meteorológica en el sistema (solo CONANP).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:

```json
{
  "fecha_hora": "2025-09-26T18:00:00Z",
  "oleaje": 1.5,
  "viento_velocidad": 18.0,
  "viento_direccion": "SE",
  "visibilidad": "buena",
  "estado_puerto": "abierto",
  "prediccion_5_dias": "Condiciones favorables para salidas",
  "fuente": "CONAGUA"
}
```

**Campos Requeridos**:
| Campo | Tipo | Descripción | Validaciones |
|-------|------|-------------|--------------|
| `fecha_hora` | string | Fecha y hora de la medición | ISO 8601, no futuro, no más de 24h atrás |
| `oleaje` | number | Altura del oleaje en metros | 0-10 metros |
| `viento_velocidad` | number | Velocidad del viento en km/h | 0-100 km/h |
| `viento_direccion` | string | Dirección del viento | 2-20 caracteres, solo letras |
| `visibilidad` | string | Nivel de visibilidad | `excelente`, `buena`, `regular`, `baja` |
| `estado_puerto` | string | Estado del puerto | `abierto`, `restricciones`, `cerrado`, `emergencia` |
| `fuente` | string | Fuente de los datos | 2-50 caracteres |

**Campos Opcionales**:
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `prediccion_5_dias` | string | Predicción meteorológica (max 1000 caracteres) |

**Respuesta Exitosa (201)**:

```json
{
  "status": "success",
  "message": "Condición meteorológica creada exitosamente",
  "data": {
    "condicion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "fecha_hora": "2025-09-26T18:00:00.000Z",
      "oleaje": 1.5,
      "viento_velocidad": 18.0,
      "viento_direccion": "SE",
      "visibilidad": "buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones favorables para salidas",
      "fuente": "CONAGUA",
      "createdAt": "2025-09-26T18:00:00.000Z",
      "updatedAt": "2025-09-26T18:00:00.000Z"
    }
  }
}
```

---

### **4. Actualizar Condición Meteorológica**

```http
PUT /api/clima/:id
```

**Descripción**: Actualiza una condición meteorológica existente (solo CONANP).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | UUID | Sí | ID único de la condición meteorológica |

**Body** (todos los campos son opcionales):

```json
{
  "oleaje": 2.0,
  "viento_velocidad": 22.0,
  "visibilidad": "regular",
  "estado_puerto": "restricciones",
  "prediccion_5_dias": "Condiciones variables, precaución"
}
```

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Condición meteorológica actualizada exitosamente",
  "data": {
    "condicion": {
      "id": "c6790ee5-530f-4605-9035-3ba12acede3e",
      "fecha_hora": "2025-09-26T18:00:00.000Z",
      "oleaje": 2.0,
      "viento_velocidad": 22.0,
      "viento_direccion": "SE",
      "visibilidad": "regular",
      "estado_puerto": "restricciones",
      "prediccion_5_dias": "Condiciones variables, precaución",
      "fuente": "CONAGUA",
      "createdAt": "2025-09-26T18:00:00.000Z",
      "updatedAt": "2025-09-26T18:30:00.000Z"
    }
  }
}
```

---

### **5. Eliminar Condición Meteorológica**

```http
DELETE /api/clima/:id
```

**Descripción**: Elimina una condición meteorológica del sistema (solo CONANP).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | UUID | Sí | ID único de la condición meteorológica |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Condición meteorológica eliminada exitosamente"
}
```

---

### **6. Obtener Condición Actual**

```http
GET /api/clima/actual
```

**Descripción**: Obtiene la condición meteorológica más reciente.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Condición meteorológica actual obtenida exitosamente",
  "data": {
    "condicion": {
      "id": "bd8fc4e2-b824-499a-98d5-be143c6821ad",
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.2,
      "viento_velocidad": 15.5,
      "viento_direccion": "NE",
      "visibilidad": "Buena",
      "estado_puerto": "abierto",
      "prediccion_5_dias": "Condiciones estables para los próximos 5 días...",
      "fuente": "CONAGUA"
    },
    "tiempo_transcurrido_horas": 2,
    "necesita_actualizacion": false
  }
}
```

---

### **7. Obtener Predicción Meteorológica**

```http
GET /api/clima/prediccion
```

**Descripción**: Genera una predicción meteorológica basada en datos históricos.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `dias` | integer | No | Número de días para la predicción (default: 5, max: 30) |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Predicción meteorológica generada exitosamente",
  "data": {
    "prediccion": {
      "periodo_dias": 5,
      "promedio_oleaje": 1.4,
      "promedio_viento": 18.2,
      "tendencia_oleaje": "estable",
      "tendencia_viento": "decreciente",
      "recomendacion": "Condiciones favorables. Salidas recomendadas para todos los tipos de embarcación.",
      "condiciones_por_dia": [
        {
          "fecha": "2025-09-26T16:31:53.994Z",
          "oleaje": 1.2,
          "viento": 15.5,
          "estado_puerto": "abierto",
          "visibilidad": "Buena"
        }
      ]
    }
  }
}
```

---

### **8. Obtener Alertas Meteorológicas**

```http
GET /api/clima/alertas
```

**Descripción**: Obtiene alertas automáticas basadas en las condiciones actuales.

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Alertas meteorológicas obtenidas exitosamente",
  "data": {
    "alertas": [
      {
        "tipo": "oleaje_moderado",
        "severidad": "media",
        "mensaje": "Oleaje moderado: 1.5m. Precaución en salidas.",
        "valor": 1.5,
        "umbral": 1.5
      }
    ],
    "total_alertas": 1,
    "alertas_criticas": 0,
    "alertas_altas": 0,
    "alertas_medias": 1,
    "condicion_actual": {
      "fecha_hora": "2025-09-26T16:31:53.994Z",
      "oleaje": 1.5,
      "viento_velocidad": 18.0,
      "visibilidad": "Buena",
      "estado_puerto": "abierto"
    }
  }
}
```

---

### **9. Obtener Estadísticas Meteorológicas**

```http
GET /api/clima/estadisticas
```

**Descripción**: Obtiene estadísticas meteorológicas detalladas (solo CONANP).

**Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `fecha_inicio` | string | No | Fecha de inicio (YYYY-MM-DD) |
| `fecha_fin` | string | No | Fecha de fin (YYYY-MM-DD) |

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Estadísticas meteorológicas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "periodo": {
        "fecha_inicio": "2025-09-26T10:31:53.994Z",
        "fecha_fin": "2025-09-26T16:31:53.994Z",
        "total_registros": 4
      },
      "oleaje": {
        "promedio": 1.8,
        "minimo": 0.8,
        "maximo": 3.2,
        "registros_oleaje_alto": 2
      },
      "viento": {
        "promedio": 20.9,
        "minimo": 8.0,
        "maximo": 35.0,
        "registros_viento_fuerte": 1
      },
      "estado_puerto": {
        "abierto": 2,
        "restricciones": 1,
        "cerrado": 1,
        "emergencia": 0
      },
      "visibilidad": {
        "excelente": 1,
        "buena": 1,
        "regular": 1,
        "baja": 1
      }
    }
  }
}
```

---

## 🔐 **Permisos y Roles**

### **Acceso por Rol**:

- **CONANP**: Acceso completo a todas las operaciones
- **PRESTADOR**:
  - ✅ Ver condiciones meteorológicas
  - ✅ Ver condición actual
  - ✅ Ver predicciones
  - ✅ Ver alertas
  - ❌ Crear/actualizar/eliminar condiciones
  - ❌ Ver estadísticas detalladas

### **Autenticación Requerida**:

Todos los endpoints requieren autenticación JWT válida.

---

## 📊 **Estados del Puerto**

| Estado          | Descripción                                          |
| --------------- | ---------------------------------------------------- |
| `abierto`       | Puerto operativo, salidas permitidas                 |
| `restricciones` | Salidas con restricciones para embarcaciones menores |
| `cerrado`       | Puerto cerrado por condiciones adversas              |
| `emergencia`    | Puerto en estado de emergencia                       |

## 🌤️ **Niveles de Visibilidad**

| Nivel       | Descripción         |
| ----------- | ------------------- |
| `excelente` | Visibilidad > 10 km |
| `buena`     | Visibilidad 5-10 km |
| `regular`   | Visibilidad 2-5 km  |
| `baja`      | Visibilidad < 2 km  |

---

## 🚨 **Sistema de Alertas**

### **Tipos de Alertas**:

| Tipo                   | Severidad | Condición     | Descripción           |
| ---------------------- | --------- | ------------- | --------------------- |
| `oleaje_alto`          | Alta      | > 2.5m        | Suspender salidas     |
| `oleaje_moderado`      | Media     | > 1.5m        | Precaución en salidas |
| `viento_fuerte`        | Alta      | > 30 km/h     | Suspender salidas     |
| `viento_moderado`      | Media     | > 20 km/h     | Precaución en salidas |
| `visibilidad_baja`     | Alta      | Baja          | Suspender salidas     |
| `puerto_cerrado`       | Crítica   | Cerrado       | Puerto cerrado        |
| `restricciones_puerto` | Media     | Restricciones | Verificar condiciones |
| `emergencia`           | Crítica   | Emergencia    | Suspender actividades |

---

## ⚠️ **Códigos de Error Comunes**

| Código | Error                      | Descripción                             |
| ------ | -------------------------- | --------------------------------------- |
| `400`  | `VALIDATION_ERROR`         | Errores de validación en los datos      |
| `401`  | `UNAUTHORIZED`             | Token de autenticación inválido         |
| `403`  | `FORBIDDEN`                | Sin permisos para la operación          |
| `404`  | `CONDICION_NOT_FOUND`      | Condición meteorológica no encontrada   |
| `404`  | `NO_CONDITIONS_FOUND`      | No hay condiciones registradas          |
| `404`  | `NO_DATA_FOR_PREDICTION`   | No hay datos para generar predicción    |
| `409`  | `CONDICION_ALREADY_EXISTS` | Ya existe condición para esa fecha/hora |
| `500`  | `INTERNAL_SERVER_ERROR`    | Error interno del servidor              |

---

## 🧪 **Ejemplos de Uso**

### **Crear Condición Meteorológica**:

```bash
curl -X POST http://localhost:3001/api/clima \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_hora": "2025-09-26T18:00:00Z",
    "oleaje": 1.5,
    "viento_velocidad": 18.0,
    "viento_direccion": "SE",
    "visibilidad": "buena",
    "estado_puerto": "abierto",
    "fuente": "CONAGUA"
  }'
```

### **Obtener Alertas**:

```bash
curl "http://localhost:3001/api/clima/alertas" \
  -H "Authorization: Bearer <token>"
```

### **Obtener Predicción**:

```bash
curl "http://localhost:3001/api/clima/prediccion?dias=7" \
  -H "Authorization: Bearer <token>"
```

---

## 📝 **Notas Importantes**

1. **Prevención de Duplicados**: No se pueden crear condiciones para la misma fecha/hora.
2. **Validación de Fechas**: Las fechas no pueden ser futuras ni más de 24 horas en el pasado.
3. **Alertas Automáticas**: El sistema genera alertas automáticas basadas en umbrales predefinidos.
4. **Predicciones**: Basadas en análisis de tendencias de datos históricos.
5. **Estadísticas**: Solo disponibles para usuarios CONANP.
6. **Fuentes**: Se registra la fuente de los datos para trazabilidad.

---

## 🔄 **Próximas Mejoras**

- [ ] Integración con APIs meteorológicas externas
- [ ] Predicciones más avanzadas con ML
- [ ] Notificaciones automáticas por email/SMS
- [ ] Historial de cambios de condiciones
- [ ] Gráficos y visualizaciones
- [ ] Exportación de reportes meteorológicos
