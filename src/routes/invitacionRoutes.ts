import { Router, type Router as ExpressRouter } from "express";
import InvitacionController from "../controllers/invitacionController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  getAllInvitacionesValidation,
  getInvitacionByIdValidation,
  createInvitacionValidation,
  updateInvitacionValidation,
  deleteInvitacionValidation,
  validarCodigoValidation,
  usarInvitacionValidation,
} from "../validators/invitacionValidators";

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// RUTAS PÚBLICAS (no requieren autenticación)
router.post(
  "/validar",
  validarCodigoValidation,
  handleValidationErrors,
  InvitacionController.validarCodigo
);

router.get("/validar/:codigo", InvitacionController.validarCodigoPorGet);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas que requieren rol CONANP
router.get(
  "/",
  requireCONANP,
  getAllInvitacionesValidation,
  handleValidationErrors,
  InvitacionController.getAllInvitaciones
);

router.get(
  "/estadisticas",
  requireCONANP,
  InvitacionController.getEstadisticas
);

router.get(
  "/:id",
  requireCONANP,
  getInvitacionByIdValidation,
  handleValidationErrors,
  InvitacionController.getInvitacionById
);

router.post(
  "/",
  requireCONANP,
  createInvitacionValidation,
  handleValidationErrors,
  InvitacionController.createInvitacion
);

router.put(
  "/:id",
  requireCONANP,
  updateInvitacionValidation,
  handleValidationErrors,
  InvitacionController.updateInvitacion
);

router.delete(
  "/:id",
  requireCONANP,
  deleteInvitacionValidation,
  handleValidationErrors,
  InvitacionController.deleteInvitacion
);

// Rutas que requieren autenticación pero no rol específico
router.post(
  "/:id/usar",
  usarInvitacionValidation,
  handleValidationErrors,
  InvitacionController.usarInvitacion
);

export default router;
