import { Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import { Brazalete, LoteBrazalete, sequelize, User, VentaBrazalete } from '../models';
import { ApiResponse, TipoBrazalete } from '../types';
import {
  CrearLoteDTO,
  CrearLoteResponse,
  InventarioResponse,
  ListarLotesQuery,
  ListarLotesResponse,
  VenderBrazaletesDTO,
  VenderBrazaletesResponse,
} from '../types/brazalete.types';
import { getTodayMexico } from '../utils/dateUtils';

export const obtenerInventarioService = async (): Promise<ApiResponse<InventarioResponse>> => {
  const inventarioUniversal = await Brazalete.count({
    where: {
      tipo: 'universal',
      estado: 'disponible',
      prestador_id: null,
    },
  });

  const lotesActivosList = await LoteBrazalete.findAll({
    where: { estado: 'activo' },
  });

  let valorInventario = 0;
  for (const lote of lotesActivosList) {
    valorInventario += lote.cantidad_disponibles * parseFloat(lote.precio_venta.toString());
  }

  const totalBrazaletesSistema = await Brazalete.count({ where: { tipo: 'universal' } });
  const stockBajo = inventarioUniversal < totalBrazaletesSistema * 0.1;

  return {
    status: 'success',
    message: 'Inventario obtenido correctamente',
    data: {
      total_disponibles: inventarioUniversal,
      por_tipo: {
        universal: inventarioUniversal,
      },
      stock_bajo: stockBajo,
      lotes_activos: lotesActivosList.length,
      valor_inventario: valorInventario,
    },
  };
};

export const crearLoteService = async (
  data: CrearLoteDTO
): Promise<ApiResponse<CrearLoteResponse>> => {
  const loteExistente = await LoteBrazalete.findOne({ where: { numero_lote: data.numero_lote } });
  if (loteExistente) throw new AppError('Ya existe un lote con ese número', 400);

  let cantidadReal: number;
  let numeroInicial: number;
  const año = new Date().getFullYear();

  if (data.primer_numero !== undefined && data.ultimo_numero !== undefined) {
    numeroInicial = data.primer_numero;
    cantidadReal = data.ultimo_numero - data.primer_numero + 1;

    const codigoInicial = `BRZ-${año}-${data.primer_numero.toString().padStart(6, '0')}`;
    const codigoFinal = `BRZ-${año}-${data.ultimo_numero.toString().padStart(6, '0')}`;

    const codigosExistentes = await Brazalete.count({
      where: {
        codigo: {
          [Op.between]: [codigoInicial, codigoFinal],
        },
      },
    });

    if (codigosExistentes > 0) {
      throw new AppError(
        `Ya existen ${codigosExistentes} brazaletes en el rango ${data.primer_numero}-${data.ultimo_numero} para el año ${año}`,
        400
      );
    }
  } else {
    cantidadReal = data.cantidad_total || 0;

    const ultimoBrazalete = await Brazalete.findOne({
      where: {
        codigo: {
          [Op.like]: `BRZ-${año}-%`,
        },
      },
      order: [['codigo', 'DESC']],
    });

    numeroInicial = 1;
    if (ultimoBrazalete?.codigo) {
      const partes = ultimoBrazalete.codigo.split('-');
      if (partes.length >= 3 && partes[2]) {
        const ultimoNumero = parseInt(partes[2], 10);
        if (!isNaN(ultimoNumero)) numeroInicial = ultimoNumero + 1;
      }
    }
  }

  const tipo = data.tipo || TipoBrazalete.UNIVERSAL;

  const nuevoLote = await sequelize.transaction(async (transaction) => {
    const lote = await LoteBrazalete.create(
      {
        numero_lote: data.numero_lote,
        cantidad_total: cantidadReal,
        cantidad_disponibles: cantidadReal,
        tipo,
        fecha_compra: data.fecha_compra,
        costo_unitario: data.costo_unitario,
        precio_venta: data.precio_venta,
        ...(data.proveedor !== undefined ? { proveedor: data.proveedor } : {}),
        ...(data.observaciones !== undefined ? { observaciones: data.observaciones } : {}),
        ...(data.fecha_vencimiento !== undefined
          ? { fecha_vencimiento: data.fecha_vencimiento }
          : {}),
      },
      { transaction }
    );

    const brazaletes = [];
    for (let i = 0; i < cantidadReal; i++) {
      brazaletes.push({
        codigo: Brazalete.generarCodigo(año, numeroInicial + i),
        tipo,
        precio: data.precio_venta,
        lote_id: lote.id,
      });
    }
    await Brazalete.bulkCreate(brazaletes, { transaction });

    return lote;
  });

  return {
    status: 'success',
    message: 'Lote creado correctamente',
    data: {
      lote: nuevoLote.toJSON(),
      brazaletes_generados: cantidadReal,
      rango_numeros: {
        primer_numero: numeroInicial,
        ultimo_numero: numeroInicial + cantidadReal - 1,
        año,
      },
    },
  };
};

export const listarLotesService = async (
  query: ListarLotesQuery
): Promise<ApiResponse<ListarLotesResponse>> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const whereClause: WhereOptions = {};
  if (query.tipo) whereClause['tipo'] = query.tipo;
  if (query.estado) whereClause['estado'] = query.estado;

  const offset = (page - 1) * limit;

  const { rows: lotes, count: total } = await LoteBrazalete.findAndCountAll({
    where: whereClause,
    order: [['fecha_compra', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: Brazalete,
        as: 'brazaletes',
        attributes: ['id', 'estado'],
        required: false,
      },
    ],
  });

  return {
    status: 'success',
    message: 'Lotes listados correctamente',
    data: {
      lotes: lotes.map((lote) => lote.toJSON()),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    },
  };
};

