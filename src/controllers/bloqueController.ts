import { Request, Response } from "express";
import Bloque from "../models/Bloque";
import Salida from "../models/Salida";
import Embarcacion from "../models/Embarcacion";
import { Op } from "sequelize";
import sequelize from "../config/database";
import { getCurrentMexicoTime } from "../utils/dateUtils";
import { EstadoBloque, EstadoSalida } from "../types";

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
   * Crea bloques dinámicamente para la fecha si no existen
   * GET /api/bloques?fecha=YYYY-MM-DD
   */
  static async getAllBloques(req: Request, res: Response): Promise<void> {
    try {
      const { fecha } = req.query;

      // Validar que la fecha sea requerida
      if (!fecha) {
        res.status(400).json({
          status: "error",
          message: "La fecha es requerida para obtener bloques",
          error: "FECHA_REQUERIDA",
        });
        return;
      }

      // Crear fecha sin problemas de zona horaria
      const fechaSolicitada = new Date((fecha as string) + "T00:00:00");

      // Validar que la fecha no sea en el pasado
      const hoy = getCurrentMexicoTime();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSolicitada < hoy) {
        res.status(400).json({
          status: "error",
          message: "No se pueden consultar bloques para fechas pasadas",
          error: "FECHA_PASADA",
        });
        return;
      }

      // Validar que la fecha no sea más de 7 días en el futuro
      const diferenciaDias = Math.ceil(
        (fechaSolicitada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diferenciaDias > 7) {
        res.status(400).json({
          status: "error",
          message:
            "No se pueden consultar bloques para más de 7 días en el futuro",
          error: "FECHA_MUY_FUTURA",
        });
        return;
      }

      // Crear bloques para la fecha si no existen
      await BloqueController.crearBloquesParaFecha(fechaSolicitada);

      // Obtener bloques con capacidad calculada y embarcaciones ocupadas
      const prestadorId = (req as any).user?.id;
      const bloquesConCapacidad =
        await BloqueController.obtenerBloquesConCapacidad(fechaSolicitada);

      // Obtener embarcaciones ocupadas por bloque para el prestador autenticado
      const bloquesConEmbarcaciones = await Promise.all(
        bloquesConCapacidad.map(async (bloque) => {
          const embarcacionesOcupadas =
            await BloqueController.obtenerEmbarcacionesOcupadasEnBloque(
              prestadorId,
              bloque.id,
              fechaSolicitada
            );

          return {
            ...bloque,
            embarcaciones_ocupadas: embarcacionesOcupadas,
          };
        })
      );

      res.json({
        status: "success",
        message: "Bloques obtenidos exitosamente",
        data: {
          bloques: bloquesConEmbarcaciones,
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

      // Calcular capacidad registrada dinámicamente si el bloque tiene fecha
      if (bloque.fecha) {
        // Extraer solo la fecha YYYY-MM-DD para comparación sin problemas de zona horaria
        const fechaComparar = BloqueController.extraerSoloFecha(bloque.fecha);

        const capacidad_registrada =
          (await Salida.sum("numero_pasajeros", {
            where: {
              bloque_id: bloque.id,
              [Op.and]: [
                sequelize.where(
                  sequelize.fn("DATE", sequelize.col("fecha")),
                  fechaComparar
                ),
              ],
              estado: {
                [Op.notIn]: [
                  EstadoSalida.CANCELADA,
                  EstadoSalida.CANCELADA_POR_CLIMA,
                  EstadoSalida.CANCELADA_CAPITARIA,
                ],
              },
            },
          })) || 0;

        // Calcular capacidad disponible
        const capacidad_disponible =
          bloque.capacidad_total - capacidad_registrada;

        // Determinar estado basado en capacidad
        let estado_actual = bloque.estado;
        if (capacidad_registrada >= bloque.capacidad_total) {
          estado_actual = EstadoBloque.LLENO;
        } else if (
          bloque.estado === EstadoBloque.LLENO &&
          capacidad_registrada < bloque.capacidad_total
        ) {
          estado_actual = EstadoBloque.ACTIVO;
        }

        // Devolver bloque con capacidad calculada y fecha formateada
        const bloqueConCapacidad = {
          id: bloque.id,
          nombre: bloque.nombre,
          hora_inicio: bloque.hora_inicio,
          hora_fin: bloque.hora_fin,
          capacidad_total: bloque.capacidad_total,
          capacidad_registrada,
          capacidad_disponible,
          estado: estado_actual,
          fecha: BloqueController.extraerSoloFecha(bloque.fecha),
          created_at: bloque.created_at,
          updated_at: bloque.updated_at,
        };

        res.status(200).json({
          status: "success",
          message: "Bloque obtenido exitosamente",
          data: { bloque: bloqueConCapacidad },
        });
      } else {
        // Si es un bloque plantilla (sin fecha), devolver tal cual
        res.status(200).json({
          status: "success",
          message: "Bloque obtenido exitosamente",
          data: { bloque },
        });
      }
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
        estado = EstadoBloque.ACTIVO,
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

      // Formatear fecha para respuesta
      const bloqueFormateado = BloqueController.formatearBloqueParaRespuesta(
        nuevoBloque.toJSON()
      );

      res.status(201).json({
        status: "success",
        message: "Bloque creado exitosamente",
        data: { bloque: bloqueFormateado },
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

      // Formatear fecha para respuesta
      const bloqueFormateado = BloqueController.formatearBloqueParaRespuesta(
        bloque.toJSON()
      );

      res.status(200).json({
        status: "success",
        message: "Bloque actualizado exitosamente",
        data: { bloque: bloqueFormateado },
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
        where: { ...where, estado: EstadoBloque.ACTIVO },
      });
      const bloquesLlenos = await Bloque.count({
        where: { ...where, estado: EstadoBloque.LLENO },
      });
      const bloquesSuspendidos = await Bloque.count({
        where: { ...where, estado: EstadoBloque.SUSPENDIDO_POR_CLIMA },
      });
      const bloquesCerrados = await Bloque.count({
        where: { ...where, estado: EstadoBloque.CERRADO_CAPITANIA },
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

  /**
   * Método auxiliar: Normalizar fecha para evitar problemas de zona horaria
   * @param fecha - Fecha a normalizar
   * @returns Fecha normalizada sin problemas de zona horaria
   */
  private static normalizarFecha(fecha: Date): Date {
    // Crear fecha en UTC para evitar problemas de zona horaria
    const year = fecha.getUTCFullYear();
    const month = fecha.getUTCMonth();
    const day = fecha.getUTCDate();
    return new Date(Date.UTC(year, month, day));
  }

  /**
   * Extrae solo la parte de fecha (YYYY-MM-DD) recortando el string
   * NO usa zona horaria - simplemente recorta el string ISO
   * Ejemplo: "2025-10-10T06:00:00.000Z" -> "2025-10-10"
   */
  private static extraerSoloFecha(fecha: Date | string): string {
    const fechaString = fecha instanceof Date ? fecha.toISOString() : fecha;
    const partes = fechaString.split("T");
    return partes[0] || fechaString.substring(0, 10);
  }

  /**
   * Formatea un bloque para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearBloqueParaRespuesta(bloque: any): any {
    const bloqueFormateado = { ...bloque };
    if (bloqueFormateado.fecha) {
      bloqueFormateado.fecha = BloqueController.extraerSoloFecha(
        bloqueFormateado.fecha
      );
    }
    return bloqueFormateado;
  }

  /**
   * Método auxiliar: Crear bloques para una fecha específica desde las plantillas
   * @param fecha - Fecha para la cual crear los bloques
   */
  private static async crearBloquesParaFecha(fecha: Date): Promise<void> {
    try {
      // Normalizar la fecha para evitar problemas de zona horaria
      const fechaNormalizada = BloqueController.normalizarFecha(fecha);

      // Verificar si ya existen bloques para esta fecha
      const bloquesExistentes = await Bloque.count({
        where: { fecha: fechaNormalizada },
      });

      // Si no existen bloques para esta fecha, crear desde plantillas
      if (bloquesExistentes === 0) {
        const plantillas = await Bloque.findAll({
          where: { estado: EstadoBloque.PLANTILLA },
          order: [["hora_inicio", "ASC"]],
        });

        if (plantillas.length === 0) {
          throw new Error(
            "No se encontraron plantillas de bloques. Contacte al administrador."
          );
        }

        // Crear bloques para la fecha específica desde las plantillas
        // Crear nuevos bloques con IDs únicos para cada fecha
        for (const plantilla of plantillas) {
          await Bloque.create({
            nombre: plantilla.nombre,
            hora_inicio: plantilla.hora_inicio,
            hora_fin: plantilla.hora_fin,
            capacidad_total: plantilla.capacidad_total,
            capacidad_registrada: 0,
            estado: EstadoBloque.ACTIVO,
            fecha: fechaNormalizada,
          });
        }

        console.log(
          `Bloques creados para la fecha: ${fecha.toISOString().split("T")[0]}`
        );
      }
    } catch (error) {
      console.error("Error al crear bloques para fecha:", error);
      throw error;
    }
  }

  /**
   * Método auxiliar: Obtener bloques con capacidad calculada para una fecha
   * @param fecha - Fecha para la cual obtener los bloques
   * @returns Array de bloques con capacidad calculada
   */
  private static async obtenerBloquesConCapacidad(fecha: Date): Promise<any[]> {
    try {
      // Normalizar la fecha para evitar problemas de zona horaria
      const fechaNormalizada = BloqueController.normalizarFecha(fecha);

      // Obtener bloques existentes para la fecha
      const bloquesExistentes = await Bloque.findAll({
        where: { fecha: fechaNormalizada },
        order: [["hora_inicio", "ASC"]],
      });

      // Calcular capacidad ocupada para cada bloque
      const bloquesConCapacidad = await Promise.all(
        bloquesExistentes.map(async (bloque) => {
          // Extraer solo la fecha YYYY-MM-DD para comparación sin problemas de zona horaria
          const fechaComparar = BloqueController.extraerSoloFecha(fecha);

          // Calcular capacidad registrada sumando pasajeros de salidas activas
          // Usamos sequelize.where con sequelize.fn para comparar solo fechas
          const capacidad_registrada =
            (await Salida.sum("numero_pasajeros", {
              where: {
                bloque_id: bloque.id,
                [Op.and]: [
                  sequelize.where(
                    sequelize.fn("DATE", sequelize.col("fecha")),
                    fechaComparar
                  ),
                ],
                estado: {
                  [Op.notIn]: [
                    EstadoSalida.CANCELADA,
                    EstadoSalida.CANCELADA_POR_CLIMA,
                    EstadoSalida.CANCELADA_CAPITARIA,
                  ],
                },
              },
            })) || 0;

          // Determinar estado basado en capacidad
          let estado_actual = EstadoBloque.ACTIVO;
          if (capacidad_registrada >= bloque.capacidad_total) {
            estado_actual = EstadoBloque.LLENO;
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
            fecha: fecha.toISOString().split("T")[0], // Formato YYYY-MM-DD
            created_at: bloque.created_at,
            updated_at: bloque.updated_at,
          };
        })
      );

      return bloquesConCapacidad;
    } catch (error) {
      console.error("Error al obtener bloques con capacidad:", error);
      throw error;
    }
  }

  /**
   * Obtiene las embarcaciones ocupadas por un prestador en un bloque específico
   * @param prestadorId - ID del prestador
   * @param bloqueId - ID del bloque
   * @param fecha - Fecha para verificar ocupación
   * @returns Array de embarcaciones ocupadas en el bloque
   */
  private static async obtenerEmbarcacionesOcupadasEnBloque(
    prestadorId: string,
    bloqueId: string,
    fecha: Date
  ): Promise<any[]> {
    try {
      if (!prestadorId) {
        return [];
      }

      // Extraer solo la fecha YYYY-MM-DD para comparación sin problemas de zona horaria
      const fechaComparar = BloqueController.extraerSoloFecha(fecha);

      // Buscar salidas del prestador en este bloque específico
      const salidasEnBloque = await Salida.findAll({
        where: {
          bloque_id: bloqueId,
          [Op.and]: [
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("fecha")),
              fechaComparar
            ),
          ],
          estado: {
            [Op.notIn]: [
              EstadoSalida.CANCELADA,
              EstadoSalida.CANCELADA_POR_CLIMA,
              EstadoSalida.CANCELADA_CAPITARIA,
            ],
          },
        },
        include: [
          {
            model: Embarcacion,
            as: "embarcacion",
            where: {
              prestador_id: prestadorId,
            },
            attributes: ["id", "nombre", "tipo", "capacidad", "estado"],
          },
        ],
        attributes: [
          "id",
          "estado",
          "numero_pasajeros",
          "destino",
          "observaciones",
        ],
      });

      // Formatear la respuesta
      const embarcacionesOcupadas = salidasEnBloque.map((salida: any) => ({
        id: salida.embarcacion.id,
        nombre: salida.embarcacion.nombre,
        tipo: salida.embarcacion.tipo,
        capacidad: salida.embarcacion.capacidad,
        estado: salida.embarcacion.estado,
        salida: {
          id: salida.id,
          estado: salida.estado,
          numero_pasajeros: salida.numero_pasajeros,
          destino: salida.destino,
          observaciones: salida.observaciones,
        },
      }));

      return embarcacionesOcupadas;
    } catch (error) {
      console.error(
        "Error al obtener embarcaciones ocupadas en bloque:",
        error
      );
      throw error;
    }
  }
}

export default BloqueController;
