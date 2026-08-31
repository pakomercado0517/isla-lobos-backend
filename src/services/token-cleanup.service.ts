import { Op } from 'sequelize';
import RefreshToken from '../models/RefreshToken';
import { createLogger } from '../utils/logger';

const logger = createLogger('TokenCleanupService');

export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const deleted = await RefreshToken.destroy({
      where: {
        [Op.or]: [{ expiresAt: { [Op.lt]: new Date() } }, { isRevoked: true }],
      },
    });

    logger.info({ tokensDeleted: deleted }, 'Tokens expirados eliminados');
    return deleted;
  } catch (error) {
    logger.error({ err: error }, 'Error al limpiar tokens expirados');
    return 0;
  }
};
