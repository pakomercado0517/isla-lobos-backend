import { UserRole } from '.';

export interface CreadorInvitacionDTO {
  id: string;
  nombre: string;
  email: string;
}

export interface InvitacionDTO {
  id: string;
  codigo: string;
  email: string | null;
  rol: UserRole;
  expira_en: string | null | undefined;
  usada: boolean;
  creada_por: string;
  created_at?: Date;
  updated_at?: Date;
  creador?: CreadorInvitacionDTO;
}

export interface InvitacionPublicaDTO {
  id: string;
  codigo: string;
  email: string | null;
  rol: UserRole;
  creada_por: string;
  expira_en: string | null | undefined;
  usada: boolean;
  creador?: CreadorInvitacionDTO;
}

export interface GetInvitacionesQuery {
  page?: number;
  limit?: number;
  usada?: boolean;
  creada_por?: string;
}

export interface CreateInvitacionDTO {
  codigo: string;
  email?: string;
  nombre?: string;
  rol?: UserRole;
  fecha_expiracion?: string;
}

export interface UpdateInvitacionDTO {
  fecha_expiracion?: string;
}

export interface UsarInvitacionDTO {
  email?: string;
}

export interface PaginationInvitacionesDTO {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GetInvitacionesResponse {
  invitaciones: InvitacionDTO[];
  pagination: PaginationInvitacionesDTO;
}

export interface GetInvitacionByIdResponse {
  invitacion: InvitacionDTO;
}

export interface CreateInvitacionResponse {
  invitacion: InvitacionDTO;
  email_enviado: boolean;
}

export interface ValidarCodigoResponse {
  valida: true;
  invitacion: InvitacionPublicaDTO;
}

export interface TopCreadorInvitacionDTO {
  creador: CreadorInvitacionDTO | undefined;
  total_creadas: number;
}

export interface EstadisticasInvitacionesDTO {
  generales: {
    total: number;
    usadas: number;
    disponibles: number;
    expiradas: number;
    porcentaje_usadas: number;
  };
  este_mes: {
    creadas: number;
    usadas: number;
  };
  top_creadores: TopCreadorInvitacionDTO[];
}

export interface GetEstadisticasInvitacionesResponse {
  estadisticas: EstadisticasInvitacionesDTO;
}

export interface InvitacionesPorUsoAgregado {
  usada: boolean;
  total: string | number;
}
