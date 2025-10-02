# 📋 Documentación API - UserController

## Descripción
Controlador para la gestión completa de usuarios del sistema Isla Lobos. Incluye operaciones CRUD, gestión de roles, perfil de usuario y estadísticas.

## 🔐 Autenticación
Todas las rutas requieren autenticación JWT. Algunas rutas requieren rol específico de CONANP.

## 📍 Endpoints

### 1. Obtener Todos los Usuarios
**GET** `/api/usuarios`

**Permisos:** Solo CONANP

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `rol` (opcional): Filtrar por rol (`conanp` | `prestador`)
- `activo` (opcional): Filtrar por estado (`true` | `false`)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Ejemplo de Request:**
```bash
curl -X GET "http://localhost:3001/api/usuarios?page=1&limit=10&rol=prestador&activo=true" \
  -H "Authorization: Bearer <token>"
```

**Ejemplo de Response:**
```json
{
  "status": "success",
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "users": [
      {
        "id": "uuid",
        "nombre": "Juan Pérez",
        "email": "juan.perez@ejemplo.com",
        "telefono": "+52 229 123 4567",
        "rol": "prestador",
        "activo": true,
        "createdAt": "2025-09-26T03:11:54.764Z",
        "updatedAt": "2025-09-26T03:11:54.764Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 2. Obtener Usuario por ID
**GET** `/api/usuarios/:userId`

**Permisos:** Solo CONANP

**Path Parameters:**
- `userId`: UUID del usuario

**Ejemplo de Request:**
```bash
curl -X GET "http://localhost:3001/api/usuarios/uuid-del-usuario" \
  -H "Authorization: Bearer <token>"
```

**Ejemplo de Response:**
```json
{
  "status": "success",
  "message": "Usuario obtenido exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "email": "juan.perez@ejemplo.com",
      "telefono": "+52 229 123 4567",
      "rol": "prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 3. Crear Usuario
**POST** `/api/usuarios`

**Permisos:** Solo CONANP

**Body:**
```json
{
  "nombre": "Nuevo Usuario",
  "email": "nuevo@ejemplo.com",
  "telefono": "2291234567",
  "password": "Password123!",
  "rol": "prestador",
  "activo": true
}
```

**Validaciones:**
- `nombre`: 2-100 caracteres, solo letras y espacios
- `email`: Email válido, máximo 255 caracteres
- `telefono`: Número mexicano válido (10 dígitos)
- `password`: 8-128 caracteres, debe contener minúscula, mayúscula, número y carácter especial
- `rol`: `conanp` o `prestador`
- `activo`: Boolean (opcional, default: true)

**Ejemplo de Request:**
```bash
curl -X POST "http://localhost:3001/api/usuarios" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nuevo Usuario",
    "email": "nuevo@ejemplo.com",
    "telefono": "2291234567",
    "password": "Password123!",
    "rol": "prestador"
  }'
```

**Ejemplo de Response:**
```json
{
  "status": "success",
  "message": "Usuario creado exitosamente",
  "data": {
    "user": {
      "id": "nuevo-uuid",
      "nombre": "Nuevo Usuario",
      "email": "nuevo@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 4. Actualizar Usuario
**PUT** `/api/usuarios/:userId`

**Permisos:** Solo CONANP

**Path Parameters:**
- `userId`: UUID del usuario

**Body:** (todos los campos son opcionales)
```json
{
  "nombre": "Nombre Actualizado",
  "email": "nuevo@ejemplo.com",
  "telefono": "2299876543",
  "rol": "conanp",
  "activo": false
}
```

**Ejemplo de Request:**
```bash
curl -X PUT "http://localhost:3001/api/usuarios/uuid-del-usuario" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Nombre Actualizado",
    "activo": false
  }'
```

### 5. Eliminar Usuario (Soft Delete)
**DELETE** `/api/usuarios/:userId`

**Permisos:** Solo CONANP

**Path Parameters:**
- `userId`: UUID del usuario

**Ejemplo de Request:**
```bash
curl -X DELETE "http://localhost:3001/api/usuarios/uuid-del-usuario" \
  -H "Authorization: Bearer <token>"
