import server from "./server";
import { serverLogger } from "./utils/logger";
import { initTokenCleanup } from "./cron/tokenCleanup";

const PORT = process.env["PORT"] || 3000;

// Iniciar cron jobs
initTokenCleanup();

server.listen(PORT, () => {
  serverLogger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  serverLogger.info(
    `📍 Environment: ${process.env["NODE_ENV"] || "development"}`
  );
  serverLogger.info(`🔗 URL: http://localhost:${PORT}`);
});
