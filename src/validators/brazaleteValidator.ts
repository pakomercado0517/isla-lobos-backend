import { body, param, query, ValidationChain } from "express-validator";

export class BrazaleteValidator {
  // ============================================================================
  // VALIDADORES PARA LOTES
  // ============================================================================

  static crearLote: ValidationChain[] = [
    body("numero_lote")
      .notEmpty()
      .withMessage("El número de lote es obligatorio")
      .isLength({ min: 1, max: 50 })
      .withMessage("El número de lote debe tener entre 1 y 50 caracteres")
      .matches(/^[A-Za-z0-9\-_]+$/)
      .withMessage(
        "El número de lote solo puede contener letras, números, guiones y guiones bajos"
      ),

    body("cantidad_total")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La cantidad total debe ser un número entero mayor a 0")
      .custom((value, { req }) => {
        const { primer_numero, ultimo_numero } = req.body;

        // Si se especifican primer y último número, cantidad_total debe coincidir o ser omitida
        if (primer_numero && ultimo_numero) {
          const cantidadCalculada = ultimo_numero - primer_numero + 1;
          if (value && value !== cantidadCalculada) {
            throw new Error(
              `La cantidad total (${value}) no coincide con el rango especificado (${cantidadCalculada})`
            );
          }
        } else if (!value) {
          throw new Error(
            "La cantidad total es obligatoria si no se especifica primer_numero y ultimo_numero"
          );
        }
        return true;
      }),

    body("primer_numero")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El primer número debe ser un entero mayor a 0"),

    body("ultimo_numero")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El último número debe ser un entero mayor a 0")
      .custom((value, { req }) => {
        const { primer_numero } = req.body;

        if (value && primer_numero) {
          if (value <= primer_numero) {
            throw new Error("El último número debe ser mayor al primer número");
          }
        } else if ((value && !primer_numero) || (!value && primer_numero)) {
          throw new Error(
            "Si especificas primer_numero o ultimo_numero, debes especificar ambos"
          );
        }
        return true;
      }),

    body("tipo")
      .optional()
      .isIn(["universal"])
      .withMessage("El tipo debe ser 'universal'")
      .default("universal"),

    body("fecha_compra")
      .isISO8601()
      .withMessage(
        "La fecha de compra debe ser una fecha válida en formato ISO8601"
      )
      .custom((value) => {
        const fecha = new Date(value);
        const hoy = new Date();
        if (fecha > hoy) {
          throw new Error("La fecha de compra no puede ser futura");
        }
        return true;
      }),

    body("fecha_vencimiento")
      .optional({ nullable: true, checkFalsy: false })
      .custom((value, { req }) => {
        // Si el valor es null, undefined o string vacío, es válido (opcional)
        if (
          !value ||
          value === null ||
          value === undefined ||
          value.trim() === ""
        ) {
          return true;
        }

        // Si hay valor, validar que sea una fecha ISO8601 válida
        const fechaRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        if (!fechaRegex.test(value)) {
          throw new Error(
            "La fecha de vencimiento debe ser una fecha válida en formato ISO8601"
          );
        }

        // Validar que la fecha de vencimiento sea posterior a la fecha de compra
        const fechaVencimiento = new Date(value);
        const fechaCompra = new Date(req.body.fecha_compra);
        if (fechaVencimiento <= fechaCompra) {
          throw new Error(
            "La fecha de vencimiento debe ser posterior a la fecha de compra"
          );
        }

        return true;
      }),

    body("costo_unitario")
      .isFloat({ min: 0 })
      .withMessage("El costo unitario debe ser un número mayor o igual a 0"),

    body("precio_venta")
      .isFloat({ min: 0 })
      .withMessage("El precio de venta debe ser un número mayor o igual a 0")
      .custom((value, { req }) => {
        const costoUnitario = parseFloat(req.body.costo_unitario);
        const precioVenta = parseFloat(value);
        if (precioVenta <= costoUnitario) {
          throw new Error(
            "El precio de venta debe ser mayor al costo unitario"
          );
        }
        return true;
      }),

    body("proveedor")
      .optional()
      .isLength({ max: 100 })
      .withMessage("El proveedor no puede exceder 100 caracteres"),

    body("observaciones")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Las observaciones no pueden exceder 1000 caracteres"),
  ];

  static listarLotes: ValidationChain[] = [
    query("tipo")
      .optional()
      .isIn(["universal"])
      .withMessage("El tipo debe ser 'universal'"),

    query("estado")
      .optional()
      .isIn(["activo", "agotado", "vencido", "cancelado"])
      .withMessage(
        "El estado debe ser 'activo', 'agotado', 'vencido' o 'cancelado'"
      ),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La página debe ser un número entero mayor a 0"),

    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El límite debe ser un número entero mayor a 0"),
  ];

