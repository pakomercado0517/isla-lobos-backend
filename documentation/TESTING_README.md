# 🧪 Guía de Pruebas - Isla Lobos API

## 📋 Resumen de APIs Implementadas

### ✅ **APIs Completamente Funcionales:**

#### 🔐 **Autenticación** (`/api/auth`)

- `POST /login` - Inicio de sesión
- `POST /register` - Registro de usuarios
- `GET /verify` - Verificar token
- `POST /refresh` - Renovar token
- `POST /logout` - Cerrar sesión
- `PUT /change-password` - Cambiar contraseña
- `GET /profile` - Obtener perfil

#### 👥 **Usuarios** (`/api/usuarios`)

- `GET /` - Listar usuarios (CONANP)
- `GET /stats` - Estadísticas (CONANP)
- `GET /:userId` - Obtener usuario por ID (CONANP)
- `POST /` - Crear usuario (CONANP)
- `PUT /:userId` - Actualizar usuario (CONANP)
- `DELETE /:userId` - Desactivar usuario (CONANP)
- `PATCH /:userId/activate` - Activar usuario (CONANP)
- `PUT /profile/update` - Actualizar perfil personal

## 🚀 Inicio Rápido

### 1. Preparar el Entorno

```bash
# Asegúrate de que el servidor esté ejecutándose
npm run dev

# Verifica que los seeders estén ejecutados
node scripts/check-data.js
```

### 2. Importar en Postman

1. Importa `Isla-Lobos-API.postman_collection.json`
2. Importa `Isla-Lobos-Environment.postman_environment.json`
3. Selecciona el environment "Isla Lobos Environment"

### 3. Hacer Login

1. Ejecuta **🔐 Autenticación > Login**
2. El token se guardará automáticamente
3. ¡Ya puedes probar todas las APIs!

## 🔑 Credenciales de Prueba

### Administrador CONANP

- **Email**: `admin@conanp.gob.mx`
- **Contraseña**: `Admin123!`
- **Permisos**: Acceso completo a todas las APIs

### Prestador de Servicios

- **Email**: `juan.perez@ejemplo.com`
- **Contraseña**: `Prestador123!`
- **Permisos**: Solo perfil personal y algunas APIs públicas

### Otros Prestadores Disponibles

- `maria.gonzalez@ejemplo.com` / `Prestador123!`
- `carlos.rodriguez@ejemplo.com` / `Prestador123!`
- `ana.martinez@ejemplo.com` / `Prestador123!` (inactivo)

## 📊 Datos de Prueba Disponibles

### Usuarios

- **Total**: 5 usuarios
- **CONANP**: 1 administrador
- **Prestadores**: 4 (3 activos, 1 inactivo)

### Invitaciones

- **Válidas**: `PRESTADOR001`, `PRESTADOR002`, `CONANP001`
- **Expirada**: `EXPIRADO001`
- **Usada**: `USADO001`

### Embarcaciones

- **Total**: 6 embarcaciones
- **Estados**: disponible, en_uso, mantenimiento
- **Tipos**: menor, mayor

### Bloques

- **Total**: 21 bloques (7 días × 3 bloques)
- **Estados**: activo, lleno, suspendido_por_clima, cerrado_capitaria

### Salidas

- **Total**: 5 salidas
- **Estados**: programada, en_curso, completada, cancelada_por_clima, cancelada_capitaria

## 🧪 Casos de Prueba Específicos

### 1. Autenticación Completa

```bash
# 1. Login exitoso
POST /api/auth/login
Body: {"email": "admin@conanp.gob.mx", "password": "Admin123!"}

# 2. Verificar token
GET /api/auth/verify

# 3. Obtener perfil
GET /api/auth/profile

# 4. Cambiar contraseña
PUT /api/auth/change-password
Body: {"currentPassword": "Admin123!", "newPassword": "NewPass123!"}

# 5. Login con nueva contraseña
POST /api/auth/login
Body: {"email": "admin@conanp.gob.mx", "password": "NewPass123!"}

# 6. Logout
POST /api/auth/logout
```

### 2. Gestión de Usuarios (CONANP)

