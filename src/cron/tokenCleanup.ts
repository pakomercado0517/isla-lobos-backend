import cron from 'node-cron';
import { cleanupExpiredTokens } from '../services/token-cleanup.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('TokenCleanupCron');

const schedule = '0 3 * * *';

export const initTokenCleanup = (): void => {
  logger.info('Iniciando cron job de limpieza de tokens');

  cron.schedule(schedule, async () => {
    logger.info('Ejecutando limpieza de tokens');
    const deleted = await cleanupExpiredTokens();
    logger.info({ tokensDeleted: deleted }, 'Limpieza de tokens finalizada');
  });
};
