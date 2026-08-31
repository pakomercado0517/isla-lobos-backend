import { col, fn, Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import Embarcacion from '../models/Embarcacion';
import User from '../models/User';
import { crearNotificacionService } from './dashboard-notification.service';
import {
  ApiResponse,
  EstadoEmbarcacion,
  PrioridadNotificacionDashboard,
  TipoEmbarcacion,
  TipoNotificacionDashboard,
  UserRole,
} from '../types';
import {
  CreateEmbarcacionDTO,
  EmbarcacionDTO,
  EmbarcacionesPorEstadoAgregado,
  EmbarcacionesPorTipoAgregado,
  EstadisticasListadoDTO,
  GetEmbarcacionByIdResponse,
  GetEmbarcacionesQuery,
  GetEmbarcacionesResponse,
  GetEmbarcacionStatsResponse,
  PrestadorEmbarcacionDTO,
  UpdateEmbarcacionDTO,
} from '../types/embarcacion.types';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmbarcacionService');

const PRESTADOR_ATTRIBUTES = ['id', 'nombre', 'email', 'telefono'] as const;

const PRESTADOR_INCLUDE = {
  model: User,
  as: 'prestador' as const,
  attributes: [...PRESTADOR_ATTRIBUTES],
};

interface AuthUser {
  id: string;
  rol: UserRole;
}

const totalDe = <T extends { total: string | number }>(
  filas: T[],
  coincide: (item: T) => boolean
): number => Number(filas.find(coincide)?.total ?? 0);

const whereEmbarcaciones = (
  filtros: Pick<GetEmbarcacionesQuery, 'estado' | 'tipo' | 'prestador_id'>
): WhereOptions => {
  const where: Record<string, unknown> = {};
  if (filtros.estado) where['estado'] = filtros.estado;
  if (filtros.tipo) where['tipo'] = filtros.tipo;
  if (filtros.prestador_id) where['prestador_id'] = filtros.prestador_id;
  return where;
};

const toPrestadorDTO = (
  prestador: Pick<User, 'id' | 'nombre' | 'email' | 'telefono'>
): PrestadorEmbarcacionDTO => ({
  id: prestador.id,
  nombre: prestador.nombre,
  email: prestador.email,
  ...(prestador.telefono !== undefined ? { telefono: prestador.telefono } : {}),
});

const toEmbarcacionDTO = (
  embarcacion: Embarcacion,
  prestador?: PrestadorEmbarcacionDTO
): EmbarcacionDTO => {
  const json = embarcacion.toJSON() as EmbarcacionDTO & {
    prestador?: PrestadorEmbarcacionDTO;
  };
  if (prestador) return { ...json, prestador };
  if (json.prestador) return { ...json, prestador: json.prestador };
  return json;
};

const agregarEstadisticas = async (where: WhereOptions): Promise<EstadisticasListadoDTO> => {
  const [porEstadoRaw, porTipoRaw] = await Promise.all([
    Embarcacion.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['estado'],
      raw: true,
    }),
    Embarcacion.findAll({
      attributes: ['tipo', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['tipo'],
      raw: true,
    }),
  ]);

  const porEstado = porEstadoRaw as unknown as EmbarcacionesPorEstadoAgregado[];
  const porTipo = porTipoRaw as unknown as EmbarcacionesPorTipoAgregado[];

  return {
    total: 0,
    disponibles: totalDe(porEstado, (item) => item.estado === EstadoEmbarcacion.DISPONIBLE),
    en_uso: totalDe(porEstado, (item) => item.estado === EstadoEmbarcacion.EN_USO),
    mantenimiento: totalDe(porEstado, (item) => item.estado === EstadoEmbarcacion.MANTENIMIENTO),
    menor: totalDe(porTipo, (item) => item.tipo === TipoEmbarcacion.MENOR),
    mayor: totalDe(porTipo, (item) => item.tipo === TipoEmbarcacion.MAYOR),
  };
};

const listarEmbarcaciones = async (
  filtros: Pick<GetEmbarcacionesQuery, 'estado' | 'tipo' | 'prestador_id'>,
  page: number,
  limit: number,
  includePrestador: boolean
): Promise<GetEmbarcacionesResponse> => {
  const where = whereEmbarcaciones(filtros);
  const offset = (page - 1) * limit;

  const [resultado, estadisticas] = await Promise.all([
    Embarcacion.findAndCountAll({
      where,
      limit,
      offset,
      order: [['nombre', 'ASC']],
      ...(includePrestador ? { include: [PRESTADOR_INCLUDE] } : {}),
    }),
    agregarEstadisticas(where),
  ]);

  return {
    embarcaciones: resultado.rows.map((row) => toEmbarcacionDTO(row)),
    estadisticas: { ...estadisticas, total: resultado.count },
    pagination: {
      page,
      limit,
      total: resultado.count,
      totalPages: Math.ceil(resultado.count / limit) || 0,
    },
  };
};

