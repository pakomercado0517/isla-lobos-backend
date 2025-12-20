import { Router, type Router as ExpressRouter } from "express";
import BrazaleteController from "../controllers/brazaleteController";
import EstadisticasBrazaleteController from "../controllers/estadisticasBrazaleteController";
import BrazaleteValidator from "../validators/brazaleteValidator";
import { validationMiddleware } from "../middleware/validation";
import { authMiddleware, requireRole } from "../middleware/auth";

const router: ExpressRouter = Router();

// ============================================================================
// RUTAS PARA GESTIÓN DE INVENTARIO
// ============================================================================

/**
 * GET /api/brazaletes/inventario
 * Obtener estado actual del inventario
 * Acceso: CONANP y Prestadores
 */
router.get(
  "/inventario",
  authMiddleware,
  BrazaleteController.obtenerInventario
);

/**
 * POST /api/brazaletes/lotes
 * Crear nuevo lote de brazaletes
 * Acceso: Solo CONANP
 */
router.post(
  "/lotes",
  authMiddleware,
  requireRole("conanp"),
  BrazaleteValidator.crearLote,
  validationMiddleware,
  BrazaleteController.crearLote
);

/**
 * GET /api/brazaletes/lotes
 * Listar lotes con filtros
 * Acceso: Solo CONANP
 */
router.get(
  "/lotes",
  authMiddleware,
  requireRole("conanp"),
  BrazaleteValidator.listarLotes,
  validationMiddleware,
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
  "/venta",
  authMiddleware,
  requireRole("conanp"),
  BrazaleteValidator.venderBrazaletes,
  validationMiddleware,
  BrazaleteController.venderBrazaletes
);

/**
 * GET /api/brazaletes/prestador/:id
 * Obtener brazaletes de un prestador específico
 * Acceso: CONANP y el prestador propietario
 */
router.get(
  "/prestador/:id",
  authMiddleware,
  BrazaleteValidator.obtenerBrazaletesPrestador,
  validationMiddleware,
  BrazaleteController.obtenerBrazaletesPrestador
);

/**
 * GET /api/brazaletes/mis-brazaletes
 * Obtener brazaletes del prestador autenticado
 * Acceso: Solo Prestadores
 */
router.get(
  "/mis-brazaletes",
  authMiddleware,
  requireRole("prestador"),
  (req, res) => {
    // Redirigir a la ruta con el ID del prestador autenticado
    req.params["id"] = req.user!.id;
    BrazaleteController.obtenerBrazaletesPrestador(req, res);
  }
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
  "/asignar",
  authMiddleware,
  BrazaleteValidator.asignarBrazaletes,
  validationMiddleware,
  BrazaleteController.asignarBrazaletes
);

/**
 * POST /api/brazaletes/uso
 * Registrar uso de brazalete en una salida
 * Acceso: CONANP y Prestadores
 */
router.post(
  "/uso",
  authMiddleware,
  BrazaleteValidator.registrarUso,
  validationMiddleware,
  BrazaleteController.registrarUso
);

/**
 * GET /api/brazaletes/uso/salida/:id
 * Obtener brazaletes utilizados en una salida
 * Acceso: CONANP y Prestadores
 */
router.get(
  "/uso/salida/:id",
  authMiddleware,
  BrazaleteValidator.obtenerBrazaletesSalida,
  validationMiddleware,
  BrazaleteController.obtenerBrazaletesSalida
);

/**
 * PUT /api/brazaletes/uso/actualizar
 * Actualizar estado y fecha_uso de un brazalete
 * Acceso: CONANP y Prestadores (solo sus propios brazaletes)
 */
router.put(
  "/uso/actualizar",
  authMiddleware,
  BrazaleteValidator.actualizarUso,
  validationMiddleware,
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
  "/estadisticas",
  authMiddleware,
  requireRole("conanp"),
  BrazaleteValidator.estadisticas,
  validationMiddleware,
  EstadisticasBrazaleteController.obtenerEstadisticas
);

/**
 * GET /api/brazaletes/alertas
 * Obtener alertas del sistema
 * Acceso: Solo CONANP
 */
router.get(
  "/alertas",
  authMiddleware,
  requireRole("conanp"),
  EstadisticasBrazaleteController.obtenerAlertas
);

/**
 * GET /api/brazaletes/reportes/ventas
 * Reporte detallado de ventas
 * Acceso: Solo CONANP
 */
router.get(
  "/reportes/ventas",
  authMiddleware,
  requireRole("conanp"),
  BrazaleteValidator.reporteVentas,
  validationMiddleware,
  EstadisticasBrazaleteController.reporteVentas
);

/**
 * GET /api/brazaletes/reportes/utilizacion
 * Reporte de utilización de brazaletes
 * Acceso: Solo CONANP
 */
router.get(
  "/reportes/utilizacion",
  authMiddleware,
  requireRole("conanp"),
  BrazaleteValidator.reporteUtilizacion,
  validationMiddleware,
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
router.get(
  "/dashboard",
  authMiddleware,
  requireRole("conanp"),
  async (req, res) => {
    try {
      // Redirigir a inventario por ahora
      await BrazaleteController.obtenerInventario(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener datos del dashboard",
      });
    }
  }
);

/**
 * GET /api/brazaletes/search
 * Búsqueda de brazaletes por código o filtros
 * Acceso: CONANP y Prestadores
 */
router.get(
  "/search",
  authMiddleware,
  BrazaleteValidator.buscarBrazaletes,
  validationMiddleware,
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
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Sistema de brazaletes operativo",
    timestamp: new Date().toISOString(),
  });
});

export default router;
