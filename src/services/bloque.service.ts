import { col, fn, Op, WhereOptions } from 'sequelize';
import sequelize from '../config/database';
import { AppError } from '../lib/AppError';
import Bloque from '../models/Bloque';
import Embarcacion from '../models/Embarcacion';
import PlantillaBloque from '../models/PlantillaBloque';
import Salida from '../models/Salida';
import { ApiResponse, EstadoBloque, EstadoSalida } from '../types';
import {
  BloqueByIdData,
  BloqueMutateData,
  BloqueResponse,
  BloquesListData,
  BloqueStatsData,
  CreateBloqueDTO,
  EmbarcacionOcupadaResponse,
  UpdateBloqueDTO,
} from '../types/bloque.types';
import { extraerSoloFecha, getTodayMexico } from '../utils/dateUtils';
import { createLogger } from '../utils/logger';

const logger = createLogger('BloqueService');

const ESTADOS_CANCELADOS = [
  EstadoSalida.CANCELADA,
  EstadoSalida.CANCELADA_POR_CLIMA,
  EstadoSalida.CANCELADA_CAPITARIA,
] as const;

const PLANTILLA_INCLUDE = {
  model: PlantillaBloque,
  as: 'plantillaBloque' as const,
  required: false,
};

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

type PlantillaBloquePlain = {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  destino: string;
  activa: boolean;
};

type BloquePlain = {
  id: string;
  nombre?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  capacidad_total?: number | null;
  capacidad_registrada?: number;
  estado: EstadoBloque;
  destino?: string | null;
  es_plantilla: boolean;
  plantilla_id?: string | null;
  fecha?: string | null;
  created_at?: Date;
  updated_at?: Date;
  plantillaBloque?: PlantillaBloquePlain;
};

type CapacidadAgregada = {
  bloque_id: string;
  total: string | number;
};

type SalidaConEmbarcacion = Salida & {
  embarcacion: Pick<Embarcacion, 'id' | 'nombre' | 'tipo' | 'capacidad' | 'estado'>;
};

const requireFecha = (fecha: string): string => {
  const fechaNormalizada = extraerSoloFecha(fecha);
  if (!fechaNormalizada || !DATE_YYYY_MM_DD.test(fechaNormalizada)) {
    throw new AppError('Formato de fecha inválido. Debe ser YYYY-MM-DD', 400);
  }
  return fechaNormalizada;
};

const minutosDeHora = (hora: string): number => {
  const [h, m] = hora.split(':');
  return Number(h) * 60 + Number(m || 0);
};

const toPlainBloque = (bloque: Bloque | BloquePlain): BloquePlain => {
  if ('toJSON' in bloque && typeof bloque.toJSON === 'function') {
    return bloque.toJSON() as BloquePlain;
  }
  return bloque;
};

const estadoPorCapacidad = (
  estado: EstadoBloque,
  registrada: number,
  total: number
): EstadoBloque => {
  if (
    estado === EstadoBloque.SUSPENDIDO_POR_CLIMA ||
    estado === EstadoBloque.CERRADO_CAPITANIA ||
    estado === EstadoBloque.INACTIVO
  ) {
    return estado;
  }
  if (registrada >= total) {
    return EstadoBloque.LLENO;
  }
  if (estado === EstadoBloque.LLENO && registrada < total) {
    return EstadoBloque.ACTIVO;
  }
  return estado;
};

const withTimestamps = (
  base: Omit<BloqueResponse, 'created_at' | 'updated_at' | 'embarcaciones_ocupadas'>,
  data: BloquePlain
): BloqueResponse => {
  const response: BloqueResponse = { ...base };
  if (data.created_at !== undefined) response.created_at = data.created_at;
  if (data.updated_at !== undefined) response.updated_at = data.updated_at;
  return response;
};

