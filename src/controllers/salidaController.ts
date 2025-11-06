import { Request, Response } from "express";
import Salida from "../models/Salida";
import User from "../models/User";
import Embarcacion from "../models/Embarcacion";
import Bloque from "../models/Bloque";
import PlantillaBloque from "../models/PlantillaBloque";
import Brazalete from "../models/Brazalete";
import { Op } from "sequelize";
import { createLogger } from "../utils/logger";
// Import removido: extraerSoloFechaUTC ya no es necesario

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
      // Comparar fecha directamente con string YYYY-MM-DD
      if (fecha) {
        const fechaComparar = SalidaController.extraerSoloFecha(
          fecha as string
        );
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          { fecha: fechaComparar } // Comparación directa de string
        );
      }

      // Filtro por rango de fechas (solo YYYY-MM-DD, sin horas)
      // Comparar fecha directamente con string YYYY-MM-DD
      if (fecha_inicio && fecha_fin) {
        const inicio = SalidaController.extraerSoloFecha(
          fecha_inicio as string
        );
        const fin = SalidaController.extraerSoloFecha(fecha_fin as string);
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(
            sequelize.fn(
              "DATE",
              sequelize.literal(`"Salida"."fecha" AT TIME ZONE 'UTC'`)
            ),
            { [Op.between]: [inicio, fin] }
          )
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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
              "destino",
              "es_plantilla",
              "plantilla_id",
              "fecha",
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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
              "destino",
              "es_plantilla",
              "plantilla_id",
              "fecha",
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
      // Comparar fecha directamente con string YYYY-MM-DD
      const fechaComparar = SalidaController.extraerSoloFecha(fecha);

      // Construir condiciones de búsqueda de conflicto
      const whereConflicto: any = {
        embarcacion_id: embarcacion_id,
        [Op.and]: [{ fecha: fechaComparar }], // Comparación directa de string
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
      // Validar formato de fecha
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        res.status(400).json({
          status: "error",
          message: "Formato de fecha inválido. Debe ser YYYY-MM-DD",
          error: "INVALID_DATE_FORMAT",
        });
        return;
      }

      // Verificar si hay plantillas activas para el destino
      const plantillasDisponibles = await PlantillaBloque.count({
        where: {
          destino,
          activa: true,
        },
      });

      // Verificar si hay bloques específicos para la fecha (usar string directo)
      const bloquesEspecificos = await Bloque.count({
        where: {
          destino,
          fecha: fecha, // String YYYY-MM-DD directo
          es_plantilla: false,
          estado: { [Op.ne]: EstadoBloque.INACTIVO },
        },
      });

      const bloquesDisponiblesParaDestino =
        plantillasDisponibles + bloquesEspecificos;

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
        // Incluir relación con PlantillaBloque para bloques plantilla
        const bloque = await Bloque.findOne({
          where: {
            id: bloque_id,
          },
          include: [
            {
              model: PlantillaBloque,
              as: "plantillaBloque",
              required: false, // Left join para incluir bloques sin plantilla
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

        // Formatear bloque usando sistema híbrido para obtener datos correctos
        const bloqueFormateado =
          SalidaController.formatearBloqueParaValidacion(bloque);

        // Verificar que el bloque corresponde al destino especificado
        if (bloqueFormateado.destino !== destino) {
          res.status(404).json({
            status: "error",
            message: "Bloque no corresponde al destino especificado",
            error: "BLOQUE_DESTINO_MISMATCH",
          });
          return;
        }

        // Calcular capacidad ocupada para esa fecha (usando comparación solo de fecha)
        // Extraer solo fecha YYYY-MM-DD
        const fechaComparar = SalidaController.extraerSoloFecha(fecha);
        const salidas_en_bloque =
          (await Salida.sum("numero_pasajeros", {
            where: {
              bloque_id: bloque_id,
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

        // Usar capacidad_total del bloque formateado (viene de plantilla si aplica)
        const capacidad_disponible =
          (bloqueFormateado.capacidad_total || 0) - salidas_en_bloque;

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
        bloque_id: bloque_id || null, // Usar bloque_id si existe, null si no
        hora: hora || null, // Usar hora si existe, null si no
        fecha: fecha, // Guardar string YYYY-MM-DD directo
        numero_pasajeros,
        observaciones,
        estado: EstadoSalida.PROGRAMADA,
      };

      const nuevaSalida = await Salida.create(datosSalida);

      // Actualizar capacidad_registrada del bloque si tiene bloque_id
      // IMPORTANTE: Esto debe ejecutarse después de crear la salida para incluirla en el cálculo
      // Usar la fecha de la salida creada (normalizada) en lugar de la fecha del request para asegurar consistencia
      if (bloque_id) {
        try {
          // Recargar la salida para asegurar que tiene los datos actualizados de la BD
          await nuevaSalida.reload();

          // Usar la fecha de la salida creada para asegurar consistencia
          const fechaSalida = nuevaSalida.fecha;

          logger.info(
            `Actualizando bloque ${bloque_id} después de crear salida ${nuevaSalida.id} con fecha: ${fechaSalida}`
          );

          await SalidaController.actualizarCapacidadRegistradaBloque(
            bloque_id,
            fechaSalida
          );
          logger.info(
            `Capacidad actualizada para bloque ${bloque_id} después de crear salida ${nuevaSalida.id}`
          );
        } catch (error) {
          logger.error(
            { err: error },
            `Error al actualizar capacidad del bloque ${bloque_id} después de crear salida:`,
            error
          );
        }
      }

      // Nota: La embarcación permanece "disponible" hasta que la salida se inicie (en_progreso)

      // Obtener la salida completa con información relacionada
      // Incluir relación con PlantillaBloque para bloques plantilla
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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
              "destino",
              "es_plantilla",
              "plantilla_id",
              "fecha",
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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
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
          (bloqueActual.capacidad_total || 0) -
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
        datosActualizacion.fecha = fecha; // Guardar string YYYY-MM-DD directo
      if (numero_pasajeros)
        datosActualizacion.numero_pasajeros = numero_pasajeros;
      if (observaciones !== undefined)
        datosActualizacion.observaciones = observaciones;
      if (estado) datosActualizacion.estado = estado;

      // Guardar bloque_id y fecha originales antes de actualizar
      const bloque_id_original = salida.bloque_id;
      const fecha_original = salida.fecha;

      await salida.update(datosActualizacion);

      // Actualizar capacidad_registrada si cambió numero_pasajeros o bloque_id
      const bloque_id_nuevo =
        datosActualizacion.bloque_id !== undefined
          ? datosActualizacion.bloque_id
          : bloque_id_original;
      const fecha_nuevo = datosActualizacion.fecha
        ? datosActualizacion.fecha
        : fecha_original;

      // Si cambió el bloque_id, actualizar ambos bloques
      if (bloque_id_original !== bloque_id_nuevo) {
        if (bloque_id_original) {
          await SalidaController.actualizarCapacidadRegistradaBloque(
            bloque_id_original,
            fecha_original
          );
        }
        if (bloque_id_nuevo) {
          await SalidaController.actualizarCapacidadRegistradaBloque(
            bloque_id_nuevo,
            fecha_nuevo
          );
        }
      } else if (
        bloque_id_nuevo &&
        (datosActualizacion.numero_pasajeros !== undefined ||
          datosActualizacion.estado !== undefined)
      ) {
        // Si cambió numero_pasajeros o estado, actualizar el bloque
        await SalidaController.actualizarCapacidadRegistradaBloque(
          bloque_id_nuevo,
          fecha_nuevo
        );
      }

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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
              "destino",
              "es_plantilla",
              "plantilla_id",
              "fecha",
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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
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

      // Guardar bloque_id antes de actualizar
      const bloque_id_salida = salida.bloque_id;
      const fecha_salida = salida.fecha;

      // Actualizar la salida
      await salida.update({
        estado: EstadoSalida.CANCELADA,
        motivo_cancelacion,
      });

      // Actualizar capacidad_registrada del bloque si tiene bloque_id
      if (bloque_id_salida) {
        await SalidaController.actualizarCapacidadRegistradaBloque(
          bloque_id_salida,
          fecha_salida
        );
      }

      // Liberar los brazaletes asignados a esta salida
      const brazaletesAsignados = await Brazalete.findAll({
        where: {
          salida_id: id,
          estado: "asignado",
        },
      });

      if (brazaletesAsignados.length > 0) {
        await Brazalete.update(
          {
            estado: "disponible",
            salida_id: null as any,
          },
          {
            where: {
              salida_id: id,
              estado: "asignado",
            },
          }
        );

        logger.info(
          `Liberados ${brazaletesAsignados.length} brazaletes de la salida ${id}`
        );
      }

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
      // Comparar fecha directamente con string YYYY-MM-DD
      if (fecha) {
        const fechaComparar = SalidaController.extraerSoloFecha(
          fecha as string
        );
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          { fecha: fechaComparar } // Comparación directa de string
        );
      }

      // Filtro por rango de fechas (solo YYYY-MM-DD, sin horas)
      // Comparar fecha directamente con string YYYY-MM-DD
      if (fecha_inicio && fecha_fin) {
        const inicio = SalidaController.extraerSoloFecha(
          fecha_inicio as string
        );
        const fin = SalidaController.extraerSoloFecha(fecha_fin as string);
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(
            sequelize.fn(
              "DATE",
              sequelize.literal(`"Salida"."fecha" AT TIME ZONE 'UTC'`)
            ),
            { [Op.between]: [inicio, fin] }
          )
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
            include: [
              {
                model: PlantillaBloque,
                as: "plantillaBloque",
                required: false, // Left join para incluir bloques sin plantilla
              },
            ],
            attributes: [
              "id",
              "nombre",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
              "destino",
              "es_plantilla",
              "plantilla_id",
              "fecha",
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
      // Comparar fecha directamente con string YYYY-MM-DD
      if (fecha_inicio && fecha_fin) {
        const inicio = SalidaController.extraerSoloFecha(
          fecha_inicio as string
        );
        const fin = SalidaController.extraerSoloFecha(fecha_fin as string);
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push(
          sequelize.where(
            sequelize.fn(
              "DATE",
              sequelize.literal(`"Salida"."fecha" AT TIME ZONE 'UTC'`)
            ),
            { [Op.between]: [inicio, fin] }
          )
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

  // Método removido: validarFormatoFecha - no se usa actualmente

  /**
   * Actualiza capacidad_registrada y estado de un bloque basado en las salidas activas
   * @param bloqueId - ID del bloque a actualizar
   * @param fecha - Fecha de la salida (para filtrar por fecha)
   */
  private static async actualizarCapacidadRegistradaBloque(
    bloqueId: string,
    fecha: Date | string
  ): Promise<void> {
    try {
      // Calcular capacidad_registrada actualizada sumando todas las salidas activas
      // Extraer solo fecha YYYY-MM-DD
      const fechaComparar = SalidaController.extraerSoloFecha(fecha);

      // DEBUG: Log para verificar que se está ejecutando
      logger.info(
        `Actualizando capacidad_registrada para bloque ${bloqueId} en fecha ${fechaComparar}`
      );

      // DEBUG: Primero verificar cuántas salidas existen para este bloque y fecha
      // Comparar fecha directamente con string YYYY-MM-DD
      const salidasEncontradas = await Salida.findAll({
        where: {
          bloque_id: bloqueId,
          [Op.and]: [{ fecha: fechaComparar }], // Comparación directa de string
          estado: {
            [Op.notIn]: [
              EstadoSalida.CANCELADA,
              EstadoSalida.CANCELADA_POR_CLIMA,
              EstadoSalida.CANCELADA_CAPITARIA,
            ],
          },
        },
        attributes: ["id", "fecha", "numero_pasajeros", "estado", "bloque_id"],
        raw: true,
      });

      logger.info(
        `Salidas encontradas para bloque ${bloqueId} en fecha ${fechaComparar}: ${
          salidasEncontradas.length
        }. IDs: ${salidasEncontradas.map((s) => s.id).join(", ")}`
      );

      const capacidad_registrada_actualizada =
        (await Salida.sum("numero_pasajeros", {
          where: {
            bloque_id: bloqueId,
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

      logger.info(
        `Capacidad registrada calculada: ${capacidad_registrada_actualizada} para bloque ${bloqueId} (suma de ${salidasEncontradas.length} salidas)`
      );

      // Obtener datos del bloque usando sistema híbrido para obtener capacidad_total correcta
      const bloqueConPlantilla = await Bloque.findByPk(bloqueId, {
        include: [
          {
            model: PlantillaBloque,
            as: "plantillaBloque",
            required: false,
          },
        ],
      });

      if (!bloqueConPlantilla) {
        return;
      }

      const bloqueFormateado =
        SalidaController.formatearBloqueParaValidacion(bloqueConPlantilla);
      const capacidad_total = bloqueFormateado.capacidad_total || 0;

      // Determinar nuevo estado del bloque
      let nuevoEstado = bloqueConPlantilla.estado;
      if (
        capacidad_registrada_actualizada >= capacidad_total &&
        capacidad_total > 0
      ) {
        nuevoEstado = EstadoBloque.LLENO;
      } else if (
        bloqueConPlantilla.estado === EstadoBloque.LLENO &&
        capacidad_registrada_actualizada < capacidad_total
      ) {
        nuevoEstado = EstadoBloque.ACTIVO;
      }

      // Actualizar capacidad_registrada y estado del bloque en una sola operación
      await bloqueConPlantilla.update({
        capacidad_registrada: capacidad_registrada_actualizada,
        estado: nuevoEstado,
      });

      // Recargar el bloque para asegurar que tiene los datos actualizados
      await bloqueConPlantilla.reload();

      logger.info(
        `Bloque ${bloqueId} actualizado: capacidad_registrada=${capacidad_registrada_actualizada}, capacidad_total=${capacidad_total}, estado=${nuevoEstado}`
      );
    } catch (error) {
      // Log error pero no fallar la operación principal
      logger.error(
        { err: error },
        "Error al actualizar capacidad_registrada del bloque:",
        error
      );
    }
  }

  /**
   * Formatea un bloque usando sistema híbrido para validaciones
   * - Si es_plantilla=true: usa datos de PlantillaBloque
   * - Si es_plantilla=false: usa datos propios del bloque
   */
  private static formatearBloqueParaValidacion(bloque: any): any {
    const bloqueData = bloque.toJSON ? bloque.toJSON() : bloque;

    if (bloqueData.es_plantilla && bloqueData.plantillaBloque) {
      // Bloque basado en plantilla: usar datos de PlantillaBloque
      return {
        id: bloqueData.id,
        nombre: bloqueData.plantillaBloque.nombre,
        hora_inicio: bloqueData.plantillaBloque.hora_inicio,
        hora_fin: bloqueData.plantillaBloque.hora_fin,
        capacidad_total: bloqueData.plantillaBloque.capacidad_total,
        destino: bloqueData.plantillaBloque.destino,
        estado: bloqueData.estado,
        es_plantilla: true,
        plantilla_id: bloqueData.plantilla_id,
        fecha: bloqueData.fecha
          ? SalidaController.extraerSoloFecha(bloqueData.fecha)
          : null,
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
        estado: bloqueData.estado,
        es_plantilla: false,
        plantilla_id: null,
        fecha: bloqueData.fecha
          ? SalidaController.extraerSoloFecha(bloqueData.fecha)
          : null,
      };
    }
  }

  /**
   * Formatea una salida para respuesta, convirtiendo fechas a YYYY-MM-DD
   * Formatea el bloque usando sistema híbrido si es plantilla
   */
  private static formatearSalidaParaRespuesta(salida: any): any {
    const salidaFormateada = { ...salida };
    if (salidaFormateada.fecha) {
      salidaFormateada.fecha = SalidaController.extraerSoloFecha(
        salidaFormateada.fecha
      );
    }
    // Formatear bloque usando sistema híbrido si existe
    if (salidaFormateada.bloque) {
      const bloqueFormateado = SalidaController.formatearBloqueParaValidacion(
        salidaFormateada.bloque
      );
      salidaFormateada.bloque = {
        id: bloqueFormateado.id,
        nombre: bloqueFormateado.nombre,
        hora_inicio: bloqueFormateado.hora_inicio,
        hora_fin: bloqueFormateado.hora_fin,
        capacidad_total: bloqueFormateado.capacidad_total,
        destino: bloqueFormateado.destino,
        fecha: bloqueFormateado.fecha,
        es_plantilla: bloqueFormateado.es_plantilla,
        plantilla_id: bloqueFormateado.plantilla_id,
      };
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
