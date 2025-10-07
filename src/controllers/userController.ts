import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import User from "../models/User";
import { ApiResponse, UserRole } from "../types";

/**
 * Controlador para gestión de usuarios
 */
class UserController {
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

      const response: ApiResponse = {
        status: "success",
        message: "Usuarios obtenidos exitosamente",
        data: {
          users,
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
      console.error("Error obteniendo usuarios:", error);
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

      const response: ApiResponse = {
        status: "success",
        message: "Usuario obtenido exitosamente",
        data: { user },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
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
      };

      if (telefono) {
        userData.telefono = telefono;
      }

      const newUser = await User.create(userData);

      const response: ApiResponse = {
        status: "success",
        message: "Usuario creado exitosamente",
        data: { user: newUser.toJSON() },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creando usuario:", error);
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
      const { nombre, email, telefono, rol, activo } = req.body;

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

      // Actualizar campos
      if (nombre !== undefined) user.nombre = nombre;
      if (email !== undefined) user.email = email;
      if (telefono !== undefined) user.telefono = telefono;
      if (rol !== undefined) user.rol = rol as UserRole;
      if (activo !== undefined) user.activo = activo;

      await user.save();

      const response: ApiResponse = {
        status: "success",
        message: "Usuario actualizado exitosamente",
        data: { user: user.toJSON() },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error actualizando usuario:", error);
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

      const response: ApiResponse = {
        status: "success",
        message: "Usuario desactivado exitosamente",
        data: { user: user.toJSON() },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error eliminando usuario:", error);
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

      const response: ApiResponse = {
        status: "success",
        message: "Usuario activado exitosamente",
        data: { user: user.toJSON() },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error activando usuario:", error);
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

      const response: ApiResponse = {
        status: "success",
        message: "Perfil actualizado exitosamente",
        data: { user: user.toJSON() },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
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
      console.error("Error obteniendo estadísticas:", error);
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
