import { col, fn, Op } from 'sequelize';
import { Bloque, CondicionMeteorologica, Embarcacion, Invitacion, Salida, User } from '../models';
import {
  ApiResponse,
  EstadoBloque,
  EstadoEmbarcacion,
  EstadoPermiso,
  EstadoPuerto,
  EstadoSalida,
  TipoEmbarcacion,
  UserRole,
} from '../types';
import {
  AlertaSistemaDTO,
  BloquesPorEstadoAgregado,
  CondicionClimaDashboardDTO,
  EmbarcacionDashboardDTO,
  EmbarcacionesPorEstadoAgregado,
  EmbarcacionesPorPrestadorDTO,
  GetAlertasSistemaResponse,
  GetEstadisticasDashboardResponse,
  GetEstadoEmbarcacionesResponse,
  GetEstadoPermisosResponse,
  GetOcupacionQuery,
  GetOcupacionResponse,
  GetResumenClimaQuery,
  GetResumenClimaResponse,
  InvitacionesPorUsoAgregado,
  OcupacionPorDiaDTO,
  PrestadorResumenDTO,
  SalidasPorEstadoAgregado,
  UsuarioPermisoDTO,
  UsuariosPorEstadoAgregado,
} from '../types/dashboard.types';
import { extraerSoloFechaUTC, getCurrentMexicoTime, getTodayMexico } from '../utils/dateUtils';

type EmbarcacionConPrestador = Embarcacion & {
  prestador?: Pick<User, 'id' | 'nombre' | 'email' | 'telefono'>;
};

const totalDe = <T extends { total: string | number }>(
  filas: T[],
  coincide: (item: T) => boolean
): number => Number(filas.find(coincide)?.total ?? 0);

const porcentaje = (parte: number, total: number): number =>
  total > 0 ? Math.round((parte / total) * 100) : 0;

const sumarTotales = (filas: Array<{ total: string | number }>): number =>
  filas.reduce((acc, curr) => acc + Number(curr.total), 0);

const addDaysToDateOnly = (fecha: string, days: number): string => {
  const parts = fecha.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().split('T')[0] ?? fecha;
};

const toCondicionDashboard = (condicion: CondicionMeteorologica): CondicionClimaDashboardDTO =>
  condicion.toJSON() as CondicionClimaDashboardDTO;

const toUsuarioPermiso = (user: User): UsuarioPermisoDTO => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  telefono: user.telefono,
  fechaVencimientoPermiso: extraerSoloFechaUTC(user.fechaVencimientoPermiso) ?? null,
  estadoPermiso: user.estadoPermiso,
  diasNotificacion: user.diasNotificacion,
  ultimaNotificacion: extraerSoloFechaUTC(user.ultimaNotificacion) ?? null,
  motivoSuspension: user.motivoSuspension ?? null,
});

const toPrestadorResumen = (
  prestador: Pick<User, 'id' | 'nombre' | 'email' | 'telefono'> | undefined,
  prestadorId: string
): PrestadorResumenDTO => ({
  id: prestador?.id ?? prestadorId,
  nombre: prestador?.nombre ?? '',
  email: prestador?.email ?? '',
  telefono: prestador?.telefono,
});

export const getEstadisticasService = async (): Promise<
  ApiResponse<GetEstadisticasDashboardResponse>
