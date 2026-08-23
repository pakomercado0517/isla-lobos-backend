import multer from 'multer';
import { Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../lib/AppError';
import { AuthRequest } from './auth.middleware';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = parseInt(process.env['AVATAR_MAX_SIZE'] || '5242880');

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        `Tipo de archivo no permitido, solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400
      );
    }

    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new AppError(
        `Extensión de archivo no permitida, solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error instanceof AppError ? error : new AppError('Error validando archivo', 400));
  }
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
    fieldSize: 1024 * 1024,
  },
});

export const validateUploadedFile = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.file) {
      throw new AppError('No se ha subido ningún archivo', 400);
    }

    const file = req.file;

    if (file.size === 0) {
      throw new AppError('El archivo está vacío', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        `El archivo excede el tamaño máximo permitido (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        400
      );
    }

    if (file.fieldname !== 'image' && file.fieldname !== 'avatar') {
      throw new AppError('El campo de archivo debe ser "image" o "avatar"', 400);
    }

    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Error validando archivo subido', 500));
  }
};

export const handleMulterError = (
  error: Error,
  _req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(
          new AppError(
            `El archivo excede el tamaño máximo permitido ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            400
          )
        );
      case 'LIMIT_FILE_COUNT':
        return next(new AppError('Solo se permite subir un archivo a la vez', 400));
      case 'LIMIT_FIELD_COUNT':
        return next(new AppError('Demasiados campos en el formulario', 400));
      case 'LIMIT_FIELD_VALUE':
        return next(new AppError('Campo de formulario muy grande', 400));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new AppError('Archivo inesperado', 400));
      default:
        return next(new AppError('Error procesando archivo', 500));
    }
  }

  next(error);
};

export const validateCloudinaryConfig = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error({ missingVars }, 'Variables de entorno de Cloudinary faltantes');
    return next(new AppError('Configuración de Cloudinary incompleta', 500));
  }

  next();
};

export const uploadLimits = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: 'Demasiados intentos de subida de avatar. Intenta más tarde.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
};

export default {
  avatarUpload,
  validateUploadedFile,
  handleMulterError,
  validateCloudinaryConfig,
  uploadLimits,
};
