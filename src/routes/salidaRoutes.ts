import { Router } from "express";
import SalidaController from "../controllers/salidaController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  getAllSalidasValidation,
  getSalidaByIdValidation,
  createSalidaValidation,
  updateSalidaValidation,
  cancelarSalidaValidation,
  getMisSalidasValidation,
  getSalidaStatsValidation,
} from "../validators/salidaValidators";

const router = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas para gestión de salidas
router.get(
  "/",
  getAllSalidasValidation,
  handleValidationErrors,
  SalidaController.getAllSalidas
);

router.get(
  "/estadisticas",
  requireCONANP,
  getSalidaStatsValidation,
  handleValidationErrors,
  SalidaController.getSalidaStats
);

router.get(
  "/mis-salidas",
  getMisSalidasValidation,
  handleValidationErrors,
  SalidaController.getMisSalidas
);

router.get(
  "/:id",
  getSalidaByIdValidation,
  handleValidationErrors,
  SalidaController.getSalidaById
);

router.post(
  "/",
  createSalidaValidation,
  handleValidationErrors,
  SalidaController.createSalida
);

router.put(
  "/:id",
  updateSalidaValidation,
  handleValidationErrors,
  SalidaController.updateSalida
);

router.delete(
  "/:id",
  cancelarSalidaValidation,
  handleValidationErrors,
  SalidaController.cancelarSalida
);

export default router;