> => {
  const ahora = getCurrentMexicoTime();
  const hoy = getTodayMexico();
  const inicioMes = `${hoy.slice(0, 8)}01`;
  const inicioSemana = addDaysToDateOnly(hoy, -7);

  const [
    usuariosPorEstadoRaw,
    embarcacionesPorEstadoRaw,
    bloquesPorEstadoRaw,
    salidasPorEstadoRaw,
    salidasEsteMes,
    salidasEstaSemana,
    invitacionesPorUsoRaw,
    condicionActual,
  ] = await Promise.all([
    User.findAll({
      attributes: ['estadoPermiso', [fn('COUNT', col('id')), 'total']],
      group: ['estadoPermiso'],
      raw: true,
    }),
    Embarcacion.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      group: ['estado'],
      raw: true,
    }),
    Bloque.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      group: ['estado'],
      raw: true,
    }),
    Salida.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      group: ['estado'],
      raw: true,
    }),
    Salida.count({
      where: { fecha: { [Op.gte]: inicioMes } },
    }),
    Salida.count({
      where: { fecha: { [Op.gte]: inicioSemana } },
    }),
    Invitacion.findAll({
      attributes: ['usada', [fn('COUNT', col('id')), 'total']],
      group: ['usada'],
      raw: true,
    }),
    CondicionMeteorologica.findOne({
      order: [['fecha_hora', 'DESC']],
    }),
  ]);

  const usuariosPorEstado = usuariosPorEstadoRaw as unknown as UsuariosPorEstadoAgregado[];
  const embarcacionesPorEstado =
    embarcacionesPorEstadoRaw as unknown as EmbarcacionesPorEstadoAgregado[];
  const bloquesPorEstado = bloquesPorEstadoRaw as unknown as BloquesPorEstadoAgregado[];
  const salidasPorEstado = salidasPorEstadoRaw as unknown as SalidasPorEstadoAgregado[];
  const invitacionesPorUso = invitacionesPorUsoRaw as unknown as InvitacionesPorUsoAgregado[];

  const totalUsuarios = sumarTotales(usuariosPorEstado);
  const usuariosActivos = totalDe(
    usuariosPorEstado,
    (item) => item.estadoPermiso === EstadoPermiso.VIGENTE
  );

  const totalEmbarcaciones = sumarTotales(embarcacionesPorEstado);
  const embarcacionesDisponibles = totalDe(
    embarcacionesPorEstado,
    (item) => item.estado === EstadoEmbarcacion.DISPONIBLE
  );

  const totalBloques = sumarTotales(bloquesPorEstado);
  const bloquesDisponibles = totalDe(
    bloquesPorEstado,
    (item) => item.estado === EstadoBloque.ACTIVO
  );

  const totalSalidas = sumarTotales(salidasPorEstado);
  const salidasCompletadas = totalDe(
    salidasPorEstado,
    (item) => item.estado === EstadoSalida.COMPLETADA
  );

  const totalInvitaciones = sumarTotales(invitacionesPorUso);
  const invitacionesUsadas = totalDe(invitacionesPorUso, (item) => item.usada === true);

  return {
    status: 'success',
    message: 'Estadísticas generales obtenidas correctamente',
    data: {
      estadisticas: {
        sistema: {
          fecha_actual: ahora,
          uptime: process.uptime(),
          version: '1.0.0',
        },
        usuarios: {
          total: totalUsuarios,
          activos: usuariosActivos,
          por_vencer: totalDe(
            usuariosPorEstado,
            (item) => item.estadoPermiso === EstadoPermiso.POR_VENCER
          ),
          vencidos: totalDe(
            usuariosPorEstado,
            (item) => item.estadoPermiso === EstadoPermiso.VENCIDO
          ),
          porcentaje_activos: porcentaje(usuariosActivos, totalUsuarios),
        },
        embarcaciones: {
          total: totalEmbarcaciones,
          disponibles: embarcacionesDisponibles,
          en_uso: totalDe(
            embarcacionesPorEstado,
            (item) => item.estado === EstadoEmbarcacion.EN_USO
          ),
          mantenimiento: totalDe(
            embarcacionesPorEstado,
            (item) => item.estado === EstadoEmbarcacion.MANTENIMIENTO
          ),
          porcentaje_disponibles: porcentaje(embarcacionesDisponibles, totalEmbarcaciones),
        },
        bloques: {
          total: totalBloques,
          disponibles: bloquesDisponibles,
          llenos: totalDe(bloquesPorEstado, (item) => item.estado === EstadoBloque.LLENO),
          cerrados: totalDe(bloquesPorEstado, (item) => item.estado === EstadoBloque.INACTIVO),
          porcentaje_disponibles: porcentaje(bloquesDisponibles, totalBloques),
        },
        salidas: {
          total: totalSalidas,
          programadas: totalDe(
            salidasPorEstado,
            (item) => item.estado === EstadoSalida.PROGRAMADA
          ),
          en_curso: totalDe(salidasPorEstado, (item) => item.estado === EstadoSalida.EN_CURSO),
          completadas: salidasCompletadas,
          canceladas: totalDe(salidasPorEstado, (item) => item.estado === EstadoSalida.CANCELADA),
          este_mes: Number(salidasEsteMes),
          esta_semana: Number(salidasEstaSemana),
          porcentaje_completadas: porcentaje(salidasCompletadas, totalSalidas),
        },
        invitaciones: {
          total: totalInvitaciones,
          usadas: invitacionesUsadas,
          disponibles: totalDe(invitacionesPorUso, (item) => item.usada === false),
          porcentaje_usadas: porcentaje(invitacionesUsadas, totalInvitaciones),
        },
        clima: {
          condicion_actual: condicionActual
            ? {
                fecha_hora: condicionActual.fecha_hora,
                oleaje: Number(condicionActual.oleaje),
                viento_velocidad: Number(condicionActual.viento_velocidad),
                visibilidad: condicionActual.visibilidad,
                estado_puerto: condicionActual.estado_puerto,
              }
            : null,
        },
      },
    },
  };
};

