import { Router, type Router as ExpressRouter } from "express";
import ClimaController from "../controllers/climaController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  getAllCondicionesValidation,
  getCondicionByIdValidation,
  createCondicionValidation,
  updateCondicionValidation,
  deleteCondicionValidation,
  getPrediccionValidation,
  getEstadisticasValidation,
} from "../validators/climaValidators";

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas para gestión de condiciones meteorológicas
router.get(
  "/",
  getAllCondicionesValidation,
  handleValidationErrors,
  ClimaController.getAllCondiciones
);

router.get("/actual", ClimaController.getCondicionActual);

router.get(
  "/prediccion",
  getPrediccionValidation,
  handleValidationErrors,
  ClimaController.getPrediccion
);

router.get("/alertas", ClimaController.getAlertas);

router.get(
  "/estadisticas",
  requireCONANP,
  getEstadisticasValidation,
  handleValidationErrors,
  ClimaController.getEstadisticas
);

// Ruta para sincronizar datos del SMN (Servicio Meteorológico Nacional)
router.post("/sincronizar-smn", requireCONANP, ClimaController.sincronizarSMN);

router.get(
  "/:id",
  getCondicionByIdValidation,
  handleValidationErrors,
  ClimaController.getCondicionById
);

router.post(
  "/",
  requireCONANP,
  createCondicionValidation,
  handleValidationErrors,
  ClimaController.createCondicion
);

router.put(
  "/:id",
  requireCONANP,
  updateCondicionValidation,
  handleValidationErrors,
  ClimaController.updateCondicion
);

router.delete(
  "/:id",
  requireCONANP,
  deleteCondicionValidation,
  handleValidationErrors,
  ClimaController.deleteCondicion
);

export default router;
