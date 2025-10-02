import { body, param, query } from "express-validator";
import { EstadoEmbarcacion, TipoEmbarcacion } from "../types";

/**
 * Validadores para EmbarcacionController
 *
 * Incluye validaciones para:
 * - Creación de embarcaciones
 * - Actualización de embarcaciones
 * - Filtros de consulta
 * - Parámetros de ruta
 */

// Validaciones para obtener todas las embarcaciones
export const getAllEmbarcacionesValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),

  query("estado")
    .optional()
    .isIn(Object.values(EstadoEmbarcacion))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoEmbarcacion).join(
        ", "
      )}`
    ),

  query("tipo")
    .optional()
    .isIn(Object.values(TipoEmbarcacion))
    .withMessage(
      `El tipo debe ser uno de: ${Object.values(TipoEmbarcacion).join(", ")}`
    ),

  query("prestador_id")
    .optional()
    .isUUID()
    .withMessage("El ID del prestador debe ser un UUID válido"),

  query("activo")
    .optional()
    .isBoolean()
    .withMessage("El campo activo debe ser un valor booleano"),
];

// Validaciones para obtener embarcación por ID
export const getEmbarcacionByIdValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para crear embarcación
export const createEmbarcacionValidation = [
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

  body("matricula")
    .trim()
    .notEmpty()
    .withMessage("La matrícula es requerida")
    .isLength({ min: 3, max: 20 })
    .withMessage("La matrícula debe tener entre 3 y 20 caracteres")
    .matches(/^[A-Z0-9\-_]+$/)
    .withMessage(
      "La matrícula solo puede contener letras mayúsculas, números, guiones y guiones bajos"
    ),

  body("capacidad")
    .isInt({ min: 1, max: 1000 })
    .withMessage("La capacidad debe ser un número entre 1 y 1000"),

  body("tipo")
    .isIn(Object.values(TipoEmbarcacion))
    .withMessage(
      `El tipo debe ser uno de: ${Object.values(TipoEmbarcacion).join(", ")}`
    ),

  body("estado")
    .optional()
    .isIn(Object.values(EstadoEmbarcacion))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoEmbarcacion).join(
        ", "
      )}`
    ),

  body("prestador_id")
    .isUUID()
    .withMessage("El ID del prestador debe ser un UUID válido"),
];

// Validaciones para actualizar embarcación
export const updateEmbarcacionValidation = [
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

  body("matricula")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("La matrícula no puede estar vacía")
    .isLength({ min: 3, max: 20 })
    .withMessage("La matrícula debe tener entre 3 y 20 caracteres")
    .matches(/^[A-Z0-9\-_]+$/)
    .withMessage(
      "La matrícula solo puede contener letras mayúsculas, números, guiones y guiones bajos"
    ),

  body("capacidad")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("La capacidad debe ser un número entre 1 y 1000"),

  body("tipo")
    .optional()
    .isIn(Object.values(TipoEmbarcacion))
    .withMessage(
      `El tipo debe ser uno de: ${Object.values(TipoEmbarcacion).join(", ")}`
    ),

  body("estado")
    .optional()
    .isIn(Object.values(EstadoEmbarcacion))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoEmbarcacion).join(
        ", "
      )}`
    ),

  body("prestador_id")
    .optional()
    .isUUID()
    .withMessage("El ID del prestador debe ser un UUID válido"),

  body("activo")
    .optional()
    .isBoolean()
    .withMessage("El campo activo debe ser un valor booleano"),
];

// Validaciones para eliminar embarcación
export const deleteEmbarcacionValidation = [
  param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
];

// Validaciones para obtener mis embarcaciones
export const getMisEmbarcacionesValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),

  query("estado")
    .optional()
    .isIn(Object.values(EstadoEmbarcacion))
    .withMessage(
      `El estado debe ser uno de: ${Object.values(EstadoEmbarcacion).join(
        ", "
      )}`
    ),

  query("tipo")
    .optional()
    .isIn(Object.values(TipoEmbarcacion))
    .withMessage(
      `El tipo debe ser uno de: ${Object.values(TipoEmbarcacion).join(", ")}`
    ),

  query("activo")
    .optional()
    .isBoolean()
    .withMessage("El campo activo debe ser un valor booleano"),
];

// Validaciones para estadísticas de embarcaciones
export const getEmbarcacionStatsValidation = [
  query("prestador_id")
    .optional()
    .isUUID()
    .withMessage("El ID del prestador debe ser un UUID válido"),
];
