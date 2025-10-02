# 🔧 Cambios Requeridos en el Backend - Sistema de Destinos y Bloques

**Fecha:** 30 de Septiembre, 2025  
**Objetivo:** Implementar sistema de destinos múltiples con bloques predefinidos para Isla Lobos

---

## 📋 Resumen Ejecutivo

### Problema Actual:

- ❌ No existe campo `destino` en la tabla `salidas`
- ❌ `bloque_id` es obligatorio para todas las salidas
- ❌ Bloques deben crearse manualmente para cada fecha
- ❌ Si no hay bloques creados → "No hay bloques disponibles"

### Solución Propuesta:

- ✅ Agregar campo `destino` a la tabla `salidas`
- ✅ Hacer `bloque_id` opcional (solo para Isla Lobos)
- ✅ Agregar campo `hora` para destinos sin bloques
- ✅ Crear bloques predefinidos permanentes
- ✅ Backend maneja automáticamente la lógica de bloques vs hora

---

## 🗄️ Cambios en Base de Datos

### 1. Modificar Tabla `salidas`

```sql
-- 1. Agregar campo destino
ALTER TABLE salidas
ADD COLUMN destino VARCHAR(100) NOT NULL DEFAULT 'Isla de Lobos';

-- 2. Hacer bloque_id opcional
ALTER TABLE salidas
ALTER COLUMN bloque_id DROP NOT NULL;

-- 3. Agregar campo hora para destinos sin bloques
ALTER TABLE salidas
ADD COLUMN hora TIME NULL;

-- 4. Agregar constraint para validar que tenga bloque_id O hora
ALTER TABLE salidas
ADD CONSTRAINT check_bloque_o_hora
CHECK (
  (destino = 'Isla de Lobos' AND bloque_id IS NOT NULL) OR
  (destino != 'Isla de Lobos' AND hora IS NOT NULL)
);

-- 5. Crear índice para optimizar búsquedas por destino
CREATE INDEX idx_salidas_destino ON salidas(destino);
```

### 2. Crear Bloques Predefinidos Permanentes

```sql
-- Crear tabla de plantillas de bloques (opcional, si quieres separarlos)
CREATE TABLE bloques_plantilla (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  capacidad_total INTEGER NOT NULL DEFAULT 65,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar los 3 bloques predefinidos
INSERT INTO bloques_plantilla (id, nombre, hora_inicio, hora_fin, capacidad_total)
VALUES
  ('bloque-matutino', 'Bloque Matutino', '08:00:00', '10:00:00', 65),
  ('bloque-mediodia', 'Bloque Mediodía', '11:00:00', '13:00:00', 65),
  ('bloque-vespertino', 'Bloque Vespertino', '14:00:00', '16:00:00', 65);
```

**O BIEN** (Opción más simple):

```sql
-- Insertar bloques predefinidos en la tabla existente 'bloques'
-- Con fecha NULL para indicar que son plantillas
INSERT INTO bloques (id, nombre, hora_inicio, hora_fin, capacidad_total, capacidad_registrada, estado, fecha)
VALUES
  ('bloque-matutino', 'Bloque Matutino', '08:00:00', '10:00:00', 65, 0, 'plantilla', NULL),
  ('bloque-mediodia', 'Bloque Mediodía', '11:00:00', '13:00:00', 65, 0, 'plantilla', NULL),
  ('bloque-vespertino', 'Bloque Vespertino', '14:00:00', '16:00:00', 65, 0, 'plantilla', NULL)
ON CONFLICT (id) DO NOTHING;
```

---

## 🔧 Cambios en el Código Backend

### 1. Actualizar Modelo de Salida

