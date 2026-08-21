import { body } from "express-validator";

/**
 * Validaciones para el sistema de autenticación
 */
const passwordRules = () => [
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    )
  .notEmpty()
  .withMessage("La contraseña es requerida"),
]
// Validaciones para login
export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .withMessage("Formato de email inválido"),
  passwordRules
];

// Validaciones para registro
export const registerValidation = [
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
    .withMessage("Formato de email inválido"),

  body("telefono")
    .optional()
    .isMobilePhone("es-MX")
    .withMessage("Debe ser un número de teléfono válido de México")
    .customSanitizer((value) => {
      if (value) {
        // Limpiar y formatear el teléfono
        return value.replace(/\D/g, "");
      }
      return value;
    }),

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
  passwordRules,

  body("codigo_invitacion")
    .optional()
    .isLength({ min: 6, max: 20 })
    .withMessage("El código de invitación debe tener entre 6 y 20 caracteres")
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      "El código de invitación solo puede contener letras mayúsculas y números"
    ),
];

// Validaciones para cambio de contraseña
export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("La contraseña actual es requerida"),

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
    }),
];

// Validaciones para solicitar recuperación de contraseña
export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .withMessage("Formato de email inválido"),
];

// Validaciones para resetear contraseña
export const resetPasswordValidation = [
  body("token")
    .notEmpty()
    .withMessage("El token de recuperación es requerido")
    .isLength({ min: 32, max: 255 })
    .withMessage("El token debe tener entre 32 y 255 caracteres"),

  body("newPassword")
    .isLength({ min: 6, max: 128 })
    .withMessage("La nueva contraseña debe tener entre 6 y 128 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La nueva contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    )
    .custom((value) => {
      // Validar que no sea una contraseña común
      const commonPasswords = [
        "password",
        "123456",
        "123456789",
        "qwerty",
        "abc123",
        "password123",
        "admin",
        "letmein",
        "welcome",
        "monkey",
      ];
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error("La contraseña es muy común, elige una más segura");
      }
      return true;
    }),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Las contraseñas no coinciden");
    }
    return true;
  }),
];
