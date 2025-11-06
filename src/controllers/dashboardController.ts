import { Request, Response } from "express";
import User from "../models/User";
import Bloque from "../models/Bloque";
import Embarcacion from "../models/Embarcacion";
import Salida from "../models/Salida";
import CondicionMeteorologica from "../models/CondicionMeteorologica";
import Invitacion from "../models/Invitacion";
import { Op } from "sequelize";
import {
  EstadoPermiso,
  EstadoBloque,
  EstadoEmbarcacion,
  EstadoSalida,
  EstadoPuerto,
} from "../types";
import { getCurrentMexicoTime } from "../utils/dateUtils";
import { createLogger } from "../utils/logger";

const logger = createLogger("DashboardController");

/**
 * DashboardController - Vista general del sistema
 *
 * Funcionalidades:
 * - Estadísticas generales del sistema
 * - Ocupación por día y bloque
 * - Estado de embarcaciones
 * - Estado de permisos
 * - Resumen meteorológico
 * - Alertas del sistema
 */
class DashboardController {
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
   * Formatea un usuario para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearUsuarioParaRespuesta(user: any): any {
    const userFormateado = { ...user };
    if (userFormateado.fechaVencimientoPermiso) {
      userFormateado.fechaVencimientoPermiso =
        DashboardController.extraerSoloFecha(
          userFormateado.fechaVencimientoPermiso
        );
    }
    if (userFormateado.ultimaNotificacion) {
      userFormateado.ultimaNotificacion = DashboardController.extraerSoloFecha(
        userFormateado.ultimaNotificacion
      );
    }
    return userFormateado;
  }