```typescript
// models/Salida.ts (Sequelize) o schema.prisma (Prisma)

export interface SalidaModel {
  id: string;
  fecha: Date;
  destino: string; // ← NUEVO CAMPO
  bloque_id?: string; // ← AHORA OPCIONAL
  hora?: string; // ← NUEVO CAMPO (para destinos sin bloques)
  embarcacion_id: string;
  prestador_id: string;
  numero_pasajeros: number;
  observaciones?: string;
  estado: EstadoSalida;
  motivo_cancelacion?: string;
  created_at: Date;
  updated_at: Date;
}
```

### 2. Actualizar Endpoint `POST /api/salidas`

```typescript
// routes/salidas.ts

/**
 * Registrar nueva salida
 */
router.post("/salidas", authenticateToken, async (req, res) => {
  try {
    const {
      fecha,
      destino,
      bloque_id,
      hora,
      embarcacion_id,
      numero_pasajeros,
      observaciones,
    } = req.body;

    // VALIDACIÓN CONDICIONAL según destino
    if (destino === "Isla de Lobos") {
      // Para Isla Lobos, bloque_id es REQUERIDO
      if (!bloque_id) {
        return res.status(400).json({
          status: "error",
          message: "bloque_id es requerido para salidas a Isla de Lobos",
          error: "VALIDATION_ERROR",
        });
      }

      // Verificar que el bloque existe y tiene capacidad
      const bloque = await Bloque.findByPk(bloque_id);
      if (!bloque) {
        return res.status(404).json({
          status: "error",
          message: "Bloque no encontrado",
          error: "NOT_FOUND",
        });
      }

      // Calcular capacidad ocupada para esa fecha
      const salidas_en_bloque = await Salida.count({
        where: {
          bloque_id: bloque_id,
          fecha: fecha,
          estado: {
            [Op.notIn]: [
              "cancelada",
              "cancelada_por_clima",
              "cancelada_capitaria",
            ],
          },
        },
      });

      const capacidad_disponible = bloque.capacidad_total - salidas_en_bloque;

      if (capacidad_disponible < numero_pasajeros) {
        return res.status(400).json({
          status: "error",
          message: `El bloque solo tiene ${capacidad_disponible} cupos disponibles`,
          error: "INSUFFICIENT_CAPACITY",
        });
      }
    } else {
      // Para otros destinos, hora es REQUERIDA
      if (!hora) {
        return res.status(400).json({
          status: "error",
          message: "hora es requerida para este destino",
          error: "VALIDATION_ERROR",
        });
      }
    }

    // Crear la salida
    const nuevaSalida = await Salida.create({
      fecha,
      destino,
      bloque_id: destino === "Isla de Lobos" ? bloque_id : null,
      hora: destino !== "Isla de Lobos" ? hora : null,
      embarcacion_id,
      prestador_id: req.user.id,
      numero_pasajeros,
      observaciones,
      estado: "programada",
    });

    // Obtener salida completa con relaciones
    const salidaCompleta = await Salida.findByPk(nuevaSalida.id, {
      include: [
        { model: Embarcacion, as: "embarcacion" },
        { model: Bloque, as: "bloque", required: false }, // ← IMPORTANTE: required: false
        { model: Usuario, as: "prestador" },
      ],
    });

    res.status(201).json({
      status: "success",
      message: "Salida registrada exitosamente",
      data: {
        salida: salidaCompleta,
      },
    });
  } catch (error) {
    console.error("Error al registrar salida:", error);
    res.status(500).json({
      status: "error",
      message: "Error al registrar salida",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});
```

### 3. Actualizar Endpoint `GET /api/bloques`

