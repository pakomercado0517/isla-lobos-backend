# 📊 Public Stats API - Endpoints Públicos

> **Documentación de endpoints públicos para la homepage del sistema Isla Lobos**  
> **Actualizado:** 17 de Octubre, 2025

## 🎯 **Propósito**

Estos endpoints proporcionan información pública para mostrar en la homepage sin requerir autenticación. Están diseñados para ser consumidos por aplicaciones cliente de forma segura, exponiendo solo datos agregados sin información sensible.

---

## 🔓 **Endpoints Disponibles**

### **1. Estadísticas Completas para Homepage**

**URL:** `GET /api/public/homepage-stats`  
**Autenticación:** ❌ No requerida  
**Descripción:** Obtiene todas las estadísticas necesarias para mostrar en la homepage

#### **Ejemplo de Respuesta:**

```json
{
  "status": "success",
  "message": "Estadísticas públicas obtenidas exitosamente",
  "data": {
    "fecha_consulta": "2025-10-17",
    "hora_consulta": "14:30:45",
    
    "puerto": {
      "estado": "abierto",
      "texto": "Puerto Abierto",
      "color": "green",
      "operativo": true
    },
    
    "embarcaciones": {
      "total_registradas": 25
    },
    
    "actividad_hoy": {
      "salidas_programadas": 8,
      "salidas_por_estado": {
        "programadas": 3,
        "en_curso": 2,
        "completadas": 3
      },
      "total_pasajeros": 120,
      "promedio_pasajeros_por_salida": 15
    },
    
    "clima": {
      "oleaje": 1.2,
      "viento": 18,
      "condicion_general": "aceptables",
      "ultima_actualizacion": "2025-10-17"
    },
    
    "sistema": {
      "operativo": true,
      "version": "1.0.0",
      "ultima_actualizacion": "2025-10-17"
    }
  }
}
```

#### **Estructura de Datos Detallada:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha_consulta` | `string` | Fecha actual en formato YYYY-MM-DD |
| `hora_consulta` | `string` | Hora actual en formato HH:MM:SS (zona México) |
| `puerto.estado` | `string` | Estados: `"abierto"`, `"restricciones"`, `"cerrado"`, `"emergencia"`, `"desconocido"` |
| `puerto.texto` | `string` | Texto descriptivo del estado del puerto |
| `puerto.color` | `string` | Color sugerido: `"green"`, `"yellow"`, `"red"`, `"gray"` |
| `puerto.operativo` | `boolean` | `true` si permite salidas (abierto/restricciones) |
| `embarcaciones.total_registradas` | `number` | Total de embarcaciones en el sistema |
| `actividad_hoy.salidas_programadas` | `number` | Total de salidas programadas para hoy |
| `actividad_hoy.total_pasajeros` | `number` | Total de pasajeros estimados para hoy |
| `actividad_hoy.promedio_pasajeros_por_salida` | `number` | Promedio de pasajeros por salida |
| `clima.oleaje` | `number` | Altura del oleaje en metros |
| `clima.viento` | `number` | Velocidad del viento en km/h |
| `clima.condicion_general` | `string` | Estados: `"favorables"`, `"aceptables"`, `"moderadas"`, `"adversas"` |

---

### **2. Estado del Puerto (Ultraligero)**

**URL:** `GET /api/public/puerto-status`  
**Autenticación:** ❌ No requerida  
**Descripción:** Endpoint ultraligero para verificar solo el estado del puerto

#### **Ejemplo de Respuesta:**

```json
{
  "status": "success",
  "data": {
    "puerto": {
      "estado": "abierto",
      "operativo": true,
      "color": "green",
      "ultima_actualizacion": "2025-10-17"
    }
  }
}
```

#### **Estados del Puerto:**

| Estado | Operativo | Color | Descripción |
|--------|-----------|-------|-------------|
| `abierto` | ✅ `true` | 🟢 `green` | Puerto completamente operativo |
| `restricciones` | ✅ `true` | 🟡 `yellow` | Puerto operativo con restricciones |
| `cerrado` | ❌ `false` | 🔴 `red` | Puerto cerrado por condiciones adversas |
| `emergencia` | ❌ `false` | 🔴 `red` | Puerto en estado de emergencia |
| `desconocido` | ❌ `false` | ⚪ `gray` | Estado no determinado |

---

## 🔧 **Implementación en Frontend**

