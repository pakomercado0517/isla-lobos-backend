// Tipos para el sistema de gestión de Isla Lobos

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  activo: boolean;
  // Campos de vigencia de permisos
  fechaVencimientoPermiso?: Date;
  estadoPermiso: EstadoPermiso;
  diasNotificacion: number;
  ultimaNotificacion?: Date;
  motivoSuspension?: string;
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  CONANP = "conanp",
  PRESTADOR = "prestador",
}

export enum EstadoPermiso {
  VIGENTE = "vigente",
  POR_VENCER = "por_vencer",
  VENCIDO = "vencido",
  SUSPENDIDO = "suspendido",
}

export interface Embarcacion {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  tipo: TipoEmbarcacion;
  estado: EstadoEmbarcacion;
  prestador_id: string;
  created_at: Date;
  updated_at: Date;
}

export enum TipoEmbarcacion {
  MENOR = "menor",
  MAYOR = "mayor",
}

export enum EstadoEmbarcacion {
  DISPONIBLE = "disponible",
  EN_USO = "en_uso",
  MANTENIMIENTO = "mantenimiento",
}

export interface Bloque {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  capacidad_registrada: number;
  estado: EstadoBloque;
  fecha: Date;
  created_at: Date;
  updated_at: Date;
}

export enum EstadoBloque {
  ACTIVO = "activo",
  INACTIVO = "inactivo",
  SUSPENDIDO_POR_CLIMA = "suspendido_por_clima",
  CERRADO_CAPITANIA = "cerrado_capitaria",
  LLENO = "lleno",
  PLANTILLA = "plantilla", // Para bloques predefinidos
}

// Destinos disponibles
export const DESTINOS = {
  ISLA_LOBOS: "Isla de Lobos",
  ARRECIFE_TUXPAN: "Arrecife Tuxpan",
  ARRECIFE_EN_MEDIO: "Arrecife de en Medio",
  ARRECIFE_TANHUIJO: "Arrecife Tanhuijo",
} as const;

export type DestinoType = (typeof DESTINOS)[keyof typeof DESTINOS];

export interface Salida {
  id: string;
  prestador_id: string;
  embarcacion_id: string;
  destino: string;
  bloque_id?: string; // Opcional - solo para Isla de Lobos
  hora?: string; // Opcional - solo para otros destinos
  fecha: Date;
  numero_pasajeros: number;
  observaciones?: string;
  estado: EstadoSalida;
  motivo_cancelacion?: string;
  created_at: Date;
  updated_at: Date;
}

export enum EstadoSalida {
  PROGRAMADA = "programada",
  EN_CURSO = "en_curso",
  COMPLETADA = "completada",
  CANCELADA = "cancelada",
  CANCELADA_POR_CLIMA = "cancelada_por_clima",
  CANCELADA_CAPITARIA = "cancelada_capitaria",
}

export interface CondicionMeteorologica {
  id: string;
  fecha_hora: Date;
  oleaje: number; // altura en metros
  viento_velocidad: number; // km/h
  viento_direccion: string;
  visibilidad: string;
  estado_puerto: EstadoPuerto;
  prediccion_5_dias: string;
  fuente: string;
  created_at: Date;
  updated_at: Date;
}

export enum EstadoPuerto {
  ABIERTO = "abierto",
  RESTRICCIONES = "restricciones",
  CERRADO = "cerrado",
  EMERGENCIA = "emergencia",
}

export interface Invitacion {
  id: string;
  codigo: string;
  email: string;
  rol: UserRole;
  expira_en: Date;
  usada: boolean;
  creada_por: string;
  created_at: Date;
  updated_at: Date;
}

// Tipos para respuestas de la API
export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  telefono?: string;
  password: string;
  codigo_invitacion?: string;
}

export interface AuthResponse {
  user: Omit<User, "password">;
  token: string;
}

// Tipos para dashboard
export interface DashboardStats {
  bloques_hoy: number;
  capacidad_total: number;
  capacidad_ocupada: number;
  embarcaciones_activas: number;
  salidas_programadas: number;
  estado_puerto: EstadoPuerto;
  condiciones_clima: {
    oleaje: number;
    viento: number;
    visibilidad: string;
  };
}

