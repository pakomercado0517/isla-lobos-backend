import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createEmbarcacionService,
  deleteEmbarcacionService,
  getAllEmbarcacionesService,
  getEmbarcacionByIdService,
  getEmbarcacionStatsService,
  getMisEmbarcacionesService,
  updateEmbarcacionService,
} from '../services/embarcacion.service';
import {
  CreateEmbarcacionDTO,
  GetEmbarcacionesQuery,
  UpdateEmbarcacionDTO,
} from '../types/embarcacion.types';

/**
 * EmbarcacionController - Gestión de embarcaciones
 *
 * Funcionalidades:
 * - CRUD completo de embarcaciones
 * - Filtros por estado, tipo y prestador
 * - Validaciones de negocio
 * - Gestión de capacidad
 */
class EmbarcacionController {
  static getAllEmbarcaciones = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAllEmbarcacionesService(req.query as unknown as GetEmbarcacionesQuery);
    res.status(200).json(response);
  });

  static getEmbarcacionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getEmbarcacionByIdService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static createEmbarcacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createEmbarcacionService(req.body as CreateEmbarcacionDTO, req.user!);
    res.status(201).json(response);
  });

  static updateEmbarcacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateEmbarcacionService(
      req.params['id'] as string,
      req.body as UpdateEmbarcacionDTO
    );
    res.status(200).json(response);
  });

  static deleteEmbarcacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deleteEmbarcacionService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static getMisEmbarcaciones = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getMisEmbarcacionesService(
      req.user!.id,
      req.query as unknown as GetEmbarcacionesQuery
    );
    res.status(200).json(response);
  });

  static getEmbarcacionStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as { prestador_id?: string };
    const response = await getEmbarcacionStatsService(query.prestador_id);
    res.status(200).json(response);
  });
}

export default EmbarcacionController;