  // ============================================================================
  // VALIDADORES PARA VENTAS
  // ============================================================================

  static venderBrazaletes: ValidationChain[] = [
    body("prestador_id")
      .notEmpty()
      .withMessage("El ID del prestador es obligatorio")
      .isUUID()
      .withMessage("El ID del prestador debe ser un UUID válido"),

    body("cantidad")
      .isInt({ min: 1, max: 1000 })
      .withMessage("La cantidad debe ser un número entero entre 1 y 1000")
      .custom((value, { req }) => {
        const { primer_numero, ultimo_numero } = req.body;
        
        // Si se especifican primer y último número, validar que la cantidad coincida
        if (primer_numero && ultimo_numero) {
          const cantidadCalculada = ultimo_numero - primer_numero + 1;
          if (value !== cantidadCalculada) {
            throw new Error(
              `La cantidad (${value}) no coincide con el rango especificado: ${primer_numero}-${ultimo_numero} (${cantidadCalculada} brazaletes)`
            );
          }
        }
        return true;
      }),

    body("tipo")
      .isIn(["universal"])
      .withMessage("El tipo debe ser 'universal'"),

    body("metodo_pago")
      .optional()
      .isIn(["efectivo", "transferencia", "credito", "debito"])
      .withMessage(
        "El método de pago debe ser 'efectivo', 'transferencia', 'credito' o 'debito'"
      ),

    body("estado_pago")
      .optional()
      .isIn(["pendiente", "pagado", "cancelado"])
      .withMessage(
        "El estado de pago debe ser 'pendiente', 'pagado' o 'cancelado'"
      ),

    // ⭐ NUEVOS PARÁMETROS OPCIONALES PARA VENTA POR RANGO
    body("primer_numero")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El primer número debe ser un entero mayor a 0"),

    body("ultimo_numero")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El último número debe ser un entero mayor a 0")
      .custom((value, { req }) => {
        const { primer_numero } = req.body;

        if (value && primer_numero) {
          if (value <= primer_numero) {
            throw new Error("El último número debe ser mayor al primer número");
          }
        } else if ((value && !primer_numero) || (!value && primer_numero)) {
          throw new Error(
            "Si especificas primer_numero o ultimo_numero, debes especificar ambos"
          );
        }
        return true;
      }),

    body("año")
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage("El año debe ser un número entero entre 2000 y 2100")
      .custom((value) => {
        if (value) {
          const añoActual = new Date().getFullYear();
          if (value > añoActual) {
            throw new Error("El año no puede ser futuro");
          }
        }
        return true;
      }),

    body("lote_id")
      .optional()
      .isUUID()
      .withMessage("El ID del lote debe ser un UUID válido"),
  ];

  static obtenerBrazaletesPrestador: ValidationChain[] = [
    param("id")
      .isUUID()
      .withMessage("El ID del prestador debe ser un UUID válido"),
  ];

  // ============================================================================
  // VALIDADORES PARA USO DE BRAZALETES
  // ============================================================================

  static asignarBrazaletes: ValidationChain[] = [
    body("salida_id")
      .notEmpty()
      .withMessage("El ID de la salida es obligatorio")
      .isUUID()
      .withMessage("El ID de la salida debe ser un UUID válido"),

    body("cantidad")
      .notEmpty()
      .withMessage("La cantidad es obligatoria")
      .isInt({ min: 1, max: 100 })
      .withMessage("La cantidad debe ser un número entero entre 1 y 100"),

    body("fecha_asignacion")
      .notEmpty()
      .withMessage("La fecha de asignación es obligatoria")
      .isISO8601()
      .withMessage(
        "La fecha de asignación debe ser una fecha válida en formato ISO 8601"
      )
      .custom((value) => {
        const fechaAsignacion = new Date(value);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Permitir fechas anteriores pero con límite de 30 días
        const fechaMinima = new Date();
        fechaMinima.setDate(fechaMinima.getDate() - 30);
        fechaMinima.setHours(0, 0, 0, 0);

        if (fechaAsignacion < fechaMinima) {
          throw new Error(
            "La fecha de asignación no puede ser anterior a 30 días"
          );
        }

        // Verificar que no sea más de 7 días en el futuro
        const maxFecha = new Date();
        maxFecha.setDate(maxFecha.getDate() + 7);
        if (fechaAsignacion > maxFecha) {
          throw new Error(
            "La fecha de asignación no puede ser más de 7 días en el futuro"
          );
        }

        return true;
      }),
  ];