```typescript
// routes/bloques.ts

/**
 * Obtener bloques disponibles con capacidad
 * Siempre devuelve los 3 bloques predefinidos
 */
router.get("/bloques", authenticateToken, async (req, res) => {
  try {
    const { fecha } = req.query;

    // Obtener bloques plantilla
    const bloques_plantilla = await Bloque.findAll({
      where: {
        estado: "plantilla", // O usar un campo is_template: true
      },
    });

    // Si se proporciona fecha, calcular capacidad ocupada
    const bloquesConCapacidad = await Promise.all(
      bloques_plantilla.map(async (bloque) => {
        let capacidad_registrada = 0;
        let estado_actual = "activo";

        if (fecha) {
          // Contar salidas para este bloque en esta fecha
          capacidad_registrada =
            (await Salida.sum("numero_pasajeros", {
              where: {
                bloque_id: bloque.id,
                fecha: fecha,
                estado: {
                  [Op.notIn]: [
                    "cancelada",
                    "cancelada_por_clima",
                    "cancelada_capitaria",
                  ],
                },
              },
            })) || 0;

          // Verificar si hay cierre por clima u otro motivo
          const bloqueCerrado = await BloqueCierre.findOne({
            where: {
              bloque_plantilla_id: bloque.id,
              fecha: fecha,
              activo: true,
            },
          });

          if (bloqueCerrado) {
            estado_actual = bloqueCerrado.motivo; // 'suspendido_por_clima', 'cerrado_capitaria', etc
          } else if (capacidad_registrada >= bloque.capacidad_total) {
            estado_actual = "lleno";
          }
        }

        return {
          id: bloque.id,
          nombre: bloque.nombre,
          hora_inicio: bloque.hora_inicio,
          hora_fin: bloque.hora_fin,
          capacidad_total: bloque.capacidad_total,
          capacidad_registrada,
          capacidad_disponible: bloque.capacidad_total - capacidad_registrada,
          estado: estado_actual,
          fecha: fecha || null,
        };
      })
    );

    res.json({
      status: "success",
      message: "Bloques obtenidos exitosamente",
      data: {
        bloques: bloquesConCapacidad,
      },
    });
  } catch (error) {
    console.error("Error al obtener bloques:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener bloques",
      error: "INTERNAL_SERVER_ERROR",
    });
  }
});
```

### 4. Crear Tabla de Cierres de Bloques (Opcional pero Recomendado)

```sql
-- Tabla para manejar cierres temporales de bloques
CREATE TABLE bloques_cierres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloque_plantilla_id VARCHAR(50) NOT NULL REFERENCES bloques_plantilla(id),
  fecha DATE NOT NULL,
  motivo VARCHAR(100) NOT NULL, -- 'suspendido_por_clima', 'cerrado_capitaria', 'mantenimiento'
  observaciones TEXT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(bloque_plantilla_id, fecha)
);

-- Índices
CREATE INDEX idx_bloques_cierres_fecha ON bloques_cierres(fecha);
CREATE INDEX idx_bloques_cierres_activo ON bloques_cierres(activo);
```

---

## 🎯 Destinos Soportados

```typescript
export const DESTINOS = {
  ISLA_LOBOS: "Isla de Lobos", // ← Con bloques horarios
  ARRECIFE_TUXPAN: "Arrecife Tuxpan", // ← Sin bloques, solo hora
  ARRECIFE_EN_MEDIO: "Arrecife de en Medio", // ← Sin bloques, solo hora
  ARRECIFE_TANHUIJO: "Arrecife Tanhuijo", // ← Sin bloques, solo hora
};
```

---

## 🔄 Flujo de Trabajo del Sistema

### Para Isla de Lobos:

```
1. Prestador selecciona destino: "Isla de Lobos"
2. Prestador selecciona fecha
3. Frontend consulta: GET /api/bloques?fecha=2025-10-15
4. Backend devuelve los 3 bloques SIEMPRE:
   - Calcula capacidad ocupada contando salidas
   - Verifica si hay cierres por clima
   - Marca estado: activo/lleno/suspendido
5. Prestador selecciona bloque disponible
6. Prestador registra salida con bloque_id
```

### Para Arrecifes:

```
1. Prestador selecciona destino: "Arrecife Tuxpan"
2. Prestador selecciona fecha
3. Prestador ingresa hora manualmente
4. Prestador registra salida SIN bloque_id
```

