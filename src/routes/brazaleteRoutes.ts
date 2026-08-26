import { Router, type Router as ExpressRouter } from 'express';
import BrazaleteController from '../controllers/brazalete.controller';
import EstadisticasBrazaleteController from '../controllers/estadisticasBrazaleteController';
import BrazaleteValidator from '../validators/brazaleteValidator';
import { handleValidationErrors } from '../middleware/validation';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

// ============================================================================
// RUTAS PARA GESTIÓN DE INVENTARIO
// ============================================================================

/**
 * GET /api/brazaletes/inventario
 * Obtener estado actual del inventario
 * Acceso: CONANP y Prestadores
 */
router.get('/inventario', authMiddleware, BrazaleteController.obtenerInventario);

/**
 * POST /api/brazaletes/lotes
 * Crear nuevo lote de brazaletes
 * Acceso: Solo CONANP
 */
router.post(
  '/lotes',
  authMiddleware,
  requireRole('conanp'),
  BrazaleteValidator.crearLote,
  handleValidationErrors,
  BrazaleteController.crearLote
);

/**
 * GET /api/brazaletes/lotes
 * Listar lotes con filtros
 * Acceso: Solo CONANP
 */
router.get(
  '/lotes',
  authMiddleware,
  requireRole('conanp'),
  BrazaleteValidator.listarLotes,
  handleValidationErrors,
  BrazaleteController.listarLotes
);

// ============================================================================
// RUTAS PARA VENTA A PRESTADORES
// ============================================================================

/**
 * POST /api/brazaletes/venta
 * Vender brazaletes a un prestador
 * Acceso: Solo CONANP
 */
router.post(
  '/venta',
  authMiddleware,
  requireRole('conanp'),
  BrazaleteValidator.venderBrazaletes,
  handleValidationErrors,
  BrazaleteController.venderBrazaletes
);

/**
 * GET /api/brazaletes/prestador/:id
 * Obtener brazaletes de un prestador específico
 * Acceso: CONANP y el prestador propietario
 */
router.get(
  '/prestador/:id',
  authMiddleware,
  BrazaleteValidator.obtenerBrazaletesPrestador,
  handleValidationErrors,
  BrazaleteController.obtenerBrazaletesPrestador
);

/**
 * GET /api/brazaletes/mis-brazaletes
 * Obtener brazaletes del prestador autenticado
 * Acceso: Solo Prestadores
 */
router.get(
  '/mis-brazaletes',
  authMiddleware,
  requireRole('prestador'),
  BrazaleteController.obtenerMisBrazaletes
);

// ============================================================================
// RUTAS PARA USO EN SALIDAS
// ============================================================================

/**
 * POST /api/brazaletes/asignar
 * Asignar brazaletes a una salida
 * Acceso: CONANP y Prestadores
 */
router.post(
  '/asignar',
  authMiddleware,
  BrazaleteValidator.asignarBrazaletes,
  handleValidationErrors,
  BrazaleteController.asignarBrazaletes
);

/**
 * POST /api/brazaletes/uso
 * Registrar uso de brazalete en una salida
 * Acceso: CONANP y Prestadores
 */
router.post(
  '/uso',
  authMiddleware,
  BrazaleteValidator.registrarUso,
  handleValidationErrors,
  BrazaleteController.registrarUso
);

/**
 * GET /api/brazaletes/uso/salida/:id
 * Obtener brazaletes utilizados en una salida
 * Acceso: CONANP y Prestadores
 */
router.get(
  '/uso/salida/:id',
  authMiddleware,
  BrazaleteValidator.obtenerBrazaletesSalida,
  handleValidationErrors,
  BrazaleteController.obtenerBrazaletesSalida
);

/**
 * PUT /api/brazaletes/uso/actualizar
 * Actualizar estado y fecha_uso de un brazalete
 * Acceso: CONANP y Prestadores (solo sus propios brazaletes)
 */
router.put(
  '/uso/actualizar',
  authMiddleware,
  BrazaleteValidator.actualizarUso,
  handleValidationErrors,
  BrazaleteController.actualizarUso
);

// ============================================================================
// RUTAS PARA REPORTES Y ESTADÍSTICAS
// ============================================================================

/**
 * GET /api/brazaletes/estadisticas
 * Obtener estadísticas generales
 * Acceso: Solo CONANP
 */
router.get(
  '/estadisticas',
  authMiddleware,
  requireRole('conanp'),
  BrazaleteValidator.estadisticas,
  handleValidationErrors,
  EstadisticasBrazaleteController.obtenerEstadisticas
);

/**
 * GET /api/brazaletes/alertas
 * Obtener alertas del sistema
 * Acceso: Solo CONANP
 */
router.get(
  '/alertas',
  authMiddleware,
  requireRole('conanp'),
  EstadisticasBrazaleteController.obtenerAlertas
);

/**
 * GET /api/brazaletes/reportes/ventas
 * Reporte detallado de ventas
 * Acceso: Solo CONANP
 */
router.get(
  '/reportes/ventas',
  authMiddleware,
  requireRole('conanp'),
  BrazaleteValidator.reporteVentas,
  handleValidationErrors,
  EstadisticasBrazaleteController.reporteVentas
);

/**
 * GET /api/brazaletes/reportes/utilizacion
 * Reporte de utilización de brazaletes
 * Acceso: Solo CONANP
 */
router.get(
  '/reportes/utilizacion',
  authMiddleware,
  requireRole('conanp'),
  BrazaleteValidator.reporteUtilizacion,
  handleValidationErrors,
  EstadisticasBrazaleteController.reporteUtilizacion
);

// ============================================================================
// RUTAS ADMINISTRATIVAS (Solo CONANP)
// ============================================================================

/**
 * GET /api/brazaletes/dashboard
 * Datos para dashboard de CONANP
 * Acceso: Solo CONANP
 */
router.get('/dashboard', authMiddleware, requireRole('conanp'), BrazaleteController.obtenerInventario);

/**
 * GET /api/brazaletes/search
 * Búsqueda de brazaletes por código o filtros
 * Acceso: CONANP y Prestadores
 */
router.get(
  '/search',
  authMiddleware,
  BrazaleteValidator.buscarBrazaletes,
  handleValidationErrors,
  BrazaleteController.buscarBrazaletes
);

// ============================================================================
// RUTAS DE UTILIDAD
// ============================================================================

/**
 * GET /api/brazaletes/health
 * Verificar estado del sistema de brazaletes
 * Acceso: Público (para monitoreo)
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Sistema de brazaletes operativo',
    timestamp: new Date().toISOString(),
  });
});

export default router;
