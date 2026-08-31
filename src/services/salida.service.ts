import { col, fn, literal, Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import Bloque from '../models/Bloque';
import Brazalete from '../models/Brazalete';
import Embarcacion from '../models/Embarcacion';
import PlantillaBloque from '../models/PlantillaBloque';
import Salida from '../models/Salida';
import User from '../models/User';
import { toBloqueResponse } from './bloque.service';
import {
  ApiResponse,
  EstadoBloque,
  EstadoBrazalete,
  EstadoEmbarcacion,
  EstadoSalida,
  UserRole,
} from '../types';
import {
  ALIAS_EN_PROGRESO,
  BloqueSalidaDTO,
  CancelarSalidaDTO,
  CreateSalidaDTO,
  EstadisticasSalidasListadoDTO,
  GetSalidaByIdResponse,
  GetSalidasQuery,
  GetSalidasResponse,
  GetSalidaStatsQuery,
  GetSalidaStatsResponse,
  SalidaDTO,
  SalidasPorEstadoAgregado,
  UpdateSalidaDTO,
} from '../types/salida.types';
import { extraerSoloFechaUTC } from '../utils/dateUtils';
import { createLogger } from '../utils/logger';

const logger = createLogger('SalidaService');

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

const ESTADOS_CANCELADOS = [
  EstadoSalida.CANCELADA,
  EstadoSalida.CANCELADA_POR_CLIMA,
  EstadoSalida.CANCELADA_CAPITARIA,
] as const;

const ESTADOS_ACTIVOS = [EstadoSalida.PROGRAMADA, EstadoSalida.EN_CURSO] as const;

interface AuthUser {
  id: string;
  rol: UserRole;
}

const PRESTADOR_INCLUDE = {
  model: User,
  as: 'prestador' as const,
  attributes: ['id', 'nombre', 'email', 'telefono'],
};

const EMBARCACION_INCLUDE = {
  model: Embarcacion,
  as: 'embarcacion' as const,
  attributes: ['id', 'nombre', 'matricula', 'capacidad', 'tipo'],
};

const PLANTILLA_INCLUDE = {
  model: PlantillaBloque,
  as: 'plantillaBloque' as const,
  required: false,
};

const BLOQUE_INCLUDE = {
  model: Bloque,
  as: 'bloque' as const,
  required: false,
  include: [PLANTILLA_INCLUDE],
  attributes: [
    'id',
    'nombre',
    'hora_inicio',
    'hora_fin',
    'capacidad_total',
    'capacidad_registrada',
    'destino',
    'es_plantilla',
    'plantilla_id',
    'fecha',
    'estado',
  ],
};

const INCLUDES_COMPLETOS = [PRESTADOR_INCLUDE, EMBARCACION_INCLUDE, BLOQUE_INCLUDE];
const INCLUDES_PRESTADOR = [EMBARCACION_INCLUDE, BLOQUE_INCLUDE];

const totalDe = (filas: SalidasPorEstadoAgregado[], estado: EstadoSalida): number =>
  Number(filas.find((fila) => fila.estado === estado)?.total ?? 0);

const normalizarFecha = (fecha: string | Date): string => extraerSoloFechaUTC(fecha) as string;

const normalizarEstado = (estado?: string): EstadoSalida | undefined => {
  if (!estado) return undefined;
  if (estado === ALIAS_EN_PROGRESO) return EstadoSalida.EN_CURSO;
  return estado as EstadoSalida;
};

const toBloqueSalidaDTO = (bloque: Bloque | object): BloqueSalidaDTO => {
  const mapped = toBloqueResponse(bloque as Bloque);
  return {
    id: mapped.id,
    nombre: mapped.nombre,
    hora_inicio: mapped.hora_inicio,
    hora_fin: mapped.hora_fin,
    capacidad_total: mapped.capacidad_total,
    destino: mapped.destino,
    fecha: mapped.fecha,
    es_plantilla: mapped.es_plantilla,
    plantilla_id: mapped.plantilla_id,
  };
};

const toSalidaDTO = (salida: Salida): SalidaDTO => {
  const json = salida.toJSON() as SalidaDTO & { bloque?: Bloque | object | null; fecha: string };
  return {
    ...json,
    fecha: normalizarFecha(json.fecha),
    bloque: json.bloque ? toBloqueSalidaDTO(json.bloque) : (json.bloque ?? null),
  };
};

const requireSalidaCompleta = async (id: string): Promise<Salida> => {
  const salida = await Salida.findByPk(id, { include: INCLUDES_COMPLETOS });
  if (!salida) throw new AppError('Salida no encontrada', 404);
  return salida;
};

const whereSalidas = (filtros: GetSalidasQuery): WhereOptions => {
  const where: WhereOptions = {};

  if (filtros.fecha) where['fecha'] = normalizarFecha(filtros.fecha);
  else if (filtros.fecha_inicio && filtros.fecha_fin) {
    where['fecha'] = {
      [Op.between]: [normalizarFecha(filtros.fecha_inicio), normalizarFecha(filtros.fecha_fin)],
    };
  }

  const estado = normalizarEstado(filtros.estado);
  if (estado) where['estado'] = estado;
  if (filtros.prestador_id) where['prestador_id'] = filtros.prestador_id;
  if (filtros.embarcacion_id) where['embarcacion_id'] = filtros.embarcacion_id;
  if (filtros.bloque_id) where['bloque_id'] = filtros.bloque_id;

  return where;
};

const whereSinEstado = (where: WhereOptions): WhereOptions => {
  const { estado: _estado, ...rest } = where as Record<string, unknown>;
  return rest as WhereOptions;
};

const estadisticasListado = async (
  where: WhereOptions,
  total: number
): Promise<EstadisticasSalidasListadoDTO> => {
  const filas = (await Salida.findAll({
    attributes: ['estado', [fn('COUNT', col('id')), 'total']],
    where: whereSinEstado(where),
    group: ['estado'],
    raw: true,
  })) as unknown as SalidasPorEstadoAgregado[];

  return {
    total,
    programadas: totalDe(filas, EstadoSalida.PROGRAMADA),
    en_progreso: totalDe(filas, EstadoSalida.EN_CURSO),
    completadas: totalDe(filas, EstadoSalida.COMPLETADA),
    canceladas: totalDe(filas, EstadoSalida.CANCELADA),
  };
};

const listarSalidas = async (
  filtros: GetSalidasQuery,
  includePrestador: boolean
): Promise<GetSalidasResponse> => {
  const page = filtros.page ?? 1;
  const limit = filtros.limit ?? 10;
  const where = whereSalidas(filtros);

  const [resultado, estadisticas] = await Promise.all([
    Salida.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      include: includePrestador ? INCLUDES_COMPLETOS : INCLUDES_PRESTADOR,
      order: [['fecha', 'DESC']],
    }),
    estadisticasListado(where, 0),
  ]);

  return {
    salidas: resultado.rows.map(toSalidaDTO),
    estadisticas: { ...estadisticas, total: resultado.count },
    pagination: {
      page,
      limit,
      total: resultado.count,
      totalPages: Math.ceil(resultado.count / limit) || 0,
    },
  };
};

