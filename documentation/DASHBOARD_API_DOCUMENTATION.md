# 📊 Dashboard API Documentation

## Descripción General

El **DashboardController** proporciona una vista integral del sistema Isla Lobos, integrando datos de todos los módulos para ofrecer métricas, estadísticas y alertas en tiempo real.

## 🔐 Autenticación

**Todas las rutas requieren:**

- Token JWT válido
- Rol `CONANP` (administrador)

## 📋 Endpoints Disponibles

### 1. **Estadísticas Generales**

**`GET /api/dashboard/estadisticas`**

Obtiene estadísticas generales del sistema incluyendo usuarios, embarcaciones, bloques, salidas, invitaciones y clima.

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Estadísticas generales obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "sistema": {
        "fecha_actual": "2025-09-26T12:00:00.000Z",
        "uptime": 3600,
        "version": "1.0.0"
      },
      "usuarios": {
        "total": 15,
        "activos": 12,
        "por_vencer": 2,
        "vencidos": 1,
        "porcentaje_activos": 80
      },
      "embarcaciones": {
        "total": 25,
        "disponibles": 20,
        "en_uso": 3,
        "mantenimiento": 2,
        "porcentaje_disponibles": 80
      },
      "bloques": {
        "total": 42,
        "disponibles": 35,
        "llenos": 5,
        "cerrados": 2,
        "porcentaje_disponibles": 83
      },
      "salidas": {
        "total": 150,
        "programadas": 8,
        "en_curso": 3,
        "completadas": 135,
        "canceladas": 4,
        "este_mes": 45,
        "esta_semana": 12,
        "porcentaje_completadas": 90
      },
      "invitaciones": {
        "total": 50,
        "usadas": 15,
        "disponibles": 35,
        "porcentaje_usadas": 30
      },
      "clima": {
        "condicion_actual": {
          "fecha_hora": "2025-09-26T12:00:00.000Z",
          "oleaje": 1.2,
          "viento_velocidad": 15,
          "visibilidad": "buena",
          "estado_puerto": "abierto"
        }
      }
    }
  }
}
```

### 2. **Ocupación por Día**

**`GET /api/dashboard/ocupacion?dias=7`**

Analiza la ocupación de bloques por día en un período específico.

#### **Parámetros de Consulta**

- `dias` (opcional): Número de días a consultar (1-30, default: 7)

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Ocupación por día obtenida exitosamente",
  "data": {
    "ocupacion_por_dia": [
      {
        "fecha": "2025-09-20",
        "bloques": [
          {
            "id": "uuid",
            "nombre": "Bloque Matutino",
            "hora_inicio": "08:00",
            "hora_fin": "12:00",
            "capacidad_total": 50,
            "capacidad_registrada": 35,
            "estado": "activo",
            "porcentaje_ocupacion": 70
          }
        ],
        "total_capacidad": 150,
        "total_ocupados": 105,
        "porcentaje_ocupacion": 70
      }
    ],
    "estadisticas": {
      "periodo_dias": 7,
      "fecha_inicio": "2025-09-20T00:00:00.000Z",
      "fecha_fin": "2025-09-26T12:00:00.000Z",
      "total_bloques": 21,
      "total_salidas": 45,
      "promedio_ocupacion": 75,
      "bloques_llenos": 3,
      "bloques_disponibles": 18
    }
  }
}
```

### 3. **Estado de Embarcaciones**

**`GET /api/dashboard/embarcaciones`**

Obtiene el estado detallado de todas las embarcaciones agrupadas por prestador.

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Estado de embarcaciones obtenido exitosamente",
  "data": {
    "embarcaciones": [
      {
        "id": "uuid",
        "nombre": "Lancha María",
        "matricula": "ABC123",
        "capacidad": 20,
        "tipo": "menor",
        "estado": "disponible",
        "prestador": {
          "id": "uuid",
          "nombre": "Juan Pérez",
          "email": "juan@prestador.com",
          "telefono": "5551234567"
        }
      }
    ],
    "estadisticas": {
      "total": 25,
      "disponibles": 20,
      "en_uso": 3,
      "mantenimiento": 2,
      "por_tipo": {
        "menor": 15,
        "mayor": 10
      }
    },
    "por_prestador": [
      {
        "prestador": "uuid",
        "embarcaciones": [...],
        "total": 5,
        "disponibles": 4,
        "en_uso": 1,
        "mantenimiento": 0
      }
    ]
  }
}
```

### 4. **Estado de Permisos**

**`GET /api/dashboard/permisos`**

Monitorea el estado de permisos de todos los prestadores.

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Estado de permisos obtenido exitosamente",
  "data": {
    "estadisticas": {
      "total_prestadores": 12,
      "vigentes": 8,
      "por_vencer": 3,
      "vencidos": 1,
      "vencen_proximos_30_dias": 2
    },
    "usuarios_por_vencer": [
      {
        "id": "uuid",
        "nombre": "María García",
        "email": "maria@prestador.com",
        "fechaVencimientoPermiso": "2025-10-15T00:00:00.000Z",
        "estadoPermiso": "por_vencer",
        "diasNotificacion": 7
      }
    ],
    "usuarios_vencidos": [...],
    "usuarios_vencen_proximos_30_dias": [...],
    "todos_los_usuarios": [...]
  }
}
```

