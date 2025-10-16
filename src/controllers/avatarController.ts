import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { User } from "../models";
import { CloudinaryService } from "../services/cloudinaryService";
import { logger } from "../utils/logger";
import { ApiResponse } from "../types";

/**
 * Controlador para manejo de avatares de usuario
 * Incluye upload, eliminación y generación de avatares por defecto
 */
export class AvatarController {
  /**
   * Método auxiliar: Extrae solo la parte de fecha (YYYY-MM-DD) recortando el string
   * NO usa zona horaria - simplemente recorta el string ISO
   * Ejemplo: "2025-10-10T06:00:00.000Z" -> "2025-10-10"
   */
  private static extraerSoloFecha(
    fecha: Date | string | null | undefined
  ): string | null | undefined {
    if (!fecha) return fecha as null | undefined;
    const fechaString = fecha instanceof Date ? fecha.toISOString() : fecha;
    const partes = fechaString.split("T");
    return partes[0] || fechaString.substring(0, 10);
  }

  /**
   * Formatea un usuario para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearUsuarioParaRespuesta(usuario: any): any {
    const usuarioFormateado = { ...usuario };

    // Formatear cada campo de fecha
    if (usuarioFormateado.fechaVencimientoPermiso) {
      usuarioFormateado.fechaVencimientoPermiso =
        AvatarController.extraerSoloFecha(
          usuarioFormateado.fechaVencimientoPermiso
        );
    }
    if (usuarioFormateado.ultimaNotificacion) {
      usuarioFormateado.ultimaNotificacion = AvatarController.extraerSoloFecha(
        usuarioFormateado.ultimaNotificacion
      );
    }
    if (usuarioFormateado.created_at) {
      usuarioFormateado.created_at = AvatarController.extraerSoloFecha(
        usuarioFormateado.created_at
      );
    }
    if (usuarioFormateado.updated_at) {
      usuarioFormateado.updated_at = AvatarController.extraerSoloFecha(
        usuarioFormateado.updated_at
      );
    }

    return usuarioFormateado;
  }

  /**
   * Subir avatar de usuario
   * POST /api/avatars/upload
   */
  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const response: ApiResponse = {
          status: "error",
          message: firstError?.msg || "Errores de validación",
          error: "VALIDATION_ERROR",
          data: { errors: errors.array() },
        };
        res.status(400).json(response);
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no autenticado",
          error: "UNAUTHORIZED",
        };
        res.status(401).json(response);
        return;
      }

      const file = req.file;
      if (!file) {
        const response: ApiResponse = {
          status: "error",
          message: "No se ha subido ningún archivo",
          error: "NO_FILE_UPLOADED",
        };
        res.status(400).json(response);
        return;
      }

      // Buscar usuario
      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Eliminar avatar anterior si existe
      if (
        user.avatar_url &&
        CloudinaryService.isValidCloudinaryUrl(user.avatar_url)
      ) {
        try {
          await CloudinaryService.deleteAvatar(user.avatar_url);
          logger.info(
            { userId, oldAvatarUrl: user.avatar_url },
            "Avatar anterior eliminado de Cloudinary"
          );
        } catch (error) {
          logger.warn(
            { err: error, userId },
            "No se pudo eliminar avatar anterior"
          );
          // Continuar con el upload aunque no se pueda eliminar el anterior
        }
      }

      // Subir nuevo avatar a Cloudinary
      logger.info(
        { userId, fileName: file.originalname, fileSize: file.size },
        "Iniciando upload de avatar"
      );

      const avatarUrl = await CloudinaryService.uploadAvatar(
        file.buffer,
        userId,
        file.originalname
      );

      // Actualizar avatar_url en la base de datos
      user.avatar_url = avatarUrl;
      await user.save();

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = AvatarController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      logger.info({ userId, avatarUrl }, "Avatar actualizado exitosamente");

      const response: ApiResponse = {
        status: "success",
        message: "Avatar subido y actualizado exitosamente",
        data: {
          user: userFormateado,
          avatar: {
            url: avatarUrl,
            uploaded_at: new Date().toISOString(),
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error subiendo avatar"
      );

      const response: ApiResponse = {
        status: "error",
        message: "Error interno subiendo avatar",
        error: "UPLOAD_ERROR",
      };

      res.status(500).json(response);
    }
  }

  /**
   * Eliminar avatar de usuario
   * DELETE /api/avatars
   */
  static async deleteAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no autenticado",
          error: "UNAUTHORIZED",
        };
        res.status(401).json(response);
        return;
      }

      // Buscar usuario
      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      if (!user.avatar_url) {
        const response: ApiResponse = {
          status: "error",
          message: "El usuario no tiene avatar para eliminar",
          error: "NO_AVATAR_TO_DELETE",
        };
        res.status(400).json(response);
        return;
      }

      // Eliminar avatar de Cloudinary si es una URL válida
      let deletedFromCloudinary = false;
      if (CloudinaryService.isValidCloudinaryUrl(user.avatar_url)) {
        deletedFromCloudinary = await CloudinaryService.deleteAvatar(
          user.avatar_url
        );
        if (deletedFromCloudinary) {
          logger.info(
            { userId, avatarUrl: user.avatar_url },
            "Avatar eliminado de Cloudinary"
          );
        } else {
          logger.warn(
            { userId, avatarUrl: user.avatar_url },
            "No se pudo eliminar avatar de Cloudinary"
          );
        }
      } else {
        logger.info(
          { userId, avatarUrl: user.avatar_url },
          "Avatar no es de Cloudinary, solo eliminando de BD"
        );
      }

      // Limpiar avatar_url en la base de datos
      (user as any).avatar_url = null;
      await user.save();

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = AvatarController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Avatar eliminado exitosamente",
        data: {
          user: userFormateado,
          deleted_from_cloudinary: deletedFromCloudinary,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error eliminando avatar"
      );

      const response: ApiResponse = {
        status: "error",
        message: "Error interno eliminando avatar",
        error: "DELETE_ERROR",
      };

      res.status(500).json(response);
    }
  }

  /**
   * Generar avatar por defecto usando iniciales
   * POST /api/avatars/generate-default
   */
  static async generateDefaultAvatar(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no autenticado",
          error: "UNAUTHORIZED",
        };
        res.status(401).json(response);
        return;
      }

      const { backgroundColor, textColor } = req.body;

      // Buscar usuario
      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Eliminar avatar anterior si existe
      if (
        user.avatar_url &&
        CloudinaryService.isValidCloudinaryUrl(user.avatar_url)
      ) {
        try {
          await CloudinaryService.deleteAvatar(user.avatar_url);
          logger.info(
            { userId },
            "Avatar anterior eliminado al generar uno por defecto"
          );
        } catch (error) {
          logger.warn(
            { err: error, userId },
            "No se pudo eliminar avatar anterior"
          );
        }
      }

      // Generar avatar por defecto
      const avatarUrl = CloudinaryService.generateDefaultAvatar(
        user.nombre,
        backgroundColor || undefined,
        textColor || undefined
      );

      // Actualizar avatar_url en la base de datos
      user.avatar_url = avatarUrl;
      await user.save();

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = AvatarController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      logger.info(
        { userId, avatarUrl },
        "Avatar por defecto generado exitosamente"
      );

      const response: ApiResponse = {
        status: "success",
        message: "Avatar por defecto generado exitosamente",
        data: {
          user: userFormateado,
          avatar: {
            url: avatarUrl,
            type: "default",
            generated_at: new Date().toISOString(),
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error generando avatar por defecto"
      );

      const response: ApiResponse = {
        status: "error",
        message: "Error interno generando avatar por defecto",
        error: "GENERATION_ERROR",
      };

      res.status(500).json(response);
    }
  }

  /**
   * Obtener información del avatar actual
   * GET /api/avatars/info
   */
  static async getAvatarInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no autenticado",
          error: "UNAUTHORIZED",
        };
        res.status(401).json(response);
        return;
      }

      // Buscar usuario
      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      let avatarInfo = null;

      if (
        user.avatar_url &&
        CloudinaryService.isValidCloudinaryUrl(user.avatar_url)
      ) {
        // Extraer public_id de la URL
        const publicId = user.avatar_url
          ?.split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];
        if (!publicId) {
          throw new Error("No se pudo extraer public_id de la URL");
        }
        avatarInfo = await CloudinaryService.getImageInfo(publicId);
      }

      const response: ApiResponse = {
        status: "success",
        message: "Información del avatar obtenida exitosamente",
        data: {
          has_avatar: !!user.avatar_url,
          avatar_url: user.avatar_url,
          is_cloudinary: user.avatar_url
            ? CloudinaryService.isValidCloudinaryUrl(user.avatar_url)
            : false,
          image_info: avatarInfo,
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error obteniendo información del avatar"
      );

      const response: ApiResponse = {
        status: "error",
        message: "Error interno obteniendo información del avatar",
        error: "INFO_ERROR",
      };

      res.status(500).json(response);
    }
  }

  /**
   * Obtener estadísticas de uso de Cloudinary (solo CONANP)
   * GET /api/avatars/stats
   */
  static async getCloudinaryStats(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.rol;
      if (userRole !== "conanp") {
        const response: ApiResponse = {
          status: "error",
          message: "Solo CONANP puede acceder a estas estadísticas",
          error: "FORBIDDEN",
        };
        res.status(403).json(response);
        return;
      }

      const stats = await CloudinaryService.getUsageStats();

      if (!stats) {
        const response: ApiResponse = {
          status: "error",
          message: "No se pudieron obtener las estadísticas de Cloudinary",
          error: "STATS_ERROR",
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiResponse = {
        status: "success",
        message: "Estadísticas de Cloudinary obtenidas exitosamente",
        data: {
          usage_stats: stats,
          limits: {
            free_tier: {
              storage_gb: 25,
              bandwidth_gb: 25,
              transformations: 25000,
            },
          },
          retrieved_at: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error obteniendo estadísticas de Cloudinary"
      );

      const response: ApiResponse = {
        status: "error",
        message: "Error interno obteniendo estadísticas",
        error: "STATS_ERROR",
      };

      res.status(500).json(response);
    }
  }
}

export default AvatarController;
