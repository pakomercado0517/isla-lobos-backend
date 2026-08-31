import { EstadoPermiso, UserRole } from '.';

export interface UserDTO {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  avatar_url?: string | null;
  rol: UserRole;
  activo: boolean;
  fechaVencimientoPermiso?: string | null;
  estadoPermiso?: EstadoPermiso;
  diasNotificacion?: number;
  ultimaNotificacion?: string | null;
  motivoSuspension?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  rol?: UserRole;
  activo?: boolean;
}

export interface CreateUserDTO {
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  telefono?: string;
  activo?: boolean;
  fechaVencimientoPermiso?: string;
  diasNotificacion?: number;
}

export interface UpdateUserDTO {
  nombre?: string;
  email?: string;
  telefono?: string;
  rol?: UserRole;
  activo?: boolean;
  fechaVencimientoPermiso?: string;
  diasNotificacion?: number;
}

export interface UpdateProfileDTO {
  nombre?: string;
  telefono?: string;
  avatar_url?: string;
}

export interface HardDeleteUserDTO {
  confirmacion: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetUsersResponse {
  users: UserDTO[];
  pagination: PaginationDTO;
}

export interface GetUserByIdResponse {
  user: UserDTO;
}

export interface DeletedUserDTO {
  id: string;
  nombre: string;
  email: string;
  eliminado_en: string;
}

export interface HardDeleteUserResponse {
  deleted_user: DeletedUserDTO;
}

export interface UserStatsDTO {
  total: number;
  activos: number;
  inactivos: number;
  conanp: number;
  prestadores: number;
}

export interface GetUserStatsResponse {
  stats: UserStatsDTO;
}

export interface UsuariosPorRolAgregado {
  rol: UserRole;
  total: string | number;
}

export interface UsuariosPorActivoAgregado {
  activo: boolean | string | number;
  total: string | number;
}
