import { Request, Response } from "express";
import Invitacion from "../models/Invitacion";
import User from "../models/User";
import { Op } from "sequelize";
import { createLogger } from "../utils/logger";
import emailService from "../services/emailService";
import { EmailInvitacionData, UserRole } from "../types";

const logger = createLogger("InvitacionController");
import { getCurrentMexicoTime } from "../utils/dateUtils";

/**
 * InvitacionController - Gestión de códigos de invitación
 *
 * Funcionalidades:
 * - Generar códigos de invitación
 * - Validar códigos de invitación
 * - Marcar códigos como usados
 * - Listar invitaciones disponibles
 * - Estadísticas de invitaciones
 */
class InvitacionController {
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
   * Formatea una invitación para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearInvitacionParaRespuesta(invitacion: any): any {
    const invitacionFormateada = { ...invitacion };
    if (invitacionFormateada.expira_en) {
      invitacionFormateada.expira_en = InvitacionController.extraerSoloFecha(
        invitacionFormateada.expira_en
      );
    }
    return invitacionFormateada;
  }

  /**
   * Formatea múltiples invitaciones para respuesta
   */
  private static formatearInvitacionesParaRespuesta(
    invitaciones: any[]
  ): any[] {
    return invitaciones.map((invitacion) =>
      InvitacionController.formatearInvitacionParaRespuesta(
        invitacion.toJSON ? invitacion.toJSON() : invitacion
      )
    );
  }

  /**
   * Obtener todas las invitaciones
   * GET /api/invitaciones
   */
  static async getAllInvitaciones(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, usada, creada_por } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Filtros opcionales
      if (usada !== undefined) {
        whereClause.usada = usada === "true";
      }

      if (creada_por) {
        whereClause.creada_por = creada_por;
      }

