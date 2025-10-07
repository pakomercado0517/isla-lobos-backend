import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "crypto";
import { validationResult } from "express-validator";
import User from "../models/User";
import Invitacion from "../models/Invitacion";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  UserRole,
} from "../types";

// Importar jsonwebtoken usando require para evitar problemas de tipos
const jwt = require("jsonwebtoken");

// Helper function para generar tokens JWT
const generateJWT = (payload: any): string => {
  const secret = process.env["JWT_SECRET"] || "fallback-secret";
  const expiresIn = process.env["JWT_EXPIRES_IN"] || "24h";

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Controlador de autenticación para el sistema Isla Lobos
 */
class AuthController {
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

      // Generar token JWT
      const token = generateJWT({
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
      });

      // Respuesta exitosa
      const response: ApiResponse<AuthResponse> = {
        status: "success",
        message: "Inicio de sesión exitoso",
        data: {
          user: user.toJSON() as any,
          token,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error en login:", error);
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
        console.log("🔍 Debug - errors:", errors);
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

      // Generar token JWT
      const token = generateJWT({
        id: newUser.id,
        email: newUser.email,
        rol: newUser.rol,
        nombre: newUser.nombre,
      });

      // Respuesta exitosa
      const response: ApiResponse<AuthResponse> = {
        status: "success",
        message: "Usuario registrado exitosamente",
        data: {
          user: newUser.toJSON() as any,
          token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error en registro:", error);
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

      const response: ApiResponse<{ user: any }> = {
        status: "success",
        message: "Token válido",
        data: {
          user: dbUser.toJSON(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error en verificación de token:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Renovar token JWT
   * POST /api/auth/refresh
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          status: "error",
          message: "Usuario no autenticado",
        } as ApiResponse);
        return;
      }

      // Verificar que el usuario sigue activo
      const dbUser = await User.findByPk(user.id);
      if (!dbUser || !dbUser.activo) {
        res.status(401).json({
          status: "error",
          message: "Usuario no encontrado o inactivo",
        } as ApiResponse);
        return;
      }

      // Generar nuevo token
      const newToken = generateJWT({
        id: dbUser.id,
        email: dbUser.email,
        rol: dbUser.rol,
        nombre: dbUser.nombre,
      });

      const response: ApiResponse<{ token: string }> = {
        status: "success",
        message: "Token renovado exitosamente",
        data: {
          token: newToken,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error en renovación de token:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }

  /**
   * Cerrar sesión (invalidar token)
   * POST /api/auth/logout
   */
  public async logout(_req: Request, res: Response): Promise<void> {
    try {
      // En un sistema más avanzado, aquí podrías agregar el token a una lista negra
      // Por ahora, simplemente confirmamos que la sesión se cerró
      const response: ApiResponse = {
        status: "success",
        message: "Sesión cerrada exitosamente",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error en logout:", error);
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
      console.error("Error en cambio de contraseña:", error);
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

      const response: ApiResponse<{ user: any }> = {
        status: "success",
        message: "Perfil obtenido exitosamente",
        data: {
          user: dbUser.toJSON(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
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
      // Por ahora, solo logueamos el token para desarrollo
      console.log(`🔑 Token de recuperación para ${email}: ${resetToken}`);
      console.log(`⏰ Expira en: ${resetExpires.toISOString()}`);

      // En producción, aquí se enviaría un email con el enlace:
      // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      // await sendPasswordResetEmail(user.email, user.nombre, resetUrl);

      res.status(200).json(response);
    } catch (error) {
      console.error("Error en forgot password:", error);
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
      console.error("Error en reset password:", error);
      res.status(500).json({
        status: "error",
        message: "Error interno del servidor",
      } as ApiResponse);
    }
  }
}

export default new AuthController();
