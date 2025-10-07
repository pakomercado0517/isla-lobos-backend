import { body, param, query } from "express-validator";

/**
 * Validaciones para el UserController
 */

// Validación para obtener todos los usuarios
export const getAllUsersValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),
  query("rol")
    .optional()
    .isIn(["conanp", "prestador"])
    .withMessage("El rol debe ser 'conanp' o 'prestador'"),
  query("activo")
    .optional()
    .isBoolean()
    .withMessage("El campo activo debe ser true o false"),
];

// Validación para obtener usuario por ID
export const getUserByIdValidation = [
  param("userId")
    .isUUID()
    .withMessage("El ID del usuario debe ser un UUID válido"),
];

// Validación para crear usuario
export const createUserValidation = [
  body("nombre")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),
  body("email")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),
  body("telefono")
    .optional()
    .trim()
    .matches(/^(\+52\s?)?[0-9]{10}$/)
    .withMessage("El teléfono debe ser un número mexicano válido (10 dígitos)"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("La contraseña debe tener entre 8 y 128 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial"
    ),
  body("rol")
    .isIn(["conanp", "prestador"])
    .withMessage("El rol debe ser 'conanp' o 'prestador'"),
  body("activo")
    .optional()
    .isBoolean()
    .withMessage("El campo activo debe ser true o false"),
];

// Validación para actualizar usuario
export const updateUserValidation = [
  param("userId")
    .isUUID()
    .withMessage("El ID del usuario debe ser un UUID válido"),
  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El email no puede exceder 255 caracteres"),
  body("telefono")
    .optional()
    .trim()
    .matches(/^(\+52\s?)?[0-9]{10}$/)
    .withMessage("El teléfono debe ser un número mexicano válido (10 dígitos)"),
  body("rol")
    .optional()
    .isIn(["conanp", "prestador"])
    .withMessage("El rol debe ser 'conanp' o 'prestador'"),
  body("activo")
    .optional()
    .isBoolean()
    .withMessage("El campo activo debe ser true o false"),
];

// Validación para eliminar usuario
export const deleteUserValidation = [
  param("userId")
    .isUUID()
    .withMessage("El ID del usuario debe ser un UUID válido"),
];

// Validación para activar usuario
export const activateUserValidation = [
  param("userId")
    .isUUID()
    .withMessage("El ID del usuario debe ser un UUID válido"),
];

// Validación para actualizar perfil
export const updateProfileValidation = [
  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),
  body("telefono")
    .optional()
    .trim()
    .matches(/^(\+52\s?)?[0-9]{10}$/)
    .withMessage("El teléfono debe ser un número mexicano válido (10 dígitos)"),
  body("avatar_url")
    .optional()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage(
      "La URL del avatar debe ser una URL válida con protocolo http o https"
    )
    .isLength({ max: 500 })
    .withMessage("La URL del avatar no puede exceder 500 caracteres"),
];

// Validación para obtener estadísticas
export const getUserStatsValidation = [
  // No se requieren validaciones específicas para estadísticas
];
