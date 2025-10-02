# Documentación de API de Autenticación - Isla Lobos

## Descripción General

Esta documentación describe los endpoints de autenticación disponibles en el sistema Isla Lobos. Todos los endpoints están disponibles bajo la ruta base `/api/auth`.

## Endpoints Disponibles

### 1. Login de Usuario

**POST** `/api/auth/login`

Inicia sesión de un usuario en el sistema.

#### Parámetros Requeridos:

```json
{
  "email": "string",
  "password": "string"
}
```

#### Ejemplo de Request:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@conanp.gob.mx",
    "password": "Admin123!"
  }'
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "string",
      "email": "string",
      "telefono": "string",
      "rol": "conanp|prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### Respuesta de Error (401):

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

---

### 2. Registro de Usuario

**POST** `/api/auth/register`

Registra un nuevo usuario en el sistema usando un código de invitación.

#### Parámetros Requeridos:

```json
{
  "nombre": "string",
  "email": "string",
  "password": "string",
  "telefono": "string",
  "codigo_invitacion": "string"
}
```

#### Ejemplo de Request:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "MiPassword123!",
    "telefono": "2291234567",
    "codigo_invitacion": "PRESTADOR001"
  }'
```

#### Respuesta Exitosa (201):

```json
{
  "status": "success",
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "string",
      "email": "string",
      "telefono": "string",
      "rol": "prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### Respuesta de Error (400):

```json
{
  "status": "error",
  "message": "Errores de validación encontrados",
  "error": "VALIDATION_ERROR",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "El email ya está en uso",
        "value": "juan@ejemplo.com"
      }
    ],
    "count": 1
  }
}
```

---

### 3. Verificar Token

**GET** `/api/auth/verify`

Verifica si un token JWT es válido y devuelve la información del usuario.

#### Headers Requeridos:

```
Authorization: Bearer <jwt_token>
```

#### Ejemplo de Request:

```bash
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Token válido",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "string",
      "email": "string",
      "telefono": "string",
      "rol": "conanp|prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    }
  }
}
```

#### Respuesta de Error (401):

```json
{
  "status": "error",
  "message": "Token inválido o expirado"
}
```

---

### 4. Refrescar Token

**POST** `/api/auth/refresh`

Genera un nuevo token JWT para el usuario autenticado.

#### Headers Requeridos:

```
Authorization: Bearer <jwt_token>
```

#### Ejemplo de Request:

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Token refrescado exitosamente",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

---

### 5. Cerrar Sesión

**POST** `/api/auth/logout`

Cierra la sesión del usuario (invalida el token).

#### Headers Requeridos:

```
Authorization: Bearer <jwt_token>
```

#### Ejemplo de Request:

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Sesión cerrada exitosamente"
}
```

---

### 6. Cambiar Contraseña

**PUT** `/api/auth/change-password`

Permite al usuario cambiar su contraseña.

#### Headers Requeridos:

```
Authorization: Bearer <jwt_token>
```

#### Parámetros Requeridos:

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

#### Ejemplo de Request:

```bash
curl -X PUT http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "MiPassword123!",
    "newPassword": "MiNuevoPassword456!"
  }'
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Contraseña actualizada exitosamente"
}
```

#### Respuesta de Error (400):

```json
{
  "status": "error",
  "message": "La contraseña actual es incorrecta"
}
```

---

### 7. Obtener Perfil

**GET** `/api/auth/profile`

Obtiene la información del perfil del usuario autenticado.

#### Headers Requeridos:

```
Authorization: Bearer <jwt_token>
```

#### Ejemplo de Request:

```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Perfil obtenido exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "string",
      "email": "string",
      "telefono": "string",
      "rol": "conanp|prestador",
      "activo": true,
      "createdAt": "2025-09-26T03:11:54.535Z",
      "updatedAt": "2025-09-26T03:11:54.535Z"
    }
  }
}
```

---

## Códigos de Estado HTTP

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Error de validación o datos incorrectos
- **401**: No autorizado (credenciales inválidas o token expirado)
- **403**: Prohibido (permisos insuficientes)
- **404**: Recurso no encontrado
- **500**: Error interno del servidor

## Validaciones Implementadas

### Email

- Formato válido de email
- Debe ser único en el sistema

### Contraseña

- Mínimo 8 caracteres
- Debe contener al menos una letra mayúscula
- Debe contener al menos una letra minúscula
- Debe contener al menos un número
- Debe contener al menos un carácter especial

### Teléfono

- Formato mexicano válido (10 dígitos)
- Debe comenzar con 2, 3, 4, 5, 6, 7, 8 o 9

### Código de Invitación

- Debe existir en el sistema
- No debe estar expirado
- No debe haber sido usado previamente

## Credenciales de Prueba

### Administrador CONANP

- **Email**: `admin@conanp.gob.mx`
- **Contraseña**: `Admin123!`

### Prestadores de Servicio

- **Email**: `juan.perez@ejemplo.com`
- **Contraseña**: `Prestador123!`

- **Email**: `maria.gonzalez@ejemplo.com`
- **Contraseña**: `Prestador123!`

- **Email**: `carlos.rodriguez@ejemplo.com`
- **Contraseña**: `Prestador123!`

## Códigos de Invitación Válidos

- `PRESTADOR001` - Para prestadores de servicio
- `PRESTADOR002` - Para prestadores de servicio
- `CONANP001` - Para administradores CONANP

### 8. Solicitar Recuperación de Contraseña

**POST** `/api/auth/forgot-password`

Solicita un enlace de recuperación de contraseña para un usuario.

#### Parámetros Requeridos:

```json
{
  "email": "string"
}
```

#### Ejemplo de Request:

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com"
  }'
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña"
}
```

#### Respuesta de Error (400):

```json
{
  "status": "error",
  "message": "Debe ser un email válido",
  "error": "VALIDATION_ERROR"
}
```

### 9. Resetear Contraseña

**POST** `/api/auth/reset-password`

Resetea la contraseña de un usuario usando un token de recuperación válido.

#### Parámetros Requeridos:

```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

#### Ejemplo de Request:

```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "newPassword": "NuevaPassword123!",
    "confirmPassword": "NuevaPassword123!"
  }'
```

#### Respuesta Exitosa (200):

```json
{
  "status": "success",
  "message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña"
}
```

#### Respuesta de Error (400):

```json
{
  "status": "error",
  "message": "Token de recuperación inválido o expirado"
}
```

---

## Notas Importantes

1. **Tokens JWT**: Los tokens tienen una duración de 24 horas por defecto
2. **Rate Limiting**: Se aplica límite de 100 requests por hora por IP
3. **Sanitización**: Todas las entradas son sanitizadas para prevenir XSS
4. **Timezone**: Todas las fechas se manejan en zona horaria `America/Mexico_City`
5. **Seguridad**: Las contraseñas se almacenan con hash bcrypt (12 rounds)
6. **Recuperación de Contraseña**: Los tokens de recuperación expiran en 15 minutos
7. **Seguridad de Recuperación**: Por seguridad, siempre se devuelve el mismo mensaje para solicitudes de recuperación