export const getOcupacionService = async (
  query: GetOcupacionQuery
): Promise<ApiResponse<GetOcupacionResponse>> => {
  const dias = Number(query.dias ?? 7);
  const fechaFin = getTodayMexico();
  const fechaInicio = addDaysToDateOnly(fechaFin, -dias);

  const [bloques, totalSalidas] = await Promise.all([
    Bloque.findAll({
      where: {
        fecha: {
          [Op.gte]: fechaInicio,
          [Op.lte]: fechaFin,
        },
      },
      order: [
        ['fecha', 'ASC'],
        ['hora_inicio', 'ASC'],
      ],
    }),
    Salida.count({
      where: {
        fecha: {
          [Op.gte]: fechaInicio,
          [Op.lte]: fechaFin,
        },
      },
    }),
  ]);

  const ocupacionPorDia = new Map<string, OcupacionPorDiaDTO>();
  let sumaPorcentajes = 0;
  let bloquesLlenos = 0;
  let bloquesDisponibles = 0;

  for (const bloque of bloques) {
    const fecha = extraerSoloFechaUTC(bloque.fecha) ?? 'plantilla';
    let dia = ocupacionPorDia.get(fecha);
    if (!dia) {
      dia = {
        fecha,
        bloques: [],
        total_capacidad: 0,
        total_ocupados: 0,
        porcentaje_ocupacion: 0,
      };
      ocupacionPorDia.set(fecha, dia);
    }

    const capacidadTotal = bloque.capacidad_total || 0;
    const porcentajeBloque =
      capacidadTotal > 0 ? (bloque.capacidad_registrada / capacidadTotal) * 100 : 0;

    dia.bloques.push({
      id: bloque.id,
      nombre: bloque.nombre,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      capacidad_total: capacidadTotal,
      capacidad_registrada: bloque.capacidad_registrada,
      estado: bloque.estado,
      porcentaje_ocupacion: Math.round(porcentajeBloque),
    });
    dia.total_capacidad += capacidadTotal;
    dia.total_ocupados += bloque.capacidad_registrada;

    sumaPorcentajes += porcentajeBloque;
    if (bloque.estado === EstadoBloque.LLENO) bloquesLlenos++;
    if (bloque.estado === EstadoBloque.ACTIVO) bloquesDisponibles++;
  }

  for (const dia of ocupacionPorDia.values()) {
    dia.porcentaje_ocupacion = porcentaje(dia.total_ocupados, dia.total_capacidad);
  }

  return {
    status: 'success',
    message: 'Ocupación por día obtenida exitosamente',
    data: {
      ocupacion_por_dia: Array.from(ocupacionPorDia.values()),
      estadisticas: {
        periodo_dias: dias,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        total_bloques: bloques.length,
        total_salidas: Number(totalSalidas),
        promedio_ocupacion:
          bloques.length > 0 ? Math.round(sumaPorcentajes / bloques.length) : 0,
        bloques_llenos: bloquesLlenos,
        bloques_disponibles: bloquesDisponibles,
      },
    },
  };
};

export const getEstadoEmbarcacionesService = async (): Promise<
  ApiResponse<GetEstadoEmbarcacionesResponse>
