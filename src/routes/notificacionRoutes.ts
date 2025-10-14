import { Router } from "express";
import NotificacionController from "../controllers/notificacionController";
import { authenticateToken, requireCONANP } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import {
  enviarNotificacionValidation,
  enviarNotificacionMasivaValidation,
  enviarAlertaClimaValidation,
  enviarAlertaPermisosValidation,
  verificarEstadoMensajeValidation,
  enviarPruebaValidation,
} from "../validators/notificacionValidators";

const router = Router();

/**
 * @route   GET /api/notificaciones/estado
 * @desc    Verificar estado del servicio de WhatsApp
 * @access  Privado (CONANP)
 */
router.get(
  "/estado",
  authenticateToken,
  requireCONANP,
  NotificacionController.verificarEstado
);

/**
 * @route   POST /api/notificaciones/enviar
 * @desc    Enviar notificación individual por WhatsApp
 * @access  Privado (CONANP)
 */
router.post(
  "/enviar",
  authenticateToken,
  requireCONANP,
  enviarNotificacionValidation,
  handleValidationErrors,
  NotificacionController.enviarNotificacion
);

/**
 * @route   POST /api/notificaciones/enviar-masivo
 * @desc    Enviar notificaciones masivas a múltiples usuarios
 * @access  Privado (CONANP)
 */
router.post(
  "/enviar-masivo",
  authenticateToken,
  requireCONANP,
  enviarNotificacionMasivaValidation,
  handleValidationErrors,
  NotificacionController.enviarNotificacionMasiva
);

/**
 * @route   POST /api/notificaciones/alerta-clima
 * @desc    Enviar alerta de clima a todos los prestadores activos
 * @access  Privado (CONANP)
 */
router.post(
  "/alerta-clima",
  authenticateToken,
  requireCONANP,
  enviarAlertaClimaValidation,
  handleValidationErrors,
  NotificacionController.enviarAlertaClima
);

/**
 * @route   POST /api/notificaciones/alerta-permisos
 * @desc    Enviar alertas de permisos próximos a vencer
 * @access  Privado (CONANP)
 */
router.post(
  "/alerta-permisos",
  authenticateToken,
  requireCONANP,
  enviarAlertaPermisosValidation,
  handleValidationErrors,
  NotificacionController.enviarAlertaPermisos
);

/**
 * @route   GET /api/notificaciones/plantillas
 * @desc    Obtener plantillas de mensajes disponibles
 * @access  Privado (CONANP)
 */
router.get(
  "/plantillas",
  authenticateToken,
  requireCONANP,
  NotificacionController.obtenerPlantillas
);

/**
 * @route   GET /api/notificaciones/estado/:messageSid
 * @desc    Verificar estado de un mensaje enviado
 * @access  Privado (CONANP)
 */
router.get(
  "/estado/:messageSid",
  authenticateToken,
  requireCONANP,
  verificarEstadoMensajeValidation,
  handleValidationErrors,
  NotificacionController.verificarEstadoMensaje
);

/**
 * @route   POST /api/notificaciones/test
 * @desc    Enviar mensaje de prueba (solo en desarrollo)
 * @access  Privado (CONANP)
 */
router.post(
  "/test",
  authenticateToken,
  requireCONANP,
  enviarPruebaValidation,
  handleValidationErrors,
  NotificacionController.enviarPrueba
);

export default router;
