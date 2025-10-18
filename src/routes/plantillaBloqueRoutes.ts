import express from "express";
import PlantillaBloqueController from "../controllers/plantillaBloqueController";
import { authMiddleware } from "../middleware/auth";
import { body } from "express-validator";
import { validationMiddleware } from "../middleware/validation";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

/**
 * GET /api/plantillas-bloque
 * Obtener todas las plantillas de bloques
 * Query params: ?destino=string&activa=boolean
 */
router.get("/", PlantillaBloqueController.getAllPlantillas);

/**
 * GET /api/plantillas-bloque/:id
 * Obtener plantilla específica por ID
 */
router.get("/:id", PlantillaBloqueController.getPlantillaById);

/**
 * GET /api/plantillas-bloque/:id/estadisticas
 * Obtener estadísticas de una plantilla específica
 */
router.get("/:id/estadisticas", PlantillaBloqueController.getEstadisticasPlantilla);

/**
 * POST /api/plantillas-bloque
 * Crear nueva plantilla de bloque
 */
router.post(
  "/",
  [
    body("nombre")
      .trim()
      .notEmpty()
      .withMessage("El nombre es obligatorio")
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    body("hora_inicio")
      .notEmpty()
      .withMessage("La hora de inicio es obligatoria")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de inicio debe tener formato HH:MM"),
    body("hora_fin")
      .notEmpty()
      .withMessage("La hora de fin es obligatoria")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de fin debe tener formato HH:MM"),
    body("capacidad_total")
      .isInt({ min: 1, max: 1000 })
      .withMessage("La capacidad total debe ser un número entre 1 y 1000"),
    body("destino")
      .trim()
      .notEmpty()
      .withMessage("El destino es obligatorio")
      .isIn([
        "Isla de Lobos",
        "Arrecife Tuxpan", 
        "Arrecife de en Medio",
        "Arrecife Tanhuijo"
      ])
      .withMessage("Destino inválido"),
    body("activa")
      .optional()
      .isBoolean()
      .withMessage("El campo activa debe ser verdadero o falso"),
  ],
  validationMiddleware,
  PlantillaBloqueController.createPlantilla
);

/**
 * PUT /api/plantillas-bloque/:id
 * Actualizar plantilla existente
 */
router.put(
  "/:id",
  [
    body("nombre")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    body("hora_inicio")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de inicio debe tener formato HH:MM"),
    body("hora_fin")
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de fin debe tener formato HH:MM"),
    body("capacidad_total")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("La capacidad total debe ser un número entre 1 y 1000"),
    body("destino")
      .optional()
      .trim()
      .isIn([
        "Isla de Lobos",
        "Arrecife Tuxpan",
        "Arrecife de en Medio", 
        "Arrecife Tanhuijo"
      ])
      .withMessage("Destino inválido"),
    body("activa")
      .optional()
      .isBoolean()
      .withMessage("El campo activa debe ser verdadero o falso"),
  ],
  validationMiddleware,
  PlantillaBloqueController.updatePlantilla
);

/**
 * DELETE /api/plantillas-bloque/:id
 * Eliminar plantilla de bloque
 */
router.delete("/:id", PlantillaBloqueController.deletePlantilla);

export default router;