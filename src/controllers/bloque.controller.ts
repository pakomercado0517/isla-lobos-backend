import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createBloque,
  deleteBloque,
  getBloqueById,
  getBloquesByFecha,
  getBloqueStats,
  updateBloque,
} from '../services/bloque.service';
import { CreateBloqueDTO, UpdateBloqueDTO } from '../types/bloque.types';

export class BloqueController {
  static getAllBloques = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fecha, destino } = req.query as { fecha: string; destino?: string };
    const response = await getBloquesByFecha(fecha, destino, req.user!.id);
    res.status(200).json(response);
  });

  static getBloqueById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getBloqueById(req.params['id'] as string);
    res.status(200).json(response);
  });

  static createBloque = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createBloque(req.body as CreateBloqueDTO);
    res.status(201).json(response);
  });

  static updateBloque = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateBloque(req.params['id'] as string, req.body as UpdateBloqueDTO);
    res.status(200).json(response);
  });

  static deleteBloque = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deleteBloque(req.params['id'] as string);
    res.status(200).json(response);
  });

  static getBloqueStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fecha_inicio, fecha_fin } = req.query as {
      fecha_inicio?: string;
      fecha_fin?: string;
    };
    const response = await getBloqueStats(fecha_inicio, fecha_fin);
    res.status(200).json(response);
  });
}

export default BloqueController;