> => {
  const embarcacionesRaw = (await Embarcacion.findAll({
    include: [
      {
        model: User,
        as: 'prestador',
        attributes: ['id', 'nombre', 'email', 'telefono'],
      },
    ],
    order: [
      ['estado', 'ASC'],
      ['nombre', 'ASC'],
    ],
  })) as EmbarcacionConPrestador[];

  const estadisticas = {
    total: 0,
    disponibles: 0,
    en_uso: 0,
    mantenimiento: 0,
    por_tipo: {
      menor: 0,
      mayor: 0,
    },
  };

  const embarcaciones: EmbarcacionDashboardDTO[] = [];
  const porPrestador = new Map<string, EmbarcacionesPorPrestadorDTO>();

  for (const embarcacion of embarcacionesRaw) {
    const prestador = toPrestadorResumen(embarcacion.prestador, embarcacion.prestador_id);
    const dto: EmbarcacionDashboardDTO = {
      id: embarcacion.id,
      nombre: embarcacion.nombre,
      matricula: embarcacion.matricula,
      capacidad: embarcacion.capacidad,
      tipo: embarcacion.tipo,
      estado: embarcacion.estado,
      prestador_id: embarcacion.prestador_id,
      prestador,
      created_at: embarcacion.created_at,
      updated_at: embarcacion.updated_at,
    };
    embarcaciones.push(dto);

    estadisticas.total++;
    if (embarcacion.estado === EstadoEmbarcacion.DISPONIBLE) estadisticas.disponibles++;
    else if (embarcacion.estado === EstadoEmbarcacion.EN_USO) estadisticas.en_uso++;
    else if (embarcacion.estado === EstadoEmbarcacion.MANTENIMIENTO) estadisticas.mantenimiento++;

    if (embarcacion.tipo === TipoEmbarcacion.MENOR) estadisticas.por_tipo.menor++;
    else if (embarcacion.tipo === TipoEmbarcacion.MAYOR) estadisticas.por_tipo.mayor++;

    let grupo = porPrestador.get(embarcacion.prestador_id);
    if (!grupo) {
      grupo = {
        prestador,
        embarcaciones: [],
        total: 0,
        disponibles: 0,
        en_uso: 0,
        mantenimiento: 0,
      };
      porPrestador.set(embarcacion.prestador_id, grupo);
    }

    grupo.embarcaciones.push({
      id: embarcacion.id,
      nombre: embarcacion.nombre,
      matricula: embarcacion.matricula,
      capacidad: embarcacion.capacidad,
      tipo: embarcacion.tipo,
      estado: embarcacion.estado,
    });
    grupo.total++;
    if (embarcacion.estado === EstadoEmbarcacion.DISPONIBLE) grupo.disponibles++;
    else if (embarcacion.estado === EstadoEmbarcacion.EN_USO) grupo.en_uso++;
    else if (embarcacion.estado === EstadoEmbarcacion.MANTENIMIENTO) grupo.mantenimiento++;
  }

  return {
    status: 'success',
    message: 'Estado de embarcaciones obtenido exitosamente',
    data: {
      embarcaciones,
      estadisticas,
      por_prestador: Array.from(porPrestador.values()),
    },
  };
};

export const getEstadoPermisosService = async (): Promise<
  ApiResponse<GetEstadoPermisosResponse>
> => {
  const proximos30DiasStr = addDaysToDateOnly(getTodayMexico(), 30);

  const usuarios = await User.findAll({
    where: { rol: UserRole.PRESTADOR },
    attributes: [
      'id',
      'nombre',
      'email',
      'telefono',
      'fechaVencimientoPermiso',
      'estadoPermiso',
      'diasNotificacion',
      'ultimaNotificacion',
      'motivoSuspension',
    ],
    order: [['fechaVencimientoPermiso', 'ASC']],
  });

  const todosLosUsuarios: UsuarioPermisoDTO[] = [];
  const usuariosPendientes: UsuarioPermisoDTO[] = [];
  const usuariosPorVencer: UsuarioPermisoDTO[] = [];
  const usuariosVencidos: UsuarioPermisoDTO[] = [];
  const usuariosVencenProximos: UsuarioPermisoDTO[] = [];
  let vigentes = 0;

  for (const user of usuarios) {
    const dto = toUsuarioPermiso(user);
    todosLosUsuarios.push(dto);

    if (user.estadoPermiso === EstadoPermiso.PENDIENTE) usuariosPendientes.push(dto);
    else if (user.estadoPermiso === EstadoPermiso.POR_VENCER) usuariosPorVencer.push(dto);
    else if (user.estadoPermiso === EstadoPermiso.VENCIDO) usuariosVencidos.push(dto);
    else if (user.estadoPermiso === EstadoPermiso.VIGENTE) {
      vigentes++;
      if (dto.fechaVencimientoPermiso && dto.fechaVencimientoPermiso <= proximos30DiasStr) {
        usuariosVencenProximos.push(dto);
      }
    }
  }

  return {
    status: 'success',
    message: 'Estado de permisos obtenido exitosamente',
    data: {
      estadisticas: {
        total_prestadores: usuarios.length,
        vigentes,
        por_vencer: usuariosPorVencer.length,
        vencidos: usuariosVencidos.length,
        pendientes: usuariosPendientes.length,
        vencen_proximos_30_dias: usuariosVencenProximos.length,
      },
      usuarios_pendientes: usuariosPendientes,
      usuarios_por_vencer: usuariosPorVencer,
      usuarios_vencidos: usuariosVencidos,
      usuarios_vencen_proximos_30_dias: usuariosVencenProximos,
      todos_los_usuarios: todosLosUsuarios,
    },
  };
};

