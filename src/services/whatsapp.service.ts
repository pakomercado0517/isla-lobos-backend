import twilio from 'twilio';
import {
  EstadoNotificacion,
  EstadoPuerto,
  NotificacionAlertaClimaData,
  NotificacionMasivaResponse,
  NotificacionResponse,
  NotificacionResumenDiarioData,
  NotificacionSalidaData,
  NotificacionStockData,
  PlantillaNotificacion,
  TemplateVariables,
  TipoNotificacion,
  User,
} from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('WhatsAppService');
const PAUSA_MS = 100;
const PROVEEDOR = 'Twilio';

let client: twilio.Twilio | null = null;
let whatsappNumber = '';
let isConfigured = false;
const defaultTemplateLanguage = process.env['TWILIO_WHATSAPP_TEMPLATE_LANGUAGE'] || 'es';
const messagingServiceSid = process.env['TWILIO_MESSAGE_SERVICE_SID'] || null;

const initializeWhatsapp = (): void => {
  try {
    const accountSid = process.env['TWILIO_ACCOUNT_SID'];
    const authToken = process.env['TWILIO_AUTH_TOKEN'];
    const configuredNumber = process.env['TWILIO_WHATSAPP_NUMBER'];

    if (!accountSid || !authToken || !configuredNumber) {
      logger.warn(
        'Credenciales de Twilio no configuradas. El servicio de WhatsApp estará deshabilitado.'
      );
      isConfigured = false;
      return;
    }

    client = twilio(accountSid, authToken);
    whatsappNumber = configuredNumber.startsWith('whatsapp:')
      ? configuredNumber
      : `whatsapp:${configuredNumber}`;
    isConfigured = true;

    logger.info('Servicio de WhatsApp (Twilio) inicializado correctamente');
    logger.debug({ whatsappNumber }, 'Número de WhatsApp configurado');
  } catch (error) {
    logger.error({ error }, 'Error al inicializar servicio de WhatsApp');
    isConfigured = false;
  }
};

initializeWhatsapp();

const pausa = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const enviarConPausa = async <T>(
  items: T[],
  sendFn: (item: T) => Promise<NotificacionResponse>
): Promise<NotificacionResponse[]> => {
  const resultados: NotificacionResponse[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item === undefined) continue;
    resultados.push(await sendFn(item));
    if (i < items.length - 1) await pausa(PAUSA_MS);
  }
  return resultados;
};

export const isWhatsappReady = (): boolean => isConfigured && client !== null;

export const getWhatsappProveedor = (): string => PROVEEDOR;

const formatearTelefono = (telefono: string): string => {
  const numeroLimpio = telefono.replace(/[\s\-()]/g, '');

  if (numeroLimpio.startsWith('+521')) return `whatsapp:${numeroLimpio}`;
  if (numeroLimpio.startsWith('+52')) return `whatsapp:+521${numeroLimpio.substring(3)}`;
  if (numeroLimpio.startsWith('52')) return `whatsapp:+521${numeroLimpio.substring(2)}`;
  if (numeroLimpio.startsWith('521')) return `whatsapp:+${numeroLimpio}`;
  return `whatsapp:+521${numeroLimpio}`;
};

const falloEnvio = (telefono: string, error: string): NotificacionResponse => ({
  success: false,
  telefono,
  estado: EstadoNotificacion.FALLIDO,
  fecha_envio: new Date(),
  error,
});

const buildContentVariables = (variables?: TemplateVariables): string | undefined => {
  if (!variables) return undefined;

  const valores: Record<string, string> = Array.isArray(variables)
    ? variables.reduce<Record<string, string>>((acc, value, index) => {
        if (value !== undefined && value !== null) acc[String(index + 1)] = String(value);
        return acc;
      }, {})
    : Object.entries(variables).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== undefined && value !== null) acc[key] = String(value);
        return acc;
      }, {});

  if (Object.keys(valores).length === 0) return undefined;
  return JSON.stringify(valores);
};

