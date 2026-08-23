import { Router, type Router as ExpressRouter } from 'express';
import BloqueController from '../controllers/bloque.controller';
import { authenticateToken, requireCONANP } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  getAllBloquesValidation,
  getBloqueByIdValidation,
  createBloqueValidation,
  updateBloqueValidation,
  deleteBloqueValidation,
  getBloqueStatsValidation,
} from '../validators/bloqueValidators';

const router: ExpressRouter = Router();

// Autenticado: GET / (prestador y CONANP). Mutaciones y stats: solo CONANP.
router.use(authenticateToken);

router.get('/', getAllBloquesValidation, handleValidationErrors, BloqueController.getAllBloques);

router.get(
  '/estadisticas',
  requireCONANP,
  getBloqueStatsValidation,
  handleValidationErrors,
  BloqueController.getBloqueStats
);

router.get('/:id', getBloqueByIdValidation, handleValidationErrors, BloqueController.getBloqueById);

router.post(
  '/',
  requireCONANP,
  createBloqueValidation,
  handleValidationErrors,
  BloqueController.createBloque
);

router.put(
  '/:id',
  requireCONANP,
  updateBloqueValidation,
  handleValidationErrors,
  BloqueController.updateBloque
);

router.delete(
  '/:id',
  requireCONANP,
  deleteBloqueValidation,
  handleValidationErrors,
  BloqueController.deleteBloque
);

export default router;
