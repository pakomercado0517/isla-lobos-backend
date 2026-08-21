import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import User from '../models/User';
import { param, validationResult } from 'express-validator';
import { authLogger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError';
import { getJwtSecret } from '../lib/authTokens';

// Interfaz para Request con usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    rol: UserRole;
    nombre: string;
  };
  targetUser?: User;
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
export const validateUserId = async (req: Request, res: Response, next: NextFunction) => {
  await param('userId').isUUID().withMessage('El id del usuario debe ser un UUID válido').run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(`Validation error: ${errors.array().map((err) => err.msg)}`, 400);
  }
  next();
};

/**
 * Middleware para verificar el token JWT
 * Lee el token desde cookies (prioridad) o Authorization header (fallback)
 */
export const authenticateToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Leer token desde cookies (prioridad) o header Authorization (fallback)
    let token = req.cookies?.['accessToken'];

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return next(new AppError('Token de acceso requerido', 401));
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    const user = await User.findByPk(decoded.id);
    if (!user || !user.activo) {
      throw new AppError('Usuario no encontrado o inactivo', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expirado', 401));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token inválido', 401));
    }
    if (error instanceof AppError) {
      return next(error);
    }
    authLogger.error({ err: error }, 'Error en autenticación');
    next(error);
  }
};

/** Middleware para verificar que el usuario existe */
export const validateUserExists = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId as string);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      res.status(404).json({ error: error.message });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (roles: UserRole[] | UserRole | string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401);
    }

    // Convertir a array si es un string o UserRole individual
    let rolesArray: UserRole[];
    if (Array.isArray(roles)) {
      rolesArray = roles;
    } else if (typeof roles === 'string') {
      rolesArray = [roles as UserRole];
    } else {
      rolesArray = [roles];
    }

    if (!rolesArray.includes(req.user.rol)) {
      throw new AppError('No tienes permisos para acceder a este recurso', 403);
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
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Leer token desde cookies (prioridad) o header Authorization (fallback)
    let token = req.cookies?.['accessToken'];

    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

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
  } catch {
    next();
  }
};
