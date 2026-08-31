import { EstadoSalida } from '.';

export type EstadoPuertoPublicoValue =
  | 'abierto'
  | 'restricciones'
  | 'cerrado'
  | 'emergencia'
  | 'desconocido';

export type ColorPuertoPublico = 'green' | 'yellow' | 'red' | 'gray';

export type CondicionGeneralValue = 'adversas' | 'moderadas' | 'aceptables' | 'favorables';

export interface EstadoPuertoPublicoDTO {
  estado: EstadoPuertoPublicoValue;
  texto: string;
  color: ColorPuertoPublico;
  operativo: boolean;
}

export interface ClimaPublicoDTO {
  oleaje: number;
  viento: number;
  condicion_general: CondicionGeneralValue;
  ultima_actualizacion: string | null;
}

export interface GetHomepageStatsResponse {
  fecha_consulta: string;
  hora_consulta: string;
  puerto: EstadoPuertoPublicoDTO;
  embarcaciones: {
    total_registradas: number;
  };
  actividad_hoy: {
    salidas_programadas: number;
    salidas_por_estado: {
      programadas: number;
      en_curso: number;
      completadas: number;
    };
    total_pasajeros: number;
    promedio_pasajeros_por_salida: number;
  };
  clima: ClimaPublicoDTO | null;
  sistema: {
    operativo: boolean;
    version: string;
    ultima_actualizacion: string;
  };
}

export interface PuertoStatusDTO {
  estado: EstadoPuertoPublicoValue;
  operativo: boolean;
  color: ColorPuertoPublico;
  ultima_actualizacion: string | null;
}

export interface GetPuertoStatusResponse {
  puerto: PuertoStatusDTO;
}

export interface SalidasPorEstadoAgregado {
  estado: EstadoSalida;
  cantidad: string | number;
  pasajeros: string | number | null;
}
