import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  changePasswordService,
  forgotPasswordService,
  getProfileService,
  loginService,
  logoutService,
  refreshTokenService,
  registerService,
  resetPasswordService,
  verifyTokenService,
} from '../services/auth.service';
import { asyncHandler } from '../middleware/error.middleware';
import {
  ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
} from '../lib/authTokens';

const isProduction = process.env['NODE_ENV'] === 'production';

const COOKIE_BASE = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

const COOKIE_OPTIONS = {
  ...COOKIE_BASE,
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
};

const ACCESS_TOKEN_COOKIE_OPTIONS = {
  ...COOKIE_BASE,
  maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
};

/**
 * Controlador de autenticación para el sistema Isla Lobos
 */
class AuthController {
  /*
   * Iniciar sesión de usuario
   * POST /api/auth/login
   */
  public login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const response = await loginService(email, password);
    res.cookie('accessToken', response.data?.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refreshToken', response.data?.refreshToken, COOKIE_OPTIONS);
    res.status(200).json(response);
  });

  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  public register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, nombre, telefono, avatar_url, codigo_invitacion } = req.body;
    const response = await registerService({
      email,
      password,
      nombre,
      telefono,
      avatar_url,
      codigo_invitacion,
    });
    res.cookie('accessToken', response.data?.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refreshToken', response.data?.refreshToken, COOKIE_OPTIONS);
    res.status(201).json(response);
  });

  /**
   * Verificar token JWT
   * GET /api/auth/verify
   */
  public verifyToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const response = await verifyTokenService(user.id);
    res.status(200).json(response);
  });

  /**
   * Renovar token JWT usando refresh token
   * POST /api/auth/refresh
   */
  public refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies?.['refreshToken'] || req.body?.refreshToken;
    const response = await refreshTokenService(refreshToken);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.cookie('accessToken', response.data.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    res.status(200).json(response);
  });

  /**
   * Cerrar sesión (revocar refresh token)
   * POST /api/auth/logout
   */
  public logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refreshToken = req.cookies?.['refreshToken'] || req.body?.refreshToken;
    const response = await logoutService(refreshToken);

    res.clearCookie('accessToken', COOKIE_BASE);
    res.clearCookie('refreshToken', COOKIE_BASE);

    res.status(200).json(response);
  });

  /**
   * Cambiar contraseña
   * PUT /api/auth/change-password
   */
  public changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    const response = await changePasswordService(user.id, currentPassword, newPassword);
    res.status(200).json(response);
  });

  /**
   * Obtener perfil del usuario actual
   * GET /api/auth/profile
   */
  public getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const response = await getProfileService(user.id);
    res.status(200).json(response);
  });

  /**
   * Solicitar recuperación de contraseña
   * POST /api/auth/forgot-password
   */
  public forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;
    const response = await forgotPasswordService(email);
    res.status(200).json(response);
  });

  /**
   * Resetear contraseña con token
   * POST /api/auth/reset-password
   */
  public resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, newPassword } = req.body;
    const response = await resetPasswordService(token, newPassword);
    res.status(200).json(response);
  });
}

export default new AuthController();
