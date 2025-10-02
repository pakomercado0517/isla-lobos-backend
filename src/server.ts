import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { testConnection } from "./config/database";
import { syncModels } from "./models";
import apiRoutes from "./routes";
dotenv.config();

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.",
});
app.use(limiter);

// Middleware de logging
app.use(morgan("dev"));

// Middleware para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Función para inicializar la base de datos
const initializeDatabase = async (): Promise<void> => {
  try {
    await testConnection();
    await syncModels();
    console.log("🚀 Base de datos inicializada correctamente");
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
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
    console.error(err.stack);
    res.status(500).json({
      status: "ERROR",
      message: "Error interno del servidor",
      ...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
    });
  }
);

export default app;
