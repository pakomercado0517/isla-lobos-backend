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
import { AppError } from '../lib/AppError';
import { asyncHandler } from '../middleware/error.middleware';

// Configuración de cookies para producción cross-domain
const isProduction = process.env['NODE_ENV'] === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true, // No accesible desde JavaScript (protección XSS)
  secure: isProduction, // Solo HTTPS en producción (requerido para sameSite: "none")
  sameSite: 'lax' as const, // "none" para cross-domain, "lax" para desarrollo
  path: '/', // Disponible en todas las rutas del backend
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
};

const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction, // Solo HTTPS en producción (requerido para sameSite: "none")
  sameSite: 'lax' as const, // "none" para cross-domain, "lax" para desarrollo
  path: '/', // Disponible en todas las rutas del backend
  maxAge: isProduction
    ? 15 * 60 * 1000 // 15 minutos en producción
    : 10 * 1000, // 10 segundos en desarrollo para pruebas
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
    if (!email || !password || !nombre || !telefono || !avatar_url || !codigo_invitacion)
      throw new AppError('Faltan datos', 400);
    const userData = {
      email,
      password,
      nombre,
      telefono,
      avatar_url,
      codigo_invitacion,
    };
    const response = await registerService(userData);
    // Enviar tokens en cookies httpOnly
    res.cookie('accessToken', response.data?.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refreshToken', response.data?.refreshToken, COOKIE_OPTIONS);
    res.status(201).json(response);
  });

  /**
   * Verificar token JWT
   * GET /api/auth/verify
   */
  public verifyToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Si llegamos aquí, el middleware de autenticación ya verificó el token
    const user = req.user;
    const response = await verifyTokenService(user!.id);
    res.status(200).json(response);
  });

  /**
   * Renovar token JWT usando refresh token
   * POST /api/auth/refresh
   */
  public refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Leer refresh token desde cookies (prioridad) o body (fallback)
    const refreshToken = req.cookies?.['refreshToken'] || req.body?.refreshToken;

    const response = await refreshTokenService(refreshToken);

    // Re-establecer refresh token en cookie para asegurar persistencia
    // (mantener el mismo refresh token, no generar uno nuevo)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    // Enviar nuevo access token en cookie
    res.cookie('accessToken', response.data.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    res.status(200).json(response);
  });

  /**
   * Cerrar sesión (revocar refresh token)
   * POST /api/auth/logout
   */
  public logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Leer refresh token desde cookies (prioridad) o body (fallback)
    const refreshToken = req.cookies?.['refreshToken'] || req.body?.refreshToken;

    const response = await logoutService((refreshToken as string | undefined) ?? '');

    // Limpiar cookies con las mismas opciones para asegurar que se borren correctamente
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none' as const,
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none' as const,
      path: '/',
    });

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
    const user = req.user;

    if (!user) throw new AppError('Usuario no autenticado', 401);

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
