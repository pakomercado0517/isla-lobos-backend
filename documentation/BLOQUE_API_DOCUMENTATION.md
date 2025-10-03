# 📋 Documentación API - BloqueController

## 🎯 **Resumen**

El **BloqueController** gestiona los bloques horarios del sistema Isla Lobos. Permite crear, consultar, actualizar y eliminar bloques de tiempo con sus respectivas capacidades y estados.

## 🔐 **Autenticación**

Todas las rutas requieren autenticación JWT. Algunas rutas requieren rol **CONANP** (administrador).

## 📊 **Endpoints Disponibles**

### **1. Obtener Bloques para una Fecha Específica**

```http
GET /api/bloques?fecha=YYYY-MM-DD
```

**Descripción**: Obtiene los bloques disponibles para una fecha específica. Si no existen bloques para esa fecha, los crea automáticamente desde las plantillas predefinidas.

**Autenticación**: Requerida (todos los usuarios)

**Parámetros de Query**:

- `fecha` (requerido): Fecha específica (formato: YYYY-MM-DD)
  - No puede ser una fecha pasada
  - Máximo 7 días en el futuro

**Estados disponibles**:

- `activo`: Bloque disponible para reservas
- `lleno`: Bloque con capacidad completa
- `suspendido_por_clima`: Bloque suspendido por condiciones climáticas
- `cerrado_capitaria`: Bloque cerrado por decisión de capitanía

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Bloques obtenidos exitosamente",
  "data": {
    "bloques": [
      {
        "id": "uuid-unico-por-fecha",
        "nombre": "Bloque Matutino",
        "hora_inicio": "08:00:00",
        "hora_fin": "10:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 45,
        "capacidad_disponible": 20,
        "estado": "activo",
        "fecha": "2025-10-15",
        "created_at": "2025-10-15T10:30:00.000Z",
        "updated_at": "2025-10-15T10:30:00.000Z"
      },
      {
        "id": "uuid-unico-por-fecha-2",
        "nombre": "Bloque Mediodía",
        "hora_inicio": "11:00:00",
        "hora_fin": "13:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 65,
        "capacidad_disponible": 0,
        "estado": "lleno",
        "fecha": "2025-10-15",
        "created_at": "2025-10-15T10:30:00.000Z",
        "updated_at": "2025-10-15T10:30:00.000Z"
      },
      {
        "id": "uuid-unico-por-fecha-3",
        "nombre": "Bloque Vespertino",
        "hora_inicio": "14:00:00",
        "hora_fin": "16:00:00",
        "capacidad_total": 65,
        "capacidad_registrada": 0,
        "capacidad_disponible": 65,
        "estado": "activo",
        "fecha": "2025-10-15",
        "created_at": "2025-10-15T10:30:00.000Z",
        "updated_at": "2025-10-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Respuesta de Error (400) - Fecha requerida**:

```json
{
  "status": "error",
  "message": "La fecha es requerida para obtener bloques",
  "error": "FECHA_REQUERIDA"
}
```

**Respuesta de Error (400) - Fecha pasada**:

```json
{
  "status": "error",
  "message": "No se pueden consultar bloques para fechas pasadas",
  "error": "FECHA_PASADA"
}
```

**Respuesta de Error (400) - Fecha muy futura**:

```json
{
  "status": "error",
  "message": "No se pueden consultar bloques para más de 7 días en el futuro",
  "error": "FECHA_MUY_FUTURA"
}
```

---

### **2. Obtener Bloque por ID**

```http
GET /api/bloques/:id
```

**Descripción**: Obtiene un bloque específico por su ID.

**Autenticación**: Requerida (todos los usuarios)

**Parámetros de Ruta**:

- `id`: UUID del bloque

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Bloque obtenido exitosamente",
  "data": {
    "bloque": {
      "id": "uuid",
      "nombre": "Bloque Matutino",
      "hora_inicio": "08:00:00",
      "hora_fin": "10:00:00",
      "capacidad_total": 65,
      "capacidad_registrada": 45,
      "estado": "activo",
      "fecha": "2025-09-26",
      "createdAt": "2025-09-26T16:31:51.205Z",
      "updatedAt": "2025-09-26T16:31:51.205Z"
    }
  }
}
```

**Respuesta de Error (404)**:

```json
{
  "status": "error",
  "message": "Bloque no encontrado",
  "error": "BLOQUE_NOT_FOUND"
}
```

---

### **3. Crear Nuevo Bloque**

```http
POST /api/bloques
```

**Descripción**: Crea un nuevo bloque horario.

**Autenticación**: Requerida (solo CONANP)

**Body**:

```json
{
  "nombre": "Bloque de Prueba",
  "hora_inicio": "15:00",
  "hora_fin": "17:00",
  "capacidad_total": 50,
  "fecha": "2025-12-30",
  "estado": "activo"
}
```

**Validaciones**:

- `nombre`: Requerido, 2-100 caracteres, solo letras, números, espacios, guiones
- `hora_inicio`: Requerido, formato HH:MM (24 horas)
- `hora_fin`: Requerido, formato HH:MM, debe ser posterior a hora_inicio
- `capacidad_total`: Requerido, número entre 1 y 1000
- `fecha`: Requerido, formato YYYY-MM-DD, no puede ser fecha pasada
- `estado`: Opcional, uno de los estados válidos

**Respuesta Exitosa (201)**:

```json
{
  "status": "success",
  "message": "Bloque creado exitosamente",
  "data": {
    "bloque": {
      "id": "uuid",
      "nombre": "Bloque de Prueba",
      "hora_inicio": "15:00:00",
      "hora_fin": "17:00:00",
      "capacidad_total": 50,
      "capacidad_registrada": 0,
      "estado": "activo",
      "fecha": "2025-12-30",
      "createdAt": "2025-09-26T16:53:03.562Z",
      "updatedAt": "2025-09-26T16:53:03.562Z"
    }
  }
}
```

**Respuesta de Error (409)**:

```json
{
  "status": "error",
  "message": "Ya existe un bloque con ese nombre para esa fecha",
  "error": "BLOQUE_ALREADY_EXISTS"
}
```

---

### **4. Actualizar Bloque**

```http
PUT /api/bloques/:id
```

**Descripción**: Actualiza un bloque existente.

**Autenticación**: Requerida (solo CONANP)

**Parámetros de Ruta**:

- `id`: UUID del bloque

**Body** (todos los campos son opcionales):

```json
{
  "nombre": "Bloque Actualizado",
  "hora_inicio": "16:00",
  "hora_fin": "18:00",
  "capacidad_total": 60,
  "estado": "lleno",
  "fecha": "2025-12-31"
}
```

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Bloque actualizado exitosamente",
  "data": {
    "bloque": {
      "id": "uuid",
      "nombre": "Bloque Actualizado",
      "hora_inicio": "16:00:00",
      "hora_fin": "18:00:00",
      "capacidad_total": 60,
      "capacidad_registrada": 0,
      "estado": "lleno",
      "fecha": "2025-12-31",
      "createdAt": "2025-09-26T16:53:03.562Z",
      "updatedAt": "2025-09-26T16:53:03.562Z"
    }
  }
}
```

---

### **5. Eliminar Bloque**

```http
DELETE /api/bloques/:id
```

**Descripción**: Elimina un bloque existente.

**Autenticación**: Requerida (solo CONANP)

**Parámetros de Ruta**:

- `id`: UUID del bloque

**Validaciones**:

- El bloque no puede tener salidas registradas
- El bloque no puede ser de una fecha pasada

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Bloque eliminado exitosamente"
}
```

**Respuesta de Error (400)**:

```json
{
  "status": "error",
  "message": "No se puede eliminar un bloque que tiene salidas registradas",
  "error": "BLOQUE_HAS_SALIDAS"
}
```

---

### **6. Obtener Estadísticas de Bloques**

```http
GET /api/bloques/estadisticas
```

**Descripción**: Obtiene estadísticas detalladas de los bloques.

**Autenticación**: Requerida (solo CONANP)

**Parámetros de Query**:

- `fecha_inicio` (opcional): Fecha de inicio del rango
- `fecha_fin` (opcional): Fecha de fin del rango

**Respuesta Exitosa (200)**:

```json
{
  "status": "success",
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "estadisticas": {
      "total_bloques": 22,
      "por_estado": {
        "activo": 15,
        "lleno": 1,
        "suspendido_por_clima": 3,
        "cerrado_capitaria": 3
      },
      "capacidad": {
        "total": 1415,
        "ocupada": 130,
        "disponible": 1285,
        "porcentaje_ocupacion": 9
      }
    }
  }
}
```

---

## 🚨 **Códigos de Error Comunes**

### **400 - Bad Request**

```json
{
  "status": "error",
  "message": "Errores de validación encontrados",
  "error": "VALIDATION_ERROR",
  "data": {
    "errors": [
      {
        "field": "hora_fin",
        "message": "La hora de fin debe ser posterior a la hora de inicio",
        "value": "08:00"
      }
    ]
  }
}
```

### **401 - Unauthorized**

```json
{
  "status": "error",
  "message": "Token de acceso requerido",
  "error": "UNAUTHORIZED"
}
```

### **403 - Forbidden**

```json
{
  "status": "error",
  "message": "Acceso denegado. Se requiere rol de CONANP",
  "error": "FORBIDDEN"
}
```

### **404 - Not Found**

```json
{
  "status": "error",
  "message": "Bloque no encontrado",
  "error": "BLOQUE_NOT_FOUND"
}
```

### **409 - Conflict**

```json
{
  "status": "error",
  "message": "Ya existe un bloque con ese nombre para esa fecha",
  "error": "BLOQUE_ALREADY_EXISTS"
}
```

### **500 - Internal Server Error**

```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## 🧪 **Ejemplos de Uso**

