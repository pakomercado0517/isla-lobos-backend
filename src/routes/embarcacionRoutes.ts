import { Router, type Router as ExpressRouter } from "express";
import EmbarcacionController from "../controllers/embarcacionController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  getAllEmbarcacionesValidation,
  getEmbarcacionByIdValidation,
  createEmbarcacionValidation,
  updateEmbarcacionValidation,
  deleteEmbarcacionValidation,
  getMisEmbarcacionesValidation,
  getEmbarcacionStatsValidation,
} from "../validators/embarcacionValidators";

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas para gestión de embarcaciones
router.get(
  "/",
  getAllEmbarcacionesValidation,
  handleValidationErrors,
  EmbarcacionController.getAllEmbarcaciones
);

router.get(
  "/estadisticas",
  requireCONANP,
  getEmbarcacionStatsValidation,
  handleValidationErrors,
  EmbarcacionController.getEmbarcacionStats
);

router.get(
  "/mis-embarcaciones",
  getMisEmbarcacionesValidation,
  handleValidationErrors,
  EmbarcacionController.getMisEmbarcaciones
);

router.get(
  "/:id",
  getEmbarcacionByIdValidation,
  handleValidationErrors,
  EmbarcacionController.getEmbarcacionById
);

router.post(
  "/",
  createEmbarcacionValidation,
  handleValidationErrors,
  EmbarcacionController.createEmbarcacion
);

router.put(
  "/:id",
  updateEmbarcacionValidation,
  handleValidationErrors,
  EmbarcacionController.updateEmbarcacion
);

router.delete(
  "/:id",
  deleteEmbarcacionValidation,
  handleValidationErrors,
  EmbarcacionController.deleteEmbarcacion
);

export default router;
