# 🌱 Seeders de Datos de Prueba - Isla Lobos

## 📋 **Descripción**

Se han creado seeders completos con datos de prueba para poder probar todas las funcionalidades del sistema de autenticación y validaciones.

---

## 🗂️ **Archivos de Seeders**

### **1. Usuarios de Prueba** (`20241225000001-demo-users.js`)

- ✅ **1 Usuario CONANP** - Administrador del sistema
- ✅ **4 Usuarios Prestadores** - 3 activos, 1 inactivo
- ✅ **Contraseñas seguras** - Cumplen con todas las validaciones
- ✅ **Datos realistas** - Nombres, emails y teléfonos mexicanos

### **2. Invitaciones de Prueba** (`20241225000002-demo-invitations.js`)

- ✅ **3 Invitaciones válidas** - Para prestadores y CONANP
- ✅ **1 Invitación expirada** - Para probar validaciones
- ✅ **1 Invitación usada** - Para probar estados
- ✅ **Códigos alfanuméricos** - Formato correcto

### **3. Embarcaciones de Prueba** (`20241225000003-demo-embarcaciones.js`)

- ✅ **6 Embarcaciones** - Diferentes tipos y estados
- ✅ **Tipos variados** - Menores y mayores
- ✅ **Estados realistas** - Disponible, en uso, mantenimiento
- ✅ **Matrículas válidas** - Formato mexicano

### **4. Bloques de Prueba** (`20241225000004-demo-bloques.js`)

- ✅ **21 Bloques** - 7 días x 3 bloques por día
- ✅ **Estados variados** - Activo, lleno, suspendido, cerrado
- ✅ **Capacidad realista** - 65 personas por bloque
- ✅ **Horarios típicos** - 08:00-10:00, 10:00-12:00, 12:00-14:00

### **5. Condiciones Meteorológicas** (`20241225000005-demo-condiciones-meteorologicas.js`)

- ✅ **4 Condiciones** - Diferentes estados del puerto
- ✅ **Datos realistas** - Oleaje, viento, visibilidad
- ✅ **Estados del puerto** - Abierto, restricciones, cerrado
- ✅ **Predicciones** - Texto descriptivo de 5 días

### **6. Salidas de Prueba** (`20241225000006-demo-salidas.js`)

- ✅ **5 Salidas** - Diferentes estados y fechas
- ✅ **Estados variados** - Programada, en curso, completada, cancelada
- ✅ **Motivos de cancelación** - Clima y capitanía
- ✅ **Datos históricos** - Salidas de días anteriores

---

## 🚀 **Cómo Ejecutar los Seeders**

### **Opción 1: Script Automático (Recomendado)**

```bash
# Ejecutar todos los seeders en orden
npm run seed:demo

# Limpiar todos los datos de prueba
npm run seed:clean
```

### **Opción 2: Comandos Individuales**

```bash
# Ejecutar todos los seeders
npm run db:seed

# Ejecutar un seeder específico
npx sequelize-cli db:seed --seed 20241225000001-demo-users.js

# Limpiar todos los seeders
npm run db:seed:undo

# Limpiar un seeder específico
npx sequelize-cli db:seed:undo --seed 20241225000001-demo-users.js
```

---

## 👥 **Usuarios de Prueba Creados**

### **Administrador CONANP**

- **Email:** `admin@conanp.gob.mx`
- **Contraseña:** `Admin123!`
- **Rol:** `conanp`
- **Estado:** Activo
- **Teléfono:** `+52 55 1234 5678`

### **Prestadores Activos**

- **Email:** `juan.perez@ejemplo.com`
- **Contraseña:** `Prestador123!`
- **Rol:** `prestador`
- **Estado:** Activo
- **Teléfono:** `+52 229 123 4567`

- **Email:** `maria.gonzalez@ejemplo.com`
- **Contraseña:** `Prestador123!`
- **Rol:** `prestador`
- **Estado:** Activo
- **Teléfono:** `+52 229 987 6543`

- **Email:** `carlos.rodriguez@ejemplo.com`
- **Contraseña:** `Prestador123!`
- **Rol:** `prestador`
- **Estado:** Activo
- **Teléfono:** `+52 229 555 1234`

### **Prestador Inactivo**

- **Email:** `ana.martinez@ejemplo.com`
- **Contraseña:** `Prestador123!`
- **Rol:** `prestador`
- **Estado:** Inactivo
- **Teléfono:** `+52 229 777 8888`

---

## 📧 **Códigos de Invitación**

### **Válidos (No usados, No expirados)**

- `PRESTADOR001` - Para `nuevo.prestador1@ejemplo.com`
- `PRESTADOR002` - Para `nuevo.prestador2@ejemplo.com`
- `CONANP001` - Para `nuevo.admin@conanp.gob.mx`

### **Para Pruebas de Validación**

- `EXPIRADO001` - Expirado hace 1 día
- `USADO001` - Ya fue utilizado

---

## 🚢 **Embarcaciones de Prueba**

### **Juan Pérez**

- **Lobos Express** - Menor, 25 pasajeros, Disponible
- **Isla Dorada** - Mayor, 40 pasajeros, Disponible

### **María González**

- **Mar Azul** - Menor, 30 pasajeros, Disponible
- **Océano Verde** - Mayor, 50 pasajeros, En uso

### **Carlos Rodríguez**

- **Viento Libre** - Menor, 20 pasajeros, Disponible
- **Sol del Caribe** - Menor, 35 pasajeros, Mantenimiento