### **Obtener bloques para una fecha específica**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/bloques?fecha=2025-10-15"
```

### **Obtener bloques para mañana**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/bloques?fecha=2025-10-16"
```

### **Obtener bloques para dentro de 7 días (máximo permitido)**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/bloques?fecha=2025-10-22"
```

### **Crear un nuevo bloque**

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Bloque Nocturno",
    "hora_inicio": "18:00",
    "hora_fin": "20:00",
    "capacidad_total": 40,
    "fecha": "2025-12-31"
  }' \
  "http://localhost:3001/api/bloques"
```

### **Obtener estadísticas del mes**

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/bloques/estadisticas?fecha_inicio=2025-09-01&fecha_fin=2025-09-30"
```

---

## 📝 **Notas Importantes**

1. **Fechas**: Todas las fechas se manejan en timezone `America/Mexico_City`
2. **Horarios**: Los horarios se almacenan en formato HH:MM:SS
3. **Capacidad**: La capacidad registrada se calcula dinámicamente contando las salidas registradas
4. **Estados**: Los estados se validan contra el enum `EstadoBloque`
5. **Permisos**: Solo usuarios CONANP pueden crear, actualizar o eliminar bloques
6. **Validaciones**: Se valida que no se puedan consultar bloques en fechas pasadas
7. **Límite temporal**: Máximo 7 días en el futuro para evitar saturar la base de datos
8. **Creación automática**: Si no existen bloques para una fecha, se crean automáticamente desde las plantillas
9. **IDs únicos**: Cada fecha tiene sus propios bloques con IDs únicos

---

## 🔄 **Integración con Otros Controladores**

- **SalidaController**: Los bloques se relacionan con las salidas registradas
- **ClimaController**: Los bloques pueden suspenderse por condiciones climáticas
- **DashboardController**: Las estadísticas de bloques se usan en el dashboard

---

**Última actualización**: 26 de Septiembre, 2025
**Versión**: 1.0.0
