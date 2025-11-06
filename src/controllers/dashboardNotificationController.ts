import { Response } from "express";
import { createLogger } from "../utils/logger";
import dashboardNotificationService from "../services/dashboardNotificationService";
import { AuthRequest } from "../middleware/auth";
import { extraerSoloFechaUTC } from "../utils/dateUtils";

const logger = createLogger("DashboardNotificationController");

/**
 * Controlador para gestionar notificaciones del dashboard
 * Solo usuarios CONANP pueden acceder
 */
class DashboardNotificationController {
  /**
   * Método auxiliar: Extrae solo la parte de fecha (YYYY-MM-DD) recortando el string
   */
  private static extraerSoloFecha(
    fecha: Date | string | null | undefined
  ): string | null | undefined {
    return extraerSoloFechaUTC(fecha);
  }

  /**
   * Formatea una notificación para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearNotificacionParaRespuesta(notificacion: {
    id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    usuario_id: string | null;
    enlace: string | null;
    leida: boolean;
    prioridad: string;
    metadata: Record<string, string | number | boolean | null>;
    read_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): {
    id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    usuario_id: string | null;
    enlace: string | null;
    leida: boolean;
    prioridad: string;
    metadata: Record<string, string | number | boolean | null>;
    read_at: string | null;
    created_at: string;
    updated_at: string;
  } {
    return {
      ...notificacion,
      read_at: notificacion.read_at
        ? (DashboardNotificationController.extraerSoloFecha(
            notificacion.read_at
          ) as string | null)
        : null,
      created_at: DashboardNotificationController.extraerSoloFecha(
        notificacion.created_at
      ) as string,
      updated_at: DashboardNotificationController.extraerSoloFecha(
        notificacion.updated_at
      ) as string,
    };
  }

  /**
   * Obtiene todas las notificaciones no leídas del usuario CONANP
   * GET /api/dashboard/notificaciones
   */
  public static async obtenerNotificaciones(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        });
        return;
      }

      const notificaciones = await dashboardNotificationService.obtenerNoLeidas(
        usuarioId
      );

      const contador = await dashboardNotificationService.obtenerContador(
        usuarioId
      );

      // Formatear notificaciones
      const notificacionesFormateadas = notificaciones.map((notif) =>
        DashboardNotificationController.formatearNotificacionParaRespuesta(
          notif
        )
      );

      res.status(200).json({
        status: "success",
        message: "Notificaciones obtenidas exitosamente",
        data: {
          notificaciones: notificacionesFormateadas,
          total: notificacionesFormateadas.length,
          no_leidas: contador,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al obtener notificaciones");
      res.status(500).json({
        status: "error",
        message: "Error al obtener notificaciones",
      });
    }
  }

  /**
   * Obtiene el contador de notificaciones no leídas
   * GET /api/dashboard/notificaciones/contador
   */
  public static async obtenerContador(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        });
        return;
      }

      const contador = await dashboardNotificationService.obtenerContador(
        usuarioId
      );

      res.status(200).json({
        status: "success",
        message: "Contador obtenido exitosamente",
        data: {
          no_leidas: contador,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al obtener contador de notificaciones");
      res.status(500).json({
        status: "error",
        message: "Error al obtener contador de notificaciones",
      });
    }
  }

  /**
   * Marca una notificación como leída
   * PUT /api/dashboard/notificaciones/:id/leer
   */
  public static async marcarComoLeida(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const usuarioId = req.user?.id;
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          status: "error",
          message: "ID de notificación no proporcionado",
        });
        return;
      }

      await dashboardNotificationService.marcarComoLeida(id, usuarioId);

      res.status(200).json({
        status: "success",
        message: "Notificación marcada como leída",
      });
    } catch (error) {
      logger.error({ error }, "Error al marcar notificación como leída");

      if (error instanceof Error && error.message.includes("no encontrada")) {
        res.status(404).json({
          status: "error",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        status: "error",
        message: "Error al marcar notificación como leída",
      });
    }
  }
}

export default DashboardNotificationController;