export const venderBrazaletesService = async (
  data: VenderBrazaletesDTO
): Promise<ApiResponse<VenderBrazaletesResponse>> => {
  const { prestador_id, cantidad, tipo, metodo_pago, primer_numero, ultimo_numero, año, lote_id } =
    data;

  const prestador = await User.findOne({
    where: { id: prestador_id, rol: 'prestador', activo: true },
  });
  if (!prestador) throw new AppError('Prestador no encontrado o inactivo', 404);

  const fechaAsignacion = getTodayMexico();

  if (primer_numero !== undefined && ultimo_numero !== undefined) {
    const añoActual = año || new Date().getFullYear();
    const codigosRango: string[] = [];
    for (let i = primer_numero; i <= ultimo_numero; i++) {
      codigosRango.push(Brazalete.generarCodigo(añoActual, i));
    }

    const whereClause: WhereOptions = {
      codigo: { [Op.in]: codigosRango },
      estado: 'disponible',
      [Op.and]: [sequelize.where(sequelize.col('prestador_id'), 'IS', null)],
    };
    if (lote_id) whereClause['lote_id'] = lote_id;

    const brazaletesDisponibles = await Brazalete.findAll({
      where: whereClause,
      order: [['codigo', 'ASC']],
      include: [
        {
          model: LoteBrazalete,
          as: 'lote',
          where: { estado: 'activo' },
        },
      ],
    });

    if (brazaletesDisponibles.length < cantidad) {
      const codigosEncontrados = brazaletesDisponibles.map((b) => b.codigo);
      const faltantes = codigosRango.length - codigosEncontrados.length;
      throw new AppError(
        `No todos los brazaletes del rango ${primer_numero}-${ultimo_numero} están disponibles: ${faltantes}`,
        400
      );
    }

    const loteVenta = lote_id
      ? await LoteBrazalete.findByPk(lote_id)
      : brazaletesDisponibles[0]?.lote_id
        ? await LoteBrazalete.findByPk(brazaletesDisponibles[0].lote_id)
        : null;

    if (!loteVenta) {
      throw new AppError('No se encontró un lote activo para los brazaletes del rango', 404);
    }

    const ids = brazaletesDisponibles.map((b) => b.id);
    const loteIds = [...new Set(brazaletesDisponibles.map((b) => b.lote_id))];

    const venta = await sequelize.transaction(async (transaction) => {
      const nuevaVenta = await VentaBrazalete.create(
        {
          prestador_id,
          lote_id: loteVenta.id,
          cantidad,
          precio_unitario: loteVenta.precio_venta,
          total: cantidad * loteVenta.precio_venta,
          metodo_pago: metodo_pago ?? 'efectivo',
          estado_pago: 'pendiente',
        },
        { transaction }
      );

      await Brazalete.update(
        { prestador_id, fecha_asignacion: fechaAsignacion },
        { where: { id: { [Op.in]: ids } }, transaction }
      );

      for (const loteIdActualizar of loteIds) {
        const loteActualizar = await LoteBrazalete.findByPk(loteIdActualizar, { transaction });
        if (loteActualizar) {
          const cantidadDelLote = brazaletesDisponibles.filter(
            (b) => b.lote_id === loteIdActualizar
          ).length;
          await loteActualizar.actualizarDespuesVenta(cantidadDelLote, transaction);
        }
      }

      return nuevaVenta;
    });

    const codigosBrazaletes = brazaletesDisponibles.map((b) => b.codigo);

    return {
      status: 'success',
      message: 'Brazaletes vendidos exitosamente',
      data: {
        venta: venta.toJSON(),
        modo_venta: 'rango_especifico',
        rango_brazaletes: {
          numero_inicial: primer_numero,
          numero_final: ultimo_numero,
          año: añoActual,
          cantidad_total: cantidad,
          primer_codigo: codigosBrazaletes[0],
          ultimo_codigo: codigosBrazaletes[codigosBrazaletes.length - 1],
        },
        brazaletes_asignados: codigosBrazaletes,
        prestador: {
          id: prestador.id,
          nombre: prestador.nombre,
          email: prestador.email,
        },
        lote: {
          numero_lote: loteVenta.numero_lote,
          tipo: loteVenta.tipo as TipoBrazalete,
        },
      },
    };
  }

  const whereConditions: WhereOptions = {
    tipo: tipo ?? TipoBrazalete.UNIVERSAL,
    estado: 'activo',
    cantidad_disponibles: { [Op.gte]: cantidad },
  };
  if (lote_id) whereConditions['id'] = lote_id;

  const lote = await LoteBrazalete.findOne({
    where: whereConditions,
    order: [['fecha_compra', 'ASC']],
  });

  if (!lote) {
    throw new AppError(
      lote_id
        ? 'No hay suficientes brazaletes disponibles en el lote especificado'
        : 'No hay suficientes brazaletes disponibles',
      400
    );
  }

  const brazaletesDisponibles = await Brazalete.findAll({
    where: {
      lote_id: lote.id,
      estado: 'disponible',
      [Op.and]: [sequelize.where(sequelize.col('prestador_id'), 'IS', null)],
    },
    limit: cantidad,
    order: [['codigo', 'ASC']],
  });
  if (brazaletesDisponibles.length < cantidad) {
    throw new AppError('No hay suficientes brazaletes disponibles en el lote', 400);
  }

  const ids = brazaletesDisponibles.map((b) => b.id);

  const venta = await sequelize.transaction(async (transaction) => {
    const nuevaVenta = await VentaBrazalete.create(
      {
        prestador_id,
        lote_id: lote.id,
        cantidad,
        precio_unitario: lote.precio_venta,
        total: cantidad * lote.precio_venta,
        metodo_pago: metodo_pago ?? 'efectivo',
        estado_pago: 'pendiente',
      },
      { transaction }
    );

    await Brazalete.update(
      { prestador_id, fecha_asignacion: fechaAsignacion },
      { where: { id: { [Op.in]: ids } }, transaction }
    );

    await lote.actualizarDespuesVenta(cantidad, transaction);
    return nuevaVenta;
  });

  const extraerNumero = (codigo: string): number => {
    const partes = codigo.split('-');
    return partes.length >= 3 && partes[2] ? parseInt(partes[2], 10) : 0;
  };

  const primerCodigo = brazaletesDisponibles[0]?.codigo;
  const ultimoCodigo = brazaletesDisponibles[brazaletesDisponibles.length - 1]?.codigo;

  return {
    status: 'success',
    message: 'Brazaletes vendidos exitosamente',
    data: {
      venta: venta.toJSON(),
      modo_venta: 'automatico_fifo',
      rango_brazaletes: {
        numero_inicial: primerCodigo ? extraerNumero(primerCodigo) : 0,
        numero_final: ultimoCodigo ? extraerNumero(ultimoCodigo) : 0,
        cantidad_total: cantidad,
        primer_codigo: primerCodigo,
        ultimo_codigo: ultimoCodigo,
      },
      brazaletes_asignados: brazaletesDisponibles.map((b) => b.codigo),
      prestador: {
        id: prestador.id,
        nombre: prestador.nombre,
        email: prestador.email,
      },
      lote: {
        numero_lote: lote.numero_lote,
        tipo: lote.tipo as TipoBrazalete,
      },
    },
  };
};
