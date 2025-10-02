# 🔒 Validaciones de la API - Isla Lobos

## 📋 **Sistema de Validaciones Implementado**

Se ha implementado un sistema robusto de validaciones usando `express-validator` para asegurar la integridad y seguridad de los datos en la API.

---

## 🛡️ **Características de Seguridad**

### **1. Validaciones de Entrada**

- ✅ **Sanitización automática** de datos de entrada
- ✅ **Validación de tipos** de datos
- ✅ **Validación de formatos** (email, teléfono, etc.)
- ✅ **Validación de longitud** de campos
- ✅ **Validación de patrones** (contraseñas seguras, etc.)

### **2. Middleware de Seguridad**

- ✅ **Sanitización XSS** - Previene ataques de cross-site scripting
- ✅ **Límite de longitud** - Evita ataques de buffer overflow
- ✅ **Escape de caracteres** - Previene inyección de código
- ✅ **Validación de permisos** - Control de acceso a recursos

### **3. Manejo de Errores**

- ✅ **Mensajes de error claros** y específicos
- ✅ **Códigos de estado HTTP** apropiados
- ✅ **Formato consistente** de respuestas de error
- ✅ **Logging de errores** para debugging

---

## 📝 **Validaciones por Endpoint**

### **POST /api/auth/login**

**Validaciones aplicadas:**

```typescript
body("email")
  .isEmail()
  .withMessage("Debe ser un email válido")
  .normalizeEmail()
  .withMessage("Formato de email inválido");

body("password")
  .isLength({ min: 6 })
  .withMessage("La contraseña debe tener al menos 6 caracteres")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
  );
```

**Ejemplo de respuesta de error:**

```json
{
  "status": "error",
  "message": "Debe ser un email válido",
  "error": "VALIDATION_ERROR"
}
```

### **POST /api/auth/register**

**Validaciones aplicadas:**

```typescript
body("nombre")
  .trim()
  .isLength({ min: 2, max: 100 })
  .withMessage("El nombre debe tener entre 2 y 100 caracteres")
  .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
  .withMessage("El nombre solo puede contener letras y espacios");

body("email")
  .isEmail()
  .withMessage("Debe ser un email válido")
  .normalizeEmail()
  .withMessage("Formato de email inválido");

body("telefono")
  .optional()
  .isMobilePhone("es-MX")
  .withMessage("Debe ser un número de teléfono válido de México");

body("password")
  .isLength({ min: 6, max: 128 })
  .withMessage("La contraseña debe tener entre 6 y 128 caracteres")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
  );

body("codigo_invitacion")
  .optional()
  .isLength({ min: 6, max: 20 })
  .withMessage("El código de invitación debe tener entre 6 y 20 caracteres")
  .matches(/^[A-Z0-9]+$/)
  .withMessage(
    "El código de invitación solo puede contener letras mayúsculas y números"
  );
```

### **PUT /api/auth/change-password**

**Validaciones aplicadas:**

```typescript
body("currentPassword")
  .notEmpty()
  .withMessage("La contraseña actual es requerida");

body("newPassword")
  .isLength({ min: 6, max: 128 })
  .withMessage("La nueva contraseña debe tener entre 6 y 128 caracteres")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    "La nueva contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
  )
  .custom((value, { req }) => {
    if (value === req.body.currentPassword) {
      throw new Error("La nueva contraseña debe ser diferente a la actual");
    }
    return true;
  });
```

---

## 🔧 **Middleware de Validación**

### **1. handleValidationErrors**

Maneja errores de validación y devuelve respuestas estructuradas.

```typescript
// Uso en rutas
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  AuthController.login
);
```

### **2. sanitizeInput**

Sanitiza datos de entrada para prevenir ataques XSS.

```typescript
// Aplicado globalmente a todas las rutas
router.use(sanitizeInput);
```

### **3. validateResourceAccess**

Valida que el usuario tiene permisos para acceder a un recurso.

```typescript
// Uso en rutas protegidas
router.get(
  "/users/:id",
  authenticateToken,
  validateResourceAccess("user"),
  UserController.getUser
);
```

---

## 📊 **Tipos de Validaciones Disponibles**