const contarSalidasActivasEmbarcacion = (embarcacionId: string): Promise<number> =>
  Salida.count({
    where: {
      embarcacion_id: embarcacionId,
      estado: { [Op.in]: [...ESTADOS_ACTIVOS] },
    },
  });

const liberarEmbarcacionSiLibre = async (embarcacionId: string): Promise<void> => {
  const otrasActivas = await contarSalidasActivasEmbarcacion(embarcacionId);
  if (otrasActivas > 0) return;

  const embarcacion = await Embarcacion.findByPk(embarcacionId);
  if (embarcacion) {
    await embarcacion.update({ estado: EstadoEmbarcacion.DISPONIBLE });
  }
};

const actualizarCapacidadRegistradaBloque = async (
  bloqueId: string,
  fecha: string | Date
): Promise<void> => {
  try {
    const fechaComparar = normalizarFecha(fecha);
    const capacidadRegistrada =
      (await Salida.sum('numero_pasajeros', {
        where: {
          bloque_id: bloqueId,
          fecha: fechaComparar,
          estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
        },
      })) || 0;

    const bloque = await Bloque.findByPk(bloqueId, { include: [PLANTILLA_INCLUDE] });
    if (!bloque) return;

    const capacidadTotal = toBloqueResponse(bloque).capacidad_total || 0;
    let nuevoEstado = bloque.estado;
    if (capacidadRegistrada >= capacidadTotal && capacidadTotal > 0) {
      nuevoEstado = EstadoBloque.LLENO;
    } else if (bloque.estado === EstadoBloque.LLENO && capacidadRegistrada < capacidadTotal) {
      nuevoEstado = EstadoBloque.ACTIVO;
    }

    await bloque.update({
      capacidad_registrada: capacidadRegistrada,
      estado: nuevoEstado,
    });
  } catch (error) {
    logger.error(
      { err: error },
      'Error al actualizar capacidad_registrada del bloque:',
      error
    );
  }
};