### **JavaScript/TypeScript**

```javascript
// Función para obtener estadísticas completas
async function getHomepageStats() {
  try {
    const response = await fetch('/api/public/homepage-stats');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data; // Solo los datos, sin metadata
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    return null;
  }
}

// Función para verificar solo el estado del puerto
async function getPuertoStatus() {
  try {
    const response = await fetch('/api/public/puerto-status');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data.puerto;
  } catch (error) {
    console.error('Error fetching puerto status:', error);
    return null;
  }
}

// Uso en componente
const stats = await getHomepageStats();
if (stats) {
  console.log(`Puerto: ${stats.puerto.texto}`);
  console.log(`Embarcaciones: ${stats.embarcaciones.total_registradas}`);
  console.log(`Salidas hoy: ${stats.actividad_hoy.salidas_programadas}`);
  console.log(`Pasajeros hoy: ${stats.actividad_hoy.total_pasajeros}`);
}
```

### **React Hook Ejemplo**

```typescript
import { useState, useEffect } from 'react';

interface HomepageStats {
  fecha_consulta: string;
  hora_consulta: string;
  puerto: {
    estado: string;
    texto: string;
    color: string;
    operativo: boolean;
  };
  embarcaciones: {
    total_registradas: number;
  };
  actividad_hoy: {
    salidas_programadas: number;
    total_pasajeros: number;
    promedio_pasajeros_por_salida: number;
  };
  clima: {
    oleaje: number;
    viento: number;
    condicion_general: string;
    ultima_actualizacion: string;
  } | null;
}

export function useHomepageStats() {
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/public/homepage-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}
```

---

## 🔒 **Seguridad y Limitaciones**

### **✅ Información Segura Expuesta:**
- Estado del puerto (público)
- Conteos agregados (números totales)
- Condiciones meteorológicas básicas
- Estados generales del sistema

### **❌ Información NO Expuesta:**
- Nombres de prestadores
- Detalles específicos de usuarios
- Información de embarcaciones específicas
- Datos financieros o sensibles
- Ubicaciones exactas o rutas

### **🛡️ Rate Limiting:**
- Límite global: 100 requests por 15 minutos por IP
- No requiere autenticación
- Solo sanitización de entrada

---

## 🎨 **Ejemplos de UI**

### **Indicador de Estado del Puerto**
```html
<!-- Verde: Puerto Abierto -->
<div class="status-indicator">
  <span class="dot green"></span>
  <span>Puerto Abierto</span>
</div>

<!-- Amarillo: Con Restricciones -->
<div class="status-indicator">
  <span class="dot yellow"></span>
  <span>Puerto con Restricciones</span>
</div>

<!-- Rojo: Cerrado -->
<div class="status-indicator">
  <span class="dot red"></span>
  <span>Puerto Cerrado</span>
</div>
```

### **Cards de Estadísticas**
```html
<div class="stats-grid">
  <div class="stat-card">
    <h3>25</h3>
    <p>Embarcaciones Registradas</p>
  </div>
  
  <div class="stat-card">
    <h3>8</h3>
    <p>Salidas Programadas Hoy</p>
  </div>
  
  <div class="stat-card">
    <h3>120</h3>
    <p>Pasajeros Estimados</p>
  </div>
</div>
```

---

## ⚡ **Recomendaciones de Rendimiento**

1. **Cache del lado cliente:** Cachear respuestas por 2-5 minutos
2. **Actualización automática:** Refrescar cada 5-10 minutos
3. **Loading states:** Mostrar placeholders mientras carga
4. **Error handling:** Implementar fallbacks cuando falle la API
5. **Optimistic UI:** Mostrar último estado conocido mientras actualiza

---

## 🐛 **Manejo de Errores**

### **Códigos de Estado HTTP:**
- `200` - ✅ Éxito
- `500` - ❌ Error interno del servidor

### **Estructura de Error:**
```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## 📝 **Changelog**

### **v1.0.0 - 17 de Octubre, 2025**
- ✅ Implementación inicial de endpoints públicos
- ✅ Endpoint `/homepage-stats` completo
- ✅ Endpoint `/puerto-status` ultraligero
- ✅ Documentación completa para frontend
- ✅ Integración con sistema de fechas México (GMT-6)

---

**Contacto Técnico:** Backend Team Isla Lobos  
**Última Actualización:** 17 de Octubre, 2025