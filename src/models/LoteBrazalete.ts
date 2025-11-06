import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Interfaces para el modelo LoteBrazalete
interface LoteBrazaleteAttributes {
  id: string;
  numero_lote: string;
  cantidad_total: number;
  cantidad_disponibles: number;
  cantidad_vendidos: number;
  cantidad_utilizados: number;
  tipo: "universal";
  fecha_compra: string;
  fecha_vencimiento?: string;
  costo_unitario: number;
  precio_venta: number;
  proveedor?: string;
  estado: "activo" | "agotado" | "vencido" | "cancelado";
  observaciones?: string;
  created_at: Date;
  updated_at: Date;
}

interface LoteBrazaleteCreationAttributes
  extends Optional<
    LoteBrazaleteAttributes,
    | "id"
    | "cantidad_vendidos"
    | "cantidad_utilizados"
    | "fecha_vencimiento"
    | "proveedor"
    | "estado"
    | "observaciones"
    | "created_at"
    | "updated_at"
  > {}

class LoteBrazalete
  extends Model<LoteBrazaleteAttributes, LoteBrazaleteCreationAttributes>
  implements LoteBrazaleteAttributes
{
  public id!: string;
  public numero_lote!: string;
  public cantidad_total!: number;
  public cantidad_disponibles!: number;
  public cantidad_vendidos!: number;
  public cantidad_utilizados!: number;
  public tipo!: "universal";
  public fecha_compra!: string;
  public fecha_vencimiento?: string;
  public costo_unitario!: number;
  public precio_venta!: number;
  public proveedor?: string;
  public estado!: "activo" | "agotado" | "vencido" | "cancelado";
  public observaciones?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Métodos de instancia
  public calcularMargenUtilidad(): number {
    return this.precio_venta - this.costo_unitario;
  }

  public calcularPorcentajeMargen(): number {
    if (this.costo_unitario === 0) return 0;
    return (
      ((this.precio_venta - this.costo_unitario) / this.costo_unitario) * 100
    );
  }

  public calcularValorInventario(): number {
    return this.cantidad_disponibles * this.precio_venta;
  }

  public estaVencido(): boolean {
    if (!this.fecha_vencimiento) return false;
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVenc = typeof this.fecha_vencimiento === 'string' 
      ? this.fecha_vencimiento 
      : (this.fecha_vencimiento as Date).toISOString().split('T')[0];
    return !!(hoy && fechaVenc && fechaVenc < hoy); // Comparación de strings
  }

  public diasParaVencimiento(): number | null {
    if (!this.fecha_vencimiento) return null;
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVenc = typeof this.fecha_vencimiento === 'string' 
      ? this.fecha_vencimiento 
      : (this.fecha_vencimiento as Date).toISOString().split('T')[0];
    
    const hoyDate = new Date(hoy + 'T12:00:00');
    const fechaVencDate = new Date(fechaVenc + 'T12:00:00');
    const diferencia = fechaVencDate.getTime() - hoyDate.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  public puedeVender(cantidad: number): boolean {
    return (
      this.estado === "activo" &&
      this.cantidad_disponibles >= cantidad &&
      !this.estaVencido()
    );
  }

  // Método para actualizar cantidades después de una venta
  public async actualizarDespuesVenta(cantidad: number): Promise<void> {
    this.cantidad_disponibles -= cantidad;
    this.cantidad_vendidos += cantidad;

    if (this.cantidad_disponibles === 0) {
      this.estado = "agotado";
    }

    await this.save();
  }

  // Método para actualizar cantidades después del uso de brazaletes
  public async actualizarDespuesUso(cantidad: number): Promise<void> {
    this.cantidad_utilizados += cantidad;
    await this.save();
  }
}

// Definir el modelo
LoteBrazalete.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    numero_lote: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    cantidad_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        isInt: true,
      },
    },
    cantidad_disponibles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    cantidad_vendidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    cantidad_utilizados: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    tipo: {
      type: DataTypes.ENUM("universal"),
      allowNull: false,
      validate: {
        isIn: [["universal"]],
      },
      defaultValue: "universal",
    },
    fecha_compra: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notNull: {
          msg: "La fecha de compra es obligatoria",
        },
      },
      get() {
        const value = this.getDataValue('fecha_compra');
        if (!value) return null;
        if (typeof value === 'string') return value.split('T')[0];
        const dateValue = value as Date;
        if (dateValue && typeof dateValue.toISOString === 'function') {
          return dateValue.toISOString().split('T')[0];
        }
        return String(value).split('T')[0];
      },
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterCompra(value: string | Date) {
          if (value && this["fecha_compra"]) {
            const fechaVencStr = typeof value === 'string' ? value : value.toISOString().split('T')[0];
            const fechaCompraStr = typeof this["fecha_compra"] === 'string' 
              ? this["fecha_compra"] 
              : (this["fecha_compra"] as Date).toISOString().split('T')[0];
            
            if (fechaVencStr && fechaCompraStr && fechaVencStr <= fechaCompraStr) {
              throw new Error(
                "La fecha de vencimiento debe ser posterior a la fecha de compra"
              );
            }
          }
        },
      },
      get() {
        const value = this.getDataValue('fecha_vencimiento');
        if (!value) return null;
        if (typeof value === 'string') return value.split('T')[0];
        const dateValue = value as Date;
        if (dateValue && typeof dateValue.toISOString === 'function') {
          return dateValue.toISOString().split('T')[0];
        }
        return String(value).split('T')[0];
      },
    },
    costo_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
        isGreaterThanCost(value: number) {
          const costoUnitario = this["costo_unitario"] as number;
          if (costoUnitario && value <= costoUnitario) {
            throw new Error(
              "El precio de venta debe ser mayor al costo unitario"
            );
          }
        },
      },
    },
    proveedor: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    estado: {
      type: DataTypes.ENUM("activo", "agotado", "vencido", "cancelado"),
      allowNull: false,
      defaultValue: "activo",
      validate: {
        isIn: [["activo", "agotado", "vencido", "cancelado"]],
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "LoteBrazalete",
    tableName: "lotes_brazaletes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeValidate: (lote: LoteBrazalete) => {
        // Validar que las cantidades sean consistentes
        if (
          lote.cantidad_vendidos + lote.cantidad_disponibles >
          lote.cantidad_total
        ) {
          throw new Error(
            "La suma de vendidos y disponibles no puede exceder el total"
          );
        }

        // Actualizar estado si está vencido
        if (lote.estaVencido() && lote.estado === "activo") {
          lote.estado = "vencido";
        }
      },
    },
    indexes: [
      {
        fields: ["tipo"],
      },
      {
        fields: ["estado"],
      },
      {
        fields: ["fecha_compra"],
      },
      {
        fields: ["numero_lote"],
        unique: true,
      },
    ],
  }
);

export default LoteBrazalete;
