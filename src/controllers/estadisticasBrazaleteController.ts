import { Request, Response } from "express";
import { Op } from "sequelize";
import LoteBrazalete from "../models/LoteBrazalete";
import Brazalete from "../models/Brazalete";
import VentaBrazalete from "../models/VentaBrazalete";
import User from "../models/User";
import { createLogger } from "../utils/logger";

const logger = createLogger("EstadisticasBrazaleteController");

export class EstadisticasBrazaleteController {
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
   * GET /api/brazaletes/estadisticas
   * Obtener estadísticas generales del sistema de brazaletes
   */
  static async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      // Definir rango de fechas (por defecto último mes)
      let fechaFin: Date;
      let fechaInicio: Date;

      if (fecha_fin) {
        // Si se proporciona fecha_fin, ajustar al final del día en UTC (23:59:59.999)
        fechaFin = new Date(fecha_fin as string);
        fechaFin.setUTCHours(23, 59, 59, 999);
      } else {
        fechaFin = new Date();
      }

      if (fecha_inicio) {
        // Si se proporciona fecha_inicio, ajustar al inicio del día en UTC (00:00:00.000)
        fechaInicio = new Date(fecha_inicio as string);
        fechaInicio.setUTCHours(0, 0, 0, 0);
      } else {
        fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // ============================================================================
      // ESTADÍSTICAS DE INVENTARIO
      // ============================================================================

      const totalComprados = await Brazalete.count();
      const totalDisponibles = await Brazalete.count({
        where: {
          estado: "disponible",
          prestador_id: null,
        } as any,
      });
      const totalVendidos = await Brazalete.count({
        where: {
          prestador_id: { [Op.ne]: null },
        } as any,
      });
      const totalUtilizados = await Brazalete.count({
        where: { estado: "utilizado" },
      });

      // ============================================================================
      // ESTADÍSTICAS DE INGRESOS
      // ============================================================================

      const ventasTotales =
        (await VentaBrazalete.sum("total", {
          where: {
            fecha_venta: {
              [Op.between]: [fechaInicio, fechaFin],
            },
            estado_pago: "pagado",
          },
        })) || 0;

      // Ingresos por mes
      const ingresosPorMes =
        await EstadisticasBrazaleteController.calcularIngresosPorMes(
          fechaInicio,
          fechaFin
        );

      // ============================================================================
      // ESTADÍSTICAS DE UTILIZACIÓN
      // ============================================================================

      const utilizacionPorTipo = {
        universal: await Brazalete.count({
          where: {
            tipo: "universal",
            estado: "utilizado",
            fecha_uso: {
              [Op.between]: [fechaInicio, fechaFin],
            },
          },
        }),
      };

      const utilizacionPorNacionalidad = {
        locales: await Brazalete.count({
          where: {
            estado: "utilizado",
            turista_nacionalidad: "local",
            fecha_uso: {
              [Op.between]: [fechaInicio, fechaFin],
            },
          },
        }),
        nacionales: await Brazalete.count({
          where: {
            estado: "utilizado",
            turista_nacionalidad: "nacional",
            fecha_uso: {
              [Op.between]: [fechaInicio, fechaFin],
            },
          },
        }),
        internacionales: await Brazalete.count({
          where: {
            estado: "utilizado",
            turista_nacionalidad: "internacional",
            fecha_uso: {
              [Op.between]: [fechaInicio, fechaFin],
            },
          },
        }),
      };

      res.json({
        success: true,
        data: {
          periodo: {
            fecha_inicio:
              EstadisticasBrazaleteController.extraerSoloFecha(fechaInicio),
            fecha_fin:
              EstadisticasBrazaleteController.extraerSoloFecha(fechaFin),
          },
          inventario: {
            total_comprados: totalComprados,
            total_disponibles: totalDisponibles,
            total_vendidos: totalVendidos,
            total_utilizados: totalUtilizados,
          },
          ingresos: {
            ventas_totales: parseFloat(ventasTotales.toString()),
            por_mes: ingresosPorMes,
          },
          utilizacion: {
            por_tipo: utilizacionPorTipo,
            por_nacionalidad: utilizacionPorNacionalidad,
          },
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/brazaletes/alertas
   * Obtener alertas del sistema
   */
  static async obtenerAlertas(_req: Request, res: Response): Promise<void> {
    try {
      const alertas = [];

      // ============================================================================
      // ALERTA: STOCK BAJO
      // ============================================================================

      const totalBrazaletes = await Brazalete.count();
      const disponibles = await Brazalete.count({
        where: { estado: "disponible" },
      });

      if (disponibles < totalBrazaletes * 0.1) {
        alertas.push({
          tipo: "stock_bajo",
          severidad: "alta" as const,
          mensaje: `Solo quedan ${disponibles} brazaletes disponibles (${Math.round(
            (disponibles / totalBrazaletes) * 100
          )}% del inventario)`,
          fecha: new Date(),
        });
      }

      // Alertas por tipo específico
      const disponiblesUniversal = await Brazalete.count({
        where: { tipo: "universal", estado: "disponible" },
      });

      if (disponiblesUniversal < 10) {
        alertas.push({
          tipo: "stock_bajo",
          severidad:
            disponiblesUniversal < 5 ? ("alta" as const) : ("media" as const),
          mensaje: `Solo quedan ${disponiblesUniversal} brazaletes disponibles`,
          fecha: new Date(),
        });
      }

      // ============================================================================
      // ALERTA: LOTES POR VENCER
      // ============================================================================

      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + 30); // 30 días antes

      const lotesPorVencer = await LoteBrazalete.findAll({
        where: {
          fecha_vencimiento: {
            [Op.between]: [new Date(), fechaLimite],
          },
          estado: "activo",
        },
      });

      for (const lote of lotesPorVencer) {
        if (!lote.fecha_vencimiento) continue;
        const fechaVencStr = typeof lote.fecha_vencimiento === 'string' 
          ? lote.fecha_vencimiento 
          : (lote.fecha_vencimiento as Date).toISOString().split('T')[0];
        const hoyStr = new Date().toISOString().split('T')[0];
        const fechaVencDate = new Date(fechaVencStr + 'T12:00:00');
        const hoyDate = new Date(hoyStr + 'T12:00:00');
        const diasRestantes = Math.ceil(
          (fechaVencDate.getTime() - hoyDate.getTime()) /
            (1000 * 3600 * 24)
        );

        alertas.push({
          tipo: "lote_por_vencer",
          severidad: diasRestantes < 7 ? ("alta" as const) : ("media" as const),
          mensaje: `Lote ${lote.numero_lote} vence en ${diasRestantes} días`,
          fecha: new Date(),
        });
      }

      // ============================================================================
      // ALERTA: PRESTADORES SIN STOCK
      // ============================================================================

      const prestadoresConPocoStock = await User.findAll({
        where: { rol: "prestador", activo: true },
        include: [
          {
            model: Brazalete,
            as: "brazaletes",
            where: { estado: "disponible" },
            required: false,
          },
        ],
      });

      for (const prestador of prestadoresConPocoStock) {
        const brazaletesDisponibles =
          (prestador as any).brazaletes?.length || 0;

        if (brazaletesDisponibles < 10) {
          let mensaje = "";
          let severidad: "alta" | "media" = "media";

          if (brazaletesDisponibles === 0) {
            mensaje = `${prestador.nombre} no tiene brazaletes - stock agotado`;
            severidad = "alta";
          } else if (brazaletesDisponibles === 1) {
            mensaje = `${prestador.nombre} tiene solo 1 brazalete - stock crítico`;
            severidad = "media";
          } else if (brazaletesDisponibles >= 2 && brazaletesDisponibles <= 5) {
            mensaje = `${prestador.nombre} tiene ${brazaletesDisponibles} brazaletes - stock muy bajo`;
            severidad = "media";
          } else if (brazaletesDisponibles >= 6 && brazaletesDisponibles <= 9) {
            mensaje = `${prestador.nombre} tiene ${brazaletesDisponibles} brazaletes - stock bajo`;
            severidad = "media";
          }

          alertas.push({
            tipo: "prestador_sin_stock",
            severidad: severidad,
            mensaje: mensaje,
            fecha: new Date(),
          });
        }
      }

      // ============================================================================
      // ALERTA: LOTES VENCIDOS
      // ============================================================================

      const lotesVencidos = await LoteBrazalete.count({
        where: {
          fecha_vencimiento: {
            [Op.lt]: new Date(),
          },
          estado: "activo",
        },
      });

      if (lotesVencidos > 0) {
        alertas.push({
          tipo: "lotes_vencidos",
          severidad: "alta" as const,
          mensaje: `Hay ${lotesVencidos} lote(s) vencido(s) que necesitan actualización de estado`,
          fecha: new Date(),
        });
      }

      res.json({
        success: true,
        data: {
          alertas: alertas.sort((a, b) => {
            // Ordenar por severidad: alta > media > baja
            const severidadOrder = { alta: 3, media: 2, baja: 1 };
            return severidadOrder[b.severidad] - severidadOrder[a.severidad];
          }),
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener alertas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/brazaletes/reportes/ventas
   * Reporte detallado de ventas
   */
  static async reporteVentas(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin, prestador_id } = req.query;

      const fechaFin = fecha_fin ? new Date(fecha_fin as string) : new Date();
      const fechaInicio = fecha_inicio
        ? new Date(fecha_inicio as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        fecha_venta: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      };

      if (prestador_id) {
        whereClause.prestador_id = prestador_id;
      }

      const ventas = await VentaBrazalete.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["nombre", "email", "telefono"],
          },
          {
            model: LoteBrazalete,
            as: "lote",
            attributes: ["numero_lote", "tipo"],
          },
        ],
        order: [["fecha_venta", "DESC"]],
      });

      // Calcular totales
      const totalVentas = ventas.length;
      const totalBrazaletes = ventas.reduce(
        (sum, venta) => sum + venta.cantidad,
        0
      );
      const totalIngresos = ventas.reduce(
        (sum, venta) => sum + parseFloat(venta.total.toString()),
        0
      );

      // Agrupar por prestador
      const ventasPorPrestador = ventas.reduce((acc: any, venta) => {
        const prestadorId = venta.prestador_id;
        if (!acc[prestadorId]) {
          acc[prestadorId] = {
            prestador: (venta as any).prestador,
            total_ventas: 0,
            total_brazaletes: 0,
            total_ingresos: 0,
          };
        }
        acc[prestadorId].total_ventas += 1;
        acc[prestadorId].total_brazaletes += venta.cantidad;
        acc[prestadorId].total_ingresos += parseFloat(venta.total.toString());
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          periodo: {
            fecha_inicio:
              EstadisticasBrazaleteController.extraerSoloFecha(fechaInicio),
            fecha_fin:
              EstadisticasBrazaleteController.extraerSoloFecha(fechaFin),
          },
          resumen: {
            total_ventas: totalVentas,
            total_brazaletes: totalBrazaletes,
            total_ingresos: totalIngresos,
          },
          ventas_detalle: ventas,
          ventas_por_prestador: Object.values(ventasPorPrestador),
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al generar reporte de ventas:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/brazaletes/reportes/utilizacion
   * Reporte de utilización de brazaletes
   */
  static async reporteUtilizacion(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin, tipo } = req.query;

      const fechaFin = fecha_fin ? new Date(fecha_fin as string) : new Date();
      const fechaInicio = fecha_inicio
        ? new Date(fecha_inicio as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        estado: "utilizado",
        fecha_uso: {
          [Op.between]: [fechaInicio, fechaFin],
        },
      };

      if (tipo) {
        whereClause.tipo = tipo;
      }

      const brazaletesUtilizados = await Brazalete.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["nombre", "email"],
          },
          {
            model: LoteBrazalete,
            as: "lote",
            attributes: ["numero_lote", "tipo"],
          },
        ],
        order: [["fecha_uso", "DESC"]],
      });

      // Estadísticas por nacionalidad
      const porNacionalidad = {
        locales: brazaletesUtilizados.filter(
          (b) => b.turista_nacionalidad === "local"
        ).length,
        nacionales: brazaletesUtilizados.filter(
          (b) => b.turista_nacionalidad === "nacional"
        ).length,
        internacionales: brazaletesUtilizados.filter(
          (b) => b.turista_nacionalidad === "internacional"
        ).length,
        sin_especificar: brazaletesUtilizados.filter(
          (b) => !b.turista_nacionalidad
        ).length,
      };

      // Estadísticas por tipo
      const porTipo = {
        universal: brazaletesUtilizados.length, // Todos son universales ahora
      };

      // Estadísticas por edad
      const edades = brazaletesUtilizados
        .filter((b) => b.turista_edad !== null)
        .map((b) => b.turista_edad!);

      const estadisticasEdad =
        edades.length > 0
          ? {
              promedio: Math.round(
                edades.reduce((sum, edad) => sum + edad, 0) / edades.length
              ),
              minima: Math.min(...edades),
              maxima: Math.max(...edades),
              total_con_edad: edades.length,
            }
          : null;

      res.json({
        success: true,
        data: {
          periodo: {
            fecha_inicio:
              EstadisticasBrazaleteController.extraerSoloFecha(fechaInicio),
            fecha_fin:
              EstadisticasBrazaleteController.extraerSoloFecha(fechaFin),
          },
          resumen: {
            total_utilizados: brazaletesUtilizados.length,
            por_nacionalidad: porNacionalidad,
            por_tipo: porTipo,
            estadisticas_edad: estadisticasEdad,
          },
          utilizacion_detalle: brazaletesUtilizados,
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al generar reporte de utilización:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private static async calcularIngresosPorMes(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<any[]> {
    const ventas = await VentaBrazalete.findAll({
      where: {
        fecha_venta: {
          [Op.between]: [fechaInicio, fechaFin],
        },
        estado_pago: "pagado",
      },
      order: [["fecha_venta", "ASC"]],
    });

    const ingresosPorMes: {
      [key: string]: { cantidad: number; monto: number };
    } = {};

    for (const venta of ventas) {
      const fechaVentaStr = typeof venta.fecha_venta === 'string' ? venta.fecha_venta : (venta.fecha_venta as Date).toISOString().split('T')[0];
      if (!fechaVentaStr) continue;
      const mes = fechaVentaStr.slice(0, 7); // YYYY-MM
      if (!ingresosPorMes[mes]) {
        ingresosPorMes[mes] = { cantidad: 0, monto: 0 };
      }
      ingresosPorMes[mes].cantidad += venta.cantidad;
      ingresosPorMes[mes].monto += parseFloat(venta.total.toString());
    }

    return Object.entries(ingresosPorMes).map(([mes, datos]) => ({
      mes,
      cantidad: datos.cantidad,
      monto: datos.monto,
    }));
  }
}

export default EstadisticasBrazaleteController;
