import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Middleware para manejo de uploads de archivos con Multer
 * Configurado específicamente para avatares de usuario
 */

// Configuración de tipos de archivo permitidos
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Límites de archivo
const MAX_FILE_SIZE = parseInt(process.env["AVATAR_MAX_SIZE"] || "5242880"); // 5MB por defecto

/**
 * Configuración de almacenamiento en memoria para Multer
 * Los archivos se almacenan temporalmente en memoria antes de subir a Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * Filtro de archivos para validar tipo y tamaño
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  try {
    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error(
        `Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(
          ", "
        )}`
      ) as Error & { name: string };
      error.name = "INVALID_FILE_TYPE";
      return cb(error as any, false);
    }

    // Validar extensión del archivo
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      const error = new Error(
        `Extensión de archivo no permitida. Solo se permiten: ${ALLOWED_EXTENSIONS.join(
          ", "
        )}`
      ) as Error & { name: string };
      error.name = "INVALID_FILE_EXTENSION";
      return cb(error as any, false);
    }

    logger.info(
      {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fieldname: file.fieldname,
      },
      "Archivo validado para upload"
    );

    cb(null, true);
  } catch (error) {
    logger.error({ err: error }, "Error en filtro de archivos");
    cb(new Error("Error validando archivo") as any, false);
  }
};

/**
 * Configuración principal de Multer
 */
export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Solo un archivo por request
    fields: 10, // Máximo 10 campos de formulario
    fieldSize: 1024 * 1024, // 1MB para campos de texto
  },
});

/**
 * Middleware para validar archivo después del upload
 */
export const validateUploadedFile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Verificar si hay archivo subido
    if (!req.file) {
      const error = new Error("No se ha subido ningún archivo");
      error.name = "NO_FILE_UPLOADED";
      res.status(400).json({
        status: "error",
        message: "Se requiere un archivo de imagen",
        error: "NO_FILE_UPLOADED",
      });
      return;
    }

    const file = req.file;

    // Validaciones adicionales del archivo
    if (file.size === 0) {
      const error = new Error("El archivo está vacío");
      error.name = "EMPTY_FILE";
      res.status(400).json({
        status: "error",
        message: "El archivo está vacío",
        error: "EMPTY_FILE",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const error = new Error(
        `El archivo excede el tamaño máximo permitido (${
          MAX_FILE_SIZE / 1024 / 1024
        }MB)`
      );
      error.name = "FILE_TOO_LARGE";
      res.status(400).json({
        status: "error",
        message: `El archivo excede el tamaño máximo permitido (${
          MAX_FILE_SIZE / 1024 / 1024
        }MB)`,
        error: "FILE_TOO_LARGE",
        data: {
          maxSize: MAX_FILE_SIZE,
          currentSize: file.size,
        },
      });
      return;
    }

    // Validar que el campo sea 'image' o 'avatar'
    if (file.fieldname !== "image" && file.fieldname !== "avatar") {
      const error = new Error("Campo de archivo inválido");
      error.name = "INVALID_FIELD_NAME";
      res.status(400).json({
        status: "error",
        message: 'El campo del archivo debe ser "image" o "avatar"',
        error: "INVALID_FIELD_NAME",
      });
      return;
    }

    logger.info(
      {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fieldname: file.fieldname,
        userId: req.user?.id,
      },
      "Archivo validado exitosamente para upload"
    );

    next();
  } catch (error) {
    logger.error({ err: error }, "Error validando archivo subido");
    res.status(500).json({
      status: "error",
      message: "Error interno validando archivo",
      error: "VALIDATION_ERROR",
    });
  }
};

/**
 * Middleware para manejar errores de Multer
 */
export const handleMulterError = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    logger.error({ err: error }, "Error de Multer en upload");

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        res.status(400).json({
          status: "error",
          message: `El archivo excede el tamaño máximo permitido (${
            MAX_FILE_SIZE / 1024 / 1024
          }MB)`,
          error: "FILE_TOO_LARGE",
          data: {
            maxSize: MAX_FILE_SIZE,
            maxSizeMB: MAX_FILE_SIZE / 1024 / 1024,
          },
        });
        return;
        return;

      case "LIMIT_FILE_COUNT":
        res.status(400).json({
          status: "error",
          message: "Solo se permite subir un archivo a la vez",
          error: "TOO_MANY_FILES",
        });
        return;

      case "LIMIT_FIELD_COUNT":
        res.status(400).json({
          status: "error",
          message: "Demasiados campos en el formulario",
          error: "TOO_MANY_FIELDS",
        });
        return;

      case "LIMIT_FIELD_SIZE" as any:
        res.status(400).json({
          status: "error",
          message: "Campo de formulario muy grande",
          error: "FIELD_TOO_LARGE",
        });
        return;

      case "LIMIT_UNEXPECTED_FILE":
        res.status(400).json({
          status: "error",
          message: "Campo de archivo inesperado",
          error: "UNEXPECTED_FIELD",
        });
        return;

      default:
        res.status(400).json({
          status: "error",
          message: "Error procesando archivo",
          error: "MULTER_ERROR",
          details: error.message,
        });
        return;
    }
  }

  // Si no es un error de Multer, pasar al siguiente middleware
  next(error);
};

/**
 * Middleware para validar configuración de Cloudinary
 */
export const validateCloudinaryConfig = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const requiredEnvVars = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      logger.error(
        { missingVars },
        "Variables de entorno de Cloudinary faltantes"
      );
      res.status(500).json({
        status: "error",
        message: "Configuración de Cloudinary incompleta",
        error: "CLOUDINARY_CONFIG_ERROR",
        data: {
          missingVariables: missingVars,
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error({ err: error }, "Error validando configuración de Cloudinary");
    res.status(500).json({
      status: "error",
      message: "Error interno validando configuración",
      error: "CONFIG_VALIDATION_ERROR",
    });
    return;
  }
};

/**
 * Configuración de límites por usuario (Rate Limiting)
 */
export const uploadLimits = {
  // Máximo 5 uploads por usuario cada 15 minutos
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    status: "error",
    message: "Demasiados intentos de subida de avatar. Intenta más tarde.",
    error: "RATE_LIMIT_EXCEEDED",
  },
};

export default {
  avatarUpload,
  validateUploadedFile,
  handleMulterError,
  validateCloudinaryConfig,
  uploadLimits,
};
