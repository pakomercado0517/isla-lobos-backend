import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  obtenerAlertasService,
  obtenerEstadisticasService,
  reporteUtilizacionService,
  reporteVentasService,
} from '../services/estadisticas-brazaletes.service';
import {
  EstadisticasQuery,
  ReporteUtilizacionQuery,
  ReporteVentasQuery,
} from '../types/brazalete.types';

class EstadisticasBrazaleteController {
  static obtenerEstadisticas = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await obtenerEstadisticasService(
      req.query as unknown as EstadisticasQuery
    );
    res.status(200).json(response);
  });

  static obtenerAlertas = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await obtenerAlertasService();
    res.status(200).json(response);
  });

  static reporteVentas = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await reporteVentasService(req.query as unknown as ReporteVentasQuery);
    res.status(200).json(response);
  });

  static reporteUtilizacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await reporteUtilizacionService(
      req.query as unknown as ReporteUtilizacionQuery
    );
    res.status(200).json(response);
  });
}

export default EstadisticasBrazaleteController;
