import { EstadoEmbarcacion, TipoEmbarcacion } from '.';

export interface PrestadorEmbarcacionDTO {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface EmbarcacionDTO {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  tipo: TipoEmbarcacion;
  estado: EstadoEmbarcacion;
  prestador_id: string;
  prestador?: PrestadorEmbarcacionDTO;
  created_at?: Date;
  updated_at?: Date;
}

export interface GetEmbarcacionesQuery {
  page?: number;
  limit?: number;
  estado?: EstadoEmbarcacion;
  tipo?: TipoEmbarcacion;
  prestador_id?: string;
}

export interface CreateEmbarcacionDTO {
  nombre: string;
  matricula: string;
  capacidad: number;
  tipo: TipoEmbarcacion;
  estado?: EstadoEmbarcacion;
  prestador_id: string;
}

export interface UpdateEmbarcacionDTO {
  nombre?: string;
  matricula?: string;
  capacidad?: number;
  tipo?: TipoEmbarcacion;
  estado?: EstadoEmbarcacion;
  prestador_id?: string;
}

export interface EstadisticasListadoDTO {
  total: number;
  disponibles: number;
  en_uso: number;
  mantenimiento: number;
  menor: number;
  mayor: number;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetEmbarcacionesResponse {
  embarcaciones: EmbarcacionDTO[];
  estadisticas: EstadisticasListadoDTO;
  pagination: PaginationDTO;
}

export interface GetEmbarcacionByIdResponse {
  embarcacion: EmbarcacionDTO;
}

export interface EstadisticasEmbarcacionDTO {
  total_embarcaciones: number;
  por_estado: {
    disponible: number;
    en_uso: number;
    mantenimiento: number;
  };
  por_tipo: {
    menor: number;
    mayor: number;
  };
  capacidad_total: number;
}

export interface GetEmbarcacionStatsResponse {
  estadisticas: EstadisticasEmbarcacionDTO;
}

export interface EmbarcacionesPorEstadoAgregado {
  estado: EstadoEmbarcacion;
  total: string | number;
}

export interface EmbarcacionesPorTipoAgregado {
  tipo: TipoEmbarcacion;
  total: string | number;
}
