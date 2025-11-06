import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Interfaces para el modelo Brazalete
interface BrazaleteAttributes {
  id: string;
  codigo: string;
  tipo: "universal";
  estado: "disponible" | "asignado" | "utilizado" | "perdido";
  precio: number;
  fecha_creacion: Date; // Mantener Date para timestamp de auditoría
  fecha_asignacion?: string;
  fecha_uso?: string;
  prestador_id?: string | undefined;
  salida_id?: string | undefined;
  turista_nacionalidad?: string | undefined;
  turista_edad?: number | undefined;
  lote_id: string;
  created_at: Date;
  updated_at: Date;
}

interface BrazaleteCreationAttributes
  extends Optional<
    BrazaleteAttributes,
    | "id"
    | "estado"
    | "fecha_creacion"
    | "fecha_asignacion"
    | "fecha_uso"
    | "prestador_id"
    | "salida_id"
    | "turista_nacionalidad"
    | "turista_edad"
    | "created_at"
    | "updated_at"
  > {}

class Brazalete
  extends Model<BrazaleteAttributes, BrazaleteCreationAttributes>
  implements BrazaleteAttributes
{
  public id!: string;
  public codigo!: string;
  public tipo!: "universal";
  public estado!: "disponible" | "asignado" | "utilizado" | "perdido";
  public precio!: number;
  public fecha_creacion!: Date;
  public fecha_asignacion?: string;
  public fecha_uso?: string;
  public prestador_id?: string | undefined;
  public salida_id?: string | undefined;
  public turista_nacionalidad?: string | undefined;
  public turista_edad?: number | undefined;
  public lote_id!: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Métodos de instancia
  public estaDisponible(): boolean {
    return this.estado === "disponible";
  }

  public estaAsignado(): boolean {
    return this.estado === "asignado";
  }

  public estaUtilizado(): boolean {
    return this.estado === "utilizado";
  }

  public puedeSerAsignado(): boolean {
    return this.estado === "disponible";
  }

  public puedeSerUtilizado(): boolean {
    return this.estado === "asignado" && this.prestador_id !== null;
  }

  // Método para vender brazalete a un prestador (mantiene estado disponible)
  public async venderAPrestador(prestadorId: string): Promise<void> {
    if (!this.puedeSerAsignado()) {
      throw new Error("El brazalete no puede ser vendido en su estado actual");
    }

    // Al vender, mantener estado "disponible" para que pueda ser asignado a salidas
    this.prestador_id = prestadorId;
    this.fecha_asignacion = new Date().toISOString().split('T')[0] as string; // "YYYY-MM-DD"
    await this.save();
  }

  // Método para asignar brazalete a un prestador (cambia estado a asignado)
  public async asignarAPrestador(prestadorId: string): Promise<void> {
    if (!this.puedeSerAsignado()) {
      throw new Error("El brazalete no puede ser asignado en su estado actual");
    }

    this.estado = "asignado";
    this.prestador_id = prestadorId;
    this.fecha_asignacion = new Date().toISOString().split('T')[0] as string; // "YYYY-MM-DD"
    await this.save();
  }

  // Método para usar brazalete en una salida
  public async usarEnSalida(
    salidaId: string,
    turistaNacionalidad?: string,
    turistaEdad?: number,
    fechaUso?: string
  ): Promise<void> {
    if (!this.puedeSerUtilizado()) {
      throw new Error(
        "El brazalete no puede ser utilizado en su estado actual"
      );
    }

    const fechaUsoStr = fechaUso || new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Validar que la fecha de uso sea posterior a la fecha de asignación
    if (this.fecha_asignacion && fechaUsoStr && fechaUsoStr < this.fecha_asignacion) {
      throw new Error(
        "La fecha de uso debe ser posterior a la fecha de asignación"
      );
    }

    this.estado = "utilizado";
    this.salida_id = salidaId;
    this.fecha_uso = fechaUsoStr as string;
    this.turista_nacionalidad = turistaNacionalidad;
    this.turista_edad = turistaEdad;
    await this.save();
    await this.reload(); // Recargar el objeto desde la base de datos
  }

  // Método para marcar como perdido
  public async marcarComoPerdido(): Promise<void> {
    this.estado = "perdido";
    await this.save();
  }

  // Método para generar código único
  public static generarCodigo(año: number, numeroSecuencial: number): string {
    const numeroFormateado = numeroSecuencial.toString().padStart(6, "0");
    return `BRZ-${año}-${numeroFormateado}`;
  }

  // Método para validar nacionalidad de turista
  public static validarNacionalidad(nacionalidad: string): boolean {
    const nacionalidadesValidas = ["local", "nacional", "internacional"];
    return nacionalidadesValidas.includes(nacionalidad.toLowerCase());
  }

  // Método para obtener días desde asignación
  public diasDesdeAsignacion(): number | null {
    if (!this.fecha_asignacion) return null;
    const hoy = new Date().toISOString().split('T')[0];
    const fechaAsign = typeof this.fecha_asignacion === 'string' 
      ? this.fecha_asignacion 
      : (this.fecha_asignacion as Date).toISOString().split('T')[0];
    
    const hoyDate = new Date(hoy + 'T12:00:00');
    const fechaAsignDate = new Date(fechaAsign + 'T12:00:00');
    const diferencia = hoyDate.getTime() - fechaAsignDate.getTime();
    return Math.floor(diferencia / (1000 * 3600 * 24));
  }

  // Método para obtener días desde uso
  public diasDesdeUso(): number | null {
    if (!this.fecha_uso) return null;
    const hoy = new Date().toISOString().split('T')[0];
    const fechaUso = typeof this.fecha_uso === 'string' 
      ? this.fecha_uso 
      : (this.fecha_uso as Date).toISOString().split('T')[0];
    
    const hoyDate = new Date(hoy + 'T12:00:00');
    const fechaUsoDate = new Date(fechaUso + 'T12:00:00');
    const diferencia = hoyDate.getTime() - fechaUsoDate.getTime();
    return Math.floor(diferencia / (1000 * 3600 * 24));
  }
}

