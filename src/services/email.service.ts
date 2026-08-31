import sgMail from '@sendgrid/mail';
import { Op } from 'sequelize';
import { AppError } from '../lib/AppError';
import User from '../models/User';
import {
  ApiResponse,
  EmailAlertaClimaData,
  EmailBienvenidaData,
  EmailInvitacionData,
  EmailMasivoResponse,
  EmailRecuperacionPasswordData,
  EmailResponse,
  EmailSalidaData,
  EstadoNotificacion,
  PlantillaEmail,
  TipoEmail,
  UserRole,
} from '../types';
import {
  EnviarAlertaClimaBody,
  EnviarAlertaPermisosBody,
  EnviarEmailBody,
  EnviarEmailMasivoBody,
  EnviarEmailResponse,
  EnviarMasivoResponse,
  EnviarPruebaBody,
  GetEstadoEmailResponse,
  GetPlantillasEmailResponse,
} from '../types/email.types';
import { extraerSoloFechaUTC, getTodayMexico } from '../utils/dateUtils';
import { createLogger } from '../utils/logger';
import {
  buildAlertaClimaEmail,
  buildAlertaPermisoEmail,
  buildBienvenidaEmail,
  buildConfirmacionSalidaEmail,
  buildInvitacionEmail,
  buildPruebaEmail,
  buildRecuperacionPasswordEmail,
} from './email.templates';

const logger = createLogger('EmailService');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAUSA_MS = 200;
const PROVEEDOR = 'SendGrid Web API';

let fromEmail: string | null = null;
let isConfigured = false;

const initializeEmail = (): void => {
  try {
    const apiKey = process.env['SENDGRID_API_KEY'];
    const configuredFrom = process.env['SENDGRID_FROM_EMAIL'];

    logger.info(
      {
        apiKey: apiKey ? '***configurado***' : 'undefined',
        fromEmail: configuredFrom || 'undefined',
      },
      'Verificando variables de entorno SendGrid Web API'
    );

    if (!apiKey || !configuredFrom) {
      logger.warn(
        'SendGrid API Key o From Email no configurados. El servicio de email estará deshabilitado.'
      );
      isConfigured = false;
      return;
    }

    sgMail.setApiKey(apiKey);
    fromEmail = configuredFrom;
    isConfigured = true;

    logger.info(
      {
        from: fromEmail,
        environment: process.env['NODE_ENV'] || 'development',
        provider: PROVEEDOR,
      },
      'SendGrid Web API inicializado correctamente'
    );
  } catch (error) {
    logger.error({ error }, 'Error al inicializar SendGrid Web API');
    isConfigured = false;
  }
};

initializeEmail();

const validarEmail = (email: string): boolean => EMAIL_REGEX.test(email);

const assertEmailConfigured = (): void => {
  if (!isConfigured) {
    throw new AppError('Servicio de email no está configurado', 503);
  }
};

const addDaysToDateOnly = (fecha: string, days: number): string => {
  const parts = fecha.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
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

const pausa = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const enviarConPausa = async <T>(
  items: T[],
  sendFn: (item: T) => Promise<EmailResponse>
): Promise<EmailResponse[]> => {
  const resultados: EmailResponse[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === undefined) continue;
    resultados.push(await sendFn(item));
    if (i < items.length - 1) await pausa(PAUSA_MS);
  }
  return resultados;
};

const resumenDe = (resultados: EmailResponse[]) => ({
  total: resultados.length,
  enviados: resultados.filter((r) => r.success).length,
  fallidos: resultados.filter((r) => !r.success).length,
});

const emailsDeUsuarios = (usuarios: Array<{ email?: string | null }>): string[] =>
  usuarios.filter((u) => u.email && u.email.length > 0).map((u) => u.email as string);

const fallido = (email: string, error: string): EmailResponse => ({
  success: false,
  email,
  estado: EstadoNotificacion.FALLIDO,
  fecha_envio: new Date(),
  error,
});

