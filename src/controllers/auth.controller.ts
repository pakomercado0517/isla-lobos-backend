import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { validationResult } from "express-validator";
import User from "../models/User";
import {
  ApiResponse, EmailRecuperacionPasswordData
} from "../types";
import { createLogger } from "../utils/logger";
import emailService from "../services/emailService";
import { AuthRequest } from "../middleware/auth";
import { UserBase, UserResponse } from "../types/auth.types";
import { changePasswordService, loginService, logoutService, refreshTokenService, registerService, verifyTokenService } from "../services/auth.service";
import { AppError } from "../lib/AppError";

const logger = createLogger("AuthController");

// Configuración de cookies para producción cross-domain
const isProduction = process.env["NODE_ENV"] === "production";

const COOKIE_OPTIONS = {
  httpOnly: true, // No accesible desde JavaScript (protección XSS)
  secure: isProduction, // Solo HTTPS en producción (requerido para sameSite: "none")
  sameSite: "lax" as const, // "none" para cross-domain, "lax" para desarrollo
  path: "/", // Disponible en todas las rutas del backend
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
};

const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction, // Solo HTTPS en producción (requerido para sameSite: "none")
  sameSite: "lax" as const, // "none" para cross-domain, "lax" para desarrollo
  path: "/", // Disponible en todas las rutas del backend
  maxAge: isProduction
    ? 15 * 60 * 1000 // 15 minutos en producción
    : 10 * 1000, // 10 segundos en desarrollo para pruebas
};

/**
 * Controlador de autenticación para el sistema Isla Lobos
 */
class AuthController {
  /**
   * Método auxiliar: Extrae solo la parte de fecha (YYYY-MM-DD) recortando el string
   * NO usa zona horaria - simplemente recorta el string ISO
   * Ejemplo: "2025-10-10T06:00:00.000Z" -> "2025-10-10"
   */
  private static extraerSoloFecha(
    fecha: Date | string | null | undefined
  ): string  | undefined {
    if (!fecha) return  undefined;
    const fechaString = fecha instanceof Date ? fecha.toISOString() : fecha;
    const partes = fechaString.split("T");
    return partes[0] || fechaString.substring(0, 10);
  }