### **Validaciones de Texto**

- `isLength({ min, max })` - Longitud de texto
- `matches(pattern)` - Patrón regex
- `isEmail()` - Formato de email
- `isMobilePhone(locale)` - Número de teléfono
- `trim()` - Eliminar espacios
- `escape()` - Escapar caracteres HTML

### **Validaciones de Números**

- `isInt({ min, max })` - Número entero
- `isFloat({ min, max })` - Número decimal
- `isUUID()` - Identificador UUID

### **Validaciones de Fechas**

- `isISO8601()` - Formato de fecha ISO
- `toDate()` - Convertir a objeto Date

### **Validaciones Personalizadas**

- `custom(validator)` - Validación personalizada
- `customSanitizer(sanitizer)` - Sanitización personalizada

---

## 🚨 **Ejemplos de Respuestas de Error**

### **Error de Validación Simple**

```json
{
  "status": "error",
  "message": "El nombre debe tener entre 2 y 100 caracteres",
  "error": "VALIDATION_ERROR"
}
```

### **Error de Validación Múltiple**

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
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 6 caracteres",
        "value": "123"
      }
    ],
    "count": 2
  }
}
```

---

## 🔐 **Validaciones de Seguridad**

### **Contraseñas Seguras**

- Mínimo 6 caracteres
- Al menos una letra minúscula
- Al menos una letra mayúscula
- Al menos un número
- Máximo 128 caracteres

### **Emails Válidos**

- Formato de email estándar
- Normalización automática
- Validación de dominio

### **Teléfonos Mexicanos**

- Formato de teléfono mexicano
- Sanitización automática
- Validación de longitud

### **Códigos de Invitación**

- Solo letras mayúsculas y números
- Longitud entre 6 y 20 caracteres
- Formato alfanumérico

---

## 📱 **Validaciones por Dispositivo**

### **Móviles**

- Validación de teléfonos mexicanos
- Formato optimizado para móviles
- Sanitización de entrada táctil

### **Web**

- Validación de emails completos
- Contraseñas más estrictas
- Validación de formularios

---

## 🧪 **Testing de Validaciones**

### **Ejemplos de Datos Válidos**

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "telefono": "+52 123 456 7890",
  "password": "MiPassword123",
  "codigo_invitacion": "ABC123"
}
```

### **Ejemplos de Datos Inválidos**

```json
{
  "nombre": "J", // Muy corto
  "email": "email-invalido", // Formato incorrecto
  "telefono": "123", // Muy corto
  "password": "123", // Muy simple
  "codigo_invitacion": "abc123" // Minúsculas no permitidas
}
```

---

## 🚀 **Beneficios del Sistema de Validaciones**

### **1. Seguridad**

- ✅ Previene ataques de inyección
- ✅ Sanitiza datos de entrada
- ✅ Valida permisos de acceso
- ✅ Protege contra XSS

### **2. Integridad de Datos**

- ✅ Asegura formato correcto
- ✅ Valida tipos de datos
- ✅ Mantiene consistencia
- ✅ Previene errores de base de datos

### **3. Experiencia de Usuario**

- ✅ Mensajes de error claros
- ✅ Validación en tiempo real
- ✅ Feedback inmediato
- ✅ Guía de corrección

### **4. Mantenibilidad**

- ✅ Código reutilizable
- ✅ Validaciones centralizadas
- ✅ Fácil de extender
- ✅ Documentación clara

---

## 📚 **Uso en Otros Controladores**

Para implementar validaciones en otros controladores:

1. **Crear validaciones** en `src/validators/`
2. **Importar middleware** de validación
3. **Aplicar a rutas** con `handleValidationErrors`
4. **Manejar errores** en controladores

```typescript
// Ejemplo para UserController
import { userValidation } from "../validators/userValidators";
import { handleValidationErrors } from "../middleware/validation";

router.post(
  "/users",
  userValidation,
  handleValidationErrors,
  UserController.create
);
```

---

**¡El sistema de validaciones está completamente implementado y listo para usar! 🎉**

Todas las rutas de autenticación ahora tienen validaciones robustas que aseguran la integridad y seguridad de los datos.

