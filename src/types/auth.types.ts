import { UserRole } from "."

export enum EstadoPermiso {
  VIGENTE = "vigente",
  POR_VENCER = "por_vencer",
  VENCIDO = "vencido",
  SUSPENDIDO = "suspendido",
  PENDIENTE = "pendiente", // Permiso sin fecha de vencimiento asignada
}

// Atributos requeridos para crear un usuario
export interface UserBase {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  avatar_url?: string;
  rol: UserRole;
  activo: boolean;
  // Campos de vigencia de permisos
  fechaVencimientoPermiso?: string;
  estadoPermiso: EstadoPermiso;
  diasNotificacion: number;
  ultimaNotificacion?: string;
  motivoSuspension?: string;
  // Campos de recuperación de contraseña
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

export interface UserAccesTokenDTO {
  id: string
  email: string
  rol: UserRole
  nombre: string
}

export interface UserResponse extends Omit<UserBase, 'fechaVencimientoPermiso' | 'ultimaNotificacion' > {
  fechaVencimientoPermiso?: string | undefined 
  ultimaNotificacion?: string | undefined 
}

export interface AuthServiceResponse {
  status: "success" | "error"
  message: string
  data?: {
    user?: UserResponse;
    accessToken?: string;
    refreshToken?: string
  }
}

export type RegisterUserDTO =  Omit<UserBase, "fechaVencimientoPermiso" | "ultimaNotificacion" | 'estadoPermiso' | 'diasNotificacion' | 'motivoSuspension' | 'passwordResetToken' | 'passwordResetExpires'> 
