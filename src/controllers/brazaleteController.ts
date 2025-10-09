import { Request, Response } from "express";
import { Op } from "sequelize";
import LoteBrazalete from "../models/LoteBrazalete";
import Brazalete from "../models/Brazalete";
import VentaBrazalete from "../models/VentaBrazalete";
import User from "../models/User";
import Salida from "../models/Salida";
import { AuthRequest } from "../middleware/auth";

export class BrazaleteController {
  // ============================================================================
  // GESTIÓN DE INVENTARIO
  // ============================================================================

  /**
   * GET /api/brazaletes/inventario
   * Obtener estado actual del inventario
   */
  static async obtenerInventario(_req: Request, res: Response): Promise<void> {
    try {
      // Obtener totales por tipo (todos son universales ahora)
      // Solo contar brazaletes disponibles sin prestador asignado
      const inventarioUniversal = await Brazalete.count({
        where: {
          tipo: "universal",
          estado: "disponible",
          prestador_id: null,
        } as any,
      });

      const totalDisponibles = inventarioUniversal;

      // Obtener lotes activos y calcular valor del inventario
      const lotesActivosList = await LoteBrazalete.findAll({
        where: { estado: "activo" },
      });

      const lotesActivosCount = lotesActivosList.length;
      let valorInventario = 0;
      for (const lote of lotesActivosList) {
        valorInventario +=
          lote.cantidad_disponibles * parseFloat(lote.precio_venta.toString());
      }

      // Determinar si hay stock bajo (menos del 10% del total de brazaletes en el sistema)
      const totalBrazaletesSistema = await Brazalete.count({
        where: { tipo: "universal" },
      });
      const stockBajo =
        totalDisponibles < (totalBrazaletesSistema as number) * 0.1;

      res.json({
        success: true,
        data: {
          total_disponibles: totalDisponibles,
          por_tipo: {
            universal: inventarioUniversal,
          },
          stock_bajo: stockBajo,
          lotes_activos: lotesActivosCount,
          valor_inventario: valorInventario,
        },
      });
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * POST /api/brazaletes/lotes
   * Crear nuevo lote de brazaletes
   */
  static async crearLote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        numero_lote,
        cantidad_total,
        primer_numero,
        ultimo_numero,
        tipo = "universal",
        fecha_compra,
        fecha_vencimiento,
        costo_unitario,
        precio_venta,
        proveedor,
        observaciones,
      } = req.body;

      // Verificar que el usuario sea CONANP
      if (req.user?.rol !== "conanp") {
        res.status(403).json({
          success: false,
          message: "Solo CONANP puede crear lotes de brazaletes",
        });
        return;
      }

      // Verificar que el número de lote no exista
      const loteExistente = await LoteBrazalete.findOne({
        where: { numero_lote },
      });

      if (loteExistente) {
        res.status(400).json({
          success: false,
          message: "Ya existe un lote con ese número",
        });
        return;
      }

      // Determinar la cantidad y rango de números
      let cantidadReal: number;
      let numeroInicial: number;
      const año = new Date().getFullYear();

      if (primer_numero && ultimo_numero) {
        // Usar rango personalizado
        numeroInicial = primer_numero;
        cantidadReal = ultimo_numero - primer_numero + 1;

        // Verificar que no haya conflictos con códigos existentes
        const codigoInicial = `BRZ-${año}-${primer_numero
          .toString()
          .padStart(6, "0")}`;
        const codigoFinal = `BRZ-${año}-${ultimo_numero
          .toString()
          .padStart(6, "0")}`;

        const codigosExistentes = await Brazalete.count({
          where: {
            codigo: {
              [Op.between]: [codigoInicial, codigoFinal],
            },
          },
        });

        if (codigosExistentes > 0) {
          res.status(400).json({
            success: false,
            message: `Ya existen ${codigosExistentes} brazaletes en el rango ${primer_numero}-${ultimo_numero} para el año ${año}`,
          });
          return;
        }
      } else {
        // Usar generación automática (comportamiento actual)
        cantidadReal = cantidad_total || 0;

        // Obtener el último número secuencial usado
        const ultimoBrazalete = await Brazalete.findOne({
          where: {
            codigo: {
              [Op.like]: `BRZ-${año}-%`,
            },
          },
          order: [["codigo", "DESC"]],
        });

        numeroInicial = 1;
        if (ultimoBrazalete && ultimoBrazalete.codigo) {
          const partes = ultimoBrazalete.codigo.split("-");
          if (partes.length >= 3 && partes[2]) {
            const ultimoNumero = parseInt(partes[2]);
            if (!isNaN(ultimoNumero)) {
              numeroInicial = ultimoNumero + 1;
            }
          }
        }
      }

      // Crear el lote
      const loteData: any = {
        numero_lote,
        cantidad_total: cantidadReal,
        cantidad_disponibles: cantidadReal,
        tipo,
        fecha_compra: new Date(fecha_compra),
        costo_unitario,
        precio_venta,
        proveedor,
        observaciones,
      };

      if (fecha_vencimiento) {
        loteData.fecha_vencimiento = new Date(fecha_vencimiento);
      }

      const nuevoLote = await LoteBrazalete.create(loteData);

      // Generar brazaletes individuales
      const brazaletes = [];

      // Crear brazaletes individuales
      for (let i = 0; i < cantidadReal; i++) {
        const codigo = Brazalete.generarCodigo(año, numeroInicial + i);
        brazaletes.push({
          codigo,
          tipo,
          precio: precio_venta,
          lote_id: nuevoLote.id,
        });
      }

      await Brazalete.bulkCreate(brazaletes);

      res.status(201).json({
        success: true,
        data: {
          lote: nuevoLote,
          brazaletes_generados: cantidadReal,
          rango_numeros: {
            primer_numero: numeroInicial,
            ultimo_numero: numeroInicial + cantidadReal - 1,
            año: año,
          },
          message: "Lote creado exitosamente",
        },
      });
    } catch (error) {
      console.error("Error al crear lote:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/brazaletes/lotes
   * Listar lotes con filtros
   */
  static async listarLotes(req: Request, res: Response): Promise<void> {
    try {
      const { tipo, estado, page = 1, limit = 10 } = req.query;

      const whereClause: any = {};
      if (tipo) whereClause.tipo = tipo;
      if (estado) whereClause.estado = estado;

      const offset = (Number(page) - 1) * Number(limit);

      const { rows: lotes, count: total } = await LoteBrazalete.findAndCountAll(
        {
          where: whereClause,
          order: [["fecha_compra", "DESC"]],
          limit: Number(limit),
          offset,
          include: [
            {
              model: Brazalete,
              as: "brazaletes",
              attributes: ["id", "estado"],
              required: false,
            },
          ],
        }
      );

      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        success: true,
        data: {
          lotes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            total_pages: totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Error al listar lotes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ============================================================================
  // VENTA A PRESTADORES
  // ============================================================================

  /**
   * POST /api/brazaletes/venta
   * Vender brazaletes a un prestador
   */
  static async venderBrazaletes(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        prestador_id,
        cantidad,
        tipo = "universal",
        metodo_pago,
        estado_pago = "pendiente",
      } = req.body;

      // Verificar que el usuario sea CONANP
      if (req.user?.rol !== "conanp") {
        res.status(403).json({
          success: false,
          message: "Solo CONANP puede vender brazaletes",
        });
        return;
      }

      // Verificar que el prestador exista y esté activo
      const prestador = await User.findOne({
        where: { id: prestador_id, rol: "prestador", activo: true },
      });

      if (!prestador) {
        res.status(404).json({
          success: false,
          message: "Prestador no encontrado o inactivo",
        });
        return;
      }

      // Buscar lote activo con brazaletes disponibles del tipo solicitado
      const lote = await LoteBrazalete.findOne({
        where: {
          tipo,
          estado: "activo",
          cantidad_disponibles: { [Op.gte]: cantidad },
        },
        order: [["fecha_compra", "ASC"]], // FIFO
      });

      if (!lote) {
        res.status(400).json({
          success: false,
          message: `No hay suficientes brazaletes disponibles`,
        });
        return;
      }

      // Obtener brazaletes disponibles del lote
      const brazaletesDisponibles = await Brazalete.findAll({
        where: {
          lote_id: lote.id,
          estado: "disponible",
        },
        limit: cantidad,
        order: [["codigo", "ASC"]],
      });

      if (brazaletesDisponibles.length < cantidad) {
        res.status(400).json({
          success: false,
          message: "No hay suficientes brazaletes disponibles en el lote",
        });
        return;
      }

      // Crear registro de venta
      const venta = await VentaBrazalete.create({
        prestador_id,
        lote_id: lote.id,
        cantidad,
        precio_unitario: lote.precio_venta,
        total: cantidad * lote.precio_venta,
        metodo_pago,
        estado_pago,
      });

      // Vender brazaletes al prestador (mantienen estado disponible)
      const codigosBrazaletes = [];
      for (const brazalete of brazaletesDisponibles) {
        await brazalete.venderAPrestador(prestador_id);
        codigosBrazaletes.push(brazalete.codigo);
      }

      // Actualizar cantidades del lote
      await lote.actualizarDespuesVenta(cantidad);

      // Calcular rango de brazaletes vendidos
      const primerCodigo = codigosBrazaletes[0] || "";
      const ultimoCodigo =
        codigosBrazaletes[codigosBrazaletes.length - 1] || "";

      // Extraer números de los códigos (formato: BRZ-YYYY-NNNNNN)
      const extraerNumero = (codigo: string) => {
        if (!codigo) return 0;
        const partes = codigo.split("-");
        return partes.length >= 3 && partes[2] ? parseInt(partes[2]) : 0;
      };

      const numeroInicial = extraerNumero(primerCodigo);
      const numeroFinal = extraerNumero(ultimoCodigo);

      res.status(201).json({
        success: true,
        data: {
          venta: {
            id: venta.id,
            prestador_id: venta.prestador_id,
            lote_id: venta.lote_id,
            cantidad: venta.cantidad,
            precio_unitario: venta.precio_unitario,
            total: venta.total,
            fecha_venta: venta.fecha_venta,
            metodo_pago: venta.metodo_pago,
            estado_pago: venta.estado_pago,
          },
          rango_brazaletes: {
            numero_inicial: numeroInicial,
            numero_final: numeroFinal,
            cantidad_total: cantidad,
            primer_codigo: primerCodigo,
            ultimo_codigo: ultimoCodigo,
          },
          brazaletes_asignados: codigosBrazaletes,
          prestador: {
            id: prestador.id,
            nombre: prestador.nombre,
            email: prestador.email,
          },
          lote: {
            numero_lote: lote.numero_lote,
            tipo: lote.tipo,
          },
          message: "Venta realizada exitosamente",
        },
      });
    } catch (error) {
      console.error("Error al vender brazaletes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/brazaletes/prestador/:id
   * Obtener brazaletes de un prestador específico
   */
  static async obtenerBrazaletesPrestador(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que el prestador exista
      const prestador = await User.findOne({
        where: { id, rol: "prestador" },
      });

      if (!prestador) {
        res.status(404).json({
          success: false,
          message: "Prestador no encontrado",
        });
        return;
      }

      // Obtener estadísticas de brazaletes del prestador
      const disponibles = await Brazalete.count({
        where: { prestador_id: id, estado: "disponible" },
      });

      const asignados = await Brazalete.count({
        where: { prestador_id: id, estado: "asignado" },
      });

      const utilizados = await Brazalete.count({
        where: { prestador_id: id, estado: "utilizado" },
      });

      // Por tipo (todos son universales)
      const universal = await Brazalete.count({
        where: { prestador_id: id, tipo: "universal" },
      });

      // Obtener detalle de brazaletes
      const detalle = await Brazalete.findAll({
        where: { prestador_id: id },
        include: [
          {
            model: LoteBrazalete,
            as: "lote",
            attributes: ["numero_lote", "tipo"],
          },
          {
            model: Salida,
            as: "salida",
            attributes: ["id", "fecha"],
            required: false,
          },
        ],
        order: [["fecha_asignacion", "DESC"]],
      });

      res.json({
        success: true,
        data: {
          prestador: {
            id: prestador.id,
            nombre: prestador.nombre,
            email: prestador.email,
          },
          brazaletes: {
            disponibles,
            asignados,
            utilizados,
            por_tipo: {
              universal,
            },
          },
          detalle,
        },
      });
    } catch (error) {
      console.error("Error al obtener brazaletes del prestador:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ============================================================================
  // BÚSQUEDA DE BRAZALETES
  // ============================================================================

  /**
   * GET /api/brazaletes/search
   * Buscar brazaletes por código o filtros
   */
  static async buscarBrazaletes(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const {
        codigo,
        tipo,
        estado,
        prestador_id,
        lote_id,
        salida_id,
        fecha_inicio,
        fecha_fin,
        turista_nacionalidad,
        page = 1,
        limit = 20,
      } = req.query;

      // Construir condiciones de búsqueda
      const whereClause: any = {};

      // Filtro por código exacto
      if (codigo) {
        whereClause.codigo = codigo;
      }

      // Filtro por tipo
      if (tipo) {
        whereClause.tipo = tipo;
      }

      // Filtro por estado
      if (estado) {
        whereClause.estado = estado;
      }

      // Filtro por prestador
      if (prestador_id) {
        whereClause.prestador_id = prestador_id;
      }

      // Filtro por lote
      if (lote_id) {
        whereClause.lote_id = lote_id;
      }

      // Filtro por salida
      if (salida_id) {
        whereClause.salida_id = salida_id;
      }

      // Filtro por nacionalidad del turista
      if (turista_nacionalidad) {
        whereClause.turista_nacionalidad = turista_nacionalidad;
      }

      // Filtros de fecha
      if (fecha_inicio || fecha_fin) {
        whereClause.fecha_creacion = {};

        if (fecha_inicio) {
          whereClause.fecha_creacion[Op.gte] = new Date(fecha_inicio as string);
        }

        if (fecha_fin) {
          whereClause.fecha_creacion[Op.lte] = new Date(fecha_fin as string);
        }
      }

      // Si es prestador, solo puede ver sus propios brazaletes
      if (req.user?.rol === "prestador") {
        whereClause.prestador_id = req.user.id;
      }

      // Configurar paginación
      const offset = (Number(page) - 1) * Number(limit);
      const limitNumber = Number(limit);

      // Realizar búsqueda con paginación
      const { rows: brazaletes, count: total } =
        await Brazalete.findAndCountAll({
          where: whereClause,
          include: [
            {
              model: LoteBrazalete,
              as: "lote",
              attributes: ["id", "numero_lote", "tipo", "fecha_compra"],
            },
            {
              model: User,
              as: "prestador",
              attributes: ["id", "nombre", "email"],
              required: false,
            },
            {
              model: Salida,
              as: "salida",
              attributes: ["id", "fecha", "numero_pasajeros"],
              required: false,
            },
          ],
          order: [
            ["fecha_creacion", "DESC"],
            ["codigo", "ASC"],
          ],
          limit: limitNumber,
          offset,
        });

      // Calcular estadísticas de la búsqueda
      const estadisticas = {
        total_encontrados: total,
        por_estado: {
          disponible: 0,
          asignado: 0,
          utilizado: 0,
          perdido: 0,
        },
        por_nacionalidad: {
          local: 0,
          nacional: 0,
          internacional: 0,
        },
      };

      // Contar por estado y nacionalidad
      brazaletes.forEach((brazalete) => {
        estadisticas.por_estado[
          brazalete.estado as keyof typeof estadisticas.por_estado
        ]++;

        if (brazalete.turista_nacionalidad) {
          estadisticas.por_nacionalidad[
            brazalete.turista_nacionalidad as keyof typeof estadisticas.por_nacionalidad
          ]++;
        }
      });

      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        success: true,
        data: {
          brazaletes,
          estadisticas,
          pagination: {
            page: Number(page),
            limit: limitNumber,
            total,
            total_pages: totalPages,
            has_next: Number(page) < totalPages,
            has_prev: Number(page) > 1,
          },
          filtros_aplicados: {
            codigo: codigo || null,
            tipo: tipo || null,
            estado: estado || null,
            prestador_id: prestador_id || null,
            lote_id: lote_id || null,
            salida_id: salida_id || null,
            fecha_inicio: fecha_inicio || null,
            fecha_fin: fecha_fin || null,
            turista_nacionalidad: turista_nacionalidad || null,
          },
        },
        message: `Se encontraron ${total} brazaletes`,
      });
    } catch (error) {
      console.error("Error al buscar brazaletes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // ============================================================================
  // USO EN SALIDAS
  // ============================================================================

  /**
   * POST /api/brazaletes/asignar
   * Asignar brazaletes a una salida
   */
  static async asignarBrazaletes(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      console.log("🔍 Iniciando asignación de brazaletes...");
      console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
      console.log("👤 Usuario autenticado:", req.user?.id, req.user?.rol);

      const { salida_id, cantidad, fecha_asignacion } = req.body;

      // Verificar que la salida exista y pertenezca al prestador
      const salida = await Salida.findOne({
        where: { id: salida_id },
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      if (!salida) {
        res.status(404).json({
          success: false,
          message: "Salida no encontrada",
          error: "SALIDA_NOT_FOUND",
        });
        return;
      }

      // Verificar que el prestador autenticado sea el propietario de la salida
      if (salida.prestador_id !== req.user!.id) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para asignar brazaletes a esta salida",
          error: "FORBIDDEN",
        });
        return;
      }

      // Obtener brazaletes disponibles del prestador (estado disponible)
      const brazaletesDisponibles = await Brazalete.findAll({
        where: {
          prestador_id: req.user!.id,
          estado: "disponible",
        },
        limit: cantidad,
        order: [["fecha_creacion", "ASC"]], // FIFO - First In, First Out
      });

      if (brazaletesDisponibles.length < cantidad) {
        res.status(400).json({
          success: false,
          message: `No hay suficientes brazaletes disponibles. Disponibles: ${brazaletesDisponibles.length}, Solicitados: ${cantidad}`,
          error: "INSUFFICIENT_BRACELETS",
          data: {
            disponibles: brazaletesDisponibles.length,
            solicitados: cantidad,
          },
        });
        return;
      }

      // Asignar los brazaletes a la salida
      const fechaAsignacion = new Date(fecha_asignacion);
      const brazaletesAsignados = [];

      for (const brazalete of brazaletesDisponibles) {
        // Asignar brazalete a la salida (cambia estado a "asignado")
        await brazalete.asignarAPrestador(req.user!.id);
        // Actualizar la fecha de asignación específica y asignar a la salida
        await brazalete.update({
          fecha_asignacion: fechaAsignacion,
          salida_id: salida_id, // ✅ Asignar la salida_id
        });
        await brazalete.reload(); // Recargar para obtener los datos actualizados

        brazaletesAsignados.push({
          id: brazalete.id,
          codigo: brazalete.codigo,
          tipo: brazalete.tipo,
          estado: brazalete.estado,
          fecha_asignacion: brazalete.fecha_asignacion,
          salida_id: brazalete.salida_id, // ✅ Incluir salida_id en la respuesta
        });
      }

      console.log(
        `✅ ${brazaletesAsignados.length} brazaletes asignados exitosamente`
      );

      res.status(201).json({
        success: true,
        message: `${brazaletesAsignados.length} brazaletes asignados exitosamente a la salida`,
        data: {
          salida_id: salida_id,
          cantidad_asignada: brazaletesAsignados.length,
          fecha_asignacion: fechaAsignacion.toISOString(),
          brazaletes: brazaletesAsignados,
        },
      });
    } catch (error) {
      console.error("Error al asignar brazaletes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * POST /api/brazaletes/uso
   * Registrar uso de brazalete en una salida
   */
  static async registrarUso(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log("🔍 Iniciando registro de uso de brazaletes...");
      console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
      console.log("👤 Usuario autenticado:", req.user?.id, req.user?.rol);

      const { salida_id, brazaletes } = req.body;

      // Verificar que la salida exista y pertenezca al prestador
      const salida = await Salida.findOne({
        where: { id: salida_id },
      });

      if (!salida) {
        res.status(404).json({
          success: false,
          message: "Salida no encontrada",
        });
        return;
      }

      // Verificar que el prestador pueda usar los brazaletes
      if (
        req.user?.rol === "prestador" &&
        salida.prestador_id !== req.user.id
      ) {
        res.status(403).json({
          success: false,
          message: "No tienes permisos para usar brazaletes en esta salida",
        });
        return;
      }

      let brazaletesUtilizados = 0;
      const errores = [];

      // Procesar cada brazalete
      for (const brazaleteData of brazaletes) {
        try {
          const brazalete = await Brazalete.findOne({
            where: { codigo: brazaleteData.codigo },
          });

          if (!brazalete) {
            errores.push(`Brazalete ${brazaleteData.codigo} no encontrado`);
            continue;
          }

          // Verificar que el brazalete pueda ser usado
          if (!brazalete.puedeSerUtilizado()) {
            errores.push(
              `Brazalete ${brazaleteData.codigo} no puede ser utilizado`
            );
            continue;
          }

          // Verificar que el brazalete pertenezca al prestador de la salida
          if (brazalete.prestador_id !== salida.prestador_id) {
            errores.push(
              `Brazalete ${brazaleteData.codigo} no pertenece al prestador`
            );
            continue;
          }

          // Registrar uso del brazalete
          await brazalete.usarEnSalida(
            salida_id,
            brazaleteData.turista_nacionalidad,
            brazaleteData.turista_edad,
            brazaleteData.fecha_uso
              ? new Date(brazaleteData.fecha_uso)
              : undefined
          );

          // Actualizar contador del lote
          const lote = await LoteBrazalete.findByPk(brazalete.lote_id);
          if (lote) {
            await lote.actualizarDespuesUso(1);
          }

          brazaletesUtilizados++;
        } catch (error) {
          errores.push(
            `Error con brazalete ${brazaleteData.codigo}: ${
              error instanceof Error ? error.message : "Error desconocido"
            }`
          );
        }
      }

      res.json({
        success: true,
        data: {
          brazaletes_utilizados: brazaletesUtilizados,
          errores: errores.length > 0 ? errores : undefined,
          message: `${brazaletesUtilizados} brazaletes utilizados exitosamente`,
        },
      });
    } catch (error) {
      console.error("Error al registrar uso:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * GET /api/brazaletes/uso/salida/:id
   * Obtener brazaletes utilizados en una salida
   */
  static async obtenerBrazaletesSalida(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que la salida exista
      const salida = await Salida.findByPk(id);

      if (!salida) {
        res.status(404).json({
          success: false,
          message: "Salida no encontrada",
        });
        return;
      }

      // Obtener brazaletes utilizados en la salida
      const brazaletesUtilizados = await Brazalete.findAll({
        where: { salida_id: id },
        include: [
          {
            model: LoteBrazalete,
            as: "lote",
            attributes: ["numero_lote", "tipo"],
          },
          {
            model: User,
            as: "prestador",
            attributes: ["nombre", "email"],
          },
        ],
      });

      // Calcular estadísticas
      const totalBrazaletes = brazaletesUtilizados.length;
      const porNacionalidad = {
        locales: brazaletesUtilizados.filter(
          (b) => b.turista_nacionalidad === "local"
        ).length,
        nacionales: brazaletesUtilizados.filter(
          (b) => b.turista_nacionalidad === "nacional"
        ).length,
        internacionales: brazaletesUtilizados.filter(
          (b) => b.turista_nacionalidad === "internacional"
        ).length,
      };

      res.json({
        success: true,
        data: {
          salida: {
            id: salida.id,
            fecha: salida.fecha,
            numero_pasajeros: salida.numero_pasajeros,
          },
          brazaletes_utilizados: brazaletesUtilizados,
          estadisticas: {
            total_brazaletes: totalBrazaletes,
            por_nacionalidad: porNacionalidad,
          },
        },
      });
    } catch (error) {
      console.error("Error al obtener brazaletes de salida:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * PUT /api/brazaletes/uso/actualizar
   * Actualizar todos los brazaletes de una salida a estado "utilizado"
   */
  static async actualizarUso(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log(
        "🔍 Iniciando actualización de uso de brazaletes por salida..."
      );
      console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
      console.log("👤 Usuario autenticado:", req.user?.id, req.user?.rol);

      const { salida_id, fecha_uso, motivo } = req.body;

      // Verificar que la salida exista
      const salida = await Salida.findOne({
        where: { id: salida_id },
        include: [
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email"],
          },
        ],
      });

      if (!salida) {
        res.status(404).json({
          success: false,
          message: "Salida no encontrada",
          error: "SALIDA_NOT_FOUND",
        });
        return;
      }

      // Verificar permisos según el rol
      if (req.user?.rol === "prestador") {
        // Los prestadores solo pueden actualizar brazaletes de sus propias salidas
        if (salida.prestador_id !== req.user.id) {
          res.status(403).json({
            success: false,
            message:
              "No tienes permisos para actualizar brazaletes de esta salida",
            error: "FORBIDDEN",
          });
          return;
        }
      }

      // Buscar todos los brazaletes asignados a esta salida
      const brazaletesAsignados = await Brazalete.findAll({
        where: {
          salida_id: salida_id,
          estado: "asignado", // Solo actualizar los que están asignados
        },
        include: [
          {
            model: LoteBrazalete,
            as: "lote",
            attributes: ["numero_lote", "tipo"],
          },
          {
            model: User,
            as: "prestador",
            attributes: ["id", "nombre", "email"],
          },
        ],
        order: [["codigo", "ASC"]],
      });

      if (brazaletesAsignados.length === 0) {
        res.status(404).json({
          success: false,
          message: "No se encontraron brazaletes asignados a esta salida",
          error: "NO_BRACELETS_FOUND",
          data: {
            salida_id: salida_id,
            estado_buscado: "asignado",
          },
        });
        return;
      }

      // Validar que la fecha de uso sea posterior a la fecha de asignación
      const fechaUso = new Date(fecha_uso);
      const brazaletesConFechaInvalida = brazaletesAsignados.filter(
        (brazalete) => {
          if (brazalete.fecha_asignacion) {
            const fechaAsignacion = new Date(brazalete.fecha_asignacion);
            return fechaUso < fechaAsignacion;
          }
          return false;
        }
      );

      if (brazaletesConFechaInvalida.length > 0) {
        res.status(400).json({
          success: false,
          message:
            "La fecha de uso debe ser posterior a la fecha de asignación de todos los brazaletes",
          error: "FECHA_USO_INVALID",
          data: {
            fecha_uso: fechaUso.toISOString(),
            brazaletes_afectados: brazaletesConFechaInvalida.map((b) => ({
              codigo: b.codigo,
              fecha_asignacion: b.fecha_asignacion,
            })),
          },
        });
        return;
      }

      // Actualizar todos los brazaletes
      const brazaletesActualizados = [];
      const errores = [];
      let contadorLotes: Record<string, number> = {};

      for (const brazalete of brazaletesAsignados) {
        try {
          // Actualizar el brazalete
          await brazalete.update({
            estado: "utilizado",
            fecha_uso: fechaUso,
          });

          // Contar para actualizar lotes
          const loteId = brazalete.lote_id;
          contadorLotes[loteId] = (contadorLotes[loteId] || 0) + 1;

          brazaletesActualizados.push({
            id: brazalete.id,
            codigo: brazalete.codigo,
            tipo: brazalete.tipo,
            estado_anterior: "asignado",
            estado_actual: "utilizado",
            fecha_uso: fechaUso.toISOString(),
            lote_id: loteId,
            prestador_id: brazalete.prestador_id,
          });
        } catch (error) {
          errores.push({
            codigo: brazalete.codigo,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      }

      // Actualizar contadores de lotes
      for (const [loteId, cantidad] of Object.entries(contadorLotes)) {
        try {
          const lote = await LoteBrazalete.findByPk(loteId);
          if (lote) {
            await lote.actualizarDespuesUso(cantidad);
          }
        } catch (error) {
          console.error(`Error al actualizar lote ${loteId}:`, error);
        }
      }

      console.log(
        `✅ ${brazaletesActualizados.length} brazaletes actualizados exitosamente`
      );

      res.json({
        success: true,
        message: `${brazaletesActualizados.length} brazaletes actualizados exitosamente`,
        data: {
          salida: {
            id: salida.id,
            fecha: salida.fecha,
            numero_pasajeros: salida.numero_pasajeros,
            prestador: {
              id: salida.prestador_id,
            },
          },
          fecha_uso: fechaUso.toISOString(),
          brazaletes_actualizados: brazaletesActualizados,
          resumen: {
            total_encontrados: brazaletesAsignados.length,
            total_actualizados: brazaletesActualizados.length,
            total_errores: errores.length,
            lotes_afectados: Object.keys(contadorLotes).length,
          },
          errores: errores.length > 0 ? errores : undefined,
          motivo: motivo || null,
        },
      });
    } catch (error) {
      console.error("Error al actualizar uso de brazaletes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}

export default BrazaleteController;