// Tipos para reportes
export interface ReporteRequest {
  fecha_inicio: Date;
  fecha_fin: Date;
  tipo: "salidas" | "capacidad" | "embarcaciones" | "clima";
  formato: "pdf" | "excel";
}

// Tipos para LoteBrazalete
export interface LoteBrazalete {
  id: string;
  numero_lote: string;
  cantidad_total: number;
  cantidad_disponibles: number;
  cantidad_vendidos: number;
  cantidad_utilizados: number;
  tipo: TipoBrazalete;
  fecha_compra: Date;
  fecha_vencimiento?: Date;
  costo_unitario: number;
  precio_venta: number;
  proveedor?: string;
  estado: EstadoLote;
  observaciones?: string;
  created_at: Date;
  updated_at: Date;
}

export enum TipoBrazalete {
  UNIVERSAL = "universal",
}

export enum EstadoLote {
  ACTIVO = "activo",
  AGOTADO = "agotado",
  VENCIDO = "vencido",
  CANCELADO = "cancelado",
}

// Tipos para Brazalete
export interface Brazalete {
  id: string;
  codigo: string;
  tipo: TipoBrazalete;
  estado: EstadoBrazalete;
  precio: number;
  fecha_creacion: Date;
  fecha_asignacion?: Date;
  fecha_uso?: Date;
  prestador_id?: string;
  salida_id?: string;
  turista_nacionalidad?: string;
  turista_edad?: number;
  lote_id: string;
  created_at: Date;
  updated_at: Date;
}

export enum EstadoBrazalete {
  DISPONIBLE = "disponible",
  ASIGNADO = "asignado",
  UTILIZADO = "utilizado",
  PERDIDO = "perdido",
}

// Tipos para VentaBrazalete
export interface VentaBrazalete {
  id: string;
  prestador_id: string;
  lote_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha_venta: Date;
  metodo_pago?: string;
  estado_pago: EstadoPago;
  observaciones?: string;
  created_at: Date;
}

export enum EstadoPago {
  PENDIENTE = "pendiente",
  PAGADO = "pagado",
  CANCELADO = "cancelado",
}

// Tipos para requests de brazaletes
export interface CrearLoteRequest {
  numero_lote: string;
  cantidad_total?: number;
  primer_numero?: number;
  ultimo_numero?: number;
  tipo?: TipoBrazalete;
  fecha_compra: Date;
  fecha_vencimiento?: Date;
  costo_unitario: number;
  precio_venta: number;
  proveedor?: string;
  observaciones?: string;
}

export interface VenderBrazaletesRequest {
  prestador_id: string;
  cantidad: number;
  tipo?: TipoBrazalete;
  metodo_pago?: string;
}

export interface UsarBrazaleteRequest {
  salida_id: string;
  brazaletes: {
    codigo: string;
    turista_nacionalidad?: string;
    turista_edad?: number;
  }[];
}

export interface AsignarBrazaletesRequest {
  salida_id: string;
  cantidad: number;
  fecha_asignacion: Date;
}

// Tipos para estadísticas de brazaletes
export interface EstadisticasBrazaletes {
  inventario: {
    total_disponibles: number;
    por_tipo: {
      isla: number;
      arrecife: number;
    };
    stock_bajo: boolean;
    lotes_activos: number;
    valor_inventario: number;
  };
  ventas: {
    total_vendidos: number;
    ingresos_totales: number;
    por_mes: {
      mes: string;
      cantidad: number;
      monto: number;
    }[];
  };
  utilizacion: {
    total_utilizados: number;
    por_tipo: {
      isla: number;
      arrecife: number;
    };
    por_nacionalidad: {
      locales: number;
      nacionales: number;
      internacionales: number;
    };
  };
  alertas: {
    tipo: string;
    severidad: "alta" | "media" | "baja";
    mensaje: string;
    fecha: Date;
  }[];
}
