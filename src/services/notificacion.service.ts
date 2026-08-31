import { Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import User from '../models/User';
import {
  ApiResponse,
  NotificacionAlertaClimaData,
  NotificacionResponse,
  TipoNotificacion,
  UserRole,
} from '../types';
import {
  EnviarAlertaClimaWhatsappBody,
  EnviarAlertaPermisosWhatsappBody,
  EnviarMasivoWhatsappResponse,
  EnviarNotificacionBody,
  EnviarNotificacionMasivaBody,
  EnviarNotificacionResponse,
  EnviarPruebaWhatsappBody,
  GetEstadoMensajeResponse,
  GetEstadoWhatsappResponse,
  GetPlantillasWhatsappResponse,
  NotificacionResumenDTO,
} from '../types/notificacion.types';
import { extraerSoloFechaUTC, getTodayMexico } from '../utils/dateUtils';
import {
  enviarAlertaClima,
  enviarAlertaPermiso,
  enviarConPausa,
  enviarMasivo,
  enviarMensaje,
  enviarMensajeConTemplate,
  getWhatsappProveedor,
  isWhatsappReady,
  obtenerPlantillas,
  verificarEstadoMensaje,
} from './whatsapp.service';

const MENSAJE_PRUEBA =
  `🧪 *MENSAJE DE PRUEBA*\n\n` +
  `Este es un mensaje de prueba del sistema de notificaciones de Isla Lobos.\n\n` +
  `Si recibes este mensaje, la integración con WhatsApp está funcionando correctamente. ✅\n\n` +
  `_Sistema CONANP - Isla Lobos_`;

const assertWhatsappConfigured = (): void => {
  if (!isWhatsappReady()) {
    throw new AppError('Servicio de WhatsApp no está configurado', 503);
  }
};

const addDaysToDateOnly = (fecha: string, days: number): string => {
  const [year, month, day] = fecha.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().split('T')[0] ?? fecha;
};

const diffDaysDateOnly = (from: string, to: string): number => {
  const fromParts = from.split('-').map(Number);
  const toParts = to.split('-').map(Number);
  const fromUtc = Date.UTC(fromParts[0] ?? 0, (fromParts[1] ?? 1) - 1, fromParts[2] ?? 1);
  const toUtc = Date.UTC(toParts[0] ?? 0, (toParts[1] ?? 1) - 1, toParts[2] ?? 1);
  return Math.ceil((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
};

const resumenDe = (resultados: NotificacionResponse[]): NotificacionResumenDTO => ({
  total: resultados.length,
  enviados: resultados.filter((r) => r.success).length,
  fallidos: resultados.filter((r) => !r.success).length,
});

const telefonosDeUsuarios = (usuarios: Array<{ telefono?: string | null }>): string[] =>
  usuarios
    .map((u) => u.telefono)
    .filter((telefono): telefono is string => !!telefono && telefono.length > 0);

export const getEstadoWhatsappService = async (): Promise<
  ApiResponse<GetEstadoWhatsappResponse>
> => {
  const configurado = isWhatsappReady();
  return {
    status: 'success',
    message: configurado
      ? 'Servicio de WhatsApp configurado y listo'
      : 'Servicio de WhatsApp no configurado',
    data: {
      configurado,
      proveedor: getWhatsappProveedor(),
    },
  };
};

export const enviarNotificacionService = async (
  body: EnviarNotificacionBody
): Promise<ApiResponse<EnviarNotificacionResponse>> => {
  assertWhatsappConfigured();

  const resolvedContentSid = body.contentSid || body.template;
  const resultado = resolvedContentSid
    ? await enviarMensajeConTemplate(body.telefono, resolvedContentSid, body.variables, body.idioma)
    : await enviarMensaje(
        body.telefono,
        body.mensaje as string,
        body.tipo ?? TipoNotificacion.RECORDATORIO_GENERICO
      );

  if (!resultado.success) {
    throw new AppError(resultado.error || 'Error al enviar notificación', 502);
  }

  return {
    status: 'success',
    message: 'Notificación enviada exitosamente',
    data: { notificacion: resultado },
  };
};

export const enviarNotificacionMasivaService = async (
  body: EnviarNotificacionMasivaBody
): Promise<ApiResponse<EnviarMasivoWhatsappResponse>> => {
  assertWhatsappConfigured();

  const usuarios = await User.findAll({
    where: { id: body.usuarios_ids },
    attributes: ['id', 'nombre', 'telefono'],
  });

  const telefonos = telefonosDeUsuarios(usuarios);
  if (telefonos.length === 0) {
    throw new AppError('Ninguno de los usuarios tiene teléfono registrado', 400);
  }

  const resultado = await enviarMasivo(
    telefonos,
    body.mensaje,
    body.tipo ?? TipoNotificacion.RECORDATORIO_GENERICO
  );

  return {
    status: 'success',
    message: 'Notificaciones masivas procesadas',
    data: {
      resumen: {
        total: resultado.total,
        enviados: resultado.enviados,
        fallidos: resultado.fallidos,
      },
      resultados: resultado.resultados,
    },
  };
};

export const enviarAlertaClimaService = async (
  body: EnviarAlertaClimaWhatsappBody
): Promise<ApiResponse<EnviarMasivoWhatsappResponse>> => {
  assertWhatsappConfigured();

  const prestadores = await User.findAll({
    where: {
      rol: UserRole.PRESTADOR,
      activo: true,
      telefono: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
    } as WhereOptions,
    attributes: ['id', 'nombre', 'telefono'],
  });

  const telefonos = telefonosDeUsuarios(prestadores);
  if (telefonos.length === 0) {
    throw new AppError('No hay prestadores activos con teléfono registrado', 400);
  }

  const datosAlerta: NotificacionAlertaClimaData = {
    estado_puerto: body.estado_puerto,
    oleaje: body.oleaje,
    viento_velocidad: body.viento_velocidad,
    ...(body.mensaje_adicional !== undefined ? { mensaje_adicional: body.mensaje_adicional } : {}),
  };

  const resultados = await enviarConPausa(telefonos, (telefono) =>
    enviarAlertaClima(telefono, datosAlerta)
  );

  return {
    status: 'success',
    message: 'Alerta de clima enviada a prestadores',
    data: {
      resumen: resumenDe(resultados),
      resultados,
    },
  };
};

export const enviarAlertaPermisosService = async (
  body: EnviarAlertaPermisosWhatsappBody
): Promise<ApiResponse<EnviarMasivoWhatsappResponse>> => {
  assertWhatsappConfigured();

  const dias = body.dias_anticipacion ?? 30;
  const hoy = getTodayMexico();
  const fechaLimite = addDaysToDateOnly(hoy, dias);

  const usuarios = await User.findAll({
    where: {
      rol: UserRole.PRESTADOR,
      activo: true,
      telefono: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      fechaVencimientoPermiso: { [Op.between]: [hoy, fechaLimite] },
    } as WhereOptions,
    attributes: ['id', 'nombre', 'telefono', 'fechaVencimientoPermiso', 'estadoPermiso'],
  });

  if (usuarios.length === 0) {
    return {
      status: 'success',
      message: 'No hay permisos próximos a vencer',
      data: {
        resumen: { total: 0, enviados: 0, fallidos: 0 },
      },
    };
  }

  const resultados = await enviarConPausa(usuarios, (usuario) => {
    const fechaVencimiento = extraerSoloFechaUTC(usuario.fechaVencimientoPermiso) ?? hoy;
    const diasRestantes = diffDaysDateOnly(hoy, fechaVencimiento);
    return enviarAlertaPermiso(
      {
        nombre: usuario.nombre,
        ...(usuario.telefono !== undefined ? { telefono: usuario.telefono } : {}),
        fechaVencimientoPermiso: fechaVencimiento,
      },
      diasRestantes
    );
  });

  return {
    status: 'success',
    message: 'Alertas de permisos enviadas',
    data: {
      resumen: resumenDe(resultados),
      resultados,
    },
  };
};

export const getPlantillasService = async (): Promise<ApiResponse<GetPlantillasWhatsappResponse>> => {
  const plantillas = obtenerPlantillas();
  return {
    status: 'success',
    message: 'Plantillas de notificaciones obtenidas',
    data: {
      plantillas,
      total: plantillas.length,
    },
  };
};

export const verificarEstadoMensajeService = async (
  messageSid: string
): Promise<ApiResponse<GetEstadoMensajeResponse>> => {
  assertWhatsappConfigured();

  const resultado = await verificarEstadoMensaje(messageSid);
  if (resultado.error) {
    throw new AppError(resultado.error, 400);
  }

  return {
    status: 'success',
    message: 'Estado del mensaje obtenido',
    data: {
      message_sid: messageSid,
      estado: resultado.estado,
      ...(resultado.fecha_actualizacion
        ? { fecha_actualizacion: resultado.fecha_actualizacion }
        : {}),
    },
  };
};

export const enviarPruebaService = async (
  body: EnviarPruebaWhatsappBody
): Promise<ApiResponse<EnviarNotificacionResponse>> => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new AppError('Endpoint de prueba no disponible en producción', 403);
  }

  assertWhatsappConfigured();

  const resultado = await enviarMensaje(
    body.telefono,
    MENSAJE_PRUEBA,
    TipoNotificacion.RECORDATORIO_GENERICO
  );

  if (!resultado.success) {
    throw new AppError(resultado.error || 'Error al enviar mensaje de prueba', 502);
  }

  return {
    status: 'success',
    message: 'Mensaje de prueba enviado',
    data: { notificacion: resultado },
  };
};
