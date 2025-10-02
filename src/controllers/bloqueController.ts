import { Request, Response } from "express";
import Bloque from "../models/Bloque";
import Salida from "../models/Salida";
import { Op } from "sequelize";
import { getCurrentMexicoTime } from "../utils/dateUtils";

/**
 * BloqueController - Gestión de bloques horarios
 *
 * Funcionalidades:
 * - CRUD completo de bloques
 * - Filtros por fecha y estado
 * - Estadísticas de capacidad
 * - Validaciones de negocio
 */
class BloqueController {
  /**
   * Obtener bloques disponibles con capacidad
   * Siempre devuelve los 3 bloques predefinidos
   * GET /api/bloques
   */
  static async getAllBloques(req: Request, res: Response): Promise<void> {
    try {
      const { fecha } = req.query;

      // Obtener bloques plantilla predefinidos
      const bloques_plantilla = await Bloque.findAll({
        where: {
          estado: "plantilla",
        },
        order: [["hora_inicio", "ASC"]],
      });

      // Si se proporciona fecha, calcular capacidad ocupada
      const bloquesConCapacidad = await Promise.all(
        bloques_plantilla.map(async (bloque) => {
          let capacidad_registrada = 0;
          let estado_actual = "activo";

          if (fecha) {
            // Contar pasajeros para este bloque en esta fecha
            capacidad_registrada =
              (await Salida.sum("numero_pasajeros", {
                where: {
                  bloque_id: bloque.id,
                  fecha: new Date(fecha as string),
                  estado: {
                    [Op.notIn]: [
                      "cancelada",
                      "cancelada_por_clima",
                      "cancelada_capitaria",
                    ],
                  },
                },
              })) || 0;

            // Determinar estado basado en capacidad
            if (capacidad_registrada >= bloque.capacidad_total) {
              estado_actual = "lleno";
            }
          }

          return {
            id: bloque.id,
            nombre: bloque.nombre,
            hora_inicio: bloque.hora_inicio,
            hora_fin: bloque.hora_fin,
            capacidad_total: bloque.capacidad_total,
            capacidad_registrada,
            capacidad_disponible: bloque.capacidad_total - capacidad_registrada,
            estado: estado_actual,
            fecha: fecha || null,
          };
        })
      );

      res.json({
        status: "success",
        message: "Bloques obtenidos exitosamente",
        data: {
          bloques: bloquesConCapacidad,
        },
      });
    } catch (error) {
      console.error("Error al obtener bloques:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener un bloque específico por ID
   * GET /api/bloques/:id
   */
  static async getBloqueById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const bloque = await Bloque.findByPk(id);

      if (!bloque) {
        res.status(404).json({
          status: "error",
          message: "Bloque no encontrado",
          error: "BLOQUE_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Bloque obtenido exitosamente",
        data: { bloque },
      });
    } catch (error) {
      console.error("Error al obtener bloque:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Crear un nuevo bloque
   * POST /api/bloques
   */
  static async createBloque(req: Request, res: Response): Promise<void> {
    try {
      const {
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        fecha,
        estado = "activo",
      } = req.body;

      // Validar que la fecha no sea en el pasado
      const fechaBloque = new Date(fecha);
      const hoy = getCurrentMexicoTime();
      hoy.setHours(0, 0, 0, 0);

      if (fechaBloque < hoy) {
        res.status(400).json({
          status: "error",
          message: "No se puede crear un bloque para una fecha pasada",
          error: "INVALID_DATE",
        });
        return;
      }

      // Validar que no exista un bloque con el mismo nombre y fecha
      const bloqueExistente = await Bloque.findOne({
        where: {
          nombre,
          fecha: fechaBloque,
        },
      });

      if (bloqueExistente) {
        res.status(409).json({
          status: "error",
          message: "Ya existe un bloque con ese nombre para esa fecha",
          error: "BLOQUE_ALREADY_EXISTS",
        });
        return;
      }

      // Crear el bloque
      const nuevoBloque = await Bloque.create({
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        capacidad_registrada: 0,
        estado,
        fecha: fechaBloque,
      });

      res.status(201).json({
        status: "success",
        message: "Bloque creado exitosamente",
        data: { bloque: nuevoBloque },
      });
    } catch (error) {
      console.error("Error al crear bloque:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Actualizar un bloque existente
   * PUT /api/bloques/:id
   */
  static async updateBloque(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, hora_inicio, hora_fin, capacidad_total, estado, fecha } =
        req.body;

      const bloque = await Bloque.findByPk(id);

      if (!bloque) {
        res.status(404).json({
          status: "error",
          message: "Bloque no encontrado",
          error: "BLOQUE_NOT_FOUND",
        });
        return;
      }

      // Validar que la fecha no sea en el pasado (solo si se está cambiando)
      if (fecha) {
        const fechaBloque = new Date(fecha);
        const hoy = getCurrentMexicoTime();
        hoy.setHours(0, 0, 0, 0);

        if (fechaBloque < hoy) {
          res.status(400).json({
            status: "error",
            message: "No se puede cambiar un bloque a una fecha pasada",
            error: "INVALID_DATE",
          });
          return;
        }
      }

      // Validar que no exista otro bloque con el mismo nombre y fecha
      if (nombre && fecha) {
        const bloqueExistente = await Bloque.findOne({
          where: {
            nombre,
            fecha: new Date(fecha),
            id: { [Op.ne]: id },
          },
        });

        if (bloqueExistente) {
          res.status(409).json({
            status: "error",
            message: "Ya existe otro bloque con ese nombre para esa fecha",
            error: "BLOQUE_ALREADY_EXISTS",
          });
          return;
        }
      }

      // Actualizar el bloque
      await bloque.update({
        ...(nombre && { nombre }),
        ...(hora_inicio && { hora_inicio }),
        ...(hora_fin && { hora_fin }),
        ...(capacidad_total && { capacidad_total }),
        ...(estado && { estado }),
        ...(fecha && { fecha: new Date(fecha) }),
      });

      res.status(200).json({
        status: "success",
        message: "Bloque actualizado exitosamente",
        data: { bloque },
      });
    } catch (error) {
      console.error("Error al actualizar bloque:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Eliminar un bloque
   * DELETE /api/bloques/:id
   */
  static async deleteBloque(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const bloque = await Bloque.findByPk(id);

      if (!bloque) {
        res.status(404).json({
          status: "error",
          message: "Bloque no encontrado",
          error: "BLOQUE_NOT_FOUND",
        });
        return;
      }

      // Verificar si el bloque tiene salidas registradas
      if (bloque.capacidad_registrada > 0) {
        res.status(400).json({
          status: "error",
          message:
            "No se puede eliminar un bloque que tiene salidas registradas",
          error: "BLOQUE_HAS_SALIDAS",
        });
        return;
      }

      // Verificar que la fecha no sea en el pasado
      const hoy = getCurrentMexicoTime();
      hoy.setHours(0, 0, 0, 0);

      if (bloque.fecha && bloque.fecha < hoy) {
        res.status(400).json({
          status: "error",
          message: "No se puede eliminar un bloque de una fecha pasada",
          error: "INVALID_DATE",
        });
        return;
      }

      await bloque.destroy();

      res.status(200).json({
        status: "success",
        message: "Bloque eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar bloque:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estadísticas de capacidad de bloques
   * GET /api/bloques/estadisticas
   */
  static async getBloqueStats(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      // Construir filtros de fecha
      const where: any = {};
      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio as string);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin as string);
        fin.setHours(23, 59, 59, 999);
        where.fecha = {
          [Op.between]: [inicio, fin],
        };
      }

      // Obtener estadísticas generales
      const totalBloques = await Bloque.count({ where });
      const bloquesActivos = await Bloque.count({
        where: { ...where, estado: "activo" },
      });
      const bloquesLlenos = await Bloque.count({
        where: { ...where, estado: "lleno" },
      });
      const bloquesSuspendidos = await Bloque.count({
        where: { ...where, estado: "suspendido_por_clima" },
      });
      const bloquesCerrados = await Bloque.count({
        where: { ...where, estado: "cerrado_capitaria" },
      });

      // Calcular capacidad total y ocupada
      const bloques = await Bloque.findAll({
        where,
        attributes: ["capacidad_total", "capacidad_registrada"],
      });

      const capacidadTotal = bloques.reduce(
        (sum, bloque) => sum + bloque.capacidad_total,
        0
      );
      const capacidadOcupada = bloques.reduce(
        (sum, bloque) => sum + bloque.capacidad_registrada,
        0
      );
      const capacidadDisponible = capacidadTotal - capacidadOcupada;
      const porcentajeOcupacion =
        capacidadTotal > 0
          ? Math.round((capacidadOcupada / capacidadTotal) * 100)
          : 0;

      // Estadísticas por estado
      const estadisticasPorEstado = {
        activo: bloquesActivos,
        lleno: bloquesLlenos,
        suspendido_por_clima: bloquesSuspendidos,
        cerrado_capitaria: bloquesCerrados,
      };

      // Estadísticas de capacidad
      const estadisticasCapacidad = {
        total: capacidadTotal,
        ocupada: capacidadOcupada,
        disponible: capacidadDisponible,
        porcentaje_ocupacion: porcentajeOcupacion,
      };

      res.status(200).json({
        status: "success",
        message: "Estadísticas obtenidas exitosamente",
        data: {
          estadisticas: {
            total_bloques: totalBloques,
            por_estado: estadisticasPorEstado,
            capacidad: estadisticasCapacidad,
          },
        },
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

export default BloqueController;
