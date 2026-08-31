import {
  EstadoPuerto,
  NotificacionResponse,
  PlantillaNotificacion,
  PrioridadNotificacion,
  TemplateVariables,
  TipoNotificacion,
} from '.';

export interface EnviarNotificacionBody {
  telefono: string;
  mensaje?: string;
  tipo?: TipoNotificacion;
  prioridad?: PrioridadNotificacion;
  template?: string;
  contentSid?: string;
  variables?: TemplateVariables;
  idioma?: string;
}

export interface EnviarNotificacionMasivaBody {
  usuarios_ids: string[];
  mensaje: string;
  tipo?: TipoNotificacion;
}

export interface EnviarAlertaClimaWhatsappBody {
  estado_puerto: EstadoPuerto;
  oleaje: number;
  viento_velocidad: number;
  mensaje_adicional?: string;
}

export interface EnviarAlertaPermisosWhatsappBody {
  dias_anticipacion?: number;
}

export interface EnviarPruebaWhatsappBody {
  telefono: string;
}

export interface GetEstadoWhatsappResponse {
  configurado: boolean;
  proveedor: string;
}

export interface EnviarNotificacionResponse {
  notificacion: NotificacionResponse;
}

export interface NotificacionResumenDTO {
  total: number;
  enviados: number;
  fallidos: number;
}

export interface EnviarMasivoWhatsappResponse {
  resumen: NotificacionResumenDTO;
  resultados?: NotificacionResponse[];
}

export interface GetPlantillasWhatsappResponse {
  plantillas: PlantillaNotificacion[];
  total: number;
}

export interface GetEstadoMensajeResponse {
  message_sid: string;
  estado: string;
  fecha_actualizacion?: Date;
}
