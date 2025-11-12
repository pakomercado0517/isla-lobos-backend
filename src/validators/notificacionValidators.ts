import { body, param } from "express-validator";
import {
  TipoNotificacion,
  PrioridadNotificacion,
  EstadoPuerto,
} from "../types";

/**
 * Validaciones para el envío de notificaciones por WhatsApp
 */

// Validación para enviar notificación individual
export const enviarNotificacionValidation = [
  body("telefono")
    .notEmpty()
    .withMessage("El teléfono es requerido")
    .isString()
    .withMessage("El teléfono debe ser un string")
    .trim()
    .matches(/^(\+521?)?[0-9]{10}$/)
    .withMessage(
      "El teléfono debe tener un formato válido (10 dígitos, puede incluir +52 o +521)"
    ),

  body("mensaje")
    .if((_, { req }) => !(req.body.template || req.body.contentSid))
    .notEmpty()
    .withMessage("El mensaje es requerido cuando no se especifica una plantilla")
    .bail()
    .isString()
    .withMessage("El mensaje debe ser un string")
    .trim()
    .isLength({ min: 10, max: 1600 })
    .withMessage("El mensaje debe tener entre 10 y 1600 caracteres"),
  body("mensaje")
    .optional({ nullable: true })
    .isString()
    .withMessage("El mensaje debe ser un string")
    .trim()
    .isLength({ max: 1600 })
    .withMessage("El mensaje no puede exceder 1600 caracteres"),

  body("template")
    .optional()
    .isString()
    .withMessage("La plantilla debe ser un string")
    .trim()
    .isLength({ min: 1, max: 128 })
    .withMessage("El nombre de plantilla debe tener entre 1 y 128 caracteres"),

  body("contentSid")
    .optional()
    .isString()
    .withMessage("El content SID debe ser un string")
    .trim()
    .matches(/^HX[0-9a-fA-F]{32}$/)
    .withMessage(
      "El content SID debe tener el formato correcto (comienza con HX y 32 caracteres hexadecimales)"
    ),

  body("variables")
    .if((_, { req }) => !!(req.body.template || req.body.contentSid))
    .notEmpty()
    .withMessage("Las variables son requeridas cuando se utiliza una plantilla")
    .bail()
    .custom((value) => {
      if (Array.isArray(value)) {
        const isValid = value.every((item) => {
          const tipo = typeof item;
          return (
            tipo === "string" ||
            tipo === "number" ||
            tipo === "boolean"
          );
        });
        if (!isValid) {
          throw new Error(
            "Las variables deben ser un arreglo de strings, números o booleanos"
          );
        }
        return true;
      }
      if (value && typeof value === "object") {
        const isValid = Object.values(value).every((item) => {
          const tipo = typeof item;
          return (
            tipo === "string" ||
            tipo === "number" ||
            tipo === "boolean"
          );
        });
        if (!isValid) {
          throw new Error(
            "Las variables deben ser un objeto con valores string, number o boolean"
          );
        }
        return true;
      }
      throw new Error(
        "Las variables deben ser un arreglo o un objeto con valores válidos"
      );
    }),

  body("idioma")
    .optional()
    .isString()
    .withMessage("El idioma debe ser un string")
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("El código de idioma debe tener entre 2 y 10 caracteres"),

  body("tipo")
    .optional()
    .isIn(Object.values(TipoNotificacion))
    .withMessage("Tipo de notificación inválido"),

  body("prioridad")
    .optional()
    .isIn(Object.values(PrioridadNotificacion))
    .withMessage("Prioridad de notificación inválida"),

  body("datos_adicionales")
    .optional()
    .isObject()
    .withMessage("Los datos adicionales deben ser un objeto"),
];

// Validación para enviar notificación masiva
export const enviarNotificacionMasivaValidation = [
  body("usuarios_ids")
    .notEmpty()
    .withMessage("Se requiere al menos un usuario")
    .isArray({ min: 1 })
    .withMessage("usuarios_ids debe ser un array con al menos un elemento"),

  body("usuarios_ids.*")
    .isUUID()
    .withMessage("Cada usuario_id debe ser un UUID válido"),

  body("mensaje")
    .notEmpty()
    .withMessage("El mensaje es requerido")
    .isString()
    .withMessage("El mensaje debe ser un string")
    .trim()
    .isLength({ min: 10, max: 1600 })
    .withMessage("El mensaje debe tener entre 10 y 1600 caracteres"),

  body("tipo")
    .optional()
    .isIn(Object.values(TipoNotificacion))
    .withMessage("Tipo de notificación inválido"),

  body("plantilla")
    .optional()
    .isString()
    .withMessage("La plantilla debe ser un string"),
];

// Validación para enviar alerta de clima
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

  body("mensaje_adicional")
    .optional()
    .isString()
    .withMessage("El mensaje adicional debe ser un string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("El mensaje adicional no puede exceder 500 caracteres"),
];

// Validación para enviar alerta de permisos
export const enviarAlertaPermisosValidation = [
  body("dias_anticipacion")
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage("Los días de anticipación deben estar entre 1 y 90"),
];

// Validación para verificar estado de mensaje
export const verificarEstadoMensajeValidation = [
  param("messageSid")
    .notEmpty()
    .withMessage("El message SID es requerido")
    .isString()
    .withMessage("El message SID debe ser un string")
    .matches(/^(SM|MM)[a-zA-Z0-9]{32}$/)
    .withMessage("El message SID debe tener un formato válido de Twilio"),
];

// Validación para enviar mensaje de prueba
export const enviarPruebaValidation = [
  body("telefono")
    .notEmpty()
    .withMessage("El teléfono es requerido")
    .isString()
    .withMessage("El teléfono debe ser un string")
    .trim()
    .matches(/^(\+521?)?[0-9]{10}$/)
    .withMessage(
      "El teléfono debe tener un formato válido (10 dígitos, puede incluir +52 o +521)"
    ),
];
