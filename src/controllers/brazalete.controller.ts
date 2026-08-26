import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  crearLoteService,
  listarLotesService,
  obtenerInventarioService,
  venderBrazaletesService,
} from '../services/brazalete.service';
import {
  actualizarUsoBrazaletesService,
  asignarBrazaletesService,
  buscarBrazaletesService,
  obtenerBrazaletesPrestadorService,
  obtenerBrazaletesSalidaService,
  registrarUsoBrazaletesService,
} from '../services/brazaletes-prestadores.service';
import {
  ActualizarUsoDTO,
  AsignarBrazaletesDTO,
  BrazaleteActor,
  BuscarBrazaletesQueries,
  CrearLoteDTO,
  ListarLotesQuery,
  UsarBrazaletesDTO,
  VenderBrazaletesDTO,
} from '../types/brazalete.types';

const actorFrom = (req: AuthRequest): BrazaleteActor => ({
  id: req.user!.id,
  rol: req.user!.rol,
});

export class BrazaleteController {
  static obtenerInventario = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await obtenerInventarioService();
    res.status(200).json(response);
  });

  static crearLote = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await crearLoteService(req.body as CrearLoteDTO);
    res.status(201).json(response);
  });

  static listarLotes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as unknown as ListarLotesQuery;
    const response = await listarLotesService({
      tipo: query.tipo,
      estado: query.estado,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });
    res.status(200).json(response);
  });

  static venderBrazaletes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await venderBrazaletesService(req.body as VenderBrazaletesDTO);
    res.status(201).json(response);
  });

  static obtenerBrazaletesPrestador = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await obtenerBrazaletesPrestadorService(
      actorFrom(req),
      req.params['id'] as string
    );
    res.status(200).json(response);
  });

  static obtenerMisBrazaletes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await obtenerBrazaletesPrestadorService(actorFrom(req), req.user!.id);
    res.status(200).json(response);
  });

  static buscarBrazaletes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await buscarBrazaletesService(
      actorFrom(req),
      req.query as unknown as BuscarBrazaletesQueries
    );
    res.status(200).json(response);
  });

  static asignarBrazaletes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await asignarBrazaletesService(
      actorFrom(req),
      req.body as AsignarBrazaletesDTO
    );
    res.status(201).json(response);
  });

  static registrarUso = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await registrarUsoBrazaletesService(
      actorFrom(req),
      req.body as UsarBrazaletesDTO
    );
    res.status(201).json(response);
  });

  static obtenerBrazaletesSalida = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await obtenerBrazaletesSalidaService(
      actorFrom(req),
      req.params['id'] as string
    );
    res.status(200).json(response);
  });

  static actualizarUso = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await actualizarUsoBrazaletesService(
      actorFrom(req),
      req.body as ActualizarUsoDTO
    );
    res.status(200).json(response);
  });
}

export default BrazaleteController;