---

## 📊 Estructura de Datos Actualizada

### Request Body - POST /api/salidas

```json
{
  "fecha": "2025-10-15",
  "destino": "Isla de Lobos",
  "bloque_id": "bloque-matutino", // Solo si destino es Isla de Lobos
  "hora": null, // Solo si destino NO es Isla de Lobos
  "embarcacion_id": "uuid-embarcacion",
  "numero_pasajeros": 25,
  "observaciones": "Salida programada"
}
```

**Ejemplo para Arrecife:**

```json
{
  "fecha": "2025-10-15",
  "destino": "Arrecife Tuxpan",
  "bloque_id": null, // No aplica
  "hora": "09:30", // ← Hora manual
  "embarcacion_id": "uuid-embarcacion",
  "numero_pasajeros": 15,
  "observaciones": "Tour al arrecife"
}
```

### Response - GET /api/bloques?fecha=2025-10-15

```json
{
  "status": "success",
  "message": "Bloques obtenidos exitosamente",
  "data": {
    "bloques": [
      {
        "id": "bloque-matutino",
        "nombre": "Bloque Matutino",
        "hora_inicio": "08:00:00",
        "hora_fin": "10:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 45,
        "capacidad_disponible": 20,
        "estado": "activo",
        "fecha": "2025-10-15"
      },
      {
        "id": "bloque-mediodia",
        "nombre": "Bloque Mediodía",
        "hora_inicio": "11:00:00",
        "hora_fin": "13:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 65,
        "capacidad_disponible": 0,
        "estado": "lleno",
        "fecha": "2025-10-15"
      },
      {
        "id": "bloque-vespertino",
        "nombre": "Bloque Vespertino",
        "hora_inicio": "14:00:00",
        "hora_fin": "16:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 0,
        "capacidad_disponible": 65,
        "estado": "suspendido_por_clima", // ← Cerrado por clima
        "fecha": "2025-10-15"
      }
    ]
  }
}
```

---

## 🎯 Lógica del Backend

### Endpoint: GET /api/bloques

```typescript
// Pseudocódigo de la lógica

function getBloquesDisponibles(fecha: string) {
  // 1. Obtener bloques plantilla
  const bloques_plantilla = obtenerBloquesPredefinidos();

  // 2. Para cada bloque plantilla
  const bloques_con_info = bloques_plantilla.map((bloque) => {
    // 3. Calcular capacidad ocupada en esa fecha
    const salidas_del_dia = contarSalidasEnBloque(bloque.id, fecha);
    const capacidad_registrada = sumarPasajeros(salidas_del_dia);
    const capacidad_disponible = bloque.capacidad_total - capacidad_registrada;

    // 4. Verificar si hay cierre temporal
    const cierre = buscarCierreBloque(bloque.id, fecha);
    let estado = "activo";

    if (cierre && cierre.activo) {
      estado = cierre.motivo; // 'suspendido_por_clima', 'cerrado_capitaria'
    } else if (capacidad_disponible <= 0) {
      estado = "lleno";
    }

    return {
      ...bloque,
      capacidad_registrada,
      capacidad_disponible,
      estado,
      fecha,
    };
  });

  return bloques_con_info;
}
```

### Endpoint: POST /api/salidas

