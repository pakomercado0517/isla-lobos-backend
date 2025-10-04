import { body, param, query } from "express-validator";

/**
 * Validadores para SalidaController
 *
 * Incluye validaciones para:
 * - Creación de salidas
 * - Actualización de salidas
 * - Filtros de consulta
 * - Parámetros de ruta
 */

// Validaciones para obtener todas las salidas
export const getAllSalidasValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),

  query("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601 (YYYY-MM-DD)"),

  query("estado")
    .optional()
    .isIn(["programada", "en_progreso", "completada", "cancelada"])
    .withMessage(
      "El estado debe ser uno de: programada, en_progreso, completada, cancelada"
    ),

  query("prestador_id")
    .optional()
    .isUUID()
    .withMessage("El ID del prestador debe ser un UUID válido"),

  query("embarcacion_id")
    .optional()
    .isUUID()
    .withMessage("El ID de la embarcación debe ser un UUID válido"),

  query("bloque_id")
    .optional()
    .isUUID()
    .withMessage("El ID del bloque debe ser un UUID válido"),

  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de inicio debe estar en formato ISO 8601 (YYYY-MM-DD)"
    ),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe estar en formato ISO 8601 (YYYY-MM-DD)"),
];

// Validaciones para obtener salida por ID
export const getSalidaByIdValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para crear salida
export const createSalidaValidation = [
  body("destino")
    .notEmpty()
    .withMessage("El destino es requerido")
    .isIn([
      "Isla de Lobos",
      "Arrecife Tuxpan",
      "Arrecife de en Medio",
      "Arrecife Tanhuijo",
    ])
    .withMessage(
      "El destino debe ser uno de: Isla de Lobos, Arrecife Tuxpan, Arrecife de en Medio, Arrecife Tanhuijo"
    ),

  body("embarcacion_id")
    .isUUID()
    .withMessage("El ID de la embarcación debe ser un UUID válido"),

  body("fecha")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601 (YYYY-MM-DD)")
    .custom((value) => {
      const fechaSalida = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSalida < hoy) {
        throw new Error("La fecha no puede ser en el pasado");
      }
      return true;
    }),

  body("numero_pasajeros")
    .isInt({ min: 1, max: 150 })
    .withMessage("El número de pasajeros debe ser un número entre 1 y 150"),

  body("bloque_id")
    .optional()
    .custom((value) => {
      // Permitir null o undefined
      if (value === null || value === undefined) {
        return true;
      }
      // Si tiene valor, debe ser un UUID válido
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error("El ID del bloque debe ser un UUID válido o null");
      }
      return true;
    })
    .withMessage("El ID del bloque debe ser un UUID válido o null"),

  body("hora")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora debe estar en formato HH:MM (24 horas)"),

  body("observaciones")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no pueden exceder 500 caracteres")
    .trim(),

  // Validación condicional: si destino es "Isla de Lobos", bloque_id es requerido
  body().custom((_, { req }) => {
    if (req.body.destino === "Isla de Lobos") {
      if (!req.body.bloque_id) {
        throw new Error("bloque_id es requerido para salidas a Isla de Lobos");
      }
    } else {
      if (!req.body.hora) {
        throw new Error("hora es requerida para este destino");
      }
    }
    return true;
  }),
];

// Validaciones para actualizar salida
export const updateSalidaValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),

  body("destino")
    .optional()
    .isIn([
      "Isla de Lobos",
      "Arrecife Tuxpan",
      "Arrecife de en Medio",
      "Arrecife Tanhuijo",
    ])
    .withMessage(
      "El destino debe ser uno de: Isla de Lobos, Arrecife Tuxpan, Arrecife de en Medio, Arrecife Tanhuijo"
    ),

  body("embarcacion_id")
    .optional()
    .isUUID()
    .withMessage("El ID de la embarcación debe ser un UUID válido"),

  body("bloque_id")
    .optional()
    .custom((value) => {
      // Permitir null o undefined
      if (value === null || value === undefined) {
        return true;
      }
      // Si tiene valor, debe ser un UUID válido
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error("El ID del bloque debe ser un UUID válido o null");
      }
      return true;
    })
    .withMessage("El ID del bloque debe ser un UUID válido o null"),

  body("hora")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora debe estar en formato HH:MM (24 horas)"),

  body("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601 (YYYY-MM-DD)")
    .custom((value) => {
      if (value) {
        const fechaSalida = new Date(value);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaSalida < hoy) {
          throw new Error("La fecha no puede ser en el pasado");
        }
      }
      return true;
    }),

  body("numero_pasajeros")
    .optional()
    .isInt({ min: 1, max: 150 })
    .withMessage("El número de pasajeros debe ser un número entre 1 y 150"),

  body("observaciones")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Las observaciones no pueden exceder 500 caracteres")
    .trim(),

  body("estado")
    .optional()
    .isIn([
      "programada",
      "en_progreso",
      "completada",
      "cancelada",
      "cancelada_por_clima",
      "cancelada_capitaria",
    ])
    .withMessage(
      "El estado debe ser uno de: programada, en_progreso, completada, cancelada, cancelada_por_clima, cancelada_capitaria"
    ),
];

// Validaciones para cancelar salida
export const cancelarSalidaValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),

  body("motivo_cancelacion")
    .optional()
    .isLength({ max: 500 })
    .withMessage("El motivo de cancelación no puede exceder 500 caracteres")
    .trim(),
];

// Validaciones para obtener mis salidas
export const getMisSalidasValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),

  query("fecha")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO 8601 (YYYY-MM-DD)"),

  query("estado")
    .optional()
    .isIn(["programada", "en_progreso", "completada", "cancelada"])
    .withMessage(
      "El estado debe ser uno de: programada, en_progreso, completada, cancelada"
    ),

  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de inicio debe estar en formato ISO 8601 (YYYY-MM-DD)"
    ),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe estar en formato ISO 8601 (YYYY-MM-DD)"),
];

// Validaciones para estadísticas de salidas
export const getSalidaStatsValidation = [
  query("prestador_id")
    .optional()
    .isUUID()
    .withMessage("El ID del prestador debe ser un UUID válido"),

  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de inicio debe estar en formato ISO 8601 (YYYY-MM-DD)"
    ),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe estar en formato ISO 8601 (YYYY-MM-DD)"),
];
