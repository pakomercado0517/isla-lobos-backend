import { createLogger } from "../utils/logger";
import NotificacionDashboard from "../models/NotificacionDashboard";
import User from "../models/User";
import {
  CrearNotificacionDashboardRequest,
  NotificacionDashboard as INotificacionDashboard,
  PrioridadNotificacionDashboard,
  UserRole,
} from "../types";
import { Op } from "sequelize";

// Tipo para el JSON del modelo con timestamps
interface NotificacionDashboardJson extends INotificacionDashboard {
  created_at: Date;
  updated_at: Date;
}

const logger = createLogger("DashboardNotificationService");

/**
 * Servicio para gestionar notificaciones del dashboard
 * Maneja almacenamiento en BD y envío en tiempo real vía WebSocket
 */
class DashboardNotificationService {
  private io: any = null; // Socket.IO instance (se inicializará después)

  /**
   * Establece la instancia de Socket.IO para envío en tiempo real
   */
  public setSocketIO(ioInstance: any): void {
    this.io = ioInstance;
    logger.info("Socket.IO configurado para notificaciones del dashboard");
  }

  /**
   * Crea una nueva notificación y la envía en tiempo real si hay usuarios conectados
   * @param request - Datos de la notificación a crear
   * @returns Notificación creada
   */
  public async crearNotificacion(
    request: CrearNotificacionDashboardRequest
  ): Promise<INotificacionDashboard> {
    try {
      // Validar que el usuario existe si se especifica usuario_id
      if (request.usuario_id) {
        const usuario = await User.findByPk(request.usuario_id);
        if (!usuario) {
          throw new Error(`Usuario con ID ${request.usuario_id} no encontrado`);
        }
        if (usuario.rol !== UserRole.CONANP) {
          throw new Error(
            `El usuario ${request.usuario_id} no es un usuario CONANP`
          );
        }
      }

      // Crear la notificación en la base de datos
      const notificacion = await NotificacionDashboard.create({
        tipo: request.tipo,
        titulo: request.titulo,
        mensaje: request.mensaje,
        usuario_id: request.usuario_id || null,
        enlace: request.enlace || null,
        leida: false,
        prioridad: request.prioridad || PrioridadNotificacionDashboard.MEDIA,
        metadata: request.metadata || {},
        read_at: null,
      });

      logger.info(
        {
          notificacion_id: notificacion.id,
          tipo: notificacion.tipo,
          usuario_id: notificacion.usuario_id,
        },
        "Notificación creada en BD"
      );

      // Intentar enviar en tiempo real si hay usuarios conectados
      this.enviarATodosLosConectados(notificacion);

      return this.formatearNotificacionParaRespuesta(notificacion);
    } catch (error) {
      logger.error({ error, request }, "Error al crear notificación");
      throw error;
    }
  }

  /**
   * Envía una notificación a todos los usuarios CONANP conectados vía WebSocket
   * @param notificacion - Notificación a enviar
   */
  private enviarATodosLosConectados(
    notificacion: NotificacionDashboard
  ): void {
    if (!this.io) {
      logger.debug("Socket.IO no configurado, notificación solo guardada en BD");
      return;
    }

    try {
      const notificacionFormateada =
        this.formatearNotificacionParaRespuesta(notificacion);

      // Si usuario_id es null, enviar a todos los usuarios CONANP
      if (!notificacion.usuario_id) {
        // Enviar a la sala de todos los CONANP
        this.io.to("conanp_todos").emit("nueva_notificacion", {
          ...notificacionFormateada,
        });

        logger.info(
          {
            notificacion_id: notificacion.id,
            tipo: notificacion.tipo,
          },
          "Notificación enviada a todos los usuarios CONANP conectados"
        );
      } else {
        // Enviar solo al usuario específico
        this.io
          .to(`usuario_${notificacion.usuario_id}`)
          .emit("nueva_notificacion", {
            ...notificacionFormateada,
          });

        logger.info(
          {
            notificacion_id: notificacion.id,
            usuario_id: notificacion.usuario_id,
            tipo: notificacion.tipo,
          },
          "Notificación enviada a usuario específico"
        );
      }
    } catch (error) {
      logger.error(
        { error, notificacion_id: notificacion.id },
        "Error al enviar notificación vía WebSocket"
      );
      // No fallar la creación si el envío falla
    }
  }

