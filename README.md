# 🏝️ Isla Lobos - Backend

Sistema de gestión integral para el control de visitas, embarcaciones y bloques horarios en Isla de Lobos, área natural protegida por CONANP (Comisión Nacional de Áreas Naturales Protegidas).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

---

## 📋 **Tabla de Contenidos**

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#️-instalación)
- [Configuración](#️-configuración)
- [Base de Datos](#-base-de-datos)
- [Ejecución](#️-ejecución)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Sistema de Logging](#-sistema-de-logging)
- [Documentación](#-documentación)
- [Testing](#-testing)
- [Contribución](#-contribución)

---

## ✨ **Características**

### **Gestión de Usuarios**

- ✅ Sistema de autenticación JWT
- ✅ Roles: CONANP (administrador) y Prestador (operador)
- ✅ Gestión de permisos y vigencias
- ✅ Sistema de invitaciones con códigos únicos
- ✅ Recuperación de contraseña
- ✅ Avatar de usuario

### **Control de Embarcaciones**

- ✅ CRUD completo de embarcaciones
- ✅ Tipos: menor y mayor
- ✅ Estados: disponible, en uso, mantenimiento
- ✅ Capacidad y validaciones
- ✅ Asignación a prestadores

### **Gestión de Salidas**

- ✅ Múltiples destinos (Isla de Lobos, Arrecife Tuxpan, etc.)
- ✅ Sistema de bloques horarios para Isla de Lobos
- ✅ Registro libre de horarios para otros destinos
- ✅ Control de capacidad por bloque
- ✅ Estados: programada, en curso, completada, cancelada

### **Sistema de Brazaletes**

- ✅ Gestión de lotes de brazaletes
- ✅ Venta a prestadores
- ✅ Asignación a salidas específicas
- ✅ Tracking de uso y nacionalidad de turistas
- ✅ Estadísticas y reportes
- ✅ Control de inventario

### **Condiciones Meteorológicas**

- ✅ Integración con API del SMN (Servicio Meteorológico Nacional)
- ✅ Pronósticos diarios y horarios
- ✅ Alertas automáticas
- ✅ Estados del puerto
- ✅ Histórico de condiciones

### **Dashboard y Estadísticas**

- ✅ Vista integral del sistema
- ✅ Ocupación por día y bloque
- ✅ Estado de embarcaciones
- ✅ Alertas de permisos
- ✅ Resumen meteorológico

### **Sistema de Notificaciones WhatsApp**

- ✅ Integración con Twilio WhatsApp API
- ✅ Notificaciones individuales y masivas
- ✅ Alertas de clima automáticas
- ✅ Recordatorios de permisos por vencer
- ✅ Confirmaciones de salidas registradas
- ✅ Alertas de stock de brazaletes
- ✅ Plantillas de mensajes predefinidas
- ✅ Tracking de estado de mensajes
- ✅ Modo de prueba para desarrollo

### **Sistema de Emails (Nodemailer)**

- ✅ Integración con Nodemailer SMTP
- ✅ Emails individuales y masivos
- ✅ Plantillas HTML profesionales
- ✅ Alertas de clima por email
- ✅ Recordatorios de permisos por vencer
- ✅ Confirmaciones de salidas registradas
- ✅ Emails de recuperación de contraseña
- ✅ Emails de bienvenida
- ✅ Verificación de conexión SMTP
- ✅ Modo de prueba para desarrollo

---

## 🚀 **Tecnologías**

### **Core**

- **[Node.js](https://nodejs.org/)** v16+ - Entorno de ejecución
- **[TypeScript](https://www.typescriptlang.org/)** v5.9 - Lenguaje tipado
- **[Express.js](https://expressjs.com/)** v5.1 - Framework web

### **Base de Datos**

- **[PostgreSQL](https://www.postgresql.org/)** v12+ - Base de datos relacional
- **[Sequelize](https://sequelize.org/)** v6.37 - ORM

### **Seguridad**

- **[JWT](https://jwt.io/)** - Autenticación con tokens
- **[Bcrypt](https://www.npmjs.com/package/bcryptjs)** - Encriptación de contraseñas
- **[Helmet](https://helmetjs.github.io/)** - Headers de seguridad HTTP
- **[Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)** - Limitación de peticiones

### **Validación y Logging**

- **[Express Validator](https://express-validator.github.io/)** - Validación de datos
- **[Pino](https://getpino.io/)** - Sistema de logging de alto rendimiento
- **[Pino HTTP](https://github.com/pinojs/pino-http)** - Logging de peticiones HTTP
- **[Pino Pretty](https://github.com/pinojs/pino-pretty)** - Formato legible para desarrollo

### **Utilidades**

- **[Axios](https://axios-http.com/)** - Cliente HTTP
- **[UUID](https://www.npmjs.com/package/uuid)** - Generación de IDs únicos
- **[Dotenv](https://www.npmjs.com/package/dotenv)** - Variables de entorno

### **Notificaciones**

- **[Twilio](https://www.twilio.com/)** - WhatsApp API para notificaciones automatizadas
- **[Nodemailer](https://nodemailer.com/)** - Envío de correos electrónicos SMTP

### **Desarrollo**

- **[Nodemon](https://nodemon.io/)** - Hot reload en desarrollo
- **[TS-Node](https://typestrong.org/ts-node/)** - Ejecución directa de TypeScript
- **[Sequelize CLI](https://sequelize.org/docs/v6/other-topics/migrations/)** - Migraciones de base de datos

---

## 📋 **Prerrequisitos**

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v16 o superior ([Descargar](https://nodejs.org/))
- **PostgreSQL** v12 o superior ([Descargar](https://www.postgresql.org/download/))
- **npm** o **yarn** (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com/))

Verifica las instalaciones:

```bash
node --version  # v16.0.0 o superior
npm --version   # 7.0.0 o superior
psql --version  # PostgreSQL 12.0 o superior
```

---

## 🛠️ **Instalación**

### **1. Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/isla-lobos-backend.git
cd isla-lobos-backend
```

### **2. Instalar dependencias**

```bash
npm install
```

### **3. Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Ver la sección [Configuración](#️-configuración) para más detalles.

### **4. Crear la base de datos**

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE isla_lobos_db;

# Salir de psql
\q
```

O usar el script de Sequelize:

```bash
npm run db:create
```

### **5. Ejecutar migraciones**

```bash
npm run db:migrate
```

### **6. Crear primer administrador**

**Opción A: Para PRODUCCIÓN (recomendado)**

```bash
# Configurar variables de entorno en .env
FIRST_ADMIN_EMAIL=admin@conanp.gob.mx
FIRST_ADMIN_PASSWORD=ContraseñaSegura123!
FIRST_ADMIN_NAME=Administrador CONANP
FIRST_ADMIN_PHONE=+52 55 1234 5678

# Ejecutar script de bootstrap
npm run create:admin
```

**Opción B: Para DESARROLLO (datos de prueba)**

```bash
npm run seed:demo
```

📚 **Más información:** Ver [`QUICKSTART_ADMIN.md`](QUICKSTART_ADMIN.md)

---

## ⚙️ **Configuración**

### **Variables de Entorno**

Edita el archivo `.env` con tus configuraciones:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_URL=postgresql://postgres:password@localhost:5432/isla_lobos_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=isla_lobos_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_segura

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug  # trace, debug, info, warn, error, fatal

# Frontend (para emails de recuperación)
FRONTEND_URL=http://localhost:3000

# Twilio WhatsApp (opcional - para notificaciones)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_secreto
TWILIO_WHATSAPP_NUMBER=+14155238886

# Nodemailer SMTP (opcional - para emails)
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=tu-email@gmail.com
NODEMAILER_PASS=tu_password_de_aplicacion
```

📚 **Documentación completa:** [`documentation/ENV_VARIABLES.md`](documentation/ENV_VARIABLES.md)

---

## 🗄️ **Base de Datos**

### **Migraciones**

```bash
# Ejecutar todas las migraciones
npm run db:migrate

# Revertir última migración
npm run db:migrate:undo

# Revertir todas las migraciones
npm run db:migrate:undo:all
```

### **Seeders (Datos de Prueba)**

```bash
# Cargar datos de prueba
npm run seed:demo

# Limpiar datos de prueba
npm run seed:clean

# Cargar datos de reportes (septiembre-octubre 2025)
npm run seed:reportes

# Limpiar datos de reportes
npm run seed:reportes:clean
```

### **Modelos Disponibles**

- 👤 **User** - Usuarios del sistema
- 🚢 **Embarcacion** - Embarcaciones de prestadores
- 🕐 **Bloque** - Bloques horarios predefinidos
- 📅 **Salida** - Salidas registradas a destinos
- 🌤️ **CondicionMeteorologica** - Datos meteorológicos
- 💌 **Invitacion** - Códigos de invitación
- 📦 **LoteBrazalete** - Lotes de brazaletes
- 🎫 **Brazalete** - Brazaletes individuales
- 💰 **VentaBrazalete** - Ventas a prestadores

📚 **Documentación completa:** [`documentation/DATABASE_SETUP.md`](documentation/DATABASE_SETUP.md)

---

## 🏃‍♂️ **Ejecución**

### **Modo Desarrollo**

```bash
npm run dev
```

Servidor con hot reload en `http://localhost:3000`

### **Modo Producción**

```bash
# Compilar TypeScript a JavaScript
npm run build

# Ejecutar versión compilada
npm start
```

### **Verificar Estado**

```bash
# Health check
curl http://localhost:3000/health

# Respuesta esperada:
# {
#   "status": "OK",
#   "message": "Servidor funcionando correctamente",
#   "timestamp": "2025-10-10T20:30:45.123Z"
# }
```

---

## 📜 **Scripts Disponibles**

### **Desarrollo**

```bash
npm run dev          # Ejecutar en modo desarrollo con hot reload
npm run build        # Compilar TypeScript a JavaScript
npm start            # Ejecutar versión compilada
```

### **Base de Datos**

```bash
npm run db:create           # Crear base de datos
npm run db:drop             # Eliminar base de datos
npm run db:migrate          # Ejecutar migraciones
npm run db:migrate:undo     # Revertir última migración
npm run db:seed             # Ejecutar todos los seeders
npm run db:seed:undo        # Revertir todos los seeders
npm run db:clean            # Limpiar base de datos completamente
```

### **Seeders Personalizados**

```bash
npm run create:admin            # Crear primer administrador (producción)
npm run seed:demo               # Cargar datos de demostración
npm run seed:clean              # Limpiar datos de demostración
npm run seed:reportes           # Cargar datos para reportes
npm run seed:reportes:clean     # Limpiar datos de reportes
```

### **Testing**

```bash
npm test            # Ejecutar tests (próximamente)
```

---

## 📁 **Estructura del Proyecto**

```
isla-lobos-backend/
├── src/                          # Código fuente TypeScript
│   ├── config/                   # Configuraciones
│   │   └── database.ts           # Configuración de Sequelize
│   ├── controllers/              # Controladores de rutas
│   │   ├── authController.ts     # Autenticación
│   │   ├── userController.ts     # Gestión de usuarios
│   │   ├── embarcacionController.ts
│   │   ├── bloqueController.ts
│   │   ├── salidaController.ts
│   │   ├── climaController.ts
│   │   ├── dashboardController.ts
│   │   ├── invitacionController.ts
│   │   ├── brazaleteController.ts
│   │   └── estadisticasBrazaleteController.ts
│   ├── middleware/               # Middleware personalizado
│   │   ├── auth.ts               # Autenticación JWT
│   │   └── validation.ts         # Validaciones
│   ├── models/                   # Modelos de Sequelize
│   │   ├── User.ts
│   │   ├── Embarcacion.ts
│   │   ├── Bloque.ts
│   │   ├── Salida.ts
│   │   ├── CondicionMeteorologica.ts
│   │   ├── Invitacion.ts
│   │   ├── LoteBrazalete.ts
│   │   ├── Brazalete.ts
│   │   ├── VentaBrazalete.ts
│   │   └── index.ts              # Relaciones entre modelos
│   ├── routes/                   # Definición de rutas
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── embarcacionRoutes.ts
│   │   ├── bloqueRoutes.ts
│   │   ├── salidaRoutes.ts
│   │   ├── climaRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── invitacionRoutes.ts
│   │   ├── brazaleteRoutes.ts
│   │   └── index.ts
│   ├── services/                 # Servicios externos
│   │   └── smnService.ts         # Servicio Meteorológico Nacional
│   ├── types/                    # Tipos de TypeScript
│   │   └── index.ts              # Interfaces y enums
│   ├── utils/                    # Utilidades
│   │   ├── dateUtils.ts          # Manejo de fechas
│   │   └── logger.ts             # Sistema de logging con Pino
│   ├── validators/               # Validaciones con express-validator
│   │   ├── authValidators.ts
│   │   ├── userValidators.ts
│   │   ├── embarcacionValidators.ts
│   │   ├── bloqueValidators.ts
│   │   ├── salidaValidators.ts
│   │   ├── climaValidators.ts
│   │   ├── dashboardValidators.ts
│   │   ├── invitacionValidators.ts
│   │   └── brazaleteValidators.ts
│   ├── index.ts                  # Punto de entrada
│   └── server.ts                 # Configuración de Express
├── dist/                         # Código compilado (generado)
├── migrations/                   # Migraciones de base de datos
├── seeders/                      # Datos de prueba
├── scripts/                      # Scripts de utilidad
├── documentation/                # Documentación del proyecto
│   ├── API ROUTES/              # Referencia de endpoints
│   ├── LOGGING_SYSTEM.md        # Sistema de logging
│   ├── PROYECTO_CONTEXTO.md     # Contexto del proyecto
│   ├── REGLAS_TRABAJO.md        # Reglas de desarrollo
│   └── ...                       # Más documentación
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore
├── nodemon.json                  # Configuración de Nodemon
├── package.json
├── tsconfig.json                 # Configuración de TypeScript
└── README.md                     # Este archivo
```

---

## 🔌 **API Endpoints**

### **Autenticación** (`/api/auth`)

| Método | Endpoint           | Descripción            | Auth |
| ------ | ------------------ | ---------------------- | ---- |
| POST   | `/login`           | Iniciar sesión         | ❌   |
| POST   | `/register`        | Registrar usuario      | ❌   |
| GET    | `/verify`          | Verificar token        | ✅   |
| POST   | `/refresh`         | Renovar token          | ✅   |
| POST   | `/logout`          | Cerrar sesión          | ✅   |
| PUT    | `/change-password` | Cambiar contraseña     | ✅   |
| GET    | `/profile`         | Obtener perfil         | ✅   |
| POST   | `/forgot-password` | Recuperar contraseña   | ❌   |
| POST   | `/reset-password`  | Restablecer contraseña | ❌   |

### **Usuarios** (`/api/usuarios`)

| Método | Endpoint             | Descripción        | Auth      |
| ------ | -------------------- | ------------------ | --------- |
| GET    | `/`                  | Listar usuarios    | 🔐 CONANP |
| GET    | `/:id`               | Obtener usuario    | ✅        |
| POST   | `/`                  | Crear usuario      | 🔐 CONANP |
| PUT    | `/:id`               | Actualizar usuario | 🔐 CONANP |
| DELETE | `/:id`               | Eliminar usuario   | 🔐 CONANP |
| PATCH  | `/:id/activar`       | Activar usuario    | 🔐 CONANP |
| PUT    | `/perfil/actualizar` | Actualizar perfil  | ✅        |
| GET    | `/estadisticas`      | Estadísticas       | 🔐 CONANP |

### **Embarcaciones** (`/api/embarcaciones`)

| Método | Endpoint             | Descripción            | Auth         |
| ------ | -------------------- | ---------------------- | ------------ |
| GET    | `/`                  | Listar embarcaciones   | ✅           |
| GET    | `/:id`               | Obtener embarcación    | ✅           |
| POST   | `/`                  | Crear embarcación      | ✅ Prestador |
| PUT    | `/:id`               | Actualizar embarcación | ✅           |
| DELETE | `/:id`               | Eliminar embarcación   | ✅           |
| GET    | `/mis-embarcaciones` | Mis embarcaciones      | ✅ Prestador |
| GET    | `/estadisticas`      | Estadísticas           | ✅           |

### **Bloques** (`/api/bloques`)

| Método | Endpoint        | Descripción       | Auth      |
| ------ | --------------- | ----------------- | --------- |
| GET    | `/`             | Listar bloques    | ✅        |
| GET    | `/:id`          | Obtener bloque    | ✅        |
| POST   | `/`             | Crear bloque      | 🔐 CONANP |
| PUT    | `/:id`          | Actualizar bloque | 🔐 CONANP |
| DELETE | `/:id`          | Eliminar bloque   | 🔐 CONANP |
| GET    | `/estadisticas` | Estadísticas      | ✅        |

### **Salidas** (`/api/salidas`)

| Método | Endpoint        | Descripción       | Auth         |
| ------ | --------------- | ----------------- | ------------ |
| GET    | `/`             | Listar salidas    | ✅           |
| GET    | `/:id`          | Obtener salida    | ✅           |
| POST   | `/`             | Crear salida      | ✅ Prestador |
| PUT    | `/:id`          | Actualizar salida | ✅           |
| DELETE | `/:id`          | Cancelar salida   | ✅           |
| GET    | `/mis-salidas`  | Mis salidas       | ✅ Prestador |
| GET    | `/estadisticas` | Estadísticas      | ✅           |

### **Clima** (`/api/clima`)

| Método | Endpoint        | Descripción          | Auth      |
| ------ | --------------- | -------------------- | --------- |
| GET    | `/`             | Listar condiciones   | ✅        |
| GET    | `/:id`          | Obtener condición    | ✅        |
| POST   | `/`             | Crear condición      | 🔐 CONANP |
| PUT    | `/:id`          | Actualizar condición | 🔐 CONANP |
| DELETE | `/:id`          | Eliminar condición   | 🔐 CONANP |
| GET    | `/actual`       | Condición actual     | ✅        |
| GET    | `/prediccion`   | Predicción 5 días    | ✅        |
| GET    | `/alertas`      | Alertas activas      | ✅        |
| GET    | `/estadisticas` | Estadísticas         | ✅        |
| POST   | `/sincronizar`  | Sincronizar con SMN  | 🔐 CONANP |

### **Dashboard** (`/api/dashboard`)

| Método | Endpoint         | Descripción            | Auth      |
| ------ | ---------------- | ---------------------- | --------- |
| GET    | `/estadisticas`  | Estadísticas generales | ✅        |
| GET    | `/ocupacion`     | Ocupación por día      | ✅        |
| GET    | `/embarcaciones` | Estado embarcaciones   | ✅        |
| GET    | `/permisos`      | Estado permisos        | 🔐 CONANP |
| GET    | `/clima`         | Resumen meteorológico  | ✅        |
| GET    | `/alertas`       | Alertas del sistema    | ✅        |

### **Invitaciones** (`/api/invitaciones`)

| Método | Endpoint        | Descripción           | Auth      |
| ------ | --------------- | --------------------- | --------- |
| GET    | `/`             | Listar invitaciones   | 🔐 CONANP |
| GET    | `/:id`          | Obtener invitación    | 🔐 CONANP |
| POST   | `/`             | Crear invitación      | 🔐 CONANP |
| PUT    | `/:id`          | Actualizar invitación | 🔐 CONANP |
| DELETE | `/:id`          | Eliminar invitación   | 🔐 CONANP |
| POST   | `/validar`      | Validar código        | ❌        |
| POST   | `/:id/usar`     | Usar invitación       | ❌        |
| GET    | `/estadisticas` | Estadísticas          | 🔐 CONANP |

### **Brazaletes** (`/api/brazaletes`)

| Método | Endpoint          | Descripción           | Auth         |
| ------ | ----------------- | --------------------- | ------------ |
| GET    | `/inventario`     | Ver inventario        | 🔐 CONANP    |
| POST   | `/lotes`          | Crear lote            | 🔐 CONANP    |
| GET    | `/lotes`          | Listar lotes          | 🔐 CONANP    |
| POST   | `/vender`         | Vender brazaletes     | 🔐 CONANP    |
| GET    | `/prestador/:id`  | Brazaletes prestador  | ✅           |
| GET    | `/buscar`         | Buscar por código     | ✅           |
| POST   | `/asignar`        | Asignar a salida      | ✅ Prestador |
| POST   | `/usar`           | Registrar uso         | ✅ Prestador |
| GET    | `/salida/:id`     | Brazaletes de salida  | ✅           |
| PUT    | `/actualizar-uso` | Actualizar uso masivo | 🔐 CONANP    |

### **Estadísticas Brazaletes** (`/api/brazaletes/estadisticas`)

| Método | Endpoint       | Descripción            | Auth      |
| ------ | -------------- | ---------------------- | --------- |
| GET    | `/`            | Estadísticas generales | ✅        |
| GET    | `/alertas`     | Alertas de inventario  | 🔐 CONANP |
| GET    | `/ventas`      | Reporte de ventas      | 🔐 CONANP |
| GET    | `/utilizacion` | Reporte de utilización | 🔐 CONANP |

### **Notificaciones WhatsApp** (`/api/notificaciones`)

| Método | Endpoint              | Descripción                    | Auth      |
| ------ | --------------------- | ------------------------------ | --------- |
| GET    | `/estado`             | Estado del servicio            | 🔐 CONANP |
| POST   | `/enviar`             | Enviar notificación individual | 🔐 CONANP |
| POST   | `/enviar-masivo`      | Enviar notificaciones masivas  | 🔐 CONANP |
| POST   | `/alerta-clima`       | Alerta meteorológica a todos   | 🔐 CONANP |
| POST   | `/alerta-permisos`    | Alertas de permisos por vencer | 🔐 CONANP |
| GET    | `/plantillas`         | Plantillas de mensajes         | 🔐 CONANP |
| GET    | `/estado/:messageSid` | Estado de mensaje enviado      | 🔐 CONANP |
| POST   | `/test`               | Mensaje de prueba (dev)        | 🔐 CONANP |

### **Notificaciones Emails** (`/api/emails`)

| Método | Endpoint           | Descripción                    | Auth      |
| ------ | ------------------ | ------------------------------ | --------- |
| GET    | `/estado`          | Estado del servicio SMTP       | 🔐 CONANP |
| POST   | `/enviar`          | Enviar email individual        | 🔐 CONANP |
| POST   | `/enviar-masivo`   | Enviar emails masivos          | 🔐 CONANP |
| POST   | `/alerta-clima`    | Alerta meteorológica por email | 🔐 CONANP |
| POST   | `/alerta-permisos` | Alertas de permisos por email  | 🔐 CONANP |
| GET    | `/plantillas`      | Plantillas de emails           | 🔐 CONANP |
| POST   | `/test`            | Email de prueba (dev)          | 🔐 CONANP |

**Leyenda:**

- ❌ = Público (no requiere autenticación)
- ✅ = Requiere autenticación
- 🔐 CONANP = Solo rol CONANP
- ✅ Prestador = Solo rol Prestador

📚 **Documentación completa:** [`documentation/API ROUTES/`](documentation/API%20ROUTES/)

📱 **Documentación WhatsApp:** [`documentation/NOTIFICACIONES_WHATSAPP_API.md`](documentation/NOTIFICACIONES_WHATSAPP_API.md)

---

## 📊 **Sistema de Logging**

El proyecto utiliza **Pino**, un sistema de logging de alto rendimiento que reemplaza `console.log` y `console.error`.

### **Características**

- 🚄 **5-10x más rápido** que console.log
- 📊 **Logs estructurados** en formato JSON
- 🎨 **Pretty print** en desarrollo con colores
- 🏷️ **Child loggers** por módulo con contexto
- 📝 **Niveles configurables**: trace, debug, info, warn, error, fatal

### **Uso Básico**

```typescript
import { createLogger } from "../utils/logger";

const logger = createLogger("NombreModulo");

// Logs informativos
logger.info("Operación exitosa");
logger.info({ userId: user.id }, "Usuario creado");

// Logs de error con contexto
logger.error({ err: error, data: req.body }, "Error al procesar");

// Debug en desarrollo
logger.debug({ query: sql }, "Ejecutando query");
```

### **Salida en Desarrollo**

```bash
14:30:45.123 INFO  [Server] 🚀 Servidor ejecutándose en puerto 3000
14:30:45.234 INFO  [Database] ✅ Conexión establecida correctamente
14:30:47.456 ERROR [AuthController] Error en login
    err: {
      "message": "Usuario no encontrado",
      "stack": "..."
    }
```

### **Configuración**

Variable de entorno `LOG_LEVEL`:

```env
# Niveles disponibles
LOG_LEVEL=trace   # Máximo detalle
LOG_LEVEL=debug   # Desarrollo (recomendado)
LOG_LEVEL=info    # Producción (recomendado)
LOG_LEVEL=warn    # Solo advertencias y errores
LOG_LEVEL=error   # Solo errores
LOG_LEVEL=fatal   # Solo errores críticos
```

📚 **Documentación completa:** [`documentation/LOGGING_SYSTEM.md`](documentation/LOGGING_SYSTEM.md)

---

## 📚 **Documentación**

El proyecto cuenta con documentación exhaustiva en el directorio [`documentation/`](documentation/):

### **General**

- 📖 [`PROYECTO_CONTEXTO.md`](documentation/PROYECTO_CONTEXTO.md) - Contexto y propósito del sistema
- 🔧 [`REGLAS_TRABAJO.md`](documentation/REGLAS_TRABAJO.md) - Reglas de desarrollo y estándares
- ✅ [`CHECKLIST_PROGRESO.md`](documentation/CHECKLIST_PROGRESO.md) - Progreso del proyecto

### **Setup y Despliegue**

- ⚡ [`QUICKSTART_ADMIN.md`](QUICKSTART_ADMIN.md) - Crear primer admin en 2 minutos
- 🚀 [`SETUP_PRODUCCION.md`](SETUP_PRODUCCION.md) - Guía completa de instalación en producción
- 🔐 [`documentation/BOOTSTRAP_ADMIN.md`](documentation/BOOTSTRAP_ADMIN.md) - Creación del primer administrador
- ❓ [`documentation/CREAR_PRIMER_ADMIN.md`](documentation/CREAR_PRIMER_ADMIN.md) - 3 opciones para crear admin

### **API y Endpoints**

- 🔌 [`API ROUTES/API_ROUTES_REFERENCE.md`](documentation/API%20ROUTES/API_ROUTES_REFERENCE.md) - Referencia completa de endpoints
- 🔐 [`AUTH_API_DOCUMENTATION.md`](documentation/AUTH_API_DOCUMENTATION.md) - Autenticación
- 👤 [`USER_API_DOCUMENTATION.md`](documentation/USER_API_DOCUMENTATION.md) - Usuarios
- 🚢 [`EMBARCACION_API_DOCUMENTATION.md`](documentation/EMBARCACION_API_DOCUMENTATION.md) - Embarcaciones
- 🕐 [`BLOQUE_API_DOCUMENTATION.md`](documentation/BLOQUE_API_DOCUMENTATION.md) - Bloques horarios
- 🌤️ [`CLIMA_API_DOCUMENTATION.md`](documentation/CLIMA_API_DOCUMENTATION.md) - Condiciones meteorológicas
- 📊 [`DASHBOARD_API_DOCUMENTATION.md`](documentation/DASHBOARD_API_DOCUMENTATION.md) - Dashboard
- 💌 [`INVITACION_API_DOCUMENTATION.md`](documentation/INVITACION_API_DOCUMENTATION.md) - Invitaciones
- 📱 [`NOTIFICACIONES_WHATSAPP_API.md`](documentation/NOTIFICACIONES_WHATSAPP_API.md) - Notificaciones WhatsApp
- 📧 [`NOTIFICACIONES_EMAIL_API.md`](documentation/NOTIFICACIONES_EMAIL_API.md) - Sistema de Emails

### **Base de Datos**

- 🗄️ [`DATABASE_SETUP.md`](documentation/DATABASE_SETUP.md) - Configuración de base de datos
- 🌱 [`SEEDERS_DOCUMENTATION.md`](documentation/SEEDERS_DOCUMENTATION.md) - Datos de prueba
- 📅 [`FECHAS_CONFIGURACION.md`](documentation/FECHAS_CONFIGURACION.md) - Manejo de fechas

### **Configuración**

- ⚙️ [`ENV_VARIABLES.md`](documentation/ENV_VARIABLES.md) - Variables de entorno
- 📊 [`LOGGING_SYSTEM.md`](documentation/LOGGING_SYSTEM.md) - Sistema de logging
- ✅ [`VALIDACIONES_API.md`](documentation/VALIDACIONES_API.md) - Validaciones

### **Postman**

- 📮 [`POSTMAN_GUIDE.md`](documentation/POSTMAN_GUIDE.md) - Guía de uso
- 📦 [`Isla-Lobos-API.postman_collection.json`](documentation/Isla-Lobos-API.postman_collection.json) - Colección
- 🌍 [`Isla-Lobos-Environment.postman_environment.json`](documentation/Isla-Lobos-Environment.postman_environment.json) - Variables

---

## 🧪 **Testing**

```bash
# Ejecutar tests (próximamente)
npm test
```

El proyecto está preparado para integrar:

- ✅ Tests unitarios con **Jest**
- ✅ Tests de integración con **Supertest**
- ✅ Coverage de código

📚 **Documentación:** [`documentation/TESTING_README.md`](documentation/TESTING_README.md)

---

## 🤝 **Contribución**

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

### **1. Fork del Proyecto**

```bash
# Hacer fork en GitHub y luego clonar
git clone https://github.com/tu-usuario/isla-lobos-backend.git
cd isla-lobos-backend
```

### **2. Crear una Rama**

```bash
git checkout -b feature/nueva-funcionalidad
# o
git checkout -b fix/correccion-bug
```

### **3. Realizar Cambios**

Asegúrate de seguir las [reglas de trabajo](documentation/REGLAS_TRABAJO.md):

- ✅ Usar TypeScript con tipos estrictos (sin `any`)
- ✅ Seguir el patrón de formato de fechas (YYYY-MM-DD)
- ✅ Usar el sistema de logging con Pino
- ✅ Validar con express-validator
- ✅ Documentar cambios importantes

### **4. Commit**

```bash
git add .
git commit -m "feat: descripción clara del cambio"
```

Formato de commits:

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `refactor:` - Refactorización de código
- `test:` - Añadir o modificar tests
- `chore:` - Tareas de mantenimiento

### **5. Push y Pull Request**

```bash
git push origin feature/nueva-funcionalidad
```

Luego abre un Pull Request en GitHub con:

- Descripción clara de los cambios
- Referencias a issues relacionados
- Screenshots si aplica

---

## 📝 **Notas Importantes**

### **Zona Horaria**

- El servidor trabaja en **UTC**
- Las fechas se almacenan en **UTC**
- El frontend maneja la conversión a zona horaria local de México (GMT-6)
- Usar siempre el formato `YYYY-MM-DD` en respuestas API

### **Roles de Usuario**

- **CONANP**: Acceso completo (en minúsculas: `"conanp"`)
- **Prestador**: Acceso limitado a sus recursos

### **Estados de Brazaletes**

- `disponible`: En inventario de CONANP
- `asignado`: Vendido a prestador y asignado a salida
- `utilizado`: Usado en salida completada
- `perdido`: Reportado como perdido

### **Destinos de Salidas**

- Isla de Lobos (requiere bloque horario)
- Arrecife Tuxpan (horario libre)
- Arrecife de en Medio (horario libre)
- Arrecife Tanhuijo (horario libre)

---

## 📄 **Licencia**

Este proyecto está bajo la Licencia ISC.

---

## 👥 **Equipo**

Desarrollado por el equipo de **Isla Lobos** para CONANP.

---

## 🔗 **Enlaces Útiles**

- 📖 [Documentación Completa](documentation/)
- 🐛 [Reportar Bug](https://github.com/tu-usuario/isla-lobos-backend/issues)
- 💡 [Solicitar Feature](https://github.com/tu-usuario/isla-lobos-backend/issues)
- 📮 [Colección Postman](documentation/Isla-Lobos-API.postman_collection.json)

---

## ⭐ **Agradecimientos**

Gracias a todos los que han contribuido a este proyecto.

---

<div align="center">

**Hecho con ❤️ para la conservación de Isla de Lobos**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

</div>