export const enviarEmail = async (
  email: string,
  asunto: string,
  mensaje: string,
  tipo: TipoEmail = TipoEmail.NOTIFICACION_GENERAL,
  html: boolean = false
): Promise<EmailResponse> => {
  if (!isConfigured) {
    logger.error('Servicio de email no configurado');
    return fallido(email, 'Servicio de email no configurado');
  }

  if (!validarEmail(email)) {
    logger.error({ email }, 'Email inválido');
    return fallido(email, 'Formato de email inválido');
  }

  if (!fromEmail) {
    logger.error('From email no configurado');
    return fallido(email, 'From email no configurado');
  }

  try {
    logger.info({ email, tipo, asunto }, 'Enviando email via SendGrid API');

    const response = await sgMail.send({
      to: email,
      from: `"CONANP - Isla Lobos" <${fromEmail}>`,
      subject: asunto,
      ...(html ? { html: mensaje } : { text: mensaje }),
    });

    const messageId = response[0]?.headers['x-message-id'];

    logger.info(
      {
        statusCode: response[0]?.statusCode,
        messageId,
        email,
      },
      'Email enviado exitosamente via SendGrid API'
    );

    return {
      success: true,
      email,
      estado: EstadoNotificacion.ENVIADO,
      fecha_envio: new Date(),
      ...(typeof messageId === 'string' ? { message_id: messageId } : {}),
    };
  } catch (error) {
    logger.error({ error, email, tipo }, 'Error al enviar email via SendGrid API');
    return fallido(email, error instanceof Error ? error.message : 'Error desconocido');
  }
};

export const enviarAlertaClima = async (
  email: string,
  datos: EmailAlertaClimaData
): Promise<EmailResponse> => {
  const { asunto, html } = buildAlertaClimaEmail(datos);
  return enviarEmail(email, asunto, html, TipoEmail.ALERTA_CLIMA, true);
};

export const enviarAlertaPermiso = async (
  usuario: { nombre: string; email?: string | null; fechaVencimientoPermiso?: string },
  diasRestantes: number
): Promise<EmailResponse> => {
  if (!usuario.email) {
    return fallido('', 'Usuario sin email registrado');
  }

  const { asunto, html } = buildAlertaPermisoEmail(
    usuario.nombre,
    extraerSoloFechaUTC(usuario.fechaVencimientoPermiso) ?? usuario.fechaVencimientoPermiso,
    diasRestantes
  );
  return enviarEmail(usuario.email, asunto, html, TipoEmail.PERMISO_POR_VENCER, true);
};

export const enviarConfirmacionSalida = async (
  email: string,
  datos: EmailSalidaData
): Promise<EmailResponse> => {
  const { asunto, html } = buildConfirmacionSalidaEmail(datos);
  return enviarEmail(email, asunto, html, TipoEmail.CONFIRMACION_SALIDA, true);
};

export const enviarRecuperacionPassword = async (
  email: string,
  datos: EmailRecuperacionPasswordData
): Promise<EmailResponse> => {
  const { asunto, html } = buildRecuperacionPasswordEmail(datos);
  return enviarEmail(email, asunto, html, TipoEmail.RECUPERACION_PASSWORD, true);
};

export const enviarInvitacion = async (datos: EmailInvitacionData): Promise<EmailResponse> => {
  const { asunto, html } = buildInvitacionEmail(datos);
  return enviarEmail(datos.email, asunto, html, TipoEmail.INVITACION, true);
};

export const enviarBienvenida = async (datos: EmailBienvenidaData): Promise<EmailResponse> => {
  const { asunto, html } = buildBienvenidaEmail(datos);
  return enviarEmail(datos.email, asunto, html, TipoEmail.BIENVENIDA, true);
};

