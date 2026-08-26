import { Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import { Brazalete, LoteBrazalete, Salida, sequelize, User } from '../models';
import { ApiResponse, EstadoBrazalete, TipoBrazalete, UserRole } from '../types';
import {
  ActualizarUsoBrazaletesResponse,
  ActualizarUsoDTO,
  ActualizarUsoErrorItem,
  AsignarBrazaletesDTO,
  AsignarBrazaletesResponse,
  BrazaleteActor,
  BrazaleteActualizadoItem,
  BrazaleteAsignadoItem,
  BuscarBrazaletesQueries,
  BuscarBrazaletesResponse,
  ObtenerBrazaletesPrestadorResponse,
  ObtenerBrazaletesSalidaResponse,
  RegistarUsoBrazaleteResponse,
  UsarBrazaletesDTO,
} from '../types/brazalete.types';
import { getTodayMexico } from '../utils/dateUtils';
import logger from '../utils/logger';

const assertDueñoSalida = (salida: Salida, actor: BrazaleteActor): void => {
  if (actor.rol === UserRole.CONANP) return;
  if (salida.prestador_id !== actor.id) {
    throw new AppError('No tienes permisos para operar brazaletes en esta salida', 403);
  }
};

export const obtenerBrazaletesPrestadorService = async (
  actor: BrazaleteActor,
  prestador_id: string
): Promise<ApiResponse<ObtenerBrazaletesPrestadorResponse>> => {
  if (actor.rol !== UserRole.CONANP && prestador_id !== actor.id) {
    throw new AppError('No tienes permisos para consultar los brazaletes de este prestador', 403);
  }

  const prestador = await User.findOne({ where: { id: prestador_id, rol: 'prestador' } });
  if (!prestador) throw new AppError('Prestador no encontrado', 404);

  const whereBase: WhereOptions = { prestador_id };

  const [disponibles, asignados, utilizados, universal] = await Promise.all([
    Brazalete.count({ where: { ...whereBase, estado: 'disponible' } }),
    Brazalete.count({ where: { ...whereBase, estado: 'asignado' } }),
    Brazalete.count({ where: { ...whereBase, estado: 'utilizado' } }),
    Brazalete.count({ where: { ...whereBase, tipo: 'universal' } }),
  ]);

  const detalle = await Brazalete.findAll({
    where: whereBase,
    include: [
      {
        model: LoteBrazalete,
        as: 'lote',
        attributes: ['numero_lote', 'tipo'],
      },
      {
        model: Salida,
        as: 'salida',
        attributes: ['id', 'fecha'],
        required: false,
      },
    ],
    order: [['fecha_asignacion', 'DESC']],
  });

  return {
    status: 'success',
    message: 'Brazaletes del prestador obtenidos exitosamente',
    data: {
      prestador: {
        id: prestador.id,
        nombre: prestador.nombre,
        email: prestador.email,
      },
      brazaletes: {
        disponibles,
        asignados,
        utilizados,
        por_tipo: {
          universal,
        },
      },
      detalle: detalle.map((brazalete) => brazalete.toJSON()),
    },
  };
};

export const buscarBrazaletesService = async (
  actor: BrazaleteActor,
  queries: BuscarBrazaletesQueries
): Promise<ApiResponse<BuscarBrazaletesResponse>> => {
  const whereClause: WhereOptions = {};
  const page = queries.page ?? 1;
  const limit = queries.limit ?? 20;

  if (queries.codigo) whereClause['codigo'] = queries.codigo;
  if (queries.tipo) whereClause['tipo'] = queries.tipo;
  if (queries.estado) whereClause['estado'] = queries.estado;
  if (queries.lote_id) whereClause['lote_id'] = queries.lote_id;
  if (queries.salida_id) whereClause['salida_id'] = queries.salida_id;
  if (queries.turista_nacionalidad) {
    whereClause['turista_nacionalidad'] = queries.turista_nacionalidad;
  }
  if (queries.fecha_inicio || queries.fecha_fin) {
    const fechaCreacion: Record<symbol, Date> = {};
    if (queries.fecha_inicio) fechaCreacion[Op.gte] = new Date(`${queries.fecha_inicio}T00:00:00`);
    if (queries.fecha_fin) fechaCreacion[Op.lte] = new Date(`${queries.fecha_fin}T23:59:59`);
    whereClause['fecha_creacion'] = fechaCreacion;
  }

  if (actor.rol === UserRole.PRESTADOR) {
    whereClause['prestador_id'] = actor.id;
  } else if (queries.prestador_id) {
    whereClause['prestador_id'] = queries.prestador_id;
  }

  const offset = (page - 1) * limit;

  const { rows: brazaletes, count: total } = await Brazalete.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: LoteBrazalete,
        as: 'lote',
        attributes: ['id', 'numero_lote', 'tipo', 'fecha_compra'],
      },
      {
        model: User,
        as: 'prestador',
        attributes: ['id', 'nombre', 'email'],
        required: false,
      },
      {
        model: Salida,
        as: 'salida',
        attributes: ['id', 'fecha', 'numero_pasajeros'],
        required: false,
      },
    ],
    order: [
      ['fecha_creacion', 'DESC'],
      ['codigo', 'ASC'],
    ],
    limit,
    offset,
  });

  const estadisticas = {
    total_encontrados: total,
    por_estado: {
      disponible: 0,
      asignado: 0,
      utilizado: 0,
      perdido: 0,
    },
    por_nacionalidad: {
      local: 0,
      nacional: 0,
      internacional: 0,
    },
  };

  for (const brazalete of brazaletes) {
    const estadoKey = brazalete.estado as keyof typeof estadisticas.por_estado;
    if (estadoKey in estadisticas.por_estado) {
      estadisticas.por_estado[estadoKey] += 1;
    }
    if (brazalete.turista_nacionalidad) {
      const nacKey = brazalete.turista_nacionalidad as keyof typeof estadisticas.por_nacionalidad;
      if (nacKey in estadisticas.por_nacionalidad) {
        estadisticas.por_nacionalidad[nacKey] += 1;
      }
    }
  }

  const totalPages = Math.ceil(total / limit);
  const prestadorFiltro =
    actor.rol === UserRole.PRESTADOR ? actor.id : (queries.prestador_id ?? null);

  return {
    status: 'success',
    message: `Se encontraron ${total} brazaletes`,
    data: {
      brazaletes: brazaletes.map((brazalete) => brazalete.toJSON()),
      estadisticas,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      filtros_aplicados: {
        codigo: queries.codigo ?? null,
        tipo: queries.tipo ?? null,
        estado: queries.estado ?? null,
        prestador_id: prestadorFiltro,
        lote_id: queries.lote_id ?? null,
        salida_id: queries.salida_id ?? null,
        fecha_inicio: queries.fecha_inicio ?? null,
        fecha_fin: queries.fecha_fin ?? null,
        turista_nacionalidad: queries.turista_nacionalidad ?? null,
      },
    },
  };
};

