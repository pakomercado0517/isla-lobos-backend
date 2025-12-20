import { Router, type Router as ExpressRouter } from "express";
import BloqueController from "../controllers/bloqueController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  getAllBloquesValidation,
  getBloqueByIdValidation,
  createBloqueValidation,
  updateBloqueValidation,
  deleteBloqueValidation,
  getBloqueStatsValidation,
} from "../validators/bloqueValidators";

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas para gestión de bloques (solo CONANP)
router.get(
  "/",
  getAllBloquesValidation,
  handleValidationErrors,
  BloqueController.getAllBloques
);

router.get(
  "/estadisticas",
  requireCONANP,
  getBloqueStatsValidation,
  handleValidationErrors,
  BloqueController.getBloqueStats
);

router.get(
  "/:id",
  getBloqueByIdValidation,
  handleValidationErrors,
  BloqueController.getBloqueById
);

router.post(
  "/",
  requireCONANP,
  createBloqueValidation,
  handleValidationErrors,
  BloqueController.createBloque
);

router.put(
  "/:id",
  requireCONANP,
  updateBloqueValidation,
  handleValidationErrors,
  BloqueController.updateBloque
);

router.delete(
  "/:id",
  requireCONANP,
  deleteBloqueValidation,
  handleValidationErrors,
  BloqueController.deleteBloque
);

export default router;
