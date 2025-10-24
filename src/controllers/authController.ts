import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "crypto";
import RefreshToken from "../models/RefreshToken";
import { validationResult } from "express-validator";
import User from "../models/User";
import Invitacion from "../models/Invitacion";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  UserRole,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "../types";
import { createLogger } from "../utils/logger";

// Importar jsonwebtoken usando require para evitar problemas de tipos
const jwt = require("jsonwebtoken");
const logger = createLogger("AuthController");

// Helper function para generar tokens JWT
const generateAccessToken = (payload: any): string => {
  const secret = process.env["JWT_SECRET"] || "fallback-secret";
  const expiresIn = process.env["JWT_EXPIRES_IN"] || "15m"; // Token de acceso de corta duración

  return jwt.sign(payload, secret, { expiresIn });
};

const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días de validez

  await RefreshToken.create({
    token,
    userId,
    expiresAt,
    isRevoked: false,
  });

  return token;
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
  ): string | null | undefined {
    if (!fecha) return fecha as null | undefined;
    const fechaString = fecha instanceof Date ? fecha.toISOString() : fecha;
    const partes = fechaString.split("T");
    return partes[0] || fechaString.substring(0, 10);
  }

  /**
   * Formatea un usuario para respuesta, convirtiendo fechas a YYYY-MM-DD
   */
  private static formatearUsuarioParaRespuesta(user: any): any {
    const userFormateado = { ...user };
    if (userFormateado.fechaVencimientoPermiso) {
      userFormateado.fechaVencimientoPermiso = AuthController.extraerSoloFecha(
        userFormateado.fechaVencimientoPermiso
      );
    }
    if (userFormateado.ultimaNotificacion) {
      userFormateado.ultimaNotificacion = AuthController.extraerSoloFecha(
        userFormateado.ultimaNotificacion
      );
    }
    return userFormateado;
  }

  /**
   * Iniciar sesión de usuario
   * POST /api/auth/login
   */
  public async login(req: Request, res: Response): Promise<void> {
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

      const { email, password }: LoginRequest = req.body;

      // Buscar usuario por email
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "Credenciales inválidas",
        } as ApiResponse);
        return;
      }

      // Verificar si el usuario está activo
      if (!user.activo) {
        res.status(401).json({
          status: "error",
          message: "Usuario inactivo. Contacta al administrador",
        } as ApiResponse);
        return;
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          status: "error",
          message: "Credenciales inválidas",
        } as ApiResponse);
        return;
      }

      // Generar tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
      });

      const refreshToken = await generateRefreshToken(user.id);

      // Respuesta exitosa
      const userFormateado = AuthController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );
      const response: ApiResponse<AuthResponse> = {
        status: "success",
        message: "Inicio de sesión exitoso",
        data: {
          user: userFormateado as any,
          accessToken,
          refreshToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error({ err: error, email: req.body.email }, "Error en login");
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  public async register(req: Request, res: Response): Promise<void> {
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

      const {
        nombre,
        email,
        telefono,
        avatar_url,
        password,
        codigo_invitacion,
      }: RegisterRequest = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        res.status(409).json({
          status: "error",
          message: "Ya existe un usuario con este email",
        } as ApiResponse);
        return;
      }

      // Verificar código de invitación si se proporciona
      let rol = UserRole.PRESTADOR; // Rol por defecto
      if (codigo_invitacion) {
        const invitacion = await Invitacion.findOne({
          where: { codigo: codigo_invitacion },
        });

        if (!invitacion) {
          res.status(400).json({
            status: "error",
            message: "Código de invitación inválido",
          } as ApiResponse);
          return;
        }

        if (invitacion.usada) {
          res.status(400).json({
            status: "error",
            message: "Código de invitación ya utilizado",
          } as ApiResponse);
          return;
        }

        if (invitacion.esta_expirada) {
          res.status(400).json({
            status: "error",
            message: "Código de invitación expirado",
          } as ApiResponse);
          return;
        }

        // Usar el rol de la invitación
        rol = invitacion.rol;

        // Marcar invitación como usada
        await invitacion.update({ usada: true });
      }

      // Encriptar contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const userData: any = {
        id: randomUUID(),
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        rol,
        activo: true,
      };

      if (telefono?.trim()) {
        userData.telefono = telefono.trim();
      }

      if (avatar_url?.trim()) {
        userData.avatar_url = avatar_url.trim();
      }

      const newUser = await User.create(userData);

      // Generar tokens
      const accessToken = generateAccessToken({
        id: newUser.id,
        email: newUser.email,
        rol: newUser.rol,
        nombre: newUser.nombre,
      });

      const refreshToken = await generateRefreshToken(newUser.id);

      // Respuesta exitosa
      const userFormateado = AuthController.formatearUsuarioParaRespuesta(
        newUser.toJSON()
      );
      const response: ApiResponse<AuthResponse> = {
        status: "success",
        message: "Usuario registrado exitosamente",
        data: {
          user: userFormateado as any,
          accessToken,
          refreshToken,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error({ err: error, email: req.body.email }, "Error en registro");
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Verificar token JWT
   * GET /api/auth/verify
   */
  public async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      // Si llegamos aquí, el middleware de autenticación ya verificó el token
      const user = req.user;

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "Token inválido",
        } as ApiResponse);
        return;
      }

      // Buscar usuario actualizado en la base de datos
      const dbUser = await User.findByPk(user.id);
      if (!dbUser || !dbUser.activo) {
        res.status(401).json({
          status: "error",
          message: "Usuario no encontrado o inactivo",
        } as ApiResponse);
        return;
      }

      const userFormateado = AuthController.formatearUsuarioParaRespuesta(
        dbUser.toJSON()
      );
      const response: ApiResponse<{ user: any }> = {
        status: "success",
        message: "Token válido",
        data: {
          user: userFormateado,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error({ err: error }, "Error en verificación de token");
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Renovar token JWT usando refresh token
   * POST /api/auth/refresh
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenRequest;

      if (!refreshToken) {
        res.status(400).json({
          status: "error",
          message: "Refresh token requerido",
        } as ApiResponse);
        return;
      }

      // Buscar el refresh token en la base de datos
      const tokenDoc = await RefreshToken.findOne({
        where: {
          token: refreshToken,
          isRevoked: false,
          expiresAt: {
            [Op.gt]: new Date(), // Verificar que no haya expirado
          },
        },
        include: [
          {
            model: User,
            as: "user",
          },
        ],
      });

      if (!tokenDoc || !tokenDoc.user || !tokenDoc.user.activo) {
        res.status(401).json({
          status: "error",
          message: "Refresh token inválido o expirado",
        } as ApiResponse);
        return;
      }

      // Generar nuevo access token
      const accessToken = generateAccessToken({
        id: tokenDoc.user.id,
        email: tokenDoc.user.email,
        rol: tokenDoc.user.rol,
        nombre: tokenDoc.user.nombre,
      });

      const response: ApiResponse<RefreshTokenResponse> = {
        status: "success",
        message: "Token renovado exitosamente",
        data: {
          accessToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error({ err: error }, "Error en renovación de token");
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Cerrar sesión (revocar refresh token)
   * POST /api/auth/logout
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          status: "error",
          message: "Refresh token requerido",
        } as ApiResponse);
        return;
      }

      // Revocar el refresh token
      await RefreshToken.update(
        { isRevoked: true },
        {
          where: {
            token: refreshToken,
            isRevoked: false,
          },
        }
      );

      const response: ApiResponse = {
        status: "success",
        message: "Sesión cerrada exitosamente",
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error({ err: error, userId: req.user?.id }, "Error en logout");
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Cambiar contraseña
   * PUT /api/auth/change-password
   */
  public async changePassword(req: Request, res: Response): Promise<void> {
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

      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        } as ApiResponse);
        return;
      }

      // Buscar usuario en la base de datos
      const dbUser = await User.findByPk(user.id);
      if (!dbUser) {
        res.status(404).json({
          status: "error",
          message: "Usuario no encontrado",
        } as ApiResponse);
        return;
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        dbUser.password
      );
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          status: "error",
          message: "Contraseña actual incorrecta",
        } as ApiResponse);
        return;
      }

      // Encriptar nueva contraseña
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await dbUser.update({ password: hashedNewPassword });

      const response: ApiResponse = {
        status: "success",
        message: "Contraseña actualizada exitosamente",
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error en cambio de contraseña"
      );
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Obtener perfil del usuario actual
   * GET /api/auth/profile
   */
  public async getProfile(req: Request, res: Response): Promise<void> {
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
  public async forgotPassword(req: Request, res: Response): Promise<void> {
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

      // TODO: Aquí se enviaría el email con el enlace de recuperación
      // En producción, aquí se enviaría un email con el enlace:
      // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      // await sendPasswordResetEmail(user.email, user.nombre, resetUrl);

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
  public async resetPassword(req: Request, res: Response): Promise<void> {
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