export const asignarBrazaletesService = async (
  actor: BrazaleteActor,
  dto: AsignarBrazaletesDTO
): Promise<ApiResponse<AsignarBrazaletesResponse>> => {
  const { salida_id, cantidad, fecha_asignacion } = dto;

  const salida = await Salida.findOne({
    where: { id: salida_id },
    include: [
      {
        model: User,
        as: 'prestador',
        attributes: ['id', 'nombre', 'email'],
      },
    ],
  });

  if (!salida) throw new AppError('Salida no encontrada', 404);
  assertDueñoSalida(salida, actor);

  const prestadorId = salida.prestador_id;

  const brazaletesDisponibles = await Brazalete.findAll({
    where: {
      prestador_id: prestadorId,
      estado: 'disponible',
    },
    limit: cantidad,
    order: [['fecha_creacion', 'ASC']],
  });

  if (brazaletesDisponibles.length < cantidad) {
    throw new AppError('No hay suficientes brazaletes disponibles', 400);
  }

  const ids = brazaletesDisponibles.map((b) => b.id);

  const asignados = await sequelize.transaction(async (transaction) => {
    await Brazalete.update(
      {
        estado: 'asignado',
        fecha_asignacion,
        salida_id,
      },
      { where: { id: { [Op.in]: ids } }, transaction }
    );

    return Brazalete.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['codigo', 'ASC']],
      transaction,
    });
  });

  const brazaletesAsignados: BrazaleteAsignadoItem[] = asignados.map((brazalete) => ({
    id: brazalete.id,
    codigo: brazalete.codigo,
    tipo: brazalete.tipo as TipoBrazalete,
    estado: brazalete.estado as EstadoBrazalete,
    fecha_asignacion: brazalete.fecha_asignacion ?? fecha_asignacion,
    salida_id: brazalete.salida_id ?? salida_id,
  }));

  return {
    status: 'success',
    message: `${brazaletesAsignados.length} brazaletes asignados exitosamente a la salida`,
    data: {
      salida_id,
      cantidad_asignada: brazaletesAsignados.length,
      fecha_asignacion,
      brazaletes: brazaletesAsignados,
    },
  };
};

