# Isla Lobos - Backend

Sistema de gestión de bloques y salidas de embarcaciones.

## 🚀 Tecnologías

- **Node.js** con **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas

## 📋 Prerrequisitos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd backend
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp env.example .env
   ```

   Editar el archivo `.env` con tus configuraciones:

   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=isla_lobos_db
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña
   JWT_SECRET=tu_clave_secreta_jwt
   JWT_EXPIRES_IN=24h
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Crear la base de datos**
   ```sql
   CREATE DATABASE isla_lobos_db;
   ```

## 🏃‍♂️ Ejecución

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuraciones (base de datos, etc.)
├── controllers/     # Controladores de las rutas
├── middleware/      # Middleware personalizado
├── models/          # Modelos de Sequelize
├── routes/          # Definición de rutas
├── types/           # Tipos de TypeScript
├── utils/           # Utilidades
└── index.ts         # Punto de entrada de la aplicación
```

## 🔍 Endpoints Disponibles

### Health Check

- `GET /health` - Estado del servidor
- `GET /db-test` - Prueba de conexión a la base de datos

## 🔐 Autenticación

El sistema utiliza JWT para la autenticación. Los endpoints protegidos requieren el header:

```
Authorization: Bearer <token>
```

## 📊 Base de Datos

El proyecto utiliza PostgreSQL con Sequelize como ORM. Las migraciones y modelos se definirán en las siguientes fases del desarrollo.

## 🧪 Testing

```bash
# Ejecutar tests (cuando se implementen)
npm test
```

## 📝 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo con hot reload
- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Ejecutar la aplicación compilada
- `npm test` - Ejecutar tests

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
# isla-lobos-backend
