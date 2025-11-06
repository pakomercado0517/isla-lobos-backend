import { Request, Response } from "express";
import Embarcacion from "../models/Embarcacion";
import User from "../models/User";
import { Op } from "sequelize";
import { createLogger } from "../utils/logger";
import dashboardNotificationService from "../services/dashboardNotificationService";
import {
  TipoNotificacionDashboard,
  PrioridadNotificacionDashboard,
  EstadoEmbarcacion,
} from "../types";
import { AuthRequest } from "../middleware/auth";

const logger = createLogger("EmbarcacionController");

/**
 * EmbarcacionController - Gestión de embarcaciones
 *
 * Funcionalidades:
 * - CRUD completo de embarcaciones
 * - Filtros por estado, tipo y prestador
 * - Validaciones de negocio
 * - Gestión de capacidad
 */
class EmbarcacionController {
  /**
   * Obtener todas las embarcaciones con filtros opcionales
   * GET /api/embarcaciones
   */
  static async getAllEmbarcaciones(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, estado, tipo, prestador_id } = req.query;

      // Construir filtros
      const where: any = {};

      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }

      // Filtro por tipo
      if (tipo) {
        where.tipo = tipo;
      }

      // Filtro por prestador
      if (prestador_id) {
        where.prestador_id = prestador_id;
      }

      // Nota: El modelo actual no tiene campo 'activo', se puede implementar en el futuro

      // Paginación
      const offset = (Number(page) - 1) * Number(limit);

      // Obtener embarcaciones con información del prestador
      const { count, rows: embarcaciones } = await Embarcacion.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      // Calcular estadísticas básicas
      const estadisticas = {
        total: count,
        disponibles: await Embarcacion.count({
          where: { ...where, estado: "disponible" },
        }),
        en_uso: await Embarcacion.count({
          where: { ...where, estado: "en_uso" },
        }),
        mantenimiento: await Embarcacion.count({
          where: { ...where, estado: "mantenimiento" },
        }),
        menor: await Embarcacion.count({ where: { ...where, tipo: "menor" } }),
        mayor: await Embarcacion.count({ where: { ...where, tipo: "mayor" } }),
      };

      res.status(200).json({
        status: "success",
        message: "Embarcaciones obtenidas exitosamente",
        data: {
          embarcaciones,
          estadisticas,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener embarcaciones:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener una embarcación específica por ID
   * GET /api/embarcaciones/:id
   */
  static async getEmbarcacionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const embarcacion = await Embarcacion.findByPk(id, {
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
        ],
      });

      if (!embarcacion) {
        res.status(404).json({
          status: "error",
          message: "Embarcación no encontrada",
          error: "EMBARCACION_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Embarcación obtenida exitosamente",
        data: { embarcacion },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener embarcación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Crear una nueva embarcación
   * POST /api/embarcaciones
   */
  static async createEmbarcacion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        nombre,
        matricula,
        capacidad,
        tipo,
        estado,
        prestador_id,
      } = req.body;

      // Verificar que el prestador existe y es válido
      const prestador = await User.findByPk(prestador_id);
      if (!prestador) {
        res.status(404).json({
          status: "error",
          message: "Prestador no encontrado",
          error: "PRESTADOR_NOT_FOUND",
        });
        return;
      }

      if (prestador.rol !== "prestador") {
        res.status(400).json({
          status: "error",
          message: "El usuario debe ser un prestador",
          error: "INVALID_USER_ROLE",
        });
        return;
      }

      // Determinar el estado: si no viene estado, o si el usuario autenticado es prestador,
      // la embarcación debe crearse como pendiente_autorizacion
      const usuarioAutenticado = req.user;
      const estadoFinal =
        estado ||
        (usuarioAutenticado?.rol === "prestador"
          ? EstadoEmbarcacion.PENDIENTE_AUTORIZACION
          : EstadoEmbarcacion.DISPONIBLE);

      // Verificar que la matrícula no esté duplicada
      const embarcacionExistente = await Embarcacion.findOne({
        where: { matricula },
      });

      if (embarcacionExistente) {
        res.status(409).json({
          status: "error",
          message: "Ya existe una embarcación con esa matrícula",
          error: "EMBARCACION_ALREADY_EXISTS",
        });
        return;
      }

      // Crear la embarcación
      const nuevaEmbarcacion = await Embarcacion.create({
        nombre,
        matricula,
        capacidad,
        tipo,
        estado: estadoFinal,
        prestador_id,
      });

      // Obtener la embarcación con información del prestador
      const embarcacionCompleta = await Embarcacion.findByPk(
        nuevaEmbarcacion.id,
        {
          include: [
            {
              model: User,
              as: "prestador",
              attributes: ["id", "nombre", "email", "telefono"],
            },
          ],
        }
      );

      // Crear notificación para usuarios CONANP si la embarcación está pendiente de autorización
      if (nuevaEmbarcacion.estado === EstadoEmbarcacion.PENDIENTE_AUTORIZACION) {
        try {
          await dashboardNotificationService.crearNotificacion({
            tipo: TipoNotificacionDashboard.NUEVA_EMBARCACION,
            titulo: "Nueva embarcación pendiente de autorización",
            mensaje: `El prestador ${prestador.nombre} ha registrado una nueva embarcación: ${nombre} (${matricula}) con capacidad para ${capacidad} pasajeros.`,
            usuario_id: null, // Para todos los usuarios CONANP
            enlace: `/embarcaciones/${nuevaEmbarcacion.id}`,
            prioridad: PrioridadNotificacionDashboard.ALTA,
            metadata: {
              embarcacion_id: nuevaEmbarcacion.id,
              prestador_id: prestador.id,
              prestador_nombre: prestador.nombre,
              matricula: matricula,
              capacidad: capacidad,
              tipo: tipo,
            },
          });

          logger.info(
            {
              embarcacion_id: nuevaEmbarcacion.id,
              prestador_id: prestador.id,
            },
            "Notificación creada para nueva embarcación pendiente"
          );
        } catch (notifError) {
          // No fallar la creación de embarcación si falla la notificación
          logger.error(
            { error: notifError, embarcacion_id: nuevaEmbarcacion.id },
            "Error al crear notificación de nueva embarcación"
          );
        }
      }

      res.status(201).json({
        status: "success",
        message: "Embarcación creada exitosamente",
        data: { embarcacion: embarcacionCompleta },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al crear embarcación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Actualizar una embarcación existente
   * PUT /api/embarcaciones/:id
   */
  static async updateEmbarcacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, matricula, capacidad, tipo, estado, prestador_id } =
        req.body;

      const embarcacion = await Embarcacion.findByPk(id);

      if (!embarcacion) {
        res.status(404).json({
          status: "error",
          message: "Embarcación no encontrada",
          error: "EMBARCACION_NOT_FOUND",
        });
        return;
      }

      // Verificar que el prestador existe (si se está cambiando)
      if (prestador_id) {
        const prestador = await User.findByPk(prestador_id);
        if (!prestador) {
          res.status(404).json({
            status: "error",
            message: "Prestador no encontrado",
            error: "PRESTADOR_NOT_FOUND",
          });
          return;
        }

        if (prestador.rol !== "prestador") {
          res.status(400).json({
            status: "error",
            message: "El usuario debe ser un prestador",
            error: "INVALID_USER_ROLE",
          });
          return;
        }
      }

      // Verificar que la matrícula no esté duplicada (si se está cambiando)
      if (matricula && matricula !== embarcacion.matricula) {
        const embarcacionExistente = await Embarcacion.findOne({
          where: {
            matricula,
            id: { [Op.ne]: id },
          },
        });

        if (embarcacionExistente) {
          res.status(409).json({
            status: "error",
            message: "Ya existe otra embarcación con esa matrícula",
            error: "EMBARCACION_ALREADY_EXISTS",
          });
          return;
        }
      }

      // Actualizar la embarcación
      await embarcacion.update({
        ...(nombre && { nombre }),
        ...(matricula && { matricula }),
        ...(capacidad && { capacidad }),
        ...(tipo && { tipo }),
        ...(estado && { estado }),
        ...(prestador_id && { prestador_id }),
      });

      // Obtener la embarcación actualizada con información del prestador
      const embarcacionActualizada = await Embarcacion.findByPk(id, {
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
        ],
      });

      res.status(200).json({
        status: "success",
        message: "Embarcación actualizada exitosamente",
        data: { embarcacion: embarcacionActualizada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al actualizar embarcación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Eliminar una embarcación
   * DELETE /api/embarcaciones/:id
   */
  static async deleteEmbarcacion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const embarcacion = await Embarcacion.findByPk(id);

      if (!embarcacion) {
        res.status(404).json({
          status: "error",
          message: "Embarcación no encontrada",
          error: "EMBARCACION_NOT_FOUND",
        });
        return;
      }

      // Verificar si la embarcación está en uso
      if (embarcacion.estado === "en_uso") {
        res.status(400).json({
          status: "error",
          message: "No se puede eliminar una embarcación que está en uso",
          error: "EMBARCACION_IN_USE",
        });
        return;
      }

      // Eliminar la embarcación
      await embarcacion.destroy();

      res.status(200).json({
        status: "success",
        message: "Embarcación eliminada exitosamente",
      });
    } catch (error) {
      logger.error({ err: error }, "Error al eliminar embarcación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener embarcaciones del prestador autenticado
   * GET /api/embarcaciones/mis-embarcaciones
   */
  static async getMisEmbarcaciones(req: Request, res: Response): Promise<void> {
    try {
      const { id: prestadorId } = req.user!;
      const { page = 1, limit = 10, estado, tipo } = req.query;

      // Construir filtros
      const where: any = {
        prestador_id: prestadorId,
      };

      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }

      // Filtro por tipo
      if (tipo) {
        where.tipo = tipo;
      }

      // Nota: El modelo actual no tiene campo 'activo'

      // Paginación
      const offset = (Number(page) - 1) * Number(limit);

      // Obtener embarcaciones del prestador
      const { count, rows: embarcaciones } = await Embarcacion.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [["nombre", "ASC"]],
      });

      // Calcular estadísticas del prestador
      const estadisticas = {
        total: count,
        disponibles: await Embarcacion.count({
          where: { ...where, estado: "disponible" },
        }),
        en_uso: await Embarcacion.count({
          where: { ...where, estado: "en_uso" },
        }),
        mantenimiento: await Embarcacion.count({
          where: { ...where, estado: "mantenimiento" },
        }),
        menor: await Embarcacion.count({ where: { ...where, tipo: "menor" } }),
        mayor: await Embarcacion.count({ where: { ...where, tipo: "mayor" } }),
      };

      res.status(200).json({
        status: "success",
        message: "Mis embarcaciones obtenidas exitosamente",
        data: {
          embarcaciones,
          estadisticas,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener mis embarcaciones:",
        error
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estadísticas de embarcaciones
   * GET /api/embarcaciones/estadisticas
   */
  static async getEmbarcacionStats(req: Request, res: Response): Promise<void> {
    try {
      const { prestador_id } = req.query;

      // Construir filtros
      const where: any = {};
      if (prestador_id) {
        where.prestador_id = prestador_id;
      }

      // Obtener estadísticas generales
      const totalEmbarcaciones = await Embarcacion.count({ where });
      const embarcacionesDisponibles = await Embarcacion.count({
        where: { ...where, estado: "disponible" },
      });
      const embarcacionesEnUso = await Embarcacion.count({
        where: { ...where, estado: "en_uso" },
      });
      const embarcacionesMantenimiento = await Embarcacion.count({
        where: { ...where, estado: "mantenimiento" },
      });
      const embarcacionesMenor = await Embarcacion.count({
        where: { ...where, tipo: "menor" },
      });
      const embarcacionesMayor = await Embarcacion.count({
        where: { ...where, tipo: "mayor" },
      });
      // Nota: El modelo actual no tiene campo 'activo'

      // Calcular capacidad total
      const embarcaciones = await Embarcacion.findAll({
        where,
        attributes: ["capacidad"],
      });

      const capacidadTotal = embarcaciones.reduce(
        (sum, embarcacion) => sum + embarcacion.capacidad,
        0
      );

      // Estadísticas por estado
      const estadisticasPorEstado = {
        disponible: embarcacionesDisponibles,
        en_uso: embarcacionesEnUso,
        mantenimiento: embarcacionesMantenimiento,
      };

      // Estadísticas por tipo
      const estadisticasPorTipo = {
        menor: embarcacionesMenor,
        mayor: embarcacionesMayor,
      };

      // Nota: Estadísticas de actividad no disponibles sin campo 'activo'

      res.status(200).json({
        status: "success",
        message: "Estadísticas obtenidas exitosamente",
        data: {
          estadisticas: {
            total_embarcaciones: totalEmbarcaciones,
            por_estado: estadisticasPorEstado,
            por_tipo: estadisticasPorTipo,
            capacidad_total: capacidadTotal,
          },
        },
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
}

export default EmbarcacionController;
