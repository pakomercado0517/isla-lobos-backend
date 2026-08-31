import { DestinoType, EstadoBloque } from '.';

export interface BloqueDerivadoDTO {
  id: string;
  fecha: string | null;
  estado: EstadoBloque;
  capacidad_registrada: number;
}

export interface PlantillaBloqueDTO {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  destino: DestinoType;
  activa: boolean;
  created_at?: Date;
  updated_at?: Date;
  bloques_derivados?: BloqueDerivadoDTO[];
}

export interface GetPlantillasQuery {
  destino?: DestinoType;
  activa?: boolean;
}

export interface CreatePlantillaBloqueDTO {
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  destino: DestinoType;
  activa?: boolean;
}

export interface UpdatePlantillaBloqueDTO {
  nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  capacidad_total?: number;
  destino?: DestinoType;
  activa?: boolean;
}

export interface GetPlantillasResponse {
  plantillas: PlantillaBloqueDTO[];
}

export interface GetPlantillaByIdResponse {
  plantilla: PlantillaBloqueDTO;
}

export interface UpdatePlantillaResponse {
  plantilla: PlantillaBloqueDTO;
  bloques_afectados: number;
}

export interface EstadisticaPorEstadoDTO {
  estado: EstadoBloque;
  cantidad: number;
  capacidad_ocupada: number;
}

export interface GetEstadisticasPlantillaResponse {
  plantilla: PlantillaBloqueDTO;
  total_bloques_derivados: number;
  estadisticas_por_estado: EstadisticaPorEstadoDTO[];
}

export interface EstadisticaPorEstadoAgregado {
  estado: EstadoBloque;
  cantidad: string | number;
  capacidad_ocupada: string | number | null;
}
