import { body } from "express-validator";

/**
 * Validaciones para el sistema de avatares
 */

// Validación para generar avatar por defecto
export const generateDefaultAvatarValidation = [
  body("backgroundColor")
    .optional()
    .isHexColor()
    .withMessage(
      "El color de fondo debe ser un color hexadecimal válido (ej: #4f46e5)"
    )
    .isLength({ min: 6, max: 7 })
    .withMessage("El color de fondo debe tener 6 o 7 caracteres (con o sin #)")
    .customSanitizer((value) => {
      // Remover # si está presente
      return value ? value.replace("#", "") : value;
    }),

  body("textColor")
    .optional()
    .isHexColor()
    .withMessage(
      "El color del texto debe ser un color hexadecimal válido (ej: #ffffff)"
    )
    .isLength({ min: 6, max: 7 })
    .withMessage("El color del texto debe tener 6 o 7 caracteres (con o sin #)")
    .customSanitizer((value) => {
      // Remover # si está presente
      return value ? value.replace("#", "") : value;
    }),

  // Validación personalizada para colores seguros
  body("backgroundColor")
    .optional()
    .custom((value) => {
      if (!value) return true;

      // Lista de colores seguros y atractivos para avatares
      const safeColors = [
        "4f46e5", // Azul
        "059669", // Verde
        "dc2626", // Rojo
        "7c3aed", // Púrpura
        "ea580c", // Naranja
        "0891b2", // Cian
        "be123c", // Rosa
        "65a30d", // Lima
        "c2410c", // Ámbar
        "1e40af", // Azul oscuro
        "374151", // Gris
        "92400e", // Marrón
      ];

      if (!safeColors.includes(value.toLowerCase())) {
        throw new Error(
          `Color no permitido. Colores seguros disponibles: ${safeColors.join(
            ", "
          )}`
        );
      }

      return true;
    }),

  body("textColor")
    .optional()
    .custom((value) => {
      if (!value) return true;

      // Solo permitir colores de texto seguros (contraste)
      const safeTextColors = [
        "ffffff", // Blanco
        "000000", // Negro
        "f3f4f6", // Gris claro
        "111827", // Gris oscuro
      ];

      if (!safeTextColors.includes(value.toLowerCase())) {
        throw new Error(
          `Color de texto no permitido. Colores seguros: ${safeTextColors.join(
            ", "
          )}`
        );
      }

      return true;
    }),
];

// Validación para actualizar avatar URL manualmente (si se necesita)
export const updateAvatarUrlValidation = [
  body("avatar_url")
    .optional()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage(
      "La URL del avatar debe ser una URL válida con protocolo http o https"
    )
    .isLength({ max: 500 })
    .withMessage("La URL del avatar no puede exceder 500 caracteres")
    .custom((value) => {
      if (!value) return true;

      // Validar que sea una URL de imagen válida
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
      ];
      const hasImageExtension = imageExtensions.some((ext) =>
        value.toLowerCase().includes(ext)
      );

      if (!hasImageExtension && !value.includes("cloudinary.com")) {
        throw new Error("La URL debe ser de una imagen válida o de Cloudinary");
      }

      return true;
    }),
];

// Validación para parámetros de avatar (si se necesita en el futuro)
export const avatarParamValidation = [
  // Se puede expandir en el futuro si se necesitan parámetros específicos
];

// Validaciones para configuración de avatar (solo CONANP)
export const avatarConfigValidation = [
  body("max_file_size")
    .optional()
    .isInt({ min: 1024, max: 10485760 }) // Entre 1KB y 10MB
    .withMessage("El tamaño máximo de archivo debe estar entre 1KB y 10MB")
    .toInt(),

  body("allowed_types")
    .optional()
    .isArray()
    .withMessage("Los tipos permitidos deben ser un array")
    .custom((value) => {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      const invalidTypes = value.filter(
        (type: string) => !allowedTypes.includes(type)
      );

      if (invalidTypes.length > 0) {
        throw new Error(
          `Tipos de archivo no permitidos: ${invalidTypes.join(
            ", "
          )}. Tipos válidos: ${allowedTypes.join(", ")}`
        );
      }

      return true;
    }),

  body("max_dimension")
    .optional()
    .isInt({ min: 100, max: 4096 }) // Entre 100px y 4096px
    .withMessage("La dimensión máxima debe estar entre 100px y 4096px")
    .toInt(),
];

