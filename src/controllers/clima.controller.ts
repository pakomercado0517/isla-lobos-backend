import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createCondicionService,
  deleteCondicionService,
  getAlertasService,
  getAllCondicionesService,
  getCondicionActualService,
  getCondicionByIdService,
  getEstadisticasService,
  getPrediccionService,
  sincronizarSMNService,
  updateCondicionService,
} from '../services/clima.service';
import {
  CreateCondicionDTO,
  GetAllCondicionesQuery,
  GetEstadisticasQuery,
  GetPrediccionQuery,
  SincronizarSMNDTO,
  UpdateCondicionDTO,
} from '../types/clima.types';

/**
 * ClimaController - Gestión de condiciones meteorológicas
 *
 * Funcionalidades:
 * - CRUD completo de condiciones meteorológicas
 * - Predicciones y alertas
 * - Estado del puerto
 * - Historial meteorológico
 * - Integración con sistema de salidas
 */
export class ClimaController {
  static getAllCondiciones = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAllCondicionesService(req.query as unknown as GetAllCondicionesQuery);
    res.status(200).json(response);
  });

  static getCondicionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getCondicionByIdService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static createCondicion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createCondicionService(req.body as CreateCondicionDTO);
    res.status(201).json(response);
  });

  static updateCondicion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateCondicionService(
      req.params['id'] as string,
      req.body as UpdateCondicionDTO
    );
    res.status(200).json(response);
  });

  static deleteCondicion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deleteCondicionService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static getCondicionActual = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getCondicionActualService();
    res.status(200).json(response);
  });

  static getPrediccion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { dias } = req.query as unknown as GetPrediccionQuery;
    const response = await getPrediccionService(dias);
    res.status(200).json(response);
  });

  static getAlertas = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getAlertasService();
    res.status(200).json(response);
  });

  static getEstadisticas = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getEstadisticasService(req.query as unknown as GetEstadisticasQuery);
    res.status(200).json(response);
  });

  static sincronizarSMN = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await sincronizarSMNService(req.body as SincronizarSMNDTO);
    res.status(200).json(response);
  });
}

export default ClimaController;
