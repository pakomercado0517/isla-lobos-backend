import pino from "pino";
import pinoHttp from "pino-http";
import { logger } from "./logger";
import { randomUUID } from "crypto";
import { IncomingMessage } from "http";

/**
 * Middleware HTTP Logger con formato Morgan Dev
 *
 * Formato: METHOD /path STATUS TIME - SIZE
 * Ejemplo: GET /api/users 200 45.2 ms - 1234
 *
 * Características:
 * - Request ID único por petición
 * - Logs limpios estilo morgan("dev")
 * - Colores automáticos según status code
 * - Ignora health checks
 */
export const httpLogger = pinoHttp({
  logger,

  // Generar Request ID único
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id =
      (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },

  // Serializers optimizados para formato morgan
  serializers: {
    req(req: IncomingMessage) {
      return {
        method: req.method,
        url: req.url,
        id: (req as any).id,
      };
    },
    res(res: any) {
      // El res aquí puede ser un objeto plano o ServerResponse
      return {
        statusCode: res.statusCode,
        contentLength:
          res.contentLength || res.getHeader?.("content-length") || "-",
      };
    },
    err: pino.stdSerializers.err,
  },

  // Ignorar health checks y endpoints de monitoreo
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url === "/ready",
  },

  // Nivel de log según status code
  customLogLevel: (_req, res, err) => {
    if (err) return "error";
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  // Mensaje estilo Morgan Dev: METHOD /path STATUS TIME - SIZE
  customSuccessMessage: (req, res) => {
    const method = req.method || "GET";
    const url = req.url || "/";
    const status = res.statusCode || 200;
    const contentLength = res.getHeader("content-length") || "-";
    const responseTime = (res as any).responseTime || 0;
    return `${method} ${url} ${status} ${responseTime.toFixed(
      1
    )} ms - ${contentLength}`;
  },

  customErrorMessage: (req, res, err) => {
    const method = req.method || "GET";
    const url = req.url || "/";
    const status = res.statusCode || 500;
    const contentLength = res.getHeader("content-length") || "-";
    const responseTime = (res as any).responseTime || 0;
    return `${method} ${url} ${status} ${responseTime.toFixed(
      1
    )} ms - ${contentLength} - ${err.message}`;
  },
});
