import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Interfaces para el modelo Brazalete
interface BrazaleteAttributes {
  id: string;
  codigo: string;
  tipo: "universal";
  estado: "disponible" | "asignado" | "utilizado" | "perdido";
  precio: number;
  fecha_creacion: Date;
  fecha_asignacion?: Date;
  fecha_uso?: Date;
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
  public fecha_asignacion?: Date;
  public fecha_uso?: Date;
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
    this.fecha_asignacion = new Date();
    await this.save();
  }

  // Método para asignar brazalete a un prestador (cambia estado a asignado)
  public async asignarAPrestador(prestadorId: string): Promise<void> {
    if (!this.puedeSerAsignado()) {
      throw new Error("El brazalete no puede ser asignado en su estado actual");
    }

    this.estado = "asignado";
    this.prestador_id = prestadorId;
    this.fecha_asignacion = new Date();
    await this.save();
  }

  // Método para usar brazalete en una salida
  public async usarEnSalida(
    salidaId: string,
    turistaNacionalidad?: string,
    turistaEdad?: number,
    fechaUso?: Date
  ): Promise<void> {
    if (!this.puedeSerUtilizado()) {
      throw new Error(
        "El brazalete no puede ser utilizado en su estado actual"
      );
    }

    // Validar que la fecha de uso sea posterior a la fecha de asignación
    if (fechaUso && this.fecha_asignacion && fechaUso < this.fecha_asignacion) {
      throw new Error(
        "La fecha de uso debe ser posterior a la fecha de asignación"
      );
    }

    this.estado = "utilizado";
    this.salida_id = salidaId;
    this.fecha_uso = fechaUso || new Date(); // Usar fecha proporcionada o fecha actual
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
    const hoy = new Date();
    const diferencia = hoy.getTime() - this.fecha_asignacion.getTime();
    return Math.floor(diferencia / (1000 * 3600 * 24));
  }

  // Método para obtener días desde uso
  public diasDesdeUso(): number | null {
    if (!this.fecha_uso) return null;
    const hoy = new Date();
    const diferencia = hoy.getTime() - this.fecha_uso.getTime();
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
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        isWithinReasonableRange(value: Date) {
          if (value) {
            // const hoy = new Date();
            const fechaMinima = new Date();
            fechaMinima.setDate(fechaMinima.getDate() - 30);
            const fechaMaxima = new Date();
            fechaMaxima.setDate(fechaMaxima.getDate() + 7);

            if (value < fechaMinima) {
              throw new Error(
                "La fecha de asignación no puede ser anterior a 30 días"
              );
            }

            if (value > fechaMaxima) {
              throw new Error(
                "La fecha de asignación no puede ser más de 7 días en el futuro"
              );
            }
          }
        },
      },
    },
    fecha_uso: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
        isAfterAssignment(value: Date) {
          if (
            value &&
            this["fecha_asignacion"] &&
            value < this["fecha_asignacion"]
          ) {
            throw new Error(
              "La fecha de uso debe ser posterior a la fecha de asignación"
            );
          }
        },
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
