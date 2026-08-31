import { col, fn, Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import Bloque from '../models/Bloque';
import PlantillaBloque from '../models/PlantillaBloque';
import { ApiResponse, EstadoBloque } from '../types';
import {
  CreatePlantillaBloqueDTO,
  EstadisticaPorEstadoAgregado,
  EstadisticaPorEstadoDTO,
  GetEstadisticasPlantillaResponse,
  GetPlantillaByIdResponse,
  GetPlantillasQuery,
  GetPlantillasResponse,
  PlantillaBloqueDTO,
  UpdatePlantillaBloqueDTO,
  UpdatePlantillaResponse,
} from '../types/plantilla-bloque.types';
import { extraerSoloFechaUTC, getTodayMexico } from '../utils/dateUtils';
import { createLogger } from '../utils/logger';
import { crearBloquesParaFecha } from './bloque.service';

const logger = createLogger('PlantillaBloqueService');

const BLOQUES_DERIVADOS_INCLUDE = {
  model: Bloque,
  as: 'bloques_derivados' as const,
  where: { es_plantilla: true },
  required: false as const,
  attributes: ['id', 'fecha', 'estado', 'capacidad_registrada'],
};

const addDaysYmd = (fecha: string, days: number): string => {
  const [year, month, day] = fecha.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return extraerSoloFechaUTC(date) as string;
};

const toPlantillaDTO = (plantilla: PlantillaBloque): PlantillaBloqueDTO =>
  plantilla.toJSON() as PlantillaBloqueDTO;

const requirePlantilla = async (id: string): Promise<PlantillaBloque> => {
  const plantilla = await PlantillaBloque.findByPk(id);
  if (!plantilla) throw new AppError('Plantilla no encontrada', 404);
  return plantilla;
};

const assertHoraFinMayor = (horaInicio: string, horaFin: string): void => {
  if (horaFin <= horaInicio) {
    throw new AppError('La hora de fin debe ser mayor que la hora de inicio', 400);
  }
};

const assertNombreDestinoUnico = async (
  nombre: string,
  destino: string,
  excludeId?: string
): Promise<void> => {
  const where: WhereOptions = { nombre, destino };
  if (excludeId) where['id'] = { [Op.ne]: excludeId };

  const existente = await PlantillaBloque.findOne({ where, attributes: ['id'] });
  if (!existente) return;

  throw new AppError(
    excludeId
      ? 'Ya existe otra plantilla con ese nombre y destino'
      : 'Ya existe una plantilla con ese nombre y destino',
    409
  );
};

const countBloquesDerivados = (plantillaId: string): Promise<number> =>
  Bloque.count({
    where: { plantilla_id: plantillaId, es_plantilla: true },
  });

const recrearBloquesHoyManana = async (destino: string, nombrePlantilla: string): Promise<void> => {
  try {
    const hoy = getTodayMexico();
    const manana = addDaysYmd(hoy, 1);
    await crearBloquesParaFecha(hoy, destino, true);
    await crearBloquesParaFecha(manana, destino, true);
    logger.info(`Bloques recreados para hoy y mañana después de crear plantilla: ${nombrePlantilla}`);
  } catch (recreacionError) {
    logger.warn(
      { err: recreacionError },
      'Error al recrear bloques después de crear plantilla (no crítico)'
    );
  }
};

export const getAllPlantillasService = async (
  query: GetPlantillasQuery
): Promise<ApiResponse<GetPlantillasResponse>> => {
  const where: WhereOptions = {};
  if (query.destino) where['destino'] = query.destino;
  if (query.activa !== undefined) where['activa'] = query.activa;

  const plantillas = await PlantillaBloque.findAll({
    where,
    order: [
      ['destino', 'ASC'],
      ['hora_inicio', 'ASC'],
    ],
  });

  return {
    status: 'success',
    message: 'Plantillas obtenidas exitosamente',
    data: {
      plantillas: plantillas.map(toPlantillaDTO),
    },
  };
};

export const getPlantillaByIdService = async (
  id: string
): Promise<ApiResponse<GetPlantillaByIdResponse>> => {
  const plantilla = await PlantillaBloque.findByPk(id, {
    include: [BLOQUES_DERIVADOS_INCLUDE],
  });
  if (!plantilla) throw new AppError('Plantilla no encontrada', 404);

  return {
    status: 'success',
    message: 'Plantilla obtenida exitosamente',
    data: { plantilla: toPlantillaDTO(plantilla) },
  };
};

export const createPlantillaService = async (
  body: CreatePlantillaBloqueDTO
): Promise<ApiResponse<GetPlantillaByIdResponse>> => {
  await assertNombreDestinoUnico(body.nombre, body.destino);
  assertHoraFinMayor(body.hora_inicio, body.hora_fin);

  const nuevaPlantilla = await PlantillaBloque.create({
    nombre: body.nombre,
    hora_inicio: body.hora_inicio,
    hora_fin: body.hora_fin,
    capacidad_total: body.capacidad_total,
    destino: body.destino,
    activa: body.activa ?? true,
  });

  await recrearBloquesHoyManana(body.destino, nuevaPlantilla.nombre);

  return {
    status: 'success',
    message: 'Plantilla creada exitosamente y bloques actualizados',
    data: { plantilla: toPlantillaDTO(nuevaPlantilla) },
  };
};

export const updatePlantillaService = async (
  id: string,
  body: UpdatePlantillaBloqueDTO
): Promise<ApiResponse<UpdatePlantillaResponse>> => {
  const plantilla = await requirePlantilla(id);
  const nombreFinal = body.nombre ?? plantilla.nombre;
  const destinoFinal = body.destino ?? plantilla.destino;

  if (body.nombre || body.destino) {
    await assertNombreDestinoUnico(nombreFinal, destinoFinal, id);
  }

  assertHoraFinMayor(body.hora_inicio ?? plantilla.hora_inicio, body.hora_fin ?? plantilla.hora_fin);

  await plantilla.update({
    ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
    ...(body.hora_inicio !== undefined ? { hora_inicio: body.hora_inicio } : {}),
    ...(body.hora_fin !== undefined ? { hora_fin: body.hora_fin } : {}),
    ...(body.capacidad_total !== undefined ? { capacidad_total: body.capacidad_total } : {}),
    ...(body.destino !== undefined ? { destino: body.destino } : {}),
    ...(body.activa !== undefined ? { activa: body.activa } : {}),
  });

  const bloquesAfectados = await countBloquesDerivados(id);

  return {
    status: 'success',
    message: `Plantilla actualizada exitosamente. ${bloquesAfectados} bloques derivados se verán afectados automáticamente`,
    data: {
      plantilla: toPlantillaDTO(plantilla),
      bloques_afectados: bloquesAfectados,
    },
  };
};

export const deletePlantillaService = async (id: string): Promise<ApiResponse<undefined>> => {
  const plantilla = await requirePlantilla(id);
  const bloquesDerivados = await countBloquesDerivados(id);

  if (bloquesDerivados > 0) {
    throw new AppError(
      `No se puede eliminar la plantilla porque tiene ${bloquesDerivados} bloques derivados. Elimine o actualice los bloques primero.`,
      400
    );
  }

  await plantilla.destroy();

  return {
    status: 'success',
    message: 'Plantilla eliminada exitosamente',
  };
};

export const getEstadisticasPlantillaService = async (
  id: string
): Promise<ApiResponse<GetEstadisticasPlantillaResponse>> => {
  const plantilla = await requirePlantilla(id);
  const whereDerivados = { plantilla_id: id, es_plantilla: true };

  const [estadisticasRaw, totalBloques] = await Promise.all([
    Bloque.findAll({
      where: whereDerivados,
      attributes: [
        'estado',
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('SUM', col('capacidad_registrada')), 'capacidad_ocupada'],
      ],
      group: ['estado'],
      raw: true,
    }),
    Bloque.count({ where: whereDerivados }),
  ]);

  const estadisticas_por_estado: EstadisticaPorEstadoDTO[] = (
    estadisticasRaw as unknown as EstadisticaPorEstadoAgregado[]
  ).map((row) => ({
    estado: row.estado as EstadoBloque,
    cantidad: Number(row.cantidad),
    capacidad_ocupada: Number(row.capacidad_ocupada ?? 0),
  }));

  return {
    status: 'success',
    message: 'Estadísticas obtenidas exitosamente',
    data: {
      plantilla: toPlantillaDTO(plantilla),
      total_bloques_derivados: totalBloques,
      estadisticas_por_estado,
    },
  };
};
