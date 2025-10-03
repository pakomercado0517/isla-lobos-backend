import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";
import { ApiResponse } from "../types";

/**
 * Middleware para manejar errores de validación de express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Log detallado para debugging
    console.log("🚨 Errores de validación encontrados:");
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.log("❌ Errores:", errors.array());

    // Formatear errores para una respuesta más clara
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === "field" ? error.path : "unknown",
      message: error.msg,
      value: error.type === "field" ? error.value : undefined,
      type: error.type,
    }));

    const response: ApiResponse = {
      status: "error",
      message: "Errores de validación encontrados",
      error: "VALIDATION_ERROR",
      data: {
        errors: formattedErrors,
        count: formattedErrors.length,
        summary: formattedErrors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", "),
      },
    };

    console.log("📤 Respuesta de error:", JSON.stringify(response, null, 2));
    res.status(400).json(response);
    return;
  }

  next();
};

/**
 * Middleware para validar que no hay errores de validación
 * (versión más simple que solo devuelve el primer error)
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const response: ApiResponse = {
      status: "error",
      message: firstError?.msg || "Error de validación",
      error: "VALIDATION_ERROR",
    };

    res.status(400).json(response);
    return;
  }

  next();
};

// Alias para compatibilidad
export const validationMiddleware = handleValidationErrors;

/**
 * Middleware para sanitizar datos de entrada
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Sanitizar strings para prevenir XSS
  const sanitizeString = (str: any): string => {
    if (typeof str !== "string") return str;
    return str
      .trim()
      .replace(/[<>]/g, "") // Remover caracteres potencialmente peligrosos
      .substring(0, 1000); // Limitar longitud
  };

  // Sanitizar body
  if (req.body && typeof req.body === "object") {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitizar query parameters
  if (req.query && typeof req.query === "object") {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
};

/**
 * Middleware para validar que el usuario tiene permisos para acceder a un recurso
 */
export const validateResourceAccess = (_resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        status: "error",
        message: "Usuario no autenticado",
      } as ApiResponse);
      return;
    }

    // CONANP puede acceder a todo
    if (user.rol === "conanp") {
      next();
      return;
    }

    // Prestadores solo pueden acceder a sus propios recursos
    if (user.rol === "prestador") {
      const resourceId = req.params["id"] || req.params["userId"];

      if (resourceId && resourceId !== user.id) {
        res.status(403).json({
          status: "error",
          message: "No tienes permisos para acceder a este recurso",
        } as ApiResponse);
        return;
      }
    }

    next();
  };
};

/**
 * Middleware para validar que el usuario existe y está activo
 */
export const validateUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        status: "error",
        message: "ID de usuario requerido",
      } as ApiResponse);
      return;
    }

    const User = (await import("../models/User")).default;
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      } as ApiResponse);
      return;
    }

    if (!user.activo) {
      res.status(403).json({
        status: "error",
        message: "Usuario inactivo",
      } as ApiResponse);
      return;
    }

    // Agregar el usuario al request para uso posterior
    (req as any).targetUser = user;
    next();
  } catch (error) {
    console.error("Error al validar usuario:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor",
    } as ApiResponse);
  }
};