  /**
   * Obtiene todas las notificaciones no leídas de un usuario CONANP
   * @param usuarioId - ID del usuario CONANP
   * @param limit - Límite de notificaciones a obtener (default: 50)
   * @returns Array de notificaciones no leídas
   */
  public async obtenerNoLeidas(
    usuarioId: string,
    limit: number = 50
  ): Promise<INotificacionDashboard[]> {
    try {
      const notificaciones = await NotificacionDashboard.findAll({
        where: {
          [Op.or]: [
            { usuario_id: null }, // Para todos los CONANP
            { usuario_id: usuarioId }, // Para este usuario específico
          ],
          leida: false,
        },
        order: [["created_at", "DESC"]],
        limit,
      });

      return notificaciones.map((notif) =>
        this.formatearNotificacionParaRespuesta(notif)
      );
    } catch (error) {
      logger.error({ error, usuarioId }, "Error al obtener notificaciones no leídas");
      throw error;
    }
  }

  /**
   * Obtiene el contador de notificaciones no leídas de un usuario
   * @param usuarioId - ID del usuario CONANP
   * @returns Número de notificaciones no leídas
   */
  public async obtenerContador(usuarioId: string): Promise<number> {
    try {
      const count = await NotificacionDashboard.count({
        where: {
          [Op.or]: [
            { usuario_id: null }, // Para todos los CONANP
            { usuario_id: usuarioId }, // Para este usuario específico
          ],
          leida: false,
        },
      });

      return count;
    } catch (error) {
      logger.error({ error, usuarioId }, "Error al obtener contador de notificaciones");
      throw error;
    }
  }

  /**
   * Marca una notificación como leída
   * @param notificacionId - ID de la notificación
   * @param usuarioId - ID del usuario que marca como leída
   */
  public async marcarComoLeida(
    notificacionId: string,
    usuarioId: string
  ): Promise<void> {
    try {
      // Verificar que la notificación existe y pertenece al usuario
      const notificacion = await NotificacionDashboard.findOne({
        where: {
          id: notificacionId,
          [Op.or]: [
            { usuario_id: null }, // Para todos los CONANP
            { usuario_id: usuarioId }, // Para este usuario específico
          ],
        },
      });

      if (!notificacion) {
        throw new Error("Notificación no encontrada o no autorizada");
      }

      // Marcar como leída
      await notificacion.update({
        leida: true,
        read_at: new Date(),
      });

      logger.info(
        {
          notificacion_id: notificacionId,
          usuario_id: usuarioId,
        },
        "Notificación marcada como leída"
      );
    } catch (error) {
      logger.error(
        { error, notificacionId, usuarioId },
        "Error al marcar notificación como leída"
      );
      throw error;
    }
  }

  /**
   * Formatea una notificación para respuesta
   * Nota: El formateo de fechas a YYYY-MM-DD se hace en el controlador
   */
  private formatearNotificacionParaRespuesta(
    notificacion: NotificacionDashboard
  ): INotificacionDashboard {
    const notifJson = notificacion.toJSON() as NotificacionDashboardJson;
    const notifFormateada: INotificacionDashboard = {
      ...notifJson,
      read_at: notifJson.read_at || null,
      created_at: notifJson.created_at,
      updated_at: notifJson.updated_at,
    };

    return notifFormateada;
  }
}

// Singleton instance
const dashboardNotificationService = new DashboardNotificationService();

export default dashboardNotificationService;

