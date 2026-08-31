import { col, fn, literal, Op, WhereOptions } from 'sequelize';
import { Brazalete, LoteBrazalete, User, VentaBrazalete } from '../models';
import {
  ApiResponse,
  EstadoBrazalete,
  EstadoLote,
  EstadoPago,
  TipoBrazalete,
  UserRole,
} from '../types';
import {
  AlertaBrazaleteDTO,
  AlertasBrazaletesResponse,
  EstadisticasBrazaletesResponse,
  EstadisticasQuery,
  IngresoPorMesDTO,
  PeriodoFechasDTO,
  PrestadorVentaResumenDTO,
  ReporteUtilizacionQuery,
  ReporteUtilizacionResponse,
  ReporteVentasQuery,
  ReporteVentasResponse,
  VentaBrazaleteConRelaciones,
  VentasPorPrestadorDTO,
} from '../types/brazalete.types';
import { extraerSoloFechaUTC, getTodayMexico } from '../utils/dateUtils';

interface NacionalidadAgregado {
  turista_nacionalidad: string | null;
  total: string | number;
}

interface StockPrestadorAgregado {
  prestador_id: string;
  total: string | number;
}

interface IngresoMesAgregado {
  mes: string;
  cantidad: string | number;
  monto: string | number;
}

const mesVentaExpr = fn('to_char', col('fecha_venta'), literal("'YYYY-MM'"));

const totalDe = <T extends { total: string | number }>(
  filas: T[],
  coincide: (item: T) => boolean
): number => Number(filas.find(coincide)?.total ?? 0);

