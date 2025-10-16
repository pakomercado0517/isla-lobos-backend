import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

/**
 * Servicio para manejo de imágenes con Cloudinary
 * Incluye upload, transformaciones automáticas y eliminación de avatares
 */
export class CloudinaryService {
  private static initialized = false;

  /**
   * Inicializar Cloudinary con las credenciales del entorno
   */
  private static initialize(): void {
    if (this.initialized) return;

    try {
      const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
      const apiKey = process.env['CLOUDINARY_API_KEY'];
      const apiSecret = process.env['CLOUDINARY_API_SECRET'];

      if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Variables de entorno de Cloudinary faltantes');
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true, // Usar HTTPS
      });

      this.initialized = true;
      logger.info('✅ Cloudinary inicializado correctamente');
    } catch (error) {
      logger.error({ err: error }, '❌ Error inicializando Cloudinary');
      throw new Error('Error de configuración de Cloudinary');
    }
  }

  /**
   * Subir avatar de usuario a Cloudinary
   * @param fileBuffer - Buffer del archivo de imagen
   * @param userId - ID del usuario
   * @param originalName - Nombre original del archivo
   * @returns URL pública de la imagen subida
   */
  static async uploadAvatar(
    fileBuffer: Buffer,
    userId: string,
    originalName?: string
  ): Promise<string> {
    this.initialize();

    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const publicId = `isla-lobos/avatars/user-${userId}-${timestamp}`;

      // Configuración de transformaciones automáticas
      const uploadOptions = {
        public_id: publicId,
        folder: 'isla-lobos/avatars',
        resource_type: 'image' as const,
        transformation: [
          // Redimensionar y recortar a 300x300 centrado en la cara
          {
            width: 300,
            height: 300,
            crop: 'fill',
            gravity: 'face', // Detectar cara automáticamente
            quality: 'auto',
            fetch_format: 'auto',
          },
          // Crear thumbnail de 150x150
          {
            width: 150,
            height: 150,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
        // Metadatos útiles
        context: {
          user_id: userId,
          uploaded_at: new Date().toISOString(),
          original_name: originalName || 'avatar',
        },
        // Tags para organización
        tags: ['avatar', 'user-profile', 'isla-lobos'],
      };

      logger.info({ userId, publicId }, 'Subiendo avatar a Cloudinary');

      // Subir imagen
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
        uploadOptions
      );

      if (!result || !result.secure_url) {
        throw new Error('No se pudo obtener la URL de la imagen subida');
      }

      logger.info(
        { userId, url: result.secure_url, publicId: result.public_id },
        'Avatar subido exitosamente a Cloudinary'
      );

      return result.secure_url;
    } catch (error) {
      logger.error(
        { err: error, userId },
        'Error subiendo avatar a Cloudinary'
      );
      throw new Error(`Error subiendo avatar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Eliminar avatar de Cloudinary
   * @param avatarUrl - URL del avatar a eliminar
   * @returns true si se eliminó correctamente
   */
  static async deleteAvatar(avatarUrl: string): Promise<boolean> {
    this.initialize();

    try {
      // Extraer public_id de la URL
      const publicId = this.extractPublicIdFromUrl(avatarUrl);
      if (!publicId) {
        logger.warn({ avatarUrl }, 'No se pudo extraer public_id de la URL');
        return false;
      }

      logger.info({ publicId, avatarUrl }, 'Eliminando avatar de Cloudinary');

      // Eliminar imagen
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });

      if (result.result === 'ok') {
        logger.info({ publicId }, 'Avatar eliminado exitosamente de Cloudinary');
        return true;
      } else {
        logger.warn(
          { publicId, result },
          'No se pudo eliminar el avatar de Cloudinary'
        );
        return false;
      }
    } catch (error) {
      logger.error(
        { err: error, avatarUrl },
        'Error eliminando avatar de Cloudinary'
      );
      return false;
    }
  }

  /**
   * Generar URL de avatar con transformaciones específicas
   * @param publicId - ID público de la imagen
   * @param width - Ancho deseado
   * @param height - Alto deseado
   * @param crop - Tipo de recorte
   * @returns URL transformada
   */
  static generateTransformedUrl(
    publicId: string,
    width: number = 300,
    height: number = 300,
    crop: string = 'fill',
    gravity: string = 'face'
  ): string {
    this.initialize();

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      gravity,
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  /**
   * Generar avatar por defecto usando iniciales del usuario
   * @param userName - Nombre del usuario
   * @param backgroundColor - Color de fondo (opcional)
   * @param textColor - Color del texto (opcional)
   * @returns URL del avatar generado
   */
  static generateDefaultAvatar(
    userName: string,
    backgroundColor: string = '4f46e5', // Color azul por defecto
    textColor: string = 'ffffff' // Color blanco por defecto
  ): string {
    this.initialize();

    // Extraer iniciales del nombre
    const initials = userName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);

    // Generar avatar usando texto
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
  }

  /**
   * Obtener información de una imagen
   * @param publicId - ID público de la imagen
   * @returns Información de la imagen
   */
  static async getImageInfo(publicId: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
    created_at: string;
  } | null> {
    this.initialize();

    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image',
      });

      return {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        created_at: result.created_at,
      };
    } catch (error) {
      logger.error({ err: error, publicId }, 'Error obteniendo info de imagen');
      return null;
    }
  }

  /**
   * Extraer public_id de una URL de Cloudinary
   * @param url - URL completa de Cloudinary
   * @returns public_id o null si no se puede extraer
   */
  private static extractPublicIdFromUrl(url: string): string | null {
    try {
      // Patrón para extraer public_id de URL de Cloudinary
      const pattern = /\/v\d+\/(.+?)\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/;
      const match = url.match(pattern);
      
      if (match && match[1]) {
        // Decodificar el public_id si tiene caracteres especiales
        return decodeURIComponent(match[1]);
      }
      
      return null;
    } catch (error) {
      logger.error({ err: error, url }, 'Error extrayendo public_id de URL');
      return null;
    }
  }

  /**
   * Validar si una URL es de Cloudinary
   * @param url - URL a validar
   * @returns true si es una URL de Cloudinary válida
   */
  static isValidCloudinaryUrl(url: string): boolean {
    try {
      const cloudinaryDomain = process.env['CLOUDINARY_CLOUD_NAME'];
      if (!cloudinaryDomain) return false;

      const pattern = new RegExp(
        `https://res\\.cloudinary\\.com/${cloudinaryDomain}/image/upload/`
      );
      
      return pattern.test(url);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener estadísticas de uso de Cloudinary
   * @returns Estadísticas de uso
   */
  static async getUsageStats(): Promise<{
    totalImages: number;
    totalStorage: number;
    totalBandwidth: number;
  } | null> {
    this.initialize();

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
  }
}

export default CloudinaryService;
