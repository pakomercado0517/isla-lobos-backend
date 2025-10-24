import cron from "node-cron";
import tokenCleanupService from "../services/tokenCleanupService";
import { createLogger } from "../utils/logger";

const logger = createLogger("TokenCleanupCron");

// Ejecutar la limpieza cada día a las 3 AM
const schedule = "0 3 * * *";

export const initTokenCleanup = (): void => {
  logger.info("Iniciando cron job de limpieza de tokens");

  cron.schedule(schedule, async () => {
    logger.info("Ejecutando limpieza de tokens");
    await tokenCleanupService.cleanupExpiredTokens();
  });
};
