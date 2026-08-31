import { formatInTimeZone } from 'date-fns-tz';
import { col, fn, Op } from 'sequelize';
import CondicionMeteorologica from '../models/CondicionMeteorologica';
import Embarcacion from '../models/Embarcacion';
import Salida from '../models/Salida';
import { ApiResponse, EstadoPuerto, EstadoSalida } from '../types';
import {
  ColorPuertoPublico,
  CondicionGeneralValue,
  EstadoPuertoPublicoDTO,
  EstadoPuertoPublicoValue,
  GetHomepageStatsResponse,
  GetPuertoStatusResponse,
  SalidasPorEstadoAgregado,
} from '../types/public.types';
import { extraerSoloFechaUTC, getTodayMexico, MEXICO_TIMEZONE } from '../utils/dateUtils';

const ESTADOS_SALIDA_ACTIVOS = [
  EstadoSalida.PROGRAMADA,
  EstadoSalida.EN_CURSO,
  EstadoSalida.COMPLETADA,
] as const;

const VERSION_SISTEMA = '1.0.0';

const mapEstadoPuertoPublico = (
  estadoPuerto?: EstadoPuerto | null
): EstadoPuertoPublicoDTO => {
  const mapa: Record<EstadoPuerto, EstadoPuertoPublicoDTO> = {
    [EstadoPuerto.ABIERTO]: {
      estado: 'abierto',
      texto: 'Puerto Abierto',
      color: 'green',
      operativo: true,
    },
    [EstadoPuerto.RESTRICCIONES]: {
      estado: 'restricciones',
      texto: 'Puerto con Restricciones',
      color: 'yellow',
      operativo: true,
    },
    [EstadoPuerto.CERRADO]: {
      estado: 'cerrado',
      texto: 'Puerto Cerrado',
      color: 'red',
      operativo: false,
    },
    [EstadoPuerto.EMERGENCIA]: {
      estado: 'emergencia',
      texto: 'Puerto en Emergencia',
      color: 'red',
      operativo: false,
    },
  };

  return (
    (estadoPuerto && mapa[estadoPuerto]) || {
      estado: 'desconocido' as EstadoPuertoPublicoValue,
      texto: 'Estado Desconocido',
      color: 'gray' as ColorPuertoPublico,
      operativo: false,
    }
  );
};

const determinarCondicionGeneral = (oleaje: number, viento: number): CondicionGeneralValue => {
  if (oleaje > 2.5 || viento > 30) return 'adversas';
  if (oleaje > 1.5 || viento > 20) return 'moderadas';
  if (oleaje > 1.0 || viento > 15) return 'aceptables';
  return 'favorables';
};

const cantidadDe = (filas: SalidasPorEstadoAgregado[], estado: EstadoSalida): number =>
  Number(filas.find((fila) => fila.estado === estado)?.cantidad ?? 0);

const pasajerosDe = (filas: SalidasPorEstadoAgregado[]): number =>
  filas.reduce((total, fila) => total + Number(fila.pasajeros ?? 0), 0);

export const getHomepageStatsService = async (): Promise<
  ApiResponse<GetHomepageStatsResponse>
> => {
  const hoy = getTodayMexico();
  const horaConsulta = formatInTimeZone(new Date(), MEXICO_TIMEZONE, 'HH:mm:ss');

  const [condicionActual, totalEmbarcaciones, salidasAgregadas] = await Promise.all([
    CondicionMeteorologica.findOne({
      order: [['fecha_hora', 'DESC']],
      attributes: ['estado_puerto', 'oleaje', 'viento_velocidad', 'fecha_hora'],
    }),
    Embarcacion.count(),
    Salida.findAll({
      where: {
        fecha: hoy,
        estado: { [Op.in]: [...ESTADOS_SALIDA_ACTIVOS] },
      },
      attributes: [
        'estado',
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('SUM', col('numero_pasajeros')), 'pasajeros'],
      ],
      group: ['estado'],
      raw: true,
    }),
  ]);

  const filas = salidasAgregadas as unknown as SalidasPorEstadoAgregado[];
  const programadas = cantidadDe(filas, EstadoSalida.PROGRAMADA);
  const enCurso = cantidadDe(filas, EstadoSalida.EN_CURSO);
  const completadas = cantidadDe(filas, EstadoSalida.COMPLETADA);
  const totalSalidas = programadas + enCurso + completadas;
  const totalPasajeros = pasajerosDe(filas);
  const puerto = mapEstadoPuertoPublico(condicionActual?.estado_puerto);

  return {
    status: 'success',
    message: 'Estadísticas públicas obtenidas exitosamente',
    data: {
      fecha_consulta: hoy,
      hora_consulta: horaConsulta,
      puerto,
      embarcaciones: {
        total_registradas: totalEmbarcaciones,
      },
      actividad_hoy: {
        salidas_programadas: totalSalidas,
        salidas_por_estado: {
          programadas,
          en_curso: enCurso,
          completadas,
        },
        total_pasajeros: totalPasajeros,
        promedio_pasajeros_por_salida:
          totalSalidas > 0 ? Math.round(totalPasajeros / totalSalidas) : 0,
      },
      clima: condicionActual
        ? {
            oleaje: condicionActual.oleaje,
            viento: condicionActual.viento_velocidad,
            condicion_general: determinarCondicionGeneral(
              condicionActual.oleaje,
              condicionActual.viento_velocidad
            ),
            ultima_actualizacion: extraerSoloFechaUTC(condicionActual.fecha_hora) ?? null,
          }
        : null,
      sistema: {
        operativo: true,
        version: VERSION_SISTEMA,
        ultima_actualizacion: hoy,
      },
    },
  };
};

export const getPuertoStatusService = async (): Promise<ApiResponse<GetPuertoStatusResponse>> => {
  const condicionActual = await CondicionMeteorologica.findOne({
    order: [['fecha_hora', 'DESC']],
    attributes: ['estado_puerto', 'fecha_hora'],
  });

  const puerto = mapEstadoPuertoPublico(condicionActual?.estado_puerto);

  return {
    status: 'success',
    message: 'Estado del puerto obtenido exitosamente',
    data: {
      puerto: {
        estado: puerto.estado,
        operativo: puerto.operativo,
        color: puerto.color,
        ultima_actualizacion: condicionActual
          ? extraerSoloFechaUTC(condicionActual.fecha_hora) ?? null
          : null,
      },
    },
  };
};
