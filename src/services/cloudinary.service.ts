import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../lib/AppError';
import { CloudinaryStats } from '../types/avatar.types';
import { createLogger } from '../utils/logger';

const logger = createLogger('CloudinaryService');

let isConfigured = false;
let cloudName = '';

const initializeCloudinary = (): void => {
  try {
    const configuredCloudName = process.env['CLOUDINARY_CLOUD_NAME'];
    const apiKey = process.env['CLOUDINARY_API_KEY'];
    const apiSecret = process.env['CLOUDINARY_API_SECRET'];

    if (!configuredCloudName || !apiKey || !apiSecret) {
      logger.warn(
        'Credenciales de Cloudinary no configuradas. El servicio de Cloudinary estará deshabilitado.'
      );
      isConfigured = false;
      return;
    }

    cloudinary.config({
      cloud_name: configuredCloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    cloudName = configuredCloudName;
    isConfigured = true;
    logger.info('Servicio de Cloudinary inicializado correctamente');
  } catch (error) {
    logger.error({ err: error }, 'Error al inicializar servicio de Cloudinary');
    isConfigured = false;
  }
};

initializeCloudinary();

const ensureConfigured = (): void => {
  if (!isConfigured) {
    throw new AppError('Servicio de Cloudinary no está configurado', 503);
  }
};

const extractPublicIdFromUrl = (url: string): string | null => {
  const pattern = /\/v\d+\/(.+?)\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/;
  const match = url.match(pattern);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]);
};

export const isValidCloudinaryUrl = (url: string): boolean => {
  if (!cloudName) return false;
  const pattern = new RegExp(`https://res\\.cloudinary\\.com/${cloudName}/image/upload/`);
  return pattern.test(url);
};

export const uploadAvatar = async (
  fileBuffer: Buffer,
  userId: string,
  originalName?: string
): Promise<string> => {
  ensureConfigured();

  const timestamp = Date.now();
  const publicId = `isla-lobos/avatars/user-${userId}-${timestamp}`;

  logger.info({ userId, publicId }, 'Subiendo avatar a Cloudinary');

  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
    {
      public_id: publicId,
      folder: 'isla-lobos/avatars',
      resource_type: 'image',
      transformation: [
        {
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto',
        },
        {
          width: 150,
          height: 150,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
      context: {
        user_id: userId,
        uploaded_at: new Date().toISOString(),
        original_name: originalName || 'avatar',
      },
      tags: ['avatar', 'user-profile', 'isla-lobos'],
    }
  );

  if (!result?.secure_url) {
    throw new AppError('No se pudo obtener la URL de la imagen subida', 500);
  }

  logger.info(
    { userId, url: result.secure_url, publicId: result.public_id },
    'Avatar subido exitosamente a Cloudinary'
  );

  return result.secure_url;
};

export const deleteAvatar = async (avatarUrl: string): Promise<boolean> => {
  if (!isConfigured) return false;

  const publicId = extractPublicIdFromUrl(avatarUrl);
  if (!publicId) {
    logger.warn({ avatarUrl }, 'No se pudo extraer public_id de la URL');
    return false;
  }

  try {
    logger.info({ publicId, avatarUrl }, 'Eliminando avatar de Cloudinary');
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    if (result.result === 'ok') {
      logger.info({ publicId }, 'Avatar eliminado exitosamente de Cloudinary');
      return true;
    }

    logger.warn({ publicId, result }, 'No se pudo eliminar el avatar de Cloudinary');
    return false;
  } catch (error) {
    logger.error({ err: error, avatarUrl }, 'Error eliminando avatar de Cloudinary');
    return false;
  }
};

export const generateDefaultAvatar = (
  userName: string,
  backgroundColor = '4f46e5',
  textColor = 'ffffff'
): string => {
  ensureConfigured();

  const initials = userName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);

  return cloudinary.url('sample', {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'center',
    background: backgroundColor,
    color: textColor,
    font_size: 120,
    font_weight: 'bold',
    text: initials,
    format: 'png',
  });
};

export const getUsageStats = async (): Promise<CloudinaryStats | null> => {
  ensureConfigured();

  try {
    const result = await cloudinary.api.usage();
    return {
      totalImages: result.used_resources || 0,
      totalStorage: result.used_storage || 0,
      totalBandwidth: result.used_bandwidth || 0,
    };
  } catch (error) {
    logger.error({ err: error }, 'Error obteniendo estadísticas de Cloudinary');
    return null;
  }
};
