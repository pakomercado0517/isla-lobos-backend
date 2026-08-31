import { Server as SocketIOServer } from 'socket.io';
import { Op } from 'sequelize';
import { AppError } from '../lib/AppError';
import NotificacionDashboard from '../models/NotificacionDashboard';
import User from '../models/User';
import {
  CrearNotificacionDashboardRequest,
  NotificacionDashboard as INotificacionDashboard,
  PrioridadNotificacionDashboard,
  UserRole,
  ApiResponse,
} from '../types';
import {
  GetContadorNotificacionesResponse,
  GetNotificacionesDashboardResponse,
  NotificacionDashboardDTO,
} from '../types/dashboard-notification.types';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from '../types/socketIO.types';
import { extraerSoloFechaUTC } from '../utils/dateUtils';
import { createLogger } from '../utils/logger';

type DashboardNotificationIO = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const logger = createLogger('DashboardNotificationService');
const DEFAULT_LIMIT = 50;

let io: DashboardNotificationIO | null = null;

export const setDashboardNotificationSocketIO = (ioInstance: DashboardNotificationIO): void => {
  io = ioInstance;
  logger.info('Socket.IO configurado para notificaciones del dashboard');
};

const whereVisibleParaUsuario = (usuarioId: string) => ({
  [Op.or]: [{ usuario_id: null }, { usuario_id: usuarioId }],
});

const toNotificacionDashboardDTO = (
  notificacion: NotificacionDashboard
): NotificacionDashboardDTO => {
  const notifJson = notificacion.toJSON() as INotificacionDashboard;
  return {
    ...notifJson,
    read_at: extraerSoloFechaUTC(notifJson.read_at) ?? null,
    created_at: extraerSoloFechaUTC(notifJson.created_at) as string,
    updated_at: extraerSoloFechaUTC(notifJson.updated_at) as string,
  };
};

const enviarATodosLosConectados = (
  notificacion: NotificacionDashboard,
  dto: NotificacionDashboardDTO
): void => {
  if (!io) {
    logger.debug('Socket.IO no configurado, notificación solo guardada en BD');
    return;
  }

  try {
    if (!notificacion.usuario_id) {
      io.to('conanp_todos').emit('nueva_notificacion', dto);
      logger.info(
        { notificacion_id: notificacion.id, tipo: notificacion.tipo },
        'Notificación enviada a todos los usuarios CONANP conectados'
      );
      return;
    }

    io.to(`usuario_${notificacion.usuario_id}`).emit('nueva_notificacion', dto);
    logger.info(
      {
        notificacion_id: notificacion.id,
        usuario_id: notificacion.usuario_id,
        tipo: notificacion.tipo,
      },
      'Notificación enviada a usuario específico'
    );
  } catch (error) {
    logger.error(
      { error, notificacion_id: notificacion.id },
      'Error al enviar notificación vía WebSocket'
    );
  }
};

export const crearNotificacionService = async (
  request: CrearNotificacionDashboardRequest
): Promise<NotificacionDashboardDTO> => {
  if (request.usuario_id) {
    const usuario = await User.findByPk(request.usuario_id, { attributes: ['id', 'rol'] });
    if (!usuario) {
      throw new AppError(`Usuario con ID ${request.usuario_id} no encontrado`, 404);
    }
    if (usuario.rol !== UserRole.CONANP) {
      throw new AppError(`El usuario ${request.usuario_id} no es un usuario CONANP`, 400);
    }
  }

  const notificacion = await NotificacionDashboard.create({
    tipo: request.tipo,
    titulo: request.titulo,
    mensaje: request.mensaje,
    usuario_id: request.usuario_id || null,
    enlace: request.enlace || null,
    leida: false,
    prioridad: request.prioridad || PrioridadNotificacionDashboard.MEDIA,
    metadata: request.metadata || {},
    read_at: null,
  });

  logger.info(
    {
      notificacion_id: notificacion.id,
      tipo: notificacion.tipo,
      usuario_id: notificacion.usuario_id,
    },
    'Notificación creada en BD'
  );

  const dto = toNotificacionDashboardDTO(notificacion);
  enviarATodosLosConectados(notificacion, dto);
  return dto;
};

export const getNotificacionesService = async (
  usuarioId: string,
  limit: number = DEFAULT_LIMIT
): Promise<ApiResponse<GetNotificacionesDashboardResponse>> => {
  const { rows, count } = await NotificacionDashboard.findAndCountAll({
    where: {
      ...whereVisibleParaUsuario(usuarioId),
      leida: false,
    },
    order: [['created_at', 'DESC']],
    limit,
  });

  const notificaciones = rows.map(toNotificacionDashboardDTO);

  return {
    status: 'success',
    message: 'Notificaciones obtenidas exitosamente',
    data: {
      notificaciones,
      total: notificaciones.length,
      no_leidas: count,
    },
  };
};

export const getContadorNotificacionesService = async (
  usuarioId: string
): Promise<ApiResponse<GetContadorNotificacionesResponse>> => {
  const no_leidas = await NotificacionDashboard.count({
    where: {
      ...whereVisibleParaUsuario(usuarioId),
      leida: false,
    },
  });

  return {
    status: 'success',
    message: 'Contador obtenido exitosamente',
    data: {
      no_leidas,
    },
  };
};

export const marcarNotificacionLeidaService = async (
  notificacionId: string,
  usuarioId: string
): Promise<ApiResponse<void>> => {
  const [affectedCount] = await NotificacionDashboard.update(
    {
      leida: true,
      read_at: new Date(),
    },
    {
      where: {
        id: notificacionId,
        ...whereVisibleParaUsuario(usuarioId),
      },
    }
  );

  if (affectedCount === 0) {
    throw new AppError('Notificación no encontrada o no autorizada', 404);
  }

  logger.info(
    { notificacion_id: notificacionId, usuario_id: usuarioId },
    'Notificación marcada como leída'
  );

  return {
    status: 'success',
    message: 'Notificación marcada como leída',
  };
};
