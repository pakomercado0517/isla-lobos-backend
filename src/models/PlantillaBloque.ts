import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

// Definir atributos de la PlantillaBloque
export interface PlantillaBloqueAttributes {
  id: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  capacidad_total: number;
  destino: string;
  activa: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Definir atributos opcionales para creación
interface PlantillaBloqueCreationAttributes
  extends Optional<PlantillaBloqueAttributes, "id" | "created_at" | "updated_at"> {}

// Definir clase del modelo
class PlantillaBloque
  extends Model<PlantillaBloqueAttributes, PlantillaBloqueCreationAttributes>
  implements PlantillaBloqueAttributes
{
  public id!: string;
  public nombre!: string;
  public hora_inicio!: string;
  public hora_fin!: string;
  public capacidad_total!: number;
  public destino!: string;
  public activa!: boolean;

  // timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// Definir el modelo en Sequelize
PlantillaBloque.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
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
        max: 1000,
      },
    },
    destino: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "plantillas_bloque",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["nombre", "destino"], // Unique constraint: mismo nombre + destino
      },
      {
        fields: ["destino"], // Index para consultas por destino
      },
      {
        fields: ["activa"], // Index para consultas por estado activo
      },
    ],
  }
);

export default PlantillaBloque;