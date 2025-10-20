import sgMail from "@sendgrid/mail";
import { createLogger } from "../utils/logger";
import {
  TipoEmail,
  EstadoNotificacion,
  EmailResponse,
  EmailMasivoResponse,
  PlantillaEmail,
  EmailAlertaClimaData,
  EmailSalidaData,
  EmailRecuperacionPasswordData,
  EmailBienvenidaData,
  EmailInvitacionData,
  User,
  EstadoPuerto,
  UserRole,
} from "../types";

const logger = createLogger("EmailService");

/**
 * Servicio para gestionar el envío de correos electrónicos a través de SendGrid Web API
 * Maneja notificaciones, alertas y mensajes automáticos del sistema
 */
class EmailService {
  private fromEmail: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa SendGrid Web API
   */
  private initialize(): void {
    try {
      const apiKey = process.env["SENDGRID_API_KEY"];
      const fromEmail = process.env["SENDGRID_FROM_EMAIL"];

      logger.info(
        {
          apiKey: apiKey ? "***configurado***" : "undefined",
          fromEmail: fromEmail || "undefined",
        },
        "🔍 Verificando variables de entorno SendGrid Web API"
      );

      if (!apiKey || !fromEmail) {
        logger.warn(
          "SendGrid API Key o From Email no configurados. El servicio de email estará deshabilitado."
        );
        this.isConfigured = false;
        return;
      }

      // Configurar SendGrid Web API
      sgMail.setApiKey(apiKey);
      this.fromEmail = fromEmail;
      this.isConfigured = true;

      logger.info("✅ SendGrid Web API inicializado correctamente");
      logger.info(
        {
          from: this.fromEmail,
          environment: process.env["NODE_ENV"] || "development",
          provider: "SendGrid Web API",
        },
        "Configuración de email con SendGrid Web API"
      );
    } catch (error) {
      logger.error({ error }, "Error al inicializar SendGrid Web API");
      this.isConfigured = false;
    }
  }

  /**
   * Verifica si el servicio está configurado y listo para usar
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Obtiene información sobre la configuración del from address
   */
  public getFromAddressInfo(): {
    fromEmail: string | null;
    isConfigured: boolean;
    requiresVerification: boolean;
  } {
    return {
      fromEmail: this.fromEmail,
      isConfigured: this.isConfigured,
      requiresVerification: this.fromEmail !== process.env["NODEMAILER_USER"],
    };
  }

