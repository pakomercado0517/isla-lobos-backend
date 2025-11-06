import server from "./server";
import { serverLogger } from "./utils/logger";
import { initTokenCleanup } from "./cron/tokenCleanup";
import { createServer } from "http";
import { initializeSocketIO } from "./config/socket";

const PORT = process.env["PORT"] || 3000;

// Iniciar cron jobs
initTokenCleanup();

// Crear servidor HTTP para Socket.IO
const httpServer = createServer(server);

// Inicializar Socket.IO
initializeSocketIO(httpServer);

// Iniciar servidor
httpServer.listen(PORT, () => {
  serverLogger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  serverLogger.info(
    `📍 Environment: ${process.env["NODE_ENV"] || "development"}`
  );
  serverLogger.info(`🔗 URL: http://localhost:${PORT}`);
  serverLogger.info(`🔌 WebSocket habilitado en /socket.io/`);
});