// Validaciones para estadísticas de avatar (solo CONANP)
export const avatarStatsValidation = [
  // Validaciones específicas para filtros de estadísticas si se necesitan
  body("date_from")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de inicio debe ser una fecha válida en formato ISO 8601"
    )
    .toDate(),

  body("date_to")
    .optional()
    .isISO8601()
    .withMessage(
      "La fecha de fin debe ser una fecha válida en formato ISO 8601"
    )
    .toDate()
    .custom((value, { req }) => {
      if (req.body.date_from && value < req.body.date_from) {
        throw new Error(
          "La fecha de fin debe ser posterior a la fecha de inicio"
        );
      }
      return true;
    }),

  body("user_id")
    .optional()
    .isUUID()
    .withMessage("El ID del usuario debe ser un UUID válido"),
];

// Validaciones personalizadas para el sistema de avatares
export const avatarCustomValidations = {
  // Validar que el usuario tenga permisos para modificar avatares
  validateAvatarPermissions: (req: any) => {
    const userRole = req.user?.rol;
    const targetUserId = req.params?.userId || req.body?.userId;
    const currentUserId = req.user?.id;

    // CONANP puede modificar cualquier avatar
    if (userRole === "conanp") {
      return true;
    }

    // Los prestadores solo pueden modificar su propio avatar
    if (userRole === "prestador" && targetUserId === currentUserId) {
      return true;
    }

    return false;
  },

  // Validar que el archivo sea realmente una imagen
  validateImageFile: (file: Express.Multer.File) => {
    // Verificar magic numbers para detectar tipo real de archivo
    const magicNumbers = {
      "image/jpeg": [0xff, 0xd8, 0xff],
      "image/png": [0x89, 0x50, 0x4e, 0x47],
      "image/gif": [0x47, 0x49, 0x46, 0x38],
      "image/webp": [0x52, 0x49, 0x46, 0x46],
    };

    const fileBuffer = file.buffer;
    const mimeType = file.mimetype;

    if (!magicNumbers[mimeType as keyof typeof magicNumbers]) {
      return false;
    }

    const expectedMagic = magicNumbers[mimeType as keyof typeof magicNumbers];
    const actualMagic = Array.from(fileBuffer.slice(0, expectedMagic.length));

    return expectedMagic.every((byte, index) => byte === actualMagic[index]);
  },

  // Validar dimensiones de imagen
  validateImageDimensions: async (
    file: Express.Multer.File,
    _maxDimension: number = 2048
  ) => {
    try {
      // Esta validación se implementaría con una librería como sharp
      // Por ahora, solo validamos que el archivo no esté corrupto
      if (file.size === 0) {
        return false;
      }

      // Validación básica de que el archivo tenga contenido
      return file.buffer.length > 0;
    } catch (error) {
      return false;
    }
  },

  // Validar que la URL de Cloudinary sea válida
  validateCloudinaryUrl: (url: string) => {
    const cloudinaryPattern =
      /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\//;
    return cloudinaryPattern.test(url);
  },

  // Validar límites de rate limiting
  validateRateLimit: (
    _userId: string,
    uploadCount: number,
    _timeWindow: number
  ) => {
    // Esta validación se implementaría con un sistema de cache (Redis)
    // Por ahora, solo retornamos true
    return uploadCount < 5; // Máximo 5 uploads por ventana de tiempo
  },
};

export default {
  generateDefaultAvatarValidation,
  updateAvatarUrlValidation,
  avatarParamValidation,
  avatarConfigValidation,
  avatarStatsValidation,
  avatarCustomValidations,
};
