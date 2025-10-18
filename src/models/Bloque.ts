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
  nombre?: string;           // NULL cuando es_plantilla=true (datos vienen de PlantillaBloque)
  hora_inicio?: string;      // NULL cuando es_plantilla=true
  hora_fin?: string;         // NULL cuando es_plantilla=true  
  capacidad_total?: number;  // NULL cuando es_plantilla=true
  capacidad_registrada: number;
  estado: EstadoBloque;
  destino?: string;          // NULL cuando es_plantilla=true
  es_plantilla: boolean;     // true = plantilla, false = bloque normal
  plantilla_id?: string;     // FK a PlantillaBloque cuando es_plantilla=true
  fecha?: Date;              // null si es_plantilla = true, obligatorio si es_plantilla = false
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
  public nombre?: string;           // Opcional para plantillas
  public hora_inicio?: string;      // Opcional para plantillas  
  public hora_fin?: string;         // Opcional para plantillas
  public capacidad_total?: number;  // Opcional para plantillas
  public capacidad_registrada!: number;
  public estado!: EstadoBloque;
  public destino?: string;          // Opcional para plantillas
  public es_plantilla!: boolean;
  public plantilla_id?: string;     // FK a PlantillaBloque
  public fecha?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Asociaciones
  public PlantillaBloque?: any; // Relación con PlantillaBloque

  // Métodos de instancia
  public get capacidad_disponible(): number {
    const capacidadTotal = this.capacidad_total || 0;
    return capacidadTotal - this.capacidad_registrada;
  }

  public get esta_lleno(): boolean {
    const capacidadTotal = this.capacidad_total || 0;
    return this.capacidad_registrada >= capacidadTotal;
  }

  public get porcentaje_ocupacion(): number {
    const capacidadTotal = this.capacidad_total || 0;
    return capacidadTotal > 0 ? Math.round((this.capacidad_registrada / capacidadTotal) * 100) : 0;
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
      allowNull: true, // NULL cuando es_plantilla=true
      validate: {
        len: [2, 50],
      },
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: true, // NULL cuando es_plantilla=true
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true, // NULL cuando es_plantilla=true
    },
    capacidad_total: {
      type: DataTypes.INTEGER,
      allowNull: true, // NULL cuando es_plantilla=true
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
      allowNull: true, // NULL cuando es_plantilla=true
      defaultValue: "Isla de Lobos",
      validate: {
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
      comment: "true = plantilla que referencia PlantillaBloque, false = bloque normal con datos propios"
    },
    plantilla_id: {
      type: DataTypes.UUID,
      allowNull: true, // NULL cuando es_plantilla=false
      references: {
        model: 'plantillas_bloque',
        key: 'id',
      },
      comment: "FK a PlantillaBloque cuando es_plantilla=true"
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
        const horaFin = this.getDataValue("hora_fin");
        const horaInicio = this.getDataValue("hora_inicio");
        if (horaFin && horaInicio && horaFin <= horaInicio) {
          throw new Error(
            "La hora de fin debe ser mayor que la hora de inicio"
          );
        }
      },
      // Validación para asegurar que capacidad_registrada <= capacidad_total
      capacidadValida(this: Bloque) {
        const capacidadTotal = this.getDataValue("capacidad_total");
        if (capacidadTotal && 
          this.getDataValue("capacidad_registrada") > capacidadTotal
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