```typescript
// Pseudocódigo de la validación

function registrarSalida(data) {
  const { destino, bloque_id, hora, numero_pasajeros } = data;

  // VALIDACIÓN CONDICIONAL
  if (destino === "Isla de Lobos") {
    // Requiere bloque_id
    if (!bloque_id) {
      throw new Error("bloque_id es requerido para Isla de Lobos");
    }

    // Verificar capacidad disponible
    const capacidad_ocupada = calcularCapacidadOcupada(bloque_id, data.fecha);
    const capacidad_disponible = 65 - capacidad_ocupada;

    if (capacidad_disponible < numero_pasajeros) {
      throw new Error(
        `Solo hay ${capacidad_disponible} cupos disponibles en este bloque`
      );
    }

    // Verificar si el bloque está cerrado
    const bloque_cerrado = verificarCierreBloque(bloque_id, data.fecha);
    if (bloque_cerrado) {
      throw new Error(`El bloque está cerrado: ${bloque_cerrado.motivo}`);
    }
  } else {
    // Para otros destinos, requiere hora
    if (!hora) {
      throw new Error("hora es requerida para este destino");
    }

    // bloque_id debe ser NULL
    data.bloque_id = null;
  }

  // Crear la salida
  const salida = await Salida.create(data);
  return salida;
}
```

---

## 🚨 Gestión de Cierres de Bloques

### Endpoint: POST /api/bloques/cerrar (Solo CONANP)

```typescript
/**
 * Cerrar un bloque para una fecha específica
 * Útil para cierres por clima, capitanía, etc.
 */
router.post(
  "/bloques/cerrar",
  authenticateToken,
  requireConanp,
  async (req, res) => {
    try {
      const { bloque_id, fecha, motivo, observaciones } = req.body;

      const cierre = await BloqueCierre.create({
        bloque_plantilla_id: bloque_id,
        fecha,
        motivo, // 'suspendido_por_clima', 'cerrado_capitaria', 'mantenimiento'
        observaciones,
        activo: true,
        creado_por: req.user.id,
      });

      res.json({
        status: "success",
        message: "Bloque cerrado exitosamente",
        data: { cierre },
      });
    } catch (error) {
      // manejo de errores
    }
  }
);
```

### Endpoint: POST /api/bloques/abrir (Solo CONANP)

```typescript
/**
 * Reabrir un bloque cerrado
 */
router.post(
  "/bloques/abrir",
  authenticateToken,
  requireConanp,
  async (req, res) => {
    try {
      const { bloque_id, fecha } = req.body;

      await BloqueCierre.update(
        { activo: false },
        {
          where: {
            bloque_plantilla_id: bloque_id,
            fecha,
          },
        }
      );

      res.json({
        status: "success",
        message: "Bloque reabierto exitosamente",
      });
    } catch (error) {
      // manejo de errores
    }
  }
);
```

---

## ✅ Validaciones Requeridas

### 1. Al Crear Salida

```typescript
// Validaciones básicas
- fecha: requerida, no puede ser en el pasado
- destino: requerido, debe estar en lista de destinos válidos
- embarcacion_id: requerida, debe pertenecer al prestador
- numero_pasajeros: requerido, >= 1, <= capacidad de embarcación

// Validaciones condicionales
SI destino === 'Isla de Lobos':
  - bloque_id: REQUERIDO
  - hora: NO APLICA (null)
  - Verificar capacidad disponible en bloque
  - Verificar que bloque no esté cerrado

SI destino !== 'Isla de Lobos':
  - hora: REQUERIDA
  - bloque_id: NO APLICA (null)
```

### 2. Estados de Bloques

```typescript
enum EstadoBloque {
  ACTIVO = "activo", // Normal, con cupos
  LLENO = "lleno", // Sin cupos disponibles
  SUSPENDIDO_POR_CLIMA = "suspendido_por_clima", // Cerrado por mal clima
  CERRADO_CAPITARIA = "cerrado_capitaria", // Cerrado por capitanía
  MANTENIMIENTO = "mantenimiento", // Cerrado por mantenimiento
}
```

---

## 📝 Migración de Datos Existentes

```sql
-- Si ya tienes salidas existentes, actualizar con valores por defecto
UPDATE salidas
SET destino = 'Isla de Lobos'
WHERE destino IS NULL;

-- Actualizar salidas sin bloque_id (si las hay)
-- Asignar una hora por defecto basada en created_at
UPDATE salidas
SET hora = EXTRACT(HOUR FROM created_at)::TEXT || ':00:00'
WHERE bloque_id IS NULL AND hora IS NULL;
```

