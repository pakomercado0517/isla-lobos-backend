# 🧪 Guía de Pruebas - Recuperación de Contraseña

## 📋 Descripción

Esta guía te ayudará a probar los nuevos endpoints de recuperación de contraseña implementados en el sistema Isla Lobos.

## 🔧 Configuración Inicial

### 1. Importar Colección de Postman

1. Abre Postman
2. Importa el archivo: `documentation/Isla-Lobos-API.postman_collection.json`
3. Importa el environment: `documentation/Isla-Lobos-Environment.postman_environment.json`

### 2. Verificar Servidor

Asegúrate de que el servidor esté corriendo:

```bash
npm run dev
```

El servidor debe estar disponible en: `http://localhost:3001`

## 🧪 Pruebas Paso a Paso

### **Prueba 1: Solicitar Recuperación de Contraseña**

#### **Endpoint:** `POST /api/auth/forgot-password`

#### **Paso 1.1: Email Existente**

1. En Postman, selecciona "Solicitar Recuperación de Contraseña"
2. En el body, usa un email existente:

```json
{
  "email": "admin@conanp.gob.mx"
}
```

3. Envía la petición
4. **Resultado esperado:**
   - Status: `200 OK`
   - Response:

```json
{
  "status": "success",
  "message": "Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña"
}
```

5. **Revisa la consola del servidor** para ver el token generado:

```
🔑 Token de recuperación para admin@conanp.gob.mx: [TOKEN_AQUI]
⏰ Expira en: [FECHA_EXPIRACION]
```

#### **Paso 1.2: Email No Existente**

1. Cambia el email a uno que no existe:

```json
{
  "email": "noexiste@ejemplo.com"
}
```

2. Envía la petición
3. **Resultado esperado:**
   - Status: `200 OK`
   - **Mismo mensaje** (por seguridad)
   - **No se genera token** en la consola

#### **Paso 1.3: Email Inválido**

1. Usa un email con formato inválido:

```json
{
  "email": "email-invalido"
}
```

2. **Resultado esperado:**
   - Status: `400 Bad Request`
   - Response:

```json
{
  "status": "error",
  "message": "Debe ser un email válido",
  "error": "VALIDATION_ERROR"
}
```

### **Prueba 2: Resetear Contraseña**

#### **Endpoint:** `POST /api/auth/reset-password`

#### **Paso 2.1: Token Válido**

1. Primero, obtén un token válido usando el Paso 1.1
2. Copia el token de la consola del servidor
3. En Postman, selecciona "Resetear Contraseña"
4. Reemplaza `REEMPLAZAR_CON_TOKEN_REAL` con el token copiado:

```json
{
  "token": "78d3c1ac1e3a7095f3e03b8319416d7eef3580b8f6204de575702048c820ede4",
  "newPassword": "NuevaPassword123!",
  "confirmPassword": "NuevaPassword123!"
}
```

5. Envía la petición
6. **Resultado esperado:**
   - Status: `200 OK`
   - Response:

```json
{
  "status": "success",
  "message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña"
}
```

#### **Paso 2.2: Token Inválido**

1. Usa un token que no existe:

```json
{
  "token": "token_invalido_123456789",
  "newPassword": "NuevaPassword123!",
  "confirmPassword": "NuevaPassword123!"
}
```

2. **Resultado esperado:**
   - Status: `400 Bad Request`
   - Response:

```json
{
  "status": "error",
  "message": "Token de recuperación inválido o expirado"
}
```

#### **Paso 2.3: Token Expirado**

1. Espera 15 minutos después de generar un token
2. Intenta usar el token expirado
3. **Resultado esperado:**
   - Status: `400 Bad Request`
   - Response:

```json
{
  "status": "error",
  "message": "Token de recuperación inválido o expirado"
}
```

#### **Paso 2.4: Contraseñas No Coinciden**

1. Usa un token válido pero con contraseñas diferentes:

```json
{
  "token": "[TOKEN_VALIDO]",
  "newPassword": "Password123!",
  "confirmPassword": "Password456!"
}
```

