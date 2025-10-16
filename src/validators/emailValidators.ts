import { body } from "express-validator";
import { TipoEmail, EstadoPuerto } from "../types";

/**
 * Validaciones para el envío de correos electrónicos
 */

// Validación para enviar email individual
export const enviarEmailValidation = [
  body("email")
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email debe tener un formato válido")
    .normalizeEmail(),

  body("asunto")
    .notEmpty()
    .withMessage("El asunto es requerido")
    .isString()
    .withMessage("El asunto debe ser un string")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("El asunto debe tener entre 3 y 200 caracteres"),

  body("mensaje")
    .notEmpty()
    .withMessage("El mensaje es requerido")
    .isString()
    .withMessage("El mensaje debe ser un string")
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage("El mensaje debe tener entre 10 y 10000 caracteres"),

  body("tipo")
    .optional()
    .isIn(Object.values(TipoEmail))
    .withMessage("Tipo de email inválido"),

  body("html")
    .optional()
    .isBoolean()
    .withMessage("El campo html debe ser un booleano"),

  body("datos_adicionales")
    .optional()
    .isObject()
    .withMessage("Los datos adicionales deben ser un objeto"),
];

// Validación para enviar email masivo
export const enviarEmailMasivoValidation = [
  body("usuarios_ids")
    .notEmpty()
    .withMessage("Se requiere al menos un usuario")
    .isArray({ min: 1 })
    .withMessage("usuarios_ids debe ser un array con al menos un elemento"),

  body("usuarios_ids.*")
    .isUUID()
    .withMessage("Cada usuario_id debe ser un UUID válido"),

  body("asunto")
    .notEmpty()
    .withMessage("El asunto es requerido")
    .isString()
    .withMessage("El asunto debe ser un string")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("El asunto debe tener entre 3 y 200 caracteres"),

  body("mensaje")
    .notEmpty()
    .withMessage("El mensaje es requerido")
    .isString()
    .withMessage("El mensaje debe ser un string")
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage("El mensaje debe tener entre 10 y 10000 caracteres"),

  body("tipo")
    .optional()
    .isIn(Object.values(TipoEmail))
    .withMessage("Tipo de email inválido"),

  body("html")
    .optional()
    .isBoolean()
    .withMessage("El campo html debe ser un booleano"),
];

// Validación para enviar alerta de clima por email
export const enviarAlertaClimaValidation = [
  body("estado_puerto")
    .notEmpty()
    .withMessage("El estado del puerto es requerido")
    .isIn(Object.values(EstadoPuerto))
    .withMessage("Estado del puerto inválido"),

  body("oleaje")
    .notEmpty()
    .withMessage("El oleaje es requerido")
    .isFloat({ min: 0, max: 10 })
    .withMessage("El oleaje debe ser un número entre 0 y 10 metros"),

  body("viento_velocidad")
    .notEmpty()
    .withMessage("La velocidad del viento es requerida")
    .isFloat({ min: 0, max: 200 })
    .withMessage(
      "La velocidad del viento debe ser un número entre 0 y 200 km/h"
    ),

  body("fecha")
    .notEmpty()
    .withMessage("La fecha es requerida")
    .isString()
    .withMessage("La fecha debe ser un string")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener el formato YYYY-MM-DD"),

  body("mensaje_adicional")
    .optional()
    .isString()
    .withMessage("El mensaje adicional debe ser un string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("El mensaje adicional no puede exceder 500 caracteres"),
];

// Validación para enviar alerta de permisos por email
export const enviarAlertaPermisosValidation = [
  body("dias_anticipacion")
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage("Los días de anticipación deben estar entre 1 y 90"),
];

// Validación para enviar email de prueba
export const enviarPruebaValidation = [
  body("email")
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email debe tener un formato válido")
    .normalizeEmail(),
];

