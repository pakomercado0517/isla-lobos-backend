import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { createLogger } from "../utils/logger";
import { UserRole } from "../types";
import dashboardNotificationService from "../services/dashboardNotificationService";

const logger = createLogger("SocketIO");

/**
 * Configura e inicializa el servidor Socket.IO
 * @param httpServer - Servidor HTTP de Express
 * @returns Instancia de Socket.IO configurada
 */
export const initializeSocketIO = (httpServer: HttpServer): SocketIOServer => {
  const corsOrigin = process.env["CORS_ORIGIN"] || "http://localhost:3000";
  const allowedOrigins = corsOrigin.split(",").map((origin) => origin.trim());

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env["NODE_ENV"] === "production"
          ? allowedOrigins
          : (_origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
              // En desarrollo, permitir cualquier origen
              callback(null, true);
            },
      credentials: true,
      methods: ["GET", "POST"],
    },
    path: "/socket.io/",
  } as any);

  // Middleware de autenticación
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth["token"] ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        logger.warn("Conexión rechazada: token no proporcionado");
        return next(new Error("Token no proporcionado"));
      }

      const jwtSecret = process.env["JWT_SECRET"];
      if (!jwtSecret) {
        logger.error("JWT_SECRET no configurado");
        return next(new Error("Error de configuración del servidor"));
      }

      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        rol: UserRole;
        email: string;
        nombre: string;
      };

      // Solo permitir usuarios CONANP
      if (decoded.rol !== UserRole.CONANP) {
        logger.warn(
          { usuario_id: decoded.id, rol: decoded.rol },
          "Conexión rechazada: usuario no es CONANP"
        );
        return next(new Error("Solo usuarios CONANP pueden conectarse"));
      }

      // Almacenar datos del usuario en el socket
      socket.data.userId = decoded.id;
      socket.data.rol = decoded.rol;

      next();
    } catch (error) {
      logger.error({ error }, "Error en autenticación Socket.IO");
      next(new Error("Token inválido"));
    }
  });

  // Manejar conexiones
  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const rol = socket.data.rol as UserRole;

    logger.info(
      { userId, rol },
      "Usuario CONANP conectado al WebSocket"
    );

    // Unirse a la sala del usuario
    socket.join(`usuario_${userId}`);

    // También a la sala de todos los CONANP
    socket.join("conanp_todos");

    // Notificar al usuario que está conectado
    socket.emit("conectado", {
      mensaje: "Conectado al sistema de notificaciones",
      usuario_id: userId,
    });

    // Manejar desconexión
    socket.on("disconnect", (reason) => {
      logger.info(
        { userId, reason },
        "Usuario CONANP desconectado del WebSocket"
      );
    });

    // Manejar errores del socket
    socket.on("error", (error) => {
      logger.error({ error, userId }, "Error en socket del usuario");
    });
  });

  // Configurar el servicio de notificaciones con la instancia de Socket.IO
  dashboardNotificationService.setSocketIO(io);

  logger.info("Socket.IO inicializado correctamente");

  return io;
};

