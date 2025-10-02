import { Request, Response } from "express";
import CondicionMeteorologica from "../models/CondicionMeteorologica";
import { Op } from "sequelize";
import { EstadoPuerto } from "../types";
import { getCurrentMexicoTime } from "../utils/dateUtils";

/**
 * ClimaController - Gestión de condiciones meteorológicas
 *
 * Funcionalidades:
 * - CRUD completo de condiciones meteorológicas
 * - Predicciones y alertas
 * - Estado del puerto
 * - Historial meteorológico
 * - Integración con sistema de salidas
 */
class ClimaController {
  /**
   * Obtener todas las condiciones meteorológicas con filtros
   * GET /api/clima
   */
  static async getAllCondiciones(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        fecha_inicio,
        fecha_fin,
        estado_puerto,
        fuente,
      } = req.query;

      // Construir filtros
      const where: any = {};

      // Filtro por rango de fechas
      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio as string);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin as string);
        fin.setHours(23, 59, 59, 999);
        where.fecha_hora = {
          [Op.between]: [inicio, fin],
        };
      }

      // Filtro por estado del puerto
      if (estado_puerto) {
        where.estado_puerto = estado_puerto;
      }

      // Filtro por fuente
      if (fuente) {
        where.fuente = fuente;
      }

      // Paginación
      const offset = (Number(page) - 1) * Number(limit);

      // Obtener condiciones meteorológicas
      const { count, rows: condiciones } =
        await CondicionMeteorologica.findAndCountAll({
          where,
          limit: Number(limit),
          offset,
          order: [["fecha_hora", "DESC"]],
        });

      // Obtener la condición más reciente
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
      });

      // Calcular estadísticas básicas
      const estadisticas = {
        total: count,
        abierto: await CondicionMeteorologica.count({
          where: { ...where, estado_puerto: EstadoPuerto.ABIERTO },
        }),
        restricciones: await CondicionMeteorologica.count({
          where: { ...where, estado_puerto: EstadoPuerto.RESTRICCIONES },
        }),
        cerrado: await CondicionMeteorologica.count({
          where: { ...where, estado_puerto: EstadoPuerto.CERRADO },
        }),
        emergencia: await CondicionMeteorologica.count({
          where: { ...where, estado_puerto: EstadoPuerto.EMERGENCIA },
        }),
      };

      res.status(200).json({
        status: "success",
        message: "Condiciones meteorológicas obtenidas exitosamente",
        data: {
          condiciones,
          condicion_actual: condicionActual,
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
      console.error("Error al obtener condiciones meteorológicas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener una condición meteorológica específica por ID
   * GET /api/clima/:id
   */
  static async getCondicionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const condicion = await CondicionMeteorologica.findByPk(id);

      if (!condicion) {
        res.status(404).json({
          status: "error",
          message: "Condición meteorológica no encontrada",
          error: "CONDICION_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Condición meteorológica obtenida exitosamente",
        data: { condicion },
      });
    } catch (error) {
      console.error("Error al obtener condición meteorológica:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Crear una nueva condición meteorológica
   * POST /api/clima
   */
  static async createCondicion(req: Request, res: Response): Promise<void> {
    try {
      const {
        fecha_hora,
        oleaje,
        viento_velocidad,
        viento_direccion,
        visibilidad,
        estado_puerto,
        prediccion_5_dias,
        fuente,
      } = req.body;

      // Validar que no exista una condición para la misma fecha/hora
      const fechaCondicion = new Date(fecha_hora);
      const inicio = new Date(fechaCondicion);
      inicio.setMinutes(0, 0, 0);
      const fin = new Date(fechaCondicion);
      fin.setMinutes(59, 59, 999);

      const condicionExistente = await CondicionMeteorologica.findOne({
        where: {
          fecha_hora: {
            [Op.between]: [inicio, fin],
          },
        },
      });

      if (condicionExistente) {
        res.status(409).json({
          status: "error",
          message: "Ya existe una condición meteorológica para esta fecha/hora",
          error: "CONDICION_ALREADY_EXISTS",
        });
        return;
      }

      // Crear la condición meteorológica
      const nuevaCondicion = await CondicionMeteorologica.create({
        fecha_hora: new Date(fecha_hora),
        oleaje,
        viento_velocidad,
        viento_direccion,
        visibilidad,
        estado_puerto,
        prediccion_5_dias,
        fuente,
      });

      res.status(201).json({
        status: "success",
        message: "Condición meteorológica creada exitosamente",
        data: { condicion: nuevaCondicion },
      });
    } catch (error) {
      console.error("Error al crear condición meteorológica:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Actualizar una condición meteorológica existente
   * PUT /api/clima/:id
   */
  static async updateCondicion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        fecha_hora,
        oleaje,
        viento_velocidad,
        viento_direccion,
        visibilidad,
        estado_puerto,
        prediccion_5_dias,
        fuente,
      } = req.body;

      const condicion = await CondicionMeteorologica.findByPk(id);

      if (!condicion) {
        res.status(404).json({
          status: "error",
          message: "Condición meteorológica no encontrada",
          error: "CONDICION_NOT_FOUND",
        });
        return;
      }

      // Actualizar la condición
      const datosActualizacion: any = {};
      if (fecha_hora) datosActualizacion.fecha_hora = new Date(fecha_hora);
      if (oleaje !== undefined) datosActualizacion.oleaje = oleaje;
      if (viento_velocidad !== undefined)
        datosActualizacion.viento_velocidad = viento_velocidad;
      if (viento_direccion)
        datosActualizacion.viento_direccion = viento_direccion;
      if (visibilidad) datosActualizacion.visibilidad = visibilidad;
      if (estado_puerto) datosActualizacion.estado_puerto = estado_puerto;
      if (prediccion_5_dias)
        datosActualizacion.prediccion_5_dias = prediccion_5_dias;
      if (fuente) datosActualizacion.fuente = fuente;

      await condicion.update(datosActualizacion);

      res.status(200).json({
        status: "success",
        message: "Condición meteorológica actualizada exitosamente",
        data: { condicion },
      });
    } catch (error) {
      console.error("Error al actualizar condición meteorológica:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Eliminar una condición meteorológica
   * DELETE /api/clima/:id
   */
  static async deleteCondicion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const condicion = await CondicionMeteorologica.findByPk(id);

      if (!condicion) {
        res.status(404).json({
          status: "error",
          message: "Condición meteorológica no encontrada",
          error: "CONDICION_NOT_FOUND",
        });
        return;
      }

      await condicion.destroy();

      res.status(200).json({
        status: "success",
        message: "Condición meteorológica eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar condición meteorológica:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener la condición meteorológica actual
   * GET /api/clima/actual
   */
  static async getCondicionActual(_req: Request, res: Response): Promise<void> {
    try {
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
      });

      if (!condicionActual) {
        res.status(404).json({
          status: "error",
          message: "No hay condiciones meteorológicas registradas",
          error: "NO_CONDITIONS_FOUND",
        });
        return;
      }

      // Calcular tiempo transcurrido desde la última actualización
      const ahora = getCurrentMexicoTime();
      const tiempoTranscurrido =
        ahora.getTime() - condicionActual.fecha_hora.getTime();
      const horasTranscurridas = Math.floor(
        tiempoTranscurrido / (1000 * 60 * 60)
      );

      res.status(200).json({
        status: "success",
        message: "Condición meteorológica actual obtenida exitosamente",
        data: {
          condicion: condicionActual,
          tiempo_transcurrido_horas: horasTranscurridas,
          necesita_actualizacion: horasTranscurridas > 6, // Más de 6 horas
        },
      });
    } catch (error) {
      console.error("Error al obtener condición actual:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener predicción meteorológica
   * GET /api/clima/prediccion
   */
  static async getPrediccion(req: Request, res: Response): Promise<void> {
    try {
      const { dias = 5 } = req.query;

      // Obtener las condiciones más recientes
      const condicionesRecientes = await CondicionMeteorologica.findAll({
        order: [["fecha_hora", "DESC"]],
        limit: Number(dias),
      });

      if (condicionesRecientes.length === 0) {
        res.status(404).json({
          status: "error",
          message: "No hay datos meteorológicos para generar predicción",
          error: "NO_DATA_FOR_PREDICTION",
        });
        return;
      }

      // Calcular promedios y tendencias
      const promedioOleaje =
        condicionesRecientes.reduce((sum, c) => sum + c.oleaje, 0) /
        condicionesRecientes.length;
      const promedioViento =
        condicionesRecientes.reduce((sum, c) => sum + c.viento_velocidad, 0) /
        condicionesRecientes.length;

      // Determinar tendencia del oleaje
      const oleajeTendencia =
        condicionesRecientes.length > 1
          ? condicionesRecientes[0]!.oleaje > condicionesRecientes[1]!.oleaje
            ? "creciente"
            : "decreciente"
          : "estable";

      // Determinar tendencia del viento
      const vientoTendencia =
        condicionesRecientes.length > 1
          ? condicionesRecientes[0]!.viento_velocidad >
            condicionesRecientes[1]!.viento_velocidad
            ? "creciente"
            : "decreciente"
          : "estable";

      // Generar predicción básica
      const prediccion = {
        periodo_dias: Number(dias),
        promedio_oleaje: Math.round(promedioOleaje * 100) / 100,
        promedio_viento: Math.round(promedioViento * 100) / 100,
        tendencia_oleaje: oleajeTendencia,
        tendencia_viento: vientoTendencia,
        recomendacion: this.generarRecomendacion(
          promedioOleaje,
          promedioViento
        ),
        condiciones_por_dia: condicionesRecientes.map((c) => ({
          fecha: c.fecha_hora,
          oleaje: c.oleaje,
          viento: c.viento_velocidad,
          estado_puerto: c.estado_puerto,
          visibilidad: c.visibilidad,
        })),
      };

      res.status(200).json({
        status: "success",
        message: "Predicción meteorológica generada exitosamente",
        data: { prediccion },
      });
    } catch (error) {
      console.error("Error al generar predicción:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener alertas meteorológicas
   * GET /api/clima/alertas
   */
  static async getAlertas(_req: Request, res: Response): Promise<void> {
    try {
      // Obtener la condición más reciente
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
      });

      if (!condicionActual) {
        res.status(404).json({
          status: "error",
          message: "No hay condiciones meteorológicas para evaluar alertas",
          error: "NO_CONDITIONS_FOUND",
        });
        return;
      }

      const alertas = [];

      // Alerta por oleaje alto
      if (condicionActual.oleaje > 2.5) {
        alertas.push({
          tipo: "oleaje_alto",
          severidad: "alta",
          mensaje: `Oleaje alto detectado: ${condicionActual.oleaje}m. Se recomienda suspender salidas.`,
          valor: condicionActual.oleaje,
          umbral: 2.5,
        });
      } else if (condicionActual.oleaje > 1.5) {
        alertas.push({
          tipo: "oleaje_moderado",
          severidad: "media",
          mensaje: `Oleaje moderado: ${condicionActual.oleaje}m. Precaución en salidas.`,
          valor: condicionActual.oleaje,
          umbral: 1.5,
        });
      }

      // Alerta por viento fuerte
      if (condicionActual.viento_velocidad > 30) {
        alertas.push({
          tipo: "viento_fuerte",
          severidad: "alta",
          mensaje: `Viento fuerte detectado: ${condicionActual.viento_velocidad} km/h. Se recomienda suspender salidas.`,
          valor: condicionActual.viento_velocidad,
          umbral: 30,
        });
      } else if (condicionActual.viento_velocidad > 20) {
        alertas.push({
          tipo: "viento_moderado",
          severidad: "media",
          mensaje: `Viento moderado: ${condicionActual.viento_velocidad} km/h. Precaución en salidas.`,
          valor: condicionActual.viento_velocidad,
          umbral: 20,
        });
      }

      // Alerta por visibilidad reducida
      if (condicionActual.visibilidad === "baja") {
        alertas.push({
          tipo: "visibilidad_baja",
          severidad: "alta",
          mensaje:
            "Visibilidad reducida detectada. Se recomienda suspender salidas.",
          valor: condicionActual.visibilidad,
          umbral: "baja",
        });
      }

      // Alerta por puerto cerrado
      if (condicionActual.estado_puerto === EstadoPuerto.CERRADO) {
        alertas.push({
          tipo: "puerto_cerrado",
          severidad: "critica",
          mensaje: "Puerto cerrado por condiciones meteorológicas adversas.",
          valor: condicionActual.estado_puerto,
          umbral: EstadoPuerto.CERRADO,
        });
      } else if (condicionActual.estado_puerto === EstadoPuerto.RESTRICCIONES) {
        alertas.push({
          tipo: "restricciones_puerto",
          severidad: "media",
          mensaje:
            "Restricciones en el puerto. Verificar condiciones antes de salir.",
          valor: condicionActual.estado_puerto,
          umbral: EstadoPuerto.RESTRICCIONES,
        });
      }

      // Alerta por emergencia
      if (condicionActual.estado_puerto === EstadoPuerto.EMERGENCIA) {
        alertas.push({
          tipo: "emergencia",
          severidad: "critica",
          mensaje:
            "EMERGENCIA: Puerto en estado de emergencia. Suspender todas las actividades.",
          valor: condicionActual.estado_puerto,
          umbral: EstadoPuerto.EMERGENCIA,
        });
      }

      res.status(200).json({
        status: "success",
        message: "Alertas meteorológicas obtenidas exitosamente",
        data: {
          alertas,
          total_alertas: alertas.length,
          alertas_criticas: alertas.filter((a) => a.severidad === "critica")
            .length,
          alertas_altas: alertas.filter((a) => a.severidad === "alta").length,
          alertas_medias: alertas.filter((a) => a.severidad === "media").length,
          condicion_actual: {
            fecha_hora: condicionActual.fecha_hora,
            oleaje: condicionActual.oleaje,
            viento_velocidad: condicionActual.viento_velocidad,
            visibilidad: condicionActual.visibilidad,
            estado_puerto: condicionActual.estado_puerto,
          },
        },
      });
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estadísticas meteorológicas
   * GET /api/clima/estadisticas
   */
  static async getEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      // Construir filtros
      const where: any = {};
      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio as string);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin as string);
        fin.setHours(23, 59, 59, 999);
        where.fecha_hora = {
          [Op.between]: [inicio, fin],
        };
      }

      // Obtener todas las condiciones en el período
      const condiciones = await CondicionMeteorologica.findAll({
        where,
        order: [["fecha_hora", "ASC"]],
      });

      if (condiciones.length === 0) {
        res.status(404).json({
          status: "error",
          message: "No hay datos meteorológicos en el período especificado",
          error: "NO_DATA_FOUND",
        });
        return;
      }

      // Calcular estadísticas
      const oleajes = condiciones.map((c) => c.oleaje);
      const vientos = condiciones.map((c) => c.viento_velocidad);

      const estadisticas = {
        periodo: {
          fecha_inicio: condiciones[0]!.fecha_hora,
          fecha_fin: condiciones[condiciones.length - 1]!.fecha_hora,
          total_registros: condiciones.length,
        },
        oleaje: {
          promedio:
            Math.round(
              (oleajes.reduce((sum, val) => sum + val, 0) / oleajes.length) *
                100
            ) / 100,
          minimo: Math.min(...oleajes),
          maximo: Math.max(...oleajes),
          registros_oleaje_alto: oleajes.filter((o) => o > 2.0).length,
        },
        viento: {
          promedio:
            Math.round(
              (vientos.reduce((sum, val) => sum + val, 0) / vientos.length) *
                100
            ) / 100,
          minimo: Math.min(...vientos),
          maximo: Math.max(...vientos),
          registros_viento_fuerte: vientos.filter((v) => v > 25).length,
        },
        estado_puerto: {
          abierto: condiciones.filter(
            (c) => c.estado_puerto === EstadoPuerto.ABIERTO
          ).length,
          restricciones: condiciones.filter(
            (c) => c.estado_puerto === EstadoPuerto.RESTRICCIONES
          ).length,
          cerrado: condiciones.filter(
            (c) => c.estado_puerto === EstadoPuerto.CERRADO
          ).length,
          emergencia: condiciones.filter(
            (c) => c.estado_puerto === EstadoPuerto.EMERGENCIA
          ).length,
        },
        visibilidad: {
          excelente: condiciones.filter((c) => c.visibilidad === "excelente")
            .length,
          buena: condiciones.filter((c) => c.visibilidad === "buena").length,
          regular: condiciones.filter((c) => c.visibilidad === "regular")
            .length,
          baja: condiciones.filter((c) => c.visibilidad === "baja").length,
        },
      };

      res.status(200).json({
        status: "success",
        message: "Estadísticas meteorológicas obtenidas exitosamente",
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

  /**
   * Método auxiliar para generar recomendaciones basadas en condiciones
   */
  private static generarRecomendacion(oleaje: number, viento: number): string {
    if (oleaje > 2.5 || viento > 30) {
      return "Condiciones adversas. Se recomienda suspender todas las salidas.";
    } else if (oleaje > 1.5 || viento > 20) {
      return "Condiciones moderadas. Precaución en salidas, especialmente para embarcaciones menores.";
    } else if (oleaje > 1.0 || viento > 15) {
      return "Condiciones aceptables. Salidas permitidas con precaución.";
    } else {
      return "Condiciones favorables. Salidas recomendadas para todos los tipos de embarcación.";
    }
  }
}

export default ClimaController;
