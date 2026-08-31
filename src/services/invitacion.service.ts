import { col, fn, Op, Transaction, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import Invitacion from '../models/Invitacion';
import User from '../models/User';
import { enviarInvitacion } from './email.service';
import { ApiResponse, EmailInvitacionData, UserRole } from '../types';
import {
  CreateInvitacionDTO,
  CreateInvitacionResponse,
  CreadorInvitacionDTO,
  GetEstadisticasInvitacionesResponse,
  GetInvitacionByIdResponse,
  GetInvitacionesQuery,
  GetInvitacionesResponse,
  InvitacionDTO,
  InvitacionPublicaDTO,
  InvitacionesPorUsoAgregado,
  TopCreadorInvitacionDTO,
  UpdateInvitacionDTO,
  ValidarCodigoResponse,
} from '../types/invitacion.types';
import { extraerSoloFechaUTC, getTodayMexico, parseFromFrontend } from '../utils/dateUtils';
import { createLogger } from '../utils/logger';

const logger = createLogger('InvitacionService');

const CREADOR_ATTRIBUTES = ['id', 'nombre', 'email'] as const;

const CREADOR_INCLUDE = {
  model: User,
  as: 'creador' as const,
  attributes: [...CREADOR_ATTRIBUTES],
};

type InvitacionConCreador = Invitacion & {
  creador?: CreadorInvitacionDTO;
};

interface MensajesConsumo {
  usada: string;
  expirada: string;
}

const MENSAJES_CODIGO: MensajesConsumo = {
  usada: 'El código de invitación ya ha sido utilizado',
  expirada: 'El código de invitación ha expirado',
};

const MENSAJES_INVITACION: MensajesConsumo = {
  usada: 'La invitación ya ha sido utilizada',
  expirada: 'La invitación ha expirado',
};

const MENSAJES_AUTH: MensajesConsumo = {
  usada: 'Código de invitación ya utilizado',
  expirada: 'Código de invitación expirado',
};

const totalDe = <T extends { total: string | number }>(
  filas: T[],
  coincide: (item: T) => boolean
): number => Number(filas.find(coincide)?.total ?? 0);

const addDaysYmd = (fecha: string, days: number): string => {
  const [year, month, day] = fecha.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return extraerSoloFechaUTC(date) as string;
};

const diasEntreYmd = (desde: string, hasta: string): number => {
  const desdeDate = new Date(`${desde}T12:00:00`);
  const hastaDate = new Date(`${hasta}T12:00:00`);
  return Math.ceil((hastaDate.getTime() - desdeDate.getTime()) / (1000 * 3600 * 24));
};

const estaExpirada = (invitacion: Invitacion): boolean => {
  const expira = extraerSoloFechaUTC(invitacion.expira_en);
  const hoy = getTodayMexico();
  return !!(expira && expira < hoy);
};

const assertInvitacionConsumible = (
  invitacion: Invitacion,
  mensajes: MensajesConsumo = MENSAJES_CODIGO
): void => {
  if (invitacion.usada) throw new AppError(mensajes.usada, 400);
  if (estaExpirada(invitacion)) throw new AppError(mensajes.expirada, 400);
};

const toCreadorDTO = (
  creador?: Pick<User, 'id' | 'nombre' | 'email'>
): CreadorInvitacionDTO | undefined => {
  if (!creador) return undefined;
  return { id: creador.id, nombre: creador.nombre, email: creador.email };
};

const toInvitacionDTO = (invitacion: Invitacion): InvitacionDTO => {
  const json = invitacion.toJSON() as InvitacionDTO;
  return {
    ...json,
    email: json.email ?? null,
    expira_en: extraerSoloFechaUTC(json.expira_en) ?? json.expira_en,
    ...(json.creador ? { creador: json.creador } : {}),
  };
};

const toInvitacionPublicaDTO = (invitacion: InvitacionConCreador): InvitacionPublicaDTO => {
  const dto = toInvitacionDTO(invitacion);
  const creador = dto.creador ?? toCreadorDTO(invitacion.creador);
  return {
    id: dto.id,
    codigo: dto.codigo,
    email: dto.email,
    rol: dto.rol,
    creada_por: dto.creada_por,
    expira_en: dto.expira_en,
    usada: dto.usada,
    ...(creador ? { creador } : {}),
  };
};

const findInvitacionConCreador = async (id: string): Promise<Invitacion | null> =>
  Invitacion.findByPk(id, { include: [CREADOR_INCLUDE] });

const requireInvitacion = async (id: string): Promise<Invitacion> => {
  const invitacion = await Invitacion.findByPk(id);
  if (!invitacion) throw new AppError('Invitación no encontrada', 404);
  return invitacion;
};

export const obtenerInvitacionValidaPorCodigo = async (
  codigo: string,
  transaction?: Transaction
): Promise<Invitacion> => {
  const invitacion = await Invitacion.findOne({
    where: { codigo },
    transaction: transaction ?? null,
  });
  if (!invitacion) throw new AppError('Código de invitación inválido', 400);
  assertInvitacionConsumible(invitacion, MENSAJES_AUTH);
  return invitacion;
};

export const marcarInvitacionUsada = async (
  invitacion: Invitacion,
  options?: { email?: string | null; transaction?: Transaction }
): Promise<void> => {
  const payload: { usada: boolean; email?: string | null } = { usada: true };
  if (options?.email !== undefined) payload.email = options.email;
  await invitacion.update(payload, { transaction: options?.transaction ?? null });
};

const intentarEnviarEmailInvitacion = async (
  body: CreateInvitacionDTO,
  codigo: string,
  rol: UserRole,
  expiraEn: string
): Promise<boolean> => {
  if (!body.email || !body.nombre) return false;

  try {
    const hoy = getTodayMexico();
    const urlInvitacion = `${process.env['FRONTEND_URL']}/registro?codigo=${codigo}`;
    const datos: EmailInvitacionData = {
      nombre: body.nombre,
      email: body.email,
      codigo_invitacion: codigo,
      rol,
      url_invitacion: urlInvitacion,
      expiracion_dias: diasEntreYmd(hoy, expiraEn),
    };

    const resultado = await enviarInvitacion(datos);
    if (resultado.success) {
      logger.info(
        { email: body.email, codigo, messageId: resultado.message_id },
        'Email de invitación enviado exitosamente'
      );
      return true;
    }

    logger.warn(
      { email: body.email, codigo, error: resultado.error },
      'Error al enviar email de invitación'
    );
    return false;
  } catch (emailError) {
    logger.error({ email: body.email, codigo, error: emailError }, 'Error al enviar email de invitación');
    return false;
  }
};

export const getAllInvitacionesService = async (
  query: GetInvitacionesQuery
): Promise<ApiResponse<GetInvitacionesResponse>> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const offset = (page - 1) * limit;
  const where: WhereOptions = {};

  if (query.usada !== undefined) where['usada'] = query.usada;
  if (query.creada_por) where['creada_por'] = query.creada_por;

  const { count, rows } = await Invitacion.findAndCountAll({
    where,
    include: [CREADOR_INCLUDE],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);

  return {
    status: 'success',
    message: 'Invitaciones obtenidas exitosamente',
    data: {
      invitaciones: rows.map(toInvitacionDTO),
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    },
  };
};

export const getInvitacionByIdService = async (
  id: string
): Promise<ApiResponse<GetInvitacionByIdResponse>> => {
  const invitacion = await findInvitacionConCreador(id);
  if (!invitacion) throw new AppError('Invitación no encontrada', 404);

  return {
    status: 'success',
    message: 'Invitación obtenida exitosamente',
    data: { invitacion: toInvitacionDTO(invitacion) },
  };
};

export const createInvitacionService = async (
  body: CreateInvitacionDTO,
  creadaPor: string
): Promise<ApiResponse<CreateInvitacionResponse>> => {
  const existente = await Invitacion.findOne({ where: { codigo: body.codigo } });
  if (existente) throw new AppError('El código de invitación ya existe', 400);

  const rol = body.rol ?? UserRole.PRESTADOR;
  const expiraEn = body.fecha_expiracion ?? addDaysYmd(getTodayMexico(), 30);

  const invitacion = await Invitacion.create({
    codigo: body.codigo,
    email: body.email ?? null,
    rol,
    expira_en: expiraEn,
    creada_por: creadaPor,
    usada: false,
  });

  const invitacionCreada = await findInvitacionConCreador(invitacion.id);
  const emailEnviado = await intentarEnviarEmailInvitacion(body, body.codigo, rol, expiraEn);

  return {
    status: 'success',
    message: emailEnviado
      ? 'Invitación creada y email enviado exitosamente'
      : 'Invitación creada exitosamente',
    data: {
      invitacion: toInvitacionDTO(invitacionCreada ?? invitacion),
      email_enviado: emailEnviado,
    },
  };
};

export const updateInvitacionService = async (
  id: string,
  body: UpdateInvitacionDTO
): Promise<ApiResponse<GetInvitacionByIdResponse>> => {
  const invitacion = await requireInvitacion(id);
  if (invitacion.usada) {
    throw new AppError('No se puede actualizar una invitación ya utilizada', 400);
  }

  await invitacion.update({
    expira_en: body.fecha_expiracion ?? invitacion.expira_en,
  });

  const actualizada = await findInvitacionConCreador(id);

  return {
    status: 'success',
    message: 'Invitación actualizada exitosamente',
    data: { invitacion: toInvitacionDTO(actualizada ?? invitacion) },
  };
};

export const deleteInvitacionService = async (id: string): Promise<ApiResponse<undefined>> => {
  const invitacion = await requireInvitacion(id);
  if (invitacion.usada) {
    throw new AppError('No se puede eliminar una invitación ya utilizada', 400);
  }

  await invitacion.destroy();

  return {
    status: 'success',
    message: 'Invitación eliminada exitosamente',
  };
};

export const validarCodigoService = async (
  codigo: string
): Promise<ApiResponse<ValidarCodigoResponse>> => {
  const invitacion = (await Invitacion.findOne({
    where: { codigo },
    include: [CREADOR_INCLUDE],
  })) as InvitacionConCreador | null;

  if (!invitacion) throw new AppError('Código de invitación no válido', 404);
  assertInvitacionConsumible(invitacion, MENSAJES_CODIGO);

  return {
    status: 'success',
    message: 'Código de invitación válido',
    data: {
      valida: true,
      invitacion: toInvitacionPublicaDTO(invitacion),
    },
  };
};

export const usarInvitacionService = async (
  id: string,
  email?: string
): Promise<ApiResponse<GetInvitacionByIdResponse>> => {
  const invitacion = await requireInvitacion(id);
  assertInvitacionConsumible(invitacion, MENSAJES_INVITACION);
  await marcarInvitacionUsada(invitacion, { email: email ?? null });

  const actualizada = await findInvitacionConCreador(id);

  return {
    status: 'success',
    message: 'Invitación marcada como usada exitosamente',
    data: { invitacion: toInvitacionDTO(actualizada ?? invitacion) },
  };
};

export const getEstadisticasInvitacionesService = async (): Promise<
  ApiResponse<GetEstadisticasInvitacionesResponse>
> => {
  const hoy = getTodayMexico();
  const inicioMes = parseFromFrontend(`${hoy.slice(0, 8)}01`);

  const [porUsoRaw, expiradas, creadasEsteMes, usadasEsteMes, topCreadoresRaw] = await Promise.all([
    Invitacion.findAll({
      attributes: ['usada', [fn('COUNT', col('id')), 'total']],
      group: ['usada'],
      raw: true,
    }),
    Invitacion.count({
      where: {
        usada: false,
        expira_en: { [Op.lt]: hoy },
      },
    }),
    Invitacion.count({
      where: { created_at: { [Op.gte]: inicioMes } } as WhereOptions,
    }),
    Invitacion.count({
      where: {
        usada: true,
        updated_at: { [Op.gte]: inicioMes },
      } as WhereOptions,
    }),
    Invitacion.findAll({
      attributes: ['creada_por', [fn('COUNT', col('Invitacion.id')), 'total_creadas']],
      include: [CREADOR_INCLUDE],
      group: ['creada_por', 'creador.id', 'creador.nombre', 'creador.email'],
      order: [[fn('COUNT', col('Invitacion.id')), 'DESC']],
      limit: 5,
    }),
  ]);

  const porUso = porUsoRaw as unknown as InvitacionesPorUsoAgregado[];
  const usadas = totalDe(porUso, (item) => item.usada === true);
  const disponibles = totalDe(porUso, (item) => item.usada === false);
  const total = usadas + disponibles;

  const topCreadores: TopCreadorInvitacionDTO[] = (
    topCreadoresRaw as unknown as InvitacionConCreador[]
  ).map((item) => ({
    creador: toCreadorDTO(item.creador),
    total_creadas: Number(item.get('total_creadas')),
  }));

  return {
    status: 'success',
    message: 'Estadísticas de invitaciones obtenidas exitosamente',
    data: {
      estadisticas: {
        generales: {
          total,
          usadas,
          disponibles,
          expiradas,
          porcentaje_usadas: total > 0 ? Math.round((usadas / total) * 100) : 0,
        },
        este_mes: {
          creadas: creadasEsteMes,
          usadas: usadasEsteMes,
        },
        top_creadores: topCreadores,
      },
    },
  };
};