  /**
   * Formatea un usuario para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearUsuarioParaRespuesta(user: UserBase): UserResponse {
    return {
      ...user,
      fechaVencimientoPermiso: user.fechaVencimientoPermiso ? AuthController.extraerSoloFecha(user.fechaVencimientoPermiso) : user.fechaVencimientoPermiso,
      ultimaNotificacion: user.ultimaNotificacion ? AuthController.extraerSoloFecha(user.ultimaNotificacion) : user.ultimaNotificacion
    }
  }

  /**
   * Iniciar sesión de usuario
   * POST /api/auth/login
   */
  public async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body
      const response = await loginService(email, password)
      res.cookie("accessToken", response.data?.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS)
      res.cookie("refreshToken", response.data?.refreshToken, COOKIE_OPTIONS)
      res.status(200).json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  public async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const response = await registerService(req.body)
      // Enviar tokens en cookies httpOnly
      res.cookie("accessToken", response.data?.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
      res.cookie("refreshToken", response.data?.refreshToken, COOKIE_OPTIONS);
      res.status(201).json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Verificar token JWT
   * GET /api/auth/verify
   */
  public async verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Si llegamos aquí, el middleware de autenticación ya verificó el token
      const user = req.user;
      if(!user) throw new AppError("Token inválido", 401) //el middleware de autenticación ya verificó el token y no hay que volver a verificarlo

      const response = await verifyTokenService(user.id)
      res.status(200).json(response);
    } catch (error) {
      next(error)
    }
  }

  /**
   * Renovar token JWT usando refresh token
   * POST /api/auth/refresh
   */
  public async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Leer refresh token desde cookies (prioridad) o body (fallback)
      const refreshToken =
        req.cookies?.["refreshToken"] || req.body?.refreshToken;

      if (!refreshToken) throw new AppError("Refresh Token requerido", 401)

      const response = await refreshTokenService(refreshToken)

      // Re-establecer refresh token en cookie para asegurar persistencia
      // (mantener el mismo refresh token, no generar uno nuevo)
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
      // Enviar nuevo access token en cookie
      res.cookie("accessToken", response.data.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

      res.status(200).json(response);
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cerrar sesión (revocar refresh token)
   * POST /api/auth/logout
   */
  public async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Leer refresh token desde cookies (prioridad) o body (fallback)
      const refreshToken =
        req.cookies?.["refreshToken"] || req.body?.refreshToken;
        
      const response = await logoutService(refreshToken)

      // Limpiar cookies con las mismas opciones para asegurar que se borren correctamente
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
        path: "/",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
        path: "/",
      });


      res.status(200).json(response);
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cambiar contraseña
   * PUT /api/auth/change-password
   */
  public async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!user) throw new AppError("Usuario no autenticado", 401)

      const response = await changePasswordService(user.id, currentPassword, newPassword)
      res.status(200).json(response);
    } catch (error) {
      next(error)
    }
  }

  /**
   * Obtener perfil del usuario actual
   * GET /api/auth/profile
   */
  public async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        } as ApiResponse);
        return;
      }

      // Buscar usuario actualizado en la base de datos
      const dbUser = await User.findByPk(user.id);
      if (!dbUser) {
        res.status(404).json({
          status: "error",
          message: "Usuario no encontrado",
        } as ApiResponse);
        return;
      }

      const userFormateado = AuthController.formatearUsuarioParaRespuesta(
        dbUser.toJSON()
      );
      const response: ApiResponse<{ user: any }> = {
        status: "success",
        message: "Perfil obtenido exitosamente",
        data: {
          user: userFormateado,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error al obtener perfil"
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Solicitar recuperación de contraseña
   * POST /api/auth/forgot-password
   */
  public async forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        res.status(400).json({
          status: "error",
          message: firstError?.msg || "Error de validación",
          error: "VALIDATION_ERROR",
        } as ApiResponse);
        return;
      }

      const { email } = req.body;

      // Buscar usuario por email
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      // Por seguridad, siempre devolvemos el mismo mensaje
      // independientemente de si el usuario existe o no
      const response: ApiResponse = {
        status: "success",
        message:
          "Si el email existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña",
      };

      if (!user) {
        res.status(200).json(response);
        return;
      }

      // Verificar si el usuario está activo
      if (!user.activo) {
        res.status(200).json(response);
        return;
      }

      // Generar token de recuperación
      const resetToken = randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Guardar token en la base de datos
      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // Construir URL de reset
      const frontendUrl = process.env["FRONTEND_URL"];
      if (!frontendUrl) {
        logger.error(
          "FRONTEND_URL no está configurado en variables de entorno"
        );
        res.status(500).json({
          status: "error",
          message: "Error en la configuración del servidor",
        } as ApiResponse);
        return;
      }

      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      // Preparar datos para el email
      const emailData: EmailRecuperacionPasswordData = {
        nombre_usuario: user.nombre,
        token: resetToken,
        url_reset: resetUrl,
        expiracion_minutos: 15,
      };

      // Enviar email de recuperación
      const emailResult = await emailService.enviarRecuperacionPassword(
        user.email,
        emailData
      );

      if (!emailResult.success) {
        logger.error(
          { error: emailResult.error, email: user.email },
          "Error al enviar email de recuperación de contraseña"
        );
      } else {
        logger.info(
          { email: user.email },
          "Email de recuperación de contraseña enviado exitosamente"
        );
      }

      // Por seguridad, siempre devolvemos el mismo mensaje de éxito
      // independientemente de si el email se envió o no
      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, email: req.body.email },
        "Error en forgot password"
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Resetear contraseña con token
   * POST /api/auth/reset-password
   */
  public async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        res.status(400).json({
          status: "error",
          message: firstError?.msg || "Error de validación",
          error: "VALIDATION_ERROR",
        } as ApiResponse);
        return;
      }

      const { token, newPassword } = req.body;

      // Buscar usuario por token de recuperación
      const user = await User.findOne({
        where: { passwordResetToken: token },
      });

      if (!user) {
        res.status(400).json({
          status: "error",
          message: "Token de recuperación inválido o expirado",
        } as ApiResponse);
        return;
      }

      // Verificar si el token es válido y no ha expirado
      if (!user.isPasswordResetTokenValid()) {
        // Limpiar token expirado
        await user.clearPasswordResetToken();

        res.status(400).json({
          status: "error",
          message: "Token de recuperación inválido o expirado",
        } as ApiResponse);
        return;
      }

      // Verificar si el usuario está activo
      if (!user.activo) {
        res.status(400).json({
          status: "error",
          message: "Usuario inactivo. Contacta al administrador",
        } as ApiResponse);
        return;
      }

      // Encriptar nueva contraseña
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña y limpiar token
      await user.update({
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      const response: ApiResponse = {
        status: "success",
        message:
          "Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña",
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, token: req.body.token },
        "Error en reset password"
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }
}

export default new AuthController();
