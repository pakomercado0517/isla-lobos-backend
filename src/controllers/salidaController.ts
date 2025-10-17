import { Request, Response } from "express";
import Salida from "../models/Salida";
import User from "../models/User";
import Embarcacion from "../models/Embarcacion";
import Bloque from "../models/Bloque";
import { Op } from "sequelize";
import { createLogger } from "../utils/logger";

const logger = createLogger("SalidaController");
import sequelize from "../config/database";
import { EstadoSalida, EstadoEmbarcacion, EstadoBloque } from "../types";

/**
 * SalidaController - Gestión de salidas
 *
 * Funcionalidades:
 * - CRUD completo de salidas
 * - Validaciones de negocio complejas
 * - Gestión de estados y capacidad
 * - Integración con usuarios, embarcaciones y bloques
 */
class SalidaController {
  /**
   * Obtener todas las salidas con filtros opcionales
   * GET /api/salidas
   */
  static async getAllSalidas(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        fecha,
        estado,
        prestador_id,
        embarcacion_id,
        bloque_id,
        fecha_inicio,
        fecha_fin,
      } = req.query;

      // Construir filtros
      const where: any = {};

      // Filtro por fecha específica (solo YYYY-MM-DD, sin horas)
      if (fecha) {
        const fechaComparar = SalidaController.extraerSoloFecha(
          fecha as string
        );
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("Salida.fecha")),
            fechaComparar
          )
        );
      }

      // Filtro por rango de fechas (solo YYYY-MM-DD, sin horas)
      if (fecha_inicio && fecha_fin) {
        const inicio = SalidaController.extraerSoloFecha(
          fecha_inicio as string
        );
        const fin = SalidaController.extraerSoloFecha(fecha_fin as string);
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(sequelize.fn("DATE", sequelize.col("Salida.fecha")), {
            [Op.between]: [inicio, fin],
          })
        );
      }

      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }

      // Filtro por prestador
      if (prestador_id) {
        where.prestador_id = prestador_id;
      }

      // Filtro por embarcación
      if (embarcacion_id) {
        where.embarcacion_id = embarcacion_id;
      }

      // Filtro por bloque
      if (bloque_id) {
        where.bloque_id = bloque_id;
      }

      // Paginación
      const offset = (Number(page) - 1) * Number(limit);

      // Obtener salidas con información relacionada
      const { count, rows: salidas } = await Salida.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
          {
            model: Embarcacion,
            as: "embarcacion",
            attributes: ["id", "nombre", "matricula", "capacidad", "tipo"],
          },
          {
            model: Bloque,
            as: "bloque",
            required: false, // Permitir salidas sin bloque
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
            ],
          },
        ],
        order: [["fecha", "DESC"]],
      });

      // Calcular estadísticas básicas
      const estadisticas = {
        total: count,
        programadas: await Salida.count({
          where: { ...where, estado: EstadoSalida.PROGRAMADA },
        }),
        en_progreso: await Salida.count({
          where: { ...where, estado: EstadoSalida.EN_CURSO },
        }),
        completadas: await Salida.count({
          where: { ...where, estado: EstadoSalida.COMPLETADA },
        }),
        canceladas: await Salida.count({
          where: { ...where, estado: EstadoSalida.CANCELADA },
        }),
      };

      // Formatear salidas con fechas en YYYY-MM-DD
      const salidasFormateadas =
        SalidaController.formatearSalidasParaRespuesta(salidas);

      res.status(200).json({
        status: "success",
        message: "Salidas obtenidas exitosamente",
        data: {
          salidas: salidasFormateadas,
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
      logger.error({ err: error }, "Error al obtener salidas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener una salida específica por ID
   * GET /api/salidas/:id
   */
  static async getSalidaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const salida = await Salida.findByPk(id, {
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
          {
            model: Embarcacion,
            as: "embarcacion",
            attributes: ["id", "nombre", "matricula", "capacidad", "tipo"],
          },
          {
            model: Bloque,
            as: "bloque",
            required: false, // Permitir salidas sin bloque
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
            ],
          },
        ],
      });

      if (!salida) {
        res.status(404).json({
          status: "error",
          message: "Salida no encontrada",
          error: "SALIDA_NOT_FOUND",
        });
        return;
      }

      // Formatear fecha para respuesta
      const salidaFormateada = SalidaController.formatearSalidaParaRespuesta(
        salida.toJSON()
      );

      res.status(200).json({
        status: "success",
        message: "Salida obtenida exitosamente",
        data: { salida: salidaFormateada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener salida:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Crear una nueva salida
   * POST /api/salidas
   */
  static async createSalida(req: Request, res: Response): Promise<void> {
    try {
      const {
        destino,
        bloque_id,
        hora,
        embarcacion_id,
        fecha,
        numero_pasajeros,
        observaciones,
      } = req.body;

      // Obtener prestador_id del usuario autenticado
      const prestador_id = (req as any).user?.id;

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

      // Verificar que la embarcación existe y está disponible
      const embarcacion = await Embarcacion.findByPk(embarcacion_id);
      if (!embarcacion) {
        res.status(404).json({
          status: "error",
          message: "Embarcación no encontrada",
          error: "EMBARCACION_NOT_FOUND",
        });
        return;
      }

      // Verificar si hay conflicto específico para esta fecha Y bloque
      // Usar comparación solo por fecha (YYYY-MM-DD) sin horas
      const fechaComparar = SalidaController.extraerSoloFecha(fecha);

      // Construir condiciones de búsqueda de conflicto
      const whereConflicto: any = {
        embarcacion_id: embarcacion_id,
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
      };

      // Para destinos con bloques, también verificar bloque_id
      // Para destinos sin bloques, verificar que no tengan bloque_id (null)
      if (bloque_id) {
        whereConflicto.bloque_id = bloque_id;
      } else {
        whereConflicto.bloque_id = null;
      }

      const conflictoExistente = await Salida.findOne({
        where: whereConflicto,
      });

      if (conflictoExistente) {
        res.status(400).json({
          status: "error",
          message:
            "La embarcación ya tiene una salida programada para este bloque y fecha",
          error: "EMBARCACION_CONFLICT_BLOCK_DATE",
        });
        return;
      }

      // Verificar que la embarcación pertenece al prestador
      if (embarcacion.prestador_id !== prestador_id) {
        res.status(403).json({
          status: "error",
          message: "La embarcación no pertenece al prestador",
          error: "EMBARCACION_NOT_OWNED",
        });
        return;
      }

      // VALIDACIÓN CONDICIONAL DINÁMICA según configuración de bloques del destino
      // Verificar si el destino tiene bloques configurados
      const fechaSalida = new Date(fecha);
      fechaSalida.setHours(0, 0, 0, 0);
      
      const bloquesDisponiblesParaDestino = await Bloque.count({
        where: {
          destino,
          [Op.or]: [
            { es_plantilla: true }, // Plantillas disponibles
            { 
              fecha: fechaSalida,
              estado: { [Op.ne]: EstadoBloque.INACTIVO }
            }
          ]
        },
      });
      
      if (bloquesDisponiblesParaDestino > 0) {
        // Destino CON bloques configurados - bloque_id es REQUERIDO
        if (!bloque_id) {
          res.status(400).json({
            status: "error",
            message: `bloque_id es requerido para ${destino} (destino con control de bloques)`,
            error: "VALIDATION_ERROR",
          });
          return;
        }

        // Verificar que el bloque existe y corresponde al destino
        const bloque = await Bloque.findOne({
          where: {
            id: bloque_id,
            destino: destino
          }
        });
        
        if (!bloque) {
          res.status(404).json({
            status: "error",
            message: "Bloque no encontrado o no corresponde al destino especificado",
            error: "BLOQUE_NOT_FOUND",
          });
          return;
        }

        // Calcular capacidad ocupada para esa fecha (usando comparación solo de fecha)
        const fechaComparar = SalidaController.extraerSoloFecha(fecha);
        const salidas_en_bloque =
          (await Salida.sum("numero_pasajeros", {
            where: {
              bloque_id: bloque_id,
              [Op.and]: [
                sequelize.where(
                  sequelize.fn("DATE", sequelize.col("fecha")),
                  fechaComparar
                ),
              ],
              estado: {
                [Op.notIn]: [
                  "cancelada",
                  "cancelada_por_clima",
                  "cancelada_capitaria",
                ],
              },
            },
          })) || 0;

        const capacidad_disponible = bloque.capacidad_total - salidas_en_bloque;

        if (capacidad_disponible < numero_pasajeros) {
          res.status(400).json({
            status: "error",
            message: `El bloque solo tiene ${capacidad_disponible} cupos disponibles`,
            error: "INSUFFICIENT_CAPACITY",
          });
          return;
        }
      } else {
        // Destino SIN bloques configurados - hora es REQUERIDA
        if (!hora) {
          res.status(400).json({
            status: "error",
            message: `hora es requerida para ${destino} (destino sin bloques)`,
            error: "VALIDATION_ERROR",
          });
          return;
        }
        
        // Validar que no se haya enviado bloque_id
        if (bloque_id) {
          res.status(400).json({
            status: "error",
            message: `${destino} no utiliza bloques horarios. Use el campo 'hora' en su lugar.`,
            error: "VALIDATION_ERROR",
          });
          return;
        }
      }

      // Verificar capacidad de la embarcación
      if (numero_pasajeros > embarcacion.capacidad) {
        res.status(400).json({
          status: "error",
          message: `La embarcación no puede transportar ${numero_pasajeros} pasajeros. Capacidad máxima: ${embarcacion.capacidad}`,
          error: "EMBARCACION_OVERLOAD",
        });
        return;
      }

      // Crear la salida
      const datosSalida = {
        prestador_id,
        embarcacion_id,
        destino,
        bloque_id: bloque_id || null,  // Usar bloque_id si existe, null si no
        hora: hora || null,           // Usar hora si existe, null si no
        fecha: SalidaController.normalizarFechaParaGuardar(fecha),
        numero_pasajeros,
        observaciones,
        estado: EstadoSalida.PROGRAMADA,
      };

      const nuevaSalida = await Salida.create(datosSalida);

      // Nota: La embarcación permanece "disponible" hasta que la salida se inicie (en_progreso)

      // Obtener la salida completa con información relacionada
      const salidaCompleta = await Salida.findByPk(nuevaSalida.id, {
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
          {
            model: Embarcacion,
            as: "embarcacion",
            attributes: ["id", "nombre", "matricula", "capacidad", "tipo"],
          },
          {
            model: Bloque,
            as: "bloque",
            required: false, // IMPORTANTE: required: false para destinos sin bloque
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
            ],
          },
        ],
      });

      // Formatear fecha para respuesta
      const salidaFormateada = SalidaController.formatearSalidaParaRespuesta(
        salidaCompleta?.toJSON()
      );

      res.status(201).json({
        status: "success",
        message: "Salida creada exitosamente",
        data: { salida: salidaFormateada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al crear salida:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Actualizar una salida existente
   * PUT /api/salidas/:id
   */
  static async updateSalida(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        destino,
        embarcacion_id,
        bloque_id,
        hora,
        fecha,
        numero_pasajeros,
        observaciones,
        estado,
      } = req.body;

      const salida = await Salida.findByPk(id, {
        include: [
          {
            model: Bloque,
            as: "bloque",
            required: false, // Permitir salidas sin bloque
          },
          {
            model: Embarcacion,
            as: "embarcacion",
          },
        ],
      });

      if (!salida) {
        res.status(404).json({
          status: "error",
          message: "Salida no encontrada",
          error: "SALIDA_NOT_FOUND",
        });
        return;
      }

      // Verificar que la salida no esté completada o cancelada
      if (
        salida.estado === EstadoSalida.COMPLETADA ||
        salida.estado === EstadoSalida.CANCELADA
      ) {
        res.status(400).json({
          status: "error",
          message: "No se puede modificar una salida completada o cancelada",
          error: "SALIDA_FINALIZED",
        });
        return;
      }

      // Si se está cambiando el bloque, verificar disponibilidad
      if (bloque_id && bloque_id !== salida.bloque_id) {
        const nuevoBloque = await Bloque.findByPk(bloque_id);
        if (!nuevoBloque) {
          res.status(404).json({
            status: "error",
            message: "Bloque no encontrado",
            error: "BLOQUE_NOT_FOUND",
          });
          return;
        }

        if (nuevoBloque.estado !== EstadoBloque.ACTIVO) {
          res.status(400).json({
            status: "error",
            message: "El bloque no está disponible",
            error: "BLOQUE_NOT_AVAILABLE",
          });
          return;
        }
      }

      // Si se está cambiando la embarcación, verificar disponibilidad
      if (embarcacion_id && embarcacion_id !== salida.embarcacion_id) {
        const nuevaEmbarcacion = await Embarcacion.findByPk(embarcacion_id);
        if (!nuevaEmbarcacion) {
          res.status(404).json({
            status: "error",
            message: "Embarcación no encontrada",
            error: "EMBARCACION_NOT_FOUND",
          });
          return;
        }

        if (nuevaEmbarcacion.estado !== EstadoEmbarcacion.DISPONIBLE) {
          res.status(400).json({
            status: "error",
            message: "La embarcación no está disponible",
            error: "EMBARCACION_NOT_AVAILABLE",
          });
          return;
        }
      }

      // Si se está cambiando el número de pasajeros, verificar capacidad
      if (numero_pasajeros && numero_pasajeros !== salida.numero_pasajeros) {
        const bloqueActual = bloque_id
          ? await Bloque.findByPk(bloque_id)
          : await Bloque.findByPk(salida.bloque_id);
        const embarcacionActual = embarcacion_id
          ? await Embarcacion.findByPk(embarcacion_id)
          : await Embarcacion.findByPk(salida.embarcacion_id);

        if (!bloqueActual || !embarcacionActual) {
          res.status(404).json({
            status: "error",
            message: "Bloque o embarcación no encontrados",
            error: "RESOURCE_NOT_FOUND",
          });
          return;
        }

        // Calcular capacidad disponible (restando la capacidad actual de esta salida)
        const capacidadDisponible =
          bloqueActual.capacidad_total -
          (bloqueActual.capacidad_registrada - salida.numero_pasajeros);

        if (numero_pasajeros > capacidadDisponible) {
          res.status(400).json({
            status: "error",
            message: `No hay suficiente capacidad. Disponible: ${capacidadDisponible}, Solicitado: ${numero_pasajeros}`,
            error: "INSUFFICIENT_CAPACITY",
          });
          return;
        }

        if (numero_pasajeros > embarcacionActual.capacidad) {
          res.status(400).json({
            status: "error",
            message: `La embarcación no puede transportar ${numero_pasajeros} pasajeros. Capacidad máxima: ${embarcacionActual.capacidad}`,
            error: "EMBARCACION_OVERLOAD",
          });
          return;
        }
      }

      // Actualizar la salida
      const datosActualizacion: any = {};
      if (destino) datosActualizacion.destino = destino;
      if (embarcacion_id) datosActualizacion.embarcacion_id = embarcacion_id;
      if (bloque_id) datosActualizacion.bloque_id = bloque_id;
      if (hora) datosActualizacion.hora = hora;
      if (fecha)
        datosActualizacion.fecha =
          SalidaController.normalizarFechaParaGuardar(fecha);
      if (numero_pasajeros)
        datosActualizacion.numero_pasajeros = numero_pasajeros;
      if (observaciones !== undefined)
        datosActualizacion.observaciones = observaciones;
      if (estado) datosActualizacion.estado = estado;

      await salida.update(datosActualizacion);

      // Nota: La capacidad del bloque se calcula dinámicamente en obtenerBloquesConCapacidad()

      // Si se está marcando como en_curso, ocupar embarcación
      if (estado === EstadoSalida.EN_CURSO) {
        const embarcacion = await Embarcacion.findByPk(salida.embarcacion_id);
        if (
          embarcacion &&
          embarcacion.estado === EstadoEmbarcacion.DISPONIBLE
        ) {
          await embarcacion.update({ estado: EstadoEmbarcacion.EN_USO });
        }
      }

      // Si se está marcando como completada, liberar embarcación
      if (estado === EstadoSalida.COMPLETADA) {
        // Verificar si hay otras salidas activas para la misma embarcación
        const otrasSalidasActivas = await Salida.count({
          where: {
            embarcacion_id: salida.embarcacion_id,
            estado: {
              [Op.in]: [EstadoSalida.PROGRAMADA, EstadoSalida.EN_CURSO],
            },
          },
        });

        // Solo liberar la embarcación si no hay otras salidas activas
        if (otrasSalidasActivas === 0) {
          const embarcacion = await Embarcacion.findByPk(salida.embarcacion_id);
          if (embarcacion) {
            await embarcacion.update({ estado: EstadoEmbarcacion.DISPONIBLE });
          }
        }
      }

      // Obtener la salida actualizada con información relacionada
      const salidaActualizada = await Salida.findByPk(id, {
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
          {
            model: Embarcacion,
            as: "embarcacion",
            attributes: ["id", "nombre", "matricula", "capacidad", "tipo"],
          },
          {
            model: Bloque,
            as: "bloque",
            required: false, // Permitir salidas sin bloque
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
            ],
          },
        ],
      });

      // Formatear fecha para respuesta
      const salidaFormateada = SalidaController.formatearSalidaParaRespuesta(
        salidaActualizada?.toJSON()
      );

      res.status(200).json({
        status: "success",
        message: "Salida actualizada exitosamente",
        data: { salida: salidaFormateada },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al actualizar salida:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Cancelar una salida
   * DELETE /api/salidas/:id
   */
  static async cancelarSalida(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo_cancelacion } = req.body;

      const salida = await Salida.findByPk(id, {
        include: [
          {
            model: Bloque,
            as: "bloque",
            required: false, // Permitir salidas sin bloque
          },
          {
            model: Embarcacion,
            as: "embarcacion",
          },
        ],
      });

      if (!salida) {
        res.status(404).json({
          status: "error",
          message: "Salida no encontrada",
          error: "SALIDA_NOT_FOUND",
        });
        return;
      }

      // Verificar que la salida no esté completada
      if (salida.estado === EstadoSalida.COMPLETADA) {
        res.status(400).json({
          status: "error",
          message: "No se puede cancelar una salida completada",
          error: "SALIDA_COMPLETED",
        });
        return;
      }

      // Verificar que la salida no esté ya cancelada
      if (salida.estado === EstadoSalida.CANCELADA) {
        res.status(400).json({
          status: "error",
          message: "La salida ya está cancelada",
          error: "SALIDA_ALREADY_CANCELLED",
        });
        return;
      }

      // Actualizar la salida
      await salida.update({
        estado: EstadoSalida.CANCELADA,
        motivo_cancelacion,
      });

      // Nota: La capacidad del bloque se calcula dinámicamente en obtenerBloquesConCapacidad()

      // Liberar la embarcación si no tiene otras salidas activas
      const otrasSalidasActivas = await Salida.count({
        where: {
          embarcacion_id: salida.embarcacion_id,
          estado: {
            [Op.in]: [EstadoSalida.PROGRAMADA, EstadoSalida.EN_CURSO],
          },
        },
      });

      if (otrasSalidasActivas === 0) {
        const embarcacion = await Embarcacion.findByPk(salida.embarcacion_id);
        if (embarcacion) {
          await embarcacion.update({ estado: EstadoEmbarcacion.DISPONIBLE });
        }
      }

      res.status(200).json({
        status: "success",
        message: "Salida cancelada exitosamente",
      });
    } catch (error) {
      logger.error({ err: error }, "Error al cancelar salida:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener salidas del prestador autenticado
   * GET /api/salidas/mis-salidas
   */
  static async getMisSalidas(req: Request, res: Response): Promise<void> {
    try {
      const prestadorId = (req as any).user?.id;
      const {
        page = 1,
        limit = 10,
        estado,
        fecha,
        fecha_inicio,
        fecha_fin,
      } = req.query;

      // Construir filtros
      const where: any = {
        prestador_id: prestadorId,
      };

      // Filtro por fecha específica (solo YYYY-MM-DD, sin horas)
      if (fecha) {
        const fechaComparar = SalidaController.extraerSoloFecha(
          fecha as string
        );
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("Salida.fecha")),
            fechaComparar
          )
        );
      }

      // Filtro por rango de fechas (solo YYYY-MM-DD, sin horas)
      if (fecha_inicio && fecha_fin) {
        const inicio = SalidaController.extraerSoloFecha(
          fecha_inicio as string
        );
        const fin = SalidaController.extraerSoloFecha(fecha_fin as string);
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(sequelize.fn("DATE", sequelize.col("Salida.fecha")), {
            [Op.between]: [inicio, fin],
          })
        );
      }

      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }

      // Paginación
      const offset = (Number(page) - 1) * Number(limit);

      // Obtener salidas del prestador
      const { count, rows: salidas } = await Salida.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        include: [
          {
            model: Embarcacion,
            as: "embarcacion",
            attributes: ["id", "nombre", "matricula", "capacidad", "tipo"],
          },
          {
            model: Bloque,
            as: "bloque",
            required: false, // Permitir salidas sin bloque
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
            ],
          },
        ],
        order: [["fecha", "DESC"]],
      });

      // Calcular estadísticas del prestador
      const estadisticas = {
        total: count,
        programadas: await Salida.count({
          where: { ...where, estado: EstadoSalida.PROGRAMADA },
        }),
        en_progreso: await Salida.count({
          where: { ...where, estado: EstadoSalida.EN_CURSO },
        }),
        completadas: await Salida.count({
          where: { ...where, estado: EstadoSalida.COMPLETADA },
        }),
        canceladas: await Salida.count({
          where: { ...where, estado: EstadoSalida.CANCELADA },
        }),
      };

      // Formatear salidas con fechas en YYYY-MM-DD
      const salidasFormateadas =
        SalidaController.formatearSalidasParaRespuesta(salidas);

      res.status(200).json({
        status: "success",
        message: "Mis salidas obtenidas exitosamente",
        data: {
          salidas: salidasFormateadas,
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
      logger.error({ err: error }, "Error al obtener mis salidas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estadísticas de salidas
   * GET /api/salidas/estadisticas
   */
  static async getSalidaStats(req: Request, res: Response): Promise<void> {
    try {
      const { prestador_id, fecha_inicio, fecha_fin } = req.query;

      // Construir filtros
      const where: any = {};
      if (prestador_id) {
        where.prestador_id = prestador_id;
      }

      // Filtro por rango de fechas (solo YYYY-MM-DD, sin horas)
      if (fecha_inicio && fecha_fin) {
        const inicio = SalidaController.extraerSoloFecha(
          fecha_inicio as string
        );
        const fin = SalidaController.extraerSoloFecha(fecha_fin as string);
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(sequelize.fn("DATE", sequelize.col("Salida.fecha")), {
            [Op.between]: [inicio, fin],
          })
        );
      }

      // Obtener estadísticas generales
      const totalSalidas = await Salida.count({ where });
      const salidasProgramadas = await Salida.count({
        where: { ...where, estado: EstadoSalida.PROGRAMADA },
      });
      const salidasEnProgreso = await Salida.count({
        where: { ...where, estado: EstadoSalida.EN_CURSO },
      });
      const salidasCompletadas = await Salida.count({
        where: { ...where, estado: EstadoSalida.COMPLETADA },
      });
      const salidasCanceladas = await Salida.count({
        where: { ...where, estado: EstadoSalida.CANCELADA },
      });

      // Calcular total de pasajeros
      const salidas = await Salida.findAll({
        where: { ...where, estado: EstadoSalida.COMPLETADA },
        attributes: ["numero_pasajeros"],
      });

      const totalPasajeros = salidas.reduce(
        (sum, salida) => sum + salida.numero_pasajeros,
        0
      );

      // Estadísticas por estado
      const estadisticasPorEstado = {
        programada: salidasProgramadas,
        en_progreso: salidasEnProgreso,
        completada: salidasCompletadas,
        cancelada: salidasCanceladas,
      };

      res.status(200).json({
        status: "success",
        message: "Estadísticas obtenidas exitosamente",
        data: {
          estadisticas: {
            total_salidas: totalSalidas,
            por_estado: estadisticasPorEstado,
            total_pasajeros: totalPasajeros,
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

  /**
   * Método auxiliar: Extrae solo la parte de fecha (YYYY-MM-DD) recortando el string
   * NO usa zona horaria - simplemente recorta el string ISO
   * Ejemplo: "2025-10-10T06:00:00.000Z" -> "2025-10-10"
   */
  private static extraerSoloFecha(fecha: Date | string): string {
    const fechaString = fecha instanceof Date ? fecha.toISOString() : fecha;
    const partes = fechaString.split("T");
    return partes[0] || fechaString.substring(0, 10);
  }

  /**
   * Normaliza una fecha YYYY-MM-DD a Date sin problemas de zona horaria
   * Siempre guarda como YYYY-MM-DDT00:00:00.000Z en UTC
   * Ejemplo: "2025-10-10" -> Date("2025-10-10T00:00:00.000Z")
   */
  private static normalizarFechaParaGuardar(fecha: string): Date {
    // Asegurar que solo tenemos YYYY-MM-DD
    const fechaLimpia = fecha.split("T")[0];
    // Crear fecha en UTC con horas en cero
    return new Date(fechaLimpia + "T00:00:00.000Z");
  }

  /**
   * Formatea una salida para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearSalidaParaRespuesta(salida: any): any {
    const salidaFormateada = { ...salida };
    if (salidaFormateada.fecha) {
      salidaFormateada.fecha = SalidaController.extraerSoloFecha(
        salidaFormateada.fecha
      );
    }
    // Formatear fecha del bloque si existe
    if (salidaFormateada.bloque?.fecha) {
      salidaFormateada.bloque.fecha = SalidaController.extraerSoloFecha(
        salidaFormateada.bloque.fecha
      );
    }
    return salidaFormateada;
  }

  /**
   * Formatea múltiples salidas para respuesta
   */
  private static formatearSalidasParaRespuesta(salidas: any[]): any[] {
    return salidas.map((salida) =>
      SalidaController.formatearSalidaParaRespuesta(
        salida.toJSON ? salida.toJSON() : salida
      )
    );
  }
}

export default SalidaController;
