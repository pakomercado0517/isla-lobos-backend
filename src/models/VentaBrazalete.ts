import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Interfaces para el modelo VentaBrazalete
interface VentaBrazaleteAttributes {
  id: string;
  prestador_id: string;
  lote_id: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha_venta: string;
  metodo_pago?: string;
  estado_pago: "pendiente" | "pagado" | "cancelado";
  observaciones?: string;
  created_at: Date;
}

interface VentaBrazaleteCreationAttributes
  extends Optional<
    VentaBrazaleteAttributes,
    | "id"
    | "fecha_venta"
    | "metodo_pago"
    | "estado_pago"
    | "observaciones"
    | "created_at"
  > {}

class VentaBrazalete
  extends Model<VentaBrazaleteAttributes, VentaBrazaleteCreationAttributes>
  implements VentaBrazaleteAttributes
{
  public id!: string;
  public prestador_id!: string;
  public lote_id!: string;
  public cantidad!: number;
  public precio_unitario!: number;
  public total!: number;
  public fecha_venta!: string;
  public metodo_pago?: string;
  public estado_pago!: "pendiente" | "pagado" | "cancelado";
  public observaciones?: string;
  public created_at!: Date;

  // Métodos de instancia
  public calcularTotal(): number {
    return this.cantidad * this.precio_unitario;
  }

  public estaPagada(): boolean {
    return this.estado_pago === "pagado";
  }

  public estaPendiente(): boolean {
    return this.estado_pago === "pendiente";
  }

  public estaCancelada(): boolean {
    return this.estado_pago === "cancelado";
  }

  public puedeSerCancelada(): boolean {
    return this.estado_pago === "pendiente";
  }

  // Método para marcar como pagada
  public async marcarComoPagada(metodoPago?: string): Promise<void> {
    if (this.estado_pago !== "pendiente") {
      throw new Error(
        "Solo se pueden marcar como pagadas las ventas pendientes"
      );
    }

    this.estado_pago = "pagado";
    if (metodoPago) {
      this.metodo_pago = metodoPago;
    }
    await this.save();
  }

  // Método para cancelar venta
  public async cancelar(motivo?: string): Promise<void> {
    if (!this.puedeSerCancelada()) {
      throw new Error("No se puede cancelar esta venta");
    }

    this.estado_pago = "cancelado";
    if (motivo) {
      this.observaciones = this.observaciones
        ? `${this.observaciones}. Cancelada: ${motivo}`
        : `Cancelada: ${motivo}`;
    }
    await this.save();
  }

  // Método para obtener días desde la venta
  public diasDesdeVenta(): number {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVenta = typeof this.fecha_venta === 'string' 
      ? this.fecha_venta 
      : (this.fecha_venta as Date).toISOString().split('T')[0];
    
    const hoyDate = new Date(hoy + 'T12:00:00');
    const fechaVentaDate = new Date(fechaVenta + 'T12:00:00');
    const diferencia = hoyDate.getTime() - fechaVentaDate.getTime();
    return Math.floor(diferencia / (1000 * 3600 * 24));
  }

  // Método estático para validar método de pago
  public static validarMetodoPago(metodo: string): boolean {
    const metodosValidos = ["efectivo", "transferencia", "credito", "debito"];
    return metodosValidos.includes(metodo.toLowerCase());
  }

  // Método para generar resumen de venta
  public generarResumen(): {
    id: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    fecha_venta: string;
    estado: string;
    dias_desde_venta: number;
  } {
    return {
      id: this.id,
      cantidad: this.cantidad,
      precio_unitario: this.precio_unitario,
      total: this.total,
      fecha_venta: this.fecha_venta,
      estado: this.estado_pago,
      dias_desde_venta: this.diasDesdeVenta(),
    };
  }
}

// Definir el modelo
VentaBrazalete.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    prestador_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      validate: {
        notNull: {
          msg: "El prestador es obligatorio",
        },
      },
    },
    lote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "lotes_brazaletes",
        key: "id",
      },
      validate: {
        notNull: {
          msg: "El lote es obligatorio",
        },
      },
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "La cantidad debe ser mayor a 0",
        },
        isInt: {
          msg: "La cantidad debe ser un número entero",
        },
      },
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "El precio unitario debe ser mayor o igual a 0",
        },
        isDecimal: {
          msg: "El precio unitario debe ser un número decimal válido",
        },
      },
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "El total debe ser mayor o igual a 0",
        },
        isDecimal: {
          msg: "El total debe ser un número decimal válido",
        },
        isCorrectTotal(value: number) {
          const cantidad = this["cantidad"] as number;
          const precioUnitario = this["precio_unitario"] as number;
          const expectedTotal = cantidad * precioUnitario;
          if (Math.abs(value - expectedTotal) > 0.01) {
            throw new Error(
              "El total no coincide con cantidad × precio unitario"
            );
          }
        },
      },
    },
    fecha_venta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: {
          msg: "Debe ser una fecha válida",
          args: true,
        },
        notInFuture(value: string | Date) {
          const hoy = new Date().toISOString().split('T')[0];
          const fechaVentaStr = typeof value === 'string' ? value : value.toISOString().split('T')[0];
          if (hoy && fechaVentaStr && fechaVentaStr > hoy) {
            throw new Error("La fecha de venta no puede ser futura");
          }
        },
      },
      get() {
        const value = this.getDataValue('fecha_venta');
        if (!value) return null;
        if (typeof value === 'string') return value.split('T')[0];
        const dateValue = value as Date;
        if (dateValue && typeof dateValue.toISOString === 'function') {
          return dateValue.toISOString().split('T')[0];
        }
        return String(value).split('T')[0];
      },
    },
    metodo_pago: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: "El método de pago no puede exceder 50 caracteres",
        },
        isValidMethod(value: string) {
          if (value && !VentaBrazalete.validarMetodoPago(value)) {
            throw new Error("Método de pago no válido");
          }
        },
      },
    },
    estado_pago: {
      type: DataTypes.ENUM("pendiente", "pagado", "cancelado"),
      allowNull: false,
      defaultValue: "pendiente",
      validate: {
        isIn: {
          args: [["pendiente", "pagado", "cancelado"]],
          msg: "Estado de pago no válido",
        },
      },
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "VentaBrazalete",
    tableName: "ventas_brazaletes",
    timestamps: false, // Solo usamos created_at
    hooks: {
      beforeValidate: (venta: VentaBrazalete) => {
        // Calcular total automáticamente si no está establecido
        if (!venta.total || venta.total === 0) {
          venta.total = venta.calcularTotal();
        }

        // Normalizar método de pago
        if (venta.metodo_pago) {
          venta.metodo_pago = venta.metodo_pago.toLowerCase();
        }
      },
      beforeCreate: (venta: VentaBrazalete) => {
        // Asegurar que el total sea correcto
        venta.total = venta.calcularTotal();
      },
      beforeUpdate: (venta: VentaBrazalete) => {
        // Recalcular total si cambia cantidad o precio
        if (venta.changed("cantidad") || venta.changed("precio_unitario")) {
          venta.total = venta.calcularTotal();
        }
      },
    },
    indexes: [
      {
        fields: ["prestador_id"],
      },
      {
        fields: ["fecha_venta"],
      },
      {
        fields: ["lote_id"],
      },
      {
        fields: ["estado_pago"],
      },
      {
        fields: ["fecha_venta", "prestador_id"],
      },
    ],
  }
);

export default VentaBrazalete;
