import { Request, Response } from "express";
import { createLogger } from "../utils/logger";
import whatsappService from "../services/whatsappService";
import User from "../models/User";
import {
  TipoNotificacion,
  NotificacionAlertaClimaData,
  EstadoPuerto,
  UserRole,
} from "../types";

const logger = createLogger("NotificacionController");

/**
 * Controlador para gestionar el envío de notificaciones por WhatsApp
 * Solo usuarios CONANP pueden enviar notificaciones
 */
class NotificacionController {
  /**
   * Verifica el estado del servicio de WhatsApp
   * GET /api/notificaciones/estado
   */
  public static async verificarEstado(
    _req: Request,
    res: Response
  ): Promise<void> {
    try {
      const isReady = whatsappService.isReady();

      res.status(200).json({
        status: "success",
        message: isReady
          ? "Servicio de WhatsApp configurado y listo"
          : "Servicio de WhatsApp no configurado",
        data: {
          configurado: isReady,
          proveedor: "Twilio",
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al verificar estado del servicio");
      res.status(500).json({
        status: "error",
        message: "Error al verificar estado del servicio de WhatsApp",
      });
    }
  }

  /**
   * Envía una notificación individual
   * POST /api/notificaciones/enviar
   */
  public static async enviarNotificacion(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const {
        telefono,
        mensaje,
        tipo,
        prioridad,
        template,
        contentSid,
        variables,
        idioma,
      } = req.body;

      const resolvedContentSid: string | undefined =
        contentSid || template || undefined;

      logger.info(
        { telefono, tipo, prioridad, template: resolvedContentSid },
        "Enviando notificación individual"
      );

      const resultado = resolvedContentSid
        ? await whatsappService.enviarMensajeConTemplate(
            telefono,
            resolvedContentSid,
            variables,
            idioma
          )
        : await whatsappService.enviarMensaje(
            telefono,
            mensaje,
            tipo || TipoNotificacion.RECORDATORIO_GENERICO
          );

      if (resultado.success) {
        res.status(200).json({
          status: "success",
          message: "Notificación enviada exitosamente",
          data: {
            notificacion: resultado,
          },
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Error al enviar notificación",
          error: resultado.error,
        });
      }
    } catch (error) {
      logger.error({ error }, "Error al enviar notificación");
      res.status(500).json({
        status: "error",
        message: "Error al procesar solicitud de notificación",
      });
    }
  }

  /**
   * Envía notificaciones masivas a múltiples usuarios
   * POST /api/notificaciones/enviar-masivo
   */
  public static async enviarNotificacionMasiva(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { usuarios_ids, mensaje, tipo } = req.body;

      logger.info(
        { total_usuarios: usuarios_ids.length, tipo },
        "Enviando notificaciones masivas"
      );

      // Obtener usuarios con teléfono
      const usuarios = await User.findAll({
        where: {
          id: usuarios_ids,
        },
        attributes: ["id", "nombre", "telefono"],
      });

      const telefonos = usuarios
        .filter((u) => u.telefono && u.telefono.length > 0)
        .map((u) => u.telefono as string);

      if (telefonos.length === 0) {
        res.status(400).json({
          status: "error",
          message: "Ninguno de los usuarios tiene teléfono registrado",
        });
        return;
      }

      const resultado = await whatsappService.enviarMasivo(
        telefonos,
        mensaje,
        tipo || TipoNotificacion.RECORDATORIO_GENERICO
      );

      res.status(200).json({
        status: "success",
        message: "Notificaciones masivas procesadas",
        data: {
          resumen: {
            total: resultado.total,
            enviados: resultado.enviados,
            fallidos: resultado.fallidos,
          },
          resultados: resultado.resultados,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al enviar notificaciones masivas");
      res.status(500).json({
        status: "error",
        message: "Error al procesar notificaciones masivas",
      });
    }
  }

  /**
   * Envía alerta de clima a todos los prestadores activos
   * POST /api/notificaciones/alerta-clima
   */
  public static async enviarAlertaClima(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { estado_puerto, oleaje, viento_velocidad, mensaje_adicional } =
        req.body;

      logger.info({ estado_puerto }, "Enviando alerta de clima");

      // Obtener todos los prestadores activos con teléfono
      const prestadores = await User.findAll({
        where: {
          rol: UserRole.PRESTADOR,
          activo: true,
        },
        attributes: ["id", "nombre", "telefono"],
      });

      const telefonos = prestadores
        .filter((p) => p.telefono && p.telefono.length > 0)
        .map((p) => p.telefono as string);

      if (telefonos.length === 0) {
        res.status(400).json({
          status: "error",
          message: "No hay prestadores activos con teléfono registrado",
        });
        return;
      }

      const datosAlerta: NotificacionAlertaClimaData = {
        estado_puerto: estado_puerto as EstadoPuerto,
        oleaje: parseFloat(oleaje),
        viento_velocidad: parseFloat(viento_velocidad),
        mensaje_adicional,
      };

      // Enviar alerta a cada prestador
      const resultados = [];
      for (const telefono of telefonos) {
        const resultado = await whatsappService.enviarAlertaClima(
          telefono,
          datosAlerta
        );
        resultados.push(resultado);

        // Pequeña pausa entre mensajes
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const enviados = resultados.filter((r) => r.success).length;
      const fallidos = resultados.filter((r) => !r.success).length;

      res.status(200).json({
        status: "success",
        message: "Alerta de clima enviada a prestadores",
        data: {
          resumen: {
            total: telefonos.length,
            enviados,
            fallidos,
          },
          resultados,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al enviar alerta de clima");
      res.status(500).json({
        status: "error",
        message: "Error al enviar alerta de clima",
      });
    }
  }

  /**
   * Envía alertas de permisos próximos a vencer
   * POST /api/notificaciones/alerta-permisos
   */
  public static async enviarAlertaPermisos(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { dias_anticipacion } = req.body;
      const dias = parseInt(dias_anticipacion) || 30;

      logger.info({ dias }, "Enviando alertas de permisos próximos a vencer");

      // Obtener usuarios con permisos por vencer
      const hoy = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() + dias);

      const usuarios = await User.findAll({
        where: {
          rol: UserRole.PRESTADOR,
          activo: true,
        },
        attributes: [
          "id",
          "nombre",
          "telefono",
          "fechaVencimientoPermiso",
          "estadoPermiso",
        ],
      });

      // Filtrar usuarios con permisos próximos a vencer
      const usuariosANotificar = usuarios.filter((u) => {
        if (!u.fechaVencimientoPermiso || !u.telefono) return false;
        const fechaVencimiento = new Date(u.fechaVencimientoPermiso);
        return fechaVencimiento >= hoy && fechaVencimiento <= fechaLimite;
      });

      if (usuariosANotificar.length === 0) {
        res.status(200).json({
          status: "success",
          message: "No hay permisos próximos a vencer",
          data: {
            resumen: {
              total: 0,
              enviados: 0,
              fallidos: 0,
            },
          },
        });
        return;
      }

      // Enviar alerta a cada usuario
      const resultados = [];
      for (const usuario of usuariosANotificar) {
        const fechaVencimiento = new Date(usuario.fechaVencimientoPermiso!);
        const diasRestantes = Math.ceil(
          (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        );

        const resultado = await whatsappService.enviarAlertaPermiso(
          usuario,
          diasRestantes
        );
        resultados.push(resultado);

        // Pequeña pausa entre mensajes
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const enviados = resultados.filter((r) => r.success).length;
      const fallidos = resultados.filter((r) => !r.success).length;

      res.status(200).json({
        status: "success",
        message: "Alertas de permisos enviadas",
        data: {
          resumen: {
            total: usuariosANotificar.length,
            enviados,
            fallidos,
          },
          resultados,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al enviar alertas de permisos");
      res.status(500).json({
        status: "error",
        message: "Error al enviar alertas de permisos",
      });
    }
  }

  /**
   * Obtiene las plantillas de mensajes disponibles
   * GET /api/notificaciones/plantillas
   */
  public static async obtenerPlantillas(
    _req: Request,
    res: Response
  ): Promise<void> {
    try {
      const plantillas = whatsappService.obtenerPlantillas();

      res.status(200).json({
        status: "success",
        message: "Plantillas de notificaciones obtenidas",
        data: {
          plantillas,
          total: plantillas.length,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al obtener plantillas");
      res.status(500).json({
        status: "error",
        message: "Error al obtener plantillas",
      });
    }
  }

  /**
   * Verifica el estado de un mensaje enviado
   * GET /api/notificaciones/estado/:messageSid
   */
  public static async verificarEstadoMensaje(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const messageSid = req.params["messageSid"];

      if (!messageSid) {
        res.status(400).json({
          status: "error",
          message: "Message SID es requerido",
        });
        return;
      }

      logger.info({ messageSid }, "Verificando estado de mensaje");

      const resultado = await whatsappService.verificarEstadoMensaje(
        messageSid
      );

      if (resultado.error) {
        res.status(400).json({
          status: "error",
          message: "Error al verificar estado del mensaje",
          error: resultado.error,
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Estado del mensaje obtenido",
        data: {
          message_sid: messageSid,
          estado: resultado.estado,
          fecha_actualizacion: resultado.fecha_actualizacion,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al verificar estado del mensaje");
      res.status(500).json({
        status: "error",
        message: "Error al verificar estado del mensaje",
      });
    }
  }

  /**
   * Envía mensaje de prueba (solo en desarrollo)
   * POST /api/notificaciones/test
   */
  public static async enviarPrueba(req: Request, res: Response): Promise<void> {
    try {
      // Solo permitir en desarrollo
      if (process.env["NODE_ENV"] === "production") {
        res.status(403).json({
          status: "error",
          message: "Endpoint de prueba no disponible en producción",
        });
        return;
      }

      const { telefono } = req.body;

      if (!telefono) {
        res.status(400).json({
          status: "error",
          message: "Se requiere número de teléfono",
        });
        return;
      }

      const mensaje =
        `🧪 *MENSAJE DE PRUEBA*\n\n` +
        `Este es un mensaje de prueba del sistema de notificaciones de Isla Lobos.\n\n` +
        `Si recibes este mensaje, la integración con WhatsApp está funcionando correctamente. ✅\n\n` +
        `_Sistema CONANP - Isla Lobos_`;

      const resultado = await whatsappService.enviarMensaje(
        telefono,
        mensaje,
        TipoNotificacion.RECORDATORIO_GENERICO
      );

      res.status(200).json({
        status: "success",
        message: "Mensaje de prueba enviado",
        data: {
          notificacion: resultado,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al enviar mensaje de prueba");
      res.status(500).json({
        status: "error",
        message: "Error al enviar mensaje de prueba",
      });
    }
  }
}

export default NotificacionController;