export const getAllSalidasService = async (
  query: GetSalidasQuery
): Promise<ApiResponse<GetSalidasResponse>> => {
  const data = await listarSalidas(query, true);
  return {
    status: 'success',
    message: 'Salidas obtenidas exitosamente',
    data,
  };
};

export const getMisSalidasService = async (
  prestadorId: string,
  query: GetSalidasQuery
): Promise<ApiResponse<GetSalidasResponse>> => {
  const data = await listarSalidas({ ...query, prestador_id: prestadorId }, false);
  return {
    status: 'success',
    message: 'Mis salidas obtenidas exitosamente',
    data,
  };
};

export const getSalidaByIdService = async (
  id: string
): Promise<ApiResponse<GetSalidaByIdResponse>> => {
  const salida = await requireSalidaCompleta(id);
  return {
    status: 'success',
    message: 'Salida obtenida exitosamente',
    data: { salida: toSalidaDTO(salida) },
  };
};

export const createSalidaService = async (
  body: CreateSalidaDTO,
  user: AuthUser
): Promise<ApiResponse<GetSalidaByIdResponse>> => {
  const { destino, bloque_id, hora, embarcacion_id, fecha, numero_pasajeros, observaciones } = body;
  const prestador_id = user.id;

  if (!DATE_YYYY_MM_DD.test(fecha)) {
    throw new AppError('Formato de fecha inválido. Debe ser YYYY-MM-DD', 400);
  }

  const fechaComparar = normalizarFecha(fecha);

  const [prestador, embarcacion, conflictoExistente, plantillasDisponibles, bloquesEspecificos] =
    await Promise.all([
      User.findByPk(prestador_id),
      Embarcacion.findByPk(embarcacion_id),
      Salida.findOne({
        where: {
          embarcacion_id,
          fecha: fechaComparar,
          estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
          ...(bloque_id ? { bloque_id } : { bloque_id: { [Op.is]: null } }),
        },
      }),
      PlantillaBloque.count({ where: { destino, activa: true } }),
      Bloque.count({
        where: {
          destino,
          fecha: fechaComparar,
          es_plantilla: false,
          estado: { [Op.ne]: EstadoBloque.INACTIVO },
        },
      }),
    ]);

  if (!prestador) throw new AppError('Prestador no encontrado', 404);
  if (prestador.rol !== UserRole.PRESTADOR) {
    throw new AppError('El usuario debe ser un prestador', 400);
  }
  if (!embarcacion) throw new AppError('Embarcación no encontrada', 404);
  if (conflictoExistente) {
    throw new AppError(
      'La embarcación ya tiene una salida programada para este bloque y fecha',
      400
    );
  }
  if (embarcacion.prestador_id !== prestador_id) {
    throw new AppError('La embarcación no pertenece al prestador', 403);
  }

  const bloquesDisponiblesParaDestino = plantillasDisponibles + bloquesEspecificos;

  if (bloquesDisponiblesParaDestino > 0) {
    if (!bloque_id) {
      throw new AppError(
        `bloque_id es requerido para ${destino} (destino con control de bloques)`,
        400
      );
    }

    const bloque = await Bloque.findOne({
      where: { id: bloque_id },
      include: [PLANTILLA_INCLUDE],
    });
    if (!bloque) throw new AppError('Bloque no encontrado', 404);

    const bloqueFormateado = toBloqueResponse(bloque);
    if (bloqueFormateado.destino !== destino) {
      throw new AppError('Bloque no corresponde al destino especificado', 404);
    }

    const ocupados =
      (await Salida.sum('numero_pasajeros', {
        where: {
          bloque_id,
          fecha: fechaComparar,
          estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
        },
      })) || 0;
    const capacidadDisponible = (bloqueFormateado.capacidad_total || 0) - ocupados;
    if (capacidadDisponible < numero_pasajeros) {
      throw new AppError(`El bloque solo tiene ${capacidadDisponible} cupos disponibles`, 400);
    }
  } else {
    if (!hora) {
      throw new AppError(`hora es requerida para ${destino} (destino sin bloques)`, 400);
    }
    if (bloque_id) {
      throw new AppError(
        `${destino} no utiliza bloques horarios. Use el campo 'hora' en su lugar.`,
        400
      );
    }
  }

  if (numero_pasajeros > embarcacion.capacidad) {
    throw new AppError(
      `La embarcación no puede transportar ${numero_pasajeros} pasajeros. Capacidad máxima: ${embarcacion.capacidad}`,
      400
    );
  }

  const nuevaSalida = await Salida.create({
    prestador_id,
    embarcacion_id,
    destino,
    fecha: fechaComparar,
    numero_pasajeros,
    estado: EstadoSalida.PROGRAMADA,
    ...(bloque_id ? { bloque_id } : {}),
    ...(hora ? { hora } : {}),
    ...(observaciones !== undefined ? { observaciones } : {}),
  });

  if (bloque_id) {
    await nuevaSalida.reload();
    await actualizarCapacidadRegistradaBloque(bloque_id, nuevaSalida.fecha);
  }

  const salidaCompleta = await requireSalidaCompleta(nuevaSalida.id);

  return {
    status: 'success',
    message: 'Salida creada exitosamente',
    data: { salida: toSalidaDTO(salidaCompleta) },
  };
};