export const enviarMensaje = async (
  telefono: string,
  mensaje: string,
  tipo: TipoNotificacion = TipoNotificacion.RECORDATORIO_GENERICO
): Promise<NotificacionResponse> => {
  if (!isWhatsappReady() || !client) {
    logger.error('Servicio de WhatsApp no configurado');
    return falloEnvio(telefono, 'Servicio de WhatsApp no configurado');
  }

  try {
    const telefonoFormateado = formatearTelefono(telefono);
    logger.info({ telefono: telefonoFormateado, tipo }, 'Enviando mensaje de WhatsApp');

    const message = await client.messages.create({
      from: whatsappNumber,
      to: telefonoFormateado,
      body: mensaje,
    });

    logger.info({ messageId: message.sid, status: message.status }, 'Mensaje enviado exitosamente');

    return {
      success: true,
      message_id: message.sid,
      telefono: telefonoFormateado,
      estado: EstadoNotificacion.ENVIADO,
      fecha_envio: new Date(),
    };
  } catch (error) {
    logger.error({ error, telefono, tipo }, 'Error al enviar mensaje');
    return falloEnvio(
      telefono,
      error instanceof Error ? error.message : 'Error desconocido al enviar mensaje'
    );
  }
};

export const enviarMensajeConTemplate = async (
  telefono: string,
  contentSid: string,
  variables?: TemplateVariables,
  languageCode?: string
): Promise<NotificacionResponse> => {
  if (!isWhatsappReady() || !client) {
    logger.error('Servicio de WhatsApp no configurado');
    return falloEnvio(telefono, 'Servicio de WhatsApp no configurado');
  }

  try {
    const telefonoFormateado = formatearTelefono(telefono);
    const contentVariables = buildContentVariables(variables);
    const language = languageCode || defaultTemplateLanguage;

    const messagePayload: {
      to: string;
      contentSid: string;
      contentVariables?: string;
      messagingServiceSid?: string;
      from?: string;
    } = {
      to: telefonoFormateado,
      contentSid,
    };

    if (contentVariables) messagePayload.contentVariables = contentVariables;
    if (messagingServiceSid) {
      messagePayload.messagingServiceSid = messagingServiceSid;
    } else {
      messagePayload.from = whatsappNumber;
    }

    const message = await client.messages.create(messagePayload);

    logger.info(
      { messageId: message.sid, status: message.status, contentSid, language },
      'Mensaje con plantilla enviado exitosamente'
    );

    return {
      success: true,
      message_id: message.sid,
      telefono: telefonoFormateado,
      estado: EstadoNotificacion.ENVIADO,
      fecha_envio: new Date(),
    };
  } catch (error) {
    logger.error({ error, contentSid, telefono }, 'Error al enviar mensaje con plantilla');
    return falloEnvio(
      telefono,
      error instanceof Error
        ? error.message
        : 'Error desconocido al enviar mensaje con plantilla'
    );
  }
};

export const enviarAlertaClima = async (
  telefono: string,
  datos: NotificacionAlertaClimaData
): Promise<NotificacionResponse> => {
  const emojis: Record<EstadoPuerto, string> = {
    [EstadoPuerto.ABIERTO]: '🟢',
    [EstadoPuerto.RESTRICCIONES]: '🟡',
    [EstadoPuerto.CERRADO]: '🔴',
    [EstadoPuerto.EMERGENCIA]: '⚡',
  };

  const mensaje =
    `${emojis[datos.estado_puerto]} *ALERTA METEOROLÓGICA - CONANP*\n\n` +
    `Estado del puerto: *${datos.estado_puerto.toUpperCase()}*\n` +
    `Oleaje: ${datos.oleaje}m\n` +
    `Viento: ${datos.viento_velocidad} km/h\n\n` +
    (datos.mensaje_adicional ? `${datos.mensaje_adicional}\n\n` : '') +
    `⚠️ Por favor, tome las precauciones necesarias.`;

  return enviarMensaje(telefono, mensaje, TipoNotificacion.ALERTA_CLIMA);
};

interface UsuarioAlertaPermiso {
  nombre: string;
  telefono?: string | undefined;
  fechaVencimientoPermiso?: string | undefined;
}

