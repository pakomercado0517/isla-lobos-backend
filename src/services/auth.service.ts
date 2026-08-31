import { AppError } from '../lib/AppError';
import { generateAccessToken, generateRefreshToken } from '../lib/authTokens';
import { User } from '../models';
import { AuthResponse, RegisterUserDTO } from '../types/auth.types';
import {
  ApiResponse,
  EmailRecuperacionPasswordData,
  RefreshTokenResponse,
  RegisterRequest,
  UserRole,
} from '../types';
import { randomBytes, randomUUID } from 'crypto';
import RefreshToken from '../models/RefreshToken';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { comparePassword, hashPassword } from '../utils/password.utils';
import { enviarRecuperacionPassword } from './email.service';
import {
  marcarInvitacionUsada,
  obtenerInvitacionValidaPorCodigo,
} from './invitacion.service';
import logger from '../utils/logger';

export const loginService = async (
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> => {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  if (!user) throw new AppError('Credenciales inválidas', 401);
  if (!user.activo) throw new AppError('Credenciales inválidas', 401);

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new AppError('Credenciales inválidas', 401);

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
  });

  const refreshToken = await generateRefreshToken(user.id);

  return {
    status: 'success',
    message: 'Inicio de sesión exitoso',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    },
  };
};

export const registerService = async (
  data: RegisterRequest
): Promise<ApiResponse<AuthResponse>> => {
  const { nombre, email, password, telefono, avatar_url, codigo_invitacion } = data;

  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existingUser) throw new AppError('El email ya está en uso', 409);

  const hashedPassword = await hashPassword(password);

  const newUser = await sequelize.transaction(async (transaction) => {
    let rol = UserRole.PRESTADOR;

    if (codigo_invitacion) {
      const invitacion = await obtenerInvitacionValidaPorCodigo(codigo_invitacion, transaction);
      rol = invitacion.rol;
      await marcarInvitacionUsada(invitacion, { transaction });
    }

    const userData: RegisterUserDTO = {
      id: randomUUID(),
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      rol,
      activo: true,
    };

    if (telefono?.trim()) userData.telefono = telefono.trim();
    if (avatar_url?.trim()) userData.avatar_url = avatar_url.trim();

    return User.create(userData, { transaction });
  });

  const accessToken = generateAccessToken({
    id: newUser.id,
    email: newUser.email,
    rol: newUser.rol,
    nombre: newUser.nombre,
  });

  const refreshToken = await generateRefreshToken(newUser.id);

  return {
    status: 'success',
    message: 'Usuario registrado exitosamente',
    data: {
      user: newUser.toJSON(),
      accessToken,
      refreshToken,
    },
  };
};

export const verifyTokenService = async (userId: string): Promise<ApiResponse> => {
  const user = await User.findByPk(userId);
  if (!user || !user.activo) throw new AppError('Usuario no encontrado o inactivo', 401);

  return {
    status: 'success',
    message: 'Token válido',
    data: {
      user: user.toJSON(),
    },
  };
};

export const refreshTokenService = async (
  refreshToken: string
): Promise<ApiResponse<RefreshTokenResponse>> => {
  const tokenDoc = await RefreshToken.findOne({
    where: {
      token: refreshToken,
      isRevoked: false,
      expiresAt: {
        [Op.gt]: new Date(),
      },
    },
    include: [{ model: User, as: 'user' }],
  });
  if (!tokenDoc || !tokenDoc.user || !tokenDoc.user.activo)
    throw new AppError('Refresh Token inválido o expirado', 401);

  const accessToken = generateAccessToken({
    id: tokenDoc.user.id,
    email: tokenDoc.user.email,
    rol: tokenDoc.user.rol,
    nombre: tokenDoc.user.nombre,
  });

  return {
    status: 'success',
    message: 'Token renovado exitosamente',
    data: {
      accessToken,
    },
  };
};

export const logoutService = async (refreshToken?: string): Promise<ApiResponse> => {
  if (refreshToken) {
    await RefreshToken.update(
      { isRevoked: true },
      {
        where: {
          token: refreshToken,
          isRevoked: false,
        },
      }
    );
  }

  return {
    status: 'success',
    message: 'Sesión cerrada exitosamente',
  };
};

export const changePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) throw new AppError('Contraseña actual incorrecta', 401);

  const hashedNewPassword = await hashPassword(newPassword);

  await user.update({ password: hashedNewPassword });

  return {
    status: 'success',
    message: 'Contraseña actualizada exitosamente',
  };
};

export const forgotPasswordService = async (email: string): Promise<ApiResponse> => {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });

  const infoResponse: ApiResponse = {
    status: 'success',
    message:
      'Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña',
  };

  if (!user || !user.activo) return infoResponse;

  const frontendUrl = process.env['FRONTEND_URL'];
  if (!frontendUrl) {
    logger.error('URL de frontend no configurada');
    return infoResponse;
  }

  const resetToken = randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpires,
  });

  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const emailData: EmailRecuperacionPasswordData = {
    nombre_usuario: user.nombre,
    token: resetToken,
    url_reset: resetUrl,
    expiracion_minutos: 15,
  };

  const emailResult = await enviarRecuperacionPassword(user.email, emailData);

  if (!emailResult.success) {
    logger.error(
      { error: emailResult.error, email: user.email },
      'Error al enviar email de recuperación de contraseña'
    );
  } else {
    logger.info({ email: user.email }, 'Email de recuperación de contraseña enviado exitosamente');
  }

  return infoResponse;
};

export const resetPasswordService = async (
  token: string,
  newPassword: string
): Promise<ApiResponse> => {
  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) throw new AppError('Token de recuperación inválido o expirado', 400);
  if (!user.activo) throw new AppError('Usuario inactivo. Contacta al administrador', 400);

  const hashedNewPassword = await hashPassword(newPassword);

  await user.update({
    password: hashedNewPassword,
    passwordResetToken: null,
    passwordResetExpires: null,
  });

  return {
    status: 'success',
    message:
      'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
  };
};

export const getProfileService = async (userId: string): Promise<ApiResponse> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  return {
    status: 'success',
    message: 'Perfil obtenido exitosamente',
    data: {
      user: user.toJSON(),
    },
  };
};
