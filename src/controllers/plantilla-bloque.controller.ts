import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createPlantillaService,
  deletePlantillaService,
  getAllPlantillasService,
  getEstadisticasPlantillaService,
  getPlantillaByIdService,
  updatePlantillaService,
} from '../services/plantilla-bloque.service';
import {
  CreatePlantillaBloqueDTO,
  GetPlantillasQuery,
  UpdatePlantillaBloqueDTO,
} from '../types/plantilla-bloque.types';

class PlantillaBloqueController {
  static getAllPlantillas = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAllPlantillasService(req.query as unknown as GetPlantillasQuery);
    res.status(200).json(response);
  });

  static getPlantillaById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getPlantillaByIdService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static createPlantilla = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createPlantillaService(req.body as CreatePlantillaBloqueDTO);
    res.status(201).json(response);
  });

  static updatePlantilla = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updatePlantillaService(
      req.params['id'] as string,
      req.body as UpdatePlantillaBloqueDTO
    );
    res.status(200).json(response);
  });

  static deletePlantilla = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deletePlantillaService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static getEstadisticasPlantilla = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getEstadisticasPlantillaService(req.params['id'] as string);
    res.status(200).json(response);
  });
}

export default PlantillaBloqueController;
