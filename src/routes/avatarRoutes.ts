import { Router, type Router as ExpressRouter, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import AvatarController from "../controllers/avatarController";
import {
  avatarUpload,
  validateUploadedFile,
  handleMulterError,
  validateCloudinaryConfig,
  uploadLimits,
} from "../middleware/uploadMiddleware";
import {
  generateDefaultAvatarValidation,
  avatarStatsValidation,
} from "../validators/avatarValidators";
import { authenticateToken } from "../middleware/auth";

/**
 * Rutas para el sistema de avatares
 * Todas las rutas requieren autenticación JWT
 */

const router: ExpressRouter = Router();

// Aplicar autenticación a todas las rutas de avatares
router.use(authenticateToken);

// Aplicar validación de configuración de Cloudinary a todas las rutas
router.use(validateCloudinaryConfig);

// Rate limiting específico para uploads de avatar
const avatarUploadLimit = rateLimit({
  windowMs: uploadLimits.windowMs,
  max: uploadLimits.max,
  message: uploadLimits.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/avatars/upload
 * Subir avatar de usuario
 *
 * Body (multipart/form-data):
 * - image: archivo de imagen (JPEG, PNG, WebP)
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 201: Avatar subido exitosamente
 * - 400: Error de validación o archivo
 * - 401: No autenticado
 * - 500: Error interno
 */
router.post(
  "/upload",
  avatarUploadLimit, // Rate limiting
  avatarUpload.single("image"), // Multer middleware
  handleMulterError, // Manejo de errores de Multer
  validateUploadedFile, // Validación adicional del archivo
  AvatarController.uploadAvatar
);

/**
 * DELETE /api/avatars
 * Eliminar avatar de usuario
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 200: Avatar eliminado exitosamente
 * - 400: No hay avatar para eliminar
 * - 401: No autenticado
 * - 404: Usuario no encontrado
 * - 500: Error interno
 */
router.delete("/", AvatarController.deleteAvatar);

/**
 * POST /api/avatars/generate-default
 * Generar avatar por defecto usando iniciales del usuario
 *
 * Body (opcional):
 * - backgroundColor: color hexadecimal (ej: "4f46e5")
 * - textColor: color hexadecimal (ej: "ffffff")
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 201: Avatar por defecto generado exitosamente
 * - 400: Error de validación
 * - 401: No autenticado
 * - 404: Usuario no encontrado
 * - 500: Error interno
 */
router.post(
  "/generate-default",
  generateDefaultAvatarValidation,
  AvatarController.generateDefaultAvatar
);

/**
 * GET /api/avatars/info
 * Obtener información del avatar actual del usuario
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 200: Información del avatar obtenida
 * - 401: No autenticado
 * - 404: Usuario no encontrado
 * - 500: Error interno
 */
router.get("/info", AvatarController.getAvatarInfo);

/**
 * GET /api/avatars/stats
 * Obtener estadísticas de uso de Cloudinary (solo CONANP)
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 200: Estadísticas obtenidas
 * - 401: No autenticado
 * - 403: Sin permisos (solo CONANP)
 * - 500: Error interno
 */
router.get("/stats", AvatarController.getCloudinaryStats);

/**
 * GET /api/avatars/usage
 * Obtener estadísticas de uso de avatares con filtros (solo CONANP)
 *
 * Query Parameters (opcionales):
 * - date_from: fecha de inicio (ISO 8601)
 * - date_to: fecha de fin (ISO 8601)
 * - user_id: ID específico de usuario
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 200: Estadísticas de uso obtenidas
 * - 400: Error de validación de parámetros
 * - 401: No autenticado
 * - 403: Sin permisos (solo CONANP)
 * - 500: Error interno
 */
router.get(
  "/usage",
  avatarStatsValidation,
  // AvatarController.getAvatarUsageStats // Implementar en el futuro si se necesita
  (_req: Request, res: Response) => {
    res.status(200).json({
      status: "success",
      message: "Endpoint de estadísticas de uso en desarrollo",
      data: {
        note: "Esta funcionalidad estará disponible en futuras versiones",
      },
    });
  }
);

/**
 * PUT /api/avatars/url
 * Actualizar avatar URL manualmente (para URLs externas)
 *
 * Body:
 * - avatar_url: URL de imagen válida
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 200: URL de avatar actualizada
 * - 400: Error de validación
 * - 401: No autenticado
 * - 404: Usuario no encontrado
 * - 500: Error interno
 */
router.put(
  "/url",
  // updateAvatarUrlValidation, // Descomentar si se implementa
  (_req, res) => {
    res.status(200).json({
      status: "success",
      message: "Actualización manual de URL de avatar en desarrollo",
      data: {
        note: "Esta funcionalidad estará disponible en futuras versiones. Por ahora usa el endpoint /upload para subir archivos directamente.",
      },
    });
  }
);

/**
 * GET /api/avatars/health
 * Verificar estado del servicio de avatares
 *
 * Headers:
 * - Authorization: Bearer <jwt_token>
 *
 * Response:
 * - 200: Servicio funcionando correctamente
 * - 500: Error en el servicio
 */
router.get("/health", (_req, res) => {
  try {
    // Verificar configuración de Cloudinary
    const cloudinaryConfigured = !!(
      process.env["CLOUDINARY_CLOUD_NAME"] &&
      process.env["CLOUDINARY_API_KEY"] &&
      process.env["CLOUDINARY_API_SECRET"]
    );

    const healthStatus = {
      status: "success",
      message: "Servicio de avatares funcionando correctamente",
      data: {
        service: "avatar-service",
        version: "1.0.0",
        cloudinary_configured: cloudinaryConfigured,
        timestamp: new Date().toISOString(),
        endpoints: {
          upload: "POST /api/avatars/upload",
          delete: "DELETE /api/avatars",
          generate_default: "POST /api/avatars/generate-default",
          info: "GET /api/avatars/info",
          stats: "GET /api/avatars/stats (CONANP only)",
          health: "GET /api/avatars/health",
        },
        limits: {
          max_file_size: process.env["AVATAR_MAX_SIZE"] || "5242880", // 5MB
          allowed_types: (
            process.env["AVATAR_ALLOWED_TYPES"] ||
            "image/jpeg,image/png,image/webp"
          ).split(","),
          max_dimension: process.env["AVATAR_MAX_DIMENSION"] || "2048",
          rate_limit: `${uploadLimits.max} uploads per ${
            uploadLimits.windowMs / 1000 / 60
          } minutes`,
        },
      },
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error verificando estado del servicio",
      error: "HEALTH_CHECK_ERROR",
    });
  }
});

export default router;
