import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { testConnection } from "./config/database";
import { syncModels } from "./models";
import apiRoutes from "./routes";
import { serverLogger } from "./utils/logger";
import { httpLogger } from "./utils/http-logger";
dotenv.config();

const app = express();

// Middleware de seguridad
// Configurar Helmet para permitir cookies cross-domain
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Permitir recursos cross-origin
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin
  })
);

// Configuración de CORS para producción cross-domain
const corsOrigin = process.env["CORS_ORIGIN"] || "http://localhost:3000";
const corsOrigins = corsOrigin.split(",").map((origin) => origin.trim()); // Soporte para múltiples orígenes separados por coma

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (mobile apps, Postman, etc.) solo en desarrollo
      if (!origin && process.env["NODE_ENV"] !== "production") {
        return callback(null, true);
      }
      // Verificar si el origen está en la lista permitida
      if (origin && corsOrigins.includes(origin)) {
        callback(null, true);
      } else if (origin && process.env["NODE_ENV"] !== "production") {
        // En desarrollo, permitir cualquier origen
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true, // Necesario para enviar/recibir cookies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"], // Exponer headers de cookies para debugging
  })
);

// Configuración de trust proxy para proxies reversos (nginx, load balancers, etc.)
// Necesario para que express-rate-limit identifique correctamente las IPs de los clientes
// cuando la aplicación está detrás de un proxy que envía el header X-Forwarded-For
app.set("trust proxy", true);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.",
});
app.use(
  process.env["NODE_ENV"] === "production"
    ? limiter
    : (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction
      ) => next()
);

// Middleware de logging HTTP - Estilo Morgan Dev
// Formato: METHOD /path STATUS TIME - SIZE
app.use(httpLogger);

// Middleware para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware para cookies
app.use(cookieParser());

// Función para inicializar la base de datos
const initializeDatabase = async (): Promise<void> => {
  try {
    await testConnection();
    await syncModels();
    serverLogger.info("🚀 Base de datos inicializada correctamente");
  } catch (error) {
    serverLogger.error(
      { err: error },
      "❌ Error al inicializar la base de datos"
    );
    process.exit(1);
  }
};

// Inicializar la base de datos al arrancar el servidor
initializeDatabase();

// Ruta de prueba
app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
app.use("/api", apiRoutes);

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({
    status: "ERROR",
    message: "Ruta no encontrada",
  });
});

// Manejo global de errores
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    serverLogger.error({ err, stack: err.stack }, "Error interno del servidor");
    res.status(500).json({
      status: "ERROR",
      message: "Error interno del servidor",
      ...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
    });
  }
);

export default app;
