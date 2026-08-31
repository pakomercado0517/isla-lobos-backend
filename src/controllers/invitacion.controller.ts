import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  createInvitacionService,
  deleteInvitacionService,
  getAllInvitacionesService,
  getEstadisticasInvitacionesService,
  getInvitacionByIdService,
  updateInvitacionService,
  usarInvitacionService,
  validarCodigoService,
} from '../services/invitacion.service';
import {
  CreateInvitacionDTO,
  GetInvitacionesQuery,
  UpdateInvitacionDTO,
  UsarInvitacionDTO,
} from '../types/invitacion.types';

class InvitacionController {
  static getAllInvitaciones = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAllInvitacionesService(
      req.query as unknown as GetInvitacionesQuery
    );
    res.status(200).json(response);
  });

  static getInvitacionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getInvitacionByIdService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static createInvitacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createInvitacionService(
      req.body as CreateInvitacionDTO,
      req.user!.id
    );
    res.status(201).json(response);
  });

  static updateInvitacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateInvitacionService(
      req.params['id'] as string,
      req.body as UpdateInvitacionDTO
    );
    res.status(200).json(response);
  });

  static deleteInvitacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deleteInvitacionService(req.params['id'] as string);
    res.status(200).json(response);
  });

  static validarCodigo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await validarCodigoService((req.body as { codigo: string }).codigo);
    res.status(200).json(response);
  });

  static validarCodigoPorGet = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await validarCodigoService(req.params['codigo'] as string);
    res.status(200).json(response);
  });

  static usarInvitacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = req.body as UsarInvitacionDTO;
    const response = await usarInvitacionService(req.params['id'] as string, body.email);
    res.status(200).json(response);
  });

  static getEstadisticas = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getEstadisticasInvitacionesService();
    res.status(200).json(response);
  });
}

export default InvitacionController;