export const toBloqueResponse = (bloque: Bloque | BloquePlain): BloqueResponse => {
  const data = toPlainBloque(bloque);
  const fecha = data.fecha ? extraerSoloFecha(data.fecha) ?? null : null;

  if (data.es_plantilla && data.plantillaBloque) {
    const plantilla = data.plantillaBloque;
    const capacidadTotal = plantilla.capacidad_total || 0;
    const capacidadRegistrada = data.capacidad_registrada || 0;
    return withTimestamps(
      {
        id: data.id,
        nombre: plantilla.nombre,
        hora_inicio: plantilla.hora_inicio,
        hora_fin: plantilla.hora_fin,
        capacidad_total: capacidadTotal,
        capacidad_registrada: capacidadRegistrada,
        capacidad_disponible: capacidadTotal - capacidadRegistrada,
        estado: data.estado,
        destino: plantilla.destino,
        es_plantilla: true,
        plantilla_id: data.plantilla_id ?? null,
        fecha,
        plantilla_datos: {
          id: plantilla.id,
          nombre: plantilla.nombre,
          activa: plantilla.activa,
        },
      },
      data
    );
  }

  const capacidadTotal = data.capacidad_total || 0;
  const capacidadRegistrada = data.capacidad_registrada || 0;
  return withTimestamps(
    {
      id: data.id,
      nombre: data.nombre ?? null,
      hora_inicio: data.hora_inicio ?? null,
      hora_fin: data.hora_fin ?? null,
      capacidad_total: capacidadTotal,
      capacidad_registrada: capacidadRegistrada,
      capacidad_disponible: capacidadTotal - capacidadRegistrada,
      estado: data.estado,
      destino: data.destino ?? null,
      es_plantilla: false,
      plantilla_id: null,
      fecha,
    },
    data
  );
};

const findBloquesByFecha = async (fecha: string): Promise<Bloque[]> => {
  return Bloque.findAll({
    where: { fecha },
    include: [PLANTILLA_INCLUDE],
  });
};

const filtrarPorDestino = (bloques: Bloque[], destino?: string): Bloque[] => {
  if (!destino) return bloques;
  return bloques.filter((bloque) => toBloqueResponse(bloque).destino === destino);
};

const existeBloqueDuplicado = async (
  nombre: string,
  destino: string,
  fecha: string | null,
  excludeId?: string
): Promise<boolean> => {
  if (!fecha) {
    const where: WhereOptions = {
      nombre,
      destino,
      fecha: null,
      es_plantilla: true,
    };
    if (excludeId) {
      where['id'] = { [Op.ne]: excludeId };
    }
    const existente = await Bloque.findOne({ where });
    return Boolean(existente);
  }

  const where: WhereOptions = { fecha };
  if (excludeId) {
    where['id'] = { [Op.ne]: excludeId };
  }

  const bloques = await Bloque.findAll({
    where,
    include: [PLANTILLA_INCLUDE],
  });

  return bloques.some((bloque) => {
    const mapped = toBloqueResponse(bloque);
    return mapped.nombre === nombre && mapped.destino === destino;
  });
};

const capacidadPorBloque = async (
  bloqueIds: string[],
  fecha: string
): Promise<Map<string, number>> => {
  const mapa = new Map<string, number>();
  if (bloqueIds.length === 0) return mapa;

  const filas = (await Salida.findAll({
    attributes: ['bloque_id', [fn('SUM', col('numero_pasajeros')), 'total']],
    where: {
      bloque_id: { [Op.in]: bloqueIds },
      fecha,
      estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
    },
    group: ['bloque_id'],
    raw: true,
  })) as unknown as CapacidadAgregada[];

  for (const fila of filas) {
    mapa.set(fila.bloque_id, Number(fila.total) || 0);
  }
  return mapa;
};

