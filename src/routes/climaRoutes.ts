import { Router, type Router as ExpressRouter } from 'express';
import ClimaController from '../controllers/clima.controller';
import { authenticateToken, requireCONANP } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validation';
import {
  createCondicionValidation,
  deleteCondicionValidation,
  getAllCondicionesValidation,
  getCondicionByIdValidation,
  getEstadisticasValidation,
  getPrediccionValidation,
  sincronizarSMNValidation,
  updateCondicionValidation,
} from '../validators/climaValidators';

const router: ExpressRouter = Router();

router.use(authenticateToken);

router.get(
  '/',
  getAllCondicionesValidation,
  handleValidationErrors,
  ClimaController.getAllCondiciones
);

router.get('/actual', ClimaController.getCondicionActual);

router.get(
  '/prediccion',
  getPrediccionValidation,
  handleValidationErrors,
  ClimaController.getPrediccion
);

router.get('/alertas', ClimaController.getAlertas);

router.get(
  '/estadisticas',
  requireCONANP,
  getEstadisticasValidation,
  handleValidationErrors,
  ClimaController.getEstadisticas
);

router.post(
  '/sincronizar-smn',
  requireCONANP,
  sincronizarSMNValidation,
  handleValidationErrors,
  ClimaController.sincronizarSMN
);

router.get(
  '/:id',
  getCondicionByIdValidation,
  handleValidationErrors,
  ClimaController.getCondicionById
);

router.post(
  '/',
  requireCONANP,
  createCondicionValidation,
  handleValidationErrors,
  ClimaController.createCondicion
);

router.put(
  '/:id',
  requireCONANP,
  updateCondicionValidation,
  handleValidationErrors,
  ClimaController.updateCondicion
);

router.delete(
  '/:id',
  requireCONANP,
  deleteCondicionValidation,
  handleValidationErrors,
  ClimaController.deleteCondicion
);

export default router;