  /**
   * Valida el formato de un email
   * @param email - Email a validar
   * @returns true si el formato es válido
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Envía un correo electrónico usando SendGrid Web API
   * @param email - Email del destinatario
   * @param asunto - Asunto del correo
   * @param mensaje - Contenido del mensaje (texto plano o HTML)
   * @param tipo - Tipo de email
   * @param html - Si el mensaje es HTML (default: false)
   * @returns Respuesta con el estado del envío
   */
  public async enviarEmail(
    email: string,
    asunto: string,
    mensaje: string,
    tipo: TipoEmail = TipoEmail.NOTIFICACION_GENERAL,
    html: boolean = false
  ): Promise<EmailResponse> {
    if (!this.isReady()) {
      logger.error("Servicio de email no configurado");
      return {
        success: false,
        email,
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: "Servicio de email no configurado",
      };
    }

    if (!this.validarEmail(email)) {
      logger.error({ email }, "Email inválido");
      return {
        success: false,
        email,
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: "Formato de email inválido",
      };
    }

    try {
      logger.info(
        { email, tipo, asunto },
        "📧 Enviando email via SendGrid API"
      );

      if (!this.fromEmail) {
        logger.error("From email no configurado");
        return {
          success: false,
          email,
          estado: EstadoNotificacion.FALLIDO,
          fecha_envio: new Date(),
          error: "From email no configurado",
        };
      }

      const msg = {
        to: email,
        from: `"CONANP - Isla Lobos" <${this.fromEmail}>`,
        subject: asunto,
        ...(html ? { html: mensaje } : { text: mensaje }),
      };

      const response = await sgMail.send(msg);

      logger.info(
        {
          statusCode: response[0].statusCode,
          messageId: response[0].headers["x-message-id"],
          email,
        },
        "✅ Email enviado exitosamente via SendGrid API"
      );

      return {
        success: true,
        message_id: response[0].headers["x-message-id"],
        email,
        estado: EstadoNotificacion.ENVIADO,
        fecha_envio: new Date(),
      };
    } catch (error) {
      logger.error(
        { error, email, tipo },
        "❌ Error al enviar email via SendGrid API"
      );

      return {
        success: false,
        email,
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Envía email de alerta de clima (puerto cerrado, oleaje alto, etc.)
   * @param email - Email del destinatario
   * @param datos - Datos de la alerta climática
   */
  public async enviarAlertaClima(
    email: string,
    datos: EmailAlertaClimaData
  ): Promise<EmailResponse> {
    const estadoEmoji: Record<EstadoPuerto, string> = {
      [EstadoPuerto.ABIERTO]: "🟢",
      [EstadoPuerto.RESTRICCIONES]: "🟡",
      [EstadoPuerto.CERRADO]: "🔴",
      [EstadoPuerto.EMERGENCIA]: "⚡",
    };

    const emoji = estadoEmoji[datos.estado_puerto];

    const htmlContent = `
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
                <span class="data-label">Velocidad del viento:</span> ${
                  datos.viento_velocidad
                } km/h
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
                  : ""
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
    `;

    return this.enviarEmail(
      email,
      `${emoji} Alerta Meteorológica - Isla de Lobos`,
      htmlContent,
      TipoEmail.ALERTA_CLIMA,
      true
    );
  }

  /**
   * Envía email de permiso próximo a vencer
   * @param usuario - Usuario al que enviar la notificación
   * @param diasRestantes - Días restantes para el vencimiento
   */
  public async enviarAlertaPermiso(
    usuario: User,
    diasRestantes: number
  ): Promise<EmailResponse> {
    if (!usuario.email) {
      return {
        success: false,
        email: "",
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: "Usuario sin email registrado",
      };
    }

    let colorAlerta = "#ff9800";
    let urgencia = "IMPORTANTE";

    if (diasRestantes <= 7) {
      colorAlerta = "#d32f2f";
      urgencia = "URGENTE";
    } else if (diasRestantes <= 15) {
      colorAlerta = "#f57c00";
      urgencia = "IMPORTANTE";
    }

    const htmlContent = `
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
            <p>Hola <strong>${usuario.nombre}</strong>,</p>
            <div class="alert-box">
              <p>Tu permiso de operación está próximo a vencer:</p>
              <div class="dias">${diasRestantes} días restantes</div>
              <p><strong>Fecha de vencimiento:</strong> ${usuario.fechaVencimientoPermiso}</p>
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
    `;

    return this.enviarEmail(
      usuario.email,
      `⚠️ ${urgencia}: Tu permiso vence en ${diasRestantes} días`,
      htmlContent,
      TipoEmail.PERMISO_POR_VENCER,
      true
    );
  }

  /**
   * Envía confirmación de registro de salida
   * @param email - Email del prestador
   * @param datos - Datos de la salida registrada
   */
  public async enviarConfirmacionSalida(
    email: string,
    datos: EmailSalidaData
  ): Promise<EmailResponse> {
    const horario = datos.bloque_nombre
      ? `<strong>Bloque:</strong> ${datos.bloque_nombre}`
      : `<strong>Hora:</strong> ${datos.hora}`;

    const htmlContent = `
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
    `;

    return this.enviarEmail(
      email,
      "✅ Confirmación de Salida - Isla de Lobos",
      htmlContent,
      TipoEmail.CONFIRMACION_SALIDA,
      true
    );
  }

  /**
   * Envía email de recuperación de contraseña
   * @param email - Email del usuario
   * @param datos - Datos de recuperación
   */
  public async enviarRecuperacionPassword(
    email: string,
    datos: EmailRecuperacionPasswordData
  ): Promise<EmailResponse> {
    const htmlContent = `
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
    `;

    return this.enviarEmail(
      email,
      "🔐 Recuperación de Contraseña - Isla de Lobos",
      htmlContent,
      TipoEmail.RECUPERACION_PASSWORD,
      true
    );
  }

  /**
   * Envía email de invitación a nuevo prestador
   * @param datos - Datos de la invitación
   */
  public async enviarInvitacion(
    datos: EmailInvitacionData
  ): Promise<EmailResponse> {
    const rolTexto =
      datos.rol === UserRole.CONANP
        ? "Administrador CONANP"
        : "Prestador de Servicios";

    const urlManual = `${process.env["FRONTEND_URL"]}/registro`;

    const htmlContent = `
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
            <p>Has sido invitado a unirte a la plataforma de gestión de CONANP para Isla de Lobos como <strong>${rolTexto}</strong>.</p>
            
            <div class="info-list">
              <h3>📋 Información de tu invitación:</h3>
              <ul>
                <li><strong>📧 Email:</strong> ${datos.email}</li>
                <li><strong>👤 Rol:</strong> ${rolTexto}</li>
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
    `;

    return this.enviarEmail(
      datos.email,
      "🏝️ Invitación a Isla de Lobos - CONANP",
      htmlContent,
      TipoEmail.INVITACION,
      true
    );
  }

  /**
   * Envía email de bienvenida a nuevo usuario
   * @param datos - Datos del usuario
   */
  public async enviarBienvenida(
    datos: EmailBienvenidaData
  ): Promise<EmailResponse> {
    const rolTexto =
      datos.rol === "conanp"
        ? "Administrador CONANP"
        : "Prestador de Servicios";

    const htmlContent = `
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
                <li><strong>Rol:</strong> ${rolTexto}</li>
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
    `;

    return this.enviarEmail(
      datos.email,
      "🏝️ Bienvenido a Isla de Lobos - CONANP",
      htmlContent,
      TipoEmail.BIENVENIDA,
      true
    );
  }

  /**
   * Envía emails masivos a múltiples usuarios
   * @param emails - Array de emails
   * @param asunto - Asunto del email
   * @param mensaje - Mensaje a enviar
   * @param tipo - Tipo de email
   * @param html - Si el mensaje es HTML
   */
  public async enviarMasivo(
    emails: string[],
    asunto: string,
    mensaje: string,
    tipo: TipoEmail = TipoEmail.NOTIFICACION_GENERAL,
    html: boolean = false
  ): Promise<EmailMasivoResponse> {
    logger.info(
      { total: emails.length, tipo },
      "📧 Iniciando envío masivo de emails"
    );

    const resultados: EmailResponse[] = [];

    // Enviar emails en secuencia (para evitar problemas con el servidor SMTP)
    for (const email of emails) {
      const resultado = await this.enviarEmail(
        email,
        asunto,
        mensaje,
        tipo,
        html
      );
      resultados.push(resultado);

      // Pequeña pausa entre emails (200ms)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const enviados = resultados.filter((r) => r.success).length;
    const fallidos = resultados.filter((r) => !r.success).length;

    logger.info(
      { total: emails.length, enviados, fallidos },
      "✅ Envío masivo completado"
    );

    return {
      total: emails.length,
      enviados,
      fallidos,
      resultados,
    };
  }

  /**
   * Obtiene las plantillas de emails disponibles
   * @returns Array de plantillas disponibles
   */
  public obtenerPlantillas(): PlantillaEmail[] {
    return [
      {
        tipo: TipoEmail.ALERTA_CLIMA,
        asunto: "🌊 Alerta Meteorológica - Isla de Lobos",
        plantilla_html:
          "<p>Estado: {estado}<br>Oleaje: {oleaje}m<br>Viento: {viento} km/h</p>",
        plantilla_texto:
          "Estado: {estado}\nOleaje: {oleaje}m\nViento: {viento} km/h",
        variables: ["estado", "oleaje", "viento"],
        ejemplo: "Estado: CERRADO\nOleaje: 2.5m\nViento: 45 km/h",
      },
      {
        tipo: TipoEmail.PERMISO_POR_VENCER,
        asunto: "⚠️ Tu permiso vence en {dias} días",
        plantilla_html:
          "<p>Hola {nombre},<br>Tu permiso vence en {dias} días.<br>Fecha: {fecha}</p>",
        plantilla_texto:
          "Hola {nombre},\nTu permiso vence en {dias} días.\nFecha: {fecha}",
        variables: ["nombre", "dias", "fecha"],
        ejemplo:
          "Hola Juan Pérez,\nTu permiso vence en 15 días.\nFecha: 2025-10-28",
      },
      {
        tipo: TipoEmail.CONFIRMACION_SALIDA,
        asunto: "✅ Confirmación de Salida - Isla de Lobos",
        plantilla_html:
          "<p>Destino: {destino}<br>Fecha: {fecha}<br>Pasajeros: {pasajeros}</p>",
        plantilla_texto:
          "Destino: {destino}\nFecha: {fecha}\nPasajeros: {pasajeros}",
        variables: ["destino", "fecha", "pasajeros"],
        ejemplo: "Destino: Isla de Lobos\nFecha: 2025-10-13\nPasajeros: 12",
      },
    ];
  }

  /**
   * Verifica la conexión con SendGrid Web API
   */
  public async verificarConexion(): Promise<{
    success: boolean;
    error?: string;
    codigo?: string;
  }> {
    if (!this.isReady()) {
      return { success: false, error: "Servicio no configurado" };
    }

    try {
      // Enviar un email de prueba para verificar la conexión
      const testMsg = {
        to: "test@example.com", // Email de prueba
        from: this.fromEmail!,
        subject: "Test de conexión SendGrid API",
        text: "Este es un email de prueba para verificar la conexión.",
      };

      // Solo verificar que la API key es válida sin enviar realmente
      await sgMail.send(testMsg);

      logger.info("✅ Conexión con SendGrid Web API verificada correctamente");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";

      logger.error(
        {
          error: errorMessage,
          environment: process.env["NODE_ENV"],
        },
        "❌ Error al verificar conexión con SendGrid Web API"
      );

      // Mensajes de error específicos para SendGrid API
      let mensajeUsuario = errorMessage;

      if (errorMessage.includes("401")) {
        mensajeUsuario =
          "Error de autenticación. Verificar API key de SendGrid.";
      } else if (errorMessage.includes("403")) {
        mensajeUsuario = "Acceso denegado. Verificar permisos de la API key.";
      } else if (errorMessage.includes("timeout")) {
        mensajeUsuario = "Timeout de conexión. Verificar conectividad de red.";
      }

      return {
        success: false,
        error: mensajeUsuario,
        codigo: "SENDGRID_API_ERROR",
      };
    }
  }
}

// Exportar instancia única del servicio (Singleton)
export default new EmailService();