const assertPrestador = async (prestadorId: string): Promise<User> => {
  const prestador = await User.findByPk(prestadorId, {
    attributes: ['id', 'nombre', 'email', 'telefono', 'rol'],
  });

  if (!prestador) {
    throw new AppError('Prestador no encontrado', 404);
  }
  if (prestador.rol !== UserRole.PRESTADOR) {
    throw new AppError('El usuario debe ser un prestador', 400);
  }

  return prestador;
};

export const getAllEmbarcacionesService = async (
  query: GetEmbarcacionesQuery
): Promise<ApiResponse<GetEmbarcacionesResponse>> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const data = await listarEmbarcaciones(query, page, limit, true);

  return {
    status: 'success',
    message: 'Embarcaciones obtenidas exitosamente',
    data,
  };
};

export const getEmbarcacionByIdService = async (
  id: string
): Promise<ApiResponse<GetEmbarcacionByIdResponse>> => {
  const embarcacion = await Embarcacion.findByPk(id, {
    include: [PRESTADOR_INCLUDE],
  });

  if (!embarcacion) {
    throw new AppError('Embarcación no encontrada', 404);
  }

  return {
    status: 'success',
    message: 'Embarcación obtenida exitosamente',
    data: { embarcacion: toEmbarcacionDTO(embarcacion) },
  };
};

export const createEmbarcacionService = async (
  body: CreateEmbarcacionDTO,
  user: AuthUser
): Promise<ApiResponse<GetEmbarcacionByIdResponse>> => {
  const prestadorId = user.rol === UserRole.PRESTADOR ? user.id : body.prestador_id;
  const estadoFinal =
    user.rol === UserRole.PRESTADOR
      ? EstadoEmbarcacion.PENDIENTE_AUTORIZACION
      : (body.estado ?? EstadoEmbarcacion.DISPONIBLE);

  const prestador = await assertPrestador(prestadorId);

  const embarcacionExistente = await Embarcacion.findOne({
    where: { matricula: body.matricula },
    attributes: ['id'],
  });
  if (embarcacionExistente) {
    throw new AppError('Ya existe una embarcación con esa matrícula', 409);
  }

  const nuevaEmbarcacion = await Embarcacion.create({
    nombre: body.nombre,
    matricula: body.matricula,
    capacidad: body.capacidad,
    tipo: body.tipo,
    estado: estadoFinal,
    prestador_id: prestadorId,
  });

  if (nuevaEmbarcacion.estado === EstadoEmbarcacion.PENDIENTE_AUTORIZACION) {
    try {
      await crearNotificacionService({
        tipo: TipoNotificacionDashboard.NUEVA_EMBARCACION,
        titulo: 'Nueva embarcación pendiente de autorización',
        mensaje: `El prestador ${prestador.nombre} ha registrado una nueva embarcación: ${body.nombre} (${body.matricula}) con capacidad para ${body.capacidad} pasajeros.`,
        usuario_id: null,
        enlace: `/embarcaciones/${nuevaEmbarcacion.id}`,
        prioridad: PrioridadNotificacionDashboard.ALTA,
        metadata: {
          embarcacion_id: nuevaEmbarcacion.id,
          prestador_id: prestador.id,
          prestador_nombre: prestador.nombre,
          matricula: body.matricula,
          capacidad: body.capacidad,
          tipo: body.tipo,
        },
      });
    } catch (notifError) {
      logger.error(
        { error: notifError, embarcacion_id: nuevaEmbarcacion.id },
        'Error al crear notificación de nueva embarcación'
      );
    }
  }

  return {
    status: 'success',
    message: 'Embarcación creada exitosamente',
    data: {
      embarcacion: toEmbarcacionDTO(nuevaEmbarcacion, toPrestadorDTO(prestador)),
    },
  };
};

