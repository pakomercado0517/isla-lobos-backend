import pino from "pino";

/**
 * Logger centralizado usando Pino
 *
 * Configuración estilo Morgan Dev para logs HTTP limpios y claros
 *
 * Características:
 * - Formato Morgan Dev: METHOD /path STATUS TIME - SIZE
 * - Logs estructurados en formato JSON en producción
 * - Pretty print en desarrollo
 * - Child loggers por módulo
 * - Niveles configurables: trace, debug, info, warn, error, fatal
 */

const isDevelopment = process.env["NODE_ENV"] === "development";
const isProd = process.env["NODE_ENV"] === "production";
const logLevel = process.env["LOG_LEVEL"] || (isDevelopment ? "debug" : "info");

// Configuración base común
const baseConfig = {
  level: logLevel,
  base: {
    service: process.env["SERVICE_NAME"] || "isla-lobos-backend",
    env: process.env["NODE_ENV"] || "development",
  },
  // Redactar información sensible
  redact: {
    paths: ["req.headers.authorization", "password", "token", "jwt"],
    remove: true,
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
};

// Configuración del logger principal
export const logger = !isProd
  ? pino({
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: false, // Sin timestamp (como morgan dev)
          singleLine: true,
          // Ignorar campos innecesarios
          ignore: "pid,hostname,service",
          // Formato simple - pino-pretty se encarga del resto
          messageFormat: "{msg}",
        },
      },
    })
  : pino(baseConfig);

/**
 * Crea un child logger con contexto específico del módulo
 *
 * @param module - Nombre del módulo (ej: "AuthController", "Database", etc.)
 * @returns Logger con contexto del módulo
 *
 * @example
 * const logger = createLogger('UserController');
 * logger.info('Usuario creado exitosamente');
 * logger.error({ err, userId }, 'Error al actualizar usuario');
 */
export const createLogger = (module: string) => {
  return logger.child({ module });
};

/**
 * Logger para la base de datos
 */
export const dbLogger = createLogger("Database");

/**
 * Logger para autenticación
 */
export const authLogger = createLogger("Auth");

/**
 * Logger para el servidor HTTP
 */
export const serverLogger = createLogger("Server");

// Exportar para uso directo
export default logger;
