import { Request, Response } from "express";
import { createLogger } from "../utils/logger";
import emailService from "../services/emailService";
import User from "../models/User";
import {
  TipoEmail,
  EmailAlertaClimaData,
  EstadoPuerto,
  UserRole,
} from "../types";

const logger = createLogger("EmailController");

/**
 * Controlador para gestionar el envío de correos electrónicos
 * Solo usuarios CONANP pueden enviar emails masivos
 */
class EmailController {
  /**
   * Verifica el estado del servicio de Email
   * GET /api/emails/estado
   */
  public static async verificarEstado(
    _req: Request,
    res: Response
  ): Promise<void> {
    try {
      const isReady = emailService.isReady();

      if (isReady) {
        // Verificar conexión SMTP
        const conexion = await emailService.verificarConexion();

        res.status(200).json({
          status: "success",
          message: conexion.success
            ? "Servicio de Email configurado y conectado"
            : "Servicio configurado pero con problemas de conexión",
          data: {
            configurado: isReady,
            conectado: conexion.success,
            proveedor: "Nodemailer",
            error: conexion.error,
          },
        });
      } else {
        res.status(200).json({
          status: "success",
          message: "Servicio de Email no configurado",
          data: {
            configurado: false,
            conectado: false,
            proveedor: "Nodemailer",
          },
        });
      }
    } catch (error) {
      logger.error({ error }, "Error al verificar estado del servicio");
      res.status(500).json({
        status: "error",
        message: "Error al verificar estado del servicio de Email",
      });
    }
  }

