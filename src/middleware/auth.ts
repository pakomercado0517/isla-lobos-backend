import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types";
import User from "../models/User";
import { param, validationResult } from "express-validator";
import { authLogger } from "../utils/logger";

// Importar jsonwebtoken usando require para evitar problemas de tipos
const jwt = require("jsonwebtoken");

// Interfaz para Request con usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: UserRole;
    nombre: string;
  };
}

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: UserRole;
        nombre: string;
      };
    }
  }
}

// Interfaz para el payload del JWT
interface JwtPayload {
  id: string;
  email: string;
  rol: UserRole;
  nombre: string;
  iat: number;
  exp: number;
}

/**Middleware para verificar el id del ususario */
export const validateUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await param("userId")
    .isUUID()
    .withMessage("El id del usuario debe ser un UUID válido")
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

/**
 * Middleware para verificar el token JWT
 * Lee el token desde cookies (prioridad) o Authorization header (fallback)
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Leer token desde cookies (prioridad) o header Authorization (fallback)
    let token = req.cookies?.["accessToken"];
    
    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    }

    if (!token) {
      res.status(401).json({
        status: "error",
        message: "Token de acceso requerido",
      });
      return;
    }

    // Verificar el token
    const decoded = jwt.verify(
      token,
      process.env["JWT_SECRET"] || "fallback-secret"
    ) as JwtPayload;

    // Buscar el usuario en la base de datos para verificar que sigue activo
    const user = await User.findByPk(decoded.id);
    if (!user || !user.activo) {
      res.status(401).json({
        status: "error",
        message: "Usuario no encontrado o inactivo",
      });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: "error",
        message: "Token inválido",
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: "error",
        message: "Token expirado",
      });
      return;
    }

    authLogger.error({ err: error }, "Error en autenticación");
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    });
  }
};

/** Middleware para verificar que el usuario existe */
export const validateUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("Usuario no encontrado");
      res.status(404).json({ error: error.message });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al validar al usuario" });
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (roles: UserRole[] | UserRole | string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      });
      return;
    }

    // Convertir a array si es un string o UserRole individual
    let rolesArray: UserRole[];
    if (Array.isArray(roles)) {
      rolesArray = roles;
    } else if (typeof roles === "string") {
      rolesArray = [roles as UserRole];
    } else {
      rolesArray = [roles];
    }

    if (!rolesArray.includes(req.user.rol)) {
      res.status(403).json({
        status: "error",
        message: "No tienes permisos para acceder a este recurso",
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario sea CONANP
 */
export const requireCONANP = requireRole([UserRole.CONANP]);

/**
 * Middleware para verificar que el usuario sea Prestador
 */
export const requirePrestador = requireRole([UserRole.PRESTADOR]);

// Alias para compatibilidad
export const authMiddleware = authenticateToken;

/**
 * Middleware opcional para autenticación (no falla si no hay token)
 * Lee el token desde cookies (prioridad) o Authorization header (fallback)
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Leer token desde cookies (prioridad) o header Authorization (fallback)
    let token = req.cookies?.["accessToken"];
    
    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env["JWT_SECRET"] || "fallback-secret"
      ) as JwtPayload;

      const user = await User.findByPk(decoded.id);
      if (user && user.activo) {
        req.user = {
          id: user.id,
          email: user.email,
          rol: user.rol,
          nombre: user.nombre,
        };
      }
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
};