```

**Ejemplo de Response:**
```json
{
  "status": "success",
  "message": "Usuario desactivado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Usuario",
      "email": "usuario@ejemplo.com",
      "telefono": "2291234567",
      "rol": "prestador",
      "activo": false,
      "createdAt": "2025-09-26T03:11:54.764Z",
      "updatedAt": "2025-09-26T03:11:54.764Z"
    }
  }
}
```

### 6. Activar Usuario
**PATCH** `/api/usuarios/:userId/activate`

**Permisos:** Solo CONANP

**Path Parameters:**
- `userId`: UUID del usuario

**Ejemplo de Request:**
```bash
curl -X PATCH "http://localhost:3001/api/usuarios/uuid-del-usuario/activate" \
  -H "Authorization: Bearer <token>"
```

### 7. Actualizar Perfil Personal
**PUT** `/api/usuarios/profile/update`

**Permisos:** Usuario autenticado (cualquier rol)

**Body:**
```json
{
  "nombre": "Mi Nombre Actualizado",
  "telefono": "2291234567"
}
```

**Validaciones:**
- `nombre`: 2-100 caracteres, solo letras y espacios
- `telefono`: Número mexicano válido (10 dígitos)

**Ejemplo de Request:**
```bash
curl -X PUT "http://localhost:3001/api/usuarios/profile/update" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Nombre Actualizado",
    "telefono": "2291234567"
  }'
```

### 8. Obtener Estadísticas de Usuarios
**GET** `/api/usuarios/stats`

**Permisos:** Solo CONANP

**Ejemplo de Request:**
```bash
curl -X GET "http://localhost:3001/api/usuarios/stats" \
  -H "Authorization: Bearer <token>"
```

**Ejemplo de Response:**
```json
{
  "status": "success",
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "stats": {
      "total": 5,
      "activos": 4,
      "inactivos": 1,
      "conanp": 1,
      "prestadores": 4
    }
  }
}
```

## 🚨 Códigos de Error

### Errores de Validación (400)
```json
{
  "status": "error",
  "message": "Errores de validación",
  "error": "VALIDATION_ERROR",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Debe ser un email válido",
        "value": "email-invalido"
      }
    ]
  }
}
```

### Usuario No Encontrado (404)
```json
{
  "status": "error",
  "message": "Usuario no encontrado",
  "error": "USER_NOT_FOUND"
}
```

### Email Ya Existe (409)
```json
{
  "status": "error",
  "message": "El email ya está registrado",
  "error": "EMAIL_ALREADY_EXISTS"
}
```

### Acceso No Autorizado (401)
```json
{
  "status": "error",
  "message": "Token de acceso requerido",
  "error": "UNAUTHORIZED"
}
```

### Permisos Insuficientes (403)
```json
{
  "status": "error",
  "message": "Acceso denegado. Se requiere rol de CONANP",
  "error": "FORBIDDEN"
}
```

### Error Interno (500)
```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## 🔒 Seguridad

### Validaciones Implementadas:
- **Sanitización de entrada**: Previene XSS
- **Validación de UUID**: Para parámetros de ruta
- **Validación de email**: Formato y unicidad
- **Validación de teléfono**: Formato mexicano
- **Validación de contraseña**: Complejidad requerida
- **Validación de roles**: Solo roles permitidos

### Permisos por Endpoint:
- **CONANP**: Acceso completo a gestión de usuarios
- **Prestador**: Solo puede actualizar su propio perfil
- **Autenticación**: Requerida para todos los endpoints

## 📝 Notas Importantes

1. **Soft Delete**: Los usuarios no se eliminan físicamente, se desactivan
2. **Contraseñas**: Nunca se devuelven en las respuestas
3. **Paginación**: Implementada para listados grandes
4. **Filtros**: Disponibles para rol y estado activo
5. **Estadísticas**: Solo disponibles para CONANP
6. **Perfil**: Los usuarios solo pueden actualizar nombre y teléfono

## 🧪 Testing

### Credenciales de Prueba:
- **CONANP**: `admin@conanp.gob.mx` / `Admin123!`
- **Prestador**: `juan.perez@ejemplo.com` / `Prestador123!`

### Flujo de Prueba Recomendado:
1. Login con usuario CONANP
2. Obtener lista de usuarios
3. Crear nuevo usuario
4. Actualizar usuario creado
5. Obtener estadísticas
6. Login con usuario prestador
7. Actualizar perfil personal
