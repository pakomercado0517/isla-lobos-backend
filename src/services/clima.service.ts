import { col, fn, Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import { CondicionMeteorologica, sequelize } from '../models';
import { ApiResponse, EstadoPuerto } from '../types';
import {
  AlertaMeteorologicaDTO,
  CondicionMeteorologicaResponse,
  CondicionSMNPayload,
  CreateCondicionDTO,
  GetAlertasResponse,
  GetAllCondicionesQuery,
  GetAllCondicionesResponse,
  GetCondicionActualResponse,
  GetEstadisticasDTO,
  GetEstadisticasQuery,
  GetEstadisticasResponse,
  GetPrediccionDTO,
  GetPrediccionResponse,
  SincronizarSMNDTO,
  SincronizarSMNResponse,
  UpdateCondicionDTO,
  VisibilidadValue,
} from '../types/clima.types';
import { getCurrentMexicoTime } from '../utils/dateUtils';
import logger from '../utils/logger';
import {
  convertirACondicionMeteorologica,
  filtrarPorIslaLobos,
  getPronosticoHorario,
} from './smn.service';

interface EstadoPuertoAgregado {
  estado_puerto: EstadoPuerto;
  total: string | number;
}

const hourBucketMs = (fecha: Date): number => {
  const bucket = new Date(fecha);
  bucket.setMinutes(0, 0, 0);
  return bucket.getTime();
};

const toCondicionResponse = (condicion: CondicionMeteorologica): CondicionMeteorologicaResponse =>
  condicion.toJSON() as CondicionMeteorologicaResponse;

const toCondicionModelo = (data: CondicionSMNPayload) => ({
  fecha_hora: data.fecha_hora,
  oleaje: data.oleaje,
  viento_velocidad: data.viento_velocidad,
  viento_direccion: data.viento_direccion,
  visibilidad: data.visibilidad,
  estado_puerto: data.estado_puerto as EstadoPuerto,
  prediccion_5_dias: data.prediccion_5_dias,
  fuente: data.fuente,
});

const generarRecomendacion = (oleaje: number, viento: number): string => {
  if (oleaje > 2.5 || viento > 30) {
    return 'Condiciones adversas. Se recomienda suspender todas las salidas.';
  } else if (oleaje > 1.5 || viento > 20) {
    return 'Condiciones moderadas. Precaución en salidas, especialmente para embarcaciones menores.';
  } else if (oleaje > 1.0 || viento > 15) {
    return 'Condiciones aceptables. Salidas permitidas con precaución.';
  } else {
    return 'Condiciones favorables. Salidas recomendables para todo tipo de embarcación.';
  }
};

const visibilidadStatsKey = (
  visibilidad: string
): 'excelente' | 'buena' | 'regular' | 'baja' | null => {
  if (visibilidad === 'Excelente') return 'excelente';
  if (visibilidad === 'Buena') return 'buena';
  if (visibilidad === 'Regular') return 'regular';
  if (visibilidad === 'Mala' || visibilidad === 'Muy Mala') return 'baja';
  return null;
};

const errorDeDatoSMN = (dato: unknown, error: unknown): string => {
  const datoTemporal = dato as { hloc?: string; dloc?: string };
  const fechaDato = datoTemporal.hloc || datoTemporal.dloc || 'sin fecha';
  return `Error procesando dato para fecha ${fechaDato}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
};

export const getAllCondicionesService = async (
  queries: GetAllCondicionesQuery
): Promise<ApiResponse<GetAllCondicionesResponse>> => {
  const page = queries.page ?? 1;
  const limit = queries.limit ?? 10;
  const { fecha_inicio, fecha_fin, estado_puerto, fuente } = queries;
  const where: WhereOptions = {};

  if (fecha_inicio && fecha_fin) {
    const inicio = new Date(fecha_inicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha_fin);
    fin.setHours(23, 59, 59, 999);
    where['fecha_hora'] = {
      [Op.between]: [inicio, fin],
    };
  }

  if (estado_puerto) where['estado_puerto'] = estado_puerto;
  if (fuente) where['fuente'] = fuente;

  const offset = (page - 1) * limit;

  const { count, rows: condiciones } = await CondicionMeteorologica.findAndCountAll({
    where,
    limit,
    offset,
    order: [['fecha_hora', 'DESC']],
  });

  const porEstado = (await CondicionMeteorologica.findAll({
    attributes: ['estado_puerto', [fn('COUNT', col('id')), 'total']],
    where,
    group: ['estado_puerto'],
    raw: true,
  })) as unknown as EstadoPuertoAgregado[];

  const estadisticas = {
    total: count,
    abierto: 0,
    restricciones: 0,
    cerrado: 0,
    emergencia: 0,
  };

  for (const fila of porEstado) {
    if (fila.estado_puerto === EstadoPuerto.ABIERTO) estadisticas.abierto = Number(fila.total) || 0;
    if (fila.estado_puerto === EstadoPuerto.RESTRICCIONES)
      estadisticas.restricciones = Number(fila.total) || 0;
    if (fila.estado_puerto === EstadoPuerto.CERRADO) estadisticas.cerrado = Number(fila.total) || 0;
    if (fila.estado_puerto === EstadoPuerto.EMERGENCIA)
      estadisticas.emergencia = Number(fila.total) || 0;
  }

  const condicionActual = await CondicionMeteorologica.findOne({ order: [['fecha_hora', 'DESC']] });

  return {
    status: 'success',
    message: 'Condiciones meteorológicas obtenidas exitosamente',
    data: {
      condiciones: condiciones.map(toCondicionResponse),
      condicion_actual: condicionActual ? toCondicionResponse(condicionActual) : null,
      estadisticas,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    },
  };
};

export const getCondicionByIdService = async (
  condicionId: string
): Promise<ApiResponse<CondicionMeteorologicaResponse>> => {
  const condicion = await CondicionMeteorologica.findByPk(condicionId);

  if (!condicion) throw new AppError('Condición meteorológica no encontrada', 404);

  return {
    status: 'success',
    message: 'Condición meteorológica obtenida exitosamente',
    data: toCondicionResponse(condicion),
  };
};

export const createCondicionService = async (
  dto: CreateCondicionDTO
): Promise<ApiResponse<CondicionMeteorologicaResponse>> => {
  const fechaCondicion = new Date(dto.fecha_hora);
  const inicio = new Date(fechaCondicion);
  inicio.setMinutes(0, 0, 0);
  const fin = new Date(fechaCondicion);
  fin.setMinutes(59, 59, 999);

  const condicionExistente = await CondicionMeteorologica.findOne({
    where: {
      fecha_hora: {
        [Op.between]: [inicio, fin],
      },
    },
  });

  if (condicionExistente)
    throw new AppError('Ya existe una condición meteorológica para esta fecha/hora', 409);

  const nuevaCondicion = await CondicionMeteorologica.create({
    fecha_hora: fechaCondicion,
    oleaje: dto.oleaje,
    viento_velocidad: dto.viento_velocidad,
    viento_direccion: dto.viento_direccion,
    visibilidad: dto.visibilidad,
    estado_puerto: dto.estado_puerto as EstadoPuerto,
    prediccion_5_dias: dto.prediccion_5_dias,
    fuente: dto.fuente,
  });

  return {
    status: 'success',
    message: 'Condición meteorológica creada exitosamente',
    data: toCondicionResponse(nuevaCondicion),
  };
};

export const updateCondicionService = async (
  condicionId: string,
  dto: UpdateCondicionDTO
): Promise<ApiResponse<CondicionMeteorologicaResponse>> => {
  const condicion = await CondicionMeteorologica.findByPk(condicionId);
  if (!condicion) throw new AppError('Condición meteorológica no encontrada', 404);

  await condicion.update({
    ...(dto.fecha_hora !== undefined ? { fecha_hora: new Date(dto.fecha_hora) } : {}),
    ...(dto.oleaje !== undefined ? { oleaje: dto.oleaje } : {}),
    ...(dto.viento_velocidad !== undefined ? { viento_velocidad: dto.viento_velocidad } : {}),
    ...(dto.viento_direccion !== undefined ? { viento_direccion: dto.viento_direccion } : {}),
    ...(dto.visibilidad !== undefined ? { visibilidad: dto.visibilidad } : {}),
    ...(dto.estado_puerto !== undefined
      ? { estado_puerto: dto.estado_puerto as EstadoPuerto }
      : {}),
    ...(dto.prediccion_5_dias !== undefined ? { prediccion_5_dias: dto.prediccion_5_dias } : {}),
    ...(dto.fuente !== undefined ? { fuente: dto.fuente } : {}),
  });

  return {
    status: 'success',
    message: 'Condición meteorológica actualizada exitosamente',
    data: toCondicionResponse(condicion),
  };
};

export const deleteCondicionService = async (condicionId: string): Promise<ApiResponse> => {
  const condicion = await CondicionMeteorologica.findByPk(condicionId);
  if (!condicion) throw new AppError('Condición meteorológica no encontrada', 404);

  await condicion.destroy();

  return {
    status: 'success',
    message: 'Condición meteorológica eliminada exitosamente',
  };
};

export const getCondicionActualService = async (): Promise<
  ApiResponse<GetCondicionActualResponse>
> => {
  const condicionActual = await CondicionMeteorologica.findOne({ order: [['fecha_hora', 'DESC']] });

  if (!condicionActual) throw new AppError('No hay condiciones meteorológicas registradas', 404);

  const ahora = getCurrentMexicoTime();
  const tiempoTranscurrido = ahora.getTime() - condicionActual.fecha_hora.getTime();
  const horasTranscurridas = Math.floor(tiempoTranscurrido / (1000 * 60 * 60));
  const necesitaActualizacion = horasTranscurridas > 6;

  return {
    status: 'success',
    message: 'Condición meteorológica actual obtenida exitosamente',
    data: {
      condicion: toCondicionResponse(condicionActual),
      tiempo_transcurrido_horas: horasTranscurridas,
      necesita_actualizacion: necesitaActualizacion,
    },
  };
};

export const getPrediccionService = async (
  dias: number
): Promise<ApiResponse<GetPrediccionResponse>> => {
  const periodo = dias ?? 5;
  const condicionesRecientes = await CondicionMeteorologica.findAll({
    order: [['fecha_hora', 'DESC']],
    limit: periodo,
  });

  if (condicionesRecientes.length === 0)
    throw new AppError('No hay datos meteorológicos para generar predicción', 404);

  const promedioOleaje =
    condicionesRecientes.reduce((sum, c) => sum + c.oleaje, 0) / condicionesRecientes.length;
  const promedioViento =
    condicionesRecientes.reduce((sum, c) => sum + c.viento_velocidad, 0) /
    condicionesRecientes.length;
  const oleajeTendencia =
    condicionesRecientes.length > 1
      ? condicionesRecientes[0]!.oleaje > condicionesRecientes[1]!.oleaje
        ? 'creciente'
        : 'decreciente'
      : 'estable';

  const vientoTendencia =
    condicionesRecientes.length > 1
      ? condicionesRecientes[0]!.viento_velocidad > condicionesRecientes[1]!.viento_velocidad
        ? 'creciente'
        : 'decreciente'
      : 'estable';

  const prediccion: GetPrediccionDTO = {
    periodo_dias: periodo,
    promedio_oleaje: Math.round(promedioOleaje * 100) / 100,
    promedio_viento: Math.round(promedioViento * 100) / 100,
    tendencia_oleaje: oleajeTendencia,
    tendencia_viento: vientoTendencia,
    recomendacion: generarRecomendacion(promedioOleaje, promedioViento),
    condiciones_por_dia: condicionesRecientes.map((c) => ({
      fecha_hora: c.fecha_hora,
      oleaje: c.oleaje,
      viento_velocidad: c.viento_velocidad,
      estado_puerto: c.estado_puerto,
      visibilidad: c.visibilidad as VisibilidadValue,
    })),
  };

  return {
    status: 'success',
    message: 'Predicción meteorológica generada exitosamente',
    data: { prediccion },
  };
};

export const getAlertasService = async (): Promise<ApiResponse<GetAlertasResponse>> => {
  const condicionActual = await CondicionMeteorologica.findOne({ order: [['fecha_hora', 'DESC']] });

  if (!condicionActual)
    throw new AppError('No hay condiciones meteorológicas para evaluar alertas', 404);

  const alertas = [];

  if (condicionActual.oleaje > 2.5) {
    alertas.push({
      tipo: 'oleaje_alto',
      severidad: 'alta',
      mensaje: `Oleaje alto detectado: ${condicionActual.oleaje}m. Se recomienda suspender salidas.`,
      valor: condicionActual.oleaje,
      umbral: 2.5,
    });
  } else if (condicionActual.oleaje > 1.5) {
    alertas.push({
      tipo: 'oleaje_moderado',
      severidad: 'media',
      mensaje: `Oleaje moderado detectado: ${condicionActual.oleaje}m. Precaución en salidas.`,
      valor: condicionActual.oleaje,
      umbral: 1.5,
    });
  }

  if (condicionActual.viento_velocidad > 30) {
    alertas.push({
      tipo: 'viento_fuerte',
      severidad: 'alta',
      mensaje: `Viento fuerte detectado: ${condicionActual.viento_velocidad} km/h. Se recomienda suspender salidas.`,
      valor: condicionActual.viento_velocidad,
      umbral: 30,
    });
  } else if (condicionActual.viento_velocidad > 20) {
    alertas.push({
      tipo: 'viento_moderado',
      severidad: 'media',
      mensaje: `Viento moderado detectado: ${condicionActual.viento_velocidad} km/h. Precaución en salidas.`,
      valor: condicionActual.viento_velocidad,
      umbral: 20,
    });
  }

  if (condicionActual.visibilidad === 'Mala' || condicionActual.visibilidad === 'Muy Mala') {
    alertas.push({
      tipo: 'visibilidad_baja',
      severidad: 'alta',
      mensaje: 'Visibilidad reducida detectada. Se recomienda suspender salidas.',
      valor: condicionActual.visibilidad,
      umbral: 'baja',
    });
  }

  if (condicionActual.estado_puerto === EstadoPuerto.CERRADO) {
    alertas.push({
      tipo: 'puerto_cerrado',
      severidad: 'critica',
      mensaje: 'Puerto cerrado por condiciones meteorológicas adversas.',
      valor: condicionActual.estado_puerto,
      umbral: EstadoPuerto.CERRADO,
    });
  } else if (condicionActual.estado_puerto === EstadoPuerto.RESTRICCIONES) {
    alertas.push({
      tipo: 'restricciones_puerto',
      severidad: 'media',
      mensaje: 'Restricciones en el puerto. Verificar condiciones antes de salir.',
      valor: condicionActual.estado_puerto,
      umbral: EstadoPuerto.RESTRICCIONES,
    });
  }

  if (condicionActual.estado_puerto === EstadoPuerto.EMERGENCIA) {
    alertas.push({
      tipo: 'emergencia_puerto',
      severidad: 'critica',
      mensaje: 'EMERGENCIA: Puerto en estado de emergencia. Suspender todas las actividades.',
      valor: condicionActual.estado_puerto,
      umbral: EstadoPuerto.EMERGENCIA,
    });
  }

  return {
    status: 'success',
    message: 'Alertas meteorológicas obtenidas exitosamente',
    data: {
      alertas: alertas as AlertaMeteorologicaDTO[],
      total_alertas: alertas.length,
      alertas_criticas: alertas.filter((a) => a.severidad === 'critica').length,
      alertas_altas: alertas.filter((a) => a.severidad === 'alta').length,
      alertas_medias: alertas.filter((a) => a.severidad === 'media').length,
      condicion_actual: {
        fecha_hora: condicionActual.fecha_hora,
        oleaje: condicionActual.oleaje,
        viento_velocidad: condicionActual.viento_velocidad,
        visibilidad: condicionActual.visibilidad as VisibilidadValue,
        estado_puerto: condicionActual.estado_puerto,
      },
    },
  };
};

export const getEstadisticasService = async (
  queries: GetEstadisticasQuery
): Promise<ApiResponse<GetEstadisticasResponse>> => {
  const { fecha_inicio, fecha_fin } = queries;
  const where: WhereOptions = {};

  if (fecha_inicio && fecha_fin) {
    const inicio = new Date(fecha_inicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha_fin);
    fin.setHours(23, 59, 59, 999);
    where['fecha_hora'] = {
      [Op.between]: [inicio, fin],
    };
  }

  const condiciones = await CondicionMeteorologica.findAll({
    where,
    order: [['fecha_hora', 'ASC']],
  });

  if (condiciones.length === 0)
    throw new AppError('No hay datos meteorológicos en el período especificado', 404);

  const oleajes = condiciones.map((c) => c.oleaje);
  const vientos = condiciones.map((c) => c.viento_velocidad);

  const visibilidad = { excelente: 0, buena: 0, regular: 0, baja: 0 };
  for (const condicion of condiciones) {
    const clave = visibilidadStatsKey(condicion.visibilidad);
    if (clave) visibilidad[clave] += 1;
  }

  const estadisticas: GetEstadisticasDTO = {
    periodo: {
      fecha_inicio: condiciones[0]!.fecha_hora.toString(),
      fecha_fin: condiciones[condiciones.length - 1]!.fecha_hora.toString(),
      total_registros: condiciones.length,
    },
    oleaje: {
      promedio:
        Math.round((oleajes.reduce((sum, val) => sum + val, 0) / oleajes.length) * 100) / 100,
      minimo: Math.min(...oleajes),
      maximo: Math.max(...oleajes),
      registros_oleaje_alto: oleajes.filter((o) => o > 2.0).length,
    },
    viento: {
      promedio:
        Math.round((vientos.reduce((sum, val) => sum + val, 0) / vientos.length) * 100) / 100,
      minimo: Math.min(...vientos),
      maximo: Math.max(...vientos),
      registros_viento_fuerte: vientos.filter((v) => v > 25).length,
    },
    estado_puerto: {
      abierto: condiciones.filter((c) => c.estado_puerto === EstadoPuerto.ABIERTO).length,
      restricciones: condiciones.filter((c) => c.estado_puerto === EstadoPuerto.RESTRICCIONES)
        .length,
      cerrado: condiciones.filter((c) => c.estado_puerto === EstadoPuerto.CERRADO).length,
      emergencia: condiciones.filter((c) => c.estado_puerto === EstadoPuerto.EMERGENCIA).length,
    },
    visibilidad,
  };

  return {
    status: 'success',
    message: 'Estadísticas meteorológicas obtenidas exitosamente',
    data: { estadisticas },
  };
};

export const sincronizarSMNService = async (
  dto: SincronizarSMNDTO
): Promise<ApiResponse<SincronizarSMNResponse>> => {
  const horas_limite = dto.horas_limite ?? 24;
  const solo_isla_lobos = dto.solo_isla_lobos ?? true;

  logger.info('🔄 Iniciando sincronización con SMN...');

  const datosHorarios = await getPronosticoHorario();

  let datosFiltrados = datosHorarios;
  if (solo_isla_lobos) {
    datosFiltrados = filtrarPorIslaLobos(datosHorarios);
    logger.info(`📍 Filtrado para Isla de Lobos: ${datosFiltrados.length} registros`);
  }

  if (datosFiltrados.length === 0)
    throw new AppError('No se encontraron datos del SMN para la región especificada', 404);

  const datosAProcesar = datosFiltrados.slice(0, horas_limite);

  logger.info(
    `⚙️ Procesando ${datosAProcesar.length} registros (límite: ${horas_limite} horas)...`
  );

  const errores: string[] = [];
  const convertidos: CondicionSMNPayload[] = [];

  for (const dato of datosAProcesar) {
    try {
      convertidos.push(convertirACondicionMeteorologica(dato));
    } catch (error) {
      const errorMsg = errorDeDatoSMN(dato, error);
      logger.error({ err: error }, `❌ ${errorMsg}`);
      errores.push(errorMsg);
    }
  }

  if (convertidos.length === 0)
    throw new AppError('No se pudo procesar ningún registro del SMN', 400);

  const porHora = new Map<number, CondicionSMNPayload>();
  for (const condicion of convertidos) {
    porHora.set(hourBucketMs(condicion.fecha_hora), condicion);
  }
  const lote = [...porHora.values()];

  const timestamps = lote.map((c) => c.fecha_hora.getTime());
  const inicioRango = new Date(Math.min(...timestamps));
  inicioRango.setMinutes(0, 0, 0);
  const finRango = new Date(Math.max(...timestamps));
  finRango.setMinutes(59, 59, 999);

  const { condicionesCreadas, condicionesActualizadas } = await sequelize.transaction(
    async (transaction) => {
      const existentes = await CondicionMeteorologica.findAll({
        where: {
          fuente: 'CONAGUA',
          fecha_hora: { [Op.between]: [inicioRango, finRango] },
        },
        transaction,
      });

      const existentePorHora = new Map<number, CondicionMeteorologica>();
      for (const existente of existentes) {
        existentePorHora.set(hourBucketMs(existente.fecha_hora), existente);
      }

      const paraCrear: CondicionSMNPayload[] = [];
      const paraActualizar: { row: CondicionMeteorologica; data: CondicionSMNPayload }[] = [];

      for (const data of lote) {
        const existente = existentePorHora.get(hourBucketMs(data.fecha_hora));
        if (existente) paraActualizar.push({ row: existente, data });
        else paraCrear.push(data);
      }

      const creadas =
        paraCrear.length > 0
          ? await CondicionMeteorologica.bulkCreate(paraCrear.map(toCondicionModelo), {
              transaction,
              returning: true,
            })
          : [];

      const actualizadas: CondicionMeteorologica[] = [];
      for (const { row, data } of paraActualizar) {
        await row.update(toCondicionModelo(data), { transaction });
        actualizadas.push(row);
      }

      return { condicionesCreadas: creadas, condicionesActualizadas: actualizadas };
    }
  );

  if (condicionesCreadas.length + condicionesActualizadas.length === 0)
    throw new AppError('No se pudo procesar ningún registro del SMN', 400);

  logger.info(
    `✅ Sincronización completada: ${condicionesCreadas.length} creadas, ${condicionesActualizadas.length} actualizadas`
  );

  return {
    status: 'success',
    message: 'Datos del SMN sincronizados exitosamente',
    data: {
      total_procesados: datosAProcesar.length,
      condiciones_creadas: condicionesCreadas.length,
      condiciones_actualizadas: condicionesActualizadas.length,
      condiciones: [
        ...condicionesCreadas.map(toCondicionResponse),
        ...condicionesActualizadas.map(toCondicionResponse),
      ],
      errores: errores.length > 0 ? errores : undefined,
    },
  };
};
