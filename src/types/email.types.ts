import { EmailResponse, EstadoPuerto, PlantillaEmail, TipoEmail } from '.';

export interface EnviarEmailBody {
  email: string;
  asunto: string;
  mensaje: string;
  tipo?: TipoEmail;
  html?: boolean;
}

export interface EnviarEmailMasivoBody {
  usuarios_ids: string[];
  asunto: string;
  mensaje: string;
  tipo?: TipoEmail;
  html?: boolean;
}

export interface EnviarAlertaClimaBody {
  estado_puerto: EstadoPuerto;
  oleaje: number;
  viento_velocidad: number;
  fecha: string;
  mensaje_adicional?: string;
}

export interface EnviarAlertaPermisosBody {
  dias_anticipacion?: number;
}

export interface EnviarPruebaBody {
  email: string;
}

export interface FromAddressInfoDTO {
  email: string | null;
  requiresVerification: boolean;
  note: string;
}

export interface GetEstadoEmailResponse {
  configurado: boolean;
  conectado: boolean;
  proveedor: string;
  error?: string;
  host?: string;
  fromAddress?: FromAddressInfoDTO;
}

export interface EnviarEmailResponse {
  email_info: EmailResponse;
}

export interface EmailResumenDTO {
  total: number;
  enviados: number;
  fallidos: number;
}

export interface EnviarMasivoResponse {
  resumen: EmailResumenDTO;
  resultados?: EmailResponse[];
}

export interface GetPlantillasEmailResponse {
  plantillas: PlantillaEmail[];
  total: number;
}
