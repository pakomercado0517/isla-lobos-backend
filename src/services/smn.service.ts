import axios from 'axios';
import zlib from 'zlib';
import { promisify } from 'util';
import { AppError } from '../lib/AppError';
import { SMNDatosDiarios, SMNDatosHorarios, SMNConfiguracionRegion, EstadoPuerto } from '../types';
import {
  CondicionSMNPayload,
  EstadoPuertoValue,
  FuenteClimaValue,
  VientoDireccionValue,
  VisibilidadValue,
} from '../types/clima.types';
import { createLogger } from '../utils/logger';

const gunzip = promisify(zlib.gunzip);
const logger = createLogger('SMNService');

const BASE_URL = 'https://smn.conagua.gob.mx/tools/GUI/webservices/';
const TIMEOUT_MS = 30000;

const REGION_ISLA_LOBOS: SMNConfiguracionRegion = {
  estado_id: '30',
  municipio_id: '189',
  nombre_region: 'Veracruz - Tuxpan (Isla de Lobos)',
};

const DIRECCION_VIENTO: Record<string, VientoDireccionValue> = {
  Norte: 'N',
  Noreste: 'NE',
  Este: 'E',
  Sureste: 'SE',
  Sur: 'S',
  Suroeste: 'SW',
  Oeste: 'W',
  Noroeste: 'NW',
};

const fetchSMNJson = async <T>(method: 1 | 3, descripcion: string): Promise<T[]> => {
  try {
    logger.info(`Obteniendo ${descripcion} del SMN`);

    const response = await axios.get(`${BASE_URL}?method=${method}`, {
      responseType: 'arraybuffer',
      timeout: TIMEOUT_MS,
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });

    const decompressed = await gunzip(response.data);
    const jsonData: unknown = JSON.parse(decompressed.toString());
    const registros = Array.isArray(jsonData) ? (jsonData as T[]) : [];

    logger.info({ registros: registros.length }, `${descripcion} obtenido`);
    return registros;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, `Error al obtener ${descripcion} del SMN`);
    throw new AppError(
      `No se pudo obtener el ${descripcion} del SMN. Verifique la conexión o intente más tarde.`,
      502
    );
  }
};

export const getPronosticoDiario = (): Promise<SMNDatosDiarios[]> =>
  fetchSMNJson<SMNDatosDiarios>(1, 'pronóstico diario');

export const getPronosticoHorario = async (): Promise<SMNDatosHorarios[]> => {
  const registros = await fetchSMNJson<SMNDatosHorarios>(3, 'pronóstico horario');

  if (registros[0]) {
    logger.debug({ muestra: registros[0], campos: Object.keys(registros[0]) }, 'Muestra SMN');
  }

  return registros;
};

export const filtrarPorRegion = <T extends SMNDatosDiarios | SMNDatosHorarios>(
  datos: T[],
  estadoId: string,
  municipioId?: string
): T[] =>
  datos.filter((d) => {
    if (municipioId) return d.ides === estadoId && d.idmun === municipioId;
    return d.ides === estadoId;
  });

export const filtrarPorIslaLobos = <T extends SMNDatosDiarios | SMNDatosHorarios>(datos: T[]): T[] =>
  filtrarPorRegion(datos, REGION_ISLA_LOBOS.estado_id, REGION_ISLA_LOBOS.municipio_id);

const parsearFecha = (dloc: string): Date => {
  const year = parseInt(dloc.substring(0, 4), 10);
  const month = parseInt(dloc.substring(4, 6), 10) - 1;
  const day = parseInt(dloc.substring(6, 8), 10);
  const hour = parseInt(dloc.substring(9, 11), 10);
  return new Date(year, month, day, hour, 0, 0);
};