export const updateSalidaService = async (
  id: string,
  body: UpdateSalidaDTO
): Promise<ApiResponse<GetSalidaByIdResponse>> => {
  const {
    destino,
    embarcacion_id,
    bloque_id,
    hora,
    fecha,
    numero_pasajeros,
    observaciones,
    estado: estadoRaw,
  } = body;
  const estado = normalizarEstado(estadoRaw);

  const salida = await Salida.findByPk(id, {
    include: [
      {
        model: Bloque,
        as: 'bloque',
        required: false,
        include: [PLANTILLA_INCLUDE],
      },
      { model: Embarcacion, as: 'embarcacion' },
    ],
  });
  if (!salida) throw new AppError('Salida no encontrada', 404);

  if (salida.estado === EstadoSalida.COMPLETADA || salida.estado === EstadoSalida.CANCELADA) {
    throw new AppError('No se puede modificar una salida completada o cancelada', 400);
  }

  if (bloque_id && bloque_id !== salida.bloque_id) {
    const nuevoBloque = await Bloque.findByPk(bloque_id);
    if (!nuevoBloque) throw new AppError('Bloque no encontrado', 404);
    if (nuevoBloque.estado !== EstadoBloque.ACTIVO) {
      throw new AppError('El bloque no está disponible', 400);
    }
  }

  if (embarcacion_id && embarcacion_id !== salida.embarcacion_id) {
    const nuevaEmbarcacion = await Embarcacion.findByPk(embarcacion_id);
    if (!nuevaEmbarcacion) throw new AppError('Embarcación no encontrada', 404);
    if (nuevaEmbarcacion.estado !== EstadoEmbarcacion.DISPONIBLE) {
      throw new AppError('La embarcación no está disponible', 400);
    }
  }

  if (numero_pasajeros && numero_pasajeros !== salida.numero_pasajeros) {
    const embarcacionActual = embarcacion_id
      ? await Embarcacion.findByPk(embarcacion_id)
      : await Embarcacion.findByPk(salida.embarcacion_id);
    if (!embarcacionActual) throw new AppError('Embarcación no encontrada', 404);

    const bloqueIdCapacidad = bloque_id || salida.bloque_id;
    if (bloqueIdCapacidad) {
      const bloqueActual = await Bloque.findByPk(bloqueIdCapacidad, {
        include: [PLANTILLA_INCLUDE],
      });
      if (!bloqueActual) throw new AppError('Bloque no encontrado', 404);

      const capacidadTotal = toBloqueResponse(bloqueActual).capacidad_total || 0;
      const capacidadDisponible =
        capacidadTotal - (bloqueActual.capacidad_registrada - salida.numero_pasajeros);
      if (numero_pasajeros > capacidadDisponible) {
        throw new AppError(
          `No hay suficiente capacidad. Disponible: ${capacidadDisponible}, Solicitado: ${numero_pasajeros}`,
          400
        );
      }
    }

    if (numero_pasajeros > embarcacionActual.capacidad) {
      throw new AppError(
        `La embarcación no puede transportar ${numero_pasajeros} pasajeros. Capacidad máxima: ${embarcacionActual.capacidad}`,
        400
      );
    }
  }

  const datosActualizacion: Record<string, unknown> = {};
  if (destino) datosActualizacion['destino'] = destino;
  if (embarcacion_id) datosActualizacion['embarcacion_id'] = embarcacion_id;
  if (bloque_id) datosActualizacion['bloque_id'] = bloque_id;
  if (hora) datosActualizacion['hora'] = hora;
  if (fecha) datosActualizacion['fecha'] = normalizarFecha(fecha);
  if (numero_pasajeros) datosActualizacion['numero_pasajeros'] = numero_pasajeros;
  if (observaciones !== undefined) datosActualizacion['observaciones'] = observaciones;
  if (estado) datosActualizacion['estado'] = estado;

  const bloqueIdOriginal = salida.bloque_id;
  const fechaOriginal = salida.fecha;

  await salida.update(datosActualizacion);

  const bloqueIdNuevo =
    datosActualizacion['bloque_id'] !== undefined
      ? (datosActualizacion['bloque_id'] as string)
      : bloqueIdOriginal;
  const fechaNueva = datosActualizacion['fecha']
    ? (datosActualizacion['fecha'] as string)
    : fechaOriginal;

  if (bloqueIdOriginal !== bloqueIdNuevo) {
    if (bloqueIdOriginal) {
      await actualizarCapacidadRegistradaBloque(bloqueIdOriginal, fechaOriginal);
    }
    if (bloqueIdNuevo) {
      await actualizarCapacidadRegistradaBloque(bloqueIdNuevo, fechaNueva);
    }
  } else if (
    bloqueIdNuevo &&
    (datosActualizacion['numero_pasajeros'] !== undefined ||
      datosActualizacion['estado'] !== undefined)
  ) {
    await actualizarCapacidadRegistradaBloque(bloqueIdNuevo, fechaNueva);
  }

  if (estado === EstadoSalida.EN_CURSO) {
    const embarcacion = await Embarcacion.findByPk(salida.embarcacion_id);
    if (embarcacion && embarcacion.estado === EstadoEmbarcacion.DISPONIBLE) {
      await embarcacion.update({ estado: EstadoEmbarcacion.EN_USO });
    }
  }

  if (estado === EstadoSalida.COMPLETADA) {
    await liberarEmbarcacionSiLibre(salida.embarcacion_id);
  }

  const salidaActualizada = await requireSalidaCompleta(id);

  return {
    status: 'success',
    message: 'Salida actualizada exitosamente',
    data: { salida: toSalidaDTO(salidaActualizada) },
  };
};

