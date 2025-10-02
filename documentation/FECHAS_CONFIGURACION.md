# 🕐 Configuración de Fechas y Zonas Horarias - Isla Lobos

## ✅ Configuración Completada

Se ha configurado correctamente el manejo de fechas y zonas horarias para el proyecto Isla Lobos, considerando que:

- **Base de datos**: Ubicada en Virginia, USA
- **Proyecto**: Para Veracruz, México
- **Zona horaria objetivo**: America/Mexico_City

## 🎯 **Problema Resuelto**

**Antes**: Las fechas se guardaban en UTC y causaban problemas de sincronización entre la base de datos (Virginia) y el uso local (México).

**Ahora**: Todas las fechas se manejan correctamente en zona horaria de México, garantizando consistencia en:

- Filtros de búsqueda
- Comparaciones de fechas
- Reportes y consultas
- Operaciones de negocio

## 🔧 **Configuración Implementada**

### 1. **Sequelize Configuration**

```typescript
const sequelize = new Sequelize(process.env["DB_URL"] || "", {
  dialect: "postgres",
  timezone: "America/Mexico_City", // Zona horaria de México
  dialectOptions: {
    timezone: "local", // Usar zona horaria local
  },
  // ... resto de configuración
});
```

### 2. **Modelos Actualizados**

Todos los modelos que manejan fechas ahora incluyen:

#### **Bloque**

- `fecha`: Fecha del bloque con comentario de zona horaria
- Métodos: `es_hoy`, `es_manana`, `dia_semana`, `puede_registrar_salida`

#### **Salida**

- `fecha`: Fecha y hora de la salida con comentario de zona horaria
- Métodos: `es_hoy`, `es_manana`, `dia_semana`, `puede_cancelar`, `puede_iniciar`

#### **CondicionMeteorologica**

- `fecha_hora`: Fecha y hora de medición con comentario de zona horaria
- Métodos: `es_hoy`, `es_actual`, `condiciones_seguras`, `fecha_formateada`

#### **Invitacion**

- `expira_en`: Fecha de expiración con comentario de zona horaria
- Métodos: `esta_expirada`, `dias_restantes`, `es_valida`

### 3. **Utilidades de Fecha**

Archivo `src/utils/dateUtils.ts` con funciones especializadas:

```typescript
// Funciones principales
getCurrentMexicoTime()           // Hora actual en México
toMexicoTime(date)               // Convertir fecha a zona México
createMexicoDate(...)            // Crear fecha en zona México
formatMexicoDate(date)           // Formatear fecha para México
isTodayMexico(date)              // Verificar si es hoy en México
isTomorrowMexico(date)           // Verificar si es mañana en México
getDayNameMexico(date)           // Nombre del día en español
getMonthNameMexico(date)         // Nombre del mes en español
```

## 📊 **Características de la Base de Datos**

### **Tipos de Datos con Zona Horaria**

- `TIMESTAMP WITH TIME ZONE` para fechas con hora
- `DATE` para fechas sin hora
- `TIME` para horas sin fecha

### **Comentarios en Columnas**

Todas las columnas de fecha incluyen comentarios explicativos:

```sql
COMMENT ON COLUMN "bloques"."fecha" IS 'Fecha del bloque en zona horaria de México (America/Mexico_City)';
COMMENT ON COLUMN "salidas"."fecha" IS 'Fecha y hora de la salida en zona horaria de México (America/Mexico_City)';
COMMENT ON COLUMN "condiciones_meteorologicas"."fecha_hora" IS 'Fecha y hora de la medición en zona horaria de México (America/Mexico_City)';
COMMENT ON COLUMN "invitaciones"."expira_en" IS 'Fecha de expiración en zona horaria de México (America/Mexico_City)';
```

## 🚀 **Beneficios Implementados**

### **1. Consistencia de Fechas**

- ✅ Todas las fechas se manejan en zona horaria de México
- ✅ No hay problemas de conversión entre zonas horarias
- ✅ Filtros y búsquedas funcionan correctamente

### **2. Métodos de Negocio**

- ✅ `bloque.es_hoy` - Verificar si un bloque es para hoy
- ✅ `salida.puede_cancelar` - Verificar si se puede cancelar
- ✅ `condicion.condiciones_seguras` - Evaluar seguridad meteorológica
- ✅ `invitacion.dias_restantes` - Calcular días de expiración

### **3. Formateo Localizado**

- ✅ Fechas en formato mexicano
- ✅ Nombres de días y meses en español
- ✅ Horarios en formato 24 horas

### **4. Validaciones de Negocio**

- ✅ Verificación de horarios de operación (6:00 AM - 6:00 PM)
- ✅ Validación de condiciones meteorológicas seguras
- ✅ Control de expiración de invitaciones

## 📝 **Ejemplos de Uso**

### **Crear un Bloque para Hoy**

```typescript
import { createMexicoDate } from "../utils/dateUtils";

const hoy = createMexicoDate(2024, 1, 15); // 15 de enero de 2024
const bloque = await Bloque.create({
  nombre: "Bloque Matutino",
  hora_inicio: "08:00",
  hora_fin: "10:00",
  capacidad_total: 65,
  fecha: hoy,
});

// Verificar si es hoy
console.log(bloque.es_hoy); // true
console.log(bloque.dia_semana); // "Lunes"
```

### **Verificar Condiciones Meteorológicas**

```typescript
const condicion = await CondicionMeteorologica.findOne({
  where: { es_actual: true },
});

if (condicion) {
  console.log(condicion.condiciones_seguras); // true/false
  console.log(condicion.fecha_formateada); // "15/01/2024, 14:30:00"
}
```

### **Manejar Invitaciones**

```typescript
const invitacion = await Invitacion.findOne({
  where: { codigo: "ABC123" },
});

if (invitacion) {
  console.log(invitacion.es_valida); // true/false
  console.log(invitacion.dias_restantes); // 5
}
```

## 🔍 **Consultas Optimizadas**

### **Buscar Bloques de Hoy**

```typescript
const bloquesHoy = await Bloque.findAll({
  where: {
    fecha: getCurrentMexicoTime().toISOString().split("T")[0],
  },
});
```

### **Salidas Programadas para Mañana**

```typescript
const salidasManana = await Salida.findAll({
  where: {
    fecha: {
      [Op.gte]: getStartOfDayMexico(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      [Op.lt]: getEndOfDayMexico(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    },
  },
});
```

## ⚠️ **Consideraciones Importantes**

### **1. Desarrollo vs Producción**

- En desarrollo: `force: true` recrea las tablas
- En producción: Usar migraciones para cambios controlados

### **2. Backup de Datos**

- Siempre hacer backup antes de cambios de esquema
- Las fechas existentes se convierten automáticamente

### **3. APIs Externas**

- Verificar que las APIs externas (CONAGUA, NOAA) manejen zonas horarias
- Convertir fechas recibidas a zona horaria de México

## 🎉 **Estado Actual**

✅ **Base de datos limpiada y recreada**
✅ **Configuración de zona horaria implementada**
✅ **Modelos actualizados con métodos de negocio**
✅ **Utilidades de fecha creadas**
✅ **Servidor funcionando correctamente**
✅ **Todas las tablas creadas con comentarios**

---

**¡La configuración de fechas y zonas horarias está completa y lista para el desarrollo! 🚀**

El sistema ahora maneja correctamente las fechas considerando la diferencia entre la ubicación de la base de datos (Virginia) y el uso del sistema (México), garantizando consistencia en todas las operaciones de fecha y hora.
