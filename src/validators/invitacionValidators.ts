import { body, param, query } from "express-validator";

/**
 * Validadores para InvitacionController
 *
 * Incluye validaciones para:
 * - Crear invitación
 * - Actualizar invitación
 * - Validar código
 * - Usar invitación
 * - Obtener invitaciones con filtros
 */

// Validaciones para obtener todas las invitaciones
export const getAllInvitacionesValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),
  query("usada")
    .optional()
    .isBoolean()
    .withMessage("El parámetro 'usada' debe ser un valor booleano"),
  query("creada_por")
    .optional()
    .isUUID()
    .withMessage("El ID del creador debe ser un UUID válido"),
];

// Validaciones para obtener invitación por ID
export const getInvitacionByIdValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para crear invitación
export const createInvitacionValidation = [
  body("codigo")
    .notEmpty()
    .withMessage("El código es requerido")
    .isLength({ min: 8, max: 20 })
    .withMessage("El código debe tener entre 8 y 20 caracteres")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("El código solo puede contener letras mayúsculas y números"),
  body("descripcion")
    .optional()
    .isLength({ max: 255 })
    .withMessage("La descripción no puede exceder 255 caracteres"),
  body("fecha_expiracion")
    .optional()
    .isISO8601()
    .withMessage("La fecha de expiración debe estar en formato ISO 8601")
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error("La fecha de expiración debe ser futura");
      }
      return true;
    }),
];

// Validaciones para actualizar invitación
export const updateInvitacionValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
  body("descripcion")
    .optional()
    .isLength({ max: 255 })
    .withMessage("La descripción no puede exceder 255 caracteres"),
  body("fecha_expiracion")
    .optional()
    .isISO8601()
    .withMessage("La fecha de expiración debe estar en formato ISO 8601")
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error("La fecha de expiración debe ser futura");
      }
      return true;
    }),
];

// Validaciones para eliminar invitación
export const deleteInvitacionValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para validar código
export const validarCodigoValidation = [
  body("codigo")
    .notEmpty()
    .withMessage("El código es requerido")
    .isLength({ min: 8, max: 20 })
    .withMessage("El código debe tener entre 8 y 20 caracteres")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("El código solo puede contener letras mayúsculas y números"),
];

// Validaciones para usar invitación
export const usarInvitacionValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Debe ser un email válido")
    .normalizeEmail()
    .withMessage("Formato de email inválido"),
];