export const registrarUsoBrazaletesService = async (
  actor: BrazaleteActor,
  dto: UsarBrazaletesDTO
): Promise<ApiResponse<RegistarUsoBrazaleteResponse>> => {
  const { salida_id, brazaletes } = dto;

  const salida = await Salida.findOne({ where: { id: salida_id } });
  if (!salida) throw new AppError('Salida no encontrada', 404);
  assertDueñoSalida(salida, actor);

  const errores: string[] = [];
  let utilizados = 0;

  await sequelize.transaction(async (transaction) => {
    const loteContador: Record<string, number> = {};

    for (const item of brazaletes) {
      const brazalete = await Brazalete.findOne({
        where: { codigo: item.codigo },
        transaction,
      });
      if (!brazalete) {
        errores.push(`Brazalete ${item.codigo} no encontrado`);
        continue;
      }
      if (!brazalete.puedeSerUtilizado()) {
        errores.push(`Brazalete ${item.codigo} no puede ser utilizado`);
        continue;
      }
      if (brazalete.prestador_id !== salida.prestador_id) {
        errores.push(`Brazalete ${item.codigo} no pertenece al prestador`);
        continue;
      }

      try {
        await brazalete.usarEnSalida(
          salida_id,
          item.turista_nacionalidad,
          item.turista_edad,
          item.fecha_uso ?? getTodayMexico(),
          transaction
        );
        loteContador[brazalete.lote_id] = (loteContador[brazalete.lote_id] || 0) + 1;
        utilizados += 1;
      } catch (error) {
        errores.push(
          `Error con brazalete ${item.codigo}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    }

    for (const [loteId, cantidad] of Object.entries(loteContador)) {
      const lote = await LoteBrazalete.findByPk(loteId, { transaction });
      if (lote) await lote.actualizarDespuesUso(cantidad, transaction);
    }
  });

  if (utilizados === 0) {
    throw new AppError(
      errores.length > 0
        ? errores.join('; ')
        : 'No se pudo registrar el uso de ningún brazalete',
      400
    );
  }

  return {
    status: 'success',
    message: `${utilizados} brazaletes utilizados exitosamente`,
    data: {
      brazaletes_utilizados: utilizados,
      errores,
    },
  };
};

export const obtenerBrazaletesSalidaService = async (
  actor: BrazaleteActor,
  salida_id: string
): Promise<ApiResponse<ObtenerBrazaletesSalidaResponse>> => {
  const salida = await Salida.findByPk(salida_id);
  if (!salida) throw new AppError('Salida no encontrada', 404);
  assertDueñoSalida(salida, actor);

  const brazaletesUtilizados = await Brazalete.findAll({
    where: { salida_id },
    include: [
      {
        model: LoteBrazalete,
        as: 'lote',
        attributes: ['numero_lote', 'tipo'],
      },
      {
        model: User,
        as: 'prestador',
        attributes: ['nombre', 'email'],
      },
    ],
  });

  return {
    status: 'success',
    message: 'Brazaletes de la salida obtenidos exitosamente',
    data: {
      salida: {
        id: salida.id,
        fecha: salida.fecha.toString(),
        numero_pasajeros: salida.numero_pasajeros,
      },
      brazaletes_utilizados: brazaletesUtilizados.map((b) => b.toJSON()),
      estadisticas: {
        total_brazaletes: brazaletesUtilizados.length,
        por_nacionalidad: {
          locales: brazaletesUtilizados.filter((b) => b.turista_nacionalidad === 'local').length,
          nacionales: brazaletesUtilizados.filter((b) => b.turista_nacionalidad === 'nacional')
            .length,
          internacionales: brazaletesUtilizados.filter(
            (b) => b.turista_nacionalidad === 'internacional'
          ).length,
        },
      },
    },
  };
};

export const actualizarUsoBrazaletesService = async (
  actor: BrazaleteActor,
  dto: ActualizarUsoDTO
): Promise<ApiResponse<ActualizarUsoBrazaletesResponse>> => {
  const { salida_id, fecha_uso, motivo } = dto;

  const salida = await Salida.findOne({
    where: { id: salida_id },
    include: [
      {
        model: User,
        as: 'prestador',
        attributes: ['id', 'nombre', 'email'],
      },
    ],
  });

  if (!salida) throw new AppError('Salida no encontrada', 404);
  assertDueñoSalida(salida, actor);

  const brazaletesAsignados = await Brazalete.findAll({
    where: { salida_id, estado: 'asignado' },
    include: [
      {
        model: LoteBrazalete,
        as: 'lote',
        attributes: ['numero_lote', 'tipo'],
      },
      {
        model: User,
        as: 'prestador',
        attributes: ['id', 'nombre', 'email'],
      },
    ],
    order: [['codigo', 'ASC']],
  });

  if (brazaletesAsignados.length === 0) {
    throw new AppError('No se encontraron brazaletes asignados a esta salida', 404);
  }

  const fechaInvalida = brazaletesAsignados.some((b) => {
    if (!b.fecha_asignacion) return false;
    const fechaAsignacionStr =
      typeof b.fecha_asignacion === 'string'
        ? b.fecha_asignacion
        : (b.fecha_asignacion as Date).toISOString().split('T')[0];
    return fechaAsignacionStr ? fecha_uso < fechaAsignacionStr : false;
  });

  if (fechaInvalida) {
    throw new AppError(
      'La fecha de uso debe ser posterior a la fecha de asignación de todos los brazaletes',
      400
    );
  }

  const ids = brazaletesAsignados.map((b) => b.id);
  const contadorLotes: Record<string, number> = {};
  for (const brazalete of brazaletesAsignados) {
    contadorLotes[brazalete.lote_id] = (contadorLotes[brazalete.lote_id] || 0) + 1;
  }

  const { actualizados, errores } = await sequelize.transaction(async (transaction) => {
    await Brazalete.update(
      { estado: 'utilizado', fecha_uso },
      { where: { id: { [Op.in]: ids } }, transaction }
    );

    const brazaletesActualizados: BrazaleteActualizadoItem[] = brazaletesAsignados.map(
      (brazalete) => ({
        id: brazalete.id,
        codigo: brazalete.codigo,
        tipo: brazalete.tipo as TipoBrazalete,
        estado_anterior: EstadoBrazalete.ASIGNADO,
        estado_actual: EstadoBrazalete.UTILIZADO,
        fecha_uso,
        lote_id: brazalete.lote_id,
        prestador_id: brazalete.prestador_id ?? null,
      })
    );

    const erroresLote: ActualizarUsoErrorItem[] = [];
    for (const [loteId, cantidad] of Object.entries(contadorLotes)) {
      try {
        const lote = await LoteBrazalete.findByPk(loteId, { transaction });
        if (lote) await lote.actualizarDespuesUso(cantidad, transaction);
      } catch (error) {
        logger.error({ err: error }, `Error al actualizar lote ${loteId}`);
        erroresLote.push({
          codigo: loteId,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return { actualizados: brazaletesActualizados, errores: erroresLote };
  });

  return {
    status: 'success',
    message: `${actualizados.length} brazaletes actualizados exitosamente`,
    data: {
      salida: {
        id: salida.id,
        fecha: salida.fecha.toString(),
        numero_pasajeros: salida.numero_pasajeros,
        prestador: {
          id: salida.prestador_id,
        },
      },
      fecha_uso,
      brazaletes_actualizados: actualizados,
      resumen: {
        total_encontrados: brazaletesAsignados.length,
        total_actualizados: actualizados.length,
        total_errores: errores.length,
        lotes_afectados: Object.keys(contadorLotes).length,
      },
      ...(errores.length > 0 ? { errores } : {}),
      motivo: motivo ?? null,
    },
  };
};