export const enviarAlertaPermiso = async (
  usuario: UsuarioAlertaPermiso,
  diasRestantes: number
): Promise<NotificacionResponse> => {
  if (!usuario.telefono) {
    return falloEnvio('', 'Usuario sin número de teléfono registrado');
  }

  let emoji = '⚠️';
  let urgencia = '';
  if (diasRestantes <= 7) {
    emoji = '🚨';
    urgencia = 'URGENTE - ';
  } else if (diasRestantes <= 15) {
    urgencia = 'IMPORTANTE - ';
  }

  const mensaje =
    `${emoji} *${urgencia}CONANP - Isla Lobos*\n\n` +
    `Hola ${usuario.nombre},\n\n` +
    `Tu permiso de operación vence en *${diasRestantes} días*.\n` +
    `Fecha de vencimiento: ${usuario.fechaVencimientoPermiso}\n\n` +
    `Por favor, renueva tu permiso a la brevedad para continuar operando.\n\n` +
    `_Para más información, contacta a CONANP._`;

  return enviarMensaje(usuario.telefono, mensaje, TipoNotificacion.PERMISO_POR_VENCER);
};

export const enviarConfirmacionSalida = async (
  telefono: string,
  datos: NotificacionSalidaData
): Promise<NotificacionResponse> => {
  const horario = datos.bloque_nombre
    ? `Bloque: ${datos.bloque_nombre}`
    : `Hora: ${datos.hora}`;

  const mensaje =
    `✅ *SALIDA REGISTRADA - CONANP*\n\n` +
    `Prestador: ${datos.prestador_nombre}\n` +
    `Embarcación: ${datos.embarcacion_nombre}\n` +
    `Destino: ${datos.destino}\n` +
    `Fecha: ${datos.fecha}\n` +
    `${horario}\n` +
    `Pasajeros: ${datos.numero_pasajeros}\n\n` +
    `🌊 ¡Buen viaje y navegación segura!`;

  return enviarMensaje(telefono, mensaje, TipoNotificacion.CONFIRMACION_SALIDA);
};

export const enviarCancelacionSalida = async (
  telefono: string,
  datos: NotificacionSalidaData,
  motivo: string
): Promise<NotificacionResponse> => {
  const mensaje =
    `🚫 *SALIDA CANCELADA - CONANP*\n\n` +
    `Prestador: ${datos.prestador_nombre}\n` +
    `Embarcación: ${datos.embarcacion_nombre}\n` +
    `Destino: ${datos.destino}\n` +
    `Fecha: ${datos.fecha}\n\n` +
    `Motivo: ${motivo}\n\n` +
    `_Para más información, contacta a CONANP._`;

  return enviarMensaje(telefono, mensaje, TipoNotificacion.CANCELACION_SALIDA);
};

export const enviarAlertaStockBajo = async (
  telefono: string,
  datos: NotificacionStockData
): Promise<NotificacionResponse> => {
  const emoji =
    datos.porcentaje_disponible < 10 ? '🚨' : datos.porcentaje_disponible < 25 ? '⚠️' : '📊';

  const mensaje =
    `${emoji} *ALERTA DE INVENTARIO - CONANP*\n\n` +
    `Tipo de brazalete: ${datos.tipo_brazalete}\n` +
    `Disponibles: ${datos.cantidad_disponible}\n` +
    `Mínimo requerido: ${datos.cantidad_minima}\n` +
    `Porcentaje: ${datos.porcentaje_disponible.toFixed(1)}%\n\n` +
    `⚠️ Se requiere reabastecer el inventario.`;

  return enviarMensaje(telefono, mensaje, TipoNotificacion.STOCK_BRAZALETES_BAJO);
};

export const enviarResumenDiario = async (
  telefono: string,
  datos: NotificacionResumenDiarioData
): Promise<NotificacionResponse> => {
  const estadoPuerto =
    datos.estado_puerto === EstadoPuerto.ABIERTO
      ? '🟢 ABIERTO'
      : datos.estado_puerto === EstadoPuerto.RESTRICCIONES
        ? '🟡 RESTRICCIONES'
        : '🔴 CERRADO';

  const mensaje =
    `📊 *RESUMEN DIARIO - ISLA LOBOS*\n\n` +
    `Fecha: ${datos.fecha}\n\n` +
    `*Operaciones:*\n` +
    `• Salidas: ${datos.total_salidas}\n` +
    `• Pasajeros: ${datos.total_pasajeros}\n` +
    `• Embarcaciones activas: ${datos.embarcaciones_activas}\n` +
    `• Ocupación: ${datos.capacidad_ocupada}%\n\n` +
    `*Estado del puerto:* ${estadoPuerto}\n\n` +
    `_Reporte automático - CONANP_`;

  return enviarMensaje(telefono, mensaje, TipoNotificacion.RESUMEN_DIARIO);
};

