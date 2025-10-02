import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { EstadoSalida } from "../types";
import {
  isTodayMexico,
  isTomorrowMexico,
  getDayNameMexico,
} from "../utils/dateUtils";

// Atributos requeridos para crear una salida
interface SalidaAttributes {
  id: string;
  prestador_id: string;
  embarcacion_id: string;
  destino: string;
  bloque_id?: string; // Opcional - solo para Isla de Lobos
  hora?: string; // Opcional - solo para otros destinos
  fecha: Date;
  numero_pasajeros: number;
  observaciones?: string;
  estado: EstadoSalida;
  motivo_cancelacion?: string;
}

// Atributos opcionales (para actualizaciones)
interface SalidaCreationAttributes
  extends Optional<
    SalidaAttributes,
    | "id"
    | "bloque_id"
    | "hora"
    | "observaciones"
    | "estado"
    | "motivo_cancelacion"
  > {}

class Salida
  extends Model<SalidaAttributes, SalidaCreationAttributes>
  implements SalidaAttributes
{
  public id!: string;
  public prestador_id!: string;
  public embarcacion_id!: string;
  public destino!: string;
  public bloque_id?: string;
  public hora?: string;
  public fecha!: Date;
  public numero_pasajeros!: number;
  public observaciones?: string;
  public estado!: EstadoSalida;
  public motivo_cancelacion?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Métodos de instancia
  public get es_hoy(): boolean {
    return isTodayMexico(this.fecha);
  }

  public get es_manana(): boolean {
    return isTomorrowMexico(this.fecha);
  }

  public get dia_semana(): string {
    return getDayNameMexico(this.fecha);
  }

  public get esta_programada(): boolean {
    return this.estado === EstadoSalida.PROGRAMADA;
  }

  public get esta_en_curso(): boolean {
    return this.estado === EstadoSalida.EN_CURSO;
  }

  public get esta_completada(): boolean {
    return this.estado === EstadoSalida.COMPLETADA;
  }

  public get esta_cancelada(): boolean {
    return [
      EstadoSalida.CANCELADA,
      EstadoSalida.CANCELADA_POR_CLIMA,
      EstadoSalida.CANCELADA_CAPITARIA,
    ].includes(this.estado);
  }

  public get puede_cancelar(): boolean {
    return this.estado === EstadoSalida.PROGRAMADA;
  }

  public get puede_iniciar(): boolean {
    return this.estado === EstadoSalida.PROGRAMADA && this.es_hoy;
  }
}

Salida.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prestador_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    embarcacion_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "embarcaciones",
        key: "id",
      },
    },
    destino: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Isla de Lobos",
      validate: {
        notEmpty: true,
        isIn: [
          [
            "Isla de Lobos",
            "Arrecife Tuxpan",
            "Arrecife de en Medio",
            "Arrecife Tanhuijo",
          ],
        ],
      },
    },
    bloque_id: {
      type: DataTypes.UUID,
      allowNull: true, // Ahora es opcional
      references: {
        model: "bloques",
        key: "id",
      },
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: true,
      validate: {
        is: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      },
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      comment:
        "Fecha y hora de la salida en zona horaria de México (America/Mexico_City)",
    },
    numero_pasajeros: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 150,
      },
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(...Object.values(EstadoSalida)),
      allowNull: false,
      defaultValue: EstadoSalida.PROGRAMADA,
    },
    motivo_cancelacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Salida",
    tableName: "salidas",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["prestador_id"],
      },
      {
        fields: ["embarcacion_id"],
      },
      {
        fields: ["bloque_id"],
      },
      {
        fields: ["fecha"],
      },
      {
        fields: ["estado"],
      },
    ],
  }
);

export default Salida;
