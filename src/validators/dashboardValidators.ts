import { query } from "express-validator";

/**
 * Validadores para DashboardController
 *
 * Incluye validaciones para:
 * - Estadísticas generales
 * - Ocupación por día
 * - Estado de embarcaciones
 * - Estado de permisos
 * - Resumen meteorológico
 * - Alertas del sistema
 */

// Validaciones para obtener ocupación por día
export const getOcupacionValidation = [
  query("dias")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("El número de días debe ser un número entre 1 y 30"),
];

// Validaciones para obtener resumen meteorológico
export const getResumenClimaValidation = [
  query("dias")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("El número de días debe ser un número entre 1 y 30"),
];

// No se requieren validaciones para los otros endpoints del dashboard
// ya que no reciben parámetros de entrada