const embarcacionesPorBloque = async (
  bloqueIds: string[],
  fecha: string,
  prestadorId?: string
): Promise<Map<string, EmbarcacionOcupadaResponse[]>> => {
  const mapa = new Map<string, EmbarcacionOcupadaResponse[]>();
  if (!prestadorId || bloqueIds.length === 0) return mapa;

  const salidas = (await Salida.findAll({
    where: {
      bloque_id: { [Op.in]: bloqueIds },
      prestador_id: prestadorId,
      fecha,
      estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
    },
    include: [
      {
        model: Embarcacion,
        as: 'embarcacion',
        where: { prestador_id: prestadorId },
        required: true,
        attributes: ['id', 'nombre', 'tipo', 'capacidad', 'estado'],
      },
    ],
    attributes: ['id', 'bloque_id', 'estado', 'numero_pasajeros', 'destino', 'observaciones'],
  })) as SalidaConEmbarcacion[];

  for (const salida of salidas) {
    const bloqueId = salida.bloque_id;
    if (!bloqueId) continue;

    const item: EmbarcacionOcupadaResponse = {
      id: salida.embarcacion.id,
      nombre: salida.embarcacion.nombre,
      tipo: salida.embarcacion.tipo,
      capacidad: salida.embarcacion.capacidad,
      estado: salida.embarcacion.estado,
      salida: {
        id: salida.id,
        estado: salida.estado,
        numero_pasajeros: salida.numero_pasajeros,
        destino: salida.destino,
        ...(salida.observaciones !== undefined ? { observaciones: salida.observaciones } : {}),
      },
    };

    const actuales = mapa.get(bloqueId) ?? [];
    actuales.push(item);
    mapa.set(bloqueId, actuales);
  }

  return mapa;
};

const aplicarCapacidad = (
  mapped: BloqueResponse,
  capacidadRegistrada: number
): BloqueResponse => {
  const capacidadTotal = mapped.capacidad_total || 0;
  return {
    ...mapped,
    capacidad_registrada: capacidadRegistrada,
    capacidad_disponible: capacidadTotal - capacidadRegistrada,
    estado: estadoPorCapacidad(mapped.estado, capacidadRegistrada, capacidadTotal),
  };
};

export const crearBloquesParaFecha = async (
  fecha: string,
  destino?: string,
  forzar = false
): Promise<void> => {
  const fechaNormalizada = requireFecha(fecha);
  const existentes = filtrarPorDestino(await findBloquesByFecha(fechaNormalizada), destino);

  if (existentes.length > 0 && !forzar) {
    return;
  }

  const wherePlantillas: WhereOptions = { activa: true };
  if (destino) {
    wherePlantillas['destino'] = destino;
  }

  const plantillas = await PlantillaBloque.findAll({
    where: wherePlantillas,
    order: [['hora_inicio', 'ASC']],
  });

  if (plantillas.length === 0) {
    logger.info(`No se encontraron plantillas activas para destino: ${destino || 'todos'}`);
    return;
  }

  await sequelize.transaction(async (transaction) => {
    if (forzar && existentes.length > 0) {
      await Bloque.destroy({
        where: { id: { [Op.in]: existentes.map((bloque) => bloque.id) } },
        transaction,
      });
      logger.info(`Bloques existentes eliminados para fecha ${fechaNormalizada}`);
    }

    await Bloque.bulkCreate(
      plantillas.map((plantilla) => ({
        capacidad_registrada: 0,
        estado: EstadoBloque.ACTIVO,
        es_plantilla: true,
        plantilla_id: plantilla.id,
        fecha: fechaNormalizada,
      })),
      { transaction }
    );
  });
};

export const getBloquesByFecha = async (
  fecha: string,
  destino: string | undefined,
  prestadorId: string
): Promise<ApiResponse<BloquesListData>> => {
  const fechaNormalizada = requireFecha(fecha);
  await crearBloquesParaFecha(fechaNormalizada, destino, false);

  const bloques = filtrarPorDestino(await findBloquesByFecha(fechaNormalizada), destino);
  const ids = bloques.map((bloque) => bloque.id);

  const [capacidadMap, embarcacionesMap] = await Promise.all([
    capacidadPorBloque(ids, fechaNormalizada),
    embarcacionesPorBloque(ids, fechaNormalizada, prestadorId),
  ]);

  const bloquesResponse = bloques
    .map((bloque) => {
      const mapped = toBloqueResponse(bloque);
      const conCapacidad = aplicarCapacidad(mapped, capacidadMap.get(bloque.id) ?? 0);
      return {
        ...conCapacidad,
        embarcaciones_ocupadas: embarcacionesMap.get(bloque.id) ?? [],
      };
    })
    .sort((a, b) => (a.hora_inicio || '99:99').localeCompare(b.hora_inicio || '99:99'));

  const mensaje =
    bloquesResponse.length > 0
      ? 'Bloques obtenidos exitosamente'
      : 'No hay bloques disponibles para esta fecha. Crea plantillas de bloques para generar horarios automáticamente.';

  return {
    status: 'success',
    message: mensaje,
    data: {
      bloques: bloquesResponse,
      total: bloquesResponse.length,
      fecha_consultada: fechaNormalizada,
      destino: destino || 'todos',
    },
  };
};