---

## 🎯 Beneficios de esta Arquitectura

✅ **Bloques siempre disponibles** - No hay "no hay bloques para esta fecha"  
✅ **Capacidad en tiempo real** - Calcula cupos basado en salidas registradas  
✅ **Cierres flexibles** - CONANP puede cerrar bloques por clima/capitanía  
✅ **Múltiples destinos** - Soporte para isla y arrecifes  
✅ **Escalable** - Fácil agregar nuevos destinos o bloques  
✅ **Consistente** - Backend maneja toda la lógica de negocio

---

## 🔧 Endpoints Nuevos/Modificados

### Modificados:

- ✅ `POST /api/salidas` - Acepta campo `destino`, `bloque_id` opcional, `hora` opcional
- ✅ `GET /api/bloques` - Siempre devuelve bloques predefinidos con capacidad calculada
- ✅ `GET /api/salidas` - Incluye campos `destino` y `hora` en respuesta

### Nuevos (Opcionales):

- 🆕 `POST /api/bloques/cerrar` - Cerrar bloque para una fecha (CONANP)
- 🆕 `POST /api/bloques/abrir` - Reabrir bloque cerrado (CONANP)
- 🆕 `GET /api/bloques/cierres?fecha=XXX` - Ver cierres programados (CONANP)

---

## 💡 Recomendación Final

**El backend DEBE manejar:**

1. ✅ Validación condicional (bloque_id vs hora según destino)
2. ✅ Cálculo de capacidad disponible
3. ✅ Estados de bloques (activo/lleno/cerrado)
4. ✅ Verificación de cierres temporales

**El frontend SOLO debe:**

1. ✅ Mostrar los bloques que el backend devuelve
2. ✅ Deshabilitar bloques según su estado
3. ✅ Mostrar capacidad disponible
4. ✅ Validar formulario básico

---

## 📌 Prioridad de Implementación

### Fase 1 (Básico - Requerido):

1. ⚠️ Agregar columna `destino` a tabla `salidas`
2. ⚠️ Hacer `bloque_id` nullable
3. ⚠️ Agregar columna `hora` a tabla `salidas`
4. ⚠️ Crear bloques predefinidos permanentes
5. ⚠️ Actualizar endpoint POST /api/salidas con validación condicional
6. ⚠️ Actualizar endpoint GET /api/bloques para calcular capacidad

### Fase 2 (Avanzado - Opcional):

7. 📅 Crear tabla `bloques_cierres`
8. 📅 Endpoint para cerrar/abrir bloques
9. 📅 Dashboard CONANP para gestionar cierres
10. 📅 Alertas automáticas por clima

---

## 🎓 Ejemplo de Uso Completo

### Escenario 1: Salida a Isla Lobos

```javascript
// Frontend envía:
POST /api/salidas
{
  "fecha": "2025-10-15",
  "destino": "Isla de Lobos",
  "bloque_id": "bloque-matutino",
  "embarcacion_id": "uuid-embarcacion",
  "numero_pasajeros": 30
}

// Backend valida:
✅ Bloque existe
✅ Tiene capacidad (65 - 45 = 20 disponibles)
✅ No está cerrado
❌ Error: Solo hay 20 cupos, solicitas 30
```

### Escenario 2: Salida a Arrecife

```javascript
// Frontend envía:
POST /api/salidas
{
  "fecha": "2025-10-15",
  "destino": "Arrecife Tuxpan",
  "hora": "10:30",
  "embarcacion_id": "uuid-embarcacion",
  "numero_pasajeros": 15
}

// Backend valida:
✅ Hora proporcionada
✅ Embarcación válida
✅ Salida creada sin bloque_id
```

---

**Este documento debe ser entregado al equipo de backend para implementar los cambios necesarios.**

¿Necesitas que agregue algo más al documento o que clarifique alguna parte?
