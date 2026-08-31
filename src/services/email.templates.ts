import {
  EmailAlertaClimaData,
  EmailBienvenidaData,
  EmailInvitacionData,
  EmailRecuperacionPasswordData,
  EmailSalidaData,
  EstadoPuerto,
  UserRole,
} from '../types';
import { EmailHtmlPayload } from '../types/email.types';

const estadoEmoji: Record<EstadoPuerto, string> = {
  [EstadoPuerto.ABIERTO]: '🟢',
  [EstadoPuerto.RESTRICCIONES]: '🟡',
  [EstadoPuerto.CERRADO]: '🔴',
  [EstadoPuerto.EMERGENCIA]: '⚡',
};

const urgenciaPermiso = (
  diasRestantes: number
): { colorAlerta: string; urgencia: string } => {
  if (diasRestantes <= 7) return { colorAlerta: '#d32f2f', urgencia: 'URGENTE' };
  if (diasRestantes <= 15) return { colorAlerta: '#f57c00', urgencia: 'IMPORTANTE' };
  return { colorAlerta: '#ff9800', urgencia: 'IMPORTANTE' };
};

const rolTexto = (rol: UserRole): string =>
  rol === UserRole.CONANP ? 'Administrador CONANP' : 'Prestador de Servicios';

export const buildAlertaClimaEmail = (
  datos: EmailAlertaClimaData
): EmailHtmlPayload => {
  const emoji = estadoEmoji[datos.estado_puerto];
  return {
    asunto: `${emoji} Alerta Meteorológica - Isla de Lobos`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .alert-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #d32f2f; }
          .data-row { margin: 10px 0; }
          .data-label { font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} ALERTA METEOROLÓGICA</h1>
            <p>CONANP - Isla de Lobos</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <div class="data-row">
                <span class="data-label">Estado del puerto:</span> <strong>${datos.estado_puerto.toUpperCase()}</strong>
              </div>
              <div class="data-row">
                <span class="data-label">Oleaje:</span> ${datos.oleaje} metros
              </div>
              <div class="data-row">
                <span class="data-label">Velocidad del viento:</span> ${datos.viento_velocidad} km/h
              </div>
              <div class="data-row">
                <span class="data-label">Fecha:</span> ${datos.fecha}
              </div>
              ${
                datos.mensaje_adicional
                  ? `
                <div class="data-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                  <p>${datos.mensaje_adicional}</p>
                </div>
              `
                  : ''
              }
            </div>
            <p style="color: #d32f2f; font-weight: bold;">⚠️ Por favor, tome las precauciones necesarias.</p>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático del sistema CONANP - Isla de Lobos</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

export const buildAlertaPermisoEmail = (
  nombre: string,
  fechaVencimiento: string | undefined,
  diasRestantes: number
): EmailHtmlPayload => {
  const { colorAlerta, urgencia } = urgenciaPermiso(diasRestantes);
  return {
    asunto: `⚠️ ${urgencia}: Tu permiso vence en ${diasRestantes} días`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${colorAlerta}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .alert-box { background-color: white; padding: 20px; margin: 15px 0; border-left: 4px solid ${colorAlerta}; }
          .dias { font-size: 32px; font-weight: bold; color: ${colorAlerta}; text-align: center; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${colorAlerta}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ ${urgencia}</h1>
            <p>Renovación de Permiso de Operación</p>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <div class="alert-box">
              <p>Tu permiso de operación está próximo a vencer:</p>
              <div class="dias">${diasRestantes} días restantes</div>
              <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</p>
            </div>
            <p>Por favor, renueva tu permiso a la brevedad para continuar operando sin interrupciones.</p>
            <p style="text-align: center;">
              <a href="#" class="button">Contactar CONANP</a>
            </p>
          </div>
          <div class="footer">
            <p>Comisión Nacional de Áreas Naturales Protegidas</p>
            <p>Isla de Lobos - Gestión de Prestadores</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

export const buildConfirmacionSalidaEmail = (
  datos: EmailSalidaData
): EmailHtmlPayload => {
  const horario = datos.bloque_nombre
    ? `<strong>Bloque:</strong> ${datos.bloque_nombre}`
    : `<strong>Hora:</strong> ${datos.hora}`;

  return {
    asunto: '✅ Confirmación de Salida - Isla de Lobos',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4caf50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .info-box { background-color: white; padding: 20px; margin: 15px 0; border-left: 4px solid #4caf50; }
          .data-row { margin: 10px 0; padding: 5px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Salida Registrada</h1>
            <p>Confirmación de Operación</p>
          </div>
          <div class="content">
            <p>Estimado/a <strong>${datos.prestador_nombre}</strong>,</p>
            <p>Se ha registrado exitosamente tu salida con los siguientes detalles:</p>
            <div class="info-box">
              <div class="data-row">
                <strong>Embarcación:</strong> ${datos.embarcacion_nombre}
              </div>
              <div class="data-row">
                <strong>Destino:</strong> ${datos.destino}
              </div>
              <div class="data-row">
                <strong>Fecha:</strong> ${datos.fecha}
              </div>
              <div class="data-row">
                ${horario}
              </div>
              <div class="data-row">
                <strong>Número de pasajeros:</strong> ${datos.numero_pasajeros}
              </div>
            </div>
            <p style="color: #4caf50; font-weight: bold;">🌊 ¡Buen viaje y navegación segura!</p>
          </div>
          <div class="footer">
            <p>CONANP - Isla de Lobos</p>
            <p>Sistema de Gestión de Salidas</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

export const buildRecuperacionPasswordEmail = (
  datos: EmailRecuperacionPasswordData
): EmailHtmlPayload => ({
  asunto: '🔐 Recuperación de Contraseña - Isla de Lobos',
  html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196f3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .alert-box { background-color: white; padding: 20px; margin: 15px 0; border-left: 4px solid #2196f3; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2196f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
            <p>CONANP - Isla de Lobos</p>
          </div>
          <div class="content">
            <p>Hola <strong>${datos.nombre_usuario}</strong>,</p>
            <div class="alert-box">
              <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
              <p>Si fuiste tú quien la solicitó, haz clic en el siguiente botón:</p>
              <p style="text-align: center;">
                <a href="${datos.url_reset}" class="button">Restablecer Contraseña</a>
              </p>
              <p style="font-size: 12px; color: #666;">O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; font-size: 12px; color: #666;">${datos.url_reset}</p>
            </div>
            <div class="warning">
              <p><strong>⏰ Este enlace expirará en ${datos.expiracion_minutos} minutos.</strong></p>
              <p>Si no solicitaste este cambio, ignora este mensaje. Tu contraseña permanecerá sin cambios.</p>
            </div>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
            <p>CONANP - Comisión Nacional de Áreas Naturales Protegidas</p>
          </div>
        </div>
      </body>
      </html>
    `,
});

export const buildInvitacionEmail = (
  datos: EmailInvitacionData
): EmailHtmlPayload => {
  const textoRol = rolTexto(datos.rol);
  const urlManual = `${process.env['FRONTEND_URL']}/registro`;

  return {
    asunto: '🏝️ Invitación a Isla de Lobos - CONANP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00796b; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .invitation-box { background-color: white; padding: 20px; margin: 15px 0; text-align: center; border-left: 4px solid #00796b; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #00796b, #4caf50); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .button:hover { background: linear-gradient(135deg, #005a4a, #388e3c); }
          .info-list { background-color: white; padding: 20px; margin: 15px 0; }
          .info-list li { margin: 10px 0; }
          .backup-code { background-color: #f5f5f5; padding: 20px; margin: 15px 0; border-radius: 8px; border: 2px dashed #00796b; text-align: center; }
          .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #00796b; margin: 10px 0; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .manual-link { color: #00796b; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏝️ ¡Invitación a Isla de Lobos!</h1>
            <p>Sistema de Gestión CONANP</p>
          </div>
          <div class="content">
            <p>Hola <strong>${datos.nombre}</strong>,</p>
            <p>Has sido invitado a unirte a la plataforma de gestión de CONANP para Isla de Lobos como <strong>${textoRol}</strong>.</p>
            
            <div class="info-list">
              <h3>📋 Información de tu invitación:</h3>
              <ul>
                <li><strong>📧 Email:</strong> ${datos.email}</li>
                <li><strong>👤 Rol:</strong> ${textoRol}</li>
                <li><strong>⏰ Válida por:</strong> ${datos.expiracion_dias} días</li>
              </ul>
            </div>
            
            <div class="invitation-box">
              <h3>🚀 ¡Completa tu registro ahora!</h3>
              <p>Haz clic en el botón para acceder directamente:</p>
              <a href="${datos.url_invitacion}" class="button">
                🏝️ COMPLETAR REGISTRO
              </a>
            </div>
            
            <div class="backup-code">
              <h4>🔑 Código de respaldo</h4>
              <p>Si el botón no funciona, puedes ingresar el código manualmente:</p>
              <div class="code">${datos.codigo_invitacion}</div>
              <p>O visita: <a href="${urlManual}" class="manual-link">${urlManual}</a></p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Esta invitación expira en <strong>${datos.expiracion_dias} días</strong></li>
                <li>El código solo puede usarse una vez</li>
                <li>Si tienes problemas, contacta a CONANP</li>
              </ul>
            </div>
            
            <p style="text-align: center; font-size: 18px; color: #00796b; font-weight: bold;">
              ¡Te esperamos en Isla de Lobos! 🚤
            </p>
          </div>
          <div class="footer">
            <p>CONANP - Comisión Nacional de Áreas Naturales Protegidas</p>
            <p>Isla de Lobos - Veracruz, México</p>
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

export const buildBienvenidaEmail = (
  datos: EmailBienvenidaData
): EmailHtmlPayload => {
  const textoRol = rolTexto(datos.rol);
  return {
    asunto: '🏝️ Bienvenido a Isla de Lobos - CONANP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #00796b; color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
          .welcome-box { background-color: white; padding: 20px; margin: 15px 0; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background-color: #00796b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-list { background-color: white; padding: 20px; margin: 15px 0; }
          .info-list li { margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏝️ ¡Bienvenido a Isla de Lobos!</h1>
            <p>Sistema de Gestión CONANP</p>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2>Hola ${datos.nombre_usuario},</h2>
              <p>Tu registro ha sido exitoso. Ya puedes acceder al sistema de gestión de CONANP para Isla de Lobos.</p>
            </div>
            <div class="info-list">
              <h3>Información de tu cuenta:</h3>
              <ul>
                <li><strong>Email:</strong> ${datos.email}</li>
                <li><strong>Rol:</strong> ${textoRol}</li>
              </ul>
            </div>
            <p style="text-align: center;">
              <a href="${datos.url_plataforma}" class="button">Acceder al Sistema</a>
            </p>
            <p style="text-align: center; color: #666;">Si tienes alguna duda, no dudes en contactarnos.</p>
            <p style="text-align: center; font-size: 18px;">¡Bienvenido al equipo! 🚤</p>
          </div>
          <div class="footer">
            <p>CONANP - Comisión Nacional de Áreas Naturales Protegidas</p>
            <p>Isla de Lobos - Veracruz, México</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

export const buildPruebaEmail = (): EmailHtmlPayload => ({
  asunto: '🧪 Prueba - Sistema de Emails Isla de Lobos',
  html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00796b; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { background-color: #f5f5f5; padding: 20px; margin-top: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Mensaje de Prueba</h1>
            </div>
            <div class="content">
              <p>Este es un mensaje de prueba del sistema de emails de Isla Lobos.</p>
              <p>Si recibes este mensaje, la integración con SendGrid está funcionando correctamente. ✅</p>
              <p><strong>Sistema CONANP - Isla de Lobos</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
});