export const cancelarSalidaService = async (
  id: string,
  body: CancelarSalidaDTO
): Promise<ApiResponse<undefined>> => {
  const salida = await Salida.findByPk(id);
  if (!salida) throw new AppError('Salida no encontrada', 404);

  if (salida.estado === EstadoSalida.COMPLETADA) {
    throw new AppError('No se puede cancelar una salida completada', 400);
  }
  if (salida.estado === EstadoSalida.CANCELADA) {
    throw new AppError('La salida ya está cancelada', 400);
  }

  const bloqueIdSalida = salida.bloque_id;
  const fechaSalida = salida.fecha;
  const embarcacionId = salida.embarcacion_id;

  await salida.update({
    estado: EstadoSalida.CANCELADA,
    ...(body.motivo_cancelacion !== undefined
      ? { motivo_cancelacion: body.motivo_cancelacion }
      : {}),
  });

  if (bloqueIdSalida) {
    await actualizarCapacidadRegistradaBloque(bloqueIdSalida, fechaSalida);
  }

  await Brazalete.update(
    {
      estado: EstadoBrazalete.DISPONIBLE,
      salida_id: literal('NULL'),
    },
    {
      where: {
        salida_id: id,
        estado: EstadoBrazalete.ASIGNADO,
      },
    }
  );

  await liberarEmbarcacionSiLibre(embarcacionId);

  return {
    status: 'success',
    message: 'Salida cancelada exitosamente',
  };
};

export const getSalidaStatsService = async (
  query: GetSalidaStatsQuery
): Promise<ApiResponse<GetSalidaStatsResponse>> => {
  const filtros: GetSalidasQuery = {};
  if (query.prestador_id) filtros.prestador_id = query.prestador_id;
  if (query.fecha_inicio) filtros.fecha_inicio = query.fecha_inicio;
  if (query.fecha_fin) filtros.fecha_fin = query.fecha_fin;
  const where = whereSalidas(filtros);

  const [porEstadoRaw, totalSalidas, totalPasajeros] = await Promise.all([
    Salida.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['estado'],
      raw: true,
    }),
    Salida.count({ where }),
    Salida.sum('numero_pasajeros', {
      where: { ...where, estado: EstadoSalida.COMPLETADA },
    }),
  ]);

  const filas = porEstadoRaw as unknown as SalidasPorEstadoAgregado[];

  return {
    status: 'success',
    message: 'Estadísticas obtenidas exitosamente',
    data: {
      estadisticas: {
        total_salidas: totalSalidas,
        por_estado: {
          programada: totalDe(filas, EstadoSalida.PROGRAMADA),
          en_progreso: totalDe(filas, EstadoSalida.EN_CURSO),
          completada: totalDe(filas, EstadoSalida.COMPLETADA),
          cancelada: totalDe(filas, EstadoSalida.CANCELADA),
        },
        total_pasajeros: Number(totalPasajeros ?? 0),
      },
    },
  };
};
