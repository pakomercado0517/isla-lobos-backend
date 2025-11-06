import { body, param, query } from "express-validator";
import { EstadoBloque } from "../types";

/**
 * Validadores para BloqueController
 *
 * Incluye validaciones para:
 * - Creación de bloques
 * - Actualización de bloques
 * - Filtros de consulta
 * - Parámetros de ruta
 */

// Validaciones para obtener todos los bloques
export const getAllBloquesValidation = [
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
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener formato YYYY-MM-DD"),

  query("estado")
    .optional()
    .isIn(Object.values(EstadoBloque))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoBloque).join(", ")}`
    ),

  query("destino")
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

  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("La fecha de inicio debe tener formato ISO 8601 (YYYY-MM-DD)"),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe tener formato ISO 8601 (YYYY-MM-DD)"),

  // Validación personalizada para rango de fechas
  query("fecha_fin").custom((value, { req }) => {
    const fechaInicio = req.query?.["fecha_inicio"];
    if (fechaInicio && value) {
      const fechaInicioStr = String(fechaInicio).split('T')[0];
      const fechaFinStr = String(value).split('T')[0];
      if (fechaInicioStr && fechaFinStr && fechaFinStr < fechaInicioStr) {
        throw new Error(
          "La fecha de fin debe ser posterior a la fecha de inicio"
        );
      }
    }
    return true;
  }),
];

// Validaciones para obtener bloque por ID
export const getBloqueByIdValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para crear bloque
export const createBloqueValidation = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage(
      "El nombre solo puede contener letras, números, espacios, guiones y guiones bajos"
    ),

  body("hora_inicio")
    .trim()
    .notEmpty()
    .withMessage("La hora de inicio es requerida")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora de inicio debe tener formato HH:MM (24 horas)"),

  body("hora_fin")
    .trim()
    .notEmpty()
    .withMessage("La hora de fin es requerida")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora de fin debe tener formato HH:MM (24 horas)"),

  // Validación personalizada para que la hora de fin sea posterior a la de inicio
  body("hora_fin").custom((value, { req }) => {
    const horaInicio = req.body.hora_inicio;
    if (horaInicio && value) {
      const [horaInicioH, horaInicioM] = horaInicio.split(":").map(Number);
      const [horaFinH, horaFinM] = value.split(":").map(Number);
      const minutosInicio = horaInicioH * 60 + horaInicioM;
      const minutosFin = horaFinH * 60 + horaFinM;

      if (minutosFin <= minutosInicio) {
        throw new Error(
          "La hora de fin debe ser posterior a la hora de inicio"
        );
      }
    }
    return true;
  }),

  body("capacidad_total")
    .isInt({ min: 1, max: 1000 })
    .withMessage("La capacidad total debe ser un número entre 1 y 1000"),

  body("fecha")
    .optional() // 🆕 Hacer fecha opcional
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener formato YYYY-MM-DD")
    .custom((value) => {
      if (value) { // Solo validar si se proporciona
        // Validar que sea una fecha válida
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() + 1 !== month ||
          date.getDate() !== day
        ) {
          throw new Error("Fecha inválida");
        }
        
        // Comparar con hoy (como string YYYY-MM-DD)
        const hoy = new Date().toISOString().split('T')[0];
        if (hoy && value < hoy) {
          throw new Error("No se puede crear un bloque para una fecha pasada");
        }
      }
      return true;
    }),

  body("estado")
    .optional()
    .isIn(Object.values(EstadoBloque))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoBloque).join(", ")}`
    ),

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

  body("es_plantilla")
    .optional()
    .isBoolean()
    .withMessage("es_plantilla debe ser un valor booleano (true o false)"),

  // Validación lógica: consistencia entre fecha y es_plantilla (si se proporciona)
  body().custom((_, { req }) => {
    const { fecha, es_plantilla } = req.body;
    
    // Solo validar si es_plantilla se proporciona explícitamente
    if (es_plantilla !== undefined) {
      // Si no hay fecha pero es_plantilla es false, error
      if (!fecha && es_plantilla === false) {
        throw new Error("Los bloques sin fecha deben tener es_plantilla como true");
      }
      
      // Si hay fecha pero es_plantilla es true, error
      if (fecha && es_plantilla === true) {
        throw new Error("Los bloques con fecha deben tener es_plantilla como false");
      }
    }
    
    return true;
  }),
];

// Validaciones para actualizar bloque
export const updateBloqueValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),

  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage(
      "El nombre solo puede contener letras, números, espacios, guiones y guiones bajos"
    ),

  body("hora_inicio")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La hora de inicio no puede estar vacía")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora de inicio debe tener formato HH:MM (24 horas)"),

  body("hora_fin")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La hora de fin no puede estar vacía")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("La hora de fin debe tener formato HH:MM (24 horas)"),

  // Validación personalizada para que la hora de fin sea posterior a la de inicio
  body("hora_fin").custom((value, { req }) => {
    const horaInicio = req.body.hora_inicio;
    if (horaInicio && value) {
      const [horaInicioH, horaInicioM] = horaInicio.split(":").map(Number);
      const [horaFinH, horaFinM] = value.split(":").map(Number);
      const minutosInicio = horaInicioH * 60 + horaInicioM;
      const minutosFin = horaFinH * 60 + horaFinM;

      if (minutosFin <= minutosInicio) {
        throw new Error(
          "La hora de fin debe ser posterior a la hora de inicio"
        );
      }
    }
    return true;
  }),

  body("capacidad_total")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("La capacidad total debe ser un número entre 1 y 1000"),

  body("fecha")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("La fecha debe tener formato YYYY-MM-DD")
    .custom((value) => {
      if (value) {
        // Validar que sea una fecha válida
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() !== year ||
          date.getMonth() + 1 !== month ||
          date.getDate() !== day
        ) {
          throw new Error("Fecha inválida");
        }
        
        // Comparar con hoy (como string YYYY-MM-DD)
        const hoy = new Date().toISOString().split('T')[0];
        if (hoy && value < hoy) {
          throw new Error("No se puede cambiar un bloque a una fecha pasada");
        }
      }
      return true;
    }),

  body("estado")
    .optional()
    .isIn(Object.values(EstadoBloque))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoBloque).join(", ")}`
    ),

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

  body("es_plantilla")
    .optional()
    .isBoolean()
    .withMessage("es_plantilla debe ser un valor booleano (true o false)"),
];

// Validaciones para eliminar bloque
export const deleteBloqueValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para estadísticas de bloques
export const getBloqueStatsValidation = [
  query("fecha_inicio")
    .optional()
    .isISO8601()
    .withMessage("La fecha de inicio debe tener formato ISO 8601 (YYYY-MM-DD)"),

  query("fecha_fin")
    .optional()
    .isISO8601()
    .withMessage("La fecha de fin debe tener formato ISO 8601 (YYYY-MM-DD)"),

  // Validación personalizada para rango de fechas
  query("fecha_fin").custom((value, { req }) => {
    const fechaInicio = req.query?.["fecha_inicio"];
    if (fechaInicio && value) {
      const fechaInicioStr = String(fechaInicio).split('T')[0];
      const fechaFinStr = String(value).split('T')[0];
      if (fechaInicioStr && fechaFinStr && fechaFinStr < fechaInicioStr) {
        throw new Error(
          "La fecha de fin debe ser posterior a la fecha de inicio"
        );
      }
    }
    return true;
  }),
];
