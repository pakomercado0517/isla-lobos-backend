import { Request, Response } from "express";
import Bloque from "../models/Bloque";
import PlantillaBloque from "../models/PlantillaBloque";
import Salida from "../models/Salida";
import Embarcacion from "../models/Embarcacion";
import { Op } from "sequelize";
import sequelize from "../config/database";
import {
  getTodayMexico,
  extraerSoloFecha,
} from "../utils/dateUtils";
import { EstadoBloque, EstadoSalida } from "../types";
import { createLogger } from "../utils/logger";

const logger = createLogger("BloqueController");

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
   * GET /api/bloques?fecha=YYYY-MM-DD&destino=DESTINO_OPCIONAL
   */
  static async getAllBloques(req: Request, res: Response): Promise<void> {
    try {
      const { fecha, destino } = req.query;

      // Validar que la fecha sea requerida
      if (!fecha) {
        res.status(400).json({
          status: "error",
          message: "La fecha es requerida para obtener bloques",
          error: "FECHA_REQUERIDA",
        });
        return;
      }

      // Validar formato de fecha
      const fechaStr = extraerSoloFecha(fecha as string);
      if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        res.status(400).json({
          status: "error",
          message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
          error: "INVALID_DATE_FORMAT",
        });
        return;
      }

      // Validar que la fecha no sea en el pasado
      const fechaHoy = getTodayMexico();

      if (fechaStr < fechaHoy) {
        res.status(400).json({
          status: "error",
          message: "No se pueden consultar bloques para fechas pasadas",
          error: "FECHA_PASADA",
        });
        return;
      }

      // Validar que la fecha no sea más de 7 días en el futuro
      const hoyDate = new Date(fechaHoy + "T12:00:00");
      const fechaSolicitadaDate = new Date(fechaStr + "T12:00:00");
      const diferenciaDias = Math.ceil(
        (fechaSolicitadaDate.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24)
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

      // Crear bloques para la fecha si no existen (para todos los destinos que tienen plantillas)
      await BloqueController.crearBloquesParaFecha(
        fechaStr,
        destino as string,
        false // No forzar recreación por defecto
      );

      // Obtener bloques con capacidad calculada y embarcaciones ocupadas
      const prestadorId = (req as any).user?.id;
      const bloquesConCapacidad =
        await BloqueController.obtenerBloquesConCapacidad(
          fechaStr,
          destino as string
        );

      // Obtener embarcaciones ocupadas por bloque para el prestador autenticado
      const bloquesConEmbarcaciones = await Promise.all(
        bloquesConCapacidad.map(async (bloque) => {
          const embarcacionesOcupadas =
            await BloqueController.obtenerEmbarcacionesOcupadasEnBloque(
              prestadorId,
              bloque.id,
              fechaStr
            );

          return {
            ...bloque,
            embarcaciones_ocupadas: embarcacionesOcupadas,
          };
        })
      );

      // Determinar mensaje según si hay bloques o no
      const mensaje =
        bloquesConEmbarcaciones.length > 0
          ? "Bloques obtenidos exitosamente"
          : "No hay bloques disponibles para esta fecha. Crea plantillas de bloques para generar horarios automáticamente.";

      res.json({
        status: "success",
        message: mensaje,
        data: {
          bloques: bloquesConEmbarcaciones,
          total: bloquesConEmbarcaciones.length,
          fecha_consultada: fechaStr,
          destino: destino || "todos",
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener bloques:", error);
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

      const bloque = await Bloque.findByPk(id, {
        include: [
          {
            model: PlantillaBloque,
            as: "plantillaBloque",
            required: false, // Left join
          },
        ],
      });

      if (!bloque) {
        res.status(404).json({
          status: "error",
          message: "Bloque no encontrado",
          error: "BLOQUE_NOT_FOUND",
        });
        return;
      }

      // Usar lógica híbrida: obtener datos de plantilla si es_plantilla=true
      const bloqueFormateado = BloqueController.formatearBloqueHibrido(bloque);

      // Calcular capacidad registrada dinámicamente si el bloque tiene fecha
      if (bloqueFormateado.fecha) {
        const fechaComparar = extraerSoloFecha(bloque.fecha!);

        if (!fechaComparar) {
          throw new Error("No se pudo extraer la fecha del bloque");
        }

        // Comparar fecha directamente con string YYYY-MM-DD
        const capacidad_registrada =
          (await Salida.sum("numero_pasajeros", {
            where: {
              bloque_id: bloque.id,
              [Op.and]: [
                { fecha: fechaComparar }, // Comparación directa de string
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
          bloqueFormateado.capacidad_total - capacidad_registrada;

        // Determinar estado basado en capacidad
        let estado_actual = bloque.estado;
        if (capacidad_registrada >= bloqueFormateado.capacidad_total) {
          estado_actual = EstadoBloque.LLENO;
        } else if (
          bloque.estado === EstadoBloque.LLENO &&
          capacidad_registrada < bloqueFormateado.capacidad_total
        ) {
          estado_actual = EstadoBloque.ACTIVO;
        }

        bloqueFormateado.capacidad_registrada = capacidad_registrada;
        bloqueFormateado.capacidad_disponible = capacidad_disponible;
        bloqueFormateado.estado = estado_actual;
      }

      res.status(200).json({
        status: "success",
        message: "Bloque obtenido exitosamente",
        data: { bloque: bloqueFormateado },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener bloque:", error);
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
        destino,
        fecha,
        estado = EstadoBloque.ACTIVO,
      } = req.body;

      // Validar fecha solo si se proporciona (bloques con fecha vs plantillas)
      let fechaBloque: string | null = null;
      if (fecha) {
        // Validar formato
        const fechaExtraida = extraerSoloFecha(fecha);
        if (!fechaExtraida || !/^\d{4}-\d{2}-\d{2}$/.test(fechaExtraida)) {
          res.status(400).json({
            status: "error",
            message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
            error: "INVALID_DATE_FORMAT",
          });
          return;
        }
        fechaBloque = fechaExtraida;
        
        const fechaHoy = getTodayMexico();
        if (fechaBloque < fechaHoy) {
          res.status(400).json({
            status: "error",
            message: "No se puede crear un bloque para una fecha pasada",
            error: "INVALID_DATE",
          });
          return;
        }
      }

      // Validar unicidad: nombre + destino + fecha (o plantilla si no hay fecha)
      const whereCondition: any = {
        nombre,
        destino,
      };

      if (fechaBloque) {
        whereCondition.fecha = fechaBloque;
        whereCondition.es_plantilla = false;
      } else {
        // Para plantillas, verificar que no exista otra plantilla con mismo nombre y destino
        whereCondition.fecha = null;
        whereCondition.es_plantilla = true;
      }

      const bloqueExistente = await Bloque.findOne({
        where: whereCondition,
      });

      if (bloqueExistente) {
        const mensaje = fechaBloque
          ? "Ya existe un bloque con ese nombre para esa fecha y destino"
          : "Ya existe una plantilla de bloque con ese nombre y destino";

        res.status(409).json({
          status: "error",
          message: mensaje,
          error: "BLOQUE_ALREADY_EXISTS",
        });
        return;
      }

      // El estado ya no determina si es plantilla, usamos es_plantilla
      let estadoFinal = estado;

      // Crear el bloque
      const datosBloque: any = {
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        capacidad_registrada: 0,
        estado: estadoFinal,
        destino,
        es_plantilla: !fechaBloque, // true si no hay fecha, false si hay fecha
      };

      // Solo agregar fecha si se proporciona
      if (fechaBloque) {
        datosBloque.fecha = fechaBloque;
      }

      const nuevoBloque = await Bloque.create(datosBloque);

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
      logger.error({ err: error }, "Error al crear bloque:", error);
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
      const {
        nombre,
        hora_inicio,
        hora_fin,
        capacidad_total,
        estado,
        destino,
        fecha,
      } = req.body;

      const bloque = await Bloque.findByPk(id, {
        include: [
          {
            model: PlantillaBloque,
            as: "plantillaBloque",
            required: false, // Left join
          },
        ],
      });

      if (!bloque) {
        res.status(404).json({
          status: "error",
          message: "Bloque no encontrado",
          error: "BLOQUE_NOT_FOUND",
        });
        return;
      }

      // Obtener datos actuales del bloque (usando formato híbrido para validaciones)
      const bloqueFormateadoActual =
        BloqueController.formatearBloqueHibrido(bloque);

      // Validar que la fecha no sea en el pasado (solo si se está cambiando)
      if (fecha) {
        // Validar formato de fecha
        const fechaBloque = extraerSoloFecha(fecha);
        if (!fechaBloque || !/^\d{4}-\d{2}-\d{2}$/.test(fechaBloque)) {
          res.status(400).json({
            status: "error",
            message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
            error: "INVALID_DATE_FORMAT",
          });
          return;
        }
        const fechaHoy = getTodayMexico();

        if (fechaBloque && fechaBloque < fechaHoy) {
          res.status(400).json({
            status: "error",
            message: "No se puede cambiar un bloque a una fecha pasada",
            error: "INVALID_DATE",
          });
          return;
        }
      }

      // Validar que no exista otro bloque con el mismo nombre, destino y fecha
      // Usar datos formateados (de plantilla si aplica) para la validación
      if ((nombre || destino) && fecha) {
        const nombreValidar = nombre || bloqueFormateadoActual.nombre;
        const destinoValidar = destino || bloqueFormateadoActual.destino;
        const fechaComparar = extraerSoloFecha(fecha);
        if (!fechaComparar) {
          res.status(400).json({
            status: "error",
            message: "Formato de fecha inválido",
            error: "INVALID_DATE_FORMAT",
          });
          return;
        }

        const bloqueExistente = await Bloque.findOne({
          where: {
            fecha: fechaComparar,
            id: { [Op.ne]: id },
          },
          include: [
            {
              model: PlantillaBloque,
              as: "plantillaBloque",
              required: false,
            },
          ],
        });

        if (bloqueExistente) {
          const bloqueExistenteFormateado =
            BloqueController.formatearBloqueHibrido(bloqueExistente);
          if (
            bloqueExistenteFormateado.nombre === nombreValidar &&
            bloqueExistenteFormateado.destino === destinoValidar
          ) {
            res.status(409).json({
              status: "error",
              message:
                "Ya existe otro bloque con ese nombre para esa fecha y destino",
              error: "BLOQUE_ALREADY_EXISTS",
            });
            return;
          }
        }
      }

      // Actualizar el bloque
      // Nota: Si es_plantilla=true, algunos campos pueden ser NULL
      await bloque.update({
        ...(nombre && { nombre }),
        ...(hora_inicio && { hora_inicio }),
        ...(hora_fin && { hora_fin }),
        ...(capacidad_total && { capacidad_total }),
        ...(estado && { estado }),
        ...(destino && { destino }),
        ...(fecha && (() => {
          const fechaNormalizada = extraerSoloFecha(fecha);
          return fechaNormalizada ? { fecha: fechaNormalizada } : {};
        })()),
      });

      // Recargar el bloque con la relación para formatear correctamente
      await bloque.reload({
        include: [
          {
            model: PlantillaBloque,
            as: "plantillaBloque",
            required: false,
          },
        ],
      });

      // Usar formato híbrido para respuesta
      const bloqueFormateado = BloqueController.formatearBloqueHibrido(bloque);

      res.status(200).json({
        status: "success",
        message: "Bloque actualizado exitosamente",
        data: { bloque: bloqueFormateado },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al actualizar bloque:", error);
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
      // Solo bloquear fechas que sean estrictamente pasadas (no incluye hoy)
      if (bloque.fecha) {
        const fechaBloque = extraerSoloFecha(bloque.fecha);
        const fechaHoy = getTodayMexico(); // Obtiene fecha actual en formato YYYY-MM-DD

        if (fechaBloque && fechaBloque < fechaHoy) {
          res.status(400).json({
            status: "error",
            message: "No se puede eliminar un bloque de una fecha pasada",
            error: "INVALID_DATE",
          });
          return;
        }
      }

      await bloque.destroy();

      res.status(200).json({
        status: "success",
        message: "Bloque eliminado exitosamente",
      });
    } catch (error) {
      logger.error({ err: error }, "Error al eliminar bloque:", error);
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
        const inicio = extraerSoloFecha(fecha_inicio as string);
        const fin = extraerSoloFecha(fecha_fin as string);
        // Validar formatos
        if (!inicio || !fin || !/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fin)) {
          res.status(400).json({
            status: "error",
            message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
            error: "INVALID_DATE_FORMAT",
          });
          return;
        }
        where.fecha = {
          [Op.between]: [inicio, fin], // Comparación directa de strings
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
        (sum, bloque) => sum + (bloque.capacidad_total || 0),
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
      logger.error({ err: error }, "Error al obtener estadísticas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  // Método removido: validarFormatoFecha - no se usa actualmente

  /**
   * Formatea un bloque para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearBloqueParaRespuesta(bloque: any): any {
    const bloqueFormateado = { ...bloque };
    if (bloqueFormateado.fecha) {
      bloqueFormateado.fecha = extraerSoloFecha(bloqueFormateado.fecha);
    }
    return bloqueFormateado;
  }

  /**
   * Formatea un bloque usando lógica híbrida:
   * - Si es_plantilla=true: usa datos de PlantillaBloque
   * - Si es_plantilla=false: usa datos propios del bloque
   */
  private static formatearBloqueHibrido(bloque: any): any {
    const bloqueData = bloque.toJSON ? bloque.toJSON() : bloque;

    if (bloqueData.es_plantilla && bloqueData.plantillaBloque) {
      // Bloque basado en plantilla: usar datos de PlantillaBloque
      // Los bloques creados desde plantillas SÍ tienen fecha
      return {
        id: bloqueData.id,
        nombre: bloqueData.plantillaBloque.nombre,
        hora_inicio: bloqueData.plantillaBloque.hora_inicio,
        hora_fin: bloqueData.plantillaBloque.hora_fin,
        capacidad_total: bloqueData.plantillaBloque.capacidad_total,
        destino: bloqueData.plantillaBloque.destino,
        capacidad_registrada: bloqueData.capacidad_registrada || 0,
        capacidad_disponible: 0, // Se calcula dinámicamente
        estado: bloqueData.estado,
        es_plantilla: true,
        plantilla_id: bloqueData.plantilla_id,
        fecha: bloqueData.fecha ? extraerSoloFecha(bloqueData.fecha) : null, // Conservar fecha si existe
        plantilla_datos: {
          id: bloqueData.plantillaBloque.id,
          nombre: bloqueData.plantillaBloque.nombre,
          activa: bloqueData.plantillaBloque.activa,
        },
        created_at: bloqueData.created_at,
        updated_at: bloqueData.updated_at,
      };
    } else {
      // Bloque normal: usar datos propios
      return {
        id: bloqueData.id,
        nombre: bloqueData.nombre,
        hora_inicio: bloqueData.hora_inicio,
        hora_fin: bloqueData.hora_fin,
        capacidad_total: bloqueData.capacidad_total,
        destino: bloqueData.destino,
        capacidad_registrada: bloqueData.capacidad_registrada || 0,
        capacidad_disponible: 0, // Se calcula dinámicamente
        estado: bloqueData.estado,
        es_plantilla: false,
        plantilla_id: null,
        fecha: bloqueData.fecha ? extraerSoloFecha(bloqueData.fecha) : null,
        created_at: bloqueData.created_at,
        updated_at: bloqueData.updated_at,
      };
    }
  }

  /**
   * Método auxiliar: Crear bloques para una fecha específica desde las plantillas
   * @param fecha - Fecha para la cual crear los bloques
   * @param destino - Destino específico (opcional, si no se proporciona crea para todos)
   */
  public static async crearBloquesParaFecha(
    fecha: string,
    destino?: string,
    forzarRecreacion: boolean = false
  ): Promise<void> {
    try {
      // Extraer solo fecha YYYY-MM-DD
      const fechaNormalizada = extraerSoloFecha(fecha);
      if (!fechaNormalizada || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
        throw new Error("Formato de fecha inválido");
      }

      // Construir filtros de búsqueda
      const whereExistentes: any = { fecha: fechaNormalizada };
      if (destino) {
        whereExistentes.destino = destino;
      }

      // Verificar si ya existen bloques para esta fecha (y destino si se especifica)
      const bloquesExistentes = await Bloque.count({
        where: whereExistentes,
      });

      // Si no existen bloques para esta fecha O se fuerza recreación, crear desde plantillas
      if (bloquesExistentes === 0 || forzarRecreacion) {
        // Si se fuerza recreación, eliminar bloques existentes primero
        if (forzarRecreacion && bloquesExistentes > 0) {
          await Bloque.destroy({
            where: whereExistentes,
          });
          logger.info(
            `Bloques existentes eliminados para fecha ${fechaNormalizada}`
          );
        }
        const wherePlantillas: any = {
          activa: true, // Solo plantillas activas
        };
        if (destino) {
          wherePlantillas.destino = destino;
        }

        const plantillas = await PlantillaBloque.findAll({
          where: wherePlantillas,
          order: [["hora_inicio", "ASC"]],
        });

        if (plantillas.length === 0) {
          // No hay plantillas activas - esto es normal, no es un error
          logger.info(
            `No se encontraron plantillas activas para destino: ${
              destino || "todos"
            }`
          );
          return; // Salir sin crear bloques, pero sin error
        }

        // Crear bloques para la fecha específica desde las plantillas
        // Los bloques mantienen relación con la plantilla para actualizaciones masivas
        for (const plantilla of plantillas) {
          await Bloque.create({
            // Campos opcionales: no se incluyen porque vienen de PlantillaBloque
            // Sequelize los almacenará como NULL en la base de datos
            // nombre, hora_inicio, hora_fin, capacidad_total, destino: omitidos
            capacidad_registrada: 0,
            estado: EstadoBloque.ACTIVO,
            es_plantilla: true, // Bloque basado en plantilla
            plantilla_id: plantilla.id, // FK a PlantillaBloque
            fecha: fechaNormalizada,
          });
        }
      }
    } catch (error) {
      logger.error({ err: error }, "Error al crear bloques para fecha:", error);
      throw error;
    }
  }

  /**
   * Método auxiliar: Obtener bloques con capacidad calculada para una fecha
   * Usa el sistema híbrido: obtiene datos de PlantillaBloque si es_plantilla=true
   * @param fecha - Fecha para la cual obtener los bloques
   * @param destino - Destino específico (opcional)
   * @returns Array de bloques con capacidad calculada
   */
  private static async obtenerBloquesConCapacidad(
    fecha: string,
    destino?: string
  ): Promise<any[]> {
    try {
      // Normalizar la fecha para evitar problemas de zona horaria
      const fechaNormalizada = extraerSoloFecha(fecha);
      if (!fechaNormalizada || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
        throw new Error("Formato de fecha inválido");
      }

      // Construir filtros de búsqueda (busca todos los bloques para la fecha)
      const whereBloquesExistentes: any = {
        fecha: fechaNormalizada,
      };

      // Si se especifica destino, filtrar por destino en la plantilla o en el bloque
      // Esto requiere un JOIN más complejo, así que lo manejamos después

      // Obtener bloques existentes para la fecha con JOIN a PlantillaBloque
      const bloquesExistentes = await Bloque.findAll({
        where: whereBloquesExistentes,
        include: [
          {
            model: PlantillaBloque,
            as: "plantillaBloque",
            required: false, // Left join para incluir bloques sin plantilla
          },
        ],
        // No ordenamos aquí porque necesitamos usar formatearBloqueHibrido primero
        // Ordenaremos después en JavaScript
      });

      // Filtrar por destino si se especifica (después de obtener con JOIN)
      let bloquesFiltrados = bloquesExistentes;
      if (destino) {
        bloquesFiltrados = bloquesExistentes.filter((bloque) => {
          const bloqueFormateado =
            BloqueController.formatearBloqueHibrido(bloque);
          return bloqueFormateado.destino === destino;
        });
      }

      // Calcular capacidad ocupada para cada bloque usando el formato híbrido
      const bloquesConCapacidad = await Promise.all(
        bloquesFiltrados.map(async (bloque) => {
          // Formatear bloque usando sistema híbrido (obtiene datos de plantilla si aplica)
          const bloqueFormateado =
            BloqueController.formatearBloqueHibrido(bloque);

          // Extraer solo la fecha YYYY-MM-DD para comparación sin problemas de zona horaria
          const fechaComparar = extraerSoloFecha(fecha);

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
          const capacidadTotal = bloqueFormateado.capacidad_total || 0;
          let estado_actual = EstadoBloque.ACTIVO;
          if (capacidad_registrada >= capacidadTotal) {
            estado_actual = EstadoBloque.LLENO;
          }

          return {
            id: bloqueFormateado.id,
            nombre: bloqueFormateado.nombre,
            hora_inicio: bloqueFormateado.hora_inicio,
            hora_fin: bloqueFormateado.hora_fin,
            capacidad_total: capacidadTotal,
            capacidad_registrada,
            capacidad_disponible: capacidadTotal - capacidad_registrada,
            estado: estado_actual,
            destino: bloqueFormateado.destino,
            fecha: bloqueFormateado.fecha || fecha, // Formato YYYY-MM-DD
            es_plantilla: bloqueFormateado.es_plantilla,
            plantilla_id: bloqueFormateado.plantilla_id || null,
            created_at: bloqueFormateado.created_at,
            updated_at: bloqueFormateado.updated_at,
          };
        })
      );

      // Ordenar por hora_inicio en orden ascendente
      bloquesConCapacidad.sort((a, b) => {
        const horaA = a.hora_inicio || "99:99"; // Si no tiene hora, va al final
        const horaB = b.hora_inicio || "99:99";
        return horaA.localeCompare(horaB);
      });

      return bloquesConCapacidad;
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener bloques con capacidad:",
        error
      );
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
    fecha: string
  ): Promise<any[]> {
    try {
      if (!prestadorId) {
        return [];
      }

      // Extraer solo la fecha YYYY-MM-DD para comparación sin problemas de zona horaria
      const fechaComparar = extraerSoloFecha(fecha);

      if (!fechaComparar) {
        return [];
      }

      // Buscar salidas del prestador en este bloque específico
      // Comparar fecha directamente con string YYYY-MM-DD
      // Filtrar por prestador_id en la salida Y en la embarcación para mayor precisión
      const salidasEnBloque = await Salida.findAll({
        where: {
          bloque_id: bloqueId,
          prestador_id: prestadorId, // Filtrar por prestador_id de la salida también
          [Op.and]: [{ fecha: fechaComparar }], // Comparación directa de string
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
              prestador_id: prestadorId, // También verificar que la embarcación pertenece al prestador
            },
            required: true, // INNER JOIN para asegurar que la embarcación existe
            attributes: ["id", "nombre", "tipo", "capacidad", "estado"],
          },
        ],
        attributes: [
          "id",
          "estado",
          "numero_pasajeros",
          "destino",
          "observaciones",
          "prestador_id", // Incluir para debugging
        ],
      });

      logger.debug(
        `Encontradas ${salidasEnBloque.length} salidas para prestador ${prestadorId} en bloque ${bloqueId} para fecha ${fechaComparar}`
      );

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
      logger.error(
        { err: error },
        "Error al obtener embarcaciones ocupadas en bloque:",
        error
      );
      throw error;
    }
  }
}

export default BloqueController;