```bash
# 1. Obtener estadísticas
GET /api/usuarios/stats

# 2. Listar usuarios
GET /api/usuarios?page=1&limit=10

# 3. Filtrar por rol
GET /api/usuarios?rol=prestador&activo=true

# 4. Crear nuevo usuario
POST /api/usuarios
Body: {
  "nombre": "Nuevo Prestador",
  "email": "nuevo@ejemplo.com",
  "telefono": "2291234567",
  "password": "Password123!",
  "rol": "prestador"
}

# 5. Obtener usuario por ID
GET /api/usuarios/{user_id}

# 6. Actualizar usuario
PUT /api/usuarios/{user_id}
Body: {"nombre": "Nombre Actualizado", "activo": false}

# 7. Activar usuario
PATCH /api/usuarios/{user_id}/activate
```

### 3. Gestión de Perfil Personal

```bash
# 1. Login como prestador
POST /api/auth/login
Body: {"email": "juan.perez@ejemplo.com", "password": "Prestador123!"}

# 2. Obtener perfil
GET /api/auth/profile

# 3. Actualizar perfil
PUT /api/usuarios/profile/update
Body: {"nombre": "Juan Carlos Pérez", "telefono": "2299876543"}

# 4. Verificar cambios
GET /api/auth/profile
```

### 4. Pruebas de Validación

```bash
# 1. Login con credenciales incorrectas
POST /api/auth/login
Body: {"email": "admin@conanp.gob.mx", "password": "wrong"}

# 2. Crear usuario con email duplicado
POST /api/usuarios
Body: {"email": "admin@conanp.gob.mx", ...}

# 3. Acceder sin token
GET /api/usuarios/stats
# (sin header Authorization)

# 4. Acceder con rol incorrecto
# Login como prestador, luego intentar acceder a rutas CONANP
GET /api/usuarios/stats
```

### 5. Pruebas de Registro

```bash
# 1. Registro con código válido
POST /api/auth/register
Body: {
  "nombre": "Nuevo Usuario",
  "email": "nuevo@ejemplo.com",
  "telefono": "2291234567",
  "password": "Password123!",
  "codigo_invitacion": "PRESTADOR001"
}

# 2. Registro con código expirado
POST /api/auth/register
Body: {..., "codigo_invitacion": "EXPIRADO001"}

# 3. Registro con código usado
POST /api/auth/register
Body: {..., "codigo_invitacion": "USADO001"}
```

## 📈 Respuestas Esperadas

### Códigos de Estado HTTP

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Error de validación
- **401**: No autorizado (token inválido/faltante)
- **403**: Acceso denegado (permisos insuficientes)
- **404**: Recurso no encontrado
- **409**: Conflicto (email duplicado, etc.)
- **500**: Error interno del servidor

### Estructura de Respuesta

```json
{
  "status": "success|error",
  "message": "Descripción del resultado",
  "error": "Código de error (solo en caso de error)",
  "data": {
    // Datos específicos de la respuesta
  }
}
```

## 🔍 Debugging

### Verificar Estado del Servidor

```bash
# Verificar que el servidor esté ejecutándose
curl http://localhost:3001/api/auth/verify

# Verificar datos en la base de datos
node scripts/check-data.js
```

### Logs del Servidor

- Los logs aparecen en la consola donde ejecutaste `npm run dev`
- Busca errores de validación, autenticación o base de datos

### Problemas Comunes

1. **404 en todas las rutas**: Servidor no reiniciado después de cambios
2. **401 en rutas autenticadas**: Token expirado o faltante
3. **403 en rutas CONANP**: Usuario con rol incorrecto
4. **400 en creación**: Datos de validación incorrectos

## 📝 Notas de Desarrollo

### Variables de Entorno

- `JWT_SECRET`: Secreto para firmar tokens
- `JWT_EXPIRES_IN`: Tiempo de expiración (default: 24h)
- `DB_URL`: URL de conexión a PostgreSQL

### Middleware Activo

- **Autenticación**: JWT en todas las rutas protegidas
- **Autorización**: Roles CONANP vs Prestador
- **Validación**: express-validator en todos los endpoints
- **Sanitización**: Prevención de XSS
- **Rate Limiting**: 100 requests/minuto

### Base de Datos

- **Timezone**: America/Mexico_City
- **UUIDs**: Para todos los IDs
- **Timestamps**: created_at, updated_at automáticos
- **Soft Delete**: Usuarios se desactivan, no se eliminan

¡Happy Testing! 🚀

