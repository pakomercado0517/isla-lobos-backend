import { DestinoType, EstadoBloque } from '.';

export interface EmbarcacionOcupadaResponse {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  estado: string;
  salida: {
    id: string;
    estado: string;
    numero_pasajeros: number;
    destino: string;
    observaciones?: string | undefined;
  };
}

export interface BloqueResponse {
  id: string;
  nombre: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  capacidad_total: number;
  capacidad_registrada: number;
  capacidad_disponible: number;
  estado: EstadoBloque;
  destino: string | null;
  es_plantilla: boolean;
  plantilla_id: string | null;
  fecha: string | null;
  embarcaciones_ocupadas?: EmbarcacionOcupadaResponse[] | undefined;
  plantilla_datos?: {
    id: string;
    nombre: string;
    activa: boolean;
  };
  created_at?: Date | undefined;
  updated_at?: Date | undefined;
}

export interface BloquesListData {
  bloques: BloqueResponse[];
  total: number;
  fecha_consultada: string;
  destino: string;
}

export interface BloqueByIdData {
  bloque: BloqueResponse;
}

export type BloqueMutateData = BloqueByIdData;

export interface BloqueStatsData {
  estadisticas: {
    total_bloques: number;
    por_estado: {
      activo: number;
      lleno: number;
      suspendido_por_clima: number;
      cerrado_capitaria: number;
    };
    capacidad: {
      total: number;
      ocupada: number;
      disponible: number;
      porcentaje_ocupacion: number;
    };
  };
}

export interface CreateBloqueDTO {
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  destino: DestinoType;
  fecha?: string | undefined;
  estado?: EstadoBloque | undefined;
  es_plantilla?: boolean | undefined;
}

export interface UpdateBloqueDTO {
  nombre?: string | undefined;
  hora_inicio?: string | undefined;
  hora_fin?: string | undefined;
  capacidad_total?: number | undefined;
  destino?: DestinoType | undefined;
  fecha?: string | undefined;
  estado?: EstadoBloque | undefined;
  es_plantilla?: boolean | undefined;
}