export const getBloqueById = async (id: string): Promise<ApiResponse<BloqueByIdData>> => {
  const bloque = await Bloque.findByPk(id, { include: [PLANTILLA_INCLUDE] });
  if (!bloque) throw new AppError('Bloque no encontrado', 404);

  let mapped = toBloqueResponse(bloque);

  if (mapped.fecha) {
    const fechaComparar = requireFecha(mapped.fecha);
    const capacidadRegistrada =
      (await Salida.sum('numero_pasajeros', {
        where: {
          bloque_id: bloque.id,
          fecha: fechaComparar,
          estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
        },
      })) || 0;
    mapped = aplicarCapacidad(mapped, Number(capacidadRegistrada));
  }

  return {
    status: 'success',
    message: 'Bloque obtenido exitosamente',
    data: { bloque: mapped },
  };
};

export const createBloque = async (dto: CreateBloqueDTO): Promise<ApiResponse<BloqueMutateData>> => {
  const fechaBloque = dto.fecha ? requireFecha(dto.fecha) : null;

  if (fechaBloque && fechaBloque < getTodayMexico()) {
    throw new AppError('No se puede crear un bloque para una fecha pasada', 400);
  }

  const duplicado = await existeBloqueDuplicado(dto.nombre, dto.destino, fechaBloque);
  if (duplicado) {
    throw new AppError(
      fechaBloque
        ? 'Ya existe un bloque con ese nombre para esa fecha y destino'
        : 'Ya existe una plantilla de bloque con ese nombre y destino',
      409
    );
  }

  const nuevoBloque = await Bloque.create({
    nombre: dto.nombre,
    hora_inicio: dto.hora_inicio,
    hora_fin: dto.hora_fin,
    capacidad_total: dto.capacidad_total,
    capacidad_registrada: 0,
    estado: dto.estado ?? EstadoBloque.ACTIVO,
    destino: dto.destino,
    es_plantilla: !fechaBloque,
    ...(fechaBloque ? { fecha: fechaBloque } : {}),
  });

  return {
    status: 'success',
    message: 'Bloque creado exitosamente',
    data: { bloque: toBloqueResponse(nuevoBloque) },
  };
};

export const updateBloque = async (
  id: string,
  dto: UpdateBloqueDTO
): Promise<ApiResponse<BloqueMutateData>> => {
  const bloque = await Bloque.findByPk(id, { include: [PLANTILLA_INCLUDE] });
  if (!bloque) throw new AppError('Bloque no encontrado', 404);

  const actual = toBloqueResponse(bloque);
  const fechaFinal = dto.fecha ? requireFecha(dto.fecha) : actual.fecha;

  if (dto.fecha && fechaFinal && fechaFinal < getTodayMexico()) {
    throw new AppError('No se puede cambiar un bloque a una fecha pasada', 400);
  }

  const horaInicio = dto.hora_inicio ?? actual.hora_inicio;
  const horaFin = dto.hora_fin ?? actual.hora_fin;
  if (horaInicio && horaFin && minutosDeHora(horaFin) <= minutosDeHora(horaInicio)) {
    throw new AppError('La hora de fin debe ser posterior a la hora de inicio', 400);
  }

  const nombreFinal = dto.nombre ?? actual.nombre;
  const destinoFinal = dto.destino ?? actual.destino;
  if (
    (dto.nombre || dto.destino || dto.fecha) &&
    nombreFinal &&
    destinoFinal &&
    (await existeBloqueDuplicado(nombreFinal, destinoFinal, fechaFinal ?? null, id))
  ) {
    throw new AppError('Ya existe otro bloque con ese nombre para esa fecha y destino', 409);
  }

  await bloque.update({
    ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
    ...(dto.hora_inicio !== undefined ? { hora_inicio: dto.hora_inicio } : {}),
    ...(dto.hora_fin !== undefined ? { hora_fin: dto.hora_fin } : {}),
    ...(dto.capacidad_total !== undefined ? { capacidad_total: dto.capacidad_total } : {}),
    ...(dto.estado !== undefined ? { estado: dto.estado } : {}),
    ...(dto.destino !== undefined ? { destino: dto.destino } : {}),
    ...(dto.es_plantilla !== undefined ? { es_plantilla: dto.es_plantilla } : {}),
    ...(fechaFinal && dto.fecha ? { fecha: fechaFinal } : {}),
  });

  await bloque.reload({ include: [PLANTILLA_INCLUDE] });

  return {
    status: 'success',
    message: 'Bloque actualizado exitosamente',
    data: { bloque: toBloqueResponse(bloque) },
  };
};