// Definir el modelo
Brazalete.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
        is: /^BRZ-\d{4}-\d{6}$/, // Formato: BRZ-YYYY-NNNNNN
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
    estado: {
      type: DataTypes.ENUM("disponible", "asignado", "utilizado", "perdido"),
      allowNull: false,
      defaultValue: "disponible",
      validate: {
        isIn: [["disponible", "asignado", "utilizado", "perdido"]],
      },
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_asignacion: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isWithinReasonableRange(value: string | Date) {
          if (value) {
            const fechaStr = typeof value === 'string' ? value : value.toISOString().split('T')[0];
            const fechaMinima = new Date();
            fechaMinima.setDate(fechaMinima.getDate() - 30);
            const fechaMinimaStr = fechaMinima.toISOString().split('T')[0];
            const fechaMaxima = new Date();
            fechaMaxima.setDate(fechaMaxima.getDate() + 7);
            const fechaMaximaStr = fechaMaxima.toISOString().split('T')[0];

            if (fechaMinimaStr && fechaStr && fechaStr < fechaMinimaStr) {
              throw new Error(
                "La fecha de asignación no puede ser anterior a 30 días"
              );
            }

            if (fechaMaximaStr && fechaStr && fechaStr > fechaMaximaStr) {
              throw new Error(
                "La fecha de asignación no puede ser más de 7 días en el futuro"
              );
            }
          }
        },
      },
      get() {
        const value = this.getDataValue('fecha_asignacion');
        if (!value) return null;
        if (typeof value === 'string') return value.split('T')[0];
        const dateValue = value as Date;
        if (dateValue && typeof dateValue.toISOString === 'function') {
          return dateValue.toISOString().split('T')[0];
        }
        return String(value).split('T')[0];
      },
    },
    fecha_uso: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterAssignment(value: string | Date) {
          if (value && this["fecha_asignacion"]) {
            const fechaUsoStr = typeof value === 'string' ? value : value.toISOString().split('T')[0];
            const fechaAsignStr = typeof this["fecha_asignacion"] === 'string' 
              ? this["fecha_asignacion"] 
              : (this["fecha_asignacion"] as Date).toISOString().split('T')[0];
            
            if (fechaUsoStr && fechaAsignStr && fechaUsoStr < fechaAsignStr) {
              throw new Error(
                "La fecha de uso debe ser posterior a la fecha de asignación"
              );
            }
          }
        },
      },
      get() {
        const value = this.getDataValue('fecha_uso');
        if (!value) return null;
        if (typeof value === 'string') return value.split('T')[0];
        const dateValue = value as Date;
        if (dateValue && typeof dateValue.toISOString === 'function') {
          return dateValue.toISOString().split('T')[0];
        }
        return String(value).split('T')[0];
      },
    },
    prestador_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    salida_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "salidas",
        key: "id",
      },
    },
    turista_nacionalidad: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [0, 50],
        isValidNationality(value: string) {
          if (value && !Brazalete.validarNacionalidad(value)) {
            throw new Error(
              "Nacionalidad no válida. Use: local, nacional, internacional"
            );
          }
        },
      },
    },
    turista_edad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 120,
        isInt: true,
      },
    },
    lote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "lotes_brazaletes",
        key: "id",
      },
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
    modelName: "Brazalete",
    tableName: "brazaletes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeValidate: (brazalete: Brazalete) => {
        // Validaciones de estado y fechas
        if (brazalete.estado === "asignado" && !brazalete.prestador_id) {
          throw new Error("Un brazalete asignado debe tener un prestador");
        }

        if (brazalete.estado === "utilizado" && !brazalete.salida_id) {
          throw new Error(
            "Un brazalete utilizado debe tener una salida asociada"
          );
        }

        // Normalizar nacionalidad
        if (brazalete.turista_nacionalidad) {
          brazalete.turista_nacionalidad =
            brazalete.turista_nacionalidad.toLowerCase();
        }
      },
    },
    indexes: [
      {
        fields: ["estado"],
      },
      {
        fields: ["prestador_id"],
      },
      {
        fields: ["salida_id"],
      },
      {
        fields: ["tipo"],
      },
      {
        fields: ["fecha_uso"],
      },
      {
        fields: ["lote_id"],
      },
      {
        fields: ["codigo"],
        unique: true,
      },
    ],
  }
);

export default Brazalete;