  /**
   * Formatea múltiples usuarios para respuesta
   */
  private static formatearUsuariosParaRespuesta(users: any[]): any[] {
    return users.map((user) =>
      DashboardController.formatearUsuarioParaRespuesta(
        user.toJSON ? user.toJSON() : user
      )
    );
  }
  /**
   * Obtener estadísticas generales del sistema
   * GET /api/dashboard/estadisticas
   */
  static async getEstadisticas(_req: Request, res: Response): Promise<void> {
    try {
      const ahora = getCurrentMexicoTime();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - 7);

      // Estadísticas de usuarios
      const totalUsuarios = await User.count();
      const usuariosActivos = await User.count({
        where: { estadoPermiso: EstadoPermiso.VIGENTE },
      });
      const usuariosPorVencer = await User.count({
        where: { estadoPermiso: EstadoPermiso.POR_VENCER },
      });
      const usuariosVencidos = await User.count({
        where: { estadoPermiso: EstadoPermiso.VENCIDO },
      });

      // Estadísticas de embarcaciones
      const totalEmbarcaciones = await Embarcacion.count();
      const embarcacionesDisponibles = await Embarcacion.count({
        where: { estado: EstadoEmbarcacion.DISPONIBLE },
      });
      const embarcacionesEnUso = await Embarcacion.count({
        where: { estado: EstadoEmbarcacion.EN_USO },
      });
      const embarcacionesMantenimiento = await Embarcacion.count({
        where: { estado: EstadoEmbarcacion.MANTENIMIENTO },
      });

      // Estadísticas de bloques
      const totalBloques = await Bloque.count();
      const bloquesDisponibles = await Bloque.count({
        where: { estado: EstadoBloque.ACTIVO },
      });
      const bloquesLlenos = await Bloque.count({
        where: { estado: EstadoBloque.LLENO },
      });
      const bloquesCerrados = await Bloque.count({
        where: { estado: EstadoBloque.INACTIVO },
      });

      // Estadísticas de salidas
      const totalSalidas = await Salida.count();
      const salidasProgramadas = await Salida.count({
        where: { estado: EstadoSalida.PROGRAMADA },
      });
      const salidasEnCurso = await Salida.count({
        where: { estado: EstadoSalida.EN_CURSO },
      });
      const salidasCompletadas = await Salida.count({
        where: { estado: EstadoSalida.COMPLETADA },
      });
      const salidasCanceladas = await Salida.count({
        where: { estado: EstadoSalida.CANCELADA },
      });

      // Estadísticas del mes actual
      const salidasEsteMes = await Salida.count({
        where: {
          fecha: {
            [Op.gte]: inicioMes,
          },
        },
      });

      // Estadísticas de la semana actual
      const salidasEstaSemana = await Salida.count({
        where: {
          fecha: {
            [Op.gte]: inicioSemana,
          },
        },
      });

      // Estadísticas de invitaciones
      const totalInvitaciones = await Invitacion.count();
      const invitacionesUsadas = await Invitacion.count({
        where: { usada: true },
      });
      const invitacionesDisponibles = await Invitacion.count({
        where: { usada: false },
      });

      // Condición meteorológica actual
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
      });

      const estadisticas = {
        sistema: {
          fecha_actual: ahora,
          uptime: process.uptime(),
          version: "1.0.0",
        },
        usuarios: {
          total: totalUsuarios,
          activos: usuariosActivos,
          por_vencer: usuariosPorVencer,
          vencidos: usuariosVencidos,
          porcentaje_activos:
            totalUsuarios > 0
              ? Math.round((Number(usuariosActivos) / totalUsuarios) * 100)
              : 0,
        },
        embarcaciones: {
          total: totalEmbarcaciones,
          disponibles: embarcacionesDisponibles,
          en_uso: embarcacionesEnUso,
          mantenimiento: embarcacionesMantenimiento,
          porcentaje_disponibles:
            totalEmbarcaciones > 0
              ? Math.round(
                  (embarcacionesDisponibles / totalEmbarcaciones) * 100
                )
              : 0,
        },
        bloques: {
          total: totalBloques,
          disponibles: bloquesDisponibles,
          llenos: bloquesLlenos,
          cerrados: bloquesCerrados,
          porcentaje_disponibles:
            totalBloques > 0
              ? Math.round((bloquesDisponibles / totalBloques) * 100)
              : 0,
        },
        salidas: {
          total: totalSalidas,
          programadas: salidasProgramadas,
          en_curso: salidasEnCurso,
          completadas: salidasCompletadas,
          canceladas: salidasCanceladas,
          este_mes: salidasEsteMes,
          esta_semana: salidasEstaSemana,
          porcentaje_completadas:
            totalSalidas > 0
              ? Math.round((salidasCompletadas / totalSalidas) * 100)
              : 0,
        },
        invitaciones: {
          total: totalInvitaciones,
          usadas: invitacionesUsadas,
          disponibles: invitacionesDisponibles,
          porcentaje_usadas:
            totalInvitaciones > 0
              ? Math.round((invitacionesUsadas / totalInvitaciones) * 100)
              : 0,
        },
        clima: {
          condicion_actual: condicionActual
            ? {
                fecha_hora: condicionActual.fecha_hora,
                oleaje: condicionActual.oleaje,
                viento_velocidad: condicionActual.viento_velocidad,
                visibilidad: condicionActual.visibilidad,
                estado_puerto: condicionActual.estado_puerto,
              }
            : null,
        },
      };

      res.status(200).json({
        status: "success",
        message: "Estadísticas generales obtenidas exitosamente",
        data: { estadisticas },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener estadísticas generales:",
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
   * Obtener ocupación por día
   * GET /api/dashboard/ocupacion
   */
  static async getOcupacion(req: Request, res: Response): Promise<void> {
    try {
      const { dias = 7 } = req.query;
      const ahora = getCurrentMexicoTime();
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - Number(dias));

      // Normalizar fechas para comparación (solo fecha, sin hora)
      const fechaInicioNormalizada = new Date(
        fechaInicio.getFullYear(),
        fechaInicio.getMonth(),
        fechaInicio.getDate()
      );
      const ahoraNormalizada = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );

      // Obtener bloques en el rango de fechas
      const bloques = await Bloque.findAll({
        where: {
          fecha: {
            [Op.gte]: fechaInicioNormalizada,
            [Op.lte]: ahoraNormalizada,
          },
        },
        order: [
          ["fecha", "ASC"],
          ["hora_inicio", "ASC"],
        ],
      });

      // Obtener salidas en el rango de fechas
      const salidas = await Salida.findAll({
        where: {
          fecha: {
            [Op.gte]: fechaInicio,
            [Op.lte]: ahora,
          },
        },
        include: [
          {
            model: Bloque,
            as: "bloque",
            attributes: [
              "id",
              "nombre",
              "fecha",
              "hora_inicio",
              "hora_fin",
              "capacidad_total",
            ],
          },
        ],
      });

      // Calcular ocupación por día
      const ocupacionPorDia = new Map();

      bloques.forEach((bloque) => {
        const fecha =
          typeof bloque.fecha === "string"
            ? bloque.fecha
            : bloque.fecha && typeof (bloque.fecha as Date).toISOString === 'function'
            ? (bloque.fecha as Date).toISOString().split("T")[0]
            : "plantilla";
        if (!ocupacionPorDia.has(fecha)) {
          ocupacionPorDia.set(fecha, {
            fecha,
            bloques: [],
            total_capacidad: 0,
            total_ocupados: 0,
            porcentaje_ocupacion: 0,
          });
        }

        const dia = ocupacionPorDia.get(fecha);
        const capacidadTotal = bloque.capacidad_total || 0;
        dia.bloques.push({
          id: bloque.id,
          nombre: bloque.nombre,
          hora_inicio: bloque.hora_inicio,
          hora_fin: bloque.hora_fin,
          capacidad_total: capacidadTotal,
          capacidad_registrada: bloque.capacidad_registrada,
          estado: bloque.estado,
          porcentaje_ocupacion:
            capacidadTotal > 0
              ? Math.round(
                  (bloque.capacidad_registrada / capacidadTotal) * 100
                )
              : 0,
        });

        dia.total_capacidad += capacidadTotal;
        dia.total_ocupados += bloque.capacidad_registrada;
      });

      // Calcular porcentaje de ocupación por día
      ocupacionPorDia.forEach((dia) => {
        dia.porcentaje_ocupacion =
          dia.total_capacidad > 0
            ? Math.round((dia.total_ocupados / dia.total_capacidad) * 100)
            : 0;
      });

      // Estadísticas de ocupación
      const estadisticasOcupacion = {
        periodo_dias: Number(dias),
        fecha_inicio: DashboardController.extraerSoloFecha(fechaInicio),
        fecha_fin: DashboardController.extraerSoloFecha(ahora),
        total_bloques: bloques.length,
        total_salidas: salidas.length,
        promedio_ocupacion:
          bloques.length > 0
            ? Math.round(
                bloques.reduce(
                  (sum, b) => {
                    const capacidadTotal = b.capacidad_total || 0;
                    return sum +
                    (capacidadTotal > 0
                      ? (b.capacidad_registrada / capacidadTotal) * 100
                      : 0);
                  },
                  0
                ) / bloques.length
              )
            : 0,
        bloques_llenos: bloques.filter((b) => b.estado === EstadoBloque.LLENO)
          .length,
        bloques_disponibles: bloques.filter(
          (b) => b.estado === EstadoBloque.ACTIVO
        ).length,
      };

      res.status(200).json({
        status: "success",
        message: "Ocupación por día obtenida exitosamente",
        data: {
          ocupacion_por_dia: Array.from(ocupacionPorDia.values()),
          estadisticas: estadisticasOcupacion,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error al obtener ocupación:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }

  /**
   * Obtener estado de embarcaciones
   * GET /api/dashboard/embarcaciones
   */
  static async getEstadoEmbarcaciones(
    _req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Obtener todas las embarcaciones con sus prestadores
      const embarcaciones = await Embarcacion.findAll({
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email", "telefono"],
          },
        ],
        order: [
          ["estado", "ASC"],
          ["nombre", "ASC"],
        ],
      });

      // Estadísticas por estado
      const estadisticas = {
        total: embarcaciones.length,
        disponibles: embarcaciones.filter(
          (e) => e.estado === EstadoEmbarcacion.DISPONIBLE
        ).length,
        en_uso: embarcaciones.filter(
          (e) => e.estado === EstadoEmbarcacion.EN_USO
        ).length,
        mantenimiento: embarcaciones.filter(
          (e) => e.estado === EstadoEmbarcacion.MANTENIMIENTO
        ).length,
        por_tipo: {
          menor: embarcaciones.filter((e) => e.tipo === "menor").length,
          mayor: embarcaciones.filter((e) => e.tipo === "mayor").length,
        },
      };

      // Embarcaciones por prestador
      const embarcacionesPorPrestador = new Map();
      embarcaciones.forEach((embarcacion) => {
        const prestadorId = embarcacion.prestador_id;
        if (!embarcacionesPorPrestador.has(prestadorId)) {
          embarcacionesPorPrestador.set(prestadorId, {
            prestador: embarcacion.prestador_id,
            embarcaciones: [],
            total: 0,
            disponibles: 0,
            en_uso: 0,
            mantenimiento: 0,
          });
        }

        const prestador = embarcacionesPorPrestador.get(prestadorId);
        prestador.embarcaciones.push({
          id: embarcacion.id,
          nombre: embarcacion.nombre,
          matricula: embarcacion.matricula,
          capacidad: embarcacion.capacidad,
          tipo: embarcacion.tipo,
          estado: embarcacion.estado,
        });

        prestador.total++;
        if (embarcacion.estado === EstadoEmbarcacion.DISPONIBLE)
          prestador.disponibles++;
        else if (embarcacion.estado === EstadoEmbarcacion.EN_USO)
          prestador.en_uso++;
        else if (embarcacion.estado === EstadoEmbarcacion.MANTENIMIENTO)
          prestador.mantenimiento++;
      });

      res.status(200).json({
        status: "success",
        message: "Estado de embarcaciones obtenido exitosamente",
        data: {
          embarcaciones,
          estadisticas,
          por_prestador: Array.from(embarcacionesPorPrestador.values()),
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener estado de embarcaciones:",
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
   * Obtener estado de permisos
   * GET /api/dashboard/permisos
   */
  static async getEstadoPermisos(_req: Request, res: Response): Promise<void> {
    try {
      const ahora = getCurrentMexicoTime();
      const proximos30Dias = new Date(ahora);
      proximos30Dias.setDate(ahora.getDate() + 30);
      const proximos30DiasStr = proximos30Dias.toISOString().split('T')[0];

      // Obtener usuarios con información de permisos
      const usuarios = await User.findAll({
        where: {
          rol: "prestador",
        },
        attributes: [
          "id",
          "nombre",
          "email",
          "telefono",
          "fechaVencimientoPermiso",
          "estadoPermiso",
          "dias_notificacion",
          "ultima_notificacion",
          "motivo_suspension",
        ],
        order: [["fechaVencimientoPermiso", "ASC"]],
      });

      // Estadísticas de permisos
      const estadisticas = {
        total_prestadores: usuarios.length,
        vigentes: usuarios.filter(
          (u) => u.estadoPermiso === EstadoPermiso.VIGENTE
        ).length,
        por_vencer: usuarios.filter(
          (u) => u.estadoPermiso === EstadoPermiso.POR_VENCER
        ).length,
        vencidos: usuarios.filter(
          (u) => u.estadoPermiso === EstadoPermiso.VENCIDO
        ).length,
        vencen_proximos_30_dias: usuarios.filter(
          (u) =>
            u.fechaVencimientoPermiso &&
            typeof u.fechaVencimientoPermiso === 'string' &&
            proximos30DiasStr &&
            u.fechaVencimientoPermiso <= proximos30DiasStr &&
            u.estadoPermiso === EstadoPermiso.VIGENTE
        ).length,
      };

      // Usuarios que requieren atención
      const usuariosPorVencer = usuarios.filter(
        (u) => u.estadoPermiso === EstadoPermiso.POR_VENCER
      );
      const usuariosVencidos = usuarios.filter(
        (u) => u.estadoPermiso === EstadoPermiso.VENCIDO
      );
      const usuariosVencenProximos = usuarios.filter(
        (u) =>
          u.fechaVencimientoPermiso &&
          typeof u.fechaVencimientoPermiso === 'string' &&
          proximos30DiasStr &&
          u.fechaVencimientoPermiso <= proximos30DiasStr &&
          u.estadoPermiso === EstadoPermiso.VIGENTE
      );

      // Formatear usuarios con fechas en YYYY-MM-DD
      const usuariosFormateados =
        DashboardController.formatearUsuariosParaRespuesta(usuarios);
      const usuariosPorVencerFormateados =
        DashboardController.formatearUsuariosParaRespuesta(usuariosPorVencer);
      const usuariosVencidosFormateados =
        DashboardController.formatearUsuariosParaRespuesta(usuariosVencidos);
      const usuariosVencenProximosFormateados =
        DashboardController.formatearUsuariosParaRespuesta(
          usuariosVencenProximos
        );

      res.status(200).json({
        status: "success",
        message: "Estado de permisos obtenido exitosamente",
        data: {
          estadisticas,
          usuarios_por_vencer: usuariosPorVencerFormateados,
          usuarios_vencidos: usuariosVencidosFormateados,
          usuarios_vencen_proximos_30_dias: usuariosVencenProximosFormateados,
          todos_los_usuarios: usuariosFormateados,
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener estado de permisos:",
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
   * Obtener resumen meteorológico
   * GET /api/dashboard/clima
   */
  static async getResumenClima(req: Request, res: Response): Promise<void> {
    try {
      const { dias = 7 } = req.query;
      const ahora = getCurrentMexicoTime();
      const fechaInicio = new Date(ahora);
      fechaInicio.setDate(ahora.getDate() - Number(dias));

      // Obtener condiciones meteorológicas recientes
      const condiciones = await CondicionMeteorologica.findAll({
        where: {
          fecha_hora: {
            [Op.gte]: fechaInicio,
          },
        },
        order: [["fecha_hora", "DESC"]],
        limit: Number(dias),
      });

      // Condición actual
      const condicionActual =
        condiciones[0] ||
        (await CondicionMeteorologica.findOne({
          order: [["fecha_hora", "DESC"]],
        }));

      // Calcular promedios
      const promedios = {
        oleaje:
          condiciones.length > 0
            ? Math.round(
                (condiciones.reduce((sum, c) => sum + c.oleaje, 0) /
                  condiciones.length) *
                  100
              ) / 100
            : 0,
        viento:
          condiciones.length > 0
            ? Math.round(
                (condiciones.reduce((sum, c) => sum + c.viento_velocidad, 0) /
                  condiciones.length) *
                  100
              ) / 100
            : 0,
      };

      // Estado del puerto en el período
      const estadoPuerto = {
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
      };

      // Alertas meteorológicas
      const alertas = [];
      if (condicionActual) {
        if (condicionActual.oleaje > 2.5) {
          alertas.push({
            tipo: "oleaje_alto",
            severidad: "alta",
            mensaje: `Oleaje alto: ${condicionActual.oleaje}m`,
          });
        }
        if (condicionActual.viento_velocidad > 30) {
          alertas.push({
            tipo: "viento_fuerte",
            severidad: "alta",
            mensaje: `Viento fuerte: ${condicionActual.viento_velocidad} km/h`,
          });
        }
        if (condicionActual.estado_puerto === EstadoPuerto.CERRADO) {
          alertas.push({
            tipo: "puerto_cerrado",
            severidad: "critica",
            mensaje: "Puerto cerrado por condiciones adversas",
          });
        }
      }

      res.status(200).json({
        status: "success",
        message: "Resumen meteorológico obtenido exitosamente",
        data: {
          condicion_actual: condicionActual,
          promedios,
          estado_puerto: estadoPuerto,
          alertas,
          condiciones_recientes: condiciones,
          periodo_dias: Number(dias),
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener resumen meteorológico:",
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
   * Obtener alertas del sistema
   * GET /api/dashboard/alertas
   */
  static async getAlertasSistema(_req: Request, res: Response): Promise<void> {
    try {
      const ahora = getCurrentMexicoTime();
      const alertas = [];

      // Alertas de permisos
      const usuariosPorVencer = await User.count({
        where: { estadoPermiso: EstadoPermiso.POR_VENCER },
      });
      const usuariosVencidos = await User.count({
        where: { estadoPermiso: EstadoPermiso.VENCIDO },
      });

      if (Number(usuariosVencidos) > 0) {
        alertas.push({
          tipo: "permisos_vencidos",
          severidad: "alta",
          mensaje: `${usuariosVencidos} prestador(es) con permisos vencidos`,
          accion: "Revisar y renovar permisos",
        });
      }

      if (Number(usuariosPorVencer) > 0) {
        alertas.push({
          tipo: "permisos_por_vencer",
          severidad: "media",
          mensaje: `${usuariosPorVencer} prestador(es) con permisos por vencer`,
          accion: "Notificar próximos vencimientos",
        });
      }

      // Alertas de embarcaciones
      const embarcacionesMantenimiento = await Embarcacion.count({
        where: { estado: EstadoEmbarcacion.MANTENIMIENTO },
      });
      if (embarcacionesMantenimiento > 0) {
        alertas.push({
          tipo: "embarcaciones_mantenimiento",
          severidad: "media",
          mensaje: `${embarcacionesMantenimiento} embarcación(es) en mantenimiento`,
          accion: "Verificar estado de mantenimiento",
        });
      }

      // Alertas de bloques
      const bloquesLlenos = await Bloque.count({
        where: { estado: EstadoBloque.LLENO },
      });
      if (bloquesLlenos > 0) {
        alertas.push({
          tipo: "bloques_llenos",
          severidad: "baja",
          mensaje: `${bloquesLlenos} bloque(s) con capacidad completa`,
          accion: "Considerar crear bloques adicionales",
        });
      }

      // Alertas meteorológicas
      const condicionActual = await CondicionMeteorologica.findOne({
        order: [["fecha_hora", "DESC"]],
      });

      if (condicionActual) {
        if (condicionActual.oleaje > 2.5) {
          alertas.push({
            tipo: "clima_oleaje_alto",
            severidad: "alta",
            mensaje: `Oleaje alto: ${condicionActual.oleaje}m`,
            accion: "Evaluar suspensión de salidas",
          });
        }
        if (condicionActual.viento_velocidad > 30) {
          alertas.push({
            tipo: "clima_viento_fuerte",
            severidad: "alta",
            mensaje: `Viento fuerte: ${condicionActual.viento_velocidad} km/h`,
            accion: "Evaluar suspensión de salidas",
          });
        }
        if (condicionActual.estado_puerto === EstadoPuerto.CERRADO) {
          alertas.push({
            tipo: "puerto_cerrado",
            severidad: "critica",
            mensaje: "Puerto cerrado por condiciones adversas",
            accion: "Suspender todas las actividades",
          });
        }
      }

      // Estadísticas de alertas
      const estadisticasAlertas = {
        total: alertas.length,
        criticas: alertas.filter((a) => a.severidad === "critica").length,
        altas: alertas.filter((a) => a.severidad === "alta").length,
        medias: alertas.filter((a) => a.severidad === "media").length,
        bajas: alertas.filter((a) => a.severidad === "baja").length,
      };

      res.status(200).json({
        status: "success",
        message: "Alertas del sistema obtenidas exitosamente",
        data: {
          alertas,
          estadisticas: estadisticasAlertas,
          fecha_consulta: ahora,
        },
      });
    } catch (error) {
      logger.error(
        { err: error },
        "Error al obtener alertas del sistema:",
        error
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  }
}

export default DashboardController;