  static registrarUso: ValidationChain[] = [
    body("salida_id")
      .notEmpty()
      .withMessage("El ID de la salida es obligatorio")
      .isUUID()
      .withMessage("El ID de la salida debe ser un UUID válido"),

    body("brazaletes")
      .isArray({ min: 1 })
      .withMessage("Debe proporcionar al menos un brazalete"),

    body("brazaletes.*.codigo")
      .notEmpty()
      .withMessage("El código del brazalete es obligatorio")
      .matches(/^BRZ-\d{4}-\d{6}$/)
      .withMessage(
        "El código del brazalete debe tener el formato BRZ-YYYY-NNNNNN"
      ),

    body("brazaletes.*.turista_nacionalidad")
      .optional()
      .isIn(["local", "nacional", "internacional"])
      .withMessage(
        "La nacionalidad del turista debe ser 'local', 'nacional' o 'internacional'"
      ),

    body("brazaletes.*.turista_edad")
      .optional()
      .isInt({ min: 0, max: 120 })
      .withMessage(
        "La edad del turista debe ser un número entero entre 0 y 120"
      ),

    body("brazaletes.*.fecha_uso")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de uso debe ser una fecha válida en formato ISO 8601"
      )
      .custom((value) => {
        if (value) {
          const fechaUso = new Date(value);
          const hoy = new Date();
          hoy.setHours(23, 59, 59, 999); // Fin del día actual

          if (fechaUso > hoy) {
            throw new Error("La fecha de uso no puede ser futura");
          }

          // Verificar que no sea muy antigua (más de 1 año)
          const unAnoAtras = new Date();
          unAnoAtras.setFullYear(unAnoAtras.getFullYear() - 1);

          if (fechaUso < unAnoAtras) {
            throw new Error("La fecha de uso no puede ser anterior a un año");
          }
        }
        return true;
      }),
  ];

  static obtenerBrazaletesSalida: ValidationChain[] = [
    param("id")
      .isUUID()
      .withMessage("El ID de la salida debe ser un UUID válido"),
  ];

  static actualizarUso: ValidationChain[] = [
    body("salida_id")
      .notEmpty()
      .withMessage("El ID de la salida es obligatorio")
      .isUUID()
      .withMessage("El ID de la salida debe ser un UUID válido"),

    body("fecha_uso")
      .notEmpty()
      .withMessage("La fecha de uso es obligatoria")
      .isISO8601()
      .withMessage(
        "La fecha de uso debe ser una fecha válida en formato ISO 8601"
      )
      .custom((value) => {
        if (value) {
          const fechaUso = new Date(value);
          const hoy = new Date();
          hoy.setHours(23, 59, 59, 999); // Fin del día actual

          if (fechaUso > hoy) {
            throw new Error("La fecha de uso no puede ser futura");
          }

          // Verificar que no sea muy antigua (más de 1 año)
          const unAnoAtras = new Date();
          unAnoAtras.setFullYear(unAnoAtras.getFullYear() - 1);

          if (fechaUso < unAnoAtras) {
            throw new Error("La fecha de uso no puede ser anterior a un año");
          }
        }
        return true;
      }),

    body("motivo")
      .optional()
      .isLength({ max: 500 })
      .withMessage("El motivo no puede exceder 500 caracteres"),
  ];

  // ============================================================================
  // VALIDADORES PARA ESTADÍSTICAS
  // ============================================================================

  static estadisticas: ValidationChain[] = [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de inicio debe ser una fecha válida en formato ISO8601"
      ),

    query("fecha_fin")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de fin debe ser una fecha válida en formato ISO8601"
      )
      .custom((value, { req }) => {
        if (value && req.query?.["fecha_inicio"]) {
          const fechaInicio = new Date(req.query["fecha_inicio"] as string);
          const fechaFin = new Date(value);
          if (fechaFin <= fechaInicio) {
            throw new Error(
              "La fecha de fin debe ser posterior a la fecha de inicio"
            );
          }
        }
        return true;
      }),
  ];

  static reporteVentas: ValidationChain[] = [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de inicio debe ser una fecha válida en formato ISO8601"
      ),

    query("fecha_fin")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de fin debe ser una fecha válida en formato ISO8601"
      )
      .custom((value, { req }) => {
        if (value && req.query?.["fecha_inicio"]) {
          const fechaInicio = new Date(req.query["fecha_inicio"] as string);
          const fechaFin = new Date(value);
          if (fechaFin <= fechaInicio) {
            throw new Error(
              "La fecha de fin debe ser posterior a la fecha de inicio"
            );
          }
        }
        return true;
      }),

    query("prestador_id")
      .optional()
      .isUUID()
      .withMessage("El ID del prestador debe ser un UUID válido"),
  ];

  static reporteUtilizacion: ValidationChain[] = [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de inicio debe ser una fecha válida en formato ISO8601"
      ),

    query("fecha_fin")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de fin debe ser una fecha válida en formato ISO8601"
      )
      .custom((value, { req }) => {
        if (value && req.query?.["fecha_inicio"]) {
          const fechaInicio = new Date(req.query["fecha_inicio"] as string);
          const fechaFin = new Date(value);
          if (fechaFin <= fechaInicio) {
            throw new Error(
              "La fecha de fin debe ser posterior a la fecha de inicio"
            );
          }
        }
        return true;
      }),

    query("tipo")
      .optional()
      .isIn(["universal"])
      .withMessage("El tipo debe ser 'universal'"),
  ];

  // ============================================================================
  // VALIDADORES AUXILIARES
  // ============================================================================

  static validarUUID: ValidationChain[] = [
    param("id").isUUID().withMessage("El ID debe ser un UUID válido"),
  ];

  static validarPaginacion: ValidationChain[] = [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La página debe ser un número entero mayor a 0"),

    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El límite debe ser un número entero mayor a 0"),
  ];

  // ============================================================================
  // VALIDADORES PARA FILTROS COMUNES
  // ============================================================================

  static filtrosFecha: ValidationChain[] = [
    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage("La fecha de inicio debe ser una fecha válida"),

    query("fecha_fin")
      .optional()
      .isISO8601()
      .withMessage("La fecha de fin debe ser una fecha válida")
      .custom((value, { req }) => {
        if (value && req.query?.["fecha_inicio"]) {
          const fechaInicio = new Date(req.query["fecha_inicio"] as string);
          const fechaFin = new Date(value);
          const diferenciaDias = Math.ceil(
            (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24)
          );

          if (fechaFin <= fechaInicio) {
            throw new Error(
              "La fecha de fin debe ser posterior a la fecha de inicio"
            );
          }

          if (diferenciaDias > 365) {
            throw new Error("El rango de fechas no puede ser mayor a 365 días");
          }
        }
        return true;
      }),
  ];

  static filtrosTipo: ValidationChain[] = [
    query("tipo")
      .optional()
      .isIn(["universal"])
      .withMessage("El tipo debe ser 'universal'"),
  ];

  static filtrosEstado: ValidationChain[] = [
    query("estado")
      .optional()
      .isIn(["disponible", "asignado", "utilizado", "perdido"])
      .withMessage(
        "El estado debe ser 'disponible', 'asignado', 'utilizado' o 'perdido'"
      ),
  ];

  // ============================================================================
  // VALIDADORES PARA BÚSQUEDA
  // ============================================================================

  static buscarBrazaletes: ValidationChain[] = [
    query("codigo")
      .optional()
      .matches(/^BRZ-\d{4}-\d{6}$/)
      .withMessage(
        "El código del brazalete debe tener el formato BRZ-YYYY-NNNNNN"
      ),

    query("tipo")
      .optional()
      .isIn(["universal"])
      .withMessage("El tipo debe ser 'universal'"),

    query("estado")
      .optional()
      .isIn(["disponible", "asignado", "utilizado", "perdido"])
      .withMessage(
        "El estado debe ser 'disponible', 'asignado', 'utilizado' o 'perdido'"
      ),

    query("prestador_id")
      .optional()
      .isUUID()
      .withMessage("El ID del prestador debe ser un UUID válido"),

    query("lote_id")
      .optional()
      .isUUID()
      .withMessage("El ID del lote debe ser un UUID válido"),

    query("salida_id")
      .optional()
      .isUUID()
      .withMessage("El ID de la salida debe ser un UUID válido"),

    query("fecha_inicio")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de inicio debe ser una fecha válida en formato ISO8601"
      ),

    query("fecha_fin")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de fin debe ser una fecha válida en formato ISO8601"
      )
      .custom((value, { req }) => {
        if (value && req.query?.["fecha_inicio"]) {
          const fechaInicio = new Date(req.query["fecha_inicio"] as string);
          const fechaFin = new Date(value);
          if (fechaFin <= fechaInicio) {
            throw new Error(
              "La fecha de fin debe ser posterior a la fecha de inicio"
            );
          }
        }
        return true;
      }),

    query("turista_nacionalidad")
      .optional()
      .isIn(["local", "nacional", "internacional"])
      .withMessage(
        "La nacionalidad del turista debe ser 'local', 'nacional' o 'internacional'"
      ),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La página debe ser un número entero mayor a 0"),

    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El límite debe ser un número entero mayor a 0"),
  ];
}

export default BrazaleteValidator;
