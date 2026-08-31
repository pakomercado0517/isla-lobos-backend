import { AppError } from '../lib/AppError';
import { User } from '../models';
import { ApiResponse } from '../types';
import {
  AvatarDeleteResponse,
  AvatarGenerateDefaultResponse,
  AvatarInfoResponse,
  AvatarUploadResponse,
  CloudinaryStatsResponse,
} from '../types/avatar.types';
import { createLogger } from '../utils/logger';
import {
  deleteAvatar,
  generateDefaultAvatar,
  getUsageStats,
  isValidCloudinaryUrl,
  uploadAvatar,
} from './cloudinary.service';

const logger = createLogger('AvatarService');

const removePreviousCloudinaryAvatar = async (user: User): Promise<void> => {
  if (!user.avatar_url || !isValidCloudinaryUrl(user.avatar_url)) {
    return;
  }

  const deleted = await deleteAvatar(user.avatar_url);
  if (deleted) {
    logger.info({ userId: user.id }, 'Avatar anterior eliminado de Cloudinary');
  } else {
    logger.warn({ userId: user.id }, 'No se pudo eliminar avatar anterior');
  }
};

export const uploadAvatarService = async (
  userId: string,
  file: Express.Multer.File
): Promise<ApiResponse<AvatarUploadResponse>> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  await removePreviousCloudinaryAvatar(user);

  logger.info(
    { userId: user.id, fileName: file.originalname, fileSize: file.size },
    'Iniciando upload de avatar'
  );

  const avatarUrl = await uploadAvatar(file.buffer, user.id, file.originalname);

  user.avatar_url = avatarUrl;
  await user.save();
  logger.info({ userId: user.id, avatarUrl }, 'Avatar actualizado exitosamente');

  return {
    status: 'success',
    message: 'Avatar subido y actualizado exitosamente',
    data: {
      user: user.toJSON(),
      avatar: {
        url: avatarUrl,
        uploaded_at: new Date().toISOString(),
      },
    },
  };
};

export const deleteAvatarService = async (
  userId: string
): Promise<ApiResponse<AvatarDeleteResponse>> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  if (!user.avatar_url) throw new AppError('El usuario no tiene avatar para eliminar', 400);

  let deletedFromCloudinary = false;
  if (isValidCloudinaryUrl(user.avatar_url)) {
    deletedFromCloudinary = await deleteAvatar(user.avatar_url);
    if (deletedFromCloudinary) {
      logger.info(
        { userId: user.id, avatarUrl: user.avatar_url },
        'Avatar eliminado de Cloudinary'
      );
    } else {
      logger.warn(
        { userId: user.id, avatarUrl: user.avatar_url },
        'No se pudo eliminar avatar de Cloudinary'
      );
    }
  } else {
    logger.info(
      { userId: user.id, avatarUrl: user.avatar_url },
      'Avatar no es de Cloudinary, solo se elimina de la BD'
    );
  }

  user.avatar_url = null;
  await user.save();

  return {
    status: 'success',
    message: 'Avatar eliminado exitosamente',
    data: {
      user: user.toJSON(),
      deleted_from_cloudinary: deletedFromCloudinary,
    },
  };
};

export const generateDefaultAvatarService = async (
  userId: string,
  backgroundColor?: string,
  textColor?: string
): Promise<ApiResponse<AvatarGenerateDefaultResponse>> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  await removePreviousCloudinaryAvatar(user);

  const avatarUrl = generateDefaultAvatar(
    user.nombre,
    backgroundColor ?? '4f46e5',
    textColor ?? 'ffffff'
  );

  user.avatar_url = avatarUrl;
  await user.save();
  logger.info({ userId: user.id, avatarUrl }, 'Avatar actualizado exitosamente');

  return {
    status: 'success',
    message: 'Avatar por defecto generado exitosamente',
    data: {
      user: user.toJSON(),
      avatar: {
        url: avatarUrl,
        type: 'default',
        generated_at: new Date().toISOString(),
      },
    },
  };
};

export const getAvatarInfoService = async (
  userId: string
): Promise<ApiResponse<AvatarInfoResponse>> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  return {
    status: 'success',
    message: 'Información del avatar obtenida exitosamente',
    data: {
      has_avatar: !!user.avatar_url,
      avatar_url: user.avatar_url ?? null,
      is_cloudinary: user.avatar_url
        ? isValidCloudinaryUrl(user.avatar_url)
        : false,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
      },
    },
  };
};

export const getCloudinaryStatsService = async (): Promise<ApiResponse<CloudinaryStatsResponse>> => {
  const stats = await getUsageStats();
  if (!stats) {
    throw new AppError('No se pudieron obtener las estadísticas de Cloudinary', 500);
  }

  return {
    status: 'success',
    message: 'Estadísticas de Cloudinary obtenidas exitosamente',
    data: {
      usage_stats: stats,
      limits: {
        free_tier: {
          storage_gb: 25,
          bandwidth_gb: 25,
          transformations: 25000,
        },
      },
      retrieved_at: new Date().toISOString(),
    },
  };
};
