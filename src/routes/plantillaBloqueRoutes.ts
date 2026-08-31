import { Router, type Router as ExpressRouter } from 'express';
import PlantillaBloqueController from '../controllers/plantilla-bloque.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validation';
import {
  createPlantillaValidation,
  deletePlantillaValidation,
  getAllPlantillasValidation,
  getEstadisticasPlantillaValidation,
  getPlantillaByIdValidation,
  updatePlantillaValidation,
} from '../validators/plantillaBloqueValidators';

const router: ExpressRouter = Router();

router.use(authMiddleware);

router.get(
  '/',
  getAllPlantillasValidation,
  handleValidationErrors,
  PlantillaBloqueController.getAllPlantillas
);

router.get(
  '/:id/estadisticas',
  getEstadisticasPlantillaValidation,
  handleValidationErrors,
  PlantillaBloqueController.getEstadisticasPlantilla
);

router.get(
  '/:id',
  getPlantillaByIdValidation,
  handleValidationErrors,
  PlantillaBloqueController.getPlantillaById
);

router.post(
  '/',
  createPlantillaValidation,
  handleValidationErrors,
  PlantillaBloqueController.createPlantilla
);

router.put(
  '/:id',
  updatePlantillaValidation,
  handleValidationErrors,
  PlantillaBloqueController.updatePlantilla
);

router.delete(
  '/:id',
  deletePlantillaValidation,
  handleValidationErrors,
  PlantillaBloqueController.deletePlantilla
);

export default router;
