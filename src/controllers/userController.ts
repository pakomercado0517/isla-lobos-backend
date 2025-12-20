import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import User from "../models/User";
import { ApiResponse, UserRole } from "../types";
import { createLogger } from "../utils/logger";

const logger = createLogger("UserController");

/**
 * Controlador para gestión de usuarios
 */
class UserController {
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
      userFormateado.fechaVencimientoPermiso = UserController.extraerSoloFecha(
        userFormateado.fechaVencimientoPermiso
      );
    }
    if (userFormateado.ultimaNotificacion) {
      userFormateado.ultimaNotificacion = UserController.extraerSoloFecha(
        userFormateado.ultimaNotificacion
      );
    }
    return userFormateado;
  }

  /**
   * Formatea múltiples usuarios para respuesta
   */
  private static formatearUsuariosParaRespuesta(users: any[]): any[] {
    return users.map((user) =>
      UserController.formatearUsuarioParaRespuesta(
        user.toJSON ? user.toJSON() : user
      )
    );
  }

  /**
   * Obtener todos los usuarios (solo CONANP)
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, rol, activo } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {};
      if (rol) where.rol = rol;
      if (activo !== undefined) where.activo = activo === "true";

      const { count, rows: users } = await User.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [["created_at", "DESC"]],
        attributes: { exclude: ["password"] }, // Excluir contraseñas
      });

      // Formatear usuarios con fechas en YYYY-MM-DD
      const usersFormateados =
        UserController.formatearUsuariosParaRespuesta(users);

      const response: ApiResponse = {
        status: "success",
        message: "Usuarios obtenidos exitosamente",
        data: {
          users: usersFormateados,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error({ err: error }, "Error obteniendo usuarios");
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Obtener un usuario por ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = UserController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Usuario obtenido exitosamente",
        data: { user: userFormateado },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.params["id"] },
        "Error obteniendo usuario"
      );
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Crear un nuevo usuario (solo CONANP)
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const response: ApiResponse = {
          status: "error",
          message: firstError?.msg || "Errores de validación",
          error: "VALIDATION_ERROR",
          data: { errors: errors.array() },
        };
        res.status(400).json(response);
        return;
      }

      const {
        nombre,
        email,
        telefono,
        password,
        rol,
        activo = true,
        fechaVencimientoPermiso,
        diasNotificacion = 30,
      } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        const response: ApiResponse = {
          status: "error",
          message: "El email ya está registrado",
          error: "EMAIL_ALREADY_EXISTS",
        };
        res.status(409).json(response);
        return;
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Crear usuario
      const userData: any = {
        id: randomUUID(),
        nombre,
        email,
        password: hashedPassword,
        rol: rol as UserRole,
        activo,
        diasNotificacion,
      };

      if (telefono) {
        userData.telefono = telefono;
      }

      // Guardar fecha de vencimiento si se proporciona (formato YYYY-MM-DD, directo sin conversiones)
      if (fechaVencimientoPermiso) {
        userData.fechaVencimientoPermiso = fechaVencimientoPermiso;
      }

      const newUser = await User.create(userData);

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = UserController.formatearUsuarioParaRespuesta(
        newUser.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Usuario creado exitosamente",
        data: { user: userFormateado },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error({ err: error }, "Error creando usuario");
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Actualizar un usuario
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const response: ApiResponse = {
          status: "error",
          message: firstError?.msg || "Errores de validación",
          error: "VALIDATION_ERROR",
          data: { errors: errors.array() },
        };
        res.status(400).json(response);
        return;
      }

      const { userId } = req.params;
      const {
        nombre,
        email,
        telefono,
        rol,
        activo,
        fechaVencimientoPermiso,
        diasNotificacion,
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Verificar si el email ya existe en otro usuario
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: { email, id: { [require("sequelize").Op.ne]: userId } },
        });
        if (existingUser) {
          const response: ApiResponse = {
            status: "error",
            message: "El email ya está registrado por otro usuario",
            error: "EMAIL_ALREADY_EXISTS",
          };
          res.status(409).json(response);
          return;
        }
      }

      // Guardar el estado anterior de fechaVencimientoPermiso para detectar cambios
      const fechaVencimientoAnterior = user.fechaVencimientoPermiso;
      const diasNotificacionAnterior = user.diasNotificacion;

      // Actualizar campos
      if (nombre !== undefined) user.nombre = nombre;
      if (email !== undefined) user.email = email;
      if (telefono !== undefined) user.telefono = telefono;
      if (rol !== undefined) user.rol = rol as UserRole;
      if (activo !== undefined) user.activo = activo;

      // Actualizar fecha de vencimiento si se proporciona (formato YYYY-MM-DD, directo sin conversiones)
      if (fechaVencimientoPermiso !== undefined) {
        user.fechaVencimientoPermiso = fechaVencimientoPermiso;
      }

      // Actualizar días de notificación si se proporciona
      if (diasNotificacion !== undefined) {
        user.diasNotificacion = diasNotificacion;
      }

      await user.save();

      // Actualizar estado del permiso automáticamente si cambió la fecha o días de notificación
      const fechaCambio =
        fechaVencimientoPermiso !== undefined &&
        fechaVencimientoPermiso !== fechaVencimientoAnterior;
      const diasCambio =
        diasNotificacion !== undefined &&
        diasNotificacion !== diasNotificacionAnterior;

      if (fechaCambio || diasCambio) {
        await user.actualizarEstadoPermiso();
        // Recargar el usuario para obtener el estado actualizado
        await user.reload();
      }

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = UserController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Usuario actualizado exitosamente",
        data: { user: userFormateado },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.params["id"] },
        "Error actualizando usuario"
      );
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Eliminar un usuario (soft delete - desactivar)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Soft delete - desactivar usuario
      user.activo = false;
      await user.save();

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = UserController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Usuario desactivado exitosamente",
        data: { user: userFormateado },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.params["id"] },
        "Error eliminando usuario"
      );
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Activar un usuario
   */
  static async activateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      user.activo = true;
      await user.save();

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = UserController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Usuario activado exitosamente",
        data: { user: userFormateado },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.params["id"] },
        "Error activando usuario"
      );
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const response: ApiResponse = {
          status: "error",
          message: firstError?.msg || "Errores de validación",
          error: "VALIDATION_ERROR",
          data: { errors: errors.array() },
        };
        res.status(400).json(response);
        return;
      }

      const userId = req.user?.id;
      const { nombre, telefono, avatar_url } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Actualizar campos permitidos
      if (nombre !== undefined) user.nombre = nombre;
      if (telefono !== undefined) user.telefono = telefono;
      if (avatar_url !== undefined) user.avatar_url = avatar_url;

      await user.save();

      // Formatear usuario con fechas en YYYY-MM-DD
      const userFormateado = UserController.formatearUsuarioParaRespuesta(
        user.toJSON()
      );

      const response: ApiResponse = {
        status: "success",
        message: "Perfil actualizado exitosamente",
        data: { user: userFormateado },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.user?.id },
        "Error actualizando perfil"
      );
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Eliminación permanente de usuario (hard delete)
   */
  static async hardDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        const response: ApiResponse = {
          status: "error",
          message: firstError?.msg || "Errores de validación",
          error: "VALIDATION_ERROR",
          data: { errors: errors.array() },
        };
        res.status(400).json(response);
        return;
      }

      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        const response: ApiResponse = {
          status: "error",
          message: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        };
        res.status(404).json(response);
        return;
      }

      // Verificar si el usuario tiene registros relacionados
      // Aquí podrías agregar validaciones adicionales si es necesario
      // Por ejemplo, verificar si tiene salidas, brazaletes asignados, etc.

      // Eliminación permanente del usuario
      await user.destroy();

      const response: ApiResponse = {
        status: "success",
        message: "Usuario eliminado permanentemente del sistema",
        data: {
          deleted_user: {
            id: userId,
            nombre: user.nombre,
            email: user.email,
            eliminado_en: new Date().toISOString(),
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        { err: error, userId: req.params["userId"] },
        "Error eliminando usuario permanentemente"
      );
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(_req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { activo: true } });
      const conanpUsers = await User.count({ where: { rol: "conanp" } });
      const prestadorUsers = await User.count({ where: { rol: "prestador" } });

      const response: ApiResponse = {
        status: "success",
        message: "Estadísticas obtenidas exitosamente",
        data: {
          stats: {
            total: totalUsers,
            activos: activeUsers,
            inactivos: totalUsers - activeUsers,
            conanp: conanpUsers,
            prestadores: prestadorUsers,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error({ err: error }, "Error obteniendo estadísticas");
      const response: ApiResponse = {
        status: "error",
        message: "Error interno del servidor",
        error: "INTERNAL_SERVER_ERROR",
      };
      res.status(500).json(response);
    }
  }
}

export default UserController;
