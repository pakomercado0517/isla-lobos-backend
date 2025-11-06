import { body, param, query } from "express-validator";

/**
 * Validaciones para el sistema de autenticación
 */

// Validaciones para login
export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .withMessage("Formato de email inválido"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    )
    .optional({ nullable: true }),
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

  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("La contraseña debe tener entre 6 y 128 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número"
    ),

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

// Validaciones para verificación de token
export const verifyTokenValidation = [
  // No se necesitan validaciones específicas ya que el token viene en el header
];

// Validaciones para renovación de token
export const refreshTokenValidation = [
  // No se necesitan validaciones específicas ya que el token viene en el header
];

// Validaciones para logout
export const logoutValidation = [
  // No se necesitan validaciones específicas ya que el token viene en el header
];

// Validaciones para obtener perfil
export const getProfileValidation = [
  // No se necesitan validaciones específicas ya que el token viene en el header
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

// Validaciones para parámetros de usuario
export const userParamValidation = [
  param("userId")
    .isUUID()
    .withMessage("El ID del usuario debe ser un UUID válido"),
];

// Validaciones para query parameters
export const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entero entre 1 y 100")
    .toInt(),
];

// Validaciones para búsqueda
export const searchValidation = [
  query("search")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("El término de búsqueda debe tener entre 2 y 100 caracteres")
    .trim()
    .escape(),
];

// Validaciones para filtros de fecha
export const dateFilterValidation = [
  query("fecha_inicio")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha de inicio debe tener formato YYYY-MM-DD"),

  query("fecha_fin")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha de fin debe tener formato YYYY-MM-DD")
    .custom((value, { req }) => {
      if (req.query && req.query["fecha_inicio"] && value) {
        const fechaInicio = String(req.query["fecha_inicio"]).split('T')[0];
        const fechaFin = String(value).split('T')[0];
        // Comparar strings YYYY-MM-DD directamente (son comparables lexicográficamente)
        if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
          throw new Error(
            "La fecha de fin debe ser posterior a la fecha de inicio"
          );
        }
      }
      return true;
    }),
];

// Validaciones para roles
export const roleValidation = [
  body("rol")
    .isIn(["conanp", "prestador"])
    .withMessage("El rol debe ser 'conanp' o 'prestador'"),
];

// Validaciones para estado de usuario
export const userStatusValidation = [
  body("activo")
    .isBoolean()
    .withMessage("El estado activo debe ser un valor booleano")
    .toBoolean(),
];

// Validaciones personalizadas para el sistema Isla Lobos
export const islaLobosValidations = {
  // Validar que el email no esté en uso (se usará en el controlador)
  emailNotInUse: (_value: string) => {
    // Esta validación se implementará en el controlador
    return true;
  },

  // Validar que el código de invitación sea válido (se usará en el controlador)
  validInvitationCode: (_value: string) => {
    // Esta validación se implementará en el controlador
    return true;
  },

  // Validar formato de teléfono mexicano
  mexicanPhone: (value: string) => {
    const phoneRegex = /^(\+52|52)?[1-9]\d{9}$/;
    return phoneRegex.test(value);
  },

  // Validar que la contraseña no sea común
  strongPassword: (value: string) => {
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
    return !commonPasswords.includes(value.toLowerCase());
  },
};
