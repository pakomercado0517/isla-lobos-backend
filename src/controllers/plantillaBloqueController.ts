import { Request, Response } from "express";
import PlantillaBloque from "../models/PlantillaBloque";
import Bloque from "../models/Bloque";
import { Op } from "sequelize";
import { createLogger } from "../utils/logger";

const logger = createLogger("PlantillaBloqueController");

/**
 * PlantillaBloqueController - Gestión de plantillas de bloques
 *
 * Funcionalidades:
 * - CRUD completo de plantillas
 * - Gestión centralizada de datos maestros de bloques
 * - Actualización que afecta automáticamente todos los bloques derivados
 */
class PlantillaBloqueController {
  /**
   * Obtener todas las plantillas de bloques
   * GET /api/plantillas-bloque?destino=DESTINO_OPCIONAL&activa=true
   */
  static async getAllPlantillas(req: Request, res: Response): Promise<void> {
    try {
      const { destino, activa } = req.query;

      const whereCondition: any = {};

      if (destino) {
        whereCondition.destino = destino;
      }

      if (activa !== undefined) {
        whereCondition.activa = activa === "true";
      }

      const plantillas = await PlantillaBloque.findAll({
        where: whereCondition,
        order: [
          ["destino", "ASC"],
          ["hora_inicio", "ASC"],
        ],
      });

      res.status(200).json({
        status: "success",
        message: "Plantillas obtenidas exitosamente",
        data: {
          plantillas: plantillas.map((p) => p.toJSON()),
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener plantillas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener una plantilla específica por ID
   * GET /api/plantillas-bloque/:id
   */
  static async getPlantillaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const plantilla = await PlantillaBloque.findByPk(id, {
        include: [
          {
            model: Bloque,
            as: "bloques_derivados",
            where: { es_plantilla: true },
            required: false,
            attributes: ["id", "fecha", "estado", "capacidad_registrada"],
          },
        ],
      });

      if (!plantilla) {
        res.status(404).json({
          status: "error",
          message: "Plantilla no encontrada",
          error: "PLANTILLA_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Plantilla obtenida exitosamente",
        data: { plantilla: plantilla.toJSON() },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener plantilla:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Crear nueva plantilla de bloque
   * POST /api/plantillas-bloque
   */
  static async createPlantilla(req: Request, res: Response): Promise<void> {
    try {
      const {
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        destino,
        activa = true,
      } = req.body;

      // Validar que no exista plantilla con mismo nombre y destino
      const plantillaExistente = await PlantillaBloque.findOne({
        where: {
          nombre,
          destino,
        },
      });

      if (plantillaExistente) {
        res.status(409).json({
          status: "error",
          message: "Ya existe una plantilla con ese nombre y destino",
          error: "PLANTILLA_ALREADY_EXISTS",
        });
        return;
      }

      // Validar que hora_fin > hora_inicio
      if (hora_fin <= hora_inicio) {
        res.status(400).json({
          status: "error",
          message: "La hora de fin debe ser mayor que la hora de inicio",
          error: "INVALID_TIME_RANGE",
        });
        return;
      }

      const nuevaPlantilla = await PlantillaBloque.create({
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        destino,
        activa,
      });

      // Recrear bloques para las próximas fechas (hoy y mañana) para que aparezcan inmediatamente
      try {
        const hoy = new Date();
        const manana = new Date();
        manana.setDate(hoy.getDate() + 1);

        // Importar BloqueController dinámicamente para evitar dependencias circulares
        const BloqueController = (await import("./bloqueController")).default;

        // Recrear bloques para hoy y mañana
        await BloqueController["crearBloquesParaFecha"](hoy, destino, true);
        await BloqueController["crearBloquesParaFecha"](manana, destino, true);

        logger.info(
          `Bloques recreados para hoy y mañana después de crear plantilla: ${nuevaPlantilla.nombre}`
        );
      } catch (recreacionError) {
        logger.warn(
          { err: recreacionError },
          "Error al recrear bloques después de crear plantilla (no crítico)"
        );
      }

      res.status(201).json({
        status: "success",
        message: "Plantilla creada exitosamente y bloques actualizados",
        data: { plantilla: nuevaPlantilla.toJSON() },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al crear plantilla:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Actualizar plantilla existente
   * PUT /api/plantillas-bloque/:id
   */
  static async updatePlantilla(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        destino,
        activa,
      } = req.body;

      const plantilla = await PlantillaBloque.findByPk(id);

      if (!plantilla) {
        res.status(404).json({
          status: "error",
          message: "Plantilla no encontrada",
          error: "PLANTILLA_NOT_FOUND",
        });
        return;
      }

      // Validar unicidad si se cambia nombre o destino
      if (nombre || destino) {
        const plantillaExistente = await PlantillaBloque.findOne({
          where: {
            nombre: nombre || plantilla.nombre,
            destino: destino || plantilla.destino,
            id: { [Op.ne]: id },
          },
        });

        if (plantillaExistente) {
          res.status(409).json({
            status: "error",
            message: "Ya existe otra plantilla con ese nombre y destino",
            error: "PLANTILLA_ALREADY_EXISTS",
          });
          return;
        }
      }

      // Validar horarios si se proporcionan
      const horaInicioFinal = hora_inicio || plantilla.hora_inicio;
      const horaFinFinal = hora_fin || plantilla.hora_fin;

      if (horaFinFinal <= horaInicioFinal) {
        res.status(400).json({
          status: "error",
          message: "La hora de fin debe ser mayor que la hora de inicio",
          error: "INVALID_TIME_RANGE",
        });
        return;
      }

      // Actualizar la plantilla
      await plantilla.update({
        ...(nombre && { nombre }),
        ...(hora_inicio && { hora_inicio }),
        ...(hora_fin && { hora_fin }),
        ...(capacidad_total && { capacidad_total }),
        ...(destino && { destino }),
        ...(activa !== undefined && { activa }),
      });

      // Obtener conteo de bloques que se verán afectados
      const bloquesAfectados = await Bloque.count({
        where: {
          plantilla_id: id,
          es_plantilla: true,
        },
      });

      res.status(200).json({
        status: "success",
        message: `Plantilla actualizada exitosamente. ${bloquesAfectados} bloques derivados se verán afectados automáticamente`,
        data: {
          plantilla: plantilla.toJSON(),
          bloques_afectados: bloquesAfectados,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al actualizar plantilla:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Eliminar plantilla de bloque
   * DELETE /api/plantillas-bloque/:id
   */
  static async deletePlantilla(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const plantilla = await PlantillaBloque.findByPk(id);

      if (!plantilla) {
        res.status(404).json({
          status: "error",
          message: "Plantilla no encontrada",
          error: "PLANTILLA_NOT_FOUND",
        });
        return;
      }

      // Verificar si hay bloques que referencian esta plantilla
      const bloquesDerivados = await Bloque.count({
        where: {
          plantilla_id: id,
          es_plantilla: true,
        },
      });

      if (bloquesDerivados > 0) {
        res.status(400).json({
          status: "error",
          message: `No se puede eliminar la plantilla porque tiene ${bloquesDerivados} bloques derivados. Elimine o actualice los bloques primero.`,
          error: "PLANTILLA_HAS_DEPENDENCIES",
        });
        return;
      }

      await plantilla.destroy();

      res.status(200).json({
        status: "success",
        message: "Plantilla eliminada exitosamente",
      });
    } catch (error) {
      logger.error({ err: error }, "Error al eliminar plantilla:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estadísticas de una plantilla
   * GET /api/plantillas-bloque/:id/estadisticas
   */
  static async getEstadisticasPlantilla(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      const plantilla = await PlantillaBloque.findByPk(id);

      if (!plantilla) {
        res.status(404).json({
          status: "error",
          message: "Plantilla no encontrada",
          error: "PLANTILLA_NOT_FOUND",
        });
        return;
      }

      // Contar bloques derivados por estado
      const estadisticasBloques = (await Bloque.findAll({
        where: {
          plantilla_id: id,
          es_plantilla: true,
        },
        attributes: [
          "estado",
          [
            Bloque.sequelize!.fn("COUNT", Bloque.sequelize!.col("id")),
            "cantidad",
          ],
          [
            Bloque.sequelize!.fn(
              "SUM",
              Bloque.sequelize!.col("capacidad_registrada")
            ),
            "capacidad_ocupada",
          ],
        ],
        group: ["estado"],
        raw: true,
      })) as any[];

      const totalBloques = await Bloque.count({
        where: {
          plantilla_id: id,
          es_plantilla: true,
        },
      });

      res.status(200).json({
        status: "success",
        message: "Estadísticas obtenidas exitosamente",
        data: {
          plantilla: plantilla.toJSON(),
          total_bloques_derivados: totalBloques,
          estadisticas_por_estado: estadisticasBloques,
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

export default PlantillaBloqueController;