export const getResumenClimaService = async (
  query: GetResumenClimaQuery
): Promise<ApiResponse<GetResumenClimaResponse>> => {
  const dias = Number(query.dias ?? 7);
  const fechaInicio = new Date(getCurrentMexicoTime());
  fechaInicio.setDate(fechaInicio.getDate() - dias);

  const condiciones = await CondicionMeteorologica.findAll({
    where: {
      fecha_hora: { [Op.gte]: fechaInicio },
    },
    order: [['fecha_hora', 'DESC']],
    limit: dias,
  });

  const condicionActualModel =
    condiciones[0] ??
    (await CondicionMeteorologica.findOne({
      order: [['fecha_hora', 'DESC']],
    }));

  const condicionesRecientes = condiciones.map(toCondicionDashboard);
  const condicionActual = condicionActualModel ? toCondicionDashboard(condicionActualModel) : null;

  let sumaOleaje = 0;
  let sumaViento = 0;
  const estadoPuerto = {
    abierto: 0,
    restricciones: 0,
    cerrado: 0,
    emergencia: 0,
  };

  for (const condicion of condiciones) {
    sumaOleaje += Number(condicion.oleaje);
    sumaViento += Number(condicion.viento_velocidad);
    if (condicion.estado_puerto === EstadoPuerto.ABIERTO) estadoPuerto.abierto++;
    else if (condicion.estado_puerto === EstadoPuerto.RESTRICCIONES) estadoPuerto.restricciones++;
    else if (condicion.estado_puerto === EstadoPuerto.CERRADO) estadoPuerto.cerrado++;
    else if (condicion.estado_puerto === EstadoPuerto.EMERGENCIA) estadoPuerto.emergencia++;
  }

  const totalCondiciones = condiciones.length;
  const alertas = [];
  if (condicionActual) {
    if (condicionActual.oleaje > 2.5) {
      alertas.push({
        tipo: 'oleaje_alto',
        severidad: 'alta',
        mensaje: `Oleaje alto: ${condicionActual.oleaje}m`,
      });
    }
    if (condicionActual.viento_velocidad > 30) {
      alertas.push({
        tipo: 'viento_fuerte',
        severidad: 'alta',
        mensaje: `Viento fuerte: ${condicionActual.viento_velocidad} km/h`,
      });
    }
    if (condicionActual.estado_puerto === EstadoPuerto.CERRADO) {
      alertas.push({
        tipo: 'puerto_cerrado',
        severidad: 'critica',
        mensaje: 'Puerto cerrado por condiciones adversas',
      });
    }
  }

  return {
    status: 'success',
    message: 'Resumen meteorológico obtenido exitosamente',
    data: {
      condicion_actual: condicionActual,
      promedios: {
        oleaje:
          totalCondiciones > 0 ? Math.round((sumaOleaje / totalCondiciones) * 100) / 100 : 0,
        viento:
          totalCondiciones > 0 ? Math.round((sumaViento / totalCondiciones) * 100) / 100 : 0,
      },
      estado_puerto: estadoPuerto,
      alertas,
      condiciones_recientes: condicionesRecientes,
      periodo_dias: dias,
    },
  };
};

export const getAlertasSistemaService = async (): Promise<
  ApiResponse<GetAlertasSistemaResponse>
