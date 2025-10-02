import { Request, Response } from "express";
import Invitacion from "../models/Invitacion";
import User from "../models/User";
import { Op } from "sequelize";
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
          {
            model: User,
            as: "usuario",
            attributes: ["id", "nombre", "email"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: Number(limit),
        offset,
      });

      const totalPages = Math.ceil(count / Number(limit));

      res.status(200).json({
        status: "success",
        message: "Invitaciones obtenidas exitosamente",
        data: {
          invitaciones,
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
      console.error("Error al obtener invitaciones:", error);
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

      res.status(200).json({
        status: "success",
        message: "Invitación obtenida exitosamente",
        data: { invitacion },
      });
    } catch (error) {
      console.error("Error al obtener invitación:", error);
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
      const { codigo, fecha_expiracion } = req.body;
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
        email: null, // Se llenará cuando se use la invitación
        rol: "prestador" as any, // Por defecto para prestadores
        expira_en: fecha_expiracion
          ? new Date(fecha_expiracion)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
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

      res.status(201).json({
        status: "success",
        message: "Invitación creada exitosamente",
        data: { invitacion: invitacionCreada },
      });
    } catch (error) {
      console.error("Error al crear invitación:", error);
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
          ? new Date(fecha_expiracion)
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

      res.status(200).json({
        status: "success",
        message: "Invitación actualizada exitosamente",
        data: { invitacion: invitacionActualizada },
      });
    } catch (error) {
      console.error("Error al actualizar invitación:", error);
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
      console.error("Error al eliminar invitación:", error);
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
      if (invitacion.expira_en && invitacion.expira_en < ahora) {
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
            expira_en: invitacion.expira_en,
          },
        },
      });
    } catch (error) {
      console.error("Error al validar código:", error);
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
      if (invitacion.expira_en && invitacion.expira_en < ahora) {
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

      res.status(200).json({
        status: "success",
        message: "Invitación marcada como usada exitosamente",
        data: { invitacion: invitacionActualizada },
      });
    } catch (error) {
      console.error("Error al usar invitación:", error);
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
            Invitacion.sequelize!.fn("COUNT", Invitacion.sequelize!.col("id")),
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
            Invitacion.sequelize!.fn("COUNT", Invitacion.sequelize!.col("id")),
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
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

export default InvitacionController;