export const enviarMasivo = async (
  emails: string[],
  asunto: string,
  mensaje: string,
  tipo: TipoEmail = TipoEmail.NOTIFICACION_GENERAL,
  html: boolean = false
): Promise<EmailMasivoResponse> => {
  logger.info({ total: emails.length, tipo }, 'Iniciando envío masivo de emails');

  const resultados = await enviarConPausa(emails, (email) =>
    enviarEmail(email, asunto, mensaje, tipo, html)
  );
  const resumen = resumenDe(resultados);

  logger.info(resumen, 'Envío masivo completado');

  return { ...resumen, resultados };
};

export const obtenerPlantillas = (): PlantillaEmail[] => [
  {
    tipo: TipoEmail.ALERTA_CLIMA,
    asunto: '🌊 Alerta Meteorológica - Isla de Lobos',
    plantilla_html: '<p>Estado: {estado}<br>Oleaje: {oleaje}m<br>Viento: {viento} km/h</p>',
    plantilla_texto: 'Estado: {estado}\nOleaje: {oleaje}m\nViento: {viento} km/h',
    variables: ['estado', 'oleaje', 'viento'],
    ejemplo: 'Estado: CERRADO\nOleaje: 2.5m\nViento: 45 km/h',
  },
  {
    tipo: TipoEmail.PERMISO_POR_VENCER,
    asunto: '⚠️ Tu permiso vence en {dias} días',
    plantilla_html: '<p>Hola {nombre},<br>Tu permiso vence en {dias} días.<br>Fecha: {fecha}</p>',
    plantilla_texto: 'Hola {nombre},\nTu permiso vence en {dias} días.\nFecha: {fecha}',
    variables: ['nombre', 'dias', 'fecha'],
    ejemplo: 'Hola Juan Pérez,\nTu permiso vence en 15 días.\nFecha: 2025-10-28',
  },
  {
    tipo: TipoEmail.CONFIRMACION_SALIDA,
    asunto: '✅ Confirmación de Salida - Isla de Lobos',
    plantilla_html: '<p>Destino: {destino}<br>Fecha: {fecha}<br>Pasajeros: {pasajeros}</p>',
    plantilla_texto: 'Destino: {destino}\nFecha: {fecha}\nPasajeros: {pasajeros}',
    variables: ['destino', 'fecha', 'pasajeros'],
    ejemplo: 'Destino: Isla de Lobos\nFecha: 2025-10-13\nPasajeros: 12',
  },
];

export const getEstadoEmailService = async (): Promise<ApiResponse<GetEstadoEmailResponse>> => {
  if (!isConfigured) {
    return {
      status: 'success',
      message: 'Servicio de Email no configurado',
      data: {
        configurado: false,
        conectado: false,
        proveedor: PROVEEDOR,
      },
    };
  }

  return {
    status: 'success',
    message: 'Servicio de Email configurado y conectado',
    data: {
      configurado: true,
      conectado: true,
      proveedor: PROVEEDOR,
      host: PROVEEDOR,
      fromAddress: {
        email: fromEmail,
        requiresVerification: true,
        note: 'Este email debe estar verificado en SendGrid',
      },
    },
  };
};

export const enviarEmailService = async (
  body: EnviarEmailBody
): Promise<ApiResponse<EnviarEmailResponse>> => {
  assertEmailConfigured();

  const resultado = await enviarEmail(
    body.email,
    body.asunto,
    body.mensaje,
    body.tipo ?? TipoEmail.NOTIFICACION_GENERAL,
    body.html ?? false
  );

  if (!resultado.success) {
    throw new AppError(resultado.error || 'Error al enviar email', 500);
  }

  return {
    status: 'success',
    message: 'Email enviado exitosamente',
    data: { email_info: resultado },
  };
};