> => {
  const ahora = getCurrentMexicoTime();

  const [usuariosPorEstadoRaw, embarcacionesPorEstadoRaw, bloquesPorEstadoRaw, condicionActual] =
    await Promise.all([
      User.findAll({
        attributes: ['estadoPermiso', [fn('COUNT', col('id')), 'total']],
        group: ['estadoPermiso'],
        raw: true,
      }),
      Embarcacion.findAll({
        attributes: ['estado', [fn('COUNT', col('id')), 'total']],
        group: ['estado'],
        raw: true,
      }),
      Bloque.findAll({
        attributes: ['estado', [fn('COUNT', col('id')), 'total']],
        group: ['estado'],
        raw: true,
      }),
      CondicionMeteorologica.findOne({
        order: [['fecha_hora', 'DESC']],
      }),
    ]);

  const usuariosPorEstado = usuariosPorEstadoRaw as unknown as UsuariosPorEstadoAgregado[];
  const embarcacionesPorEstado =
    embarcacionesPorEstadoRaw as unknown as EmbarcacionesPorEstadoAgregado[];
  const bloquesPorEstado = bloquesPorEstadoRaw as unknown as BloquesPorEstadoAgregado[];

  const usuariosVencidos = totalDe(
    usuariosPorEstado,
    (item) => item.estadoPermiso === EstadoPermiso.VENCIDO
  );
  const usuariosPorVencer = totalDe(
    usuariosPorEstado,
    (item) => item.estadoPermiso === EstadoPermiso.POR_VENCER
  );
  const embarcacionesMantenimiento = totalDe(
    embarcacionesPorEstado,
    (item) => item.estado === EstadoEmbarcacion.MANTENIMIENTO
  );
  const bloquesLlenos = totalDe(bloquesPorEstado, (item) => item.estado === EstadoBloque.LLENO);

  const alertas: AlertaSistemaDTO[] = [];

  if (usuariosVencidos > 0) {
    alertas.push({
      tipo: 'permisos_vencidos',
      severidad: 'alta',
      mensaje: `${usuariosVencidos} prestador(es) con permisos vencidos`,
      accion: 'Revisar y renovar permisos',
    });
  }

  if (usuariosPorVencer > 0) {
    alertas.push({
      tipo: 'permisos_por_vencer',
      severidad: 'media',
      mensaje: `${usuariosPorVencer} prestador(es) con permisos por vencer`,
      accion: 'Notificar próximos vencimientos',
    });
  }

  if (embarcacionesMantenimiento > 0) {
    alertas.push({
      tipo: 'embarcaciones_mantenimiento',
      severidad: 'media',
      mensaje: `${embarcacionesMantenimiento} embarcación(es) en mantenimiento`,
      accion: 'Verificar estado de mantenimiento',
    });
  }

  if (bloquesLlenos > 0) {
    alertas.push({
      tipo: 'bloques_llenos',
      severidad: 'baja',
      mensaje: `${bloquesLlenos} bloque(s) con capacidad completa`,
      accion: 'Considerar crear bloques adicionales',
    });
  }

  if (condicionActual) {
    if (condicionActual.oleaje > 2.5) {
      alertas.push({
        tipo: 'clima_oleaje_alto',
        severidad: 'alta',
        mensaje: `Oleaje alto: ${condicionActual.oleaje}m`,
        accion: 'Evaluar suspensión de salidas',
      });
    }
    if (condicionActual.viento_velocidad > 30) {
      alertas.push({
        tipo: 'clima_viento_fuerte',
        severidad: 'alta',
        mensaje: `Viento fuerte: ${condicionActual.viento_velocidad} km/h`,
        accion: 'Evaluar suspensión de salidas',
      });
    }
    if (condicionActual.estado_puerto === EstadoPuerto.CERRADO) {
      alertas.push({
        tipo: 'puerto_cerrado',
        severidad: 'critica',
        mensaje: 'Puerto cerrado por condiciones adversas',
        accion: 'Suspender todas las actividades',
      });
    }
  }

  const estadisticas = {
    total: 0,
    criticas: 0,
    altas: 0,
    medias: 0,
    bajas: 0,
  };

  for (const alerta of alertas) {
    estadisticas.total++;
    if (alerta.severidad === 'critica') estadisticas.criticas++;
    else if (alerta.severidad === 'alta') estadisticas.altas++;
    else if (alerta.severidad === 'media') estadisticas.medias++;
    else if (alerta.severidad === 'baja') estadisticas.bajas++;
  }

  return {
    status: 'success',
    message: 'Alertas del sistema obtenidas exitosamente',
    data: {
      alertas,
      estadisticas,
      fecha_consulta: ahora,
    },
  };
};
