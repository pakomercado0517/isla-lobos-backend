import { DestinoType, EstadoSalida } from '.';

export const ALIAS_EN_PROGRESO = 'en_progreso';

export type EstadoSalidaFiltro = EstadoSalida | typeof ALIAS_EN_PROGRESO;

export interface PrestadorSalidaDTO {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface EmbarcacionSalidaDTO {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  tipo: string;
}

export interface BloqueSalidaDTO {
  id: string;
  nombre: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  capacidad_total: number;
  destino: string | null;
  fecha: string | null;
  es_plantilla: boolean;
  plantilla_id: string | null;
}

export interface SalidaDTO {
  id: string;
  prestador_id: string;
  embarcacion_id: string;
  destino: DestinoType | string;
  bloque_id?: string | null;
  hora?: string | null;
  fecha: string;
  numero_pasajeros: number;
  observaciones?: string | null;
  estado: EstadoSalida;
  motivo_cancelacion?: string | null;
  created_at?: Date;
  updated_at?: Date;
  prestador?: PrestadorSalidaDTO;
  embarcacion?: EmbarcacionSalidaDTO;
  bloque?: BloqueSalidaDTO | null;
}

export interface GetSalidasQuery {
  page?: number;
  limit?: number;
  fecha?: string;
  estado?: EstadoSalidaFiltro;
  prestador_id?: string;
  embarcacion_id?: string;
  bloque_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface CreateSalidaDTO {
  destino: DestinoType;
  embarcacion_id: string;
  fecha: string;
  numero_pasajeros: number;
  bloque_id?: string | null;
  hora?: string;
  observaciones?: string;
}

export interface UpdateSalidaDTO {
  destino?: DestinoType;
  embarcacion_id?: string;
  bloque_id?: string | null;
  hora?: string;
  fecha?: string;
  numero_pasajeros?: number;
  observaciones?: string;
  estado?: EstadoSalidaFiltro;
}

export interface CancelarSalidaDTO {
  motivo_cancelacion?: string;
}

export interface EstadisticasSalidasListadoDTO {
  total: number;
  programadas: number;
  en_progreso: number;
  completadas: number;
  canceladas: number;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetSalidasResponse {
  salidas: SalidaDTO[];
  estadisticas: EstadisticasSalidasListadoDTO;
  pagination: PaginationDTO;
}

export interface GetSalidaByIdResponse {
  salida: SalidaDTO;
}

export interface GetSalidaStatsQuery {
  prestador_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface GetSalidaStatsResponse {
  estadisticas: {
    total_salidas: number;
    por_estado: {
      programada: number;
      en_progreso: number;
      completada: number;
      cancelada: number;
    };
    total_pasajeros: number;
  };
}

export interface SalidasPorEstadoAgregado {
  estado: EstadoSalida;
  total: string | number;
}
