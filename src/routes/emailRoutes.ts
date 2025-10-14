import { Router } from "express";
import EmailController from "../controllers/emailController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import {
  enviarEmailValidation,
  enviarEmailMasivoValidation,
  enviarAlertaClimaValidation,
  enviarAlertaPermisosValidation,
  enviarPruebaValidation,
} from "../validators/emailValidators";

const router = Router();

/**
 * @route   GET /api/emails/estado
 * @desc    Verificar estado del servicio de Email
 * @access  Privado (CONANP)
 */
router.get(
  "/estado",
  authenticateToken,
  requireCONANP,
  EmailController.verificarEstado
);

/**
 * @route   POST /api/emails/enviar
 * @desc    Enviar email individual
 * @access  Privado (CONANP)
 */
router.post(
  "/enviar",
  authenticateToken,
  requireCONANP,
  enviarEmailValidation,
  handleValidationErrors,
  EmailController.enviarEmail
);

/**
 * @route   POST /api/emails/enviar-masivo
 * @desc    Enviar emails masivos a múltiples usuarios
 * @access  Privado (CONANP)
 */
router.post(
  "/enviar-masivo",
  authenticateToken,
  requireCONANP,
  enviarEmailMasivoValidation,
  handleValidationErrors,
  EmailController.enviarEmailMasivo
);

/**
 * @route   POST /api/emails/alerta-clima
 * @desc    Enviar alerta de clima a todos los prestadores activos
 * @access  Privado (CONANP)
 */
router.post(
  "/alerta-clima",
  authenticateToken,
  requireCONANP,
  enviarAlertaClimaValidation,
  handleValidationErrors,
  EmailController.enviarAlertaClima
);

/**
 * @route   POST /api/emails/alerta-permisos
 * @desc    Enviar alertas de permisos próximos a vencer
 * @access  Privado (CONANP)
 */
router.post(
  "/alerta-permisos",
  authenticateToken,
  requireCONANP,
  enviarAlertaPermisosValidation,
  handleValidationErrors,
  EmailController.enviarAlertaPermisos
);

/**
 * @route   GET /api/emails/plantillas
 * @desc    Obtener plantillas de emails disponibles
 * @access  Privado (CONANP)
 */
router.get(
  "/plantillas",
  authenticateToken,
  requireCONANP,
  EmailController.obtenerPlantillas
);

/**
 * @route   POST /api/emails/test
 * @desc    Enviar email de prueba (solo en desarrollo)
 * @access  Privado (CONANP)
 */
router.post(
  "/test",
  authenticateToken,
  requireCONANP,
  enviarPruebaValidation,
  handleValidationErrors,
  EmailController.enviarPrueba
);

export default router;