const normalizarDireccion = (direccion: string): VientoDireccionValue => {
  const mapeada = DIRECCION_VIENTO[direccion];
  if (mapeada) return mapeada;

  const abreviada = direccion.substring(0, 2).toUpperCase();
  const validas: VientoDireccionValue[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return validas.includes(abreviada as VientoDireccionValue)
    ? (abreviada as VientoDireccionValue)
    : 'N';
};

const estimarOleaje = (vientoVelocidad: number): number => {
  if (vientoVelocidad < 10) return 0.5;
  if (vientoVelocidad < 20) return 1.0;
  if (vientoVelocidad < 30) return 1.8;
  if (vientoVelocidad < 40) return 2.5;
  if (vientoVelocidad < 50) return 3.5;
  return 5.0;
};

const determinarVisibilidad = (
  coberturaNubes: number,
  probabilidadPrecipitacion: number
): VisibilidadValue => {
  if (probabilidadPrecipitacion > 70) return 'Mala';
  if (coberturaNubes < 25) return 'Excelente';
  if (coberturaNubes < 50) return 'Buena';
  if (coberturaNubes < 75) return 'Regular';
  return 'Mala';
};

const determinarEstadoPuerto = (vientoVelocidad: number, oleaje: number): EstadoPuerto => {
  if (vientoVelocidad > 40 || oleaje > 3.0) return EstadoPuerto.CERRADO;
  if (vientoVelocidad > 30 || oleaje > 2.0) return EstadoPuerto.RESTRICCIONES;
  return EstadoPuerto.ABIERTO;
};

const construirPrediccion = (dato: SMNDatosDiarios | SMNDatosHorarios): string => {
  const partes: string[] = [dato.desciel];
  const probPrec = parseFloat(dato.probprec);
  const prec = parseFloat(dato.prec);

  if (probPrec > 50) {
    partes.push(`Probabilidad de lluvia: ${probPrec.toFixed(0)}% (${prec.toFixed(1)} L/m²)`);
  }

  const viento = parseFloat(dato.velvien);
  partes.push(`Viento: ${viento.toFixed(1)} km/h ${normalizarDireccion(dato.dirvienc)}`);

  if ('temp' in dato) {
    partes.push(`Temperatura: ${parseFloat(dato.temp).toFixed(1)}°C`);
  }
  if ('hr' in dato) {
    partes.push(`Humedad: ${parseFloat(dato.hr).toFixed(0)}%`);
  }

  return partes.join('. ');
};

export const convertirACondicionMeteorologica = (
  dato: SMNDatosHorarios | SMNDatosDiarios
): CondicionSMNPayload => {
  const fechaString = 'hloc' in dato ? dato.hloc : 'dloc' in dato ? dato.dloc : undefined;

  if (!fechaString) {
    throw new AppError(
      `Campo 'hloc' o 'dloc' no encontrado en dato. Campos disponibles: ${Object.keys(dato).join(', ')}`,
      400
    );
  }

  if (!dato.velvien) {
    throw new AppError("Campo 'velvien' (velocidad del viento) no encontrado", 400);
  }

  const vientoVelocidad = parseFloat(dato.velvien);
  if (Number.isNaN(vientoVelocidad)) {
    throw new AppError(`Velocidad del viento inválida: ${dato.velvien}`, 400);
  }

  const coberturaNubes = 'cc' in dato && dato.cc ? parseFloat(dato.cc) : 0;
  const probabilidadPrecipitacion = parseFloat(dato.probprec || '0');
  const oleaje = estimarOleaje(vientoVelocidad);

  return {
    fecha_hora: parsearFecha(fechaString),
    oleaje,
    viento_velocidad: vientoVelocidad,
    viento_direccion: normalizarDireccion(dato.dirvienc),
    visibilidad: determinarVisibilidad(coberturaNubes, probabilidadPrecipitacion),
    estado_puerto: determinarEstadoPuerto(vientoVelocidad, oleaje) as EstadoPuertoValue,
    prediccion_5_dias: construirPrediccion(dato),
    fuente: 'CONAGUA' as FuenteClimaValue,
  };
};

export const obtenerDatosRecientes = async (
  horasLimite: number = 24
): Promise<SMNDatosHorarios[]> => {
  const datosHorarios = await getPronosticoHorario();
  return filtrarPorIslaLobos(datosHorarios).slice(0, horasLimite);
};
