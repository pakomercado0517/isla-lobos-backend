import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  cancelarSalidaService,
  createSalidaService,
  getAllSalidasService,
  getMisSalidasService,
  getSalidaByIdService,
  getSalidaStatsService,
  updateSalidaService,
} from '../services/salida.service';
import {
  CancelarSalidaDTO,
  CreateSalidaDTO,
  GetSalidaStatsQuery,
  GetSalidasQuery,
  UpdateSalidaDTO,
} from '../types/salida.types';

class SalidaController {
  static getAllSalidas = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAllSalidasService(req.query as unknown as GetSalidasQuery);
    res.status(200).json(response);
  });

  static getSalidaById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getSalidaByIdService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static createSalida = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createSalidaService(req.body as CreateSalidaDTO, req.user!);
    res.status(201).json(response);
  });

  static updateSalida = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateSalidaService(
      req.params['id'] as string,
      req.body as UpdateSalidaDTO
    );
    res.status(200).json(response);
  });

  static cancelarSalida = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await cancelarSalidaService(
      req.params['id'] as string,
      req.body as CancelarSalidaDTO
    );
    res.status(200).json(response);
  });

  static getMisSalidas = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getMisSalidasService(
      req.user!.id,
      req.query as unknown as GetSalidasQuery
    );
    res.status(200).json(response);
  });

  static getSalidaStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getSalidaStatsService(req.query as unknown as GetSalidaStatsQuery);
    res.status(200).json(response);
  });
}

export default SalidaController;
