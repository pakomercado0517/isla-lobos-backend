# 📮 Guía de Uso - Postman Collection

## 🚀 Configuración Inicial

### 1. Importar la Colección

1. Abre Postman
2. Haz clic en **Import**
3. Selecciona el archivo `Isla-Lobos-API.postman_collection.json`
4. La colección se importará automáticamente

### 2. Importar el Environment

1. En Postman, ve a **Environments**
2. Haz clic en **Import**
3. Selecciona el archivo `Isla-Lobos-Environment.postman_environment.json`
4. Selecciona el environment **"Isla Lobos Environment"** en el dropdown superior derecho

### 3. Configurar Variables

Las siguientes variables están preconfiguradas:

- `base_url`: `http://localhost:3001/api`
- `auth_token`: Se llena automáticamente al hacer login
- `user_id`: Para pruebas específicas de usuarios
- `admin_email`: `admin@conanp.gob.mx`
- `admin_password`: `Admin123!`
- `prestador_email`: `juan.perez@ejemplo.com`
- `prestador_password`: `Prestador123!`
- `invitation_code`: `PRESTADOR001`

## 🔐 Flujo de Autenticación

### Paso 1: Login

1. Ve a **🔐 Autenticación > Login**
2. Haz clic en **Send**
3. El token se guardará automáticamente en la variable `auth_token`

### Paso 2: Verificar Token

1. Ve a **🔐 Autenticación > Verificar Token**
2. Haz clic en **Send**
3. Deberías recibir información del usuario autenticado

## 👥 Pruebas de Usuarios

### Para Usuarios CONANP (Admin):

1. **Login** con `admin@conanp.gob.mx`
2. **Obtener Todos los Usuarios** - Ver lista completa
3. **Obtener Estadísticas** - Ver métricas del sistema
4. **Crear Usuario** - Crear nuevo prestador
5. **Actualizar Usuario** - Modificar datos de usuario
6. **Desactivar/Activar Usuario** - Gestionar estado

### Para Usuarios Prestador:

1. **Login** con `juan.perez@ejemplo.com`
2. **Obtener Perfil** - Ver información personal
3. **Actualizar Perfil Personal** - Modificar nombre/teléfono
4. **Cambiar Contraseña** - Actualizar contraseña

## 🧪 Casos de Prueba Recomendados

### 1. Flujo Completo de Autenticación

```
1. Login Admin → 2. Verificar Token → 3. Obtener Perfil → 4. Logout
```

### 2. Gestión de Usuarios (Solo CONANP)

```
1. Login Admin → 2. Obtener Estadísticas → 3. Crear Usuario →
4. Obtener Usuario por ID → 5. Actualizar Usuario → 6. Desactivar Usuario
```

### 3. Gestión de Perfil Personal

```
1. Login Prestador → 2. Obtener Perfil → 3. Actualizar Perfil →
4. Cambiar Contraseña → 5. Login con Nueva Contraseña
```

### 4. Pruebas de Validación

```
1. Login con credenciales incorrectas
2. Crear usuario con email duplicado
3. Acceder a rutas sin token
4. Acceder a rutas CONANP con usuario prestador
```

## 📊 Respuestas Esperadas

### Login Exitoso (200)

```json
{
  "status": "success",
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "nombre": "Administrador CONANP",
      "email": "admin@conanp.gob.mx",
      "telefono": "+52 55 1234 5678",
      "rol": "conanp",
      "activo": true
    },
    "token": "jwt_token_here"
  }
}
```

### Lista de Usuarios (200)

```json
{
  "status": "success",
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "users": [...],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### Estadísticas (200)

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

## 🚨 Códigos de Error Comunes

### 401 - No Autorizado

```json
{
  "status": "error",
  "message": "Token de acceso requerido",
  "error": "UNAUTHORIZED"
}
```

### 403 - Acceso Denegado

```json
{
  "status": "error",
  "message": "Acceso denegado. Se requiere rol de CONANP",
  "error": "FORBIDDEN"
}
```

### 400 - Error de Validación

```json
{
  "status": "error",
  "message": "Errores de validación encontrados",
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

### 404 - No Encontrado

```json
{
  "status": "error",
  "message": "Usuario no encontrado",
  "error": "USER_NOT_FOUND"
}
```

## 🔧 Tips y Trucos

### 1. Auto-guardado de Token

- Los requests de login tienen scripts que guardan automáticamente el token
- No necesitas copiar/pegar el token manualmente

### 2. Variables Dinámicas

- Usa `{{variable_name}}` para referenciar variables
- Ejemplo: `{{base_url}}/usuarios/{{user_id}}`

### 3. Tests Automáticos

- Agrega tests en la pestaña **Tests** para validar respuestas
- Ejemplo: `pm.test("Status code is 200", () => pm.response.to.have.status(200));`

### 4. Pre-request Scripts

- Usa scripts en **Pre-request Script** para preparar datos
- Ejemplo: Generar UUIDs, timestamps, etc.

### 5. Organización

- Usa carpetas para agrupar requests relacionados
- Agrega descripciones a cada request
- Usa nombres descriptivos para las requests

## 📝 Notas Importantes

1. **Servidor**: Asegúrate de que el servidor esté ejecutándose en `http://localhost:3001`
2. **Base de Datos**: Los seeders deben estar ejecutados para tener datos de prueba
3. **Token Expiration**: Los tokens JWT expiran en 24 horas por defecto
4. **Rate Limiting**: Hay límite de 100 requests por minuto
5. **CORS**: Configurado para `http://localhost:3000` (frontend)

## 🆘 Solución de Problemas

### Error de Conexión

- Verifica que el servidor esté ejecutándose
- Confirma que el puerto 3001 esté disponible
- Revisa la URL base en las variables de entorno

### Token Inválido

- Haz login nuevamente para obtener un token fresco
- Verifica que el token no haya expirado
- Confirma que el header Authorization esté configurado

### Error 404 en Rutas

- Verifica que las rutas estén correctamente implementadas
- Confirma que el servidor se haya reiniciado después de cambios
- Revisa los logs del servidor para errores

### Error de Validación

- Revisa el formato de los datos enviados
- Confirma que todos los campos requeridos estén presentes
- Verifica que los tipos de datos sean correctos

¡Disfruta probando la API! 🚀

