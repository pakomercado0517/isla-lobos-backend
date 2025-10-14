import twilio from "twilio";
import { createLogger } from "../utils/logger";
import {
  TipoNotificacion,
  EstadoNotificacion,
  NotificacionResponse,
  NotificacionMasivaResponse,
  PlantillaNotificacion,
  NotificacionAlertaClimaData,
  NotificacionSalidaData,
  NotificacionStockData,
  NotificacionResumenDiarioData,
  EstadoPuerto,
  User,
} from "../types";

const logger = createLogger("WhatsAppService");

/**
 * Servicio para gestionar el envío de mensajes de WhatsApp a través de Twilio
 * Maneja notificaciones, alertas y mensajes automáticos del sistema
 */
class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private whatsappNumber: string = "";
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el cliente de Twilio con las credenciales del .env
   */
  private initialize(): void {
    try {
      const accountSid = process.env["TWILIO_ACCOUNT_SID"];
      const authToken = process.env["TWILIO_AUTH_TOKEN"];
      const whatsappNumber = process.env["TWILIO_WHATSAPP_NUMBER"];

      if (!accountSid || !authToken || !whatsappNumber) {
        logger.warn(
          "Credenciales de Twilio no configuradas. El servicio de WhatsApp estará deshabilitado."
        );
        this.isConfigured = false;
        return;
      }

      this.client = twilio(accountSid, authToken);

      // Asegurar que el número tenga el prefijo whatsapp:
      this.whatsappNumber = whatsappNumber.startsWith("whatsapp:")
        ? whatsappNumber
        : `whatsapp:${whatsappNumber}`;

      this.isConfigured = true;

      logger.info(
        "✅ Servicio de WhatsApp (Twilio) inicializado correctamente"
      );
      logger.debug(
        { whatsappNumber: this.whatsappNumber },
        "Número de WhatsApp configurado"
      );
    } catch (error) {
      logger.error({ error }, "Error al inicializar servicio de WhatsApp");
      this.isConfigured = false;
    }
  }

  /**
   * Verifica si el servicio está configurado y listo para usar
   */
  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Formatea un número telefónico al formato internacional de WhatsApp
   * @param telefono - Número en cualquier formato (10 dígitos sin prefijo)
   * @returns Número en formato whatsapp:+521XXXXXXXXXX (números móviles de México)
   */
  private formatearTelefono(telefono: string): string {
    // Eliminar espacios, guiones y paréntesis
    let numeroLimpio = telefono.replace(/[\s\-\(\)]/g, "");

    // Si ya tiene el prefijo completo +521, usarlo directamente
    if (numeroLimpio.startsWith("+521")) {
      return `whatsapp:${numeroLimpio}`;
    }

    // Si tiene +52 (sin el 1), agregar el 1
    if (numeroLimpio.startsWith("+52")) {
      // Extraer solo los dígitos después del +52
      const digitos = numeroLimpio.substring(3);
      return `whatsapp:+521${digitos}`;
    }

    // Si tiene 52 al inicio (sin +), agregar +521
    if (numeroLimpio.startsWith("52")) {
      const digitos = numeroLimpio.substring(2);
      return `whatsapp:+521${digitos}`;
    }

    // Si tiene 521 al inicio (sin +), solo agregar +
    if (numeroLimpio.startsWith("521")) {
      return `whatsapp:+${numeroLimpio}`;
    }

    // Si solo son los 10 dígitos del número, agregar +521
    // Ejemplo: "2291234567" -> "whatsapp:+5212291234567"
    return `whatsapp:+521${numeroLimpio}`;
  }

  /**
   * Envía un mensaje de WhatsApp a un número específico
   * @param telefono - Número de teléfono del destinatario
   * @param mensaje - Contenido del mensaje
   * @param tipo - Tipo de notificación
   * @returns Respuesta con el estado del envío
   */
  public async enviarMensaje(
    telefono: string,
    mensaje: string,
    tipo: TipoNotificacion = TipoNotificacion.RECORDATORIO_GENERICO
  ): Promise<NotificacionResponse> {
    if (!this.isReady()) {
      logger.error("Servicio de WhatsApp no configurado");
      return {
        success: false,
        telefono,
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: "Servicio de WhatsApp no configurado",
      };
    }

    try {
      const telefonoFormateado = this.formatearTelefono(telefono);

      logger.info(
        { telefono: telefonoFormateado, tipo },
        "📤 Enviando mensaje de WhatsApp"
      );

      const message = await this.client!.messages.create({
        from: this.whatsappNumber,
        to: telefonoFormateado,
        body: mensaje,
      });

      logger.info(
        { messageId: message.sid, status: message.status },
        "✅ Mensaje enviado exitosamente"
      );

      return {
        success: true,
        message_id: message.sid,
        telefono: telefonoFormateado,
        estado: EstadoNotificacion.ENVIADO,
        fecha_envio: new Date(),
      };
    } catch (error) {
      logger.error({ error, telefono, tipo }, "❌ Error al enviar mensaje");

      return {
        success: false,
        telefono,
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al enviar mensaje",
      };
    }
  }

  /**
   * Envía notificación de alerta de clima (puerto cerrado, oleaje alto, etc.)
   * @param telefono - Número del destinatario
   * @param datos - Datos de la alerta climática
   */
  public async enviarAlertaClima(
    telefono: string,
    datos: NotificacionAlertaClimaData
  ): Promise<NotificacionResponse> {
    const emojis = {
      [EstadoPuerto.ABIERTO]: "🟢",
      [EstadoPuerto.RESTRICCIONES]: "🟡",
      [EstadoPuerto.CERRADO]: "🔴",
      [EstadoPuerto.EMERGENCIA]: "⚡",
    };

    const emoji = emojis[datos.estado_puerto];

    const mensaje =
      `${emoji} *ALERTA METEOROLÓGICA - CONANP*\n\n` +
      `Estado del puerto: *${datos.estado_puerto.toUpperCase()}*\n` +
      `Oleaje: ${datos.oleaje}m\n` +
      `Viento: ${datos.viento_velocidad} km/h\n\n` +
      (datos.mensaje_adicional ? `${datos.mensaje_adicional}\n\n` : "") +
      `⚠️ Por favor, tome las precauciones necesarias.`;

    return this.enviarMensaje(telefono, mensaje, TipoNotificacion.ALERTA_CLIMA);
  }

  /**
   * Envía notificación de permiso próximo a vencer
   * @param usuario - Usuario al que enviar la notificación
   * @param diasRestantes - Días restantes para el vencimiento
   */
  public async enviarAlertaPermiso(
    usuario: User,
    diasRestantes: number
  ): Promise<NotificacionResponse> {
    if (!usuario.telefono) {
      return {
        success: false,
        telefono: "",
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: "Usuario sin número de teléfono registrado",
      };
    }

    let emoji = "⚠️";
    let urgencia = "";

    if (diasRestantes <= 7) {
      emoji = "🚨";
      urgencia = "URGENTE - ";
    } else if (diasRestantes <= 15) {
      emoji = "⚠️";
      urgencia = "IMPORTANTE - ";
    }

    const mensaje =
      `${emoji} *${urgencia}CONANP - Isla Lobos*\n\n` +
      `Hola ${usuario.nombre},\n\n` +
      `Tu permiso de operación vence en *${diasRestantes} días*.\n` +
      `Fecha de vencimiento: ${usuario.fechaVencimientoPermiso}\n\n` +
      `Por favor, renueva tu permiso a la brevedad para continuar operando.\n\n` +
      `_Para más información, contacta a CONANP._`;

    return this.enviarMensaje(
      usuario.telefono,
      mensaje,
      TipoNotificacion.PERMISO_POR_VENCER
    );
  }

  /**
   * Envía confirmación de registro de salida
   * @param telefono - Número del prestador
   * @param datos - Datos de la salida registrada
   */
  public async enviarConfirmacionSalida(
    telefono: string,
    datos: NotificacionSalidaData
  ): Promise<NotificacionResponse> {
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

    return this.enviarMensaje(
      telefono,
      mensaje,
      TipoNotificacion.CONFIRMACION_SALIDA
    );
  }

  /**
   * Envía notificación de cancelación de salida
   * @param telefono - Número del prestador
   * @param datos - Datos de la salida cancelada
   * @param motivo - Motivo de la cancelación
   */
  public async enviarCancelacionSalida(
    telefono: string,
    datos: NotificacionSalidaData,
    motivo: string
  ): Promise<NotificacionResponse> {
    const mensaje =
      `🚫 *SALIDA CANCELADA - CONANP*\n\n` +
      `Prestador: ${datos.prestador_nombre}\n` +
      `Embarcación: ${datos.embarcacion_nombre}\n` +
      `Destino: ${datos.destino}\n` +
      `Fecha: ${datos.fecha}\n\n` +
      `Motivo: ${motivo}\n\n` +
      `_Para más información, contacta a CONANP._`;

    return this.enviarMensaje(
      telefono,
      mensaje,
      TipoNotificacion.CANCELACION_SALIDA
    );
  }

  /**
   * Envía alerta de stock bajo de brazaletes
   * @param telefono - Número del administrador o prestador
   * @param datos - Datos del stock de brazaletes
   */
  public async enviarAlertaStockBajo(
    telefono: string,
    datos: NotificacionStockData
  ): Promise<NotificacionResponse> {
    const emoji =
      datos.porcentaje_disponible < 10
        ? "🚨"
        : datos.porcentaje_disponible < 25
        ? "⚠️"
        : "📊";

    const mensaje =
      `${emoji} *ALERTA DE INVENTARIO - CONANP*\n\n` +
      `Tipo de brazalete: ${datos.tipo_brazalete}\n` +
      `Disponibles: ${datos.cantidad_disponible}\n` +
      `Mínimo requerido: ${datos.cantidad_minima}\n` +
      `Porcentaje: ${datos.porcentaje_disponible.toFixed(1)}%\n\n` +
      `⚠️ Se requiere reabastecer el inventario.`;

    return this.enviarMensaje(
      telefono,
      mensaje,
      TipoNotificacion.STOCK_BRAZALETES_BAJO
    );
  }

  /**
   * Envía resumen diario de operaciones (solo para CONANP)
   * @param telefono - Número del administrador
   * @param datos - Datos del resumen diario
   */
  public async enviarResumenDiario(
    telefono: string,
    datos: NotificacionResumenDiarioData
  ): Promise<NotificacionResponse> {
    const estadoPuerto =
      datos.estado_puerto === EstadoPuerto.ABIERTO
        ? "🟢 ABIERTO"
        : datos.estado_puerto === EstadoPuerto.RESTRICCIONES
        ? "🟡 RESTRICCIONES"
        : "🔴 CERRADO";

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

    return this.enviarMensaje(
      telefono,
      mensaje,
      TipoNotificacion.RESUMEN_DIARIO
    );
  }

  /**
   * Envía mensaje de bienvenida a nuevo usuario
   * @param usuario - Usuario que se registró
   */
  public async enviarBienvenida(usuario: User): Promise<NotificacionResponse> {
    if (!usuario.telefono) {
      return {
        success: false,
        telefono: "",
        estado: EstadoNotificacion.FALLIDO,
        fecha_envio: new Date(),
        error: "Usuario sin número de teléfono registrado",
      };
    }

    const mensaje =
      `🏝️ *¡Bienvenido a Isla Lobos!*\n\n` +
      `Hola ${usuario.nombre},\n\n` +
      `Tu registro ha sido exitoso. Ahora puedes acceder al sistema de gestión de CONANP.\n\n` +
      `Rol: ${
        usuario.rol === "conanp"
          ? "Administrador CONANP"
          : "Prestador de Servicios"
      }\n\n` +
      `Si tienes alguna duda, no dudes en contactarnos.\n\n` +
      `¡Bienvenido al equipo! 🚤`;

    return this.enviarMensaje(
      usuario.telefono,
      mensaje,
      TipoNotificacion.BIENVENIDA
    );
  }

  /**
   * Envía notificaciones masivas a múltiples usuarios
   * @param telefonos - Array de números telefónicos
   * @param mensaje - Mensaje a enviar
   * @param tipo - Tipo de notificación
   */
  public async enviarMasivo(
    telefonos: string[],
    mensaje: string,
    tipo: TipoNotificacion = TipoNotificacion.RECORDATORIO_GENERICO
  ): Promise<NotificacionMasivaResponse> {
    logger.info(
      { total: telefonos.length, tipo },
      "📤 Iniciando envío masivo de mensajes"
    );

    const resultados: NotificacionResponse[] = [];

    // Enviar mensajes en secuencia (para evitar rate limiting de Twilio)
    for (const telefono of telefonos) {
      const resultado = await this.enviarMensaje(telefono, mensaje, tipo);
      resultados.push(resultado);

      // Pequeña pausa entre mensajes (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const enviados = resultados.filter((r) => r.success).length;
    const fallidos = resultados.filter((r) => !r.success).length;

    logger.info(
      { total: telefonos.length, enviados, fallidos },
      "✅ Envío masivo completado"
    );

    return {
      total: telefonos.length,
      enviados,
      fallidos,
      resultados,
    };
  }

  /**
   * Obtiene las plantillas de mensajes disponibles
   * @returns Array de plantillas disponibles
   */
  public obtenerPlantillas(): PlantillaNotificacion[] {
    return [
      {
        tipo: TipoNotificacion.ALERTA_CLIMA,
        titulo: "Alerta Meteorológica",
        plantilla:
          "🌊 *ALERTA METEOROLÓGICA*\nEstado: {estado}\nOleaje: {oleaje}m\nViento: {viento} km/h",
        variables: ["estado", "oleaje", "viento"],
        ejemplo:
          "🌊 *ALERTA METEOROLÓGICA*\nEstado: CERRADO\nOleaje: 2.5m\nViento: 45 km/h",
      },
      {
        tipo: TipoNotificacion.PERMISO_POR_VENCER,
        titulo: "Permiso por Vencer",
        plantilla:
          "⚠️ *PERMISO POR VENCER*\nHola {nombre},\nTu permiso vence en {dias} días.\nFecha: {fecha}",
        variables: ["nombre", "dias", "fecha"],
        ejemplo:
          "⚠️ *PERMISO POR VENCER*\nHola Juan Pérez,\nTu permiso vence en 15 días.\nFecha: 2025-10-28",
      },
      {
        tipo: TipoNotificacion.CONFIRMACION_SALIDA,
        titulo: "Confirmación de Salida",
        plantilla:
          "✅ *SALIDA REGISTRADA*\nDestino: {destino}\nFecha: {fecha}\nPasajeros: {pasajeros}",
        variables: ["destino", "fecha", "pasajeros"],
        ejemplo:
          "✅ *SALIDA REGISTRADA*\nDestino: Isla de Lobos\nFecha: 2025-10-13\nPasajeros: 12",
      },
    ];
  }

  /**
   * Verifica el estado de un mensaje enviado
   * @param messageSid - ID del mensaje de Twilio
   */
  public async verificarEstadoMensaje(
    messageSid: string
  ): Promise<{ estado: string; fecha_actualizacion?: Date; error?: string }> {
    if (!this.isReady()) {
      return {
        estado: "error",
        error: "Servicio no configurado",
      };
    }

    try {
      const message = await this.client!.messages(messageSid).fetch();

      return {
        estado: message.status,
        fecha_actualizacion: message.dateUpdated || undefined,
      };
    } catch (error) {
      logger.error({ error, messageSid }, "Error al verificar estado");
      return {
        estado: "error",
        error:
          error instanceof Error ? error.message : "Error al verificar estado",
      };
    }
  }
}

// Exportar instancia única del servicio (Singleton)
export default new WhatsAppService();
