import { Request, Response } from "express";
import Embarcacion from "../models/Embarcacion";
import Salida from "../models/Salida";
import CondicionMeteorologica from "../models/CondicionMeteorologica";
import { Op } from "sequelize";
import { EstadoSalida, EstadoPuerto } from "../types";
import { getTodayMexico, getCurrentMexicoTime } from "../utils/dateUtils";
import { createLogger } from "../utils/logger";
import sequelize from "../config/database";

const logger = createLogger("PublicController");

/**
 * PublicController - Endpoints públicos sin autenticación
 *
 * Funcionalidades:
 * - Estadísticas básicas para homepage
 * - Información del estado del puerto
 * - Datos agregados sin información sensible
 */
class PublicController {
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
   * Obtener estadísticas públicas para la homepage
   * GET /api/public/homepage-stats
   * 
   * Expone información básica sin datos sensibles:
   * - Estado del puerto (abierto/cerrado)
   * - Total de embarcaciones registradas
   * - Salidas programadas hoy (solo cantidad)
   * - Total de pasajeros estimados hoy
   */
  static async getHomepageStats(_req: Request, res: Response): Promise<void> {
    try {
      const ahora = getCurrentMexicoTime();
      const hoy = getTodayMexico(); // Formato YYYY-MM-DD

      // 1. Estado meteorológico actual (estado del puerto)
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
        attributes: [
          "estado_puerto",
          "oleaje", 
          "viento_velocidad",
          "fecha_hora"
        ]
      });

      // 2. Total de embarcaciones registradas
      const totalEmbarcaciones = await Embarcacion.count();

      // 3. Salidas programadas para HOY
      const salidasHoy = await Salida.findAll({
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("DATE", sequelize.col("fecha")),
              hoy
            ),
            {
              estado: {
                [Op.in]: [
                  EstadoSalida.PROGRAMADA,
                  EstadoSalida.EN_CURSO,
                  EstadoSalida.COMPLETADA
                ]
              }
            }
          ]
        },
        attributes: ["id", "numero_pasajeros", "estado"]
      });

      // 4. Calcular total de pasajeros del día
      const totalPasajerosHoy = salidasHoy.reduce(
        (total, salida) => total + salida.numero_pasajeros, 
        0
      );

      // 5. Estadísticas de salidas por estado
      const estadisticasSalidas = {
        total: salidasHoy.length,
        programadas: salidasHoy.filter(s => s.estado === EstadoSalida.PROGRAMADA).length,
        en_curso: salidasHoy.filter(s => s.estado === EstadoSalida.EN_CURSO).length,
        completadas: salidasHoy.filter(s => s.estado === EstadoSalida.COMPLETADA).length
      };

      // 6. Determinar estado general del puerto
      let estadoPuertoSimplificado = "abierto";
      let estadoPuertoTexto = "Puerto Abierto";
      let indicadorColor = "green";

      if (condicionActual) {
        switch (condicionActual.estado_puerto) {
          case EstadoPuerto.ABIERTO:
            estadoPuertoSimplificado = "abierto";
            estadoPuertoTexto = "Puerto Abierto";
            indicadorColor = "green";
            break;
          case EstadoPuerto.RESTRICCIONES:
            estadoPuertoSimplificado = "restricciones";
            estadoPuertoTexto = "Puerto con Restricciones";
            indicadorColor = "yellow";
            break;
          case EstadoPuerto.CERRADO:
            estadoPuertoSimplificado = "cerrado";
            estadoPuertoTexto = "Puerto Cerrado";
            indicadorColor = "red";
            break;
          case EstadoPuerto.EMERGENCIA:
            estadoPuertoSimplificado = "emergencia";
            estadoPuertoTexto = "Puerto en Emergencia";
            indicadorColor = "red";
            break;
          default:
            estadoPuertoSimplificado = "desconocido";
            estadoPuertoTexto = "Estado Desconocido";
            indicadorColor = "gray";
        }
      }

      // 7. Información meteorológica básica (sin detalles sensibles)
      const infoClimaBasica = condicionActual ? {
        oleaje: condicionActual.oleaje,
        viento: condicionActual.viento_velocidad,
        condicion_general: PublicController.determinarCondicionGeneral(
          condicionActual.oleaje, 
          condicionActual.viento_velocidad
        ),
        ultima_actualizacion: PublicController.extraerSoloFecha(condicionActual.fecha_hora)
      } : null;

      // 8. Respuesta estructurada
      const homepageStats = {
        fecha_consulta: PublicController.extraerSoloFecha(ahora),
        hora_consulta: ahora.toLocaleTimeString("es-MX", { 
          timeZone: "America/Mexico_City",
          hour12: false 
        }),
        
        puerto: {
          estado: estadoPuertoSimplificado,
          texto: estadoPuertoTexto,
          color: indicadorColor,
          operativo: estadoPuertoSimplificado === "abierto" || estadoPuertoSimplificado === "restricciones"
        },
        
        embarcaciones: {
          total_registradas: totalEmbarcaciones
        },
        
        actividad_hoy: {
          salidas_programadas: estadisticasSalidas.total,
          salidas_por_estado: {
            programadas: estadisticasSalidas.programadas,
            en_curso: estadisticasSalidas.en_curso,
            completadas: estadisticasSalidas.completadas
          },
          total_pasajeros: totalPasajerosHoy,
          promedio_pasajeros_por_salida: estadisticasSalidas.total > 0 
            ? Math.round(totalPasajerosHoy / estadisticasSalidas.total)
            : 0
        },
        
        clima: infoClimaBasica,
        
        sistema: {
          operativo: true,
          version: "1.0.0",
          ultima_actualizacion: PublicController.extraerSoloFecha(ahora)
        }
      };

      res.status(200).json({
        status: "success",
        message: "Estadísticas públicas obtenidas exitosamente",
        data: homepageStats
      });

    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener estadísticas públicas:",
        error
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR"
      });
    }
  }

  /**
   * Obtener solo el estado del puerto (endpoint ultra-ligero)
   * GET /api/public/puerto-status
   */
  static async getPuertoStatus(_req: Request, res: Response): Promise<void> {
    try {
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
        attributes: ["estado_puerto", "fecha_hora"]
      });

      let estado = "desconocido";
      let operativo = false;
      let color = "gray";

      if (condicionActual) {
        switch (condicionActual.estado_puerto) {
          case EstadoPuerto.ABIERTO:
            estado = "abierto";
            operativo = true;
            color = "green";
            break;
          case EstadoPuerto.RESTRICCIONES:
            estado = "restricciones";
            operativo = true;
            color = "yellow";
            break;
          case EstadoPuerto.CERRADO:
            estado = "cerrado";
            operativo = false;
            color = "red";
            break;
          case EstadoPuerto.EMERGENCIA:
            estado = "emergencia";
            operativo = false;
            color = "red";
            break;
        }
      }

      res.status(200).json({
        status: "success",
        data: {
          puerto: {
            estado,
            operativo,
            color,
            ultima_actualizacion: condicionActual 
              ? PublicController.extraerSoloFecha(condicionActual.fecha_hora)
              : null
          }
        }
      });

    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener estado del puerto:",
        error
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR"
      });
    }
  }

  /**
   * Método auxiliar para determinar condición general del clima
   */
  private static determinarCondicionGeneral(oleaje: number, viento: number): string {
    if (oleaje > 2.5 || viento > 30) {
      return "adversas";
    } else if (oleaje > 1.5 || viento > 20) {
      return "moderadas";
    } else if (oleaje > 1.0 || viento > 15) {
      return "aceptables";
    } else {
      return "favorables";
    }
  }
}

export default PublicController;