export const updateEmbarcacionService = async (
  id: string,
  body: UpdateEmbarcacionDTO
): Promise<ApiResponse<GetEmbarcacionByIdResponse>> => {
  const embarcacion = await Embarcacion.findByPk(id);
  if (!embarcacion) {
    throw new AppError('Embarcación no encontrada', 404);
  }

  if (body.prestador_id) {
    await assertPrestador(body.prestador_id);
  }

  if (body.matricula && body.matricula !== embarcacion.matricula) {
    const embarcacionExistente = await Embarcacion.findOne({
      where: {
        matricula: body.matricula,
        id: { [Op.ne]: id },
      },
      attributes: ['id'],
    });
    if (embarcacionExistente) {
      throw new AppError('Ya existe otra embarcación con esa matrícula', 409);
    }
  }

  await embarcacion.update({
    ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
    ...(body.matricula !== undefined ? { matricula: body.matricula } : {}),
    ...(body.capacidad !== undefined ? { capacidad: body.capacidad } : {}),
    ...(body.tipo !== undefined ? { tipo: body.tipo } : {}),
    ...(body.estado !== undefined ? { estado: body.estado } : {}),
    ...(body.prestador_id !== undefined ? { prestador_id: body.prestador_id } : {}),
  });

  await embarcacion.reload({ include: [PRESTADOR_INCLUDE] });

  return {
    status: 'success',
    message: 'Embarcación actualizada exitosamente',
    data: { embarcacion: toEmbarcacionDTO(embarcacion) },
  };
};

export const deleteEmbarcacionService = async (id: string): Promise<ApiResponse<void>> => {
  const embarcacion = await Embarcacion.findByPk(id, { attributes: ['id', 'estado'] });
  if (!embarcacion) {
    throw new AppError('Embarcación no encontrada', 404);
  }
  if (embarcacion.estado === EstadoEmbarcacion.EN_USO) {
    throw new AppError('No se puede eliminar una embarcación que está en uso', 400);
  }

  await embarcacion.destroy();

  return {
    status: 'success',
    message: 'Embarcación eliminada exitosamente',
  };
};

export const getMisEmbarcacionesService = async (
  prestadorId: string,
  query: GetEmbarcacionesQuery
): Promise<ApiResponse<GetEmbarcacionesResponse>> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const data = await listarEmbarcaciones(
    {
      prestador_id: prestadorId,
      ...(query.estado !== undefined ? { estado: query.estado } : {}),
      ...(query.tipo !== undefined ? { tipo: query.tipo } : {}),
    },
    page,
    limit,
    false
  );

  return {
    status: 'success',
    message: 'Mis embarcaciones obtenidas exitosamente',
    data,
  };
};

export const getEmbarcacionStatsService = async (
  prestadorId?: string
): Promise<ApiResponse<GetEmbarcacionStatsResponse>> => {
  const where = whereEmbarcaciones(
    prestadorId !== undefined ? { prestador_id: prestadorId } : {}
  );

  const [porEstadoRaw, porTipoRaw, totalesRaw] = await Promise.all([
    Embarcacion.findAll({
      attributes: ['estado', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['estado'],
      raw: true,
    }),
    Embarcacion.findAll({
      attributes: ['tipo', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['tipo'],
      raw: true,
    }),
    Embarcacion.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', col('capacidad')), 'capacidad_total'],
      ],
      where,
      raw: true,
    }),
  ]);

  const porEstado = porEstadoRaw as unknown as EmbarcacionesPorEstadoAgregado[];
  const porTipo = porTipoRaw as unknown as EmbarcacionesPorTipoAgregado[];
  const totales = totalesRaw[0] as unknown as {
    total: string | number | null;
    capacidad_total: string | number | null;
  };

  return {
    status: 'success',
    message: 'Estadísticas obtenidas exitosamente',
    data: {
      estadisticas: {
        total_embarcaciones: Number(totales?.total ?? 0),
        por_estado: {
          disponible: totalDe(porEstado, (item) => item.estado === EstadoEmbarcacion.DISPONIBLE),
          en_uso: totalDe(porEstado, (item) => item.estado === EstadoEmbarcacion.EN_USO),
          mantenimiento: totalDe(
            porEstado,
            (item) => item.estado === EstadoEmbarcacion.MANTENIMIENTO
          ),
        },
        por_tipo: {
          menor: totalDe(porTipo, (item) => item.tipo === TipoEmbarcacion.MENOR),
          mayor: totalDe(porTipo, (item) => item.tipo === TipoEmbarcacion.MAYOR),
        },
        capacidad_total: Number(totales?.capacidad_total ?? 0),
      },
    },
  };
};