---

## ⏰ **Bloques de Prueba**

### **Hoy (Día 1)**

- **Bloque Matutino (08:00-10:00)** - 45/65 ocupado
- **Bloque Intermedio (10:00-12:00)** - 65/65 lleno
- **Bloque Vespertino (12:00-14:00)** - 20/65 disponible

### **Mañana (Día 2)**

- **Todos los bloques** - Suspendidos por clima

### **Pasado Mañana (Día 3)**

- **Todos los bloques** - Cerrados por capitanía

### **Días 4-7**

- **Todos los bloques** - Activos y disponibles

---

## 🌊 **Condiciones Meteorológicas**

### **Actual (Hace 0 horas)**

- **Oleaje:** 1.2m
- **Viento:** 15.5 km/h NE
- **Visibilidad:** Buena
- **Estado:** Puerto abierto

### **Hace 2 horas**

- **Oleaje:** 2.1m
- **Viento:** 25.0 km/h E
- **Visibilidad:** Regular
- **Estado:** Restricciones

### **Hace 4 horas**

- **Oleaje:** 0.8m
- **Viento:** 8.0 km/h S
- **Visibilidad:** Excelente
- **Estado:** Puerto abierto

### **Hace 6 horas**

- **Oleaje:** 3.2m
- **Viento:** 35.0 km/h N
- **Visibilidad:** Mala
- **Estado:** Puerto cerrado

---

## 🚤 **Salidas de Prueba**

### **Salida Programada (Hoy)**

- **Prestador:** Juan Pérez
- **Embarcación:** Lobos Express
- **Pasajeros:** 15
- **Estado:** Programada

### **Salida en Curso (Hoy)**

- **Prestador:** María González
- **Embarcación:** Mar Azul
- **Pasajeros:** 25
- **Estado:** En curso

### **Salida Completada (Hace 2 horas)**

- **Prestador:** Carlos Rodríguez
- **Embarcación:** Viento Libre
- **Pasajeros:** 20
- **Estado:** Completada

### **Salida Cancelada por Clima (Ayer)**

- **Prestador:** Juan Pérez
- **Embarcación:** Lobos Express
- **Pasajeros:** 18
- **Estado:** Cancelada por clima
- **Motivo:** Oleaje alto y vientos fuertes

### **Salida Cancelada por Capitanía (Hace 2 días)**

- **Prestador:** María González
- **Embarcación:** Mar Azul
- **Pasajeros:** 12
- **Estado:** Cancelada por capitanía
- **Motivo:** Puerto cerrado por condiciones meteorológicas

---

## 🧪 **Casos de Prueba Sugeridos**

### **1. Autenticación**

```bash
# Login exitoso
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@conanp.gob.mx", "password": "Admin123!"}'

# Login con usuario inactivo
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ana.martinez@ejemplo.com", "password": "Prestador123!"}'
```

### **2. Registro con Invitación**

```bash
# Registro exitoso con código válido
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nuevo Prestador",
    "email": "nuevo.prestador1@ejemplo.com",
    "password": "NuevoPassword123!",
    "codigo_invitacion": "PRESTADOR001"
  }'

# Registro con código expirado
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Usuario Expirado",
    "email": "expirado@ejemplo.com",
    "password": "Password123!",
    "codigo_invitacion": "EXPIRADO001"
  }'
```

### **3. Validaciones**

```bash
# Email inválido
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "email-invalido", "password": "Password123!"}'

# Contraseña muy corta
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@ejemplo.com",
    "password": "123"
  }'
```

---

## 🔧 **Comandos Útiles**

### **Verificar Datos**

```sql
-- Ver usuarios creados
SELECT id, nombre, email, rol, activo FROM users;

-- Ver invitaciones
SELECT codigo, email, rol, usada, expira_en FROM invitaciones;

-- Ver embarcaciones
SELECT nombre, matricula, capacidad, tipo, estado FROM embarcaciones;

-- Ver bloques de hoy
SELECT nombre, hora_inicio, hora_fin, capacidad_total, capacidad_registrada, estado
FROM bloques WHERE fecha = CURRENT_DATE;

-- Ver salidas
SELECT numero_pasajeros, estado, motivo_cancelacion FROM salidas;
```

### **Limpiar y Recrear**

```bash
# Limpiar todos los datos
npm run seed:clean

# Recrear todos los datos
npm run seed:demo
```

---

## ⚠️ **Notas Importantes**

1. **Orden de Ejecución:** Los seeders deben ejecutarse en orden debido a las dependencias entre tablas
2. **Datos Únicos:** Los emails y matrículas son únicos, no se pueden duplicar
3. **Fechas:** Los bloques se crean para los próximos 7 días desde la ejecución
4. **Contraseñas:** Todas las contraseñas cumplen con las validaciones de seguridad
5. **Relaciones:** Todas las relaciones entre tablas están correctamente establecidas

---

## 🎯 **Próximos Pasos**

Con estos datos de prueba puedes:

1. **Probar autenticación** con diferentes roles
2. **Validar el sistema de invitaciones**
3. **Probar validaciones** con datos inválidos
4. **Desarrollar otros controladores** usando estos datos
5. **Crear tests automatizados** basados en estos datos

---

**¡Los seeders están listos para usar! 🎉**

Ejecuta `npm run seed:demo` para crear todos los datos de prueba y empezar a desarrollar y probar el sistema.