      const { count, rows: invitaciones } = await Invitacion.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: Number(limit),
        offset,
      });

      const totalPages = Math.ceil(count / Number(limit));

      // Formatear invitaciones con fechas en YYYY-MM-DD
      const invitacionesFormateadas =
        InvitacionController.formatearInvitacionesParaRespuesta(invitaciones);

      res.status(200).json({
        status: "success",
        message: "Invitaciones obtenidas exitosamente",
        data: {
          invitaciones: invitacionesFormateadas,
          pagination: {
            current_page: Number(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: Number(limit),
            has_next: Number(page) < totalPages,
            has_prev: Number(page) > 1,
          },
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener invitaciones:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener invitación por ID
   * GET /api/invitaciones/:id
   */
  static async getInvitacionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invitacion = await Invitacion.findByPk(id, {
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
          {
            model: User,
            as: "usuario",
            attributes: ["id", "nombre", "email"],
            required: false,
          },
        ],
      });

      if (!invitacion) {
        res.status(404).json({
          status: "error",
          message: "Invitación no encontrada",
          error: "INVITACION_NOT_FOUND",
        });
        return;
      }

      // Formatear invitación con fechas en YYYY-MM-DD
      const invitacionFormateada =
        InvitacionController.formatearInvitacionParaRespuesta(
          invitacion.toJSON()
        );

      res.status(200).json({
        status: "success",
        message: "Invitación obtenida exitosamente",
        data: { invitacion: invitacionFormateada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener invitación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Crear nueva invitación
   * POST /api/invitaciones
   */
  static async createInvitacion(req: Request, res: Response): Promise<void> {
    try {
      const { codigo, fecha_expiracion, email, nombre, rol } = req.body;
      const creada_por = (req as any).user.id;

      // Verificar que el código no exista
      const invitacionExistente = await Invitacion.findOne({
        where: { codigo },
      });

      if (invitacionExistente) {
        res.status(400).json({
          status: "error",
          message: "El código de invitación ya existe",
          error: "INVITACION_CODE_EXISTS",
        });
        return;
      }

      // Crear la invitación
      const invitacion = await Invitacion.create({
        codigo,
        email: email || null, // Email del destinatario (opcional)
        rol: (rol as UserRole) || UserRole.PRESTADOR, // Rol del invitado
        expira_en: fecha_expiracion
          ? (typeof fecha_expiracion === 'string' ? fecha_expiracion : fecha_expiracion.toISOString().split('T')[0])
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días por defecto
        creada_por,
        usada: false,
      });

      // Obtener la invitación creada con información del creador
      const invitacionCreada = await Invitacion.findByPk(invitacion.id, {
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      // Formatear invitación con fechas en YYYY-MM-DD
      const invitacionFormateada =
        InvitacionController.formatearInvitacionParaRespuesta(
          invitacionCreada?.toJSON()
        );

      // Enviar email de invitación si se proporcionó email
      let emailEnviado = false;
      if (email && nombre) {
        try {
          const fechaExpiracion = invitacion.expira_en;
          const fechaExpiracionStr = typeof fechaExpiracion === 'string' 
            ? fechaExpiracion 
            : (typeof fechaExpiracion === 'object' && fechaExpiracion !== null && 'toISOString' in fechaExpiracion)
            ? (fechaExpiracion as Date).toISOString().split('T')[0]
            : String(fechaExpiracion).split('T')[0];
          const hoyStr = new Date().toISOString().split('T')[0];
          const fechaExpiracionDate = new Date(fechaExpiracionStr + 'T12:00:00');
          const hoyDate = new Date(hoyStr + 'T12:00:00');
          const diasExpiracion = Math.ceil(
            (fechaExpiracionDate.getTime() - hoyDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const urlInvitacion = `${process.env["FRONTEND_URL"]}/registro?codigo=${codigo}`;

          const datosInvitacion: EmailInvitacionData = {
            nombre,
            email,
            codigo_invitacion: codigo,
            rol: (rol as UserRole) || UserRole.PRESTADOR,
            url_invitacion: urlInvitacion,
            expiracion_dias: diasExpiracion,
          };

          const resultadoEmail = await emailService.enviarInvitacion(
            datosInvitacion
          );
          emailEnviado = resultadoEmail.success;

          if (emailEnviado) {
            logger.info(
              { email, codigo, messageId: resultadoEmail.message_id },
              "✅ Email de invitación enviado exitosamente"
            );
          } else {
            logger.warn(
              { email, codigo, error: resultadoEmail.error },
              "⚠️ Error al enviar email de invitación"
            );
          }
        } catch (emailError) {
          logger.error(
            { email, codigo, error: emailError },
            "❌ Error al enviar email de invitación"
          );
        }
      }

      res.status(201).json({
        status: "success",
        message: emailEnviado
          ? "Invitación creada y email enviado exitosamente"
          : "Invitación creada exitosamente",
        data: {
          invitacion: invitacionFormateada,
          email_enviado: emailEnviado,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al crear invitación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Actualizar invitación
   * PUT /api/invitaciones/:id
   */
  static async updateInvitacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fecha_expiracion } = req.body;

      const invitacion = await Invitacion.findByPk(id);

      if (!invitacion) {
        res.status(404).json({
          status: "error",
          message: "Invitación no encontrada",
          error: "INVITACION_NOT_FOUND",
        });
        return;
      }

      // No permitir actualizar invitaciones ya usadas
      if (invitacion.usada) {
        res.status(400).json({
          status: "error",
          message: "No se puede actualizar una invitación ya utilizada",
          error: "INVITACION_ALREADY_USED",
        });
        return;
      }

      // Actualizar campos permitidos
      await invitacion.update({
        expira_en: fecha_expiracion
          ? (typeof fecha_expiracion === 'string' ? fecha_expiracion : fecha_expiracion.toISOString().split('T')[0])
          : invitacion.expira_en,
      });

      // Obtener la invitación actualizada
      const invitacionActualizada = await Invitacion.findByPk(id, {
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      // Formatear invitación con fechas en YYYY-MM-DD
      const invitacionFormateada =
        InvitacionController.formatearInvitacionParaRespuesta(
          invitacionActualizada?.toJSON()
        );

      res.status(200).json({
        status: "success",
        message: "Invitación actualizada exitosamente",
        data: { invitacion: invitacionFormateada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al actualizar invitación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Eliminar invitación
   * DELETE /api/invitaciones/:id
   */
  static async deleteInvitacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const invitacion = await Invitacion.findByPk(id);

      if (!invitacion) {
        res.status(404).json({
          status: "error",
          message: "Invitación no encontrada",
          error: "INVITACION_NOT_FOUND",
        });
        return;
      }

      // No permitir eliminar invitaciones ya usadas
      if (invitacion.usada) {
        res.status(400).json({
          status: "error",
          message: "No se puede eliminar una invitación ya utilizada",
          error: "INVITACION_ALREADY_USED",
        });
        return;
      }

      await invitacion.destroy();

      res.status(200).json({
        status: "success",
        message: "Invitación eliminada exitosamente",
      });
    } catch (error) {
      logger.error({ err: error }, "Error al eliminar invitación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Validar código de invitación
   * POST /api/invitaciones/validar
   */
  static async validarCodigo(req: Request, res: Response): Promise<void> {
    try {
      const { codigo } = req.body;

      const invitacion = await Invitacion.findOne({
        where: { codigo },
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      if (!invitacion) {
        res.status(404).json({
          status: "error",
          message: "Código de invitación no válido",
          error: "INVALID_INVITATION_CODE",
        });
        return;
      }

      // Verificar si ya fue usada
      if (invitacion.usada) {
        res.status(400).json({
          status: "error",
          message: "El código de invitación ya ha sido utilizado",
          error: "INVITATION_ALREADY_USED",
        });
        return;
      }

      // Verificar si ha expirado
      const ahora = getCurrentMexicoTime();
      const ahoraStr = ahora.toISOString().split('T')[0];
      const expiraEnStr = typeof invitacion.expira_en === 'string' 
        ? invitacion.expira_en 
        : (invitacion.expira_en as Date).toISOString().split('T')[0];
      if (invitacion.expira_en && expiraEnStr && ahoraStr && expiraEnStr < ahoraStr) {
        res.status(400).json({
          status: "error",
          message: "El código de invitación ha expirado",
          error: "INVITATION_EXPIRED",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Código de invitación válido",
        data: {
          invitacion: {
            id: invitacion.id,
            codigo: invitacion.codigo,
            email: invitacion.email,
            rol: invitacion.rol,
            creada_por: invitacion.creada_por,
            expira_en: InvitacionController.extraerSoloFecha(
              invitacion.expira_en
            ),
          },
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al validar código:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Marcar invitación como usada
   * POST /api/invitaciones/:id/usar
   */
  static async usarInvitacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const invitacion = await Invitacion.findByPk(id);

      if (!invitacion) {
        res.status(404).json({
          status: "error",
          message: "Invitación no encontrada",
          error: "INVITACION_NOT_FOUND",
        });
        return;
      }

      // Verificar si ya fue usada
      if (invitacion.usada) {
        res.status(400).json({
          status: "error",
          message: "La invitación ya ha sido utilizada",
          error: "INVITATION_ALREADY_USED",
        });
        return;
      }

      // Verificar si ha expirado
      const ahora = getCurrentMexicoTime();
      const ahoraStr = ahora.toISOString().split('T')[0];
      const expiraEnStr = typeof invitacion.expira_en === 'string' 
        ? invitacion.expira_en 
        : (invitacion.expira_en as Date).toISOString().split('T')[0];
      if (invitacion.expira_en && expiraEnStr && ahoraStr && expiraEnStr < ahoraStr) {
        res.status(400).json({
          status: "error",
          message: "La invitación ha expirado",
          error: "INVITATION_EXPIRED",
        });
        return;
      }

      // Marcar como usada
      await invitacion.update({
        usada: true,
        email: email || null, // Usar el email proporcionado
      });

      // Obtener la invitación actualizada
      const invitacionActualizada = await Invitacion.findByPk(id, {
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
          {
            model: User,
            as: "usuario",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      // Formatear invitación con fechas en YYYY-MM-DD
      const invitacionFormateada =
        InvitacionController.formatearInvitacionParaRespuesta(
          invitacionActualizada?.toJSON()
        );

      res.status(200).json({
        status: "success",
        message: "Invitación marcada como usada exitosamente",
        data: { invitacion: invitacionFormateada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al usar invitación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estadísticas de invitaciones
   * GET /api/invitaciones/estadisticas
   */
  static async getEstadisticas(_req: Request, res: Response): Promise<void> {
    try {
      const ahora = getCurrentMexicoTime();

      // Estadísticas generales
      const totalInvitaciones = await Invitacion.count();
      const invitacionesUsadas = await Invitacion.count({
        where: { usada: true },
      });
      const invitacionesDisponibles = await Invitacion.count({
        where: { usada: false },
      });
      const invitacionesExpiradas = await Invitacion.count({
        where: {
          expira_en: {
            [Op.lt]: ahora,
          },
          usada: false,
        },
      });

      // Invitaciones creadas este mes (simplificado)
      const invitacionesEsteMes = await Invitacion.count();

      // Invitaciones usadas este mes (simplificado)
      const invitacionesUsadasEsteMes = invitacionesUsadas;

      // Top creadores de invitaciones
      const topCreadores = await Invitacion.findAll({
        attributes: [
          "creada_por",
          [
            Invitacion.sequelize!.fn(
              "COUNT",
              Invitacion.sequelize!.col("Invitacion.id")
            ),
            "total_creadas",
          ],
        ],
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
        ],
        group: ["creada_por", "creador.id", "creador.nombre", "creador.email"],
        order: [
          [
            Invitacion.sequelize!.fn(
              "COUNT",
              Invitacion.sequelize!.col("Invitacion.id")
            ),
            "DESC",
          ],
        ],
        limit: 5,
      });

      const estadisticas = {
        generales: {
          total: totalInvitaciones,
          usadas: invitacionesUsadas,
          disponibles: invitacionesDisponibles,
          expiradas: invitacionesExpiradas,
          porcentaje_usadas:
            totalInvitaciones > 0
              ? Math.round((invitacionesUsadas / totalInvitaciones) * 100)
              : 0,
        },
        este_mes: {
          creadas: invitacionesEsteMes,
          usadas: invitacionesUsadasEsteMes,
        },
        top_creadores: topCreadores.map((item: any) => ({
          creador: item.creador,
          total_creadas: Number(item.dataValues.total_creadas),
        })),
      };

      res.status(200).json({
        status: "success",
        message: "Estadísticas de invitaciones obtenidas exitosamente",
        data: { estadisticas },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener estadísticas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Validar código de invitación por GET (para frontend)
   * GET /api/invitaciones/validar/:codigo
   */
  static async validarCodigoPorGet(req: Request, res: Response): Promise<void> {
    try {
      const { codigo } = req.params;

      const invitacion = await Invitacion.findOne({
        where: { codigo },
        include: [
          {
            model: User,
            as: "creador",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      if (!invitacion) {
        res.status(404).json({
          status: "error",
          message: "Código de invitación no encontrado",
          error: "INVALID_INVITATION_CODE",
          data: {
            valida: false,
            razon: "Código no existe",
          },
        });
        return;
      }

      // Verificar si ya fue usada
      if (invitacion.usada) {
        res.status(200).json({
          status: "error",
          message: "El código de invitación ya ha sido utilizado",
          error: "INVITATION_ALREADY_USED",
          data: {
            valida: false,
            razon: "Ya utilizada",
            invitacion: {
              id: invitacion.id,
              codigo: invitacion.codigo,
              email: invitacion.email,
              rol: invitacion.rol,
              expira_en: InvitacionController.extraerSoloFecha(
                invitacion.expira_en
              ),
              usada: invitacion.usada,
            },
          },
        });
        return;
      }

      // Verificar si ha expirado
      const ahora = getCurrentMexicoTime();
      const ahoraStr = ahora.toISOString().split('T')[0];
      const expiraEnStr = typeof invitacion.expira_en === 'string' 
        ? invitacion.expira_en 
        : (invitacion.expira_en as Date).toISOString().split('T')[0];
      if (invitacion.expira_en && expiraEnStr && ahoraStr && expiraEnStr < ahoraStr) {
        res.status(200).json({
          status: "error",
          message: "El código de invitación ha expirado",
          error: "INVITATION_EXPIRED",
          data: {
            valida: false,
            razon: "Expirada",
            invitacion: {
              id: invitacion.id,
              codigo: invitacion.codigo,
              email: invitacion.email,
              rol: invitacion.rol,
              expira_en: InvitacionController.extraerSoloFecha(
                invitacion.expira_en
              ),
              usada: invitacion.usada,
            },
          },
        });
        return;
      }

      // Código válido
      res.status(200).json({
        status: "success",
        message: "Código de invitación válido",
        data: {
          valida: true,
          invitacion: {
            id: invitacion.id,
            codigo: invitacion.codigo,
            email: invitacion.email,
            rol: invitacion.rol,
            creada_por: invitacion.creada_por,
            expira_en: InvitacionController.extraerSoloFecha(
              invitacion.expira_en
            ),
            usada: invitacion.usada,
            creador: (invitacion as any).creador,
          },
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al validar código por GET:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

export default InvitacionController;