export const enviarBienvenida = async (usuario: User): Promise<NotificacionResponse> => {
  if (!usuario.telefono) {
    return falloEnvio('', 'Usuario sin número de teléfono registrado');
  }

  const mensaje =
    `🏝️ *¡Bienvenido a Isla Lobos!*\n\n` +
    `Hola ${usuario.nombre},\n\n` +
    `Tu registro ha sido exitoso. Ahora puedes acceder al sistema de gestión de CONANP.\n\n` +
    `Rol: ${usuario.rol === 'conanp' ? 'Administrador CONANP' : 'Prestador de Servicios'}\n\n` +
    `Si tienes alguna duda, no dudes en contactarnos.\n\n` +
    `¡Bienvenido al equipo! 🚤`;

  return enviarMensaje(usuario.telefono, mensaje, TipoNotificacion.BIENVENIDA);
};

export const enviarMasivo = async (
  telefonos: string[],
  mensaje: string,
  tipo: TipoNotificacion = TipoNotificacion.RECORDATORIO_GENERICO
): Promise<NotificacionMasivaResponse> => {
  logger.info({ total: telefonos.length, tipo }, 'Iniciando envío masivo de mensajes');

  const resultados = await enviarConPausa(telefonos, (telefono) =>
    enviarMensaje(telefono, mensaje, tipo)
  );
  const enviados = resultados.filter((r) => r.success).length;
  const fallidos = resultados.filter((r) => !r.success).length;

  logger.info({ total: telefonos.length, enviados, fallidos }, 'Envío masivo completado');

  return {
    total: telefonos.length,
    enviados,
    fallidos,
    resultados,
  };
};

export const obtenerPlantillas = (): PlantillaNotificacion[] => [
  {
    tipo: TipoNotificacion.ALERTA_CLIMA,
    titulo: 'Alerta Meteorológica',
    plantilla: '🌊 *ALERTA METEOROLÓGICA*\nEstado: {estado}\nOleaje: {oleaje}m\nViento: {viento} km/h',
    variables: ['estado', 'oleaje', 'viento'],
    ejemplo: '🌊 *ALERTA METEOROLÓGICA*\nEstado: CERRADO\nOleaje: 2.5m\nViento: 45 km/h',
  },
  {
    tipo: TipoNotificacion.PERMISO_POR_VENCER,
    titulo: 'Permiso por Vencer',
    plantilla: '⚠️ *PERMISO POR VENCER*\nHola {nombre},\nTu permiso vence en {dias} días.\nFecha: {fecha}',
    variables: ['nombre', 'dias', 'fecha'],
    ejemplo: '⚠️ *PERMISO POR VENCER*\nHola Juan Pérez,\nTu permiso vence en 15 días.\nFecha: 2025-10-28',
  },
  {
    tipo: TipoNotificacion.CONFIRMACION_SALIDA,
    titulo: 'Confirmación de Salida',
    plantilla: '✅ *SALIDA REGISTRADA*\nDestino: {destino}\nFecha: {fecha}\nPasajeros: {pasajeros}',
    variables: ['destino', 'fecha', 'pasajeros'],
    ejemplo: '✅ *SALIDA REGISTRADA*\nDestino: Isla de Lobos\nFecha: 2025-10-13\nPasajeros: 12',
  },
];

export const verificarEstadoMensaje = async (
  messageSid: string
): Promise<{ estado: string; fecha_actualizacion?: Date; error?: string }> => {
  if (!isWhatsappReady() || !client) {
    return { estado: 'error', error: 'Servicio no configurado' };
  }

  try {
    const message = await client.messages(messageSid).fetch();
    return {
      estado: message.status,
      ...(message.dateUpdated ? { fecha_actualizacion: message.dateUpdated } : {}),
    };
  } catch (error) {
    logger.error({ error, messageSid }, 'Error al verificar estado');
    return {
      estado: 'error',
      error: error instanceof Error ? error.message : 'Error al verificar estado',
    };
  }
};
