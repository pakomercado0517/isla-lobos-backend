import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { TipoEmbarcacion, EstadoEmbarcacion } from "../types";

// Atributos requeridos para crear una embarcación
interface EmbarcacionAttributes {
  id: string;
  nombre: string;
  matricula: string;
  capacidad: number;
  tipo: TipoEmbarcacion;
  estado: EstadoEmbarcacion;
  prestador_id: string;
}

// Atributos opcionales (para actualizaciones)
interface EmbarcacionCreationAttributes
  extends Optional<EmbarcacionAttributes, "id" | "estado"> {}

class Embarcacion
  extends Model<EmbarcacionAttributes, EmbarcacionCreationAttributes>
  implements EmbarcacionAttributes
{
  public id!: string;
  public nombre!: string;
  public matricula!: string;
  public capacidad!: number;
  public tipo!: TipoEmbarcacion;
  public estado!: EstadoEmbarcacion;
  public prestador_id!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Embarcacion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    matricula: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50],
      },
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 150, // Máximo según el contexto del proyecto
      },
    },
    tipo: {
      type: DataTypes.ENUM(...Object.values(TipoEmbarcacion)),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(...Object.values(EstadoEmbarcacion)),
      allowNull: false,
      defaultValue: EstadoEmbarcacion.DISPONIBLE,
    },
    prestador_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Embarcacion",
    tableName: "embarcaciones",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["matricula"],
      },
      {
        fields: ["prestador_id"],
      },
      {
        fields: ["estado"],
      },
    ],
  }
);

export default Embarcacion;