export const enviarEmailMasivoService = async (
  body: EnviarEmailMasivoBody
): Promise<ApiResponse<EnviarMasivoResponse>> => {
  assertEmailConfigured();

  const usuarios = await User.findAll({
    where: { id: body.usuarios_ids },
    attributes: ['id', 'nombre', 'email'],
  });

  const emails = emailsDeUsuarios(usuarios);
  if (emails.length === 0) {
    throw new AppError('Ninguno de los usuarios tiene email registrado', 400);
  }

  const resultado = await enviarMasivo(
    emails,
    body.asunto,
    body.mensaje,
    body.tipo ?? TipoEmail.NOTIFICACION_GENERAL,
    body.html ?? false
  );

  return {
    status: 'success',
    message: 'Emails masivos procesados',
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
  body: EnviarAlertaClimaBody
): Promise<ApiResponse<EnviarMasivoResponse>> => {
  assertEmailConfigured();

  const prestadores = await User.findAll({
    where: {
      rol: UserRole.PRESTADOR,
      activo: true,
      email: { [Op.ne]: '' },
    },
    attributes: ['id', 'nombre', 'email'],
  });

  const emails = emailsDeUsuarios(prestadores);
  if (emails.length === 0) {
    throw new AppError('No hay prestadores activos con email registrado', 400);
  }

  const datosAlerta: EmailAlertaClimaData = {
    estado_puerto: body.estado_puerto,
    oleaje: body.oleaje,
    viento_velocidad: body.viento_velocidad,
    fecha: body.fecha,
    ...(body.mensaje_adicional !== undefined ? { mensaje_adicional: body.mensaje_adicional } : {}),
  };

  const { asunto, html } = buildAlertaClimaEmail(datosAlerta);
  const resultados = await enviarConPausa(emails, (email) =>
    enviarEmail(email, asunto, html, TipoEmail.ALERTA_CLIMA, true)
  );

  return {
    status: 'success',
    message: 'Alerta de clima enviada por email a prestadores',
    data: {
      resumen: resumenDe(resultados),
      resultados,
    },
  };
};

export const enviarAlertaPermisosService = async (
  body: EnviarAlertaPermisosBody
): Promise<ApiResponse<EnviarMasivoResponse>> => {
  assertEmailConfigured();

  const dias = body.dias_anticipacion ?? 30;
  const hoy = getTodayMexico();
  const fechaLimite = addDaysToDateOnly(hoy, dias);

  const usuarios = await User.findAll({
    where: {
      rol: UserRole.PRESTADOR,
      activo: true,
      email: { [Op.ne]: '' },
      fechaVencimientoPermiso: { [Op.between]: [hoy, fechaLimite] },
    },
    attributes: ['id', 'nombre', 'email', 'fechaVencimientoPermiso', 'estadoPermiso'],
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
        email: usuario.email,
        fechaVencimientoPermiso: fechaVencimiento,
      },
      diasRestantes
    );
  });

  return {
    status: 'success',
    message: 'Alertas de permisos enviadas por email',
    data: {
      resumen: resumenDe(resultados),
      resultados,
    },
  };
};

export const getPlantillasEmailService = async (): Promise<
  ApiResponse<GetPlantillasEmailResponse>
> => {
  const plantillas = obtenerPlantillas();
  return {
    status: 'success',
    message: 'Plantillas de emails obtenidas',
    data: {
      plantillas,
      total: plantillas.length,
    },
  };
};

export const enviarPruebaEmailService = async (
  body: EnviarPruebaBody
): Promise<ApiResponse<EnviarEmailResponse>> => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new AppError('Endpoint de prueba no disponible en producción', 403);
  }

  assertEmailConfigured();

  const { asunto, html } = buildPruebaEmail();
  const resultado = await enviarEmail(body.email, asunto, html, TipoEmail.NOTIFICACION_GENERAL, true);

  if (!resultado.success) {
    throw new AppError(resultado.error || 'Error al enviar email de prueba', 500);
  }

  return {
    status: 'success',
    message: 'Email de prueba enviado',
    data: { email_info: resultado },
  };
};
