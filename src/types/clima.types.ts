export type EstadoPuertoValue = 'abierto' | 'restricciones' | 'cerrado' | 'emergencia';
export type VisibilidadValue = 'Excelente' | 'Buena' | 'Regular' | 'Mala' | 'Muy Mala';
export type VientoDireccionValue = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type FuenteClimaValue = 'CONAGUA' | 'NOAA' | 'Capitanía de Puerto' | 'Manual';

export interface CondicionMeteorologicaResponse {
  id: string;
  fecha_hora: Date;
  oleaje: number;
  viento_velocidad: number;
  viento_direccion: VientoDireccionValue;
  visibilidad: VisibilidadValue;
  estado_puerto: EstadoPuertoValue;
  prediccion_5_dias: string;
  fuente: FuenteClimaValue;
  created_at?: Date | undefined;
  updated_at?: Date | undefined;
}

export interface CreateCondicionDTO {
  fecha_hora: string;
  oleaje: number;
  viento_velocidad: number;
  viento_direccion: VientoDireccionValue;
  visibilidad: VisibilidadValue;
  estado_puerto: EstadoPuertoValue;
  prediccion_5_dias: string;
  fuente: FuenteClimaValue;
}

export interface CondicionSMNPayload {
  fecha_hora: Date;
  oleaje: number;
  viento_velocidad: number;
  viento_direccion: VientoDireccionValue;
  visibilidad: VisibilidadValue;
  estado_puerto: EstadoPuertoValue;
  prediccion_5_dias: string;
  fuente: FuenteClimaValue;
}

export type UpdateCondicionDTO = Partial<CreateCondicionDTO>;

export interface GetAllCondicionesQuery {
  page?: number | undefined;
  limit?: number | undefined;
  fecha_inicio?: string | undefined;
  fecha_fin?: string | undefined;
  estado_puerto?: EstadoPuertoValue | undefined;
  fuente?: FuenteClimaValue | undefined;
}

export interface GetPrediccionQuery {
  dias: number;
}

export interface GetEstadisticasQuery {
  fecha_inicio?: string | undefined;
  fecha_fin?: string | undefined;
}

export interface SincronizarSMNDTO {
  horas_limite: number;
  solo_isla_lobos: boolean;
}

export interface GetAllCondicionesResponse {
  condiciones: CondicionMeteorologicaResponse[];
  condicion_actual: CondicionMeteorologicaResponse | null;
  estadisticas: {
    total: number;
    abierto: number;
    restricciones: number;
    cerrado: number;
    emergencia: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetCondicionActualResponse {
  condicion: CondicionMeteorologicaResponse;
  tiempo_transcurrido_horas: number;
  necesita_actualizacion: boolean;
}

export interface CondicionMeteorologicaPrediccion {
  fecha_hora: Date;
  oleaje: number;
  viento_velocidad: number;
  visibilidad: VisibilidadValue;
  estado_puerto: EstadoPuertoValue;
}

export interface GetPrediccionDTO {
  periodo_dias: number;
  promedio_oleaje: number;
  promedio_viento: number;
  tendencia_oleaje: 'creciente' | 'decreciente' | 'estable';
  tendencia_viento: 'creciente' | 'decreciente' | 'estable';
  recomendacion: string;
  condiciones_por_dia: CondicionMeteorologicaPrediccion[];
}

export interface GetPrediccionResponse {
  prediccion: GetPrediccionDTO;
}

export interface AlertaMeteorologicaDTO {
  tipo?: string | undefined;
  severidad?: string | undefined;
  mensaje?: string | undefined;
  valor?: number | string | undefined;
  umbral?: number | string | undefined;
}

export interface GetAlertasResponse {
  alertas: AlertaMeteorologicaDTO[];
  total_alertas: number;
  alertas_altas: number;
  alertas_medias: number;
  alertas_criticas: number;
  condicion_actual: CondicionMeteorologicaPrediccion;
}

export interface GetEstadisticasDTO {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
    total_registros: number;
  };
  oleaje: {
    promedio: number;
    minimo: number;
    maximo: number;
    registros_oleaje_alto: number;
  };
  viento: {
    promedio: number;
    minimo: number;
    maximo: number;
    registros_viento_fuerte: number;
  };
  estado_puerto: {
    abierto: number;
    restricciones: number;
    cerrado: number;
    emergencia: number;
  };
  visibilidad: {
    excelente: number;
    buena: number;
    regular: number;
    baja: number;
  };
}

export interface GetEstadisticasResponse {
  estadisticas: GetEstadisticasDTO;
}

export interface SincronizarSMNResponse {
  total_procesados: number;
  condiciones_creadas: number;
  condiciones_actualizadas: number;
  condiciones: CondicionMeteorologicaResponse[];
  errores?: string[] | undefined;
}
