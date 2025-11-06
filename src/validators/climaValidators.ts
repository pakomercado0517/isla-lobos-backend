import { body, param, query } from "express-validator";

/**
 * Validadores para ClimaController
 *
 * Incluye validaciones para:
 * - Condiciones meteorológicas
 * - Predicciones y alertas
 * - Estado del puerto
 * - Filtros de consulta
 */

// Validaciones para obtener todas las condiciones meteorológicas
export const getAllCondicionesValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),

  query("fecha_inicio")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha de inicio debe tener formato YYYY-MM-DD"),

  query("fecha_fin")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha de fin debe tener formato YYYY-MM-DD"),

  query("estado_puerto")
    .optional()
    .isIn(["abierto", "restricciones", "cerrado", "emergencia"])
    .withMessage(
      "El estado del puerto debe ser uno de: abierto, restricciones, cerrado, emergencia"
    ),

  query("fuente")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("La fuente debe tener entre 2 y 50 caracteres")
    .trim(),
];

// Validaciones para obtener condición por ID
export const getCondicionByIdValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para crear condición meteorológica
export const createCondicionValidation = [
  body("fecha_hora")
    .isISO8601()
    .withMessage("La fecha y hora deben estar en formato ISO 8601")
    .custom((value) => {
      const fecha = new Date(value);
      const ahora = new Date();
      const unDiaAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

      if (fecha > ahora) {
        throw new Error("La fecha no puede ser en el futuro");
      }
      if (fecha < unDiaAtras) {
        throw new Error("La fecha no puede ser más de 24 horas en el pasado");
      }
      return true;
    }),

  body("oleaje")
    .isFloat({ min: 0, max: 10 })
    .withMessage("El oleaje debe ser un número entre 0 y 10 metros"),

  body("viento_velocidad")
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "La velocidad del viento debe ser un número entre 0 y 100 km/h"
    ),

  body("viento_direccion")
    .isLength({ min: 2, max: 20 })
    .withMessage("La dirección del viento debe tener entre 2 y 20 caracteres")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage(
      "La dirección del viento solo puede contener letras y espacios"
    )
    .trim(),

  body("visibilidad")
    .isIn(["excelente", "buena", "regular", "baja"])
    .withMessage(
      "La visibilidad debe ser uno de: excelente, buena, regular, baja"
    ),

  body("estado_puerto")
    .isIn(["abierto", "restricciones", "cerrado", "emergencia"])
    .withMessage(
      "El estado del puerto debe ser uno de: abierto, restricciones, cerrado, emergencia"
    ),

  body("prediccion_5_dias")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("La predicción no puede exceder 1000 caracteres")
    .trim(),

  body("fuente")
    .isLength({ min: 2, max: 50 })
    .withMessage("La fuente debe tener entre 2 y 50 caracteres")
    .trim(),
];

// Validaciones para actualizar condición meteorológica
export const updateCondicionValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),

  body("fecha_hora")
    .optional()
    .isISO8601()
    .withMessage("La fecha y hora deben estar en formato ISO 8601")
    .custom((value) => {
      if (value) {
        const fecha = new Date(value);
        const ahora = new Date();
        const unDiaAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

        if (fecha > ahora) {
          throw new Error("La fecha no puede ser en el futuro");
        }
        if (fecha < unDiaAtras) {
          throw new Error("La fecha no puede ser más de 24 horas en el pasado");
        }
      }
      return true;
    }),

  body("oleaje")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("El oleaje debe ser un número entre 0 y 10 metros"),

  body("viento_velocidad")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(
      "La velocidad del viento debe ser un número entre 0 y 100 km/h"
    ),

  body("viento_direccion")
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage("La dirección del viento debe tener entre 2 y 20 caracteres")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage(
      "La dirección del viento solo puede contener letras y espacios"
    )
    .trim(),

  body("visibilidad")
    .optional()
    .isIn(["excelente", "buena", "regular", "baja"])
    .withMessage(
      "La visibilidad debe ser uno de: excelente, buena, regular, baja"
    ),

  body("estado_puerto")
    .optional()
    .isIn(["abierto", "restricciones", "cerrado", "emergencia"])
    .withMessage(
      "El estado del puerto debe ser uno de: abierto, restricciones, cerrado, emergencia"
    ),

  body("prediccion_5_dias")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("La predicción no puede exceder 1000 caracteres")
    .trim(),

  body("fuente")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("La fuente debe tener entre 2 y 50 caracteres")
    .trim(),
];

// Validaciones para eliminar condición meteorológica
export const deleteCondicionValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para predicción meteorológica
export const getPrediccionValidation = [
  query("dias")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("El número de días debe ser un número entre 1 y 30"),
];

// Validaciones para estadísticas meteorológicas
export const getEstadisticasValidation = [
  query("fecha_inicio")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha de inicio debe tener formato YYYY-MM-DD"),

  query("fecha_fin")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha de fin debe tener formato YYYY-MM-DD"),
];
