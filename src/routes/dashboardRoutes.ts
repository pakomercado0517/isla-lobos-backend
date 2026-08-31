import { Router, type Router as ExpressRouter } from 'express';
import DashboardController from '../controllers/dashboard.controller';
import DashboardNotificationController from '../controllers/dashboard-notification.controller';
import { authenticateToken, requireCONANP } from '../middleware/auth.middleware';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import {
  getOcupacionValidation,
  getResumenClimaValidation,
  marcarNotificacionLeidaValidation,
} from '../validators/dashboardValidators';

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Todas las rutas del dashboard requieren rol CONANP
router.use(requireCONANP);

// Rutas del dashboard
router.get('/estadisticas', DashboardController.getEstadisticas);

router.get(
  '/ocupacion',
  getOcupacionValidation,
  handleValidationErrors,
  DashboardController.getOcupacion
);

router.get('/embarcaciones', DashboardController.getEstadoEmbarcaciones);

router.get('/permisos', DashboardController.getEstadoPermisos);

router.get(
  '/clima',
  getResumenClimaValidation,
  handleValidationErrors,
  DashboardController.getResumenClima
);

router.get('/alertas', DashboardController.getAlertasSistema);

// Rutas de notificaciones del dashboard
router.get('/notificaciones', DashboardNotificationController.obtenerNotificaciones);

router.get('/notificaciones/contador', DashboardNotificationController.obtenerContador);

router.put(
  '/notificaciones/:id/leer',
  marcarNotificacionLeidaValidation,
  handleValidationErrors,
  DashboardNotificationController.marcarComoLeida
);

export default router;
