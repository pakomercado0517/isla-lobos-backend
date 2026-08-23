import { User, UserRole } from '.';

export interface UserAccesTokenDTO {
  id: string;
  email: string;
  rol: UserRole;
  nombre: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export type RegisterUserDTO = Omit<
  User,
  | 'fechaVencimientoPermiso'
  | 'ultimaNotificacion'
  | 'estadoPermiso'
  | 'diasNotificacion'
  | 'motivoSuspension'
  | 'passwordResetToken'
  | 'passwordResetExpires'
> & {
  password: string;
};