2. **Resultado esperado:**
   - Status: `400 Bad Request`
   - Response:

```json
{
  "status": "error",
  "message": "Las contraseñas no coinciden",
  "error": "VALIDATION_ERROR"
}
```

#### **Paso 2.5: Contraseña Débil**

1. Usa una contraseña común:

```json
{
  "token": "[TOKEN_VALIDO]",
  "newPassword": "password",
  "confirmPassword": "password"
}
```

2. **Resultado esperado:**
   - Status: `400 Bad Request`
   - Response:

```json
{
  "status": "error",
  "message": "La contraseña es muy común, elige una más segura",
  "error": "VALIDATION_ERROR"
}
```

### **Prueba 3: Verificar Cambio de Contraseña**

#### **Paso 3.1: Login con Nueva Contraseña**

1. Después de resetear la contraseña exitosamente
2. Intenta hacer login con la nueva contraseña:

```json
{
  "email": "admin@conanp.gob.mx",
  "password": "NuevaPassword123!"
}
```

3. **Resultado esperado:**
   - Status: `200 OK`
   - Login exitoso con token JWT

#### **Paso 3.2: Login con Contraseña Anterior**

1. Intenta hacer login con la contraseña anterior:

```json
{
  "email": "admin@conanp.gob.mx",
  "password": "Admin123!"
}
```

2. **Resultado esperado:**
   - Status: `401 Unauthorized`
   - Response:

```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

## 🔍 Verificaciones Adicionales

### **Base de Datos**

Puedes verificar en la base de datos que:

1. Los campos `password_reset_token` y `password_reset_expires` se llenan correctamente
2. Los campos se limpian después del reset exitoso
3. Los tokens expirados se limpian automáticamente

### **Logs del Servidor**

Revisa la consola para ver:

- Tokens generados
- Fechas de expiración
- Errores de validación
- Operaciones de base de datos

## 📊 Casos de Prueba Resumen

| Caso | Endpoint        | Input                     | Status Esperado | Descripción               |
| ---- | --------------- | ------------------------- | --------------- | ------------------------- |
| 1    | forgot-password | Email válido existente    | 200             | Genera token              |
| 2    | forgot-password | Email válido no existente | 200             | Mismo mensaje (seguridad) |
| 3    | forgot-password | Email inválido            | 400             | Error de validación       |
| 4    | reset-password  | Token válido              | 200             | Reset exitoso             |
| 5    | reset-password  | Token inválido            | 400             | Error de token            |
| 6    | reset-password  | Token expirado            | 400             | Error de expiración       |
| 7    | reset-password  | Contraseñas no coinciden  | 400             | Error de validación       |
| 8    | reset-password  | Contraseña débil          | 400             | Error de seguridad        |
| 9    | login           | Nueva contraseña          | 200             | Login exitoso             |
| 10   | login           | Contraseña anterior       | 401             | Login fallido             |

## 🚨 Notas Importantes

1. **Tokens de 15 minutos**: Los tokens expiran en 15 minutos
2. **Seguridad**: Siempre se devuelve el mismo mensaje para emails existentes/no existentes
3. **Limpieza automática**: Los tokens se limpian después del uso o expiración
4. **Validaciones estrictas**: Las contraseñas deben cumplir criterios de seguridad
5. **Logs de desarrollo**: En desarrollo, los tokens se muestran en la consola

## 🔧 Troubleshooting

### **Error: "Token de recuperación inválido o expirado"**

- Verifica que el token sea exacto (copia completa)
- Asegúrate de que no hayan pasado 15 minutos
- Verifica que el token no se haya usado ya

### **Error: "Debe ser un email válido"**

- Verifica el formato del email
- Asegúrate de que no tenga espacios extra

### **Error: "Las contraseñas no coinciden"**

- Verifica que ambas contraseñas sean idénticas
- Revisa espacios en blanco al inicio/final

### **Error: "La contraseña es muy común"**

- Usa una contraseña más segura
- Incluye mayúsculas, minúsculas y números
- Evita contraseñas como "password", "123456", etc.
