import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { EstadoBloque } from "../types";
import {
  isTodayMexico,
  isTomorrowMexico,
  getDayNameMexico,
} from "../utils/dateUtils";

// Atributos requeridos para crear un bloque
interface BloqueAttributes {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  capacidad_registrada: number;
  estado: EstadoBloque;
  destino: string;
  es_plantilla: boolean; // true = plantilla para todos los días, false = bloque específico
  fecha?: Date; // null si es_plantilla = true, obligatorio si es_plantilla = false
}

// Atributos opcionales (para actualizaciones)
interface BloqueCreationAttributes
  extends Optional<
    BloqueAttributes,
    "id" | "capacidad_registrada" | "estado" | "fecha" | "es_plantilla"
  > {}

class Bloque
  extends Model<BloqueAttributes, BloqueCreationAttributes>
  implements BloqueAttributes
{
  public id!: string;
  public nombre!: string;
  public hora_inicio!: string;
  public hora_fin!: string;
  public capacidad_total!: number;
  public capacidad_registrada!: number;
  public estado!: EstadoBloque;
  public destino!: string;
  public es_plantilla!: boolean;
  public fecha?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Métodos de instancia
  public get capacidad_disponible(): number {
    return this.capacidad_total - this.capacidad_registrada;
  }

  public get esta_lleno(): boolean {
    return this.capacidad_registrada >= this.capacidad_total;
  }

  public get porcentaje_ocupacion(): number {
    return Math.round((this.capacidad_registrada / this.capacidad_total) * 100);
  }

  public get es_hoy(): boolean {
    return this.fecha ? isTodayMexico(this.fecha) : false;
  }

  public get es_manana(): boolean {
    return this.fecha ? isTomorrowMexico(this.fecha) : false;
  }

  public get dia_semana(): string {
    return this.es_plantilla ? "Plantilla" : (this.fecha ? getDayNameMexico(this.fecha) : "Sin fecha");
  }

  public get esta_activo(): boolean {
    return this.estado === EstadoBloque.ACTIVO;
  }

  public get puede_registrar_salida(): boolean {
    return this.esta_activo && !this.esta_lleno;
  }
}

Bloque.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    capacidad_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 150,
      },
    },
    capacidad_registrada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    estado: {
      type: DataTypes.ENUM(...Object.values(EstadoBloque)),
      allowNull: false,
      defaultValue: EstadoBloque.ACTIVO,
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
      comment: "Destino al que pertenece el bloque horario",
    },
    es_plantilla: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "true = plantilla para todos los días, false = bloque específico"
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: true, // Permitir NULL para bloques plantilla (es_plantilla = true)
      validate: {
        notEmpty: true,
      },
      comment:
        "Fecha del bloque en zona horaria de México (America/Mexico_City). NULL cuando es_plantilla = true",
    },
  },
  {
    sequelize,
    modelName: "Bloque",
    tableName: "bloques",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["fecha"],
      },
      {
        fields: ["estado"],
      },
      {
        fields: ["fecha", "hora_inicio"],
      },
      {
        fields: ["destino"],
      },
      {
        fields: ["destino", "fecha"],
      },
      {
        fields: ["destino", "estado"],
      },
      {
        fields: ["es_plantilla"],
      },
      {
        fields: ["es_plantilla", "destino"],
      },
    ],
    validate: {
      // Validación personalizada para asegurar que hora_fin > hora_inicio
      horaFinMayorQueInicio(this: Bloque) {
        if (this.getDataValue("hora_fin") <= this.getDataValue("hora_inicio")) {
          throw new Error(
            "La hora de fin debe ser mayor que la hora de inicio"
          );
        }
      },
      // Validación para asegurar que capacidad_registrada <= capacidad_total
      capacidadValida(this: Bloque) {
        if (
          this.getDataValue("capacidad_registrada") >
          this.getDataValue("capacidad_total")
        ) {
          throw new Error(
            "La capacidad registrada no puede ser mayor que la capacidad total"
          );
        }
      },
    },
  }
);

export default Bloque;
