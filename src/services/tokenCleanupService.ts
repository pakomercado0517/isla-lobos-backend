import { Op } from "sequelize";
import RefreshToken from "../models/RefreshToken";
import { createLogger } from "../utils/logger";

const logger = createLogger("TokenCleanupService");

/**
 * Servicio para limpiar tokens expirados
 */
class TokenCleanupService {
  /**
   * Elimina los refresh tokens expirados o revocados
   * Se ejecuta periódicamente mediante un cron job
   */
  public async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await RefreshToken.destroy({
        where: {
          [Op.or]: [
            { expiresAt: { [Op.lt]: new Date() } },
            { isRevoked: true },
          ],
        },
      });

      logger.info({ tokensDeleted: result }, "Tokens expirados eliminados");
    } catch (error) {
      logger.error({ err: error }, "Error al limpiar tokens expirados");
    }
  }
}

export default new TokenCleanupService();
