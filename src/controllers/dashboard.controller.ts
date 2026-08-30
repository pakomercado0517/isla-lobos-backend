import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  getAlertasSistemaService,
  getEstadisticasService,
  getEstadoEmbarcacionesService,
  getEstadoPermisosService,
  getOcupacionService,
  getResumenClimaService,
} from '../services/dashboard.service';
import { GetOcupacionQuery, GetResumenClimaQuery } from '../types/dashboard.types';

/**
 * DashboardController - Vista general del sistema
 *
 * Funcionalidades:
 * - Estadísticas generales del sistema
 * - Ocupación por día y bloque
 * - Estado de embarcaciones
 * - Estado de permisos
 * - Resumen meteorológico
 * - Alertas del sistema
 */
class DashboardController {
  static getEstadisticas = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getEstadisticasService();
    res.status(200).json(response);
  });

  static getOcupacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getOcupacionService(req.query as unknown as GetOcupacionQuery);
    res.status(200).json(response);
  });

  static getEstadoEmbarcaciones = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getEstadoEmbarcacionesService();
    res.status(200).json(response);
  });

  static getEstadoPermisos = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getEstadoPermisosService();
    res.status(200).json(response);
  });

  static getResumenClima = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getResumenClimaService(req.query as unknown as GetResumenClimaQuery);
    res.status(200).json(response);
  });

  static getAlertasSistema = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getAlertasSistemaService();
    res.status(200).json(response);
  });
}

export default DashboardController;
