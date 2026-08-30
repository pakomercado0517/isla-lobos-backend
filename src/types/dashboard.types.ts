import {
  EstadoBloque,
  EstadoEmbarcacion,
  EstadoPermiso,
  EstadoSalida,
  TipoEmbarcacion,
} from '.';

export interface EstadisticasDashboardDTO {
  sistema: {
    fecha_actual: Date;
    uptime: number;
    version: string;
  };
  usuarios: {
    total: number;
    activos: number;
    por_vencer: number;
    vencidos: number;
    porcentaje_activos: number;
  };
  embarcaciones: {
    total: number;
    disponibles: number;
    en_uso: number;
    mantenimiento: number;
    porcentaje_disponibles: number;
  };
  bloques: {
    total: number;
    disponibles: number;
    llenos: number;
    cerrados: number;
    porcentaje_disponibles: number;
  };
  salidas: {
    total: number;
    programadas: number;
    en_curso: number;
    completadas: number;
    canceladas: number;
    este_mes: number;
    esta_semana: number;
    porcentaje_completadas: number;
  };
  invitaciones: {
    total: number;
    usadas: number;
    disponibles: number;
    porcentaje_usadas: number;
  };
  clima: {
    condicion_actual: CondicionClimaDashboardDTO | null;
  };
}

export interface GetEstadisticasDashboardResponse {
  estadisticas: EstadisticasDashboardDTO;
}

export interface UsuariosPorEstadoAgregado {
  estadoPermiso: EstadoPermiso;
  total: string | number;
}

export interface EmbarcacionesPorEstadoAgregado {
  estado: EstadoEmbarcacion;
  total: string | number;
}

export interface BloquesPorEstadoAgregado {
  estado: EstadoBloque;
  total: string | number;
}

export interface SalidasPorEstadoAgregado {
  estado: EstadoSalida;
  total: string | number;
}

export interface InvitacionesPorUsoAgregado {
  usada: boolean;
  total: string | number;
}

export interface GetOcupacionQuery {
  dias?: number;
}

export interface OcupacionBloqueDTO {
  id: string;
  nombre?: string | undefined;
  hora_inicio?: string | undefined;
  hora_fin?: string | undefined;
  capacidad_total: number;
  capacidad_registrada: number;
  estado: EstadoBloque;
  porcentaje_ocupacion: number;
}

export interface OcupacionPorDiaDTO {
  fecha: string;
  bloques: OcupacionBloqueDTO[];
  total_capacidad: number;
  total_ocupados: number;
  porcentaje_ocupacion: number;
}

export interface EstadisticasOcupacionDTO {
  periodo_dias: number;
  fecha_inicio: string | null | undefined;
  fecha_fin: string | null | undefined;
  total_bloques: number;
  total_salidas: number;
  promedio_ocupacion: number;
  bloques_llenos: number;
  bloques_disponibles: number;
}

export interface GetOcupacionResponse {
  ocupacion_por_dia: OcupacionPorDiaDTO[];
  estadisticas: EstadisticasOcupacionDTO;
}

export interface PrestadorResumenDTO {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | undefined;
}

export interface EmbarcacionDashboardDTO {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  tipo: TipoEmbarcacion;
  estado: EstadoEmbarcacion;
  prestador_id: string;
  prestador?: PrestadorResumenDTO;
  created_at?: Date;
  updated_at?: Date;
}

export interface EmbarcacionesPorPrestadorDTO {
  prestador: PrestadorResumenDTO;
  embarcaciones: Array<
    Pick<EmbarcacionDashboardDTO, 'id' | 'nombre' | 'matricula' | 'capacidad' | 'tipo' | 'estado'>
  >;
  total: number;
  disponibles: number;
  en_uso: number;
  mantenimiento: number;
}

export interface EstadisticasEmbarcacionesDTO {
  total: number;
  disponibles: number;
  en_uso: number;
  mantenimiento: number;
  por_tipo: {
    menor: number;
    mayor: number;
  };
}

export interface GetEstadoEmbarcacionesResponse {
  embarcaciones: EmbarcacionDashboardDTO[];
  estadisticas: EstadisticasEmbarcacionesDTO;
  por_prestador: EmbarcacionesPorPrestadorDTO[];
}

export interface UsuarioPermisoDTO {
  id: string;
  nombre: string;
  email: string;
  telefono?: string | undefined;
  fechaVencimientoPermiso?: string | null;
  estadoPermiso: EstadoPermiso;
  diasNotificacion: number;
  ultimaNotificacion?: string | null;
  motivoSuspension?: string | null;
}

export interface EstadisticasPermisosDTO {
  total_prestadores: number;
  vigentes: number;
  por_vencer: number;
  vencidos: number;
  pendientes: number;
  vencen_proximos_30_dias: number;
}

export interface GetEstadoPermisosResponse {
  estadisticas: EstadisticasPermisosDTO;
  usuarios_pendientes: UsuarioPermisoDTO[];
  usuarios_por_vencer: UsuarioPermisoDTO[];
  usuarios_vencidos: UsuarioPermisoDTO[];
  usuarios_vencen_proximos_30_dias: UsuarioPermisoDTO[];
  todos_los_usuarios: UsuarioPermisoDTO[];
}

export interface GetResumenClimaQuery {
  dias?: number;
}

export interface CondicionClimaDashboardDTO {
  id?: string;
  fecha_hora: Date;
  oleaje: number;
  viento_velocidad: number;
  visibilidad: string;
  estado_puerto: string;
  viento_direccion?: string;
  prediccion_5_dias?: string;
  fuente?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AlertaClimaDashboardDTO {
  tipo: string;
  severidad: string;
  mensaje: string;
}

export interface GetResumenClimaResponse {
  condicion_actual: CondicionClimaDashboardDTO | null;
  promedios: {
    oleaje: number;
    viento: number;
  };
  estado_puerto: {
    abierto: number;
    restricciones: number;
    cerrado: number;
    emergencia: number;
  };
  alertas: AlertaClimaDashboardDTO[];
  condiciones_recientes: CondicionClimaDashboardDTO[];
  periodo_dias: number;
}

export type SeveridadAlerta = 'critica' | 'alta' | 'media' | 'baja';

export interface AlertaSistemaDTO {
  tipo: string;
  severidad: SeveridadAlerta;
  mensaje: string;
  accion: string;
}

export interface EstadisticasAlertasDTO {
  total: number;
  criticas: number;
  altas: number;
  medias: number;
  bajas: number;
}

export interface GetAlertasSistemaResponse {
  alertas: AlertaSistemaDTO[];
  estadisticas: EstadisticasAlertasDTO;
  fecha_consulta: Date;
}
