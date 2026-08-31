import { PrioridadNotificacionDashboard, TipoNotificacionDashboard } from '.';

export interface NotificacionDashboardDTO {
  id: string;
  tipo: TipoNotificacionDashboard;
  titulo: string;
  mensaje: string;
  usuario_id: string | null;
  enlace: string | null;
  leida: boolean;
  prioridad: PrioridadNotificacionDashboard;
  metadata: Record<string, string | number | boolean | null>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetNotificacionesDashboardResponse {
  notificaciones: NotificacionDashboardDTO[];
  total: number;
  no_leidas: number;
}

export interface GetContadorNotificacionesResponse {
  no_leidas: number;
}