### 5. **Resumen Meteorológico**

**`GET /api/dashboard/clima?dias=7`**

Proporciona un resumen meteorológico con condiciones actuales y promedios.

#### **Parámetros de Consulta**

- `dias` (opcional): Número de días a consultar (1-30, default: 7)

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Resumen meteorológico obtenido exitosamente",
  "data": {
    "condicion_actual": {
      "id": "uuid",
      "fecha_hora": "2025-09-26T12:00:00.000Z",
      "oleaje": 1.2,
      "viento_velocidad": 15,
      "visibilidad": "buena",
      "estado_puerto": "abierto"
    },
    "promedios": {
      "oleaje": 1.1,
      "viento": 12.5
    },
    "estado_puerto": {
      "abierto": 5,
      "restricciones": 1,
      "cerrado": 0,
      "emergencia": 0
    },
    "alertas": [
      {
        "tipo": "oleaje_alto",
        "severidad": "alta",
        "mensaje": "Oleaje alto: 2.8m"
      }
    ],
    "condiciones_recientes": [...],
    "periodo_dias": 7
  }
}
```

### 6. **Alertas del Sistema**

**`GET /api/dashboard/alertas`**

Obtiene todas las alertas activas del sistema.

#### **Respuesta Exitosa (200)**

```json
{
  "status": "success",
  "message": "Alertas del sistema obtenidas exitosamente",
  "data": {
    "alertas": [
      {
        "tipo": "permisos_vencidos",
        "severidad": "alta",
        "mensaje": "1 prestador(es) con permisos vencidos",
        "accion": "Revisar y renovar permisos"
      },
      {
        "tipo": "clima_oleaje_alto",
        "severidad": "alta",
        "mensaje": "Oleaje alto: 2.8m",
        "accion": "Evaluar suspensión de salidas"
      }
    ],
    "estadisticas": {
      "total": 3,
      "criticas": 0,
      "altas": 2,
      "medias": 1,
      "bajas": 0
    },
    "fecha_consulta": "2025-09-26T12:00:00.000Z"
  }
}
```

## 🚨 Códigos de Error

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

### **500 Internal Server Error**

```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## 📊 Tipos de Alertas

### **Alertas de Permisos**

- `permisos_vencidos`: Prestadores con permisos vencidos
- `permisos_por_vencer`: Prestadores con permisos próximos a vencer

### **Alertas de Embarcaciones**

- `embarcaciones_mantenimiento`: Embarcaciones en mantenimiento

### **Alertas de Bloques**

- `bloques_llenos`: Bloques con capacidad completa

### **Alertas Meteorológicas**

- `clima_oleaje_alto`: Oleaje superior a 2.5m
- `clima_viento_fuerte`: Viento superior a 30 km/h
- `puerto_cerrado`: Puerto cerrado por condiciones adversas

## 🎯 Niveles de Severidad

- **`critica`**: Requiere acción inmediata
- **`alta`**: Requiere atención prioritaria
- **`media`**: Requiere monitoreo
- **`baja`**: Informativa

## 📈 Métricas Clave

### **Indicadores de Rendimiento**

- **Porcentaje de ocupación**: Capacidad utilizada vs. total
- **Tasa de completitud**: Salidas completadas vs. total
- **Disponibilidad de embarcaciones**: Embarcaciones operativas
- **Estado de permisos**: Prestadores activos vs. total

### **Tendencias Temporales**

- **Ocupación por día**: Análisis de demanda
- **Salidas por mes/semana**: Volumen de actividad
- **Condiciones meteorológicas**: Patrones climáticos

## 🔧 Notas Técnicas

- **Todas las fechas** están en zona horaria `America/Mexico_City`
- **Cálculos de porcentajes** se redondean al entero más cercano
- **Alertas meteorológicas** se basan en umbrales predefinidos
- **Datos en tiempo real** se actualizan con cada consulta
- **Agrupaciones** se realizan en memoria para optimizar rendimiento

## 🚀 Casos de Uso

### **Para Administradores CONANP**

1. **Monitoreo diario**: Revisar estadísticas generales y alertas
2. **Planificación**: Analizar ocupación y tendencias
3. **Gestión de permisos**: Monitorear vencimientos y renovaciones
4. **Control meteorológico**: Evaluar condiciones para operaciones

### **Para Análisis de Negocio**

1. **Reportes ejecutivos**: Estadísticas consolidadas
2. **Análisis de demanda**: Patrones de ocupación
3. **Optimización de recursos**: Estado de embarcaciones y bloques
4. **Gestión de riesgos**: Alertas y condiciones adversas

