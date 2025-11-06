// Tipos para el sistema de gestión de Isla Lobos

export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  avatar_url?: string;
  rol: UserRole;
  activo: boolean;
  // Campos de vigencia de permisos
  fechaVencimientoPermiso?: string; // YYYY-MM-DD
  estadoPermiso: EstadoPermiso;
  diasNotificacion: number;
  ultimaNotificacion?: string; // YYYY-MM-DD
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
  PENDIENTE_AUTORIZACION = "pendiente_autorizacion",
}

export interface Bloque {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  capacidad_registrada: number;
  estado: EstadoBloque;
  destino: DestinoType;
  es_plantilla: boolean; // true = plantilla para todos los días, false = bloque específico
  fecha?: string; // null si es_plantilla = true, obligatorio si es_plantilla = false (YYYY-MM-DD)
  created_at: Date;
  updated_at: Date;
}

export enum EstadoBloque {
  ACTIVO = "activo",
  INACTIVO = "inactivo",
  SUSPENDIDO_POR_CLIMA = "suspendido_por_clima",
  CERRADO_CAPITANIA = "cerrado_capitaria",
  LLENO = "lleno",
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
  bloque_id?: string; // Opcional - solo cuando el destino tiene bloques configurados
  hora?: string; // Opcional - solo cuando el destino NO tiene bloques configurados
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
  expira_en: string; // YYYY-MM-DD
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
  avatar_url?: string;
  password: string;
  codigo_invitacion?: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  isRevoked: boolean;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface AuthResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
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
  fecha_compra: string; // YYYY-MM-DD
  fecha_vencimiento?: string; // YYYY-MM-DD
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
  fecha_asignacion?: string; // YYYY-MM-DD
  fecha_uso?: string; // YYYY-MM-DD
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
  fecha_venta: string; // YYYY-MM-DD
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
  fecha_asignacion: string; // YYYY-MM-DD
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

// Tipos para integración con API del SMN (Servicio Meteorológico Nacional - CONAGUA)
export interface SMNDatosBase {
  ides: string; // ID del estado
  idmun: string; // ID del municipio
  nes: string; // Nombre del estado
  nmun: string; // Nombre del municipio
  desciel: string; // Descripción del cielo
  probprec: string; // Probabilidad de precipitación (%)
  prec: string; // Precipitación (litros/m²)
  velvien: string; // Velocidad del viento (km/h)
  dirvienc: string; // Dirección del viento (Cardinal)
  dirvieng: string; // Dirección del viento (Grados)
  lat: string; // Latitud
  lon: string; // Longitud
  dh: string; // Diferencia respecto a hora UTC
}

export interface SMNDatosDiarios extends SMNDatosBase {
  dloc: string; // Día local (formato: YYYYmmddTHH)
  ndia: string; // Número de día (1-3)
  tmax: string; // Temperatura máxima (°C)
  tmin: string; // Temperatura mínima (°C)
  cc: string; // Cobertura de nubes (%)
}

export interface SMNDatosHorarios extends SMNDatosBase {
  hloc: string; // Hora local (formato: YYYYmmddTHH) - IMPORTANTE: es "hloc" no "dloc"
  nhor: string; // Número de hora (0-48)
  dsem: string; // Día de la semana
  temp: string; // Temperatura superficie (°C)
  hr: string; // Humedad relativa (%)
  dpt: string; // Temperatura punto de rocío (°C)
  raf: string; // Ráfagas de viento (km/h)
}

// Tipos para respuestas de sincronización con SMN
export interface SMNSincronizacionResponse {
  total_procesados: number;
  condiciones_creadas: number;
  condiciones_actualizadas: number;
  condiciones: CondicionMeteorologica[];
  errores?: string[];
}

// Configuración de regiones para filtrado de datos SMN
export interface SMNConfiguracionRegion {
  estado_id: string; // ID del estado (ej: "23" para Quintana Roo)
  municipio_id?: string; // ID del municipio (opcional)
  nombre_region: string; // Nombre descriptivo
}

// ============================================================================
// TIPOS PARA SISTEMA DE NOTIFICACIONES POR WHATSAPP (TWILIO)
// ============================================================================

// Tipos de notificaciones disponibles en el sistema
export enum TipoNotificacion {
  ALERTA_CLIMA = "alerta_clima",
  PERMISO_POR_VENCER = "permiso_por_vencer",
  PERMISO_VENCIDO = "permiso_vencido",
  CONFIRMACION_SALIDA = "confirmacion_salida",
  CANCELACION_SALIDA = "cancelacion_salida",
  STOCK_BRAZALETES_BAJO = "stock_brazaletes_bajo",
  RESUMEN_DIARIO = "resumen_diario",
  BIENVENIDA = "bienvenida",
  RECORDATORIO_GENERICO = "recordatorio_generico",
}

// Prioridad de las notificaciones
export enum PrioridadNotificacion {
  URGENTE = "urgente", // Puerto cerrado, emergencias
  ALTA = "alta", // Permisos vencidos, alertas importantes
  MEDIA = "media", // Recordatorios, confirmaciones
  BAJA = "baja", // Resúmenes, información general
}

// Estado de envío de notificación
export enum EstadoNotificacion {
  PENDIENTE = "pendiente",
  ENVIADO = "enviado",
  ENTREGADO = "entregado",
  LEIDO = "leido",
  FALLIDO = "fallido",
  REINTENTANDO = "reintentando",
}

// Request para enviar notificación individual
export interface EnviarNotificacionRequest {
  telefono: string;
  mensaje: string;
  tipo: TipoNotificacion;
  prioridad: PrioridadNotificacion;
  datos_adicionales?: Record<string, string | number | boolean>;
}

// Request para enviar notificación masiva
export interface EnviarNotificacionMasivaRequest {
  usuarios_ids: string[];
  mensaje: string;
  tipo: TipoNotificacion;
  prioridad: PrioridadNotificacion;
  plantilla?: string;
}

// Respuesta de envío de notificación
export interface NotificacionResponse {
  success: boolean;
  message_id?: string;
  telefono: string;
  estado: EstadoNotificacion;
  fecha_envio: Date;
  error?: string;
}

// Respuesta de envío masivo
export interface NotificacionMasivaResponse {
  total: number;
  enviados: number;
  fallidos: number;
  resultados: NotificacionResponse[];
}

// Template de mensaje
export interface PlantillaNotificacion {
  tipo: TipoNotificacion;
  titulo: string;
  plantilla: string;
  variables: string[];
  ejemplo: string;
}

// Configuración de Twilio
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

// Datos para notificación de alerta de clima
export interface NotificacionAlertaClimaData {
  estado_puerto: EstadoPuerto;
  oleaje: number;
  viento_velocidad: number;
  mensaje_adicional?: string;
}

// Datos para notificación de permiso
export interface NotificacionPermisoData {
  nombre_usuario: string;
  dias_restantes: number;
  fecha_vencimiento: string;
  estado_permiso: EstadoPermiso;
}

// Datos para notificación de salida
export interface NotificacionSalidaData {
  prestador_nombre: string;
  embarcacion_nombre: string;
  destino: string;
  fecha: string;
  hora?: string;
  bloque_nombre?: string;
  numero_pasajeros: number;
}

// Datos para notificación de stock
export interface NotificacionStockData {
  tipo_brazalete: TipoBrazalete;
  cantidad_disponible: number;
  cantidad_minima: number;
  porcentaje_disponible: number;
}

// Datos para resumen diario
export interface NotificacionResumenDiarioData {
  fecha: string;
  total_salidas: number;
  total_pasajeros: number;
  embarcaciones_activas: number;
  capacidad_ocupada: number;
  estado_puerto: EstadoPuerto;
}

// Historial de notificaciones (para futuras implementaciones con BD)
export interface HistorialNotificacion {
  id: string;
  usuario_id?: string;
  telefono: string;
  tipo: TipoNotificacion;
  prioridad: PrioridadNotificacion;
  mensaje: string;
  estado: EstadoNotificacion;
  message_sid?: string; // ID de Twilio
  fecha_envio: Date;
  fecha_entrega?: Date;
  fecha_lectura?: Date;
  intentos: number;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// TIPOS PARA SISTEMA DE EMAILS (NODEMAILER)
// ============================================================================

// Tipos de emails disponibles en el sistema
export enum TipoEmail {
  ALERTA_CLIMA = "alerta_clima",
  PERMISO_POR_VENCER = "permiso_por_vencer",
  PERMISO_VENCIDO = "permiso_vencido",
  CONFIRMACION_SALIDA = "confirmacion_salida",
  CANCELACION_SALIDA = "cancelacion_salida",
  STOCK_BRAZALETES_BAJO = "stock_brazaletes_bajo",
  RESUMEN_DIARIO = "resumen_diario",
  BIENVENIDA = "bienvenida",
  RECUPERACION_PASSWORD = "recuperacion_password",
  REGISTRO_EXITOSO = "registro_exitoso",
  INVITACION = "invitacion",
  NOTIFICACION_GENERAL = "notificacion_general",
  RECORDATORIO_GENERICO = "recordatorio_generico",
}

// Configuración de Nodemailer
export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Request para enviar email individual
export interface EnviarEmailRequest {
  email: string;
  asunto: string;
  mensaje: string;
  tipo: TipoEmail;
  html?: boolean;
  datos_adicionales?: Record<string, string | number | boolean>;
}

// Request para enviar email masivo
export interface EnviarEmailMasivoRequest {
  usuarios_ids: string[];
  asunto: string;
  mensaje: string;
  tipo: TipoEmail;
  html?: boolean;
}

// Respuesta de envío de email
export interface EmailResponse {
  success: boolean;
  message_id?: string;
  email: string;
  estado: EstadoNotificacion;
  fecha_envio: Date;
  error?: string;
}

// Respuesta de envío masivo de emails
export interface EmailMasivoResponse {
  total: number;
  enviados: number;
  fallidos: number;
  resultados: EmailResponse[];
}

// Template de email
export interface PlantillaEmail {
  tipo: TipoEmail;
  asunto: string;
  plantilla_html: string;
  plantilla_texto: string;
  variables: string[];
  ejemplo: string;
}

// Datos para email de alerta de clima
export interface EmailAlertaClimaData {
  estado_puerto: EstadoPuerto;
  oleaje: number;
  viento_velocidad: number;
  mensaje_adicional?: string;
  fecha: string;
}

// Datos para email de permiso
export interface EmailPermisoData {
  nombre_usuario: string;
  dias_restantes: number;
  fecha_vencimiento: string;
  estado_permiso: EstadoPermiso;
}

// Datos para email de salida
export interface EmailSalidaData {
  prestador_nombre: string;
  embarcacion_nombre: string;
  destino: string;
  fecha: string;
  hora?: string;
  bloque_nombre?: string;
  numero_pasajeros: number;
}

// Datos para email de recuperación de contraseña
export interface EmailRecuperacionPasswordData {
  nombre_usuario: string;
  token: string;
  url_reset: string;
  expiracion_minutos: number;
}

// Datos para email de bienvenida
export interface EmailBienvenidaData {
  nombre_usuario: string;
  email: string;
  rol: UserRole;
  url_plataforma: string;
}

// Datos para email de invitación
export interface EmailInvitacionData {
  nombre: string;
  email: string;
  codigo_invitacion: string;
  rol: UserRole;
  url_invitacion: string;
  expiracion_dias: number;
}

// ============================================================================
// TIPOS PARA SISTEMA DE NOTIFICACIONES DEL DASHBOARD (WEBSOCKETS + BD)
// ============================================================================

// Tipos de notificaciones del dashboard
export enum TipoNotificacionDashboard {
  NUEVA_EMBARCACION = "nueva_embarcacion",
  EMBARCACION_AUTORIZADA = "embarcacion_autorizada",
  EMBARCACION_RECHAZADA = "embarcacion_rechazada",
  PERMISO_POR_VENCER = "permiso_por_vencer",
  PERMISO_VENCIDO = "permiso_vencido",
  STOCK_BRAZALETES_BAJO = "stock_brazaletes_bajo",
  NUEVA_SALIDA_REGISTRADA = "nueva_salida_registrada",
  ALERTA_CLIMA = "alerta_clima",
  OTRO = "otro",
}

// Prioridad de notificaciones del dashboard
export enum PrioridadNotificacionDashboard {
  ALTA = "alta",
  MEDIA = "media",
  BAJA = "baja",
}

// Interfaz para notificación del dashboard
export interface NotificacionDashboard {
  id: string;
  tipo: TipoNotificacionDashboard;
  titulo: string;
  mensaje: string;
  usuario_id: string | null;
  enlace: string | null;
  leida: boolean;
  prioridad: PrioridadNotificacionDashboard;
  metadata: Record<string, string | number | boolean | null>;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Request para crear notificación
export interface CrearNotificacionDashboardRequest {
  tipo: TipoNotificacionDashboard;
  titulo: string;
  mensaje: string;
  usuario_id?: string | null;
  enlace?: string | null;
  prioridad?: PrioridadNotificacionDashboard;
  metadata?: Record<string, string | number | boolean | null>;
}

// Respuesta con notificaciones
export interface NotificacionesDashboardResponse {
  notificaciones: NotificacionDashboard[];
  total: number;
  no_leidas: number;
}

// Respuesta con contador de notificaciones
export interface ContadorNotificacionesResponse {
  total: number;
  no_leidas: number;
}