export const deleteBloque = async (id: string): Promise<ApiResponse> => {
  const bloque = await Bloque.findByPk(id);
  if (!bloque) throw new AppError('Bloque no encontrado', 404);

  const salidasActivas = await Salida.count({
    where: {
      bloque_id: id,
      estado: { [Op.notIn]: [...ESTADOS_CANCELADOS] },
    },
  });

  if (salidasActivas > 0) {
    throw new AppError('No se puede eliminar un bloque que tiene salidas registradas', 400);
  }

  if (bloque.fecha) {
    const fechaBloque = extraerSoloFecha(bloque.fecha);
    if (fechaBloque && fechaBloque < getTodayMexico()) {
      throw new AppError('No se puede eliminar un bloque de una fecha pasada', 400);
    }
  }

  await bloque.destroy();

  return {
    status: 'success',
    message: 'Bloque eliminado exitosamente',
  };
};

export const getBloqueStats = async (
  fechaInicio?: string,
  fechaFin?: string
): Promise<ApiResponse<BloqueStatsData>> => {
  const where: WhereOptions = {};
  if (fechaInicio && fechaFin) {
    const inicio = requireFecha(fechaInicio);
    const fin = requireFecha(fechaFin);
    where['fecha'] = { [Op.between]: [inicio, fin] };
  }

  const bloques = await Bloque.findAll({
    where,
    include: [PLANTILLA_INCLUDE],
    attributes: ['estado', 'capacidad_total', 'capacidad_registrada', 'es_plantilla', 'plantilla_id'],
  });

  let capacidadTotal = 0;
  let capacidadOcupada = 0;
  const porEstado = {
    activo: 0,
    lleno: 0,
    suspendido_por_clima: 0,
    cerrado_capitaria: 0,
  };

  for (const bloque of bloques) {
    const mapped = toBloqueResponse(bloque);
    capacidadTotal += mapped.capacidad_total;
    capacidadOcupada += mapped.capacidad_registrada;

    if (bloque.estado === EstadoBloque.ACTIVO) porEstado.activo += 1;
    if (bloque.estado === EstadoBloque.LLENO) porEstado.lleno += 1;
    if (bloque.estado === EstadoBloque.SUSPENDIDO_POR_CLIMA) porEstado.suspendido_por_clima += 1;
    if (bloque.estado === EstadoBloque.CERRADO_CAPITANIA) porEstado.cerrado_capitaria += 1;
  }

  const porcentajeOcupacion =
    capacidadTotal > 0 ? Math.round((capacidadOcupada / capacidadTotal) * 100) : 0;

  return {
    status: 'success',
    message: 'Estadísticas obtenidas exitosamente',
    data: {
      estadisticas: {
        total_bloques: bloques.length,
        por_estado: porEstado,
        capacidad: {
          total: capacidadTotal,
          ocupada: capacidadOcupada,
          disponible: capacidadTotal - capacidadOcupada,
          porcentaje_ocupacion: porcentajeOcupacion,
        },
      },
    },
  };
};
