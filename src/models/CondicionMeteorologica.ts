import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { EstadoPuerto } from "../types";
import {
  isTodayMexico,
  getCurrentMexicoTime,
  formatMexicoDate,
} from "../utils/dateUtils";

// Atributos requeridos para crear una condición meteorológica
interface CondicionMeteorologicaAttributes {
  id: string;
  fecha_hora: Date;
  oleaje: number;
  viento_velocidad: number;
  viento_direccion: string;
  visibilidad: string;
  estado_puerto: EstadoPuerto;
  prediccion_5_dias: string;
  fuente: string;
}

// Atributos opcionales (para actualizaciones)
interface CondicionMeteorologicaCreationAttributes
  extends Optional<CondicionMeteorologicaAttributes, "id"> {}

class CondicionMeteorologica
  extends Model<
    CondicionMeteorologicaAttributes,
    CondicionMeteorologicaCreationAttributes
  >
  implements CondicionMeteorologicaAttributes
{
  public id!: string;
  public fecha_hora!: Date;
  public oleaje!: number;
  public viento_velocidad!: number;
  public viento_direccion!: string;
  public visibilidad!: string;
  public estado_puerto!: EstadoPuerto;
  public prediccion_5_dias!: string;
  public fuente!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Métodos de instancia
  public get es_hoy(): boolean {
    return isTodayMexico(this.fecha_hora);
  }

  public get es_actual(): boolean {
    const now = getCurrentMexicoTime();
    const diffHours =
      Math.abs(now.getTime() - this.fecha_hora.getTime()) / (1000 * 60 * 60);
    return diffHours <= 6; // Consideramos actual si es de las últimas 6 horas
  }

  public get puerto_abierto(): boolean {
    return this.estado_puerto === EstadoPuerto.ABIERTO;
  }

  public get puerto_cerrado(): boolean {
    return this.estado_puerto === EstadoPuerto.CERRADO;
  }

  public get hay_restricciones(): boolean {
    return this.estado_puerto === EstadoPuerto.RESTRICCIONES;
  }

  public get es_emergencia(): boolean {
    return this.estado_puerto === EstadoPuerto.EMERGENCIA;
  }

  public get oleaje_seguro(): boolean {
    return this.oleaje <= 2.0; // Consideramos seguro oleaje menor a 2 metros
  }

  public get viento_seguro(): boolean {
    return this.viento_velocidad <= 30; // Consideramos seguro viento menor a 30 km/h
  }

  public get condiciones_seguras(): boolean {
    return this.puerto_abierto && this.oleaje_seguro && this.viento_seguro;
  }

  public get fecha_formateada(): string {
    return formatMexicoDate(this.fecha_hora);
  }
}

CondicionMeteorologica.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      comment:
        "Fecha y hora de la medición en zona horaria de México (America/Mexico_City)",
    },
    oleaje: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 10, // Máximo 10 metros de oleaje
      },
    },
    viento_velocidad: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 200, // Máximo 200 km/h
      },
    },
    viento_direccion: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [["N", "NE", "E", "SE", "S", "SW", "W", "NW"]],
      },
    },
    visibilidad: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [["Excelente", "Buena", "Regular", "Mala", "Muy Mala"]],
      },
    },
    estado_puerto: {
      type: DataTypes.ENUM(...Object.values(EstadoPuerto)),
      allowNull: false,
      defaultValue: EstadoPuerto.ABIERTO,
    },
    prediccion_5_dias: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fuente: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [["CONAGUA", "NOAA", "Capitanía de Puerto", "Manual"]],
      },
    },
  },
  {
    sequelize,
    modelName: "CondicionMeteorologica",
    tableName: "condiciones_meteorologicas",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["fecha_hora"],
      },
      {
        fields: ["estado_puerto"],
      },
      {
        fields: ["fuente"],
      },
    ],
  }
);

export default CondicionMeteorologica;