  /**
   * Envía un email individual
   * POST /api/emails/enviar
   */
  public static async enviarEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, asunto, mensaje, tipo, html } = req.body;

      logger.info({ email, tipo, asunto }, "Enviando email individual");

      const resultado = await emailService.enviarEmail(
        email,
        asunto,
        mensaje,
        tipo || TipoEmail.NOTIFICACION_GENERAL,
        html || false
      );

      if (resultado.success) {
        res.status(200).json({
          status: "success",
          message: "Email enviado exitosamente",
          data: {
            email_info: resultado,
          },
        });
      } else {
        res.status(500).json({
          status: "error",
          message: "Error al enviar email",
          error: resultado.error,
        });
      }
    } catch (error) {
      logger.error({ error }, "Error al enviar email");
      res.status(500).json({
        status: "error",
        message: "Error al procesar solicitud de email",
      });
    }
  }

  /**
   * Envía emails masivos a múltiples usuarios
   * POST /api/emails/enviar-masivo
   */
  public static async enviarEmailMasivo(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { usuarios_ids, asunto, mensaje, tipo, html } = req.body;

      logger.info(
        { total_usuarios: usuarios_ids.length, tipo },
        "Enviando emails masivos"
      );

      // Obtener usuarios con email
      const usuarios = await User.findAll({
        where: {
          id: usuarios_ids,
        },
        attributes: ["id", "nombre", "email"],
      });

      const emails = usuarios
        .filter((u) => u.email && u.email.length > 0)
        .map((u) => u.email as string);

      if (emails.length === 0) {
        res.status(400).json({
          status: "error",
          message: "Ninguno de los usuarios tiene email registrado",
        });
        return;
      }

      const resultado = await emailService.enviarMasivo(
        emails,
        asunto,
        mensaje,
        tipo || TipoEmail.NOTIFICACION_GENERAL,
        html || false
      );

      res.status(200).json({
        status: "success",
        message: "Emails masivos procesados",
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
      logger.error({ error }, "Error al enviar emails masivos");
      res.status(500).json({
        status: "error",
        message: "Error al procesar emails masivos",
      });
    }
  }

  /**
   * Envía alerta de clima a todos los prestadores activos
   * POST /api/emails/alerta-clima
   */
  public static async enviarAlertaClima(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { estado_puerto, oleaje, viento_velocidad, mensaje_adicional, fecha } =
        req.body;

      logger.info({ estado_puerto }, "Enviando alerta de clima por email");

      // Obtener todos los prestadores activos con email
      const prestadores = await User.findAll({
        where: {
          rol: UserRole.PRESTADOR,
          activo: true,
        },
        attributes: ["id", "nombre", "email"],
      });

      const emails = prestadores
        .filter((p) => p.email && p.email.length > 0)
        .map((p) => p.email as string);

      if (emails.length === 0) {
        res.status(400).json({
          status: "error",
          message: "No hay prestadores activos con email registrado",
        });
        return;
      }

      const datosAlerta: EmailAlertaClimaData = {
        estado_puerto: estado_puerto as EstadoPuerto,
        oleaje: parseFloat(oleaje),
        viento_velocidad: parseFloat(viento_velocidad),
        mensaje_adicional,
        fecha,
      };

      // Enviar alerta a cada prestador
      const resultados = [];
      for (const email of emails) {
        const resultado = await emailService.enviarAlertaClima(
          email,
          datosAlerta
        );
        resultados.push(resultado);

        // Pequeña pausa entre emails
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const enviados = resultados.filter((r) => r.success).length;
      const fallidos = resultados.filter((r) => !r.success).length;

      res.status(200).json({
        status: "success",
        message: "Alerta de clima enviada por email a prestadores",
        data: {
          resumen: {
            total: emails.length,
            enviados,
            fallidos,
          },
          resultados,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al enviar alerta de clima por email");
      res.status(500).json({
        status: "error",
        message: "Error al enviar alerta de clima",
      });
    }
  }

  /**
   * Envía alertas de permisos próximos a vencer
   * POST /api/emails/alerta-permisos
   */
  public static async enviarAlertaPermisos(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { dias_anticipacion } = req.body;
      const dias = parseInt(dias_anticipacion) || 30;

      logger.info({ dias }, "Enviando alertas de permisos por email");

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
          "email",
          "fechaVencimientoPermiso",
          "estadoPermiso",
        ],
      });

      // Filtrar usuarios con permisos próximos a vencer
      const usuariosANotificar = usuarios.filter((u) => {
        if (!u.fechaVencimientoPermiso || !u.email) return false;
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

        const resultado = await emailService.enviarAlertaPermiso(
          usuario,
          diasRestantes
        );
        resultados.push(resultado);

        // Pequeña pausa entre emails
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const enviados = resultados.filter((r) => r.success).length;
      const fallidos = resultados.filter((r) => !r.success).length;

      res.status(200).json({
        status: "success",
        message: "Alertas de permisos enviadas por email",
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
      logger.error({ error }, "Error al enviar alertas de permisos por email");
      res.status(500).json({
        status: "error",
        message: "Error al enviar alertas de permisos",
      });
    }
  }

  /**
   * Obtiene las plantillas de emails disponibles
   * GET /api/emails/plantillas
   */
  public static async obtenerPlantillas(
    _req: Request,
    res: Response
  ): Promise<void> {
    try {
      const plantillas = emailService.obtenerPlantillas();

      res.status(200).json({
        status: "success",
        message: "Plantillas de emails obtenidas",
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
   * Envía email de prueba (solo en desarrollo)
   * POST /api/emails/test
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

      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          status: "error",
          message: "Se requiere email",
        });
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00796b; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { background-color: #f5f5f5; padding: 20px; margin-top: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Mensaje de Prueba</h1>
            </div>
            <div class="content">
              <p>Este es un mensaje de prueba del sistema de emails de Isla Lobos.</p>
              <p>Si recibes este mensaje, la integración con Nodemailer está funcionando correctamente. ✅</p>
              <p><strong>Sistema CONANP - Isla de Lobos</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const resultado = await emailService.enviarEmail(
        email,
        "🧪 Prueba - Sistema de Emails Isla de Lobos",
        htmlContent,
        TipoEmail.NOTIFICACION_GENERAL,
        true
      );

      res.status(200).json({
        status: "success",
        message: "Email de prueba enviado",
        data: {
          email_info: resultado,
        },
      });
    } catch (error) {
      logger.error({ error }, "Error al enviar email de prueba");
      res.status(500).json({
        status: "error",
        message: "Error al enviar email de prueba",
      });
    }
  }
}

export default EmailController;

