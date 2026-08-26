import { EstadoBrazalete, EstadoLote, TipoBrazalete, UserRole, VentaBrazalete } from '.';
import { Brazalete, LoteBrazalete } from '../models';

export interface BrazaleteActor {
  id: string;
  rol: UserRole;
}

export interface InventarioResponse {
  total_disponibles: number;
  por_tipo: {
    universal: number;
  };
  stock_bajo: boolean;
  lotes_activos: number;
  valor_inventario: number;
}

export interface CrearLoteDTO {
  numero_lote: string;
  cantidad_total?: number | undefined;
  primer_numero?: number | undefined;
  ultimo_numero?: number | undefined;
  tipo?: TipoBrazalete | undefined;
  fecha_compra: string;
  fecha_vencimiento?: string | undefined;
  costo_unitario: number;
  precio_venta: number;
  proveedor?: string | undefined;
  observaciones?: string | undefined;
}

export interface CrearLoteResponse {
  lote: LoteBrazalete;
  brazaletes_generados: number;
  rango_numeros: {
    primer_numero: number;
    ultimo_numero: number;
    año: number;
  };
}

export interface ListarLotesQuery {
  tipo?: TipoBrazalete | undefined;
  estado?: EstadoLote | undefined;
  page: number;
  limit: number;
}

export interface ListarLotesResponse {
  lotes: LoteBrazalete[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface VenderBrazaletesDTO {
  prestador_id: string;
  cantidad: number;
  tipo?: TipoBrazalete | undefined;
  metodo_pago?: string | undefined;
  primer_numero?: number | undefined;
  ultimo_numero?: number | undefined;
  año?: number | undefined;
  lote_id?: string | undefined;
}

export interface VenderBrazaletesResponse {
  venta: VentaBrazalete;
  modo_venta: 'rango_especifico' | 'cantidad_total' | 'automatico_fifo';
  rango_brazaletes: {
    numero_inicial?: number | undefined;
    numero_final?: number | undefined;
    año?: number | undefined;
    cantidad_total?: number | undefined;
    primer_codigo?: string | undefined;
    ultimo_codigo?: string | undefined;
  };
  brazaletes_asignados?: string[] | undefined;
  prestador: {
    id?: string | undefined;
    nombre?: string | undefined;
    email?: string | undefined;
  };
  lote: {
    numero_lote?: string | undefined;
    tipo?: TipoBrazalete | undefined;
  };
}

export interface ObtenerBrazaletesPrestadorResponse {
  prestador: {
    id?: string | undefined;
    nombre?: string | undefined;
    email?: string | undefined;
  };
  brazaletes: {
    disponibles: number;
    asignados: number;
    utilizados: number;
    por_tipo: {
      universal: number;
    };
  };
  detalle: Brazalete[];
}

export interface BuscarBrazaletesQueries {
  codigo?: string | undefined;
  tipo?: TipoBrazalete | undefined;
  estado?: EstadoBrazalete | undefined;
  prestador_id?: string | undefined;
  lote_id?: string | undefined;
  salida_id?: string | undefined;
  fecha_inicio?: string | undefined;
  fecha_fin?: string | undefined;
  turista_nacionalidad?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface BuscarBrazaletesResponse {
  brazaletes: Brazalete[];
  estadisticas: {
    total_encontrados?: number | undefined;
    por_estado: {
      disponible?: number | undefined;
      asignado?: number | undefined;
      utilizado?: number | undefined;
      perdido?: number | undefined;
    };
    por_nacionalidad: {
      local?: number | undefined;
      nacional?: number | undefined;
      internacional?: number | undefined;
    };
  };
  pagination: {
    page?: number | undefined;
    limit?: number | undefined;
    total?: number | undefined;
    total_pages?: number | undefined;
    has_next?: boolean | undefined;
    has_prev?: boolean | undefined;
  };
  filtros_aplicados: {
    codigo?: string | null;
    tipo?: TipoBrazalete | null;
    estado?: EstadoBrazalete | null;
    prestador_id?: string | null;
    lote_id?: string | null;
    salida_id?: string | null;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    turista_nacionalidad?: string | null;
  };
}

export interface AsignarBrazaletesDTO {
  salida_id: string;
  cantidad: number;
  fecha_asignacion: string;
}

export interface BrazaleteAsignadoItem {
  id: string;
  codigo: string;
  tipo: TipoBrazalete;
  estado: EstadoBrazalete;
  fecha_asignacion: string;
  salida_id: string;
}

export interface AsignarBrazaletesResponse {
  salida_id: string;
  cantidad_asignada: number;
  fecha_asignacion: string;
  brazaletes: BrazaleteAsignadoItem[];
}

export interface UsarBrazaleteItem {
  codigo: string;
  turista_nacionalidad?: string | undefined;
  turista_edad?: number | undefined;
  fecha_uso?: string | undefined;
}

export interface UsarBrazaletesDTO {
  salida_id: string;
  brazaletes: UsarBrazaleteItem[];
}

export interface RegistarUsoBrazaleteResponse {
  brazaletes_utilizados: number;
  errores: string[];
}

export interface ObtenerBrazaletesSalidaResponse {
  salida: {
    id?: string | undefined;
    fecha?: string | undefined;
    numero_pasajeros: number;
  };
  brazaletes_utilizados: Brazalete[];
  estadisticas: {
    total_brazaletes: number;
    por_nacionalidad: {
      locales: number;
      nacionales: number;
      internacionales: number;
    };
  };
}

export interface BrazaleteActualizadoItem {
  id: string;
  codigo: string;
  tipo: TipoBrazalete;
  estado_anterior: EstadoBrazalete;
  estado_actual: EstadoBrazalete;
  fecha_uso: string;
  lote_id: string;
  prestador_id: string | null;
}

export interface ActualizarUsoErrorItem {
  codigo: string;
  error: string;
}

export interface ActualizarUsoDTO {
  salida_id: string;
  fecha_uso: string;
  motivo?: string | undefined;
}

export interface ActualizarUsoBrazaletesResponse {
  salida: {
    id: string;
    fecha: string;
    numero_pasajeros: number;
    prestador: {
      id: string;
    };
  };
  fecha_uso: string;
  brazaletes_actualizados: BrazaleteActualizadoItem[];
  resumen: {
    total_encontrados: number;
    total_actualizados: number;
    total_errores: number;
    lotes_afectados: number;
  };
  errores?: ActualizarUsoErrorItem[] | undefined;
  motivo: string | null;
}