const resolverRangoFechas = (
  fecha_inicio?: string,
  fecha_fin?: string
): { fechaInicio: Date; fechaFin: Date } => {
  let fechaFin: Date;
  let fechaInicio: Date;

  if (fecha_fin) {
    fechaFin = new Date(fecha_fin);
    fechaFin.setUTCHours(23, 59, 59, 999);
  } else {
    fechaFin = new Date();
  }

  if (fecha_inicio) {
    fechaInicio = new Date(fecha_inicio);
    fechaInicio.setUTCHours(0, 0, 0, 0);
  } else {
    fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  return { fechaInicio, fechaFin };
};

const toPeriodo = (fechaInicio: Date, fechaFin: Date): PeriodoFechasDTO => ({
  fecha_inicio: extraerSoloFechaUTC(fechaInicio),
  fecha_fin: extraerSoloFechaUTC(fechaFin),
});

const whereRangoFecha = (campo: string, fechaInicio: Date, fechaFin: Date): WhereOptions => ({
  [campo]: { [Op.between]: [fechaInicio, fechaFin] },
});

const addDaysYmd = (ymd: string, days: number): string => {
  const [year, month, day] = ymd.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return extraerSoloFechaUTC(date) as string;
};

const diasEntreYmd = (desde: string, hasta: string): number => {
  const desdeDate = new Date(`${desde}T12:00:00`);
  const hastaDate = new Date(`${hasta}T12:00:00`);
  return Math.ceil((hastaDate.getTime() - desdeDate.getTime()) / (1000 * 3600 * 24));
};

const alertaStockPrestador = (
  nombre: string,
  disponibles: number
): { mensaje: string; severidad: 'alta' | 'media' } | null => {
  if (disponibles >= 10) return null;
  if (disponibles === 0) {
    return { mensaje: `${nombre} no tiene brazaletes - stock agotado`, severidad: 'alta' };
  }
  if (disponibles === 1) {
    return { mensaje: `${nombre} tiene solo 1 brazalete - stock crítico`, severidad: 'media' };
  }
  if (disponibles <= 5) {
    return {
      mensaje: `${nombre} tiene ${disponibles} brazaletes - stock muy bajo`,
      severidad: 'media',
    };
  }
  return {
    mensaje: `${nombre} tiene ${disponibles} brazaletes - stock bajo`,
    severidad: 'media',
  };
};

export const obtenerEstadisticasService = async (
  query: EstadisticasQuery
): Promise<ApiResponse<EstadisticasBrazaletesResponse>> => {
  const { fechaInicio, fechaFin } = resolverRangoFechas(query.fecha_inicio, query.fecha_fin);
  const whereUso = {
    estado: EstadoBrazalete.UTILIZADO,
    ...whereRangoFecha('fecha_uso', fechaInicio, fechaFin),
  };
  const whereVentasPagadas = {
    estado_pago: EstadoPago.PAGADO,
    ...whereRangoFecha('fecha_venta', fechaInicio, fechaFin),
  };

  const [
    totalComprados,
    totalDisponibles,
    totalVendidos,
    totalUtilizados,
    ventasTotales,
    ingresosPorMesRaw,
    utilizadosUniversal,
    utilizacionPorNacionalidadRaw,
  ] = await Promise.all([
    Brazalete.count(),
    Brazalete.count({
      where: {
        estado: EstadoBrazalete.DISPONIBLE,
        prestador_id: null,
      } as WhereOptions,
    }),
    Brazalete.count({
      where: { prestador_id: { [Op.ne]: null } } as WhereOptions,
    }),
    Brazalete.count({ where: { estado: EstadoBrazalete.UTILIZADO } }),
    VentaBrazalete.sum('total', { where: whereVentasPagadas }),
    VentaBrazalete.findAll({
      attributes: [
        [mesVentaExpr, 'mes'],
        [fn('SUM', col('cantidad')), 'cantidad'],
        [fn('SUM', col('total')), 'monto'],
      ],
      where: whereVentasPagadas,
      group: [mesVentaExpr],
      order: [[mesVentaExpr, 'ASC']],
      raw: true,
    }),
    Brazalete.count({
      where: {
        tipo: TipoBrazalete.UNIVERSAL,
        ...whereUso,
      },
    }),
    Brazalete.findAll({
      attributes: ['turista_nacionalidad', [fn('COUNT', col('id')), 'total']],
      where: whereUso,
      group: ['turista_nacionalidad'],
      raw: true,
    }),
  ]);

  const porNacionalidad = utilizacionPorNacionalidadRaw as unknown as NacionalidadAgregado[];
  const ingresosPorMes: IngresoPorMesDTO[] = (
    ingresosPorMesRaw as unknown as IngresoMesAgregado[]
  ).map((row) => ({
    mes: row.mes,
    cantidad: Number(row.cantidad),
    monto: Number(row.monto),
  }));

  return {
    status: 'success',
    message: 'Estadísticas obtenidas correctamente',
    data: {
      periodo: toPeriodo(fechaInicio, fechaFin),
      inventario: {
        total_comprados: totalComprados,
        total_disponibles: totalDisponibles,
        total_vendidos: totalVendidos,
        total_utilizados: totalUtilizados,
      },
      ingresos: {
        ventas_totales: parseFloat((ventasTotales ?? 0).toString()),
        por_mes: ingresosPorMes,
      },
      utilizacion: {
        por_tipo: { universal: utilizadosUniversal },
        por_nacionalidad: {
          locales: totalDe(porNacionalidad, (item) => item.turista_nacionalidad === 'local'),
          nacionales: totalDe(porNacionalidad, (item) => item.turista_nacionalidad === 'nacional'),
          internacionales: totalDe(
            porNacionalidad,
            (item) => item.turista_nacionalidad === 'internacional'
          ),
        },
      },
    },
  };
};

export const obtenerAlertasService = async (): Promise<ApiResponse<AlertasBrazaletesResponse>> => {
  const hoy = getTodayMexico();
  const fechaLimite = addDaysYmd(hoy, 30);
  const ahora = new Date();

  const [
    totalBrazaletes,
    disponibles,
    disponiblesUniversal,
    lotesPorVencer,
    prestadores,
    stockPorPrestadorRaw,
    lotesVencidos,
  ] = await Promise.all([
    Brazalete.count(),
    Brazalete.count({ where: { estado: EstadoBrazalete.DISPONIBLE } }),
    Brazalete.count({
      where: { tipo: TipoBrazalete.UNIVERSAL, estado: EstadoBrazalete.DISPONIBLE },
    }),
    LoteBrazalete.findAll({
      where: {
        estado: EstadoLote.ACTIVO,
        fecha_vencimiento: { [Op.between]: [hoy, fechaLimite] },
      },
    }),
    User.findAll({
      where: { rol: UserRole.PRESTADOR, activo: true },
      attributes: ['id', 'nombre'],
    }),
    Brazalete.findAll({
      attributes: ['prestador_id', [fn('COUNT', col('id')), 'total']],
      where: {
        estado: EstadoBrazalete.DISPONIBLE,
        prestador_id: { [Op.ne]: null },
      } as WhereOptions,
      group: ['prestador_id'],
      raw: true,
    }),
    LoteBrazalete.count({
      where: {
        estado: EstadoLote.ACTIVO,
        fecha_vencimiento: { [Op.lt]: hoy },
      },
    }),
  ]);

  const alertas: AlertaBrazaleteDTO[] = [];

  if (totalBrazaletes > 0 && disponibles < totalBrazaletes * 0.1) {
    alertas.push({
      tipo: 'stock_bajo',
      severidad: 'alta',
      mensaje: `Solo quedan ${disponibles} brazaletes disponibles (${Math.round(
        (disponibles / totalBrazaletes) * 100
      )}% del inventario)`,
      fecha: ahora,
    });
  }

  if (disponiblesUniversal < 10) {
    alertas.push({
      tipo: 'stock_bajo',
      severidad: disponiblesUniversal < 5 ? 'alta' : 'media',
      mensaje: `Solo quedan ${disponiblesUniversal} brazaletes disponibles`,
      fecha: ahora,
    });
  }

  for (const lote of lotesPorVencer) {
    const fechaVencStr = extraerSoloFechaUTC(lote.fecha_vencimiento);
    if (!fechaVencStr) continue;
    const diasRestantes = diasEntreYmd(hoy, fechaVencStr);
    alertas.push({
      tipo: 'lote_por_vencer',
      severidad: diasRestantes < 7 ? 'alta' : 'media',
      mensaje: `Lote ${lote.numero_lote} vence en ${diasRestantes} días`,
      fecha: ahora,
    });
  }

  const stockPorPrestador = new Map(
    (stockPorPrestadorRaw as unknown as StockPrestadorAgregado[]).map((row) => [
      row.prestador_id,
      Number(row.total),
    ])
  );

  for (const prestador of prestadores) {
    const disponiblesPrestador = stockPorPrestador.get(prestador.id) ?? 0;
    const alerta = alertaStockPrestador(prestador.nombre, disponiblesPrestador);
    if (!alerta) continue;
    alertas.push({
      tipo: 'prestador_sin_stock',
      severidad: alerta.severidad,
      mensaje: alerta.mensaje,
      fecha: ahora,
    });
  }

  if (lotesVencidos > 0) {
    alertas.push({
      tipo: 'lotes_vencidos',
      severidad: 'alta',
      mensaje: `Hay ${lotesVencidos} lote(s) vencido(s) que necesitan actualización de estado`,
      fecha: ahora,
    });
  }

  const severidadOrder: Record<AlertaBrazaleteDTO['severidad'], number> = {
    alta: 3,
    media: 2,
    baja: 1,
  };

  return {
    status: 'success',
    message: 'Alertas obtenidas correctamente',
    data: {
      alertas: alertas.sort((a, b) => severidadOrder[b.severidad] - severidadOrder[a.severidad]),
    },
  };
};

export const reporteVentasService = async (
  query: ReporteVentasQuery
): Promise<ApiResponse<ReporteVentasResponse>> => {
  const { fechaInicio, fechaFin } = resolverRangoFechas(query.fecha_inicio, query.fecha_fin);
  const where: WhereOptions = whereRangoFecha('fecha_venta', fechaInicio, fechaFin);
  if (query.prestador_id) {
    (where as Record<string, unknown>)['prestador_id'] = query.prestador_id;
  }

  const ventas = (await VentaBrazalete.findAll({
    where,
    include: [
      {
        model: User,
        as: 'prestador',
        attributes: ['nombre', 'email', 'telefono'],
      },
      {
        model: LoteBrazalete,
        as: 'lote',
        attributes: ['numero_lote', 'tipo'],
      },
    ],
    order: [['fecha_venta', 'DESC']],
  })) as unknown as VentaBrazaleteConRelaciones[];

  const totalBrazaletes = ventas.reduce((sum, venta) => sum + venta.cantidad, 0);
  const totalIngresos = ventas.reduce(
    (sum, venta) => sum + parseFloat(venta.total.toString()),
    0
  );

  const ventasPorPrestadorMap = new Map<string, VentasPorPrestadorDTO>();
  for (const venta of ventas) {
    const existente = ventasPorPrestadorMap.get(venta.prestador_id);
    if (!existente) {
      const prestador: PrestadorVentaResumenDTO | undefined = venta.prestador
        ? {
            nombre: venta.prestador.nombre,
            email: venta.prestador.email,
            ...(venta.prestador.telefono !== undefined
              ? { telefono: venta.prestador.telefono }
              : {}),
          }
        : undefined;
      ventasPorPrestadorMap.set(venta.prestador_id, {
        prestador,
        total_ventas: 1,
        total_brazaletes: venta.cantidad,
        total_ingresos: parseFloat(venta.total.toString()),
      });
      continue;
    }
    existente.total_ventas += 1;
    existente.total_brazaletes += venta.cantidad;
    existente.total_ingresos += parseFloat(venta.total.toString());
  }

  return {
    status: 'success',
    message: 'Reporte de ventas generado correctamente',
    data: {
      periodo: toPeriodo(fechaInicio, fechaFin),
      resumen: {
        total_ventas: ventas.length,
        total_brazaletes: totalBrazaletes,
        total_ingresos: totalIngresos,
      },
      ventas_detalle: ventas,
      ventas_por_prestador: [...ventasPorPrestadorMap.values()],
    },
  };
};

export const reporteUtilizacionService = async (
  query: ReporteUtilizacionQuery
): Promise<ApiResponse<ReporteUtilizacionResponse>> => {
  const { fechaInicio, fechaFin } = resolverRangoFechas(query.fecha_inicio, query.fecha_fin);
  const where: WhereOptions = {
    estado: EstadoBrazalete.UTILIZADO,
    ...whereRangoFecha('fecha_uso', fechaInicio, fechaFin),
  };
  if (query.tipo) {
    (where as Record<string, unknown>)['tipo'] = query.tipo;
  }

  const brazaletesUtilizados = await Brazalete.findAll({
    where,
    include: [
      {
        model: User,
        as: 'prestador',
        attributes: ['nombre', 'email'],
      },
      {
        model: LoteBrazalete,
        as: 'lote',
        attributes: ['numero_lote', 'tipo'],
      },
    ],
    order: [['fecha_uso', 'DESC']],
  });

  const porNacionalidad = {
    locales: brazaletesUtilizados.filter((b) => b.turista_nacionalidad === 'local').length,
    nacionales: brazaletesUtilizados.filter((b) => b.turista_nacionalidad === 'nacional').length,
    internacionales: brazaletesUtilizados.filter((b) => b.turista_nacionalidad === 'internacional')
      .length,
    sin_especificar: brazaletesUtilizados.filter((b) => !b.turista_nacionalidad).length,
  };

  const edades = brazaletesUtilizados
    .filter((b) => b.turista_edad !== null && b.turista_edad !== undefined)
    .map((b) => b.turista_edad as number);

  const estadisticasEdad =
    edades.length > 0
      ? {
          promedio: Math.round(edades.reduce((sum, edad) => sum + edad, 0) / edades.length),
          minima: Math.min(...edades),
          maxima: Math.max(...edades),
          total_con_edad: edades.length,
        }
      : null;

  return {
    status: 'success',
    message: 'Reporte de utilización generado correctamente',
    data: {
      periodo: toPeriodo(fechaInicio, fechaFin),
      resumen: {
        total_utilizados: brazaletesUtilizados.length,
        por_nacionalidad: porNacionalidad,
        por_tipo: { universal: brazaletesUtilizados.length },
        estadisticas_edad: estadisticasEdad,
      },
      utilizacion_detalle: brazaletesUtilizados,
    },
  };
};